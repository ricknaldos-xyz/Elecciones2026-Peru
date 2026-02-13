/**
 * Fix remaining audit issues (4-7) after fix-audit-issues.ts completed 1-3
 */
import { neon } from '@neondatabase/serverless'
import * as fs from 'fs'
import * as path from 'path'

const envPath = path.join(process.cwd(), '.env.local')
const envContent = fs.readFileSync(envPath, 'utf-8')
const dbMatch = envContent.match(/DATABASE_URL=["']?([^"'\n]+)["']?/)
if (!dbMatch) throw new Error('No DATABASE_URL found')
const sql = neon(dbMatch[1])

async function fixOrphanedPlanViability() {
  console.log('=== FIX 4: Orphaned plan_viability ===')

  const orphanedParties = await sql`
    SELECT DISTINCT p.id, p.name
    FROM parties p
    JOIN candidates c ON c.party_id = p.id AND c.is_active = true
    WHERE p.id NOT IN (
      SELECT DISTINCT party_id FROM candidates WHERE is_active = true AND cargo = 'presidente' AND party_id IS NOT NULL
    )
  `
  console.log(`Parties without presidential candidate: ${orphanedParties.length}`)
  for (const p of orphanedParties) {
    console.log(`  ${p.name}`)
  }

  if (orphanedParties.length > 0) {
    const partyIds = orphanedParties.map((p: any) => p.id)
    const result = await sql`
      UPDATE scores s
      SET plan_viability = NULL
      WHERE s.candidate_id IN (
        SELECT id FROM candidates
        WHERE is_active = true
        AND party_id = ANY(${partyIds})
      )
      AND s.plan_viability = 50
      RETURNING s.candidate_id
    `
    console.log(`  Set plan_viability=NULL for ${result.length} candidate scores`)
  }
}

async function lookupMissingJneIds() {
  console.log('\n=== FIX 5: Missing JNE IDs ===')

  const missing = await sql`
    SELECT id, full_name, dni, cargo, slug
    FROM candidates
    WHERE is_active = true AND cargo = 'presidente'
    AND (jne_id IS NULL OR jne_id::text = '0' OR jne_id::text = '')
  `
  console.log(`Presidential candidates with missing jne_id: ${missing.length}`)

  for (const c of missing) {
    try {
      const url = `https://web.jne.gob.pe/serviciovotoinformado/api/votoinf/hojavidaall?StrDni=${c.dni}&idProcesoElectoral=152`
      const resp = await fetch(url)
      if (resp.ok) {
        const data = await resp.json()
        if (Array.isArray(data) && data.length > 0) {
          const presEntry = data.find((d: any) =>
            d.strCargoEleccion?.toLowerCase().includes('president')
          ) || data[0]

          if (presEntry?.idHojaVida) {
            await sql`UPDATE candidates SET jne_id = ${String(presEntry.idHojaVida)}::int WHERE id = ${c.id}::uuid`
            console.log(`  ${c.full_name}: jne_id = ${presEntry.idHojaVida}`)
          } else {
            console.log(`  ${c.full_name}: No hojaVida found`)
          }
        } else {
          console.log(`  ${c.full_name}: No results for DNI ${c.dni}`)
        }
      } else {
        console.log(`  ${c.full_name}: API error ${resp.status}`)
      }
    } catch (err: any) {
      console.log(`  ${c.full_name}: Error: ${err.message}`)
    }
    await new Promise(r => setTimeout(r, 500))
  }
}

async function addBelmontConviction() {
  console.log('\n=== FIX 6: Belmont defamation conviction ===')

  const belmont = await sql`
    SELECT id, full_name, cargo, penal_sentences
    FROM candidates WHERE is_active = true AND full_name ILIKE '%BELMONT CASSINELLI%'
  `

  for (const c of belmont) {
    const existing = Array.isArray(c.penal_sentences) ? c.penal_sentences : []
    const hasDefamation = existing.some((s: any) =>
      (s.type || '').includes('difamacion') || (s.sentence || '').includes('Butters')
    )

    if (!hasDefamation) {
      const newSentence = {
        type: 'difamacion_agravada',
        court: 'Poder Judicial',
        source: 'poder_judicial',
        status: 'firme',
        sentence: 'Condenado a 1 año de pena privativa de libertad suspendida por difamación agravada contra el periodista Phillip Butters.',
        case_number: 'Difamación Agravada - Phillip Butters',
        date: '2024-01-01',
        citation: 'La República, Infobae: Sentencia firme por difamación agravada.',
      }
      const updated = [...existing, newSentence]
      await sql`
        UPDATE candidates
        SET penal_sentences = ${JSON.stringify(updated)}::jsonb
        WHERE id = ${c.id}::uuid
      `
      console.log(`  Added for ${c.full_name} (${c.cargo})`)
    } else {
      console.log(`  Already has record for ${c.full_name}`)
    }
  }
}

async function fixNullFields() {
  console.log('\n=== FIX 7: NULL → [] standardization ===')

  const r1 = await sql`
    UPDATE candidates SET political_trajectory = '[]'::jsonb
    WHERE is_active = true AND political_trajectory IS NULL
    RETURNING id
  `
  console.log(`  political_trajectory NULL → []: ${r1.length}`)

  const r2 = await sql`
    UPDATE candidates SET experience_details = '[]'::jsonb
    WHERE is_active = true AND experience_details IS NULL
    RETURNING id
  `
  console.log(`  experience_details NULL → []: ${r2.length}`)

  const r3 = await sql`
    UPDATE candidates SET education_details = '[]'::jsonb
    WHERE is_active = true AND education_details IS NULL
    RETURNING id
  `
  console.log(`  education_details NULL → []: ${r3.length}`)
}

async function main() {
  console.log('=' .repeat(80))
  console.log(' FIX REMAINING AUDIT ISSUES (4-7)')
  console.log('='.repeat(80))

  // fixOrphanedPlanViability already ran successfully (277 fixed)
  await lookupMissingJneIds()
  await addBelmontConviction()
  await fixNullFields()

  console.log('\n' + '='.repeat(80))
  console.log(' ALL REMAINING FIXES DONE')
  console.log('='.repeat(80))
}

main()
  .then(() => process.exit(0))
  .catch(err => { console.error('Fatal:', err); process.exit(1) })
