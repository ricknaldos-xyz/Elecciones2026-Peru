/**
 * Fix Masse Fernandez: link his plan_pdf_local to the existing PDF
 */
import { neon } from '@neondatabase/serverless'
import * as fs from 'fs'
import * as path from 'path'

const envPath = path.join(process.cwd(), '.env.local')
const envContent = fs.readFileSync(envPath, 'utf-8')
const dbMatch = envContent.match(/DATABASE_URL=["']?([^"'\n]+)["']?/)
const sql = neon(dbMatch![1])

async function main() {
  // Verify PDF exists
  const pdfPath = path.join(process.cwd(), 'public/planes/partido-democratico-federal.pdf')
  if (!fs.existsSync(pdfPath)) {
    console.log('❌ PDF does not exist!')
    return
  }
  console.log('✅ PDF exists:', pdfPath)

  // Find Masse
  const candidates = await sql`
    SELECT id, full_name, plan_pdf_local, plan_gobierno_url
    FROM candidates
    WHERE full_name ILIKE '%MASSE%'
    AND is_active = true
  `

  console.log(`Found ${candidates.length} Masse records:`)
  for (const c of candidates) {
    console.log(`  ${c.full_name} | plan_pdf_local: ${c.plan_pdf_local} | plan_gobierno_url: ${c.plan_gobierno_url}`)
  }

  // Update all Masse records
  const result = await sql`
    UPDATE candidates
    SET plan_pdf_local = '/planes/partido-democratico-federal.pdf'
    WHERE full_name ILIKE '%MASSE%'
    AND is_active = true
    AND (plan_pdf_local IS NULL OR plan_pdf_local = '')
    RETURNING id, full_name
  `

  console.log(`\nUpdated ${result.length} records:`)
  for (const r of result) {
    console.log(`  ✅ ${r.full_name}`)
  }

  // Verify proposals exist
  const proposals = await sql`
    SELECT COUNT(*) as count
    FROM candidate_proposals cp
    JOIN candidates c ON cp.candidate_id = c.id
    WHERE c.full_name ILIKE '%MASSE%' AND c.is_active = true
  `
  console.log(`\nProposals in DB: ${proposals[0].count}`)
}

main()
  .then(() => process.exit(0))
  .catch(err => { console.error('Fatal:', err); process.exit(1) })
