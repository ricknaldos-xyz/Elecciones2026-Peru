/**
 * Recalculate integrity scores using granular penal penalty scale.
 *
 * Penalty levels:
 * - Sentencia firme (condenado/firme): -70 (1 case), -85 cap (2+)
 * - Juicio oral / acusación fiscal (proceso/acusacion_fiscal): -30 per case
 * - Investigación formalizada (investigacion_preparatoria): -15 per case
 * - Investigación preliminar (investigacion/investigacion_preliminar): -10 per case
 * - Anulado / archivado (juicio_anulado/anulada_rehacer/observacion): -5
 *
 * Also inserts Lopez Chau's missing penal cases from verified sources.
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

// Penalty per status level
const STATUS_PENALTY: Record<string, number> = {
  condenado: 70,
  firme: 70,
  confirmado: 70,
  proceso: 30,
  acusacion_fiscal: 30,
  investigacion_preparatoria: 15,
  investigacion: 10,
  investigacion_preliminar: 10,
  juicio_anulado: 5,
  anulada_rehacer: 5,
  observacion: 5,
}

// Human-readable labels for statuses
const STATUS_LABELS: Record<string, string> = {
  condenado: 'Sentencia firme',
  firme: 'Sentencia firme',
  confirmado: 'Sentencia confirmada',
  proceso: 'Juicio oral',
  acusacion_fiscal: 'Acusación fiscal',
  investigacion_preparatoria: 'Investigación formalizada',
  investigacion: 'Investigación activa',
  investigacion_preliminar: 'Investigación preliminar',
  juicio_anulado: 'Juicio anulado',
  anulada_rehacer: 'Sentencia anulada',
  observacion: 'Observación',
}

// Resignation penalties
function resignationPenalty(count: number): number {
  if (count >= 3) return 15
  if (count >= 2) return 10
  if (count >= 1) return 5
  return 0
}

interface PenalPenaltyDetail {
  status: string
  description: string
  penalty: number
}

async function main() {
  console.log('='.repeat(70))
  console.log(' RECALCULATING INTEGRITY WITH GRANULAR PENAL SCALE')
  console.log('='.repeat(70))

  // First, insert Lopez Chau's missing penal cases
  console.log('\n--- Inserting Lopez Chau missing penal cases ---')
  const lopezChau = await sql`
    SELECT id, full_name, penal_sentences FROM candidates
    WHERE full_name ILIKE '%lopez chau%' AND cargo = 'presidente' LIMIT 1
  `
  if (lopezChau.length > 0 && (lopezChau[0].penal_sentences as unknown[]).length === 0) {
    const penalSentences = [
      {
        type: 'penal',
        description: 'Colusión agravada - designación irregular de secretaria general UNI',
        status: 'acusacion_fiscal',
        isFirm: false,
        year: 2025,
        citation: 'Fiscalía pide 5 años prisión + 12.5 años inhabilitación. Control de acusación pendiente ante 29° Juzgado (Jueza Olivares Robles). Paralizado desde sept 2025.',
      },
      {
        type: 'penal',
        description: 'Peculado doloso - contratos a militantes de Ahora Nación con fondos UNI',
        status: 'investigacion_preparatoria',
        isFirm: false,
        year: 2026,
        citation: 'Investigación compleja declarada 12/01/2026. Contraloría ordenó auditar gestión UNI (10/02/2026). Citado a declarar 25/02/2026.',
      },
    ]
    await sql`
      UPDATE candidates SET
        penal_sentences = ${JSON.stringify(penalSentences)}::jsonb
      WHERE id = ${lopezChau[0].id}
    `
    console.log(`  ✓ Lopez Chau: inserted 2 penal cases (acusacion_fiscal + investigacion_preparatoria)`)
  } else {
    console.log(`  - Lopez Chau: already has penal_sentences or not found`)
  }

  // Now recalculate ALL presidential candidates
  console.log('\n--- Recalculating all presidential candidates ---\n')

  const candidates = await sql`
    SELECT c.id, c.full_name, c.penal_sentences, c.civil_sentences, c.party_resignations,
           s.integrity as current_integrity, s.competence, s.transparency, s.confidence,
           s.plan_viability,
           sb.civil_penalties as sb_civil_penalties, sb.reinfo_penalty as sb_reinfo_penalty
    FROM candidates c
    JOIN scores s ON c.id = s.candidate_id
    LEFT JOIN score_breakdowns sb ON c.id = sb.candidate_id
    WHERE c.cargo = 'presidente' AND c.is_active = true
    ORDER BY c.full_name
  `

  let updated = 0

  for (const c of candidates) {
    const penalSentences = (c.penal_sentences || []) as { description: string; status?: string; isFirm?: boolean }[]
    const partyResignations = Number(c.party_resignations) || 0
    const reinfoP = Number(c.sb_reinfo_penalty) || 0

    // Calculate penal penalties with granular scale
    const penalDetails: PenalPenaltyDetail[] = []
    for (const sentence of penalSentences) {
      const status = sentence.status || (sentence.isFirm ? 'condenado' : 'investigacion')
      const penalty = STATUS_PENALTY[status] || 10
      const label = STATUS_LABELS[status] || status
      penalDetails.push({
        status,
        description: `${label}: ${sentence.description?.substring(0, 80) || 'Sin descripción'}`,
        penalty,
      })
    }

    // Cap: firm sentences 2+ = 85, total max 85
    const firmStatuses = ['condenado', 'firme', 'confirmado']
    const firmCount = penalDetails.filter(p => firmStatuses.includes(p.status)).length
    let totalPenalPenalty: number
    if (firmCount >= 2) {
      totalPenalPenalty = 85
    } else {
      totalPenalPenalty = Math.min(85, penalDetails.reduce((sum, p) => sum + p.penalty, 0))
    }

    // Civil penalties from existing breakdown (keep as-is)
    let civilPenaltiesJson = '[]'
    let civilPenaltiesSum = 0
    try {
      const civils = typeof c.sb_civil_penalties === 'string'
        ? JSON.parse(c.sb_civil_penalties)
        : c.sb_civil_penalties || []
      civilPenaltiesJson = JSON.stringify(civils)
      civilPenaltiesSum = civils.reduce((s: number, p: { penalty: number }) => s + (p.penalty || 0), 0)
    } catch { /* keep defaults */ }

    const resignP = resignationPenalty(partyResignations)
    const newIntegrity = Math.max(0, 100 - totalPenalPenalty - civilPenaltiesSum - resignP - reinfoP)

    // Update scores table
    await sql`
      UPDATE scores SET
        integrity = ${newIntegrity},
        updated_at = NOW()
      WHERE candidate_id = ${c.id}
    `

    // Update score_breakdowns
    await sql`
      UPDATE score_breakdowns SET
        integrity_base = 100,
        penal_penalty = ${totalPenalPenalty},
        penal_penalties = ${JSON.stringify(penalDetails)}::jsonb,
        civil_penalties = ${civilPenaltiesJson}::jsonb,
        resignation_penalty = ${resignP},
        reinfo_penalty = ${reinfoP}
      WHERE candidate_id = ${c.id}
    `

    const oldI = Number(c.current_integrity)
    const changed = Math.abs(oldI - newIntegrity) > 0.5
    const marker = changed ? '⚠' : '✓'
    const name = c.full_name.substring(0, 38).padEnd(40)
    const details = penalDetails.map(p => `${p.status}(-${p.penalty})`).join(' + ') || 'limpio'
    console.log(`  ${marker} ${name} penal=${details.padEnd(50)} resign=-${resignP} civil=-${civilPenaltiesSum} reinfo=-${reinfoP} → I=${newIntegrity}${changed ? ` (was ${oldI})` : ''}`)
    updated++
  }

  // Recalculate weighted scores
  console.log('\n--- Recalculating weighted scores ---')
  await sql`
    UPDATE scores SET
      score_balanced = ROUND((0.30 * competence + 0.30 * integrity + 0.20 * transparency + 0.20 * confidence)::numeric, 1),
      score_merit = ROUND((0.40 * competence + 0.25 * integrity + 0.15 * transparency + 0.20 * confidence)::numeric, 1),
      score_integrity = ROUND((0.25 * competence + 0.40 * integrity + 0.15 * transparency + 0.20 * confidence)::numeric, 1)
    WHERE candidate_id IN (
      SELECT id FROM candidates WHERE cargo = 'presidente' AND is_active = true
    )
  `

  // Recalculate 4-pillar scores
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

  // Final verification
  console.log('\n' + '='.repeat(70))
  console.log(' RANKING FINAL')
  console.log('='.repeat(70))

  const ranking = await sql`
    SELECT c.full_name, s.competence, s.integrity, s.transparency,
           s.plan_viability, s.score_balanced, s.score_balanced_p,
           sb.penal_penalty, sb.resignation_penalty
    FROM candidates c
    JOIN scores s ON c.id = s.candidate_id
    LEFT JOIN score_breakdowns sb ON c.id = sb.candidate_id
    WHERE c.cargo = 'presidente' AND c.is_active = true
    ORDER BY COALESCE(s.score_balanced_p, s.score_balanced) DESC
  `

  ranking.forEach((r, i) => {
    const rank = String(i + 1).padStart(2)
    const name = r.full_name.substring(0, 32).padEnd(34)
    console.log(`  ${rank}. ${name} C=${String(r.competence).padStart(2)} I=${String(r.integrity).padStart(2)} T=${String(r.transparency).padStart(2)} P=${String(r.plan_viability || '-').padStart(2)} | 3P=${r.score_balanced} 4P=${r.score_balanced_p || '-'}`)
  })

  // Verify breakdown consistency
  console.log('\n' + '='.repeat(70))
  console.log(' VERIFICACIÓN: DIFERENCIAS ENTRE SCORE Y BREAKDOWN')
  console.log('='.repeat(70))

  const mismatches = await sql`
    SELECT c.full_name, s.integrity as score_integrity,
           sb.integrity_base, sb.penal_penalty, sb.civil_penalties,
           sb.resignation_penalty, sb.reinfo_penalty
    FROM candidates c
    JOIN scores s ON c.id = s.candidate_id
    JOIN score_breakdowns sb ON c.id = sb.candidate_id
    WHERE c.cargo = 'presidente' AND c.is_active = true
    ORDER BY c.full_name
  `

  let mismatchCount = 0
  for (const row of mismatches) {
    const civils = (typeof row.civil_penalties === 'string' ? JSON.parse(row.civil_penalties) : row.civil_penalties || []) as { penalty: number }[]
    const civilSum = civils.reduce((s: number, p: { penalty: number }) => s + p.penalty, 0)
    const calc = Math.max(0, 100 - Number(row.penal_penalty) - civilSum - Number(row.resignation_penalty) - (Number(row.reinfo_penalty) || 0))
    const diff = Number(row.score_integrity) - calc

    if (Math.abs(diff) > 0.5) {
      console.log(`  ⚠ ${row.full_name.substring(0, 35).padEnd(37)} score=${row.score_integrity} calc=${calc} diff=${diff > 0 ? '+' : ''}${diff}`)
      mismatchCount++
    }
  }

  if (mismatchCount === 0) {
    console.log('  ✓ TODOS LOS SCORES COINCIDEN CON SUS BREAKDOWNS')
  }

  console.log('\n' + '='.repeat(70))
  console.log(` RESUMEN: ${updated} candidatos recalculados`)
  console.log('='.repeat(70))
}

main().catch(console.error)
