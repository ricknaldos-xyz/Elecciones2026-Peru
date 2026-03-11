/**
 * Fix integrity scores to include ALL penalty fields from score_breakdowns.
 *
 * Previous scripts only used: penal_penalty, civil_penalties, resignation_penalty, reinfo_penalty
 * Missing fields: company_penalty, voting_penalty, voting_bonus, tax_penalty, omission_penalty
 *
 * This script:
 * 1. Recalculates scores.integrity from ALL breakdown fields for ALL active candidates
 * 2. Syncs integrity across same-DNI candidates (same person, different cargo)
 * 3. Recalculates all weighted composite scores
 * 4. Verifies 0 mismatches
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
  console.log(' FIX INTEGRITY — INCLUDING ALL PENALTY FIELDS')
  console.log('='.repeat(80))

  // Phase 1: Recalculate integrity for ALL candidates from their breakdowns
  console.log('\n--- Phase 1: Recalculate integrity from ALL breakdown fields ---\n')

  const candidates = await sql`
    SELECT c.id, c.full_name, c.cargo, c.dni,
           s.integrity as current_integrity,
           s.competence, s.transparency, s.confidence, s.plan_viability,
           sb.integrity_base,
           sb.penal_penalty, sb.civil_penalties, sb.resignation_penalty, sb.reinfo_penalty,
           sb.company_penalty, sb.voting_penalty, sb.voting_bonus, sb.tax_penalty, sb.omission_penalty
    FROM candidates c
    JOIN scores s ON c.id = s.candidate_id
    JOIN score_breakdowns sb ON c.id = sb.candidate_id
    WHERE c.is_active = true
    ORDER BY c.cargo, c.full_name
  `

  let updated = 0
  let changed = 0

  for (const c of candidates) {
    // Parse civil penalties
    let civilSum = 0
    try {
      const civils = typeof c.civil_penalties === 'string'
        ? JSON.parse(c.civil_penalties)
        : c.civil_penalties || []
      civilSum = civils.reduce((s: number, p: { penalty: number }) => s + (Number(p.penalty) || 0), 0)
    } catch { /* keep 0 */ }

    const newIntegrity = Math.min(100, Math.max(0,
      Number(c.integrity_base || 100)
      - Number(c.penal_penalty || 0)
      - civilSum
      - Number(c.resignation_penalty || 0)
      - Number(c.reinfo_penalty || 0)
      - Number(c.company_penalty || 0)
      - Number(c.voting_penalty || 0)
      + Number(c.voting_bonus || 0)
      - Number(c.tax_penalty || 0)
      - Number(c.omission_penalty || 0)
    ))

    const oldI = Number(c.current_integrity)
    const diff = Math.abs(oldI - newIntegrity)

    if (diff > 0.5) {
      await sql`
        UPDATE scores SET integrity = ${newIntegrity}, updated_at = NOW()
        WHERE candidate_id = ${c.id}
      `
      console.log(`  ⚠ ${c.full_name.substring(0, 38).padEnd(40)} (${c.cargo.padEnd(12)}) I: ${oldI} → ${newIntegrity} (diff=${diff.toFixed(0)})`)
      console.log(`    penalties: penal=-${c.penal_penalty} civil=-${civilSum} resign=-${c.resignation_penalty} reinfo=-${c.reinfo_penalty || 0} company=-${c.company_penalty || 0} voting=-${c.voting_penalty || 0} voting_bonus=+${c.voting_bonus || 0} tax=-${c.tax_penalty || 0} omission=-${c.omission_penalty || 0}`)
      changed++
    }
    updated++
  }

  console.log(`\n  Total: ${updated} candidates checked, ${changed} integrity scores updated`)

  // Phase 2: Sync integrity for same-DNI candidates
  console.log('\n--- Phase 2: Sync same-DNI integrity scores ---\n')

  // For same-DNI candidates, use the presidential score as canonical
  // If no presidential entry, use the most severe (lowest) integrity
  const dniGroups = await sql`
    WITH grouped AS (
      SELECT c.dni,
             array_agg(c.id ORDER BY
               CASE c.cargo WHEN 'presidente' THEN 0 WHEN 'senador' THEN 1 WHEN 'diputado' THEN 2 ELSE 3 END
             ) as ids,
             array_agg(c.full_name ORDER BY
               CASE c.cargo WHEN 'presidente' THEN 0 WHEN 'senador' THEN 1 WHEN 'diputado' THEN 2 ELSE 3 END
             ) as names,
             array_agg(c.cargo ORDER BY
               CASE c.cargo WHEN 'presidente' THEN 0 WHEN 'senador' THEN 1 WHEN 'diputado' THEN 2 ELSE 3 END
             ) as cargos,
             array_agg(s.integrity ORDER BY
               CASE c.cargo WHEN 'presidente' THEN 0 WHEN 'senador' THEN 1 WHEN 'diputado' THEN 2 ELSE 3 END
             ) as integrities
      FROM candidates c
      JOIN scores s ON c.id = s.candidate_id
      WHERE c.is_active = true AND c.dni IS NOT NULL
      GROUP BY c.dni
      HAVING COUNT(*) > 1
    )
    SELECT * FROM grouped
    WHERE NOT (integrities[1] = ALL(integrities))
    ORDER BY dni
  `

  let dniFixed = 0
  for (const g of dniGroups) {
    // Use first entry's integrity (presidential if exists, else first by priority)
    const canonicalIntegrity = g.integrities[0]

    // Check if there's a presidential candidate in the group
    const presIdx = (g.cargos as string[]).indexOf('presidente')
    const useIntegrity = presIdx >= 0 ? g.integrities[presIdx] : Math.min(...(g.integrities as number[]))

    for (let i = 0; i < g.ids.length; i++) {
      if (Number(g.integrities[i]) !== Number(useIntegrity)) {
        await sql`
          UPDATE scores SET integrity = ${useIntegrity}, updated_at = NOW()
          WHERE candidate_id = ${g.ids[i]}
        `
        console.log(`  ⚠ DNI ${g.dni}: ${g.names[i]} (${g.cargos[i]}) I: ${g.integrities[i]} → ${useIntegrity} (synced with ${presIdx >= 0 ? 'presidential' : 'lowest'})`)
        dniFixed++
      }
    }
  }

  console.log(`\n  Total: ${dniGroups.length} DNI groups with inconsistencies, ${dniFixed} scores synced`)

  // Phase 3: Recalculate ALL weighted scores
  console.log('\n--- Phase 3: Recalculate weighted composite scores ---')

  // 3-pillar scores
  await sql`
    UPDATE scores SET
      score_balanced = ROUND((0.30 * competence + 0.30 * integrity + 0.20 * transparency + 0.20 * confidence)::numeric, 1),
      score_merit = ROUND((0.40 * competence + 0.25 * integrity + 0.15 * transparency + 0.20 * confidence)::numeric, 1),
      score_integrity = ROUND((0.25 * competence + 0.40 * integrity + 0.15 * transparency + 0.20 * confidence)::numeric, 1)
    WHERE candidate_id IN (
      SELECT id FROM candidates WHERE is_active = true
    )
  `

  // 4-pillar scores
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

  console.log('  ✓ All weighted scores recalculated')

  // Phase 4: Verify 0 mismatches
  console.log('\n--- Phase 4: Verification ---\n')

  const mismatches = await sql`
    SELECT c.full_name, c.cargo, s.integrity as score_integrity,
           GREATEST(0,
             COALESCE(sb.integrity_base, 100)
             - COALESCE(sb.penal_penalty, 0)
             - COALESCE(sb.resignation_penalty, 0)
             - COALESCE(sb.reinfo_penalty, 0)
             - COALESCE(sb.company_penalty, 0)
             - COALESCE(sb.voting_penalty, 0)
             + COALESCE(sb.voting_bonus, 0)
             - COALESCE(sb.tax_penalty, 0)
             - COALESCE(sb.omission_penalty, 0)
           ) as calc_no_civil,
           sb.civil_penalties
    FROM candidates c
    JOIN scores s ON c.id = s.candidate_id
    JOIN score_breakdowns sb ON c.id = sb.candidate_id
    WHERE c.is_active = true
    ORDER BY c.cargo, c.full_name
  `

  let mismatchCount = 0
  for (const row of mismatches) {
    let civilSum = 0
    try {
      const civils = typeof row.civil_penalties === 'string'
        ? JSON.parse(row.civil_penalties)
        : row.civil_penalties || []
      civilSum = civils.reduce((s: number, p: { penalty: number }) => s + (Number(p.penalty) || 0), 0)
    } catch { /* keep 0 */ }

    const calc = Math.min(100, Math.max(0, Number(row.calc_no_civil) - civilSum))
    const diff = Math.abs(Number(row.score_integrity) - calc)

    if (diff > 0.5) {
      console.log(`  ⚠ ${row.full_name.substring(0, 38).padEnd(40)} (${row.cargo}) stored=${row.score_integrity} calc=${calc} diff=${diff.toFixed(0)}`)
      mismatchCount++
    }
  }

  if (mismatchCount === 0) {
    console.log('  ✓ ALL SCORES MATCH THEIR BREAKDOWNS — 0 mismatches')
  } else {
    console.log(`\n  ⚠ ${mismatchCount} MISMATCHES FOUND`)
  }

  // Phase 5: Presidential ranking
  console.log('\n' + '='.repeat(80))
  console.log(' PRESIDENTIAL RANKING (after fix)')
  console.log('='.repeat(80))

  const ranking = await sql`
    SELECT c.full_name, s.competence, s.integrity, s.transparency,
           s.plan_viability, s.score_balanced, s.score_balanced_p,
           sb.penal_penalty, sb.company_penalty, sb.voting_penalty, sb.voting_bonus
    FROM candidates c
    JOIN scores s ON c.id = s.candidate_id
    LEFT JOIN score_breakdowns sb ON c.id = sb.candidate_id
    WHERE c.cargo = 'presidente' AND c.is_active = true
    ORDER BY COALESCE(s.score_balanced_p, s.score_balanced) DESC
  `

  ranking.forEach((r, i) => {
    const rank = String(i + 1).padStart(2)
    const name = r.full_name.substring(0, 32).padEnd(34)
    const extras = []
    if (Number(r.company_penalty) > 0) extras.push(`comp=-${r.company_penalty}`)
    if (Number(r.voting_penalty) > 0) extras.push(`vot=-${r.voting_penalty}`)
    if (Number(r.voting_bonus) > 0) extras.push(`vot_bonus=+${r.voting_bonus}`)
    const extStr = extras.length > 0 ? ` | ${extras.join(' ')}` : ''
    console.log(`  ${rank}. ${name} C=${String(r.competence).padStart(3)} I=${String(r.integrity).padStart(3)} T=${String(r.transparency).padStart(3)} P=${String(r.plan_viability || '-').padStart(3)} | 3P=${r.score_balanced} 4P=${r.score_balanced_p || '-'}${extStr}`)
  })

  console.log('\n' + '='.repeat(80))
  console.log(` DONE: ${updated} candidates recalculated, ${changed} integrity changed, ${dniFixed} DNI synced`)
  console.log('='.repeat(80))
}

main().catch(console.error)
