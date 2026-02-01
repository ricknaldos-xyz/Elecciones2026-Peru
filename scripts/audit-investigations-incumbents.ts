/**
 * Audit script: Check incumbent performance and active investigations data
 * for key presidential candidates.
 */
import { neon } from '@neondatabase/serverless'
import * as fs from 'fs'

const envContent = fs.readFileSync('./.env.local', 'utf-8')
const dbMatch = envContent.match(/DATABASE_URL=["']?([^"'\n]+)["']?/)
const DATABASE_URL = dbMatch ? dbMatch[1] : ''
const sql = neon(DATABASE_URL)

async function main() {
  console.log('=== AUDIT: Incumbent Performance & Investigations ===\n')

  // 1. Check incumbent_performance table
  console.log('--- incumbent_performance records ---')
  const incumbents = await sql`
    SELECT ip.*, c.full_name, c.cargo, p.short_name as party
    FROM incumbent_performance ip
    JOIN candidates c ON c.id = ip.candidate_id
    LEFT JOIN parties p ON c.party_id = p.id
    ORDER BY c.full_name
  `
  if (incumbents.length === 0) {
    console.log('  (EMPTY - no records)')
  } else {
    for (const r of incumbents) {
      console.log(`  ${r.full_name} (${r.party}/${r.cargo}): ${r.cargo_actual} - ${r.entidad}`)
      console.log(`    Ejecución: ${r.budget_execution_pct}% | Contraloría: ${r.contraloria_reports} informes | Score: ${r.performance_score}`)
      console.log(`    Criminal referral: ${r.has_criminal_referral}`)
    }
  }
  console.log(`  Total: ${incumbents.length} records\n`)

  // 2. Check penal_sentences for key candidates
  console.log('--- Key candidates: penal_sentences & investigations ---')
  const keyCandidates = [
    'LOPEZ ALIAGA',
    'FUJIMORI',
    'ACUÑA',
    'LUNA GALVEZ',
    'CERRON',
    'VIZCARRA',
    'HUMALA',
    'URRESTI',
    'FORSYTH',
    'WILLIAMS',
    'MOLINELLI',
    'BERMEJO',
  ]

  for (const name of keyCandidates) {
    const candidates = await sql`
      SELECT c.id, c.full_name, c.cargo, c.penal_sentences, c.civil_sentences,
             p.short_name as party
      FROM candidates c
      LEFT JOIN parties p ON c.party_id = p.id
      WHERE c.is_active = true
        AND c.full_name ILIKE ${'%' + name + '%'}
        AND c.cargo IN ('presidente', 'senador')
      ORDER BY c.cargo, c.full_name
      LIMIT 5
    `

    for (const c of candidates) {
      const penal = Array.isArray(c.penal_sentences) ? c.penal_sentences : []
      const civil = Array.isArray(c.civil_sentences) ? c.civil_sentences : []
      console.log(`\n  ${c.full_name} (${c.party}/${c.cargo}):`)
      console.log(`    Penal sentences: ${penal.length}`)
      for (const s of penal) {
        console.log(`      - [${s.status || 'N/A'}] ${s.type || s.description || 'Sin tipo'}`)
      }
      console.log(`    Civil sentences: ${civil.length}`)
      for (const s of civil) {
        console.log(`      - [${s.status || 'N/A'}] ${s.type || s.description || 'Sin tipo'}`)
      }

      // Check flags
      const flags = await sql`
        SELECT type, severity, title FROM flags WHERE candidate_id = ${c.id}::uuid ORDER BY severity, type
      `
      console.log(`    Flags: ${flags.length}`)
      for (const f of flags) {
        console.log(`      - [${f.severity}] ${f.type}: ${f.title}`)
      }

      // Check incumbent performance
      const perf = await sql`
        SELECT * FROM incumbent_performance WHERE candidate_id = ${c.id}::uuid
      `
      if (perf.length > 0) {
        console.log(`    Incumbent: YES - ${perf[0].cargo_actual} (Score: ${perf[0].performance_score})`)
      } else {
        console.log(`    Incumbent: NO record`)
      }

      // Check scores
      const scores = await sql`
        SELECT competence, integrity, transparency, score_balanced FROM scores WHERE candidate_id = ${c.id}::uuid
      `
      if (scores.length > 0) {
        const s = scores[0]
        console.log(`    Scores: Balanced=${s.score_balanced} | C=${s.competence} I=${s.integrity} T=${s.transparency}`)
      }
    }
  }

  // 3. Summary: candidates with public office background but no incumbent_performance
  console.log('\n\n--- Candidates with political trajectory mentioning executive roles ---')
  const executives = await sql`
    SELECT c.id, c.full_name, c.cargo, p.short_name as party,
           c.political_trajectory::text as traj
    FROM candidates c
    LEFT JOIN parties p ON c.party_id = p.id
    WHERE c.is_active = true
      AND c.cargo IN ('presidente', 'senador')
      AND c.political_trajectory IS NOT NULL
      AND c.political_trajectory != '[]'::jsonb
      AND c.political_trajectory != 'null'::jsonb
      AND (
        c.political_trajectory::text ILIKE '%alcalde%'
        OR c.political_trajectory::text ILIKE '%gobernador%'
        OR c.political_trajectory::text ILIKE '%presidente%regional%'
        OR c.political_trajectory::text ILIKE '%ministro%'
      )
      AND c.id NOT IN (SELECT candidate_id FROM incumbent_performance)
    ORDER BY p.short_name, c.full_name
  `
  console.log(`  Found ${executives.length} candidates with executive experience but NO incumbent_performance record:`)
  for (const c of executives) {
    console.log(`  ${c.party} | ${c.full_name} (${c.cargo})`)
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })
