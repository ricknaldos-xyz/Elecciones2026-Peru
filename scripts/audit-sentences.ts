import { neon } from '@neondatabase/serverless'
import * as fs from 'fs'
import * as path from 'path'

const envPath = path.join(process.cwd(), '.env.local')
const envContent = fs.readFileSync(envPath, 'utf-8')
const dbMatch = envContent.match(/DATABASE_URL=["']?([^"'\n]+)["']?/)
const sql = neon(dbMatch![1])

async function audit() {
  const all = await sql`
    SELECT full_name, cargo, penal_sentences, civil_sentences
    FROM candidates
    WHERE is_active = true
    AND (
      (penal_sentences IS NOT NULL AND penal_sentences::text != 'null' AND penal_sentences::text != '[]' AND penal_sentences::text != '0')
      OR (civil_sentences IS NOT NULL AND civil_sentences::text != 'null' AND civil_sentences::text != '[]' AND civil_sentences::text != '0')
    )
  `

  let jneSourced = 0
  let manualSourced = 0
  let numericSentences = 0

  const manualCandidates: any[] = []

  for (const c of all) {
    const penal = Array.isArray(c.penal_sentences) ? c.penal_sentences : []
    const civil = Array.isArray(c.civil_sentences) ? c.civil_sentences : []

    if (typeof c.penal_sentences === 'number' || typeof c.civil_sentences === 'number') {
      numericSentences++
      continue
    }

    let hasManual = false
    for (const s of [...penal, ...civil]) {
      const hasCaseNum = s.case_number && s.case_number !== 'NO_CASE'
      const isPJ = s.source === 'poder_judicial'
      if (hasCaseNum || isPJ) {
        hasManual = true
        manualSourced++
      } else {
        jneSourced++
      }
    }

    if (hasManual) {
      manualCandidates.push({
        name: c.full_name,
        cargo: c.cargo,
        penal: penal.filter((s: any) => (s.case_number && s.case_number !== 'NO_CASE') || s.source === 'poder_judicial'),
        civil: civil.filter((s: any) => (s.case_number && s.case_number !== 'NO_CASE') || s.source === 'poder_judicial'),
      })
    }
  }

  console.log('=== AUDIT SUMMARY ===')
  console.log('Total candidates with sentences:', all.length)
  console.log('JNE-sourced sentence records (self-declared):', jneSourced)
  console.log('Manual/placeholder sentence records:', manualSourced)
  console.log('Numeric format (old):', numericSentences)

  console.log('\n=== CANDIDATES WITH MANUAL/PLACEHOLDER DATA ===')
  for (const mc of manualCandidates) {
    console.log(`\n${mc.name} (${mc.cargo}):`)
    for (const p of mc.penal) {
      console.log(`  PENAL: case=${p.case_number} | type=${p.type} | src=${p.source} | ${(p.sentence || '').substring(0, 120)}`)
    }
    for (const cv of mc.civil) {
      console.log(`  CIVIL: case=${cv.case_number} | type=${cv.type} | src=${cv.source} | ${(cv.sentence || '').substring(0, 120)}`)
    }
  }
}

audit().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1) })
