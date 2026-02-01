/**
 * Import REINFO Flags Script
 *
 * Fetches REINFO (informal mining registry) data from Territorio Tomado's API
 * and cross-references with candidates in our database by name matching.
 * Creates flags of type REINFO for matched candidates.
 *
 * Source: https://www.territoriotomado.pe/mapa-de-candidatos-al-reinfo-2026
 * API: Territorio Tomado Strapi CMS
 *
 * Usage:
 *   DATABASE_URL='...' npx tsx scripts/import-reinfo-flags.ts
 *   DATABASE_URL='...' npx tsx scripts/import-reinfo-flags.ts --dry-run
 */

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)
const DRY_RUN = process.argv.includes('--dry-run')

// Territorio Tomado Strapi API
const TT_API_BASE = 'https://territorio-tomado-admin.up.railway.app/api'

interface TTReinfoRecord {
  id: number
  nombre_completo: string
  estado_reinfo: 'Vigente' | 'Excluido' | 'Suspendido'
  cargo_eleccion: string
  departamento: string
  derecho_minero: string
  partido_politico: {
    nombre: string
  } | null
}

interface DBCandidate {
  id: string
  full_name: string
  cargo: string
  slug: string
}

// Map REINFO status to flag severity
function getSeverity(estado: string): 'RED' | 'AMBER' {
  switch (estado) {
    case 'Vigente':
      return 'RED' // Active REINFO = highest concern
    case 'Suspendido':
      return 'RED' // Suspended but still linked
    case 'Excluido':
      return 'AMBER' // Excluded from REINFO, but was registered
    default:
      return 'AMBER'
  }
}

// Normalize name for matching: uppercase, no accents, no extra spaces
function normalizeName(name: string): string {
  return name
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

// Map Territorio Tomado cargo names to our DB cargo values
function normalizeCargo(cargo: string): string | null {
  const c = cargo.toLowerCase().trim()
  if (c.includes('senador')) return 'senador'
  if (c.includes('diputado')) return 'diputado'
  if (c.includes('parlamento')) return 'parlamento_andino'
  if (c.includes('presidente')) return 'presidente'
  return null
}

async function fetchReinfoData(): Promise<TTReinfoRecord[]> {
  // Try to fetch from API first, fall back to local cache
  try {
    console.log('Fetching REINFO data from Territorio Tomado API...')
    // Strapi pagination: fetch all pages
    const allRecords: TTReinfoRecord[] = []
    let page = 1
    const pageSize = 100

    while (true) {
      const url = `${TT_API_BASE}/candidatos-con-reinfos?populate=partido_politico&pagination[page]=${page}&pagination[pageSize]=${pageSize}`
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`)
      }

      const json = await response.json()
      const records = json.data || []
      allRecords.push(...records)

      const pagination = json.meta?.pagination
      if (!pagination || page >= pagination.pageCount) break
      page++
    }

    console.log(`  Fetched ${allRecords.length} records from API`)
    return allRecords
  } catch (error) {
    console.log(`  API fetch failed: ${error}`)
    console.log('  Trying local cache at /tmp/tt-candidatos-con-reinfos.json...')

    const fs = await import('fs')
    const localPath = '/tmp/tt-candidatos-con-reinfos.json'
    if (fs.existsSync(localPath)) {
      const raw = JSON.parse(fs.readFileSync(localPath, 'utf-8'))
      const records = raw.data || raw
      console.log(`  Loaded ${records.length} records from local cache`)
      return records
    }
    throw new Error('No REINFO data available (API failed and no local cache)')
  }
}

async function fetchDBCandidates(): Promise<DBCandidate[]> {
  console.log('Fetching candidates from database...')
  const rows = await sql`
    SELECT id, full_name, cargo, slug
    FROM candidates
    WHERE is_active = true
  `
  console.log(`  Found ${rows.length} active candidates`)
  return rows as unknown as DBCandidate[]
}

// Group REINFO records by candidate name (one candidate can have multiple mining rights)
function groupByCandidate(records: TTReinfoRecord[]): Map<string, TTReinfoRecord[]> {
  const map = new Map<string, TTReinfoRecord[]>()
  for (const record of records) {
    const key = normalizeName(record.nombre_completo)
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(record)
  }
  return map
}

async function main() {
  console.log('=== REINFO Flag Import ===')
  if (DRY_RUN) console.log('>>> DRY RUN MODE - no changes will be made <<<\n')

  // Step 1: Fetch data
  const reinfoRecords = await fetchReinfoData()
  const dbCandidates = await fetchDBCandidates()

  // Step 2: Group REINFO records by candidate
  const reinfoByName = groupByCandidate(reinfoRecords)
  console.log(`\n${reinfoByName.size} unique REINFO candidates to match`)

  // Build lookup for DB candidates by normalized name + cargo
  const dbByNameCargo = new Map<string, DBCandidate>()
  const dbByName = new Map<string, DBCandidate[]>()
  for (const c of dbCandidates) {
    const key = normalizeName(c.full_name)
    dbByNameCargo.set(`${key}|${c.cargo}`, c)
    if (!dbByName.has(key)) dbByName.set(key, [])
    dbByName.get(key)!.push(c)
  }

  // Step 3: Cross-reference
  let matched = 0
  let unmatched = 0
  let flagsCreated = 0
  let skippedExisting = 0
  const unmatchedNames: string[] = []

  // Get existing REINFO flags to avoid duplicates
  const existingFlags = await sql`
    SELECT candidate_id, title FROM flags WHERE type = 'REINFO'
  `
  const existingSet = new Set(
    (existingFlags as { candidate_id: string; title: string }[]).map(
      (f) => `${f.candidate_id}|${f.title}`
    )
  )
  console.log(`  ${existingFlags.length} existing REINFO flags in DB`)

  for (const [normalizedName, records] of reinfoByName) {
    // Try exact match with cargo first
    const sampleCargo = normalizeCargo(records[0].cargo_eleccion)
    let dbCandidate: DBCandidate | undefined

    if (sampleCargo) {
      dbCandidate = dbByNameCargo.get(`${normalizedName}|${sampleCargo}`)
    }

    // Fall back to name-only match
    if (!dbCandidate) {
      const candidates = dbByName.get(normalizedName)
      if (candidates && candidates.length === 1) {
        dbCandidate = candidates[0]
      } else if (candidates && candidates.length > 1) {
        // Multiple candidates with same name, try cargo match
        if (sampleCargo) {
          dbCandidate = candidates.find((c) => c.cargo === sampleCargo)
        }
        if (!dbCandidate) {
          dbCandidate = candidates[0] // Take first if no cargo match
        }
      }
    }

    if (!dbCandidate) {
      unmatched++
      unmatchedNames.push(`${records[0].nombre_completo} (${records[0].cargo_eleccion}, ${records[0].departamento})`)
      continue
    }

    matched++

    // Create flags for each mining right
    for (const record of records) {
      const severity = getSeverity(record.estado_reinfo)
      const derechoMinero = record.derecho_minero || 'No especificado'
      const title = `REINFO ${record.estado_reinfo}: ${derechoMinero}`
      const description = [
        `Candidato registrado en REINFO (Registro Integral de Formalización Minera).`,
        `Estado: ${record.estado_reinfo}`,
        `Derecho minero: ${derechoMinero}`,
        `Departamento: ${record.departamento || 'No especificado'}`,
        record.partido_politico ? `Partido: ${record.partido_politico.nombre}` : null,
      ]
        .filter(Boolean)
        .join('\n')

      const flagKey = `${dbCandidate.id}|${title}`
      if (existingSet.has(flagKey)) {
        skippedExisting++
        continue
      }

      if (!DRY_RUN) {
        await sql`
          INSERT INTO flags (candidate_id, type, severity, title, description, source, evidence_url, is_verified)
          VALUES (
            ${dbCandidate.id}::uuid,
            'REINFO',
            ${severity},
            ${title},
            ${description},
            'Territorio Tomado / GEOCATMIN',
            'https://www.territoriotomado.pe/mapa-de-candidatos-al-reinfo-2026',
            true
          )
        `
      }
      flagsCreated++
      console.log(`  ${DRY_RUN ? '[DRY] ' : ''}Flag: ${dbCandidate.full_name} → ${title} (${severity})`)
    }
  }

  // Summary
  console.log('\n=== Summary ===')
  console.log(`REINFO records: ${reinfoRecords.length} (${reinfoByName.size} unique candidates)`)
  console.log(`Matched: ${matched}`)
  console.log(`Unmatched: ${unmatched}`)
  console.log(`Flags created: ${flagsCreated}`)
  console.log(`Skipped (already exist): ${skippedExisting}`)

  if (unmatchedNames.length > 0) {
    console.log('\nUnmatched candidates:')
    for (const name of unmatchedNames) {
      console.log(`  - ${name}`)
    }
  }

  if (DRY_RUN) {
    console.log('\n>>> DRY RUN complete. Run without --dry-run to apply changes. <<<')
  }
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
