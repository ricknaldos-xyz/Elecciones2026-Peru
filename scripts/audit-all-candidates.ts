/**
 * Comprehensive audit of ALL presidential candidates
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
  console.log('='.repeat(70))
  console.log(' COMPREHENSIVE CANDIDATE AUDIT')
  console.log('='.repeat(70))

  // 1. Basic data with party join
  const candidates = await sql`
    SELECT c.id, c.full_name, p.name as party_name, c.photo_url, c.plan_pdf_local,
           c.plan_gobierno_url, c.education_level, c.birth_date, c.dni,
           c.penal_sentences, c.civil_sentences, c.party_id, c.jne_id,
           s.score_balanced, s.score_merit, s.score_integrity,
           s.competence, s.integrity, s.transparency, s.confidence
    FROM candidates c
    LEFT JOIN parties p ON c.party_id = p.id
    LEFT JOIN scores s ON c.id = s.candidate_id
    WHERE c.cargo = 'presidente' AND c.is_active = true
    ORDER BY c.full_name
  `
  console.log('\nTotal active presidential candidates:', candidates.length)

  // Check basic fields
  console.log('\n--- MISSING DATA ---')
  let issueCount = 0
  for (const c of candidates) {
    const problems: string[] = []
    if (!c.party_name) problems.push('NO PARTY')
    if (!c.photo_url) problems.push('NO PHOTO')
    if (!c.plan_pdf_local) problems.push('NO LOCAL PDF')
    if (!c.plan_gobierno_url) problems.push('NO PLAN URL')
    if (!c.education_level) problems.push('NO EDUCATION')
    if (!c.birth_date) problems.push('NO BIRTH DATE')
    if (!c.dni) problems.push('NO DNI')
    if (c.score_balanced === null || c.score_balanced === undefined) problems.push('NO SCORE')
    if (problems.length > 0) {
      console.log(`  ${c.full_name}: ${problems.join(', ')}`)
      issueCount++
    }
  }
  if (issueCount === 0) console.log('  None - all basic data complete!')

  // 2. Duplicates
  const dupes = await sql`
    SELECT full_name, COUNT(*) as cnt FROM candidates
    WHERE cargo = 'presidente' AND is_active = true
    GROUP BY full_name HAVING COUNT(*) > 1
  `
  if (dupes.length > 0) {
    console.log('\n--- DUPLICATE CANDIDATES ---')
    dupes.forEach((d: any) => console.log(`  ${d.full_name}: ${d.cnt}x`))
  }

  // 3. Parties
  console.log(`\n--- PARTIES ---`)
  const partySet = new Set(candidates.map((c: any) => c.party_name).filter(Boolean))
  console.log(`  ${partySet.size} unique parties for ${candidates.length} candidates`)

  // 4. PDFs
  console.log('\n--- PDF FILES ---')
  let pdfOk = 0, pdfMissing = 0, pdfNoPlan = 0
  for (const c of candidates) {
    if (!c.plan_pdf_local) { pdfNoPlan++; continue }
    const pdfPath = path.join(process.cwd(), 'public', c.plan_pdf_local as string)
    if (!fs.existsSync(pdfPath)) {
      console.log(`  [MISSING] ${c.full_name}: ${c.plan_pdf_local}`)
      pdfMissing++
    } else {
      const size = Math.round(fs.statSync(pdfPath).size / 1024)
      const fd = fs.openSync(pdfPath, 'r')
      const buf = Buffer.alloc(4)
      fs.readSync(fd, buf, 0, 4, 0)
      fs.closeSync(fd)
      if (!buf.toString('ascii').startsWith('%PDF')) {
        console.log(`  [NOT PDF] ${c.full_name}: ${size}KB`)
        pdfMissing++
      } else {
        pdfOk++
      }
    }
  }
  console.log(`  OK: ${pdfOk}, Missing file: ${pdfMissing}, No plan in DB: ${pdfNoPlan}`)

  // 5. Proposals
  console.log('\n--- PROPOSALS PER CANDIDATE ---')
  const props = await sql`
    SELECT c.full_name, COUNT(cp.id) as cnt, cp.extraction_model
    FROM candidates c
    LEFT JOIN candidate_proposals cp ON c.id = cp.candidate_id
    WHERE c.cargo = 'presidente' AND c.is_active = true
    GROUP BY c.full_name, cp.extraction_model
    ORDER BY cnt ASC, c.full_name
  `
  let totalProps = 0
  for (const r of props) {
    const count = Number(r.cnt)
    totalProps += count
    const flag = count === 0 ? ' *** NO PROPOSALS ***' : count < 10 ? ' (LOW)' : ''
    console.log(`  ${count.toString().padStart(2)} | ${r.full_name} [${r.extraction_model || 'none'}]${flag}`)
  }
  console.log(`  Total: ${totalProps}`)

  // 6. Category distribution
  const cats = await sql`
    SELECT cp.category, COUNT(*) as cnt
    FROM candidate_proposals cp
    JOIN candidates c ON cp.candidate_id = c.id
    WHERE c.cargo = 'presidente' AND c.is_active = true
    GROUP BY cp.category ORDER BY cnt DESC
  `
  console.log('\n--- CATEGORY DISTRIBUTION ---')
  cats.forEach((c: any) => console.log(`  ${c.category}: ${c.cnt}`))

  // 7. Extraction models
  const models = await sql`
    SELECT extraction_model, COUNT(*) as cnt
    FROM candidate_proposals cp
    JOIN candidates c ON cp.candidate_id = c.id
    WHERE c.cargo = 'presidente' AND c.is_active = true
    GROUP BY extraction_model
  `
  console.log('\n--- EXTRACTION MODELS ---')
  models.forEach((m: any) => console.log(`  ${m.extraction_model}: ${m.cnt}`))

  // 8. Duplicate proposals
  const dupeProps = await sql`
    SELECT c.full_name, cp.title, COUNT(*) as cnt
    FROM candidate_proposals cp
    JOIN candidates c ON cp.candidate_id = c.id
    WHERE c.cargo = 'presidente' AND c.is_active = true
    GROUP BY c.full_name, cp.title HAVING COUNT(*) > 1
  `
  if (dupeProps.length > 0) {
    console.log('\n--- DUPLICATE PROPOSALS ---')
    dupeProps.forEach((d: any) => console.log(`  ${d.full_name}: "${d.title}" (${d.cnt}x)`))
  }

  // 9. Photos
  console.log('\n--- PHOTOS ---')
  let withPhotos = 0
  const noPhotos: string[] = []
  for (const c of candidates) {
    if (!c.photo_url) { noPhotos.push(c.full_name as string); continue }
    if (!(c.photo_url as string).startsWith('http')) {
      console.log(`  [BAD URL] ${c.full_name}: ${c.photo_url}`)
      continue
    }
    withPhotos++
  }
  console.log(`  With photos: ${withPhotos}/${candidates.length}`)
  if (noPhotos.length > 0) {
    console.log('  Missing:', noPhotos.join(', '))
  }

  // 10. Scores
  console.log('\n--- SCORES (balanced) ---')
  const sorted = [...candidates].sort((a: any, b: any) => (b.score_balanced || 0) - (a.score_balanced || 0))
  for (const s of sorted) {
    const sb = s.score_balanced !== null && s.score_balanced !== undefined ? Number(s.score_balanced).toFixed(1) : 'NULL'
    console.log(`  ${sb.padStart(5)} | ${s.full_name} (merit:${s.score_merit?.toFixed?.(1)||'?'} integ:${s.score_integrity?.toFixed?.(1)||'?'} comp:${s.competence?.toFixed?.(1)||'?'} conf:${s.confidence?.toFixed?.(1)||'?'})`)
  }

  // 11. Score breakdowns
  const breakdowns = await sql`
    SELECT c.full_name, sb.education_level_points, sb.experience_total_points,
           sb.penal_penalty, sb.civil_penalties, sb.resignation_penalty,
           sb.company_penalty, sb.tax_penalty, sb.omission_penalty
    FROM candidates c
    LEFT JOIN score_breakdowns sb ON c.id = sb.candidate_id
    WHERE c.cargo = 'presidente' AND c.is_active = true
    AND (sb.penal_penalty != 0 OR sb.civil_penalties != 0 OR sb.company_penalty != 0
         OR sb.tax_penalty != 0 OR sb.omission_penalty != 0)
    ORDER BY c.full_name
  `
  if (breakdowns.length > 0) {
    console.log('\n--- CANDIDATES WITH PENALTIES ---')
    for (const b of breakdowns) {
      const penalties: string[] = []
      if (b.penal_penalty) penalties.push(`penal:${b.penal_penalty}`)
      if (b.civil_penalties) penalties.push(`civil:${b.civil_penalties}`)
      if (b.company_penalty) penalties.push(`company:${b.company_penalty}`)
      if (b.tax_penalty) penalties.push(`tax:${b.tax_penalty}`)
      if (b.omission_penalty) penalties.push(`omission:${b.omission_penalty}`)
      if (b.resignation_penalty) penalties.push(`resign:${b.resignation_penalty}`)
      console.log(`  ${b.full_name}: ${penalties.join(', ')}`)
    }
  }

  // 12. Evaluations
  const evals = await sql`
    SELECT COUNT(DISTINCT pe.proposal_id) as evaluated,
           COUNT(pe.id) as total_evals
    FROM proposal_evaluations pe
    JOIN candidate_proposals cp ON pe.proposal_id = cp.id
    JOIN candidates c ON cp.candidate_id = c.id
    WHERE c.cargo = 'presidente' AND c.is_active = true
  `
  console.log(`\n--- EVALUATIONS ---`)
  console.log(`  Evaluated proposals: ${evals[0].evaluated} / ${totalProps}`)
  console.log(`  Total evaluations: ${evals[0].total_evals}`)

  // 13. Inactive candidates
  const inactive = await sql`
    SELECT c.full_name, p.name as party_name FROM candidates c
    LEFT JOIN parties p ON c.party_id = p.id
    WHERE c.cargo = 'presidente' AND c.is_active = false ORDER BY c.full_name
  `
  if (inactive.length > 0) {
    console.log(`\n--- INACTIVE CANDIDATES (${inactive.length}) ---`)
    inactive.forEach((c: any) => console.log(`  ${c.full_name} (${c.party_name})`))
  }

  // 14. Orphan PDFs
  const planesDir = path.join(process.cwd(), 'public', 'planes')
  if (fs.existsSync(planesDir)) {
    const files = fs.readdirSync(planesDir).filter(f => f.endsWith('.pdf'))
    const dbPaths = candidates.map((c: any) => c.plan_pdf_local).filter(Boolean)
    const orphans = files.filter(f => !dbPaths.includes('planes/' + f))
    if (orphans.length > 0) {
      console.log(`\n--- ORPHAN PDF FILES (${orphans.length}) ---`)
      orphans.forEach(f => console.log(`  ${f}`))
    }
  }

  // 15. Orphan proposals (for non-active candidates)
  const orphanProps = await sql`
    SELECT COUNT(*) as cnt FROM candidate_proposals cp
    LEFT JOIN candidates c ON cp.candidate_id = c.id
    WHERE c.is_active = false OR c.id IS NULL
  `
  if (Number(orphanProps[0].cnt) > 0) {
    console.log(`\n--- ORPHAN PROPOSALS: ${orphanProps[0].cnt} ---`)
  }

  console.log('\n' + '='.repeat(70))
  console.log(' AUDIT COMPLETE')
  console.log('='.repeat(70))
}

main().catch(console.error)
