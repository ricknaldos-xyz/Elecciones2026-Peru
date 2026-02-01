/**
 * Search for known 2021-2026 congresspeople across all parties in the candidate DB.
 * These are congresspeople who are reportedly running in the 2026 elections.
 */
import { neon } from '@neondatabase/serverless'
import * as fs from 'fs'

const envContent = fs.readFileSync('./.env.local', 'utf-8')
const dbMatch = envContent.match(/DATABASE_URL=["']?([^"'\n]+)["']?/)
const DATABASE_URL = dbMatch ? dbMatch[1] : ''
const sql = neon(DATABASE_URL)

// Known congresspeople from 2021-2026 who may be running in 2026
// Organized by party
const CONGRESS_MEMBERS: Record<string, string[]> = {
  // Renovación Popular
  RP: [
    'MONTOYA', 'CUETO', 'MUÑANTE', 'YARROW', 'TUDELA', 'LIZARZABURU',
    'HENDERSON', 'PADILLA', 'CHIABRA', 'BUSTAMANTE',
  ],
  // Alianza para el Progreso
  APP: [
    'ACUÑA', 'CAMONES', 'ESPINOZA', 'SALHUANA', 'CORDERO',
  ],
  // Perú Libre
  PL: [
    'CERRON', 'BERMEJO', 'BELLIDO', 'ARANA', 'TAIPE',
  ],
  // Acción Popular
  AP: [
    'WILLIAMS', 'SALHUANA', 'MERINO', 'FLORES ANCACHI',
  ],
  // Podemos Perú
  PODE: [
    'LUNA GALVEZ', 'CASTILLO', 'GONZALES',
  ],
  // Avanza País
  'Avanza': [
    'WILLIAMS', 'DE BELAUNDE', 'OLIVARES',
  ],
  // Somos Perú
  SP: [
    'SALAVERRY',
  ],
  // Juntos por el Perú / Nuevo Perú
  JP: [
    'PARIONA', 'GLAVE', 'HUILCA',
  ],
  // Partido Morado
  PM: [
    'DE BELAUNDE', 'OLIVARES',
  ],
}

async function main() {
  console.log('=== Searching for known congresspeople in candidate DB ===\n')

  // Get all parties
  const parties = await sql`SELECT id, short_name, name FROM parties ORDER BY short_name`
  console.log(`Total parties: ${parties.length}\n`)

  // For each known congress member, search across all parties
  const allSearchNames = new Set<string>()
  for (const names of Object.values(CONGRESS_MEMBERS)) {
    for (const name of names) allSearchNames.add(name)
  }

  console.log('--- Search results ---\n')

  for (const searchName of [...allSearchNames].sort()) {
    const results = await sql`
      SELECT c.id, c.full_name, c.cargo, p.short_name as party
      FROM candidates c
      LEFT JOIN parties p ON c.party_id = p.id
      WHERE c.is_active = true
        AND c.full_name ILIKE ${'%' + searchName + '%'}
      ORDER BY p.short_name, c.full_name
      LIMIT 5
    `

    if (results.length > 0) {
      for (const r of results) {
        // Check if has votes
        const votes = await sql`
          SELECT COUNT(*) as cnt FROM congressional_votes WHERE candidate_id = ${r.id}::uuid
        `
        const hasVotes = Number(votes[0].cnt) > 0 ? ` [${votes[0].cnt} VOTES]` : ''
        console.log(`${searchName} -> ${r.party} | ${r.full_name} (${r.cargo})${hasVotes}`)
      }
    }
  }

  // Also list ALL parties with their candidate counts and how many have votes
  console.log('\n\n=== All parties summary ===')
  const summary = await sql`
    SELECT
      COALESCE(p.short_name, 'N/A') as party,
      COALESCE(p.name, 'Sin Partido') as party_name,
      COUNT(DISTINCT c.id) as total,
      COUNT(DISTINCT cv.candidate_id) as with_votes
    FROM candidates c
    LEFT JOIN parties p ON c.party_id = p.id
    LEFT JOIN congressional_votes cv ON c.id = cv.candidate_id
    WHERE c.is_active = true
    GROUP BY p.short_name, p.name
    ORDER BY with_votes DESC, total DESC
  `

  for (const row of summary) {
    const marker = Number(row.with_votes) > 0 ? ' ✓' : ''
    console.log(`  ${row.party} (${row.party_name}): ${row.with_votes}/${row.total}${marker}`)
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })
