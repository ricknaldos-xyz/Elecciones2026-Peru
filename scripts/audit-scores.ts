/**
 * SCORE AUDIT: Comprehensive consistency and anomaly detection
 * Checks score ranges, cross-candidate consistency, data-score mismatches,
 * missing scores, outliers, and plan_viability propagation.
 */
import * as fs from 'fs'
import * as path from 'path'
import { neon } from '@neondatabase/serverless'

function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local')
  const content = fs.readFileSync(envPath, 'utf-8')
  const dbMatch = content.match(/DATABASE_URL=["']?([^"'\n]+)["']?/)
  return { db: dbMatch![1] }
}

const sql = neon(loadEnv().db)

// ─── Helpers ──────────────────────────────────────────────────────────────────

function header(title: string) {
  console.log('\n' + '='.repeat(80))
  console.log(`  ${title}`)
  console.log('='.repeat(80))
}

function sub(title: string) {
  console.log(`\n--- ${title} ---`)
}

let totalAnomalies = 0
function anomaly(msg: string) {
  totalAnomalies++
  console.log(`  [ANOMALY #${totalAnomalies}] ${msg}`)
}

function info(msg: string) {
  console.log(`  ${msg}`)
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('='.repeat(80))
  console.log('  SCORE AUDIT REPORT — Peruvian Election Candidates 2026')
  console.log('  Generated: ' + new Date().toISOString())
  console.log('='.repeat(80))

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. SCORE RANGE VALIDATION
  // ═══════════════════════════════════════════════════════════════════════════
  header('1. SCORE RANGE VALIDATION (all scores must be 0-100)')

  // The DB has CHECK constraints, but let's verify there are no nulls where unexpected
  // and also check the composite scores (score_balanced, score_merit, score_integrity)
  // which do NOT have CHECK constraints in the schema.
  sub('1a. Core sub-scores out of [0, 100]')
  const outOfRange = await sql`
    SELECT s.candidate_id, c.full_name, c.cargo,
           s.competence, s.integrity, s.transparency, s.confidence,
           s.plan_viability,
           s.score_balanced, s.score_merit, s.score_integrity
    FROM scores s
    JOIN candidates c ON s.candidate_id = c.id
    WHERE s.competence < 0 OR s.competence > 100
       OR s.integrity < 0 OR s.integrity > 100
       OR s.transparency < 0 OR s.transparency > 100
       OR s.confidence < 0 OR s.confidence > 100
  `
  if (outOfRange.length === 0) {
    info('No core sub-scores out of range (DB CHECK constraints enforced).')
  } else {
    for (const r of outOfRange) {
      anomaly(`${r.full_name} (${r.cargo}): competence=${r.competence} integrity=${r.integrity} transparency=${r.transparency} confidence=${r.confidence}`)
    }
  }

  sub('1b. plan_viability out of [0, 100]')
  const pvOutOfRange = await sql`
    SELECT s.candidate_id, c.full_name, c.cargo, s.plan_viability
    FROM scores s
    JOIN candidates c ON s.candidate_id = c.id
    WHERE s.plan_viability IS NOT NULL
      AND (s.plan_viability < 0 OR s.plan_viability > 100)
  `
  if (pvOutOfRange.length === 0) {
    info('No plan_viability values out of range.')
  } else {
    for (const r of pvOutOfRange) {
      anomaly(`${r.full_name} (${r.cargo}): plan_viability=${r.plan_viability}`)
    }
  }

  sub('1c. Composite scores (score_balanced, score_merit, score_integrity) out of [0, 100]')
  const compositeOOR = await sql`
    SELECT s.candidate_id, c.full_name, c.cargo,
           s.score_balanced, s.score_merit, s.score_integrity,
           s.score_balanced_p, s.score_merit_p, s.score_integrity_p
    FROM scores s
    JOIN candidates c ON s.candidate_id = c.id
    WHERE s.score_balanced < 0 OR s.score_balanced > 100
       OR s.score_merit < 0 OR s.score_merit > 100
       OR s.score_integrity < 0 OR s.score_integrity > 100
       OR (s.score_balanced_p IS NOT NULL AND (s.score_balanced_p < 0 OR s.score_balanced_p > 100))
       OR (s.score_merit_p IS NOT NULL AND (s.score_merit_p < 0 OR s.score_merit_p > 100))
       OR (s.score_integrity_p IS NOT NULL AND (s.score_integrity_p < 0 OR s.score_integrity_p > 100))
  `
  if (compositeOOR.length === 0) {
    info('All composite scores within [0, 100].')
  } else {
    for (const r of compositeOOR) {
      anomaly(`${r.full_name} (${r.cargo}): balanced=${r.score_balanced} merit=${r.score_merit} integrity_score=${r.score_integrity} balanced_p=${r.score_balanced_p} merit_p=${r.score_merit_p} integrity_p=${r.score_integrity_p}`)
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. SAME PERSON (DNI) WITH DIFFERENT SCORES ACROSS CARGOS
  // ═══════════════════════════════════════════════════════════════════════════
  header('2. SAME DNI — DIFFERENT INTEGRITY / TRANSPARENCY SCORES')

  const dniDiffs = await sql`
    WITH multi AS (
      SELECT c.dni,
             array_agg(c.full_name ORDER BY c.cargo) as names,
             array_agg(c.cargo ORDER BY c.cargo) as cargos,
             array_agg(s.integrity ORDER BY c.cargo) as integrities,
             array_agg(s.transparency ORDER BY c.cargo) as transparencies,
             array_agg(c.id ORDER BY c.cargo) as ids
      FROM candidates c
      JOIN scores s ON c.id = s.candidate_id
      WHERE c.dni IS NOT NULL AND c.is_active = true
      GROUP BY c.dni
      HAVING COUNT(*) > 1
    )
    SELECT * FROM multi
    WHERE NOT (
      integrities[1] = ALL(integrities)
      AND transparencies[1] = ALL(transparencies)
    )
    ORDER BY dni
  `
  if (dniDiffs.length === 0) {
    info('No same-DNI candidates with differing integrity/transparency scores.')
  } else {
    info(`Found ${dniDiffs.length} DNIs with inconsistent scores:`)
    for (const r of dniDiffs) {
      anomaly(`DNI ${r.dni}: ${r.names.join(' / ')} | cargos: ${r.cargos.join(', ')} | integrity: [${r.integrities.join(', ')}] | transparency: [${r.transparencies.join(', ')}]`)
    }
  }

  // Also list all same-DNI multi-cargo candidates for reference
  sub('2b. All multi-cargo DNIs (for reference)')
  const allMultiDni = await sql`
    SELECT c.dni,
           array_agg(c.full_name ORDER BY c.cargo) as names,
           array_agg(c.cargo ORDER BY c.cargo) as cargos
    FROM candidates c
    WHERE c.dni IS NOT NULL AND c.is_active = true
    GROUP BY c.dni
    HAVING COUNT(*) > 1
    ORDER BY dni
  `
  info(`Total same-DNI multi-cargo candidates: ${allMultiDni.length}`)
  for (const r of allMultiDni) {
    info(`  DNI ${r.dni}: ${r.names.join(' / ')} => ${r.cargos.join(', ')}`)
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. SCORE VS DATA MISMATCHES
  // ═══════════════════════════════════════════════════════════════════════════
  header('3. SCORE VS DATA MISMATCHES')

  // 3a. Candidates with penal sentences but integrity = 100
  sub('3a. Penal sentences but integrity = 100 (should be penalized)')
  const penalFull = await sql`
    SELECT c.full_name, c.cargo, c.penal_sentences, s.integrity
    FROM candidates c
    JOIN scores s ON c.id = s.candidate_id
    WHERE c.is_active = true
      AND s.integrity >= 100
      AND c.penal_sentences IS NOT NULL
      AND c.penal_sentences != '[]'::jsonb
      AND jsonb_array_length(c.penal_sentences) > 0
  `
  if (penalFull.length === 0) {
    info('No candidates with penal sentences AND integrity = 100.')
  } else {
    for (const r of penalFull) {
      anomaly(`${r.full_name} (${r.cargo}): integrity=${r.integrity} but has penal_sentences=${JSON.stringify(r.penal_sentences)}`)
    }
  }

  // 3b. Candidates with NO penal/civil sentences but integrity < 100 — why?
  sub('3b. No sentences but integrity < 100 (why penalized?)')
  const noSentenceLowInt = await sql`
    SELECT c.full_name, c.cargo, s.integrity,
           c.penal_sentences, c.civil_sentences,
           c.party_resignations,
           sb.penal_penalty, sb.resignation_penalty, sb.company_penalty,
           sb.voting_penalty, sb.tax_penalty, sb.omission_penalty,
           sb.civil_penalties
    FROM candidates c
    JOIN scores s ON c.id = s.candidate_id
    LEFT JOIN score_breakdowns sb ON c.id = sb.candidate_id
    WHERE c.is_active = true
      AND s.integrity < 100
      AND (c.penal_sentences IS NULL OR c.penal_sentences = '[]'::jsonb OR jsonb_array_length(c.penal_sentences) = 0)
      AND (c.civil_sentences IS NULL OR c.civil_sentences = '[]'::jsonb OR jsonb_array_length(c.civil_sentences) = 0)
    ORDER BY s.integrity ASC
    LIMIT 40
  `
  if (noSentenceLowInt.length === 0) {
    info('No candidates without sentences have integrity < 100.')
  } else {
    info(`Found ${noSentenceLowInt.length} (showing up to 40):`)
    for (const r of noSentenceLowInt) {
      const penalties: string[] = []
      if (Number(r.penal_penalty) > 0) penalties.push(`penal_penalty=${r.penal_penalty}`)
      if (Number(r.resignation_penalty) > 0) penalties.push(`resign_pen=${r.resignation_penalty}`)
      if (Number(r.company_penalty) > 0) penalties.push(`company_pen=${r.company_penalty}`)
      if (Number(r.voting_penalty) > 0) penalties.push(`voting_pen=${r.voting_penalty}`)
      if (Number(r.tax_penalty) > 0) penalties.push(`tax_pen=${r.tax_penalty}`)
      if (Number(r.omission_penalty) > 0) penalties.push(`omission_pen=${r.omission_penalty}`)
      if (r.civil_penalties && JSON.stringify(r.civil_penalties) !== '[]') penalties.push(`civil_penalties=${JSON.stringify(r.civil_penalties)}`)
      if (Number(r.party_resignations) > 0) penalties.push(`party_resignations=${r.party_resignations}`)
      const reason = penalties.length > 0 ? penalties.join(', ') : 'NO BREAKDOWN REASON FOUND'
      anomaly(`${r.full_name} (${r.cargo}): integrity=${r.integrity} | ${reason}`)
    }
  }

  // 3c. Extensive education (Maestría/Doctorado) but very low competence (<25)
  sub('3c. High education but very low competence (<25)')
  const highEdLowComp = await sql`
    SELECT c.full_name, c.cargo, c.education_level, s.competence, s.confidence
    FROM candidates c
    JOIN scores s ON c.id = s.candidate_id
    WHERE c.is_active = true
      AND c.education_level IN ('Maestría', 'Doctorado')
      AND s.competence < 25
    ORDER BY s.competence ASC
  `
  if (highEdLowComp.length === 0) {
    info('No candidates with Maestria/Doctorado and competence < 25.')
  } else {
    for (const r of highEdLowComp) {
      anomaly(`${r.full_name} (${r.cargo}): education=${r.education_level} but competence=${r.competence} (confidence=${r.confidence})`)
    }
  }

  // 3d. Candidates with competence = 0
  sub('3d. Candidates with competence = 0')
  const zeroComp = await sql`
    SELECT c.full_name, c.cargo, c.education_level, c.education_details, c.experience_details,
           s.competence, s.confidence
    FROM candidates c
    JOIN scores s ON c.id = s.candidate_id
    WHERE c.is_active = true AND s.competence = 0
    ORDER BY c.full_name
  `
  if (zeroComp.length === 0) {
    info('No candidates with competence = 0.')
  } else {
    info(`Found ${zeroComp.length} candidates with competence=0:`)
    for (const r of zeroComp) {
      const eduItems = Array.isArray(r.education_details) ? r.education_details.length : 0
      const expItems = Array.isArray(r.experience_details) ? r.experience_details.length : 0
      anomaly(`${r.full_name} (${r.cargo}): competence=0 | education_level=${r.education_level || 'null'} | edu_entries=${eduItems} | exp_entries=${expItems} | confidence=${r.confidence}`)
    }
  }

  // 3e. Candidates with integrity = 0 — always suspicious
  sub('3e. Candidates with integrity = 0')
  const zeroInt = await sql`
    SELECT c.full_name, c.cargo, s.integrity, c.penal_sentences, c.civil_sentences
    FROM candidates c
    JOIN scores s ON c.id = s.candidate_id
    WHERE c.is_active = true AND s.integrity = 0
    ORDER BY c.full_name
  `
  if (zeroInt.length === 0) {
    info('No candidates with integrity = 0.')
  } else {
    for (const r of zeroInt) {
      const hasPenal = r.penal_sentences && JSON.stringify(r.penal_sentences) !== '[]'
      const hasCivil = r.civil_sentences && JSON.stringify(r.civil_sentences) !== '[]'
      anomaly(`${r.full_name} (${r.cargo}): integrity=0 | penal=${hasPenal ? 'YES' : 'NO'} | civil=${hasCivil ? 'YES' : 'NO'}`)
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. CANDIDATES WITHOUT SCORES
  // ═══════════════════════════════════════════════════════════════════════════
  header('4. ACTIVE CANDIDATES MISSING SCORE RECORDS')

  const noScores = await sql`
    SELECT c.id, c.full_name, c.cargo, c.slug, p.name as party_name
    FROM candidates c
    LEFT JOIN scores s ON c.id = s.candidate_id
    LEFT JOIN parties p ON c.party_id = p.id
    WHERE c.is_active = true AND s.id IS NULL
    ORDER BY c.cargo, c.full_name
  `
  if (noScores.length === 0) {
    info('All active candidates have score records.')
  } else {
    info(`Found ${noScores.length} active candidates WITHOUT scores:`)
    const byCargo: Record<string, typeof noScores> = {}
    for (const r of noScores) {
      if (!byCargo[r.cargo]) byCargo[r.cargo] = []
      byCargo[r.cargo].push(r)
    }
    for (const [cargo, list] of Object.entries(byCargo)) {
      info(`\n  ${cargo.toUpperCase()} (${list.length}):`)
      for (const r of list) {
        anomaly(`${r.full_name} (${cargo}) — party: ${r.party_name || 'NONE'} — slug: ${r.slug}`)
      }
    }
  }

  // Also check for missing score_breakdowns
  sub('4b. Active candidates with scores but NO score_breakdowns')
  const noBreakdowns = await sql`
    SELECT c.full_name, c.cargo, s.competence, s.integrity
    FROM candidates c
    JOIN scores s ON c.id = s.candidate_id
    LEFT JOIN score_breakdowns sb ON c.id = sb.candidate_id
    WHERE c.is_active = true AND sb.id IS NULL
    ORDER BY c.cargo, c.full_name
  `
  if (noBreakdowns.length === 0) {
    info('All scored candidates have score_breakdowns.')
  } else {
    info(`Found ${noBreakdowns.length} candidates with scores but no breakdowns:`)
    for (const r of noBreakdowns) {
      anomaly(`${r.full_name} (${r.cargo}): competence=${r.competence} integrity=${r.integrity}`)
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. OUTLIER DETECTION
  // ═══════════════════════════════════════════════════════════════════════════
  header('5. OUTLIER DETECTION — Unusual Score Combinations')

  // 5a. High competence (>90) but very low balanced (<30)
  sub('5a. competence > 90 but score_balanced < 30')
  const highCompLowBal = await sql`
    SELECT c.full_name, c.cargo, s.competence, s.integrity, s.transparency, s.confidence,
           s.score_balanced, s.score_merit, s.score_integrity
    FROM candidates c
    JOIN scores s ON c.id = s.candidate_id
    WHERE c.is_active = true
      AND s.competence > 90
      AND s.score_balanced < 30
    ORDER BY s.score_balanced ASC
  `
  if (highCompLowBal.length === 0) {
    info('None found.')
  } else {
    for (const r of highCompLowBal) {
      anomaly(`${r.full_name} (${r.cargo}): comp=${r.competence} balanced=${r.score_balanced} int=${r.integrity} trans=${r.transparency} conf=${r.confidence}`)
    }
  }

  // 5b. integrity = 0 but NO sentences at all
  sub('5b. integrity = 0 but no penal/civil sentences')
  const intZeroNoSent = await sql`
    SELECT c.full_name, c.cargo, s.integrity, c.penal_sentences, c.civil_sentences
    FROM candidates c
    JOIN scores s ON c.id = s.candidate_id
    WHERE c.is_active = true
      AND s.integrity = 0
      AND (c.penal_sentences IS NULL OR c.penal_sentences = '[]'::jsonb OR jsonb_array_length(c.penal_sentences) = 0)
      AND (c.civil_sentences IS NULL OR c.civil_sentences = '[]'::jsonb OR jsonb_array_length(c.civil_sentences) = 0)
  `
  if (intZeroNoSent.length === 0) {
    info('None found.')
  } else {
    for (const r of intZeroNoSent) {
      anomaly(`${r.full_name} (${r.cargo}): integrity=0 with NO sentences recorded`)
    }
  }

  // 5c. Very high competence but very low confidence (unreliable data?)
  sub('5c. competence > 80 but confidence < 20')
  const highCompLowConf = await sql`
    SELECT c.full_name, c.cargo, s.competence, s.confidence
    FROM candidates c
    JOIN scores s ON c.id = s.candidate_id
    WHERE c.is_active = true
      AND s.competence > 80
      AND s.confidence < 20
    ORDER BY s.confidence ASC
  `
  if (highCompLowConf.length === 0) {
    info('None found.')
  } else {
    for (const r of highCompLowConf) {
      anomaly(`${r.full_name} (${r.cargo}): competence=${r.competence} but confidence=${r.confidence} — questionable data quality`)
    }
  }

  // 5d. All four sub-scores identical (suspicious default/copy)
  sub('5d. All four sub-scores identical (possible default values)')
  const allSame = await sql`
    SELECT c.full_name, c.cargo, s.competence, s.integrity, s.transparency, s.confidence
    FROM candidates c
    JOIN scores s ON c.id = s.candidate_id
    WHERE c.is_active = true
      AND s.competence = s.integrity
      AND s.integrity = s.transparency
      AND s.transparency = s.confidence
    ORDER BY s.competence
  `
  if (allSame.length === 0) {
    info('None found.')
  } else {
    info(`Found ${allSame.length} candidates with identical sub-scores:`)
    for (const r of allSame) {
      anomaly(`${r.full_name} (${r.cargo}): all scores = ${r.competence}`)
    }
  }

  // 5e. Enormous gap between sub-scores (any pair differs by >70)
  sub('5e. Extreme score spread (any two sub-scores differ by >70)')
  const bigGap = await sql`
    SELECT c.full_name, c.cargo, s.competence, s.integrity, s.transparency, s.confidence,
           GREATEST(s.competence, s.integrity, s.transparency, s.confidence)
           - LEAST(s.competence, s.integrity, s.transparency, s.confidence) as spread
    FROM candidates c
    JOIN scores s ON c.id = s.candidate_id
    WHERE c.is_active = true
      AND (GREATEST(s.competence, s.integrity, s.transparency, s.confidence)
           - LEAST(s.competence, s.integrity, s.transparency, s.confidence)) > 70
    ORDER BY spread DESC
    LIMIT 30
  `
  if (bigGap.length === 0) {
    info('None found.')
  } else {
    info(`Found ${bigGap.length} candidates (showing up to 30):`)
    for (const r of bigGap) {
      anomaly(`${r.full_name} (${r.cargo}): comp=${r.competence} int=${r.integrity} trans=${r.transparency} conf=${r.confidence} (spread=${r.spread})`)
    }
  }

  // 5f. Statistical outliers: z-score approach per cargo
  sub('5f. Statistical outliers by cargo (>2.5 std deviations from mean)')
  const statOutliers = await sql`
    WITH stats AS (
      SELECT c.cargo,
             AVG(s.competence) as avg_comp, STDDEV(s.competence) as std_comp,
             AVG(s.integrity) as avg_int, STDDEV(s.integrity) as std_int,
             AVG(s.transparency) as avg_trans, STDDEV(s.transparency) as std_trans,
             AVG(s.score_balanced) as avg_bal, STDDEV(s.score_balanced) as std_bal
      FROM candidates c
      JOIN scores s ON c.id = s.candidate_id
      WHERE c.is_active = true
      GROUP BY c.cargo
    )
    SELECT c.full_name, c.cargo,
           s.competence, s.integrity, s.transparency, s.score_balanced,
           ROUND(((s.competence - st.avg_comp) / NULLIF(st.std_comp, 0))::numeric, 2) as z_comp,
           ROUND(((s.integrity - st.avg_int) / NULLIF(st.std_int, 0))::numeric, 2) as z_int,
           ROUND(((s.transparency - st.avg_trans) / NULLIF(st.std_trans, 0))::numeric, 2) as z_trans,
           ROUND(((s.score_balanced - st.avg_bal) / NULLIF(st.std_bal, 0))::numeric, 2) as z_bal
    FROM candidates c
    JOIN scores s ON c.id = s.candidate_id
    JOIN stats st ON c.cargo = st.cargo
    WHERE c.is_active = true
      AND (
        ABS((s.competence - st.avg_comp) / NULLIF(st.std_comp, 0)) > 2.5
        OR ABS((s.integrity - st.avg_int) / NULLIF(st.std_int, 0)) > 2.5
        OR ABS((s.transparency - st.avg_trans) / NULLIF(st.std_trans, 0)) > 2.5
        OR ABS((s.score_balanced - st.avg_bal) / NULLIF(st.std_bal, 0)) > 2.5
      )
    ORDER BY c.cargo, c.full_name
  `
  if (statOutliers.length === 0) {
    info('No statistical outliers found (>2.5 SD).')
  } else {
    info(`Found ${statOutliers.length} statistical outliers:`)
    for (const r of statOutliers) {
      const zScores: string[] = []
      if (Math.abs(Number(r.z_comp)) > 2.5) zScores.push(`comp z=${r.z_comp}`)
      if (Math.abs(Number(r.z_int)) > 2.5) zScores.push(`int z=${r.z_int}`)
      if (Math.abs(Number(r.z_trans)) > 2.5) zScores.push(`trans z=${r.z_trans}`)
      if (Math.abs(Number(r.z_bal)) > 2.5) zScores.push(`balanced z=${r.z_bal}`)
      anomaly(`${r.full_name} (${r.cargo}): comp=${r.competence} int=${r.integrity} trans=${r.transparency} balanced=${r.score_balanced} | ${zScores.join(', ')}`)
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. PLAN_VIABILITY PROPAGATION CHECK
  // ═══════════════════════════════════════════════════════════════════════════
  header('6. PLAN_VIABILITY PROPAGATION CHECK')

  // Presidential candidates should have plan_viability set
  sub('6a. Presidential candidates WITHOUT plan_viability')
  const presNoPV = await sql`
    SELECT c.full_name, c.slug, p.name as party_name, s.plan_viability
    FROM candidates c
    JOIN scores s ON c.id = s.candidate_id
    LEFT JOIN parties p ON c.party_id = p.id
    WHERE c.cargo = 'presidente' AND c.is_active = true
      AND s.plan_viability IS NULL
    ORDER BY c.full_name
  `
  if (presNoPV.length === 0) {
    info('All presidential candidates have plan_viability set.')
  } else {
    info(`Found ${presNoPV.length} presidential candidates without plan_viability:`)
    for (const r of presNoPV) {
      anomaly(`${r.full_name} (${r.party_name || 'NO PARTY'}): plan_viability IS NULL`)
    }
  }

  // 6b. Presidential plan_viability values
  sub('6b. Presidential plan_viability values (reference)')
  const presPV = await sql`
    SELECT c.full_name, p.name as party_name, p.id as party_id,
           s.plan_viability
    FROM candidates c
    JOIN scores s ON c.id = s.candidate_id
    LEFT JOIN parties p ON c.party_id = p.id
    WHERE c.cargo = 'presidente' AND c.is_active = true
      AND s.plan_viability IS NOT NULL
    ORDER BY s.plan_viability DESC
  `
  for (const r of presPV) {
    info(`  ${r.full_name} (${r.party_name}): plan_viability=${r.plan_viability}`)
  }

  // 6c. Check propagation: party members should have the same plan_viability as their presidential candidate
  sub('6c. Party members with DIFFERENT plan_viability than their presidential candidate')
  const propagationIssues = await sql`
    WITH pres_pv AS (
      SELECT c.party_id, s.plan_viability, c.full_name as pres_name
      FROM candidates c
      JOIN scores s ON c.id = s.candidate_id
      WHERE c.cargo = 'presidente' AND c.is_active = true
        AND s.plan_viability IS NOT NULL
        AND c.party_id IS NOT NULL
    )
    SELECT m.full_name, m.cargo, p.name as party_name,
           ms.plan_viability as member_pv,
           pp.plan_viability as pres_pv,
           pp.pres_name
    FROM candidates m
    JOIN scores ms ON m.id = ms.candidate_id
    JOIN pres_pv pp ON m.party_id = pp.party_id
    LEFT JOIN parties p ON m.party_id = p.id
    WHERE m.is_active = true
      AND m.cargo != 'presidente'
      AND (ms.plan_viability IS NULL OR ms.plan_viability != pp.plan_viability)
    ORDER BY p.name, m.cargo, m.full_name
  `
  if (propagationIssues.length === 0) {
    info('All party members have correctly propagated plan_viability.')
  } else {
    info(`Found ${propagationIssues.length} members with mismatched plan_viability:`)
    // Group by party for readability
    const byParty: Record<string, typeof propagationIssues> = {}
    for (const r of propagationIssues) {
      const key = r.party_name || 'UNKNOWN'
      if (!byParty[key]) byParty[key] = []
      byParty[key].push(r)
    }
    for (const [party, members] of Object.entries(byParty)) {
      const presPv = members[0].pres_pv
      const nullCount = members.filter(m => m.member_pv === null).length
      const diffCount = members.filter(m => m.member_pv !== null).length
      info(`\n  ${party} (pres plan_viability=${presPv}): ${members.length} mismatches (${nullCount} NULL, ${diffCount} different value)`)
      // Show first 5 per party
      for (const m of members.slice(0, 5)) {
        anomaly(`${m.full_name} (${m.cargo}): member_pv=${m.member_pv ?? 'NULL'} vs pres_pv=${m.pres_pv}`)
      }
      if (members.length > 5) {
        info(`  ... and ${members.length - 5} more in ${party}`)
      }
    }
  }

  // 6d. Non-presidential candidates with plan_viability but their party has NO presidential candidate
  sub('6d. Candidates with plan_viability but no presidential candidate in party')
  const orphanPV = await sql`
    WITH pres_parties AS (
      SELECT DISTINCT party_id
      FROM candidates
      WHERE cargo = 'presidente' AND is_active = true AND party_id IS NOT NULL
    )
    SELECT c.full_name, c.cargo, p.name as party_name, s.plan_viability
    FROM candidates c
    JOIN scores s ON c.id = s.candidate_id
    LEFT JOIN parties p ON c.party_id = p.id
    WHERE c.is_active = true
      AND c.cargo != 'presidente'
      AND s.plan_viability IS NOT NULL
      AND (c.party_id IS NULL OR c.party_id NOT IN (SELECT party_id FROM pres_parties))
    ORDER BY c.full_name
  `
  if (orphanPV.length === 0) {
    info('No orphaned plan_viability values found.')
  } else {
    info(`Found ${orphanPV.length} candidates with plan_viability but no presidential candidate in their party:`)
    for (const r of orphanPV) {
      anomaly(`${r.full_name} (${r.cargo}, ${r.party_name || 'NO PARTY'}): plan_viability=${r.plan_viability}`)
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SUMMARY STATISTICS
  // ═══════════════════════════════════════════════════════════════════════════
  header('SUMMARY STATISTICS')

  const summary = await sql`
    SELECT
      c.cargo,
      COUNT(*)::int as total,
      COUNT(s.id)::int as scored,
      (COUNT(*) - COUNT(s.id))::int as unscored,
      ROUND(AVG(s.competence)::numeric, 1) as avg_comp,
      ROUND(AVG(s.integrity)::numeric, 1) as avg_int,
      ROUND(AVG(s.transparency)::numeric, 1) as avg_trans,
      ROUND(AVG(s.confidence)::numeric, 1) as avg_conf,
      ROUND(AVG(s.score_balanced)::numeric, 1) as avg_bal,
      ROUND(MIN(s.score_balanced)::numeric, 1) as min_bal,
      ROUND(MAX(s.score_balanced)::numeric, 1) as max_bal,
      COUNT(s.plan_viability)::int as has_pv
    FROM candidates c
    LEFT JOIN scores s ON c.id = s.candidate_id
    WHERE c.is_active = true
    GROUP BY c.cargo
    ORDER BY c.cargo
  `
  for (const r of summary) {
    info(`${r.cargo.toUpperCase()}: total=${r.total} scored=${r.scored} unscored=${r.unscored} | avg_balanced=${r.avg_bal} [${r.min_bal}-${r.max_bal}] | avg_comp=${r.avg_comp} avg_int=${r.avg_int} avg_trans=${r.avg_trans} avg_conf=${r.avg_conf} | has_plan_viability=${r.has_pv}`)
  }

  console.log('\n' + '='.repeat(80))
  console.log(`  AUDIT COMPLETE: ${totalAnomalies} total anomalies found`)
  console.log('='.repeat(80) + '\n')
}

main().catch(err => {
  console.error('FATAL ERROR:', err)
  process.exit(1)
})
