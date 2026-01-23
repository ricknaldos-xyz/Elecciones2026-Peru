/**
 * Enhanced Score Recalculation Script
 *
 * Recalculates scores using all new data sources:
 * - Company legal issues (INDECOPI, SUNAFIL, OEFA)
 * - Incumbent performance (Contraloría, MEF)
 * - Tax status (SUNAT)
 * - Voting record (Congreso)
 * - Judicial discrepancies
 */

import { neon } from '@neondatabase/serverless'
import {
  calculateEnhancedScores,
  type EnhancedIntegrityData,
  type EducationDetail,
  type Experience,
  type EducationLevel,
  type RoleType,
  type SeniorityLevel,
  type PenalSentence,
  type CivilSentence,
} from '../src/lib/scoring'

const sql = neon(process.env.DATABASE_URL!)

// Map database education level to scoring system
function mapEducationLevel(level: string): EducationLevel {
  const mapping: Record<string, EducationLevel> = {
    sin_informacion: 'sin_informacion',
    primaria_completa: 'primaria',
    secundaria_incompleta: 'secundaria_incompleta',
    secundaria_completa: 'secundaria_completa',
    tecnico_incompleto: 'tecnico_incompleto',
    tecnico_completo: 'tecnico_completo',
    universitario_incompleto: 'universitario_incompleto',
    universitario_completo: 'universitario_completo',
    titulo_profesional: 'titulo_profesional',
    maestria: 'maestria',
    doctorado: 'doctorado',
  }
  return mapping[level] || 'sin_informacion'
}

// Map database role type to scoring system
function mapRoleType(roleType: string): RoleType {
  const mapping: Record<string, RoleType> = {
    electivo_alto: 'electivo_alto',
    electivo_medio: 'electivo_medio',
    ejecutivo_publico_alto: 'ejecutivo_publico_alto',
    ejecutivo_publico_medio: 'ejecutivo_publico_medio',
    ejecutivo_privado_alto: 'ejecutivo_privado_alto',
    ejecutivo_privado_medio: 'ejecutivo_privado_medio',
    tecnico_profesional: 'tecnico_profesional',
    academia: 'academia',
    internacional: 'internacional',
    partidario: 'partidario',
  }
  return mapping[roleType] || 'tecnico_profesional'
}

// Map seniority level
function mapSeniorityLevel(level: string): SeniorityLevel {
  const mapping: Record<string, SeniorityLevel> = {
    individual: 'individual_contributor',
    coordinador: 'coordinador',
    jefatura: 'jefatura',
    gerencia: 'gerencia',
    direccion: 'direccion',
  }
  return mapping[level] || 'individual_contributor'
}

// Parse year from date string
function parseYear(dateStr?: string): number {
  if (!dateStr) return new Date().getFullYear()
  const year = parseInt(dateStr.substring(0, 4))
  return isNaN(year) ? new Date().getFullYear() : year
}

/**
 * Fetch company legal issues for a candidate
 */
async function getCompanyIssues(candidateId: string): Promise<{
  penalCases: number
  laborIssues: number
  environmentalIssues: number
  consumerComplaints: number
  totalFines: number
}> {
  const result = await sql`
    SELECT
      cli.issue_type,
      COUNT(*) as count,
      COALESCE(SUM(cli.fine_amount), 0) as total_fines
    FROM company_legal_issues cli
    JOIN candidate_companies cc ON cli.company_id = cc.id
    WHERE cc.candidate_id = ${candidateId}::uuid
    GROUP BY cli.issue_type
  `

  let penalCases = 0
  let laborIssues = 0
  let environmentalIssues = 0
  let consumerComplaints = 0
  let totalFines = 0

  for (const row of result) {
    const count = Number(row.count) || 0
    totalFines += Number(row.total_fines) || 0

    switch (row.issue_type) {
      case 'penal':
        penalCases = count
        break
      case 'laboral':
        laborIssues = count
        break
      case 'ambiental':
        environmentalIssues = count
        break
      case 'consumidor':
        consumerComplaints = count
        break
    }
  }

  return { penalCases, laborIssues, environmentalIssues, consumerComplaints, totalFines }
}

/**
 * Fetch incumbent performance for a candidate
 */
async function getIncumbentPerformance(candidateId: string): Promise<{
  isIncumbent: boolean
  budgetExecutionPct?: number
  contraloríaReports?: number
  performanceScore?: number
}> {
  const result = await sql`
    SELECT
      budget_execution_pct,
      contraloria_reports,
      performance_score
    FROM incumbent_performance
    WHERE candidate_id = ${candidateId}::uuid
    LIMIT 1
  `

  if (result.length === 0) {
    return { isIncumbent: false }
  }

  const row = result[0]
  return {
    isIncumbent: true,
    budgetExecutionPct: row.budget_execution_pct ? Number(row.budget_execution_pct) : undefined,
    contraloríaReports: row.contraloria_reports ? Number(row.contraloria_reports) : undefined,
    performanceScore: row.performance_score ? Number(row.performance_score) : undefined,
  }
}

/**
 * Fetch voting record penalties for a candidate
 */
async function getVotingPenalties(candidateId: string): Promise<{
  proCrimeVotesInFavor: number
  proCrimeVotesAgainst: number
  votingIntegrityPenalty: number
  votingIntegrityBonus: number
}> {
  // Get votes on controversial laws (join on project_id)
  const votes = await sql`
    SELECT
      cv.vote_type,
      cl.penalty_points,
      cl.bonus_points
    FROM congressional_votes cv
    JOIN controversial_laws cl ON cv.project_id = cl.project_id
    WHERE cv.candidate_id = ${candidateId}::uuid
  `

  let proCrimeVotesInFavor = 0
  let proCrimeVotesAgainst = 0
  let votingIntegrityPenalty = 0
  let votingIntegrityBonus = 0

  for (const vote of votes) {
    if (vote.vote_type === 'favor') {
      proCrimeVotesInFavor++
      votingIntegrityPenalty += Number(vote.penalty_points) || 0
    } else if (vote.vote_type === 'contra') {
      proCrimeVotesAgainst++
      votingIntegrityBonus += Number(vote.bonus_points) || 0
    }
  }

  return {
    proCrimeVotesInFavor,
    proCrimeVotesAgainst,
    votingIntegrityPenalty,
    votingIntegrityBonus,
  }
}

/**
 * Fetch tax status for a candidate
 */
async function getTaxStatus(candidateId: string): Promise<{
  taxCondition?: 'habido' | 'no_habido' | 'no_hallado' | 'pendiente'
  taxStatus?: 'activo' | 'suspendido' | 'baja_definitiva' | 'baja_provisional'
  hasCoactiveDebts: boolean
  coactiveDebtCount: number
}> {
  const result = await sql`
    SELECT
      condition,
      status,
      has_coactive_debts,
      coactive_debt_count
    FROM candidate_tax_status
    WHERE candidate_id = ${candidateId}::uuid
    LIMIT 1
  `

  if (result.length === 0) {
    return { hasCoactiveDebts: false, coactiveDebtCount: 0 }
  }

  const row = result[0]
  return {
    taxCondition: row.condition as any,
    taxStatus: row.status as any,
    hasCoactiveDebts: Boolean(row.has_coactive_debts),
    coactiveDebtCount: Number(row.coactive_debt_count) || 0,
  }
}

/**
 * Transform database data to EnhancedIntegrityData for scoring
 */
async function transformToEnhancedScoringData(candidate: any): Promise<EnhancedIntegrityData> {
  // Education
  const education: EducationDetail[] = (candidate.education_details || []).map((ed: any) => ({
    level: mapEducationLevel(ed.level),
    field: ed.field_of_study,
    institution: ed.institution,
    year: ed.end_date ? parseYear(ed.end_date) : undefined,
    isVerified: ed.is_verified,
  }))

  // Experience
  const experience: Experience[] = (candidate.experience_details || []).map((exp: any) => {
    const startYear = parseYear(exp.start_date)
    const endYear = exp.is_current ? undefined : parseYear(exp.end_date)
    const isLeadership = ['direccion', 'gerencia', 'jefatura'].includes(exp.seniority_level)

    return {
      role: exp.position,
      roleType: mapRoleType(exp.role_type),
      organization: exp.organization,
      startYear,
      endYear,
      isLeadership,
      seniorityLevel: mapSeniorityLevel(exp.seniority_level),
    }
  })

  // Add political trajectory as experience
  const politicalExp: Experience[] = (candidate.political_trajectory || []).map((pt: any) => {
    const startYear = parseYear(pt.start_date)
    const endYear = pt.end_date ? parseYear(pt.end_date) : undefined
    const roleType: RoleType = pt.is_elected ? 'electivo_alto' : 'partidario'

    return {
      role: pt.position,
      roleType,
      organization: pt.party || 'Gobierno',
      startYear,
      endYear,
      isLeadership: pt.is_elected,
      seniorityLevel: 'direccion' as SeniorityLevel,
    }
  })

  const allExperience = [...experience, ...politicalExp]

  // Penal sentences
  const penalSentences: PenalSentence[] = (candidate.penal_sentences || []).map((s: any) => ({
    type: 'penal' as const,
    description: s.description,
    isFirm: s.status === 'firme',
    year: s.date ? parseYear(s.date) : undefined,
  }))

  // Civil sentences
  const civilSentences: CivilSentence[] = (candidate.civil_sentences || []).map((s: any) => {
    let type: CivilSentence['type'] = 'contractual'
    if (s.type?.includes('violencia')) type = 'violence'
    else if (s.type?.includes('alimento')) type = 'alimentos'
    else if (s.type?.includes('laboral')) type = 'laboral'

    return {
      type,
      description: s.description,
      year: s.date ? parseYear(s.date) : undefined,
    }
  })

  // Calculate completeness based on available data
  let completeness = 30
  if (education.length > 0) completeness += 20
  if (allExperience.length > 0) completeness += 20
  if (candidate.birth_date) completeness += 10
  if (candidate.assets_declaration) completeness += 20

  // Verification level
  let verificationLevel = 50
  if (candidate.data_verified) verificationLevel += 30
  if (candidate.data_source?.includes('verified')) verificationLevel += 20

  // Fetch new data sources
  const companyIssues = await getCompanyIssues(candidate.id)
  const incumbentPerf = await getIncumbentPerformance(candidate.id)
  const votingPenalties = await getVotingPenalties(candidate.id)
  const taxStatus = await getTaxStatus(candidate.id)

  return {
    education,
    experience: allExperience,
    penalSentences,
    civilSentences,
    partyResignations: candidate.party_resignations || 0,
    declarationCompleteness: completeness,
    declarationConsistency: completeness,
    assetsQuality: candidate.assets_declaration ? 60 : 30,
    verificationLevel,
    coverageLevel: verificationLevel,

    // New data sources
    companyPenalCases: companyIssues.penalCases,
    companyLaborIssues: companyIssues.laborIssues,
    companyEnvironmentalIssues: companyIssues.environmentalIssues,
    companyConsumerComplaints: companyIssues.consumerComplaints,

    isIncumbent: incumbentPerf.isIncumbent,
    budgetExecutionPct: incumbentPerf.budgetExecutionPct,
    contraloríaReports: incumbentPerf.contraloríaReports,
    performanceScore: incumbentPerf.performanceScore,

    proCrimeVotesInFavor: votingPenalties.proCrimeVotesInFavor,
    proCrimeVotesAgainst: votingPenalties.proCrimeVotesAgainst,
    votingIntegrityPenalty: votingPenalties.votingIntegrityPenalty,
    votingIntegrityBonus: votingPenalties.votingIntegrityBonus,

    taxCondition: taxStatus.taxCondition,
    taxStatus: taxStatus.taxStatus,
    hasCoactiveDebts: taxStatus.hasCoactiveDebts,
    coactiveDebtCount: taxStatus.coactiveDebtCount,
  }
}

async function recalculateEnhancedScores() {
  console.log('🚀 Recalculando scores con datos mejorados...\n')
  console.log('='.repeat(60))

  // Get all candidates
  const candidates = await sql`
    SELECT
      id, slug, full_name, cargo,
      education_level, education_details,
      experience_details, political_trajectory,
      penal_sentences, civil_sentences,
      party_resignations, assets_declaration,
      birth_date, data_verified, data_source
    FROM candidates
    ORDER BY cargo, full_name
  `

  console.log(`📋 Candidatos a procesar: ${candidates.length}\n`)

  let processed = 0
  let errors = 0
  const detailedResults: Array<{
    name: string
    cargo: string
    oldIntegrity: number
    newIntegrity: number
    companyPenalty: number
    incumbentBonus: number
    balanced: number
  }> = []

  for (const candidate of candidates) {
    try {
      console.log(`\n📊 Procesando: ${candidate.full_name} (${candidate.cargo})`)

      // Get current scores for comparison
      const currentScores = await sql`
        SELECT integrity FROM scores WHERE candidate_id = ${candidate.id}::uuid
      `
      const oldIntegrity = currentScores.length > 0 ? Number(currentScores[0].integrity) : 100

      // Transform to enhanced scoring data
      const scoringData = await transformToEnhancedScoringData(candidate)

      // Calculate enhanced scores
      const result = calculateEnhancedScores(scoringData, candidate.cargo)

      console.log(`   Competencia: ${result.scores.competence.toFixed(1)}`)
      console.log(`   Integridad: ${result.scores.integrity.toFixed(1)}`)

      // Show breakdown of new penalties
      if (result.integrity.companyPenalty > 0) {
        console.log(`     ⚠️ Penalidad empresarial: -${result.integrity.companyPenalty}`)
      }
      if (result.integrity.votingPenalty > 0) {
        console.log(`     ⚠️ Penalidad por votaciones: -${result.integrity.votingPenalty}`)
      }
      if (result.integrity.taxPenalty > 0) {
        console.log(`     ⚠️ Penalidad tributaria: -${result.integrity.taxPenalty}`)
      }
      if (scoringData.isIncumbent) {
        console.log(`     📊 Es incumbente - Performance: ${result.scores.performance?.toFixed(1) || 'N/A'}`)
      }

      console.log(`   Score Balanceado: ${result.scores.balanced.toFixed(1)}`)

      // Track changes
      detailedResults.push({
        name: candidate.full_name,
        cargo: candidate.cargo,
        oldIntegrity,
        newIntegrity: result.scores.integrity,
        companyPenalty: result.integrity.companyPenalty,
        incumbentBonus: scoringData.isIncumbent ? (result.scores.performance || 50) - 50 : 0,
        balanced: result.scores.balanced,
      })

      // Update scores in database
      const existingScore = await sql`
        SELECT id FROM scores WHERE candidate_id = ${candidate.id}::uuid
      `

      if (existingScore.length > 0) {
        await sql`
          UPDATE scores SET
            competence = ${Math.round(result.scores.competence)},
            integrity = ${Math.round(result.scores.integrity)},
            transparency = ${Math.round(result.scores.transparency)},
            confidence = ${Math.round(result.scores.confidence)},
            score_balanced = ${Math.round(result.scores.balanced * 10) / 10},
            score_merit = ${Math.round(result.scores.merit * 10) / 10},
            score_integrity = ${Math.round(result.scores.integrityFirst * 10) / 10},
            updated_at = NOW()
          WHERE candidate_id = ${candidate.id}::uuid
        `
      } else {
        await sql`
          INSERT INTO scores (
            candidate_id, competence, integrity, transparency, confidence,
            score_balanced, score_merit, score_integrity
          ) VALUES (
            ${candidate.id}::uuid,
            ${Math.round(result.scores.competence)},
            ${Math.round(result.scores.integrity)},
            ${Math.round(result.scores.transparency)},
            ${Math.round(result.scores.confidence)},
            ${Math.round(result.scores.balanced * 10) / 10},
            ${Math.round(result.scores.merit * 10) / 10},
            ${Math.round(result.scores.integrityFirst * 10) / 10}
          )
        `
      }

      // Update breakdown with new penalty fields
      const existingBreakdown = await sql`
        SELECT id FROM score_breakdowns WHERE candidate_id = ${candidate.id}::uuid
      `

      const breakdownData = {
        education_points: result.competence.education.total,
        education_level_points: result.competence.education.level,
        education_depth_points: result.competence.education.depth,
        experience_total_points: result.competence.experienceTotal,
        experience_relevant_points: result.competence.experienceRelevant,
        leadership_points: result.competence.leadership.total,
        leadership_seniority: result.competence.leadership.seniority,
        leadership_stability: result.competence.leadership.stability,
        integrity_base: result.integrity.base,
        penal_penalty: result.integrity.penalPenalty,
        civil_penalties: result.integrity.civilPenalties,
        resignation_penalty: result.integrity.resignationPenalty,
        company_penalty: result.integrity.companyPenalty,
        voting_penalty: result.integrity.votingPenalty,
        voting_bonus: result.integrity.votingBonus,
        tax_penalty: result.integrity.taxPenalty,
        omission_penalty: result.integrity.omissionPenalty,
        completeness_points: result.transparency.completeness,
        consistency_points: result.transparency.consistency,
        assets_quality_points: result.transparency.assetsQuality,
        verification_points: result.confidence.verification,
        coverage_points: result.confidence.coverage,
      }

      if (existingBreakdown.length > 0) {
        await sql`
          UPDATE score_breakdowns SET
            education_points = ${breakdownData.education_points},
            education_level_points = ${breakdownData.education_level_points},
            education_depth_points = ${breakdownData.education_depth_points},
            experience_total_points = ${breakdownData.experience_total_points},
            experience_relevant_points = ${breakdownData.experience_relevant_points},
            leadership_points = ${breakdownData.leadership_points},
            leadership_seniority = ${breakdownData.leadership_seniority},
            leadership_stability = ${breakdownData.leadership_stability},
            integrity_base = ${breakdownData.integrity_base},
            penal_penalty = ${breakdownData.penal_penalty},
            civil_penalties = ${JSON.stringify(breakdownData.civil_penalties)}::jsonb,
            resignation_penalty = ${breakdownData.resignation_penalty},
            company_penalty = ${breakdownData.company_penalty},
            voting_penalty = ${breakdownData.voting_penalty},
            voting_bonus = ${breakdownData.voting_bonus},
            tax_penalty = ${breakdownData.tax_penalty},
            omission_penalty = ${breakdownData.omission_penalty},
            completeness_points = ${breakdownData.completeness_points},
            consistency_points = ${breakdownData.consistency_points},
            assets_quality_points = ${breakdownData.assets_quality_points},
            verification_points = ${breakdownData.verification_points},
            coverage_points = ${breakdownData.coverage_points}
          WHERE candidate_id = ${candidate.id}::uuid
        `
      } else {
        await sql`
          INSERT INTO score_breakdowns (
            candidate_id,
            education_points, education_level_points, education_depth_points,
            experience_total_points, experience_relevant_points,
            leadership_points, leadership_seniority, leadership_stability,
            integrity_base, penal_penalty, civil_penalties, resignation_penalty,
            company_penalty, voting_penalty, voting_bonus, tax_penalty, omission_penalty,
            completeness_points, consistency_points, assets_quality_points,
            verification_points, coverage_points
          ) VALUES (
            ${candidate.id}::uuid,
            ${breakdownData.education_points},
            ${breakdownData.education_level_points},
            ${breakdownData.education_depth_points},
            ${breakdownData.experience_total_points},
            ${breakdownData.experience_relevant_points},
            ${breakdownData.leadership_points},
            ${breakdownData.leadership_seniority},
            ${breakdownData.leadership_stability},
            ${breakdownData.integrity_base},
            ${breakdownData.penal_penalty},
            ${JSON.stringify(breakdownData.civil_penalties)}::jsonb,
            ${breakdownData.resignation_penalty},
            ${breakdownData.company_penalty},
            ${breakdownData.voting_penalty},
            ${breakdownData.voting_bonus},
            ${breakdownData.tax_penalty},
            ${breakdownData.omission_penalty},
            ${breakdownData.completeness_points},
            ${breakdownData.consistency_points},
            ${breakdownData.assets_quality_points},
            ${breakdownData.verification_points},
            ${breakdownData.coverage_points}
          )
        `
      }

      console.log(`   ✅ Score actualizado`)
      processed++
    } catch (error) {
      console.error(`   ❌ Error: ${error}`)
      errors++
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('📊 Resumen del recálculo:')
  console.log(`  ✅ Procesados: ${processed}`)
  console.log(`  ❌ Errores: ${errors}`)

  // Show candidates with significant changes
  const significantChanges = detailedResults.filter(
    (r) => Math.abs(r.newIntegrity - r.oldIntegrity) > 5 || r.companyPenalty > 0
  )

  if (significantChanges.length > 0) {
    console.log('\n📉 Candidatos con cambios significativos:')
    for (const c of significantChanges) {
      const delta = c.newIntegrity - c.oldIntegrity
      const sign = delta >= 0 ? '+' : ''
      console.log(`  ${c.name} (${c.cargo})`)
      console.log(`    Integridad: ${c.oldIntegrity} → ${c.newIntegrity.toFixed(1)} (${sign}${delta.toFixed(1)})`)
      if (c.companyPenalty > 0) {
        console.log(`    Penalidad empresarial: -${c.companyPenalty}`)
      }
    }
  }

  // Show top 10 by balanced score
  const topCandidates = await sql`
    SELECT c.full_name, c.cargo, s.score_balanced, s.competence, s.integrity
    FROM candidates c
    JOIN scores s ON c.id = s.candidate_id
    WHERE c.cargo = 'presidente'
    ORDER BY s.score_balanced DESC
    LIMIT 10
  `

  console.log('\n📈 Top 10 candidatos presidenciales por score balanceado:')
  topCandidates.forEach((c: any, i: number) => {
    console.log(`  ${i + 1}. ${c.full_name}: ${c.score_balanced}`)
    console.log(`     Competencia: ${c.competence} | Integridad: ${c.integrity}`)
  })

  console.log('\n✅ Recálculo completado!')
}

recalculateEnhancedScores()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })
