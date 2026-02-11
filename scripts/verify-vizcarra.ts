import { neon } from '@neondatabase/serverless'
import * as fs from 'fs'
import * as path from 'path'

const envPath = path.join(process.cwd(), '.env.local')
const envContent = fs.readFileSync(envPath, 'utf-8')
const dbMatch = envContent.match(/DATABASE_URL=["']?([^"'\n]+)["']?/)
const DATABASE_URL = dbMatch ? dbMatch[1] : process.env.DATABASE_URL!
const sql = neon(DATABASE_URL)

async function main() {
  const ids = [
    '07dfd759-9af2-4250-b1e7-c3d004035e5e', // presidente
    '15185048-adb9-44cf-b127-ed933b0e6ff0', // senador
  ]
  for (const id of ids) {
    const r = (await sql`
      SELECT *
      FROM candidates WHERE id = ${id}::uuid
    `)[0]
    console.log(`\n=== ${r.full_name} (${r.cargo}) ===`)
    const scores = (await sql`SELECT * FROM scores WHERE candidate_id = ${id}::uuid`)[0]
    if (scores) {
      console.log(`  Competencia: ${scores.competence}`)
      console.log(`  Integridad: ${scores.integrity}`)
      console.log(`  Transparencia: ${scores.transparency}`)
      console.log(`  Plan viability: ${scores.plan_viability}`)
      console.log(`  Balanced: ${scores.score_balanced}`)
      console.log(`  Balanced %: ${scores.score_balanced_p}`)
    } else {
      console.log('  NO SCORES FOUND')
    }

    const pt = r.political_trajectory as any[] || []
    console.log(`\nPolitical trajectory (${pt.length}):`)
    for (const e of pt) console.log(`  - ${e.position} [${e.source}]`)

    const ps = r.penal_sentences as any[] || []
    console.log(`\nPenal sentences (${ps.length}):`)
    for (const e of ps) console.log(`  - ${e.case_number || 'N/A'}: ${e.type} - ${e.status} [${e.source}]`)

    const ip = r.incumbent_performance
    console.log(`\nIncumbent performance: ${ip ? JSON.stringify(ip) : 'null'}`)

    const cli = r.company_legal_issues as any[] || []
    console.log(`\nCompany legal issues (${cli.length}):`)
    for (const e of cli) console.log(`  - ${e.company}: ${e.issue}`)

    const edu = r.education as any[] || []
    console.log(`\nEducation (${edu.length}):`)
    for (const e of edu) console.log(`  - ${e.degree || e.level}: ${e.institution} [${e.source}]`)
  }
}
main().catch(console.error)
