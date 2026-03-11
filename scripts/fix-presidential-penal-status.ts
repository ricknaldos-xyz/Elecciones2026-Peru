/**
 * Fix presidential candidates' penal_sentences status based on verified sources.
 * Then recalculate 2D penalties, integrity, and weighted scores.
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

// Stage base penalties (2D system)
const STAGE_BASE: Record<string, number> = {
  condenado: 50, firme: 50, confirmado: 50,
  proceso: 20, acusacion_fiscal: 20,
  investigacion_preparatoria: 10, investigacion: 7, investigacion_preliminar: 5,
  juicio_anulado: 3, anulada_rehacer: 3, archivado: 2, observacion: 2,
}

type CrimeSeverity = 'gravisimo' | 'grave' | 'moderado' | 'leve'

const SEVERITY_MULTIPLIER: Record<CrimeSeverity, number> = {
  gravisimo: 1.5, grave: 1.2, moderado: 1.0, leve: 0.7,
}

const SEVERITY_KEYWORDS: { severity: CrimeSeverity; patterns: RegExp[] }[] = [
  { severity: 'gravisimo', patterns: [/organizaci[oó]n criminal/i, /terrorismo/i, /narcotr[aá]fico/i, /lavado de activos/i, /homicidio/i, /sicariato/i, /secuestro/i, /trata de personas/i, /violaci[oó]n sexual/i] },
  { severity: 'grave', patterns: [/colusi[oó]n/i, /cohecho/i, /peculado/i, /enriquecimiento il[ií]cito/i, /malversaci[oó]n/i, /tr[aá]fico de influencias/i, /soborno/i, /corrupci[oó]n/i, /defraudaci[oó]n/i] },
  { severity: 'moderado', patterns: [/negociaci[oó]n incompatible/i, /estafa/i, /usurpaci[oó]n/i, /concusi[oó]n/i, /abuso de autoridad/i, /apropiaci[oó]n/i, /da[ñn]o/i, /lesiones/i, /falsificaci[oó]n/i, /fraude/i, /obstrucci[oó]n/i, /destrucci[oó]n/i, /favorecimiento/i] },
  { severity: 'leve', patterns: [/difamaci[oó]n/i, /falsa declaraci[oó]n/i, /omisi[oó]n/i, /injuria/i, /calumnia/i, /desobediencia/i, /incumplimiento/i] },
]

function classifySeverity(description: string): CrimeSeverity {
  for (const { severity, patterns } of SEVERITY_KEYWORDS) {
    for (const pattern of patterns) {
      if (pattern.test(description)) return severity
    }
  }
  return 'moderado'
}

// Corrections based on web research (March 2026)
interface StatusCorrection {
  candidateName: string
  descriptionMatch: string  // partial match on description
  newStatus: string
  newDescription?: string
  newCitation?: string
  newYear?: number
  reason: string
}

const corrections: StatusCorrection[] = [
  // JORGE NIETO: investigacion → investigacion_preparatoria (formalizada julio 2023)
  {
    candidateName: 'JORGE NIETO MONTESINOS',
    descriptionMatch: 'lavado de activos - caso Odebrecht',
    newStatus: 'investigacion_preparatoria',
    newDescription: 'Lavado de activos - caso Odebrecht/OAS, recibió US$120K para campaña No a Revocatoria de Villarán',
    newCitation: 'Investigación preparatoria formalizada julio 2023 por Equipo Especial Lava Jato. US$129K recibidos según Fiscalía.',
    newYear: 2023,
    reason: 'Fiscalía formalizó investigación preparatoria en julio 2023 (múltiples fuentes: El Comercio, Infobae, RPP)',
  },
  // KEIKO: caso Cócteles lavado → archivado (TC anuló, juez archivó enero 2026)
  {
    candidateName: 'KEIKO',
    descriptionMatch: 'Caso Cócteles - lavado de activos y organización criminal',
    newStatus: 'archivado',
    newCitation: 'TC anuló proceso. Juez Verástegui archivó definitivamente enero 2026. Cargos de lavado y org. criminal anulados.',
    reason: 'TC sentencia 185/2025 anuló imputaciones. Juez archivó definitivamente enero 2026.',
  },
  // KEIKO: falsa declaración subsiste tras archivamiento del lavado
  {
    candidateName: 'KEIKO',
    descriptionMatch: 'falsa declaración ante ONPE',
    newStatus: 'acusacion_fiscal',
    newCitation: 'Cargos subsistentes tras archivamiento del lavado. Juez mantiene imputación enero 2026. Etapa intermedia.',
    reason: 'Infobae enero 2026: Juez mantiene imputación por falsas declaraciones.',
  },
  // BELMONT: difamación condena confirmada en apelación, casación inadmisible → firme
  {
    candidateName: 'BELMONT CASSINELLI',
    descriptionMatch: 'Difamación agravada contra Phillip Butters',
    newStatus: 'firme',
    newDescription: 'Difamación agravada contra Phillip Butters - condena firme',
    newCitation: 'Condena 1 año suspendido + S/20K reparación (ene 2025). Apelación confirmó. Casación declarada inadmisible.',
    newYear: 2025,
    reason: 'Casación declarada inadmisible = sentencia firme. Fuente: Diario Expreso.',
  },
  // VIZCARRA: cohecho - condenado primera instancia, en apelación. Status correcto pero isFirm debería ser false aún
  {
    candidateName: 'VIZCARRA CORNEJO',
    descriptionMatch: 'Cohecho pasivo impropio - coimas',
    newStatus: 'condenado',
    newCitation: 'Condenado 14 años prisión primera instancia (nov 2025). En apelación ante Tercera Sala Penal Nacional. Preso en Barbadillo.',
    reason: 'Confirmado condenado nov 2025, en apelación. Status correcto.',
  },
  // MASSE: investigaciones de 2013 sin avance, probablemente prescrito o archivado
  {
    candidateName: 'MASSE FERNANDEZ',
    descriptionMatch: 'Lavado de activos - transferencias APDAYC',
    newStatus: 'investigacion_preliminar',
    newDescription: 'Lavado de activos - transferencias APDAYC a Wells Fargo y compra frecuencias radiales (2013)',
    newCitation: 'Investigación preliminar desde 2013. Sin acusación formal reportada en 12+ años. Posible prescripción.',
    newYear: 2013,
    reason: 'Investigación de 2013 sin avances conocidos. Rebajado a investigacion_preliminar.',
  },
  {
    candidateName: 'MASSE FERNANDEZ',
    descriptionMatch: 'Estafa y administración fraudulenta',
    newStatus: 'investigacion_preliminar',
    newCitation: 'Denunciado por compositor Kiri Escobar (2013). Sin acusación formal reportada en 12+ años.',
    newYear: 2013,
    reason: 'Investigación de 2013 sin avances conocidos. Rebajado a investigacion_preliminar.',
  },
]

async function main() {
  console.log('='.repeat(80))
  console.log(' FIX PRESIDENTIAL PENAL STATUS — VERIFIED SOURCES (March 2026)')
  console.log('='.repeat(80))

  // Phase 1: Apply corrections to penal_sentences
  console.log('\n--- Phase 1: Apply status corrections ---\n')

  let totalFixed = 0

  for (const corr of corrections) {
    const rows = await sql`
      SELECT c.id, c.full_name, c.penal_sentences
      FROM candidates c
      WHERE c.is_active = true
      AND c.full_name ILIKE ${'%' + corr.candidateName + '%'}
      AND c.cargo = 'presidente'
      LIMIT 1
    `

    if (rows.length === 0) {
      console.log(`  ✗ ${corr.candidateName} — NOT FOUND`)
      continue
    }

    const row = rows[0]
    const sentences = typeof row.penal_sentences === 'string'
      ? JSON.parse(row.penal_sentences)
      : row.penal_sentences || []

    let found = false
    for (const s of sentences) {
      if ((s.description || '').includes(corr.descriptionMatch)) {
        const oldStatus = s.status
        s.status = corr.newStatus
        if (corr.newDescription) s.description = corr.newDescription
        if (corr.newCitation) s.citation = corr.newCitation
        if (corr.newYear) s.year = corr.newYear

        console.log(`  ⚠ ${row.full_name}`)
        console.log(`    "${corr.descriptionMatch.substring(0, 60)}"`)
        console.log(`    status: ${oldStatus} → ${corr.newStatus}`)
        console.log(`    reason: ${corr.reason}`)
        found = true
        break
      }
    }

    if (!found) {
      console.log(`  ✗ ${row.full_name} — sentence not found: "${corr.descriptionMatch}"`)
      continue
    }

    await sql`
      UPDATE candidates SET penal_sentences = ${JSON.stringify(sentences)}::jsonb
      WHERE id = ${row.id}
    `
    totalFixed++
  }

  console.log(`\n  Total: ${totalFixed} sentences corrected`)

  // Phase 2: Recalculate 2D penalties for ALL candidates
  console.log('\n--- Phase 2: Recalculate 2D penalties ---\n')

  const candidates = await sql`
    SELECT c.id, c.full_name, c.cargo, c.dni,
           c.penal_sentences,
           s.integrity as current_integrity,
           sb.integrity_base, sb.penal_penalty as old_penal_penalty,
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
    const rawSentences = typeof c.penal_sentences === 'string'
      ? JSON.parse(c.penal_sentences)
      : c.penal_sentences
    const penalSentences: { status?: string; description?: string; isFirm?: boolean }[] = rawSentences || []

    if (penalSentences.length === 0) {
      if (Number(c.old_penal_penalty) !== 0) {
        await sql`UPDATE score_breakdowns SET penal_penalty = 0, penal_penalties = '[]'::jsonb WHERE candidate_id = ${c.id}`
        changed++
      }
      updated++
      continue
    }

    const newPenalties: { status: string; description: string; penalty: number; severity: CrimeSeverity }[] = []
    for (const sentence of penalSentences) {
      const status = sentence.status || (sentence.isFirm ? 'condenado' : 'proceso')
      const description = sentence.description || 'Sin descripción'
      const stageBase = STAGE_BASE[status] || 7
      const severity = classifySeverity(description)
      const penalty = Math.round(stageBase * SEVERITY_MULTIPLIER[severity])
      newPenalties.push({ status, description, penalty, severity })
    }

    const newPenalTotal = Math.min(85, newPenalties.reduce((sum, p) => sum + p.penalty, 0))

    let civilSum = 0
    try {
      const civils = typeof c.civil_penalties === 'string' ? JSON.parse(c.civil_penalties) : c.civil_penalties || []
      civilSum = civils.reduce((s: number, p: { penalty: number }) => s + (Number(p.penalty) || 0), 0)
    } catch { /* */ }

    const newIntegrity = Math.min(100, Math.max(0,
      Number(c.integrity_base || 100) - newPenalTotal - civilSum
      - Number(c.resignation_penalty || 0) - Number(c.reinfo_penalty || 0)
      - Number(c.company_penalty || 0) - Number(c.voting_penalty || 0)
      + Number(c.voting_bonus || 0) - Number(c.tax_penalty || 0)
      - Number(c.omission_penalty || 0)
    ))

    const oldIntegrity = Number(c.current_integrity)
    const oldPenal = Number(c.old_penal_penalty)

    await sql`
      UPDATE score_breakdowns SET penal_penalty = ${newPenalTotal}, penal_penalties = ${JSON.stringify(newPenalties)}::jsonb
      WHERE candidate_id = ${c.id}
    `

    if (Math.abs(oldIntegrity - newIntegrity) > 0) {
      await sql`UPDATE scores SET integrity = ${newIntegrity}, updated_at = NOW() WHERE candidate_id = ${c.id}`
    }

    if (newPenalTotal !== oldPenal || Math.abs(oldIntegrity - newIntegrity) > 0) {
      if (c.cargo === 'presidente') {
        console.log(`  ⚠ ${c.full_name.substring(0, 38).padEnd(40)} penal: ${oldPenal}→${newPenalTotal} | I: ${oldIntegrity}→${newIntegrity}`)
        for (const p of newPenalties) {
          console.log(`    ${p.status.padEnd(28)} ${p.severity.padEnd(10)} -${p.penalty}  ${p.description.substring(0, 55)}`)
        }
      }
      changed++
    }
    updated++
  }

  console.log(`\n  Total: ${updated} processed, ${changed} changed`)

  // Phase 3: Sync same-DNI
  console.log('\n--- Phase 3: Sync same-DNI ---\n')

  const dniGroups = await sql`
    WITH grouped AS (
      SELECT c.dni,
             array_agg(c.id ORDER BY CASE c.cargo WHEN 'presidente' THEN 0 WHEN 'senador' THEN 1 WHEN 'diputado' THEN 2 ELSE 3 END) as ids,
             array_agg(c.full_name ORDER BY CASE c.cargo WHEN 'presidente' THEN 0 WHEN 'senador' THEN 1 WHEN 'diputado' THEN 2 ELSE 3 END) as names,
             array_agg(c.cargo ORDER BY CASE c.cargo WHEN 'presidente' THEN 0 WHEN 'senador' THEN 1 WHEN 'diputado' THEN 2 ELSE 3 END) as cargos,
             array_agg(s.integrity ORDER BY CASE c.cargo WHEN 'presidente' THEN 0 WHEN 'senador' THEN 1 WHEN 'diputado' THEN 2 ELSE 3 END) as integrities
      FROM candidates c
      JOIN scores s ON c.id = s.candidate_id
      WHERE c.is_active = true AND c.dni IS NOT NULL
      GROUP BY c.dni HAVING COUNT(*) > 1
    )
    SELECT * FROM grouped WHERE NOT (integrities[1] = ALL(integrities))
  `

  let dniFixed = 0
  for (const g of dniGroups) {
    const presIdx = (g.cargos as string[]).indexOf('presidente')
    const useIntegrity = presIdx >= 0 ? g.integrities[presIdx] : Math.min(...(g.integrities as number[]))
    for (let i = 0; i < g.ids.length; i++) {
      if (Number(g.integrities[i]) !== Number(useIntegrity)) {
        await sql`UPDATE scores SET integrity = ${useIntegrity}, updated_at = NOW() WHERE candidate_id = ${g.ids[i]}`
        const canonicalId = presIdx >= 0 ? g.ids[presIdx] : g.ids[0]
        await sql`UPDATE score_breakdowns sb SET penal_penalty = src.penal_penalty, penal_penalties = src.penal_penalties FROM score_breakdowns src WHERE sb.candidate_id = ${g.ids[i]} AND src.candidate_id = ${canonicalId}`
        console.log(`  ⚠ DNI ${g.dni}: ${g.names[i]} (${g.cargos[i]}) I: ${g.integrities[i]} → ${useIntegrity}`)
        dniFixed++
      }
    }
  }
  console.log(`\n  Total: ${dniFixed} DNI synced`)

  // Phase 4: Recalculate weighted scores
  console.log('\n--- Phase 4: Recalculate weighted scores ---')

  await sql`UPDATE scores SET
    score_balanced = ROUND((0.30 * competence + 0.30 * integrity + 0.20 * transparency + 0.20 * confidence)::numeric, 1),
    score_merit = ROUND((0.40 * competence + 0.25 * integrity + 0.15 * transparency + 0.20 * confidence)::numeric, 1),
    score_integrity = ROUND((0.25 * competence + 0.40 * integrity + 0.15 * transparency + 0.20 * confidence)::numeric, 1)
    WHERE candidate_id IN (SELECT id FROM candidates WHERE is_active = true)`

  await sql`UPDATE scores SET
    score_balanced_p = ROUND((0.30 * competence + 0.30 * integrity + 0.10 * transparency + 0.30 * plan_viability)::numeric, 1),
    score_merit_p = ROUND((0.40 * competence + 0.25 * integrity + 0.10 * transparency + 0.25 * plan_viability)::numeric, 1),
    score_integrity_p = ROUND((0.25 * competence + 0.40 * integrity + 0.10 * transparency + 0.25 * plan_viability)::numeric, 1)
    WHERE candidate_id IN (SELECT id FROM candidates WHERE is_active = true) AND plan_viability IS NOT NULL`

  console.log('  ✓ All weighted scores recalculated')

  // Phase 5: Verify
  console.log('\n--- Phase 5: Verification ---\n')

  const allRows = await sql`
    SELECT c.full_name, c.cargo, s.integrity, sb.integrity_base, sb.penal_penalty,
           sb.civil_penalties, sb.resignation_penalty, sb.reinfo_penalty,
           sb.company_penalty, sb.voting_penalty, sb.voting_bonus, sb.tax_penalty, sb.omission_penalty
    FROM candidates c JOIN scores s ON c.id = s.candidate_id JOIN score_breakdowns sb ON c.id = sb.candidate_id
    WHERE c.is_active = true`

  let mismatches = 0
  for (const row of allRows) {
    let civilSum = 0
    try {
      const civils = typeof row.civil_penalties === 'string' ? JSON.parse(row.civil_penalties) : row.civil_penalties || []
      civilSum = civils.reduce((s: number, p: { penalty: number }) => s + (Number(p.penalty) || 0), 0)
    } catch { /* */ }
    const calc = Math.min(100, Math.max(0,
      Number(row.integrity_base || 100) - Number(row.penal_penalty || 0) - civilSum
      - Number(row.resignation_penalty || 0) - Number(row.reinfo_penalty || 0)
      - Number(row.company_penalty || 0) - Number(row.voting_penalty || 0)
      + Number(row.voting_bonus || 0) - Number(row.tax_penalty || 0) - Number(row.omission_penalty || 0)
    ))
    if (Math.abs(Number(row.integrity) - calc) > 0.5) {
      console.log(`  ⚠ ${row.full_name.substring(0, 38).padEnd(40)} (${row.cargo}) stored=${row.integrity} calc=${calc}`)
      mismatches++
    }
  }
  console.log(mismatches === 0 ? '  ✓ ALL SCORES MATCH — 0 mismatches' : `\n  ⚠ ${mismatches} MISMATCHES`)

  // Phase 6: Presidential ranking
  console.log('\n' + '='.repeat(80))
  console.log(' PRESIDENTIAL RANKING')
  console.log('='.repeat(80))

  const ranking = await sql`
    SELECT c.full_name, s.competence, s.integrity, s.transparency,
           s.plan_viability, s.score_balanced_p, sb.penal_penalty, sb.penal_penalties
    FROM candidates c JOIN scores s ON c.id = s.candidate_id
    LEFT JOIN score_breakdowns sb ON c.id = sb.candidate_id
    WHERE c.cargo = 'presidente' AND c.is_active = true
    ORDER BY COALESCE(s.score_balanced_p, s.score_balanced) DESC`

  ranking.forEach((r, i) => {
    const rank = String(i + 1).padStart(2)
    const name = r.full_name.substring(0, 32).padEnd(34)
    const penalties: { severity: string; penalty: number }[] = (() => {
      try { return typeof r.penal_penalties === 'string' ? JSON.parse(r.penal_penalties) : r.penal_penalties || [] }
      catch { return [] }
    })()
    const detail = penalties.map(p => `${(p.severity || '?')[0].toUpperCase()}:-${p.penalty}`).join(' ')
    console.log(`  ${rank}. ${name} C=${String(r.competence).padStart(3)} I=${String(r.integrity).padStart(3)} T=${String(r.transparency).padStart(3)} P=${String(r.plan_viability || '-').padStart(3)} | 4P=${r.score_balanced_p || '-'} | penal=${r.penal_penalty || 0} [${detail}]`)
  })

  console.log('\n' + '='.repeat(80))
  console.log(` DONE: ${totalFixed} status corrected, ${changed} penalties recalc, ${dniFixed} DNI synced`)
  console.log('='.repeat(80))
}

main().catch(console.error)
