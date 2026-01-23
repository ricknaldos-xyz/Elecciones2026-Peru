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
  source: 'pj_search' | 'jne_declaration'
}

interface CandidateJudicialData {
  candidate_id: string
  dni: string
  full_name: string
  penal_cases: JudicialRecord[]
  civil_cases: JudicialRecord[]
  labor_cases: JudicialRecord[]
}

interface JudicialDiscrepancy {
  candidateId: string
  foundRecords: JudicialRecord[]
  declaredRecords: JudicialRecord[]
  undeclaredCount: number
  severity: 'none' | 'minor' | 'major' | 'critical'
  details: string[]
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
                source: 'pj_search',
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
                source: 'pj_search',
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
 * Searches for judicial cases by name (apellidos)
 * Useful for cross-verification when DNI search fails
 */
async function searchByName(fullName: string): Promise<JudicialRecord[]> {
  return limit(async () => {
    await delay(DELAY_MS)

    const records: JudicialRecord[] = []

    try {
      // Normalize name for search (usually first 2 words are surnames)
      const nameParts = fullName.trim().split(' ')
      const searchName = nameParts.slice(0, 2).join(' ').toUpperCase()

      const apiUrl = new URL(`${PJ_BASE_URL}/cej/busqueda/expedientes`)
      apiUrl.searchParams.set('nombres', searchName)

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
                source: 'pj_search',
              })
            }
          }
        }
      }
    } catch (error) {
      console.error(`[Judicial] Error searching name ${fullName}:`, error)
    }

    return records
  })
}

/**
 * Gets what the candidate declared in JNE
 */
async function getDeclaredSentences(candidateId: string): Promise<{
  penal: JudicialRecord[]
  civil: JudicialRecord[]
}> {
  const result = await sql`
    SELECT
      penal_sentences,
      civil_sentences,
      sentencias_declaracion_jurada
    FROM candidates
    WHERE id = ${candidateId}::uuid
  `

  if (result.length === 0) {
    return { penal: [], civil: [] }
  }

  const candidate = result[0]
  const penal: JudicialRecord[] = []
  const civil: JudicialRecord[] = []

  // Parse penal sentences from JNE declaration
  if (candidate.penal_sentences) {
    const sentences = Array.isArray(candidate.penal_sentences)
      ? candidate.penal_sentences
      : []
    for (const s of sentences) {
      penal.push({
        case_number: s.expediente || s.case_number || '',
        court: s.juzgado || s.court || '',
        matter: 'Penal',
        status: s.estado || s.status || '',
        description: s.delito || s.description || '',
        date: s.fecha || s.date || '',
        source: 'jne_declaration',
      })
    }
  }

  // Parse from sentencias_declaracion_jurada (JNE field)
  if (candidate.sentencias_declaracion_jurada) {
    const declarados = Array.isArray(candidate.sentencias_declaracion_jurada)
      ? candidate.sentencias_declaracion_jurada
      : []
    for (const s of declarados) {
      const tipo = String(s.tipo || s.materia || '').toLowerCase()
      const record: JudicialRecord = {
        case_number: s.expediente || '',
        court: s.juzgado || s.organo || '',
        matter: tipo,
        status: s.situacion_legal || s.estado || '',
        description: s.delito || s.falta || s.descripcion || '',
        date: s.fecha_sentencia || '',
        source: 'jne_declaration',
      }

      if (tipo.includes('penal')) {
        penal.push(record)
      } else {
        civil.push(record)
      }
    }
  }

  // Parse civil sentences
  if (candidate.civil_sentences) {
    const sentences = Array.isArray(candidate.civil_sentences)
      ? candidate.civil_sentences
      : []
    for (const s of sentences) {
      civil.push({
        case_number: s.expediente || s.case_number || '',
        court: s.juzgado || s.court || '',
        matter: 'Civil',
        status: s.estado || s.status || '',
        description: s.descripcion || s.description || '',
        date: s.fecha || s.date || '',
        source: 'jne_declaration',
      })
    }
  }

  return { penal, civil }
}

/**
 * Compares found records with declared records to find discrepancies
 */
function findDiscrepancies(
  candidateId: string,
  foundRecords: JudicialRecord[],
  declaredPenal: JudicialRecord[],
  declaredCivil: JudicialRecord[]
): JudicialDiscrepancy {
  const declaredCaseNumbers = new Set([
    ...declaredPenal.map((r) => normalizeCase(r.case_number)),
    ...declaredCivil.map((r) => normalizeCase(r.case_number)),
  ])

  const undeclaredRecords: JudicialRecord[] = []
  const details: string[] = []

  // Check each found record against declarations
  for (const record of foundRecords) {
    const normalizedCase = normalizeCase(record.case_number)

    // Skip if it matches a declared case
    if (declaredCaseNumbers.has(normalizedCase)) {
      continue
    }

    // Check if it's potentially the same case with different formatting
    let isMatched = false
    for (const declared of [...declaredPenal, ...declaredCivil]) {
      if (casesMatch(record, declared)) {
        isMatched = true
        break
      }
    }

    if (!isMatched) {
      undeclaredRecords.push(record)

      // Check if it's a serious case
      const matter = record.matter.toLowerCase()
      if (matter.includes('penal') || matter.includes('delito')) {
        details.push(`Caso penal no declarado: ${record.case_number} - ${record.description || record.matter}`)
      } else {
        details.push(`Caso civil/laboral no declarado: ${record.case_number}`)
      }
    }
  }

  // Determine severity
  let severity: JudicialDiscrepancy['severity'] = 'none'
  const undeclaredPenal = undeclaredRecords.filter((r) =>
    r.matter.toLowerCase().includes('penal') || r.matter.toLowerCase().includes('delito')
  )

  if (undeclaredPenal.length >= 2) {
    severity = 'critical'
  } else if (undeclaredPenal.length === 1) {
    severity = 'major'
  } else if (undeclaredRecords.length > 0) {
    severity = 'minor'
  }

  return {
    candidateId,
    foundRecords,
    declaredRecords: [...declaredPenal, ...declaredCivil],
    undeclaredCount: undeclaredRecords.length,
    severity,
    details,
  }
}

/**
 * Normalizes case number for comparison
 */
function normalizeCase(caseNumber: string): string {
  return (caseNumber || '')
    .toLowerCase()
    .replace(/[-\s]/g, '')
    .trim()
}

/**
 * Checks if two cases might be the same (fuzzy match)
 */
function casesMatch(a: JudicialRecord, b: JudicialRecord): boolean {
  // Exact case number match
  if (normalizeCase(a.case_number) === normalizeCase(b.case_number) && a.case_number) {
    return true
  }

  // Same court and similar description
  const aDesc = (a.description || '').toLowerCase()
  const bDesc = (b.description || '').toLowerCase()
  const aCourt = (a.court || '').toLowerCase()
  const bCourt = (b.court || '').toLowerCase()

  if (aCourt && bCourt && aCourt.includes(bCourt)) {
    if (aDesc && bDesc && (aDesc.includes(bDesc) || bDesc.includes(aDesc))) {
      return true
    }
  }

  return false
}

/**
 * Saves discrepancy data to database
 */
async function saveDiscrepancy(discrepancy: JudicialDiscrepancy): Promise<void> {
  if (discrepancy.severity === 'none') return

  await sql`
    INSERT INTO judicial_discrepancies (
      candidate_id,
      found_records,
      declared_records,
      undeclared_count,
      severity,
      details,
      checked_at
    ) VALUES (
      ${discrepancy.candidateId}::uuid,
      ${JSON.stringify(discrepancy.foundRecords)}::jsonb,
      ${JSON.stringify(discrepancy.declaredRecords)}::jsonb,
      ${discrepancy.undeclaredCount},
      ${discrepancy.severity},
      ${JSON.stringify(discrepancy.details)}::jsonb,
      NOW()
    )
    ON CONFLICT (candidate_id) DO UPDATE SET
      found_records = EXCLUDED.found_records,
      declared_records = EXCLUDED.declared_records,
      undeclared_count = EXCLUDED.undeclared_count,
      severity = EXCLUDED.severity,
      details = EXCLUDED.details,
      checked_at = NOW()
  `

  // Also update the candidate's discrepancy flags
  await sql`
    UPDATE candidates
    SET
      has_judicial_discrepancy = true,
      judicial_discrepancy_severity = ${discrepancy.severity},
      undeclared_cases_count = ${discrepancy.undeclaredCount}
    WHERE id = ${discrepancy.candidateId}::uuid
  `
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
 * Main sync function for judicial records with cross-verification
 */
export async function syncJudicialRecords(): Promise<{
  records_processed: number
  records_updated: number
  records_created: number
  records_skipped: number
}> {
  const logger = createSyncLogger('poder_judicial')
  await logger.start()

  let discrepanciesFound = 0
  let criticalDiscrepancies = 0

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

      // Search for judicial records by DNI
      let records = await searchByDNI(candidate.dni)

      // If no results by DNI, try by name
      if (records.length === 0) {
        records = await searchByName(candidate.full_name)
      }

      // Get what the candidate declared in JNE
      const declared = await getDeclaredSentences(candidate.id)

      if (records.length > 0) {
        const categorized = categorizeRecords(records)

        await updateCandidateJudicialRecords(
          candidate.id,
          categorized.penal,
          categorized.civil
        )

        // Cross-verify: compare found vs declared
        const discrepancy = findDiscrepancies(
          candidate.id,
          records,
          declared.penal,
          declared.civil
        )

        if (discrepancy.severity !== 'none') {
          await saveDiscrepancy(discrepancy)
          discrepanciesFound++

          if (discrepancy.severity === 'critical') {
            criticalDiscrepancies++
            console.log(
              `[Judicial] ⚠️ CRITICAL DISCREPANCY: ${candidate.full_name} - ${discrepancy.undeclaredCount} undeclared cases`
            )
          } else if (discrepancy.severity === 'major') {
            console.log(
              `[Judicial] ⚠️ MAJOR DISCREPANCY: ${candidate.full_name} - undeclared penal case`
            )
          }
        } else {
          // Clear any previous discrepancy flags if now clean
          await sql`
            UPDATE candidates
            SET
              has_judicial_discrepancy = false,
              judicial_discrepancy_severity = 'none',
              undeclared_cases_count = 0
            WHERE id = ${candidate.id}::uuid
              AND has_judicial_discrepancy = true
          `
        }

        logger.incrementUpdated()
        console.log(
          `[Judicial] Updated ${candidate.full_name}: ${categorized.penal.length} penal, ${categorized.civil.length} civil`
        )
      } else {
        // No records found - still need to check if candidate declared something
        // that we couldn't verify (potential false declaration)
        if (declared.penal.length > 0 || declared.civil.length > 0) {
          console.log(
            `[Judicial] ${candidate.full_name} declared ${declared.penal.length + declared.civil.length} cases but none found in PJ (could be older cases)`
          )
        }

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

    logger.setMetadata('discrepancies_found', discrepanciesFound)
    logger.setMetadata('critical_discrepancies', criticalDiscrepancies)

    return await logger.complete()
  } catch (error) {
    await logger.fail(error as Error)
    throw error
  }
}

/**
 * Gets judicial discrepancy summary for a candidate
 */
export async function getCandidateJudicialDiscrepancy(candidateId: string): Promise<{
  hasDiscrepancy: boolean
  severity: 'none' | 'minor' | 'major' | 'critical'
  undeclaredCount: number
  details: string[]
  integrityPenalty: number
} | null> {
  const result = await sql`
    SELECT
      undeclared_count,
      severity,
      details
    FROM judicial_discrepancies
    WHERE candidate_id = ${candidateId}::uuid
    ORDER BY checked_at DESC
    LIMIT 1
  `

  if (result.length === 0) {
    return null
  }

  const row = result[0]
  const severity = row.severity as 'none' | 'minor' | 'major' | 'critical'

  // Calculate penalty based on severity
  let penalty = 0
  switch (severity) {
    case 'critical':
      penalty = 60
      break
    case 'major':
      penalty = 40
      break
    case 'minor':
      penalty = 20
      break
  }

  // Additional penalty per undeclared case
  penalty += Math.min((row.undeclared_count as number) * 10, 25)

  return {
    hasDiscrepancy: severity !== 'none',
    severity,
    undeclaredCount: row.undeclared_count as number,
    details: (row.details as string[]) || [],
    integrityPenalty: Math.min(penalty, 85),
  }
}

export { searchByDNI, searchByName, categorizeRecords }
