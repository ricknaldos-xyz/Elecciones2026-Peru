/**
 * Quick verification of key candidate data after fixes
 */
import { neon } from '@neondatabase/serverless'
import * as fs from 'fs'

const envContent = fs.readFileSync('./.env.local', 'utf-8')
const dbMatch = envContent.match(/DATABASE_URL=["']?([^"'\n]+)["']?/)
const DATABASE_URL = dbMatch ? dbMatch[1] : ''
const sql = neon(DATABASE_URL)

async function main() {
  const keyCandidates = [
    { name: 'LOPEZ ALIAGA', cargo: 'presidente' },
    { name: 'FUJIMORI', cargo: 'presidente' },
    { name: 'ACUÑA PERALTA CESAR', cargo: 'presidente' },
    { name: 'LUNA GALVEZ', cargo: 'presidente' },
    { name: 'CERRON ROJAS', cargo: 'presidente' },
    { name: 'VIZCARRA CORNEJO', cargo: 'presidente' },
  ]

  for (const { name, cargo } of keyCandidates) {
    const parts = name.split(' ')
    const candidates = await sql`
      SELECT c.id, c.full_name, c.cargo,
             jsonb_array_length(COALESCE(c.penal_sentences, '[]'::jsonb)) as penal_count,
             jsonb_array_length(COALESCE(c.civil_sentences, '[]'::jsonb)) as civil_count,
             p.short_name as party
      FROM candidates c
      LEFT JOIN parties p ON c.party_id = p.id
      WHERE c.is_active = true AND c.cargo = ${cargo}
        AND c.full_name ILIKE ${'%' + parts[0] + '%'}
        AND c.full_name ILIKE ${'%' + (parts[1] || parts[0]) + '%'}
      LIMIT 1
    `
    if (candidates.length === 0) continue
    const c = candidates[0]

    // Flags
    const flags = await sql`
      SELECT type, severity FROM flags WHERE candidate_id = ${c.id}::uuid
    `
    const redFlags = flags.filter((f: any) => f.severity === 'RED').length
    const amberFlags = flags.filter((f: any) => f.severity === 'AMBER').length

    // Incumbent
    const perf = await sql`
      SELECT performance_score, budget_execution_pct FROM incumbent_performance WHERE candidate_id = ${c.id}::uuid
    `

    // Scores
    const scores = await sql`
      SELECT competence, integrity, transparency, score_balanced FROM scores WHERE candidate_id = ${c.id}::uuid
    `

    console.log(`\n${c.party} | ${c.full_name}`)
    console.log(`  Penal: ${c.penal_count} | Civil: ${c.civil_count}`)
    console.log(`  Flags: ${redFlags} RED, ${amberFlags} AMBER`)
    console.log(`  Incumbent: ${perf.length > 0 ? `Score ${perf[0].performance_score}, Ejecución ${perf[0].budget_execution_pct}%` : 'N/A'}`)
    if (scores.length > 0) {
      console.log(`  Scores: Balanced=${scores[0].score_balanced} | C=${scores[0].competence} I=${scores[0].integrity} T=${scores[0].transparency}`)
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => { console.error(e); process.exit(1) })
