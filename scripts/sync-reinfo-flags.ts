/**
 * REINFO Flag Import Script
 *
 * Reads Excel files from /Users/rick/Development/rowship/reinfo/
 * and creates REINFO flags for matching candidates in the database.
 *
 * Source: Territorio Tomado / GEOCATMIN
 * https://www.territoriotomado.pe/mapa-de-candidatos-al-reinfo-2026
 */

import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'
import { execSync } from 'child_process'
import { neon } from '@neondatabase/serverless'

// Load DATABASE_URL from .env.local
const envPath = join(process.cwd(), '.env.local')
const envContent = readFileSync(envPath, 'utf-8')
const dbMatch = envContent.match(/DATABASE_URL=["']?([^"'\n]+)["']?/)
const DATABASE_URL = dbMatch ? dbMatch[1] : process.env.DATABASE_URL!
const sql = neon(DATABASE_URL)

const REINFO_DIR = '/Users/rick/Development/rowship/reinfo'
const SOURCE = 'Territorio Tomado / GEOCATMIN'
const EVIDENCE_URL = 'https://www.territoriotomado.pe/mapa-de-candidatos-al-reinfo-2026'

interface ReinfoRow {
  'Nombre Completo': string
  Cargo: string
  Departamento: string
  'Estado REINFO': string
  'Derecho Minero': string
}

interface ReinfoCandidate {
  name: string
  cargo: string
  departamento: string
  derechosMineros: { nombre: string; estado: string }[]
  estados: Set<string>
}

// Normalize name for matching: uppercase, remove accents, trim extra spaces
function normalizeName(name: string): string {
  return name
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

async function main() {
  console.log('🔍 Importando datos REINFO...\n')

  // Step 1: Read all Excel files
  const files = readdirSync(REINFO_DIR).filter(f => f.endsWith('.xlsx'))
  console.log(`📂 Archivos Excel encontrados: ${files.length}`)

  const candidates = new Map<string, ReinfoCandidate>()

  for (const file of files) {
    const filePath = join(REINFO_DIR, file)
    try {
      const output = execSync(`npx xlsx-cli -j "${filePath}" 2>/dev/null`, {
        encoding: 'utf-8',
        maxBuffer: 10 * 1024 * 1024,
      })

      // Parse JSON lines (first line is sheet name, second is JSON array)
      const lines = output.trim().split('\n')
      for (const line of lines) {
        if (!line.startsWith('[')) continue
        const rows: ReinfoRow[] = JSON.parse(line)

        for (const row of rows) {
          const name = (row['Nombre Completo'] || '').trim()
          if (!name) continue

          const key = name.toUpperCase()
          if (!candidates.has(key)) {
            candidates.set(key, {
              name,
              cargo: row.Cargo || '',
              departamento: row.Departamento || '',
              derechosMineros: [],
              estados: new Set(),
            })
          }

          const candidate = candidates.get(key)!
          candidate.derechosMineros.push({
            nombre: row['Derecho Minero'] || '',
            estado: row['Estado REINFO'] || '',
          })
          candidate.estados.add(row['Estado REINFO'] || '')
        }
      }
    } catch (e) {
      console.error(`  ❌ Error leyendo ${file}:`, e)
    }
  }

  console.log(`\n👥 Candidatos REINFO únicos: ${candidates.size}`)

  // Step 2: Fetch all candidates from DB for matching
  const dbCandidates = await sql`
    SELECT id, full_name, cargo
    FROM candidates
    WHERE is_active = true
  `

  // Build lookup maps
  const dbByNormalized = new Map<string, { id: string; full_name: string; cargo: string }>()
  for (const c of dbCandidates) {
    const normalized = normalizeName(c.full_name as string)
    dbByNormalized.set(normalized, {
      id: c.id as string,
      full_name: c.full_name as string,
      cargo: c.cargo as string,
    })
  }

  console.log(`📊 Candidatos en DB: ${dbCandidates.length}`)

  // Step 3: Delete existing REINFO flags (clean slate for re-import)
  const deleted = await sql`
    DELETE FROM flags WHERE type = 'REINFO' AND source = ${SOURCE}
    RETURNING id
  `
  if (deleted.length > 0) {
    console.log(`🗑️  Eliminados ${deleted.length} flags REINFO previos`)
  }

  // Step 4: Match and insert flags
  let matched = 0
  let notFound = 0
  const notFoundList: string[] = []

  for (const [key, candidate] of candidates) {
    const normalizedKey = normalizeName(key)

    // Try exact match
    let dbCandidate = dbByNormalized.get(normalizedKey)

    // Try without extra spaces or formatting differences
    if (!dbCandidate) {
      for (const [dbNorm, dbCand] of dbByNormalized) {
        if (dbNorm === normalizedKey) {
          dbCandidate = dbCand
          break
        }
        // Try matching with words sorted (handles different name order)
        const reinfoWords = normalizedKey.split(' ').sort().join(' ')
        const dbWords = dbNorm.split(' ').sort().join(' ')
        if (reinfoWords === dbWords) {
          dbCandidate = dbCand
          break
        }
      }
    }

    if (!dbCandidate) {
      notFound++
      notFoundList.push(`  ${candidate.name} (${candidate.cargo}, ${candidate.departamento})`)
      continue
    }

    // Determine severity
    const hasVigente = candidate.estados.has('Vigente')
    const hasSuspendido = candidate.estados.has('Suspendido')
    const severity = hasVigente ? 'RED' : 'AMBER'

    // Count by status
    const vigentes = candidate.derechosMineros.filter(d => d.estado === 'Vigente')
    const excluidos = candidate.derechosMineros.filter(d => d.estado === 'Excluido')
    const suspendidos = candidate.derechosMineros.filter(d => d.estado === 'Suspendido')

    // Build title
    const parts: string[] = []
    if (vigentes.length > 0) parts.push(`${vigentes.length} vigente${vigentes.length > 1 ? 's' : ''}`)
    if (excluidos.length > 0) parts.push(`${excluidos.length} excluido${excluidos.length > 1 ? 's' : ''}`)
    if (suspendidos.length > 0) parts.push(`${suspendidos.length} suspendido${suspendidos.length > 1 ? 's' : ''}`)
    const title = `REINFO: ${candidate.derechosMineros.length} derechos mineros (${parts.join(', ')})`

    // Build description
    const description = candidate.derechosMineros
      .map(d => `• ${d.nombre} [${d.estado}]`)
      .join('\n')

    await sql`
      INSERT INTO flags (id, candidate_id, type, severity, title, description, source, evidence_url, is_verified, date_captured)
      VALUES (
        gen_random_uuid(),
        ${dbCandidate.id}::uuid,
        'REINFO',
        ${severity},
        ${title},
        ${description},
        ${SOURCE},
        ${EVIDENCE_URL},
        true,
        NOW()
      )
    `

    matched++
    const statusIcon = severity === 'RED' ? '🔴' : '🟡'
    console.log(`  ${statusIcon} ${dbCandidate.full_name} → ${title}`)
  }

  console.log(`\n============================================================`)
  console.log(`📊 Resumen:`)
  console.log(`  ✅ Matcheados e insertados: ${matched}`)
  console.log(`  ❌ No encontrados en DB: ${notFound}`)

  if (notFoundList.length > 0) {
    console.log(`\n⚠️  Candidatos no encontrados:`)
    notFoundList.forEach(n => console.log(n))
  }

  // Verify
  const totalFlags = await sql`SELECT COUNT(*) as c FROM flags WHERE type = 'REINFO'`
  console.log(`\n🏁 Total flags REINFO en DB: ${totalFlags[0].c}`)
}

main().catch(console.error)
