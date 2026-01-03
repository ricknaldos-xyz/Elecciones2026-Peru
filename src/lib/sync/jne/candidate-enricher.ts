/**
 * Candidate Enricher
 *
 * Fetches additional data (photos, JNE IDs, DJHV URLs) from JNE platform
 * and updates the database.
 */

import * as fs from 'fs'
import * as path from 'path'
import { sql } from '@/lib/db'
import { createSyncLogger } from '../logger'

const JNE_BASE_URL = 'https://plataformaelectoral.jne.gob.pe'
const DELAY_MS = 2000

interface CandidateToEnrich {
  id: string
  slug: string
  full_name: string
  cargo: string
  party_name?: string
}

interface EnrichmentResult {
  candidateId: string
  slug: string
  photoUrl?: string
  jneId?: string
  djhvUrl?: string
  success: boolean
  error?: string
}

/**
 * Delay helper
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Normalize name for search/comparison
 */
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Get candidates that need enrichment
 */
async function getCandidatesToEnrich(): Promise<CandidateToEnrich[]> {
  const result = await sql`
    SELECT
      c.id,
      c.slug,
      c.full_name,
      c.cargo,
      p.name as party_name
    FROM candidates c
    LEFT JOIN parties p ON c.party_id = p.id
    WHERE c.is_active = TRUE
    AND c.cargo IN ('presidente', 'vicepresidente')
    AND (c.photo_url IS NULL OR c.jne_id IS NULL)
    ORDER BY c.cargo, c.full_name
  `
  return result as CandidateToEnrich[]
}

/**
 * Search for candidate on JNE platform
 */
async function searchCandidateOnJNE(
  fullName: string,
  cargo: string
): Promise<{ jneId: string; photoUrl: string; djhvUrl: string } | null> {
  try {
    // Try the search endpoint
    const searchUrl = new URL(`${JNE_BASE_URL}/Candidato/GetCandidatos`)
    searchUrl.searchParams.set('idProceso', '2026')

    // Map cargo to JNE cargo ID
    const cargoId = cargo === 'presidente' ? '1' : cargo === 'vicepresidente' ? '2' : '3'
    searchUrl.searchParams.set('idCargo', cargoId)

    const response = await fetch(searchUrl.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RankingElectoral/1.0)',
        'Accept': 'application/json, text/html',
      },
    })

    if (!response.ok) {
      console.log(`[JNE] Search returned ${response.status}`)
      return null
    }

    const contentType = response.headers.get('content-type') || ''

    if (contentType.includes('application/json')) {
      const data = await response.json()

      if (Array.isArray(data)) {
        // Find matching candidate
        const normalizedSearch = normalizeName(fullName)

        for (const candidate of data) {
          const candidateName = candidate.nombreCompleto ||
                              `${candidate.apellidoPaterno || ''} ${candidate.apellidoMaterno || ''} ${candidate.nombres || ''}`.trim()

          if (normalizeName(candidateName) === normalizedSearch) {
            const jneId = String(candidate.idCandidato || candidate.id || '')
            const orgId = String(candidate.idOrganizacionPolitica || candidate.orgId || '')

            return {
              jneId,
              photoUrl: `${JNE_BASE_URL}/Foto/Foto/${orgId}/${jneId}`,
              djhvUrl: `${JNE_BASE_URL}/Candidato/HojaVidaCandidato/${jneId}`,
            }
          }
        }
      }
    }

    return null
  } catch (error) {
    console.error(`[JNE] Error searching for ${fullName}:`, error)
    return null
  }
}

/**
 * Download photo and save to public folder
 */
async function downloadAndSavePhoto(
  photoUrl: string,
  slug: string
): Promise<string | null> {
  try {
    console.log(`[Photo] Downloading: ${photoUrl}`)

    const response = await fetch(photoUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RankingElectoral/1.0)',
        'Accept': 'image/*',
      },
    })

    if (!response.ok) {
      console.log(`[Photo] Failed to download: ${response.status}`)
      return null
    }

    const contentType = response.headers.get('content-type') || ''
    if (!contentType.includes('image')) {
      console.log(`[Photo] Not an image: ${contentType}`)
      return null
    }

    const buffer = await response.arrayBuffer()

    // Determine file extension
    let ext = 'jpg'
    if (contentType.includes('png')) ext = 'png'
    if (contentType.includes('webp')) ext = 'webp'

    const filename = `${slug}.${ext}`
    const publicDir = path.join(process.cwd(), 'public', 'candidates')
    const filePath = path.join(publicDir, filename)

    // Ensure directory exists
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true })
    }

    // Save file
    fs.writeFileSync(filePath, Buffer.from(buffer))
    console.log(`[Photo] Saved: ${filePath}`)

    return `/candidates/${filename}`
  } catch (error) {
    console.error(`[Photo] Error downloading:`, error)
    return null
  }
}

/**
 * Update candidate in database
 */
async function updateCandidate(
  candidateId: string,
  data: { photoUrl?: string; jneId?: string; djhvUrl?: string }
): Promise<void> {
  if (data.photoUrl) {
    await sql`UPDATE candidates SET photo_url = ${data.photoUrl} WHERE id = ${candidateId}::uuid`
  }
  if (data.jneId) {
    await sql`UPDATE candidates SET jne_id = ${data.jneId} WHERE id = ${candidateId}::uuid`
  }
  if (data.djhvUrl) {
    await sql`UPDATE candidates SET djhv_url = ${data.djhvUrl} WHERE id = ${candidateId}::uuid`
  }
}

/**
 * Enrich a single candidate
 */
async function enrichCandidate(
  candidate: CandidateToEnrich
): Promise<EnrichmentResult> {
  console.log(`\n[Enrich] Processing: ${candidate.full_name}`)

  const result: EnrichmentResult = {
    candidateId: candidate.id,
    slug: candidate.slug,
    success: false,
  }

  try {
    // Search on JNE
    const jneData = await searchCandidateOnJNE(candidate.full_name, candidate.cargo)

    if (jneData) {
      result.jneId = jneData.jneId
      result.djhvUrl = jneData.djhvUrl

      // Download and save photo
      const localPhotoUrl = await downloadAndSavePhoto(jneData.photoUrl, candidate.slug)
      if (localPhotoUrl) {
        result.photoUrl = localPhotoUrl
      }

      // Update database
      await updateCandidate(candidate.id, {
        photoUrl: result.photoUrl,
        jneId: result.jneId,
        djhvUrl: result.djhvUrl,
      })

      result.success = true
      console.log(`[Enrich] Success: ${candidate.full_name}`)
    } else {
      result.error = 'Not found on JNE'
      console.log(`[Enrich] Not found: ${candidate.full_name}`)
    }
  } catch (error) {
    result.error = error instanceof Error ? error.message : 'Unknown error'
    console.error(`[Enrich] Error: ${candidate.full_name}:`, error)
  }

  return result
}

/**
 * Main enrichment function
 */
export async function enrichCandidates(): Promise<{
  processed: number
  enriched: number
  failed: number
  results: EnrichmentResult[]
}> {
  const logger = createSyncLogger('jne')
  await logger.start()
  await logger.markRunning()

  const stats = {
    processed: 0,
    enriched: 0,
    failed: 0,
    results: [] as EnrichmentResult[],
  }

  try {
    const candidates = await getCandidatesToEnrich()
    console.log(`[Enrich] Found ${candidates.length} candidates to enrich`)
    logger.setMetadata('candidates_to_enrich', candidates.length)

    for (const candidate of candidates) {
      stats.processed++
      logger.incrementProcessed()

      const result = await enrichCandidate(candidate)
      stats.results.push(result)

      if (result.success) {
        stats.enriched++
        logger.incrementUpdated()
      } else {
        stats.failed++
        logger.incrementSkipped()
      }

      // Rate limiting
      await delay(DELAY_MS)
    }

    await logger.complete()
  } catch (error) {
    await logger.fail(error instanceof Error ? error : new Error(String(error)))
    throw error
  }

  return stats
}

/**
 * Enrich candidates with fallback photo sources
 */
export async function enrichWithFallbackPhotos(): Promise<{
  processed: number
  enriched: number
}> {
  // Hardcoded photo URLs for well-known candidates
  // These are public domain or official campaign photos from Wikipedia
  const knownPhotos: Record<string, string> = {
    'keiko-fujimori-higuchi': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Keiko_Fujimori_en_2023.jpg/220px-Keiko_Fujimori_en_2023.jpg',
    'rafael-lopez-aliaga': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/Rafael_L%C3%B3pez_Aliaga_Presidente_%28cropped%29.jpg/220px-Rafael_L%C3%B3pez_Aliaga_Presidente_%28cropped%29.jpg',
    'cesar-acuna-peralta': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/C%C3%A9sar_Acu%C3%B1a_Peralta.jpg/220px-C%C3%A9sar_Acu%C3%B1a_Peralta.jpg',
    'george-forsyth-sommer': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/George_Forsyth_2021_%28cropped%29.jpg/220px-George_Forsyth_2021_%28cropped%29.jpg',
    'julio-guzman-caceres': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/Julio_Guzm%C3%A1n_en_2016.jpg/220px-Julio_Guzm%C3%A1n_en_2016.jpg',
    'fernando-olivera-vega': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Fernando_Olivera.jpg/220px-Fernando_Olivera.jpg',
    'yonhy-lescano-ancieta': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Yonhy_Lescano.jpg/220px-Yonhy_Lescano.jpg',
    'jose-luna-galvez': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Jose_Luna_G%C3%A1lvez.jpg/220px-Jose_Luna_G%C3%A1lvez.jpg',
    'roberto-chiabra-leon': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/Roberto_Chiabra.jpg/220px-Roberto_Chiabra.jpg',
    'vladimir-cerron-rojas': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Vladimir_Cerr%C3%B3n_%28cropped%29.jpg/220px-Vladimir_Cerr%C3%B3n_%28cropped%29.jpg',
    'mesias-guevara-amasifuen': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Mes%C3%ADas_Guevara_en_2021.jpg/220px-Mes%C3%ADas_Guevara_en_2021.jpg',
    'jorge-nieto-montesinos': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Jorge_Nieto_Montesinos_%28cropped%29.jpg/220px-Jorge_Nieto_Montesinos_%28cropped%29.jpg',
    'jose-williams-zapata': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/Jos%C3%A9_Williams_Zapata.jpg/220px-Jos%C3%A9_Williams_Zapata.jpg',
    'ricardo-belmont-cassinelli': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Ricardo_Belmont.jpg/220px-Ricardo_Belmont.jpg',
    'francisco-diez-canseco-terry': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/Franciscodiezcansecoterry.jpg/220px-Franciscodiezcansecoterry.jpg',
    'alvaro-paz-de-la-barra-freigeiro': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/%C3%81lvaro_Paz_de_la_Barra.jpg/220px-%C3%81lvaro_Paz_de_la_Barra.jpg',
  }

  let processed = 0
  let enriched = 0

  // Get candidates without photos
  const candidates = await sql`
    SELECT id, slug, full_name
    FROM candidates
    WHERE is_active = TRUE
    AND photo_url IS NULL
    AND cargo IN ('presidente', 'vicepresidente')
  `

  for (const candidate of candidates) {
    processed++
    const photoUrl = knownPhotos[candidate.slug as string]

    if (photoUrl) {
      // Download and save
      const localUrl = await downloadAndSavePhoto(photoUrl, candidate.slug as string)

      if (localUrl) {
        await sql`UPDATE candidates SET photo_url = ${localUrl} WHERE id = ${candidate.id}::uuid`
        enriched++
        console.log(`[Fallback] Saved photo for: ${candidate.full_name}`)
      }
    }

    await delay(1000)
  }

  return { processed, enriched }
}
