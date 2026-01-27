/**
 * Fix candidates with missing DNIs by cross-referencing with JNE manifest
 * Matches by full name (fuzzy) and updates DNI + jne_org_id
 */

import * as fs from 'fs'
import * as path from 'path'
import {
  createDb,
  CHECKPOINTS_DIR,
} from './lib/scraper-utils'

const sql = createDb()

function normalize(name: string): string {
  return name
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function similarity(a: string, b: string): number {
  const wordsA = normalize(a).split(' ')
  const wordsB = normalize(b).split(' ')

  let matches = 0
  for (const wa of wordsA) {
    if (wordsB.includes(wa)) matches++
  }

  return matches / Math.max(wordsA.length, wordsB.length)
}

async function main() {
  console.log('='.repeat(70))
  console.log(' FIX MISSING DNIs')
  console.log('='.repeat(70))

  // Load manifest
  const manifestPath = path.join(CHECKPOINTS_DIR, 'candidate-manifest.json')
  if (!fs.existsSync(manifestPath)) {
    console.log('\nNo se encontro manifiesto. Ejecute primero scrape-all-candidates-jne.ts')
    return
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))
  console.log(`Manifiesto: ${manifest.length} candidatos`)

  // Get candidates without DNI
  const noDni = await sql`
    SELECT id, full_name, cargo, slug
    FROM candidates
    WHERE is_active = true
    AND (dni IS NULL OR dni = '')
    ORDER BY cargo, full_name
  `

  console.log(`Candidatos sin DNI: ${noDni.length}`)

  if (noDni.length === 0) {
    console.log('\nTodos los candidatos tienen DNI.')
    return
  }

  let fixed = 0
  let notFound = 0

  for (const candidate of noDni) {
    console.log(`\n  [${candidate.cargo}] ${candidate.full_name}`)

    // Find best match in manifest
    let bestMatch: any = null
    let bestScore = 0

    for (const mc of manifest) {
      const score = similarity(candidate.full_name, mc.fullName)
      if (score > bestScore) {
        bestScore = score
        bestMatch = mc
      }
    }

    if (bestMatch && bestScore >= 0.6) {
      console.log(`    Match: ${bestMatch.fullName} (score: ${bestScore.toFixed(2)})`)
      console.log(`    DNI: ${bestMatch.dni}, OrgId: ${bestMatch.orgId}`)

      // Verify no DNI conflict
      const dniConflict = await sql`
        SELECT id, full_name FROM candidates
        WHERE dni = ${bestMatch.dni} AND id != ${candidate.id}::uuid
        LIMIT 1
      `

      if (dniConflict.length > 0) {
        console.log(`    !! DNI ya usado por: ${dniConflict[0].full_name}`)
        notFound++
        continue
      }

      await sql`
        UPDATE candidates SET
          dni = ${bestMatch.dni},
          jne_org_id = ${bestMatch.orgId},
          jne_id = COALESCE(${String(bestMatch.jneId)}, jne_id),
          last_updated = NOW()
        WHERE id = ${candidate.id}::uuid
      `
      fixed++
      console.log(`    OK - DNI actualizado`)
    } else {
      notFound++
      if (bestMatch) {
        console.log(`    Mejor match: ${bestMatch.fullName} (score: ${bestScore.toFixed(2)}) - insuficiente`)
      } else {
        console.log(`    Sin match en manifiesto`)
      }
    }
  }

  console.log('\n' + '='.repeat(70))
  console.log('RESUMEN')
  console.log('='.repeat(70))
  console.log(`  Corregidos: ${fixed}`)
  console.log(`  No encontrados: ${notFound}`)

  // Show remaining
  const stillMissing = await sql`
    SELECT full_name, cargo FROM candidates
    WHERE is_active = true AND (dni IS NULL OR dni = '')
    ORDER BY cargo, full_name
  `

  if (stillMissing.length > 0) {
    console.log(`\nAun sin DNI (${stillMissing.length}):`)
    for (const c of stillMissing) {
      console.log(`  - [${c.cargo}] ${c.full_name}`)
    }
  }
}

main().catch(console.error)
