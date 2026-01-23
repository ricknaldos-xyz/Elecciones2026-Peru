import * as cheerio from 'cheerio'
import pLimit from 'p-limit'
import { createSyncLogger } from '../logger'
import {
  parseJNECandidate,
  JNECandidateData,
  parsePenalSentencesFromHTML,
  parseCivilSentencesFromHTML,
  parsePartyResignationsFromHTML
} from './parser'
import { reconcileJNECandidates } from './reconciler'

const JNE_BASE_URL = 'https://plataformaelectoral.jne.gob.pe'

// Rate limiter: 1 request every 2 seconds
const limit = pLimit(1)
const DELAY_MS = 2000

interface JNESearchParams {
  proceso?: string // Electoral process ID
  cargo?: string // Position type
  region?: string // Region/Department
}

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchWithRetry(
  url: string,
  retries: number = 3
): Promise<string> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (compatible; RankingElectoral/1.0; +https://rankingelectoral.pe)',
          Accept: 'text/html,application/xhtml+xml',
          'Accept-Language': 'es-PE,es;q=0.9',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.text()
    } catch (error) {
      console.error(`Fetch attempt ${i + 1} failed:`, error)
      if (i === retries - 1) throw error
      await delay(DELAY_MS * (i + 1)) // Exponential backoff
    }
  }
  throw new Error('All retries failed')
}

/**
 * Fetches the list of candidates from JNE platform
 */
async function fetchCandidateList(
  params: JNESearchParams
): Promise<JNECandidateData[]> {
  const candidates: JNECandidateData[] = []

  // Build search URL
  const searchUrl = new URL(`${JNE_BASE_URL}/Candidato/GetCandidatos`)
  if (params.proceso) searchUrl.searchParams.set('idProceso', params.proceso)
  if (params.cargo) searchUrl.searchParams.set('idCargo', params.cargo)
  if (params.region) searchUrl.searchParams.set('idRegion', params.region)

  console.log(`[JNE] Fetching candidates from: ${searchUrl.toString()}`)

  try {
    const html = await fetchWithRetry(searchUrl.toString())
    const $ = cheerio.load(html)

    // Parse candidate cards from HTML
    $('.candidato-card, .candidate-item, [data-candidato]').each(
      (_, element) => {
        const candidateData = parseJNECandidate($, $(element))
        if (candidateData) {
          candidates.push(candidateData)
        }
      }
    )

    // Also try JSON endpoint if available
    const jsonUrl = new URL(`${JNE_BASE_URL}/api/candidatos`)
    if (params.proceso) jsonUrl.searchParams.set('proceso', params.proceso)

    try {
      const jsonResponse = await fetch(jsonUrl.toString(), {
        headers: {
          Accept: 'application/json',
          'User-Agent':
            'Mozilla/5.0 (compatible; RankingElectoral/1.0; +https://rankingelectoral.pe)',
        },
      })

      if (jsonResponse.ok) {
        const jsonData = await jsonResponse.json()
        if (Array.isArray(jsonData)) {
          for (const item of jsonData) {
            const parsed = parseJNECandidate(null, item)
            if (
              parsed &&
              !candidates.find((c) => c.dni === parsed.dni)
            ) {
              candidates.push(parsed)
            }
          }
        }
      }
    } catch {
      // JSON endpoint might not exist, that's ok
    }
  } catch (error) {
    console.error('[JNE] Error fetching candidate list:', error)
    throw error
  }

  return candidates
}

/**
 * Fetches detailed information for a single candidate
 */
async function fetchCandidateDetail(
  candidateId: string
): Promise<JNECandidateData | null> {
  return limit(async () => {
    await delay(DELAY_MS)

    const detailUrl = `${JNE_BASE_URL}/Candidato/HojaVidaCandidato/${candidateId}`
    console.log(`[JNE] Fetching detail for candidate: ${candidateId}`)

    try {
      const html = await fetchWithRetry(detailUrl)
      const $ = cheerio.load(html)

      // Parse the full candidate profile
      const candidate = parseJNECandidate($, $('body'))

      if (candidate) {
        // Parse additional sections

        // Education
        const education: JNECandidateData['education'] = []
        $('#educacion .education-item, .formacion-academica tr').each(
          (_, el) => {
            const $el = $(el)
            education.push({
              level:
                $el.find('.nivel, td:nth-child(1)').text().trim() || 'unknown',
              institution: $el.find('.institucion, td:nth-child(2)').text().trim(),
              degree: $el.find('.grado, td:nth-child(3)').text().trim(),
              year: parseInt(
                $el.find('.año, td:nth-child(4)').text().trim()
              ) || undefined,
            })
          }
        )
        candidate.education = education

        // Work experience
        const experience: JNECandidateData['experience'] = []
        $('#experiencia .work-item, .experiencia-laboral tr').each((_, el) => {
          const $el = $(el)
          experience.push({
            organization: $el.find('.empresa, td:nth-child(1)').text().trim(),
            position: $el.find('.cargo, td:nth-child(2)').text().trim(),
            start_year:
              parseInt($el.find('.inicio, td:nth-child(3)').text().trim()) ||
              undefined,
            end_year:
              parseInt($el.find('.fin, td:nth-child(4)').text().trim()) ||
              undefined,
          })
        })
        candidate.experience = experience

        // Political trajectory
        const political: JNECandidateData['political_trajectory'] = []
        $('#trayectoria .political-item, .trayectoria-politica tr').each(
          (_, el) => {
            const $el = $(el)
            political.push({
              party: $el.find('.partido, td:nth-child(1)').text().trim(),
              position: $el.find('.cargo, td:nth-child(2)').text().trim(),
              start_year:
                parseInt($el.find('.inicio, td:nth-child(3)').text().trim()) ||
                undefined,
              end_year:
                parseInt($el.find('.fin, td:nth-child(4)').text().trim()) ||
                undefined,
            })
          }
        )
        candidate.political_trajectory = political

        // Assets
        const assets = {
          properties: 0,
          vehicles: 0,
          savings: 0,
          total: 0,
        }
        const assetsText = $('#patrimonio, .bienes-rentas').text()
        const totalMatch = assetsText.match(/total[:\s]*S\/?\s*([\d,]+)/i)
        if (totalMatch) {
          assets.total = parseFloat(totalMatch[1].replace(/,/g, ''))
        }
        candidate.assets = assets

        // Declared sentences (from JNE form) - Legacy simple format
        const sentences: JNECandidateData['declared_sentences'] = []
        $('#sentencias .sentence-item, .sentencias tr').each((_, el) => {
          const $el = $(el)
          sentences.push({
            type:
              $el.find('.tipo, td:nth-child(1)').text().toLowerCase() === 'penal'
                ? 'penal'
                : 'civil',
            description: $el.find('.descripcion, td:nth-child(2)').text().trim(),
            date: $el.find('.fecha, td:nth-child(3)').text().trim(),
          })
        })
        candidate.declared_sentences = sentences

        // Enhanced sentence parsing - detailed penal sentences (Section V)
        const penalSentencesDetail = parsePenalSentencesFromHTML($)
        if (penalSentencesDetail.length > 0) {
          candidate.penal_sentences_detail = penalSentencesDetail
          candidate.has_declared_sentences = true
        }

        // Enhanced sentence parsing - detailed civil sentences (Section VI)
        const civilSentencesDetail = parseCivilSentencesFromHTML($)
        if (civilSentencesDetail.length > 0) {
          candidate.civil_sentences_detail = civilSentencesDetail
          candidate.has_declared_sentences = true
        }

        // Party resignations (Section VII)
        const partyResignations = parsePartyResignationsFromHTML($)
        if (partyResignations.length > 0) {
          candidate.party_resignations_detail = partyResignations
        }

        // Check if candidate has declared any sentences (even if empty declaration)
        const sentencesSection = $('#sentencias, .sentencias-penales, .sentencias-civiles, [data-section="penal"], [data-section="civil"]')
        if (sentencesSection.length > 0) {
          candidate.has_declared_sentences = candidate.has_declared_sentences || false
        }

        // Check if assets were declared
        const assetsSection = $('#patrimonio, .bienes-rentas, .declaracion-bienes')
        if (assetsSection.length > 0 && assetsSection.text().trim().length > 10) {
          candidate.has_declared_assets = true
        }
      }

      return candidate
    } catch (error) {
      console.error(`[JNE] Error fetching candidate detail ${candidateId}:`, error)
      return null
    }
  })
}

/**
 * Main sync function - fetches all candidates and updates database
 */
export async function syncJNECandidates(): Promise<{
  records_processed: number
  records_updated: number
  records_created: number
  records_skipped: number
}> {
  const logger = createSyncLogger('jne')
  await logger.start()

  try {
    await logger.markRunning()

    // Fetch candidates for all cargo types
    const cargoTypes = [
      { id: '1', name: 'Presidente' },
      { id: '2', name: 'Congresista' },
      { id: '3', name: 'Parlamento Andino' },
    ]

    const allCandidates: JNECandidateData[] = []

    for (const cargo of cargoTypes) {
      console.log(`[JNE] Fetching ${cargo.name} candidates...`)

      const candidates = await fetchCandidateList({
        proceso: '2026', // Current electoral process
        cargo: cargo.id,
      })

      console.log(`[JNE] Found ${candidates.length} ${cargo.name} candidates`)
      allCandidates.push(...candidates)

      // Rate limit between cargo types
      await delay(DELAY_MS)
    }

    logger.setMetadata('total_fetched', allCandidates.length)

    // Fetch details for each candidate
    console.log(`[JNE] Fetching details for ${allCandidates.length} candidates...`)

    for (const candidate of allCandidates) {
      logger.incrementProcessed()

      if (candidate.jne_id) {
        const details = await fetchCandidateDetail(candidate.jne_id)
        if (details) {
          Object.assign(candidate, details)
        }
      }
    }

    // Reconcile with database
    console.log('[JNE] Reconciling with database...')
    const result = await reconcileJNECandidates(allCandidates)

    // Update logger stats
    for (let i = 0; i < result.updated; i++) logger.incrementUpdated()
    for (let i = 0; i < result.created; i++) logger.incrementCreated()
    for (let i = 0; i < result.skipped; i++) logger.incrementSkipped()

    return await logger.complete()
  } catch (error) {
    await logger.fail(error as Error)
    throw error
  }
}

export { fetchCandidateList, fetchCandidateDetail }
