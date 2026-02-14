import { neon } from '@neondatabase/serverless'
import * as fs from 'fs'
import * as path from 'path'

const envContent = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf-8')
const dbMatch = envContent.match(/DATABASE_URL=["']?([^"'\n]+)["']?/)
const sql = neon(dbMatch![1])

async function main() {
  const candidates = await sql`
    SELECT c.id, c.full_name, p.name as party_name,
           c.plan_pdf_local, c.plan_gobierno_url,
           (SELECT COUNT(*) FROM candidate_proposals cp WHERE cp.candidate_id = c.id) as prop_count
    FROM candidates c
    LEFT JOIN parties p ON c.party_id = p.id
    WHERE c.cargo = 'presidente' AND c.is_active = true
    ORDER BY c.full_name
  `

  console.log(`CANDIDATOS PRESIDENCIALES ACTIVOS: ${candidates.length}\n`)

  let withPdf = 0, withProposals = 0, withBoth = 0
  const noPdf: typeof candidates = []
  const noProposals: typeof candidates = []
  const noProposalsButPdf: typeof candidates = []

  for (const c of candidates) {
    const hasPdf = !!c.plan_pdf_local
    const hasProps = parseInt(c.prop_count as string) > 0

    if (hasPdf) withPdf++
    if (hasProps) withProposals++
    if (hasPdf && hasProps) withBoth++

    if (!hasPdf) noPdf.push(c)
    if (!hasProps) noProposals.push(c)
    if (!hasProps && hasPdf) noProposalsButPdf.push(c)

    // Check PDF exists on disk
    let pdfExists = false
    if (hasPdf) {
      pdfExists = fs.existsSync(path.join(process.cwd(), 'public', c.plan_pdf_local as string))
    }

    const status = hasPdf && hasProps ? '✅' :
                   !hasPdf && !hasProps ? '⚪' :
                   hasPdf && !hasProps ? '❌' : '⚠️'

    const diskNote = hasPdf && !pdfExists ? ' [PDF NO EXISTE EN DISCO!]' : ''
    console.log(`  ${status} ${c.full_name} | ${c.party_name} | PDF: ${hasPdf ? 'SÍ' : 'NO'}${diskNote} | Propuestas: ${c.prop_count}`)
  }

  console.log(`\n${'═'.repeat(60)}`)
  console.log(`RESUMEN:`)
  console.log(`  Total candidatos: ${candidates.length}`)
  console.log(`  Con PDF + propuestas: ${withBoth} ✅`)
  console.log(`  Con PDF: ${withPdf}`)
  console.log(`  Con propuestas: ${withProposals}`)
  console.log(`  Sin PDF ni propuestas: ${noProposals.filter(c => !c.plan_pdf_local).length}`)

  if (noProposalsButPdf.length > 0) {
    console.log(`\n🚨 TIENEN PDF PERO 0 PROPUESTAS (necesitan extracción):`)
    for (const c of noProposalsButPdf) {
      console.log(`  - ${c.full_name} (${c.party_name}) PDF: ${c.plan_pdf_local}`)
    }
  }

  const propsNoPdf = noPdf.filter(c => parseInt(c.prop_count as string) > 0)
  if (propsNoPdf.length > 0) {
    console.log(`\n⚠️ TIENEN PROPUESTAS PERO NO PDF:`)
    for (const c of propsNoPdf) {
      console.log(`  - ${c.full_name} (${c.party_name}) Props: ${c.prop_count}`)
    }
  }

  const total = await sql`
    SELECT COUNT(*) as count FROM candidate_proposals cp
    JOIN candidates c ON cp.candidate_id = c.id
    WHERE c.cargo = 'presidente' AND c.is_active = true
  `
  console.log(`\nTotal propuestas en BD: ${total[0].count}`)

  const noPdfNoProps = noProposals.filter(c => !c.plan_pdf_local)
  if (noPdfNoProps.length > 0) {
    console.log(`\n⚪ SIN PDF NI PROPUESTAS:`)
    for (const c of noPdfNoProps) {
      console.log(`  - ${c.full_name} (${c.party_name})`)
      console.log(`    URL plan: ${c.plan_gobierno_url || 'NINGUNA'}`)
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch(err => { console.error('Fatal:', err); process.exit(1) })
