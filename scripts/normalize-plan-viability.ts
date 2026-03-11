/**
 * Normalize plan_viability scores to a fair 30-80 range
 *
 * Problem: Gemini scored plans on 1-10 scale (actual range 1.3-5.0),
 * then multiplied by 10 → 13-50 on 0-100 scale.
 * With 30% weight in 4P formula, this dragged ALL scores down ~10 points.
 *
 * Solution: Min-max normalize within observed range, stretched to 30-80.
 * This preserves Gemini's relative ordering while making the scale
 * comparable to other pillars (C: 42-85, I: 5-90, T: 35-80).
 *
 * Formula: pv_new = round(30 + ((raw_overall - MIN) / (MAX - MIN)) * 50)
 * where MIN=1.3, MAX=5.0 (from plan_viability_analysis)
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

// Raw Gemini overall_viability_score (1-10 scale) for each party
const RAW_MIN = 1.3
const RAW_MAX = 5.0
const TARGET_MIN = 30
const TARGET_MAX = 80

function normalize(raw: number): number {
  const clamped = Math.max(RAW_MIN, Math.min(RAW_MAX, raw))
  return Math.round(TARGET_MIN + ((clamped - RAW_MIN) / (RAW_MAX - RAW_MIN)) * (TARGET_MAX - TARGET_MIN))
}

async function main() {
  console.log('='.repeat(70))
  console.log(' NORMALIZANDO PLAN VIABILITY: 13-50 → 30-80')
  console.log('='.repeat(70))

  // Get all plan_viability_analysis linked by candidate_id
  const analyses = await sql`
    SELECT pv.candidate_id, pv.overall_viability_score, c.full_name, c.party_id
    FROM plan_viability_analysis pv
    JOIN candidates c ON c.id = pv.candidate_id
    ORDER BY pv.overall_viability_score DESC
  `

  console.log(`\n  Encontrados ${analyses.length} análisis de planes`)
  console.log(`  Rango Gemini: ${RAW_MIN}-${RAW_MAX} → Normalizado: ${TARGET_MIN}-${TARGET_MAX}\n`)

  // Build candidate_id → normalized score map
  const candidateScores = new Map<string, { raw: number, normalized: number, name: string }>()
  for (const a of analyses) {
    const raw = Number(a.overall_viability_score)
    const normalized = normalize(raw)
    candidateScores.set(a.candidate_id, { raw, normalized, name: a.full_name })
    console.log(`  ${a.full_name.substring(0, 40).padEnd(42)} ${raw.toFixed(1)}/10 → ${String(normalized).padStart(2)}/100`)
  }

  // Update scores.plan_viability for all presidential candidates
  console.log('\n' + '='.repeat(70))
  console.log(' ACTUALIZANDO SCORES TABLE')
  console.log('='.repeat(70))

  let updated = 0
  const candidates = await sql`
    SELECT c.id, c.full_name, s.plan_viability as old_pv
    FROM candidates c
    JOIN scores s ON c.id = s.candidate_id
    WHERE c.cargo = 'presidente' AND c.is_active = true
    ORDER BY c.full_name
  `

  for (const c of candidates) {
    const data = candidateScores.get(c.id)
    if (!data) {
      console.log(`  ✗ ${c.full_name.substring(0, 40)} - sin análisis de plan`)
      continue
    }

    const newPV = data.normalized
    const oldPV = Number(c.old_pv)

    await sql`
      UPDATE scores SET
        plan_viability = ${newPV},
        updated_at = NOW()
      WHERE candidate_id = ${c.id}
    `

    const diff = newPV - oldPV
    const arrow = diff > 0 ? '↑' : diff < 0 ? '↓' : '='
    console.log(`  ✓ ${c.full_name.substring(0, 40).padEnd(42)} PV: ${String(oldPV).padStart(2)} → ${String(newPV).padStart(2)} (${arrow}${Math.abs(diff)})`)
    updated++
  }

  // Recalculate 4-pillar scores
  console.log('\n' + '='.repeat(70))
  console.log(' RECALCULANDO SCORES 4 PILARES')
  console.log(' balanced_p = 0.30C + 0.30I + 0.10T + 0.30P')
  console.log(' merit_p    = 0.40C + 0.25I + 0.10T + 0.25P')
  console.log(' integrity_p= 0.25C + 0.40I + 0.10T + 0.25P')
  console.log('='.repeat(70))

  await sql`
    UPDATE scores SET
      score_balanced_p = ROUND((0.30 * competence + 0.30 * integrity + 0.10 * transparency + 0.30 * plan_viability)::numeric, 1),
      score_merit_p = ROUND((0.40 * competence + 0.25 * integrity + 0.10 * transparency + 0.25 * plan_viability)::numeric, 1),
      score_integrity_p = ROUND((0.25 * competence + 0.40 * integrity + 0.10 * transparency + 0.25 * plan_viability)::numeric, 1)
    WHERE candidate_id IN (
      SELECT id FROM candidates WHERE cargo = 'presidente' AND is_active = true
    )
    AND plan_viability IS NOT NULL
  `

  // Show final ranking
  console.log('\n' + '='.repeat(70))
  console.log(' RANKING FINAL 4P (score_balanced_p)')
  console.log('='.repeat(70))

  const ranking = await sql`
    SELECT c.full_name, s.competence, s.integrity, s.transparency,
           s.plan_viability, s.score_balanced, s.score_balanced_p,
           s.score_balanced - s.score_balanced_p as gap
    FROM candidates c JOIN scores s ON c.id = s.candidate_id
    WHERE c.cargo = 'presidente' AND c.is_active = true
    ORDER BY s.score_balanced_p DESC
  `

  ranking.forEach((r, i) => {
    const rank = String(i + 1).padStart(2)
    const name = r.full_name.substring(0, 32).padEnd(34)
    const gap = Number(r.gap).toFixed(1)
    console.log(`  ${rank}. ${name} C=${String(r.competence).padStart(2)} I=${String(r.integrity).padStart(2)} T=${String(r.transparency).padStart(2)} P=${String(r.plan_viability).padStart(2)} | 3P=${r.score_balanced} 4P=${r.score_balanced_p} (gap=${gap})`)
  })

  // Stats
  const pvValues = ranking.map(r => Number(r.plan_viability))
  const gaps = ranking.map(r => Math.abs(Number(r.gap)))
  console.log('\n' + '='.repeat(70))
  console.log(` ESTADÍSTICAS:`)
  console.log(`   Candidatos actualizados: ${updated}`)
  console.log(`   PV rango: ${Math.min(...pvValues)}-${Math.max(...pvValues)} (antes: 13-50)`)
  console.log(`   PV promedio: ${(pvValues.reduce((a, b) => a + b) / pvValues.length).toFixed(1)} (antes: 31.0)`)
  console.log(`   Gap promedio 3P-4P: ${(gaps.reduce((a, b) => a + b) / gaps.length).toFixed(1)} pts (antes: 10.1)`)
  console.log('='.repeat(70))
}

main().catch(console.error)
