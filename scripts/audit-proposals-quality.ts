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
  console.log('=== PROPOSALS QUALITY AUDIT ===\n')
  
  // 1. Proposals per candidate
  const perCandidate = await sql`
    SELECT c.full_name, COUNT(cp.id) as proposal_count, 
           cp.extraction_model,
           c.plan_pdf_local
    FROM candidates c
    LEFT JOIN candidate_proposals cp ON c.id = cp.candidate_id
    WHERE c.cargo = 'presidente' AND c.is_active = true
    GROUP BY c.full_name, cp.extraction_model, c.plan_pdf_local
    ORDER BY proposal_count ASC, c.full_name
  `
  
  console.log('PROPOSALS PER CANDIDATE:')
  let totalProps = 0
  const noProposals: string[] = []
  for (const r of perCandidate) {
    const count = Number(r.proposal_count)
    totalProps += count
    const flag = count === 0 ? ' *** NO PROPOSALS ***' : count < 10 ? ' (LOW)' : ''
    console.log(`  ${count.toString().padStart(2)} | ${r.full_name} [${r.extraction_model || 'none'}]${flag}`)
    if (count === 0) noProposals.push(r.full_name)
  }
  console.log(`\nTotal proposals: ${totalProps}`)
  
  // 2. Category distribution
  const categories = await sql`
    SELECT cp.category, COUNT(*) as cnt
    FROM candidate_proposals cp
    JOIN candidates c ON cp.candidate_id = c.id
    WHERE c.cargo = 'presidente' AND c.is_active = true
    GROUP BY cp.category
    ORDER BY cnt DESC
  `
  console.log('\nCATEGORY DISTRIBUTION:')
  categories.forEach(cat => console.log(`  ${cat.category}: ${cat.cnt}`))
  
  // 3. Check for very short or empty proposals
  const shortProposals = await sql`
    SELECT c.full_name, cp.title, cp.description, LENGTH(cp.description) as desc_len
    FROM candidate_proposals cp
    JOIN candidates c ON cp.candidate_id = c.id
    WHERE c.cargo = 'presidente' AND c.is_active = true
    AND (cp.description IS NULL OR LENGTH(cp.description) < 20)
    ORDER BY c.full_name
  `
  if (shortProposals.length > 0) {
    console.log('\nSHORT/EMPTY DESCRIPTIONS:')
    shortProposals.forEach(p => console.log(`  ${p.full_name}: "${p.title}" (${p.desc_len} chars)`))
  }
  
  // 4. Check extraction models
  const models = await sql`
    SELECT extraction_model, COUNT(*) as cnt
    FROM candidate_proposals cp
    JOIN candidates c ON cp.candidate_id = c.id
    WHERE c.cargo = 'presidente' AND c.is_active = true
    GROUP BY extraction_model
  `
  console.log('\nEXTRACTION MODELS:')
  models.forEach(m => console.log(`  ${m.extraction_model}: ${m.cnt} proposals`))
  
  // 5. Check for duplicate proposals within same candidate
  const dupeProps = await sql`
    SELECT c.full_name, cp.title, COUNT(*) as cnt
    FROM candidate_proposals cp
    JOIN candidates c ON cp.candidate_id = c.id
    WHERE c.cargo = 'presidente' AND c.is_active = true
    GROUP BY c.full_name, cp.title
    HAVING COUNT(*) > 1
  `
  if (dupeProps.length > 0) {
    console.log('\nDUPLICATE POPOSALS:')
    dupeProps.forEach(d => console.log(`  ${d.full_name}: "${d.title}" (${d.cnt}x)`))
  } else {
    console.log('\nNo duplicate proposals found.')
  }
  
  // 6. Check proposal evaluations
  const evalStats = await sql`
    SELECT COUNT(DISTINCT cp.id) as evaluated_proposals,
           COUNT(pe.id) as total_evaluations
    FROM candidate_proposals cp
    LEFT JOIN proposal_evaluations pe ON cp.id = pe.id
    JOIN candidates c ON cp.candidate_id = c.id
    WHERE c.cargo = 'presidente' AND c.is_active = true
  `
  console.log('\nEVALUATIONS:')
  console.log(`  Evaluated proposals: ${evalStats[0].evaluated_proposals}`)
  console.log(`  Total evaluations: ${evalStats[0].total_evaluations}`)
  
  // 7. Candidates without proposals that HAVE a plan
  if (noProposals.length > 0) {
    console.log('\n*** CANDIDATES WITH NO PROPOSALS ***')
    noProposals.forEach(n => console.log(`  - ${n}`))
  }
}

main().catch(console.error)
