/**
 * Fix VIZCARRA CORNEJO MARIO ENRIQUE data contamination.
 *
 * The presidente entry has been contaminated with MARTÍN VIZCARRA CORNEJO's
 * (his brother, ex-president 2018-2020) political trajectory and criminal records.
 *
 * Entries to REMOVE from presidente:
 * - Political: Gobernador Regional (2011-2014), Vicepresidente (2016-2018),
 *   Ministro MTC (2016-2017), Presidente (2018-2020) — all Martín's
 * - Penal: LOMAS-ILO-2020 (Lava Jato), HOSPITAL-MOQ-2021 — both Martín's
 *
 * Entry to KEEP:
 * - Political: Miembro Comisión Política Nacional (JNE source) — Mario's party role
 * - Penal: 015-05 (peculado CTAR Moquegua 2001) — Mario's own case as CTAR president
 */

import { neon } from '@neondatabase/serverless'
import * as fs from 'fs'
import * as path from 'path'

const envPath = path.join(process.cwd(), '.env.local')
const envContent = fs.readFileSync(envPath, 'utf-8')
const dbMatch = envContent.match(/DATABASE_URL=["']?([^"'\n]+)["']?/)
const DATABASE_URL = dbMatch ? dbMatch[1] : process.env.DATABASE_URL!
const sql = neon(DATABASE_URL)

async function main() {
  console.log('=== Fixing VIZCARRA CORNEJO MARIO ENRIQUE data ===\n')

  const presId = '07dfd759-9af2-4250-b1e7-c3d004035e5e'

  // Get current data
  const row = (await sql`
    SELECT political_trajectory, penal_sentences
    FROM candidates WHERE id = ${presId}::uuid
  `)[0]

  // 1. Fix political_trajectory
  const pt = row.political_trajectory as any[]
  const cleanPt = pt.filter((entry: any) => entry.source === 'jne')

  console.log(`Political trajectory: ${pt.length} entries -> ${cleanPt.length} (removed Martín's entries)`)
  for (const entry of pt) {
    if (entry.source !== 'jne') {
      console.log(`  REMOVED: ${entry.position} (${entry.year_start}-${entry.year_end || '?'}) [${entry.source}]`)
    } else {
      console.log(`  KEPT:    ${entry.position} [${entry.source}]`)
    }
  }

  // 2. Fix penal_sentences
  const ps = row.penal_sentences as any[]
  // Keep only case 015-05 (Mario's CTAR case)
  const cleanPs = ps.filter((entry: any) => {
    const caseNum = entry.case_number || entry.expediente || ''
    return caseNum === '015-05'
  })

  console.log(`\nPenal sentences: ${ps.length} entries -> ${cleanPs.length} (removed Martín's cases)`)
  for (const entry of ps) {
    const caseNum = entry.case_number || entry.expediente || ''
    if (caseNum === '015-05') {
      console.log(`  KEPT:    ${caseNum} - ${entry.type || 'peculado'} (Mario's CTAR case)`)
    } else {
      console.log(`  REMOVED: ${caseNum} - ${entry.type} (Martín's case)`)
    }
  }

  // Ensure the kept entry has proper details
  if (cleanPs.length > 0) {
    cleanPs[0] = {
      date: '2005-10-01',
      type: 'peculado',
      court: 'Sala Mixta de la Corte Superior de Justicia de Moquegua',
      source: 'poder_judicial',
      status: 'firme',
      sentence: 'Como presidente del CTAR Moquegua (2001), cobró doble remuneración: sueldo estatal y honorarios del PNUD. Condena: 3 años de prisión suspendida y S/3,000 reparación civil.',
      case_number: '015-05',
    }
  }

  // 3. Apply updates
  await sql`
    UPDATE candidates
    SET political_trajectory = ${JSON.stringify(cleanPt)}::jsonb,
        penal_sentences = ${JSON.stringify(cleanPs)}::jsonb
    WHERE id = ${presId}::uuid
  `
  console.log('\nUpdated presidente entry.')

  // 4. Verify both entries
  const senId = '15185048-adb9-44cf-b127-ed933b0e6ff0'
  for (const id of [presId, senId]) {
    const v = (await sql`
      SELECT full_name, cargo, political_trajectory, penal_sentences
      FROM candidates WHERE id = ${id}::uuid
    `)[0]
    const ptArr = v.political_trajectory as any[] || []
    const psArr = v.penal_sentences as any[] || []
    console.log(`\n${v.full_name} (${v.cargo}):`)
    console.log(`  Political: ${ptArr.length} entries`)
    for (const e of ptArr) {
      console.log(`    - ${e.position} [${e.source}]`)
    }
    console.log(`  Penal: ${psArr.length} entries`)
    for (const e of psArr) {
      console.log(`    - ${e.case_number || e.expediente} ${e.type || e.delito || '(sin tipo)'}`)
    }
  }

  // 5. Also deactivate the mock entry if it exists
  const mockId = '22222222-2222-2222-2222-222222220030'
  const mockCheck = await sql`SELECT id, full_name, is_active FROM candidates WHERE id = ${mockId}::uuid`
  if (mockCheck.length > 0 && mockCheck[0].is_active) {
    await sql`UPDATE candidates SET is_active = false WHERE id = ${mockId}::uuid`
    console.log(`\nDeactivated mock entry: ${mockCheck[0].full_name}`)
  } else if (mockCheck.length > 0) {
    console.log(`\nMock entry already inactive: ${mockCheck[0].full_name}`)
  }

  console.log('\nDone!')
}

main().catch(console.error)
