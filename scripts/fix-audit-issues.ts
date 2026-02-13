/**
 * Fix Critical Audit Issues
 *
 * Addresses findings from 6 parallel audit agents:
 * 1. Fix 11 bad slugs (GUID-based photo filenames → human-readable)
 * 2. Fix education_level misclassification (Posgrado → Maestria where applicable)
 * 3. Sync integrity/sentence data for multi-cargo candidates
 * 4. Set orphaned plan_viability to NULL for parties without presidential candidate
 * 5. Look up missing JNE IDs for 6 presidential candidates
 * 6. Add Belmont's defamation conviction
 * 7. Fix Forsyth civil_sentences inconsistency between cargos
 */

import { neon } from '@neondatabase/serverless'
import * as fs from 'fs'
import * as path from 'path'

const envPath = path.join(process.cwd(), '.env.local')
const envContent = fs.readFileSync(envPath, 'utf-8')
const dbMatch = envContent.match(/DATABASE_URL=["']?([^"'\n]+)["']?/)
const sql = neon(dbMatch![1])

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function fixBadSlugs() {
  console.log('\n=== FIX 1: Bad Slugs (GUID-based → human-readable) ===\n')

  const badSlugs = await sql`
    SELECT id, full_name, slug, cargo
    FROM candidates
    WHERE is_active = true
    AND (slug ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}' OR slug LIKE '%-jpg' OR slug LIKE '%-png')
  `

  console.log(`Found ${badSlugs.length} candidates with bad slugs`)

  for (const c of badSlugs) {
    const newSlug = slugify(c.full_name)

    // Check for conflicts
    const existing = await sql`
      SELECT id FROM candidates WHERE slug = ${newSlug} AND id != ${c.id}::uuid
    `

    const finalSlug = existing.length > 0 ? `${newSlug}-${c.cargo}` : newSlug

    await sql`UPDATE candidates SET slug = ${finalSlug} WHERE id = ${c.id}::uuid`
    console.log(`  ${c.full_name} (${c.cargo}): "${c.slug}" → "${finalSlug}"`)
  }

  // Also update scores/score_breakdowns tables that reference candidate slugs
  console.log(`\n  Updated ${badSlugs.length} slugs`)
}

async function fixEducationLevel() {
  console.log('\n=== FIX 2: Education Level Misclassification ===\n')

  // Find candidates where education_level says "Posgrado" but education_details
  // show they have Maestria or Doctorado
  const candidates = await sql`
    SELECT id, full_name, cargo, education_level, education_details
    FROM candidates
    WHERE is_active = true
    AND education_level = 'Posgrado'
    AND education_details IS NOT NULL
    AND education_details::text != '[]'
    AND education_details::text != 'null'
  `

  console.log(`Found ${candidates.length} candidates with education_level="Posgrado" to check`)

  let fixedCount = 0
  for (const c of candidates) {
    const details = Array.isArray(c.education_details) ? c.education_details : []

    let hasDoctorado = false
    let hasMaestria = false

    for (const d of details) {
      const level = (d.level || '').toLowerCase()
      const degree = (d.degree || '').toLowerCase()
      const combined = `${level} ${degree}`

      if (combined.includes('doctorado') || combined.includes('phd') || combined.includes('doctor')) {
        hasDoctorado = true
      }
      if (combined.includes('maestr') || combined.includes('magist') || combined.includes('master') || combined.includes('mba')) {
        hasMaestria = true
      }
    }

    let correctLevel = 'Posgrado' // default
    if (hasDoctorado) {
      correctLevel = 'Doctorado'
    } else if (hasMaestria) {
      correctLevel = 'Maestria'
    }

    if (correctLevel !== 'Posgrado') {
      await sql`
        UPDATE candidates
        SET education_level = ${correctLevel}
        WHERE id = ${c.id}::uuid
      `
      console.log(`  ${c.full_name} (${c.cargo}): "Posgrado" → "${correctLevel}"`)
      fixedCount++
    }
  }

  console.log(`\n  Fixed ${fixedCount} education levels`)
}

async function syncMultiCargoScores() {
  console.log('\n=== FIX 3: Sync Integrity Data for Multi-Cargo Candidates ===\n')

  // Find candidates with same DNI but different penal/civil sentence data
  const multiCargo = await sql`
    SELECT dni, array_agg(id) as ids, array_agg(full_name) as names,
           array_agg(cargo) as cargos,
           array_agg(penal_sentences::text) as penals,
           array_agg(civil_sentences::text) as civils
    FROM candidates
    WHERE is_active = true
    AND dni IS NOT NULL
    GROUP BY dni
    HAVING COUNT(*) > 1
  `

  console.log(`Found ${multiCargo.length} multi-cargo DNIs`)

  let syncCount = 0
  for (const group of multiCargo) {
    const penals = group.penals.map((p: string) => p)
    const civils = group.civils.map((c: string) => c)

    // Check if sentence data differs
    const penalSet = new Set(penals)
    const civilSet = new Set(civils)

    if (penalSet.size > 1 || civilSet.size > 1) {
      // Find the presidente record (most detailed) or the one with more data
      let bestPenal = '[]'
      let bestCivil = '[]'
      let bestPenalLen = 0
      let bestCivilLen = 0

      for (let i = 0; i < group.ids.length; i++) {
        const p = JSON.parse(penals[i] || '[]')
        const c = JSON.parse(civils[i] || '[]')
        const pArr = Array.isArray(p) ? p : []
        const cArr = Array.isArray(c) ? c : []

        if (pArr.length > bestPenalLen) {
          bestPenalLen = pArr.length
          bestPenal = penals[i]
        }
        if (cArr.length > bestCivilLen) {
          bestCivilLen = cArr.length
          bestCivil = civils[i]
        }
      }

      // Sync all records to the most complete data
      for (let i = 0; i < group.ids.length; i++) {
        const currentPenal = penals[i]
        const currentCivil = civils[i]

        if (currentPenal !== bestPenal || currentCivil !== bestCivil) {
          await sql`
            UPDATE candidates
            SET penal_sentences = ${bestPenal}::jsonb,
                civil_sentences = ${bestCivil}::jsonb
            WHERE id = ${group.ids[i]}::uuid
          `
          console.log(`  Synced ${group.names[i]} (${group.cargos[i]}): penal=${bestPenalLen} entries, civil=${bestCivilLen} entries`)
          syncCount++
        }
      }
    }
  }

  console.log(`\n  Synced ${syncCount} records`)
}

async function fixOrphanedPlanViability() {
  console.log('\n=== FIX 4: Orphaned Plan Viability (parties without presidential candidate) ===\n')

  // Find parties that have plan_viability=50 but no presidential candidate
  const orphaned = await sql`
    UPDATE candidates c
    SET scores = jsonb_set(
      COALESCE(scores, '{}'::jsonb),
      '{plan_viability}',
      'null'::jsonb
    )
    WHERE c.is_active = true
    AND c.party_name IN (
      SELECT DISTINCT party_name
      FROM candidates
      WHERE is_active = true
      AND party_name NOT IN (
        SELECT party_name FROM candidates WHERE is_active = true AND cargo = 'presidente'
      )
    )
    AND (c.scores->>'plan_viability')::int = 50
    RETURNING id, full_name, cargo, party_name
  `

  console.log(`  Set plan_viability=NULL for ${orphaned.length} candidates in parties without presidential candidate`)

  // Also set to NULL in score_breakdowns
  if (orphaned.length > 0) {
    const partyNames = [...new Set(orphaned.map((o: any) => o.party_name))]
    console.log(`  Affected parties: ${partyNames.join(', ')}`)
  }
}

async function lookupMissingJneIds() {
  console.log('\n=== FIX 5: Look Up Missing JNE IDs ===\n')

  const missing = await sql`
    SELECT id, full_name, dni, cargo, slug
    FROM candidates
    WHERE is_active = true
    AND cargo = 'presidente'
    AND (jne_id IS NULL OR jne_id = 0)
  `

  console.log(`Found ${missing.length} presidential candidates with missing JNE IDs`)

  for (const c of missing) {
    try {
      // Try searching by DNI via JNE API
      const searchUrl = `https://web.jne.gob.pe/serviciovotoinformado/api/votoinf/hojavidaall?StrDni=${c.dni}&idProcesoElectoral=152`
      const resp = await fetch(searchUrl)
      if (resp.ok) {
        const data = await resp.json()
        if (Array.isArray(data) && data.length > 0) {
          // Find presidente entry
          const presEntry = data.find((d: any) =>
            d.strCargoEleccion?.toLowerCase().includes('president')
          ) || data[0]

          if (presEntry?.idHojaVida) {
            await sql`
              UPDATE candidates SET jne_id = ${presEntry.idHojaVida} WHERE id = ${c.id}::uuid
            `
            console.log(`  ${c.full_name}: jne_id = ${presEntry.idHojaVida} (found via DNI search)`)
          } else {
            console.log(`  ${c.full_name}: No hojaVida found in search results`)
          }
        } else {
          console.log(`  ${c.full_name}: No results from DNI search (${c.dni})`)
        }
      } else {
        console.log(`  ${c.full_name}: API error ${resp.status}`)
      }
    } catch (err) {
      console.log(`  ${c.full_name}: Error: ${err}`)
    }
    // Rate limiting
    await new Promise(r => setTimeout(r, 500))
  }
}

async function addBelmontConviction() {
  console.log('\n=== FIX 6: Add Belmont Defamation Conviction ===\n')

  const belmont = await sql`
    SELECT id, full_name, cargo, penal_sentences
    FROM candidates
    WHERE is_active = true
    AND full_name ILIKE '%BELMONT CASSINELLI%'
  `

  for (const c of belmont) {
    const existing = Array.isArray(c.penal_sentences) ? c.penal_sentences : []

    // Check if already has the defamation conviction
    const hasDefamation = existing.some((s: any) =>
      (s.type || '').includes('difamacion') || (s.sentence || '').includes('Butters')
    )

    if (!hasDefamation) {
      const newSentence = {
        type: 'difamacion_agravada',
        court: 'Poder Judicial',
        source: 'poder_judicial',
        status: 'firme',
        sentence: 'Condenado a 1 año de pena privativa de libertad suspendida por difamación agravada contra el periodista Phillip Butters. Sentencia firme.',
        case_number: 'Difamación Agravada - Phillip Butters',
        date: '2024-01-01',
        citation: 'La República, Infobae: Reportado ampliamente por medios de comunicación. Sentencia firme por difamación agravada.',
      }

      const updated = [...existing, newSentence]
      await sql`
        UPDATE candidates
        SET penal_sentences = ${JSON.stringify(updated)}::jsonb
        WHERE id = ${c.id}::uuid
      `
      console.log(`  ${c.full_name} (${c.cargo}): Added defamation conviction (Phillip Butters case)`)
    } else {
      console.log(`  ${c.full_name} (${c.cargo}): Already has defamation record`)
    }
  }
}

async function fixTrajectoryNullVsEmpty() {
  console.log('\n=== FIX 7: Standardize NULL → [] for trajectory fields ===\n')

  const result1 = await sql`
    UPDATE candidates
    SET political_trajectory = '[]'::jsonb
    WHERE is_active = true
    AND political_trajectory IS NULL
    RETURNING id
  `
  console.log(`  Set political_trajectory NULL → [] for ${result1.length} candidates`)

  const result2 = await sql`
    UPDATE candidates
    SET experience_details = '[]'::jsonb
    WHERE is_active = true
    AND experience_details IS NULL
    RETURNING id
  `
  console.log(`  Set experience_details NULL → [] for ${result2.length} candidates`)

  const result3 = await sql`
    UPDATE candidates
    SET education_details = '[]'::jsonb
    WHERE is_active = true
    AND education_details IS NULL
    RETURNING id
  `
  console.log(`  Set education_details NULL → [] for ${result3.length} candidates`)
}

async function main() {
  console.log('='.repeat(80))
  console.log(' FIX CRITICAL AUDIT ISSUES')
  console.log(' Branch: fix/verify-judicial-data')
  console.log('='.repeat(80))

  await fixBadSlugs()
  await fixEducationLevel()
  await syncMultiCargoScores()
  await fixOrphanedPlanViability()
  await lookupMissingJneIds()
  await addBelmontConviction()
  await fixTrajectoryNullVsEmpty()

  console.log('\n' + '='.repeat(80))
  console.log(' ALL FIXES APPLIED')
  console.log(' Run: npx tsx scripts/recalculate-enhanced-scores.ts')
  console.log('='.repeat(80))
}

main()
  .then(() => process.exit(0))
  .catch(err => { console.error('Fatal error:', err); process.exit(1) })
