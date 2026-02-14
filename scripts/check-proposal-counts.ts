/**
 * Quick check: proposal counts per candidate
 */
import * as fs from 'fs'
import * as path from 'path'
import { neon } from '@neondatabase/serverless'

function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local')
  const content = fs.readFileSync(envPath, 'utf-8')
  const dbMatch = content.match(/DATABASE_URL=["']?([^"'\n]+)["']?/)
  return { db: dbMatch![1] }
}

const sql = neon(loadEnv().db)

async function main() {
  const rows = await sql`
    SELECT c.full_name, p.name as party,
           COUNT(cp.id) as proposals,
           c.plan_pdf_local
    FROM candidates c
    LEFT JOIN parties p ON c.party_id = p.id
    LEFT JOIN candidate_proposals cp ON c.id = cp.candidate_id
    WHERE c.cargo = 'presidente' AND c.is_active = true
    GROUP BY c.id, c.full_name, p.name, c.plan_pdf_local
    ORDER BY proposals DESC
  `

  console.log('PROPUESTAS POR CANDIDATO:')
  console.log('='.repeat(90))
  let total = 0
  for (const r of rows) {
    const count = parseInt(r.proposals as string)
    total += count
    console.log(`  ${String(count).padStart(5)} | ${(r.full_name as string).padEnd(45)} | ${r.party}`)
  }
  console.log('='.repeat(90))
  console.log(`  TOTAL: ${total} propuestas | ${rows.length} candidatos`)
}

main().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1) })
