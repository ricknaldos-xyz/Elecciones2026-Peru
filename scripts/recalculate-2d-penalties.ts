/**
 * Recalculate penal penalties using the 2D system: stage base × crime severity.
 *
 * For each candidate with penal_sentences in their details JSONB,
 * this script:
 * 1. Classifies each crime by severity (gravísimo, grave, moderado, leve)
 * 2. Calculates penalty = STAGE_BASE[status] × SEVERITY_MULTIPLIER[severity]
 * 3. Updates penal_penalties JSONB with severity info
 * 4. Updates penal_penalty total and integrity score
 * 5. Syncs same-DNI candidates
 * 6. Recalculates weighted composite scores
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

// Stage base penalties
const STAGE_BASE: Record<string, number> = {
  condenado: 50,
  firme: 50,
  confirmado: 50,
  proceso: 20,
  acusacion_fiscal: 20,
  investigacion_preparatoria: 10,
  investigacion: 7,
  investigacion_preliminar: 5,
  juicio_anulado: 3,
  anulada_rehacer: 3,
  archivado: 2,
  observacion: 2,
}

// Crime severity multipliers
type CrimeSeverity = 'gravisimo' | 'grave' | 'moderado' | 'leve'

const SEVERITY_MULTIPLIER: Record<CrimeSeverity, number> = {
  gravisimo: 1.5,
  grave: 1.2,
  moderado: 1.0,
  leve: 0.7,
}

// Keywords → severity classification
const SEVERITY_KEYWORDS: { severity: CrimeSeverity; patterns: RegExp[] }[] = [
  {
    severity: 'gravisimo',
    patterns: [
      /organizaci[oó]n criminal/i,
      /terrorismo/i,
      /narcotr[aá]fico/i,
      /tr[aá]fico il[ií]cito de drogas/i,
      /lavado de activos/i,
      /homicidio/i,
      /sicariato/i,
      /secuestro/i,
      /trata de personas/i,
      /violaci[oó]n sexual/i,
    ],
  },
  {
    severity: 'grave',
    patterns: [
      /colusi[oó]n(?:\s+(?:simple|agravada|desleal))?/i,
      /cohecho/i,
      /peculado/i,
      /enriquecimiento il[ií]cito/i,
      /malversaci[oó]n/i,
      /tr[aá]fico de influencias/i,
      /soborno/i,
      /corrupci[oó]n/i,
      /defraudaci[oó]n/i,
    ],
  },
  {
    severity: 'moderado',
    patterns: [
      /negociaci[oó]n incompatible/i,
      /estafa/i,
      /usurpaci[oó]n/i,
      /concusi[oó]n/i,
      /abuso de autoridad/i,
      /apropiaci[oó]n/i,
      /da[ñn]o/i,
      /lesiones/i,
      /falsificaci[oó]n/i,
      /fraude/i,
    ],
  },
  {
    severity: 'leve',
    patterns: [
      /difamaci[oó]n/i,
      /falsa declaraci[oó]n/i,
      /omisi[oó]n/i,
      /injuria/i,
      /calumnia/i,
      /desobediencia/i,
      /incumplimiento/i,
    ],
  },
]

function classifySeverity(description: string): CrimeSeverity {
  for (const { severity, patterns } of SEVERITY_KEYWORDS) {
    for (const pattern of patterns) {
      if (pattern.test(description)) {
        return severity
      }
    }
  }
  return 'moderado'
}

async function main() {
  console.log('='.repeat(80))
  console.log(' RECALCULATE PENAL PENALTIES — 2D SYSTEM (stage × severity)')
  console.log('='.repeat(80))

  // Phase 1: Get all candidates with penal sentences
  console.log('\n--- Phase 1: Classify and recalculate penal penalties ---\n')

  const candidates = await sql`
    SELECT c.id, c.full_name, c.cargo, c.dni, c.party_id,
           c.penal_sentences,
           s.integrity as current_integrity,
           s.competence, s.transparency, s.confidence, s.plan_viability,
           sb.integrity_base, sb.penal_penalty as old_penal_penalty,
           sb.penal_penalties as old_penal_penalties,
           sb.civil_penalties, sb.resignation_penalty, sb.reinfo_penalty,
           sb.company_penalty, sb.voting_penalty, sb.voting_bonus,
           sb.tax_penalty, sb.omission_penalty
    FROM candidates c
    JOIN scores s ON c.id = s.candidate_id
    JOIN score_breakdowns sb ON c.id = sb.candidate_id
    WHERE c.is_active = true
    ORDER BY c.cargo, c.full_name
  `

  let updated = 0
  let changed = 0

  for (const c of candidates) {
    // Extract penal sentences from candidates.penal_sentences JSONB column
    const rawSentences = typeof c.penal_sentences === 'string'
      ? JSON.parse(c.penal_sentences)
      : c.penal_sentences
    const penalSentences: { status?: string; description?: string; isFirm?: boolean }[] =
      rawSentences || []

    if (penalSentences.length === 0) {
      // No penal sentences — ensure penalty is 0
      if (Number(c.old_penal_penalty) !== 0) {
        await sql`
          UPDATE score_breakdowns SET
            penal_penalty = 0,
            penal_penalties = '[]'::jsonb
          WHERE candidate_id = ${c.id}
        `
        console.log(`  ⚠ ${c.full_name.substring(0, 38).padEnd(40)} (${c.cargo.padEnd(12)}) cleared stale penal_penalty=${c.old_penal_penalty}→0`)
        changed++
      }
      updated++
      continue
    }

    // Apply 2D penalty system
    const newPenalties: { status: string; description: string; penalty: number; severity: CrimeSeverity }[] = []

    for (const sentence of penalSentences) {
      const status = sentence.status || (sentence.isFirm ? 'condenado' : 'proceso')
      const description = sentence.description || 'Sin descripción'
      const stageBase = STAGE_BASE[status] || 7
      const severity = classifySeverity(description)
      const multiplier = SEVERITY_MULTIPLIER[severity]
      const penalty = Math.round(stageBase * multiplier)

      newPenalties.push({ status, description, penalty, severity })
    }

    const newPenalTotal = Math.min(85, newPenalties.reduce((sum, p) => sum + p.penalty, 0))
    const oldPenalTotal = Number(c.old_penal_penalty)

    // Calculate new integrity
    let civilSum = 0
    try {
      const civils = typeof c.civil_penalties === 'string'
        ? JSON.parse(c.civil_penalties)
        : c.civil_penalties || []
      civilSum = civils.reduce((s: number, p: { penalty: number }) => s + (Number(p.penalty) || 0), 0)
    } catch { /* */ }

    const newIntegrity = Math.min(100, Math.max(0,
      Number(c.integrity_base || 100)
      - newPenalTotal
      - civilSum
      - Number(c.resignation_penalty || 0)
      - Number(c.reinfo_penalty || 0)
      - Number(c.company_penalty || 0)
      - Number(c.voting_penalty || 0)
      + Number(c.voting_bonus || 0)
      - Number(c.tax_penalty || 0)
      - Number(c.omission_penalty || 0)
    ))

    const oldIntegrity = Number(c.current_integrity)
    const intDiff = Math.abs(oldIntegrity - newIntegrity)

    // Update breakdowns
    await sql`
      UPDATE score_breakdowns SET
        penal_penalty = ${newPenalTotal},
        penal_penalties = ${JSON.stringify(newPenalties)}::jsonb
      WHERE candidate_id = ${c.id}
    `

    // Update integrity score
    if (intDiff > 0) {
      await sql`
        UPDATE scores SET integrity = ${newIntegrity}, updated_at = NOW()
        WHERE candidate_id = ${c.id}
      `
    }

    if (intDiff > 0 || newPenalTotal !== oldPenalTotal) {
      console.log(`  ⚠ ${c.full_name.substring(0, 38).padEnd(40)} (${c.cargo.padEnd(12)}) penal: ${oldPenalTotal}→${newPenalTotal} | I: ${oldIntegrity}→${newIntegrity}`)
      for (const p of newPenalties) {
        const sevLabel = { gravisimo: 'GRAVÍSIMO', grave: 'GRAVE', moderado: 'MODERADO', leve: 'LEVE' }[p.severity]
        console.log(`    ${p.status.padEnd(28)} ${sevLabel.padEnd(10)} base=${STAGE_BASE[p.status] || 7} ×${SEVERITY_MULTIPLIER[p.severity]} = -${p.penalty}  ${p.description.substring(0, 60)}`)
      }
      changed++
    } else {
      // Still update penal_penalties JSONB with severity info even if total didn't change
      console.log(`  ✓ ${c.full_name.substring(0, 38).padEnd(40)} (${c.cargo.padEnd(12)}) penal=${newPenalTotal} I=${newIntegrity} (${newPenalties.length} sentences classified)`)
    }

    updated++
  }

  console.log(`\n  Total: ${updated} candidates processed, ${changed} penalties changed`)

  // Phase 2: Sync same-DNI candidates
  console.log('\n--- Phase 2: Sync same-DNI integrity scores ---\n')

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
    const presIdx = (g.cargos as string[]).indexOf('presidente')
    const useIntegrity = presIdx >= 0 ? g.integrities[presIdx] : Math.min(...(g.integrities as number[]))

    for (let i = 0; i < g.ids.length; i++) {
      if (Number(g.integrities[i]) !== Number(useIntegrity)) {
        await sql`
          UPDATE scores SET integrity = ${useIntegrity}, updated_at = NOW()
          WHERE candidate_id = ${g.ids[i]}
        `

        // Also copy penal breakdown from canonical entry
        const canonicalId = presIdx >= 0 ? g.ids[presIdx] : g.ids[0]
        await sql`
          UPDATE score_breakdowns sb SET
            penal_penalty = src.penal_penalty,
            penal_penalties = src.penal_penalties
          FROM score_breakdowns src
          WHERE sb.candidate_id = ${g.ids[i]}
            AND src.candidate_id = ${canonicalId}
        `

        console.log(`  ⚠ DNI ${g.dni}: ${g.names[i]} (${g.cargos[i]}) I: ${g.integrities[i]} → ${useIntegrity}`)
        dniFixed++
      }
    }
  }

  console.log(`\n  Total: ${dniGroups.length} DNI groups, ${dniFixed} scores synced`)

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

  // Phase 4: Verification
  console.log('\n--- Phase 4: Verify integrity matches breakdowns ---\n')

  const allCandidates = await sql`
    SELECT c.full_name, c.cargo, s.integrity as score_integrity,
           sb.integrity_base, sb.penal_penalty, sb.civil_penalties,
           sb.resignation_penalty, sb.reinfo_penalty,
           sb.company_penalty, sb.voting_penalty, sb.voting_bonus,
           sb.tax_penalty, sb.omission_penalty
    FROM candidates c
    JOIN scores s ON c.id = s.candidate_id
    JOIN score_breakdowns sb ON c.id = sb.candidate_id
    WHERE c.is_active = true
    ORDER BY c.cargo, c.full_name
  `

  let mismatchCount = 0
  for (const row of allCandidates) {
    let civilSum = 0
    try {
      const civils = typeof row.civil_penalties === 'string'
        ? JSON.parse(row.civil_penalties)
        : row.civil_penalties || []
      civilSum = civils.reduce((s: number, p: { penalty: number }) => s + (Number(p.penalty) || 0), 0)
    } catch { /* */ }

    const calc = Math.min(100, Math.max(0,
      Number(row.integrity_base || 100)
      - Number(row.penal_penalty || 0)
      - civilSum
      - Number(row.resignation_penalty || 0)
      - Number(row.reinfo_penalty || 0)
      - Number(row.company_penalty || 0)
      - Number(row.voting_penalty || 0)
      + Number(row.voting_bonus || 0)
      - Number(row.tax_penalty || 0)
      - Number(row.omission_penalty || 0)
    ))

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
  console.log(' PRESIDENTIAL RANKING (2D penalty system)')
  console.log('='.repeat(80))

  const ranking = await sql`
    SELECT c.full_name, s.competence, s.integrity, s.transparency,
           s.plan_viability, s.score_balanced, s.score_balanced_p,
           sb.penal_penalty, sb.penal_penalties
    FROM candidates c
    JOIN scores s ON c.id = s.candidate_id
    LEFT JOIN score_breakdowns sb ON c.id = sb.candidate_id
    WHERE c.cargo = 'presidente' AND c.is_active = true
    ORDER BY COALESCE(s.score_balanced_p, s.score_balanced) DESC
  `

  ranking.forEach((r, i) => {
    const rank = String(i + 1).padStart(2)
    const name = r.full_name.substring(0, 32).padEnd(34)
    const penalties: { severity: string; description: string; penalty: number }[] = (() => {
      try {
        if (typeof r.penal_penalties === 'string') return JSON.parse(r.penal_penalties)
        return r.penal_penalties || []
      } catch { return [] }
    })()
    const penalDetail = penalties.length > 0
      ? penalties.map(p => `${p.severity?.[0]?.toUpperCase() || '?'}:-${p.penalty}`).join(' ')
      : ''
    console.log(`  ${rank}. ${name} C=${String(r.competence).padStart(3)} I=${String(r.integrity).padStart(3)} T=${String(r.transparency).padStart(3)} P=${String(r.plan_viability || '-').padStart(3)} | 3P=${r.score_balanced} 4P=${r.score_balanced_p || '-'} | penal=${r.penal_penalty || 0} [${penalDetail}]`)
  })

  console.log('\n' + '='.repeat(80))
  console.log(` DONE: ${updated} processed, ${changed} changed, ${dniFixed} DNI synced`)
  console.log('='.repeat(80))
}

main().catch(console.error)
