/**
 * Fix plan_viability scores to be consistent with breakdowns.
 *
 * Problem: scores.plan_viability was set by a different normalization than
 * the breakdown sub-scores. The source data (plan_viability_analysis) uses
 * a 1-10 scale. Breakdowns use sub_score × 10 (0-100). But scores.plan_viability
 * used a different formula, causing inconsistency.
 *
 * Fix: scores.plan_viability = overall_viability_score × 10
 * This makes it consistent with breakdown sub-scores.
 *
 * Also propagates corrected plan_viability to non-presidential party members.
 */
import * as fs from 'fs'
import * as path from 'path'
import { neon } from '@neondatabase/serverless'

function loadEnv(): string {
  const envPath = path.join(process.cwd(), '.env.local')
  const content = fs.readFileSync(envPath, 'utf-8')
  const match = content.match(/DATABASE_URL=["']?([^"'\n]+)["']?/)
  if (match) return match[1]
  throw new Error('DATABASE_URL not found')
}

const sql = neon(loadEnv())

async function main() {
  console.log('='.repeat(80))
  console.log(' FIX PLAN VIABILITY — CONSISTENT WITH BREAKDOWNS')
  console.log('='.repeat(80))

  // Phase 1: Fix presidential candidates' plan_viability
  console.log('\n--- Phase 1: Fix presidential plan_viability from plan_viability_analysis ---\n')

  const presidential = await sql`
    SELECT c.id, c.full_name, c.party_id,
           s.plan_viability as current_pv,
           pva.overall_viability_score as pva_overall,
           pva.fiscal_viability_score as pva_fiscal,
           pva.legal_viability_score as pva_legal,
           pva.coherence_score as pva_coherence,
           pva.historical_score as pva_historical
    FROM candidates c
    JOIN scores s ON c.id = s.candidate_id
    LEFT JOIN plan_viability_analysis pva ON c.id = pva.candidate_id
    WHERE c.cargo = 'presidente' AND c.is_active = true
    ORDER BY c.full_name
  `

  let presFixed = 0
  const partyPvMap = new Map<string, number>() // party_id -> correct PV

  for (const r of presidential) {
    if (r.pva_overall == null) {
      console.log(`  - ${r.full_name.substring(0, 38).padEnd(40)} NO plan_viability_analysis`)
      continue
    }

    const correctPv = Math.round(Number(r.pva_overall) * 10)
    const currentPv = Number(r.current_pv)
    const diff = Math.abs(currentPv - correctPv)

    // Store party mapping
    if (r.party_id) {
      partyPvMap.set(r.party_id, correctPv)
    }

    if (diff > 0) {
      await sql`
        UPDATE scores SET plan_viability = ${correctPv}, updated_at = NOW()
        WHERE candidate_id = ${r.id}
      `

      // Also fix the breakdown overall to match
      await sql`
        UPDATE score_breakdowns SET
          plan_viability_overall = ${correctPv},
          plan_viability_fiscal = ${Math.round(Number(r.pva_fiscal) * 10)},
          plan_viability_legal = ${Math.round(Number(r.pva_legal) * 10)},
          plan_viability_coherence = ${Math.round(Number(r.pva_coherence) * 10)},
          plan_viability_historical = ${Math.round(Number(r.pva_historical) * 10)}
        WHERE candidate_id = ${r.id}
      `

      console.log(`  ⚠ ${r.full_name.substring(0, 38).padEnd(40)} PV: ${currentPv} → ${correctPv} (pva=${r.pva_overall})`)
      presFixed++
    } else {
      console.log(`  ✓ ${r.full_name.substring(0, 38).padEnd(40)} PV: ${currentPv} (correct)`)
    }
  }

  console.log(`\n  Presidential: ${presFixed} fixed`)

  // Phase 2: Propagate to party members (non-presidential)
  console.log('\n--- Phase 2: Propagate plan_viability to party members ---\n')

  let memberFixed = 0
  for (const [partyId, correctPv] of partyPvMap) {
    const result = await sql`
      UPDATE scores SET plan_viability = ${correctPv}, updated_at = NOW()
      WHERE candidate_id IN (
        SELECT id FROM candidates
        WHERE party_id = ${partyId} AND is_active = true AND cargo != 'presidente'
      )
      AND plan_viability != ${correctPv}
      RETURNING candidate_id
    `

    // Also update breakdowns
    if (result.length > 0) {
      await sql`
        UPDATE score_breakdowns SET plan_viability_overall = ${correctPv}
        WHERE candidate_id IN (
          SELECT id FROM candidates
          WHERE party_id = ${partyId} AND is_active = true AND cargo != 'presidente'
        )
      `
    }

    if (result.length > 0) {
      const partyName = await sql`SELECT name FROM parties WHERE id = ${partyId} LIMIT 1`
      console.log(`  ⚠ ${(partyName[0]?.name || partyId).substring(0, 50).padEnd(52)} ${result.length} members → PV=${correctPv}`)
      memberFixed += result.length
    }
  }

  console.log(`\n  Members: ${memberFixed} fixed`)

  // Phase 3: Recalculate 4-pillar weighted scores for ALL candidates
  console.log('\n--- Phase 3: Recalculate 4-pillar weighted scores ---')

  await sql`
    UPDATE scores SET
      score_balanced_p = ROUND((0.30 * competence + 0.30 * integrity + 0.10 * transparency + 0.30 * plan_viability)::numeric, 1),
      score_merit_p = ROUND((0.40 * competence + 0.25 * integrity + 0.10 * transparency + 0.25 * plan_viability)::numeric, 1),
      score_integrity_p = ROUND((0.25 * competence + 0.40 * integrity + 0.10 * transparency + 0.25 * plan_viability)::numeric, 1)
    WHERE candidate_id IN (
      SELECT id FROM candidates WHERE is_active = true
    )
    AND plan_viability IS NOT NULL
  `

  console.log('  ✓ All 4-pillar weighted scores recalculated')

  // Phase 4: Verification
  console.log('\n--- Phase 4: Verify presidential PV consistency ---\n')

  const verify = await sql`
    SELECT c.full_name, s.plan_viability,
           sb.plan_viability_overall, sb.plan_viability_fiscal,
           sb.plan_viability_legal, sb.plan_viability_coherence, sb.plan_viability_historical,
           s.score_balanced_p, s.competence, s.integrity, s.transparency
    FROM candidates c
    JOIN scores s ON c.id = s.candidate_id
    LEFT JOIN score_breakdowns sb ON c.id = sb.candidate_id
    WHERE c.cargo = 'presidente' AND c.is_active = true
    ORDER BY COALESCE(s.score_balanced_p, s.score_balanced) DESC
  `

  let mismatchCount = 0
  for (const r of verify) {
    const pv = Number(r.plan_viability)
    const sbOverall = Number(r.plan_viability_overall)
    const diff = Math.abs(pv - sbOverall)

    // Verify 4P score
    const expectedBalP = Math.round((0.30 * Number(r.competence) + 0.30 * Number(r.integrity) + 0.10 * Number(r.transparency) + 0.30 * pv) * 10) / 10
    const balPDiff = Math.abs(Number(r.score_balanced_p) - expectedBalP)

    const marker = (diff > 0.5 || balPDiff > 0.2) ? '⚠' : '✓'
    if (diff > 0.5 || balPDiff > 0.2) mismatchCount++

    const name = r.full_name.substring(0, 35).padEnd(37)
    console.log(`  ${marker} ${name} PV=${String(pv).padStart(2)} sb_overall=${sbOverall} | F=${r.plan_viability_fiscal} L=${r.plan_viability_legal} C=${r.plan_viability_coherence} H=${r.plan_viability_historical} | 4P_bal=${r.score_balanced_p}`)
  }

  if (mismatchCount === 0) {
    console.log('\n  ✓ ALL PLAN VIABILITY SCORES CONSISTENT — 0 mismatches')
  } else {
    console.log(`\n  ⚠ ${mismatchCount} MISMATCHES`)
  }

  // Phase 5: Final ranking
  console.log('\n' + '='.repeat(80))
  console.log(' PRESIDENTIAL RANKING (4-pillar)')
  console.log('='.repeat(80))

  const ranking = await sql`
    SELECT c.full_name, s.competence, s.integrity, s.transparency,
           s.plan_viability, s.score_balanced_p
    FROM candidates c
    JOIN scores s ON c.id = s.candidate_id
    WHERE c.cargo = 'presidente' AND c.is_active = true
    ORDER BY COALESCE(s.score_balanced_p, s.score_balanced) DESC
  `

  ranking.forEach((r, i) => {
    const rank = String(i + 1).padStart(2)
    const name = r.full_name.substring(0, 35).padEnd(37)
    console.log(`  ${rank}. ${name} C=${String(r.competence).padStart(3)} I=${String(r.integrity).padStart(3)} T=${String(r.transparency).padStart(3)} PV=${String(r.plan_viability).padStart(3)} | 4P=${r.score_balanced_p}`)
  })

  console.log('\n' + '='.repeat(80))
  console.log(` DONE: ${presFixed} presidential + ${memberFixed} members fixed`)
  console.log('='.repeat(80))
}

main().catch(console.error)
