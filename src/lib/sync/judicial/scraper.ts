import * as cheerio from 'cheerio'
import pLimit from 'p-limit'
import { createSyncLogger } from '../logger'
import { sql } from '@/lib/db'

const PJ_BASE_URL = 'https://cej.pj.gob.pe'

// Rate limiter: 1 request every 5 seconds (more conservative)
const limit = pLimit(1)
const DELAY_MS = 5000

interface JudicialRecord {
  case_number: string
  court: string
  matter: string // 'Penal', 'Civil', 'Laboral', etc.
  status: string // 'En trámite', 'Concluido', etc.
  description?: string
  date?: string
  resolution?: string
}

interface CandidateJudicialData {
  candidate_id: string
  dni: string
  full_name: string
  penal_cases: JudicialRecord[]
  civil_cases: JudicialRecord[]
  labor_cases: JudicialRecord[]
}

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries: number = 3
): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          Accept: 'text/html,application/xhtml+xml,application/json',
          'Accept-Language': 'es-PE,es;q=0.9',
          ...options.headers,
        },
      })

      return response
    } catch (error) {
      console.error(`[Judicial] Fetch attempt ${i + 1} failed:`, error)
      if (i === retries - 1) throw error
      await delay(DELAY_MS * (i + 1))
    }
  }
  throw new Error('All retries failed')
}

/**
 * Searches for judicial cases by DNI
 * Note: This is a simplified implementation. Real scraping may require
 * handling CAPTCHAs, session cookies, and form tokens.
 */
async function searchByDNI(dni: string): Promise<JudicialRecord[]> {
  return limit(async () => {
    await delay(DELAY_MS)

    const records: JudicialRecord[] = []

    try {
      // First, get the search page to obtain any tokens
      const searchPageResponse = await fetchWithRetry(
        `${PJ_BASE_URL}/cej/forms/busquedaform.html`
      )

      if (!searchPageResponse.ok) {
        console.log(`[Judicial] Search page not accessible`)
        return records
      }

      // Try the API endpoint
      const apiUrl = new URL(`${PJ_BASE_URL}/cej/busqueda/expedientes`)
      apiUrl.searchParams.set('dni', dni)

      const apiResponse = await fetchWithRetry(apiUrl.toString(), {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      })

      if (apiResponse.ok) {
        const contentType = apiResponse.headers.get('content-type')

        if (contentType?.includes('application/json')) {
          const data = await apiResponse.json()

          if (Array.isArray(data)) {
            for (const item of data) {
              records.push({
                case_number: String(item.numeroExpediente || item.expediente || ''),
                court: String(item.juzgado || item.organo || ''),
                matter: String(item.materia || ''),
                status: String(item.estado || ''),
                description: String(item.sumilla || item.descripcion || ''),
                date: String(item.fecha || ''),
              })
            }
          }
        } else {
          // Parse HTML response
          const html = await apiResponse.text()
          const $ = cheerio.load(html)

          // Parse table rows
          $('table tbody tr, .expediente-item').each((_, el) => {
            const $el = $(el)

            const caseNumber =
              $el.find('.numero-expediente, td:nth-child(1)').text().trim()
            const court = $el.find('.juzgado, td:nth-child(2)').text().trim()
            const matter = $el.find('.materia, td:nth-child(3)').text().trim()
            const status = $el.find('.estado, td:nth-child(4)').text().trim()
            const description = $el.find('.sumilla, td:nth-child(5)').text().trim()

            if (caseNumber) {
              records.push({
                case_number: caseNumber,
                court,
                matter,
                status,
                description,
              })
            }
          })
        }
      }
    } catch (error) {
      console.error(`[Judicial] Error searching DNI ${dni}:`, error)
    }

    return records
  })
}

/**
 * Categorizes judicial records by type
 */
function categorizeRecords(records: JudicialRecord[]): {
  penal: JudicialRecord[]
  civil: JudicialRecord[]
  labor: JudicialRecord[]
} {
  const categorized = {
    penal: [] as JudicialRecord[],
    civil: [] as JudicialRecord[],
    labor: [] as JudicialRecord[],
  }

  for (const record of records) {
    const matter = record.matter.toLowerCase()

    if (
      matter.includes('penal') ||
      matter.includes('criminal') ||
      matter.includes('delito')
    ) {
      categorized.penal.push(record)
    } else if (
      matter.includes('laboral') ||
      matter.includes('trabajo') ||
      matter.includes('alimentos') // Often in labor courts
    ) {
      categorized.labor.push(record)
    } else {
      categorized.civil.push(record)
    }
  }

  return categorized
}

/**
 * Gets candidates that need judicial record updates
 */
async function getCandidatesForUpdate(): Promise<
  Array<{ id: string; dni: string; full_name: string }>
> {
  // Get candidates with DNI that haven't been checked recently
  // or have never been checked
  const result = await sql`
    SELECT
      c.id,
      c.dni,
      c.full_name
    FROM candidates c
    LEFT JOIN data_hashes dh ON
      dh.entity_type = 'candidate'
      AND dh.entity_id = c.id
      AND dh.source = 'poder_judicial'
    WHERE
      c.dni IS NOT NULL
      AND c.dni != ''
      AND (
        dh.id IS NULL
        OR dh.last_checked_at < NOW() - INTERVAL '7 days'
      )
    ORDER BY dh.last_checked_at ASC NULLS FIRST
    LIMIT 100
  `

  return result as Array<{ id: string; dni: string; full_name: string }>
}

/**
 * Updates judicial records for a candidate
 */
async function updateCandidateJudicialRecords(
  candidateId: string,
  penalCases: JudicialRecord[],
  civilCases: JudicialRecord[]
): Promise<void> {
  // Convert to the format expected by the database
  const penalSentences = penalCases.map((c) => ({
    case_number: c.case_number,
    court: c.court,
    description: c.description || c.matter,
    date: c.date,
    status: c.status,
  }))

  const civilSentences = civilCases.map((c) => ({
    case_number: c.case_number,
    court: c.court,
    description: c.description || c.matter,
    date: c.date,
    status: c.status,
  }))

  await sql`
    UPDATE candidates
    SET
      penal_sentences = ${JSON.stringify(penalSentences)}::jsonb,
      civil_sentences = ${JSON.stringify(civilSentences)}::jsonb,
      last_updated = NOW()
    WHERE id = ${candidateId}::uuid
  `

  // Update the data hash timestamp
  await sql`
    INSERT INTO data_hashes (entity_type, entity_id, source, data_hash, last_checked_at)
    VALUES ('candidate', ${candidateId}::uuid, 'poder_judicial', 'checked', NOW())
    ON CONFLICT (entity_type, entity_id, source)
    DO UPDATE SET last_checked_at = NOW()
  `
}

/**
 * Main sync function for judicial records
 */
export async function syncJudicialRecords(): Promise<{
  records_processed: number
  records_updated: number
  records_created: number
  records_skipped: number
}> {
  const logger = createSyncLogger('poder_judicial')
  await logger.start()

  try {
    await logger.markRunning()

    // Get candidates to check
    const candidates = await getCandidatesForUpdate()
    console.log(`[Judicial] Found ${candidates.length} candidates to check`)

    logger.setMetadata('candidates_to_check', candidates.length)

    for (const candidate of candidates) {
      logger.incrementProcessed()

      // Skip if no valid DNI
      if (!candidate.dni || candidate.dni.length !== 8) {
        logger.incrementSkipped()
        continue
      }

      console.log(`[Judicial] Checking: ${candidate.full_name} (${candidate.dni})`)

      // Search for judicial records
      const records = await searchByDNI(candidate.dni)

      if (records.length > 0) {
        const categorized = categorizeRecords(records)

        await updateCandidateJudicialRecords(
          candidate.id,
          categorized.penal,
          categorized.civil
        )

        logger.incrementUpdated()
        console.log(
          `[Judicial] Updated ${candidate.full_name}: ${categorized.penal.length} penal, ${categorized.civil.length} civil`
        )
      } else {
        // Mark as checked even if no records found
        await sql`
          INSERT INTO data_hashes (entity_type, entity_id, source, data_hash, last_checked_at)
          VALUES ('candidate', ${candidate.id}::uuid, 'poder_judicial', 'no_records', NOW())
          ON CONFLICT (entity_type, entity_id, source)
          DO UPDATE SET last_checked_at = NOW()
        `
        logger.incrementSkipped()
      }
    }

    return await logger.complete()
  } catch (error) {
    await logger.fail(error as Error)
    throw error
  }
}

export { searchByDNI, categorizeRecords }
