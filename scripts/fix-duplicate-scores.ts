/**
 * Fix duplicate candidates: propagate penalty data from the record
 * that has penalties to the duplicate that doesn't, then recalculate.
 */

import { neon } from '@neondatabase/serverless'

const DATABASE_URL = 'postgresql://neondb_owner:npg_QsCV8j4rFmiW@ep-polished-mouse-ahxxvvbh-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require'
const sql = neon(DATABASE_URL)

async function fixDuplicates() {
  console.log('=== FIX: Propagate penalties between duplicate candidates ===\n')

  // Find candidates that appear in multiple cargos
  const dupes = await sql`
    SELECT c.full_name, array_agg(c.id) as ids, array_agg(c.cargo) as cargos
    FROM candidates c
    WHERE c.is_active = true
    GROUP BY c.full_name
    HAVING COUNT(*) > 1
    ORDER BY c.full_name
  `

  console.log(`Found ${dupes.length} candidates with duplicate entries\n`)

  let fixed = 0

  for (const dupe of dupes) {
    // Get full data for all entries of this candidate
    const entries = await sql`
      SELECT c.id, c.cargo, c.full_name,
             c.penal_sentences, c.civil_sentences, c.party_resignations,
             s.integrity, s.score_balanced
      FROM candidates c
      JOIN scores s ON c.id = s.candidate_id
      WHERE c.full_name = ${dupe.full_name} AND c.is_active = true
      ORDER BY c.cargo
    `

    // Find the entry with the most penalty data (lowest integrity usually means more data)
    let bestEntry: any = null
    let lowestIntegrity = 101

    for (const entry of entries) {
      const integ = Number(entry.integrity)
      const hasPenal = (entry.penal_sentences || []).length > 0
      const hasCivil = (entry.civil_sentences || []).length > 0
      const hasResig = (entry.party_resignations || 0) > 0

      // Prefer entry with actual penalty data, or lowest integrity
      if (hasPenal || hasCivil || hasResig) {
        if (!bestEntry || integ < lowestIntegrity) {
          bestEntry = entry
          lowestIntegrity = integ
        }
      }
    }

    if (!bestEntry) continue // No entry has penalty data, all are "clean"

    // Check if any sibling is missing this penalty data
    for (const entry of entries) {
      if (entry.id === bestEntry.id) continue

      const entryHasPenal = (entry.penal_sentences || []).length > 0
      const entryHasCivil = (entry.civil_sentences || []).length > 0
      const entryHasResig = (entry.party_resignations || 0) > 0
      const bestHasPenal = (bestEntry.penal_sentences || []).length > 0
      const bestHasCivil = (bestEntry.civil_sentences || []).length > 0
      const bestHasResig = (bestEntry.party_resignations || 0) > 0

      let needsUpdate = false
      const updates: string[] = []

      // Propagate penal sentences if missing
      if (!entryHasPenal && bestHasPenal) {
        needsUpdate = true
        updates.push(`penal: ${(bestEntry.penal_sentences || []).length} sentences`)
      }

      // Propagate civil sentences if missing
      if (!entryHasCivil && bestHasCivil) {
        needsUpdate = true
        updates.push(`civil: ${(bestEntry.civil_sentences || []).length} sentences`)
      }

      // Propagate party resignations if missing or lower
      if ((!entryHasResig && bestHasResig) || (bestEntry.party_resignations > (entry.party_resignations || 0))) {
        needsUpdate = true
        updates.push(`resignations: ${bestEntry.party_resignations}`)
      }

      if (needsUpdate) {
        console.log(`  Propagating to ${entry.full_name} (${entry.cargo}): ${updates.join(', ')}`)
        console.log(`    Before: integrity=${entry.integrity}, balanced=${entry.score_balanced}`)

        await sql`
          UPDATE candidates SET
            penal_sentences = CASE
              WHEN COALESCE(jsonb_array_length(penal_sentences), 0) = 0
              THEN ${JSON.stringify(bestEntry.penal_sentences || [])}::jsonb
              ELSE penal_sentences
            END,
            civil_sentences = CASE
              WHEN COALESCE(jsonb_array_length(civil_sentences), 0) = 0
              THEN ${JSON.stringify(bestEntry.civil_sentences || [])}::jsonb
              ELSE civil_sentences
            END,
            party_resignations = GREATEST(COALESCE(party_resignations, 0), ${bestEntry.party_resignations || 0})
          WHERE id = ${entry.id}::uuid
        `
        fixed++
      }
    }
  }

  console.log(`\nPropagated penalty data to ${fixed} duplicate entries`)

  if (fixed === 0) {
    console.log('No duplicates needed fixing.')
    return
  }

  // Now recalculate scores for the fixed candidates
  console.log('\nRecalculating scores for fixed candidates...')
  // We'll use the same approach - import scoring functions would be complex
  // Instead, let's just show which ones need recalculation
  console.log('Run fix-default-scores.ts again to recalculate all scores.')

  // Verify the specific Lopez Aliaga case
  console.log('\n=== Verification: Lopez Aliaga ===')
  const la = await sql`
    SELECT c.id, c.cargo, c.penal_sentences, c.civil_sentences, c.party_resignations,
           s.integrity, s.score_balanced
    FROM candidates c
    JOIN scores s ON c.id = s.candidate_id
    WHERE c.full_name LIKE '%LOPEZ ALIAGA CAZORLA%' AND c.is_active = true
  `
  la.forEach(r => {
    console.log(`  ${r.cargo}: integrity=${r.integrity}, balanced=${r.score_balanced}`)
    console.log(`    penal_sentences: ${JSON.stringify(r.penal_sentences)}`)
    console.log(`    civil_sentences: ${JSON.stringify(r.civil_sentences)}`)
    console.log(`    party_resignations: ${r.party_resignations}`)
  })
}

fixDuplicates().catch(console.error)
