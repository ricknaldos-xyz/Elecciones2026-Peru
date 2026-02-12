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
import * as fs from 'fs'
import * as path from 'path'
import {
  calculateEnhancedScores,
  calculateTotalExperienceYears,
  type EnhancedIntegrityData,
  type EducationDetail,
  type Experience,
  type EducationLevel,
  type RoleType,
  type SeniorityLevel,
  type PenalSentence,
  type CivilSentence,
} from '../src/lib/scoring'

// Load DATABASE_URL from .env.local
const envPath = path.join(process.cwd(), '.env.local')
const envContent = fs.readFileSync(envPath, 'utf-8')
const dbMatch = envContent.match(/DATABASE_URL=["']?([^"'\n]+)["']?/)
const DATABASE_URL = dbMatch ? dbMatch[1] : process.env.DATABASE_URL!
const sql = neon(DATABASE_URL)

// Map database education detail to scoring level
// DB stores: level ("Primaria", "Secundaria", "Técnico", "Universitario", "Posgrado")
// plus fields: is_completed, has_title, has_bachelor, degree
function mapEducationDetail(ed: any): EducationLevel {
  const level = (ed.level || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const degree = (ed.degree || '').toLowerCase()

  if (level.includes('doctorado') || (level.includes('posgrado') && degree.includes('doctor'))) {
    return 'doctorado'
  }
  if (level.includes('maestria') || level.includes('posgrado') || level.includes('postgrado') ||
      degree.includes('magister') || degree.includes('maestro') || degree.includes('maestria') || degree.includes('master')) {
    return 'maestria'
  }
  if (level.includes('universitario') || level.includes('universidad')) {
    if (ed.has_title || degree.includes('titulo') || degree.includes('ingeniero') ||
        degree.includes('abogado') || degree.includes('medico') || degree.includes('licenciado') ||
        degree.includes('contador') || degree.includes('arquitecto')) {
      return 'titulo_profesional'
    }
    if (ed.is_completed || ed.has_bachelor || degree.includes('bachiller')) {
      return 'universitario_completo'
    }
    return 'universitario_incompleto'
  }
  if (level.includes('tecnico') || level.includes('tecnologico')) {
    return ed.is_completed ? 'tecnico_completo' : 'tecnico_incompleto'
  }
  if (level.includes('secundaria')) {
    return ed.is_completed ? 'secundaria_completa' : 'secundaria_incompleta'
  }
  if (level.includes('primaria')) {
    return 'primaria'
  }

  // Also check snake_case format (legacy)
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
  return mapping[ed.level] || 'sin_informacion'
}

// Infer role type from position and organization name
function inferRoleType(position: string, organization: string): RoleType {
  const pos = (position || '').toLowerCase()
  const org = (organization || '').toLowerCase()

  // Public sector - elected
  if (pos.includes('congresista') || pos.includes('senador') || pos.includes('diputado') ||
      pos.includes('alcalde') || pos.includes('gobernador') || pos.includes('regidor') ||
      pos.includes('presidente regional')) {
    return 'electivo_alto'
  }
  // Public sector - executive/appointed
  if (pos.includes('ministro') || pos.includes('viceministro') || pos.includes('embajador') ||
      pos.includes('secretario general') || pos.includes('jefe institucional') ||
      pos.includes('superintendente') || pos.includes('contralor')) {
    return 'ejecutivo_publico_alto'
  }
  if (org.includes('ministerio') || org.includes('gobierno') || org.includes('municipalidad') ||
      org.includes('congreso') || org.includes('poder judicial') || org.includes('fiscalia') ||
      org.includes('contraloria') || org.includes('defensa') || org.includes('fuerzas armadas') ||
      org.includes('ejercito') || org.includes('marina') || org.includes('fuerza aerea') ||
      org.includes('policia')) {
    if (pos.includes('director') || pos.includes('general') || pos.includes('jefe') ||
        pos.includes('comandante') || pos.includes('oficial superior')) {
      return 'ejecutivo_publico_alto'
    }
    return 'ejecutivo_publico_medio'
  }
  // Academia
  if (pos.includes('rector') || pos.includes('decano') || pos.includes('catedratico') ||
      pos.includes('profesor') || pos.includes('docente')) {
    return 'academia'
  }
  if ((org.includes('universidad') || org.includes('instituto')) &&
      !pos.includes('director') && !pos.includes('gerente') && !pos.includes('empresario')) {
    return 'academia'
  }
  // Private sector
  if (pos.includes('gerente general') || pos.includes('director') || pos.includes('ceo') ||
      pos.includes('presidente ejecutivo') || pos.includes('empresario')) {
    return 'ejecutivo_privado_alto'
  }
  if (pos.includes('gerente') || pos.includes('subgerente') || pos.includes('jefe')) {
    return 'ejecutivo_privado_medio'
  }

  return 'tecnico_profesional'
}

// Infer seniority level from position
function inferSeniorityLevel(position: string, organization: string): SeniorityLevel {
  const pos = (position || '').toLowerCase()
  const org = (organization || '').toLowerCase()

  if (pos.includes('presidente') || pos.includes('rector') || pos.includes('ministro') ||
      pos.includes('alcalde') || pos.includes('gobernador') || pos.includes('congresista') ||
      pos.includes('senador') || pos.includes('director general') || pos.includes('ceo') ||
      pos.includes('gerente general') || pos.includes('comandante general') ||
      pos.includes('embajador') || pos.includes('superintendente') || pos.includes('contralor')) {
    return 'direccion'
  }
  if (pos.includes('general') || pos.includes('gerente') || pos.includes('director') ||
      pos.includes('decano') || pos.includes('oficial superior') || pos.includes('empresario')) {
    return 'gerencia'
  }
  if (pos.includes('jefe') || pos.includes('subgerente') || pos.includes('coordinador') ||
      pos.includes('regidor') || pos.includes('asesor')) {
    return 'jefatura'
  }
  if (pos.includes('profesor') || pos.includes('catedratico') || pos.includes('especialista') ||
      pos.includes('analista') || pos.includes('abogado') || pos.includes('ingeniero')) {
    return 'coordinador'
  }

  return 'individual_contributor'
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
  // Education - DB stores level as "Primaria", "Secundaria", "Universitario", "Posgrado", "Técnico"
  const education: EducationDetail[] = (candidate.education_details || []).map((ed: any) => ({
    level: mapEducationDetail(ed),
    field: ed.field_of_study || ed.degree,
    institution: ed.institution,
    year: ed.bachelor_year ? parseInt(ed.bachelor_year) : (ed.year ? parseInt(ed.year) : (ed.end_date ? parseYear(ed.end_date) : undefined)),
    isVerified: ed.is_verified,
  }))

  // Experience - DB has position/organization but no role_type/seniority_level, so we infer them
  const experience: Experience[] = (candidate.experience_details || []).map((exp: any) => {
    const startYear = exp.start_year ? parseInt(exp.start_year) : parseYear(exp.start_date)
    const endYear = exp.is_current ? undefined : (exp.end_year ? parseInt(exp.end_year) : parseYear(exp.end_date))
    const roleType = exp.role_type ? inferRoleType(exp.position, exp.organization) : inferRoleType(exp.position, exp.organization)
    const seniorityLevel = exp.seniority_level ? inferSeniorityLevel(exp.position, exp.organization) : inferSeniorityLevel(exp.position, exp.organization)
    const isLeadership = ['direccion', 'gerencia', 'jefatura'].includes(seniorityLevel)

    return {
      role: exp.position,
      roleType,
      organization: exp.organization,
      startYear: isNaN(startYear) ? new Date().getFullYear() : startYear,
      endYear: endYear && isNaN(endYear) ? undefined : endYear,
      isLeadership,
      seniorityLevel,
    }
  })

  // Add political trajectory as experience
  const politicalExp: Experience[] = (candidate.political_trajectory || []).map((pt: any) => {
    // political_trajectory uses year_start/year_end as integers (after migration)
    const startYear = pt.year_start || pt.year || new Date().getFullYear()
    const endYear = pt.year_end || undefined
    const isElected = pt.type === 'cargo_electivo' || pt.is_elected
    const roleType: RoleType = isElected ? 'electivo_alto' :
      pt.type === 'cargo_publico' ? 'ejecutivo_publico_alto' : 'partidario'

    return {
      role: pt.position,
      roleType,
      organization: pt.party || pt.institution || 'Gobierno',
      startYear,
      endYear,
      isLeadership: isElected || pt.type === 'cargo_publico',
      seniorityLevel: (isElected || pt.type === 'cargo_publico' ? 'direccion' : 'coordinador') as SeniorityLevel,
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

  // Fetch ONPE sanctions from flags
  const onpeFlags = await sql`
    SELECT COUNT(*) as cnt FROM flags
    WHERE candidate_id = ${candidate.id}::uuid
    AND type = 'OTHER'
    AND title LIKE '%ONPE%'
    AND is_verified = true
  `
  const onpeSanctionCount = Number(onpeFlags[0]?.cnt) || 0

  // Fetch new data sources
  const companyIssues = await getCompanyIssues(candidate.id)
  const incumbentPerf = await getIncumbentPerformance(candidate.id)
  const votingPenalties = await getVotingPenalties(candidate.id)
  const taxStatus = await getTaxStatus(candidate.id)

  // Fetch REINFO flags
  const reinfoFlags = await sql`
    SELECT severity, title FROM flags
    WHERE candidate_id = ${candidate.id}::uuid AND type = 'REINFO'
  `
  // Count derechos mineros by status from flag titles
  let reinfoVigenteCount = 0
  let reinfoExcluidoCount = 0
  let reinfoSuspendidoCount = 0
  for (const flag of reinfoFlags) {
    const title = (flag.title as string) || ''
    const vMatch = title.match(/(\d+)\s*vigente/)
    const eMatch = title.match(/(\d+)\s*excluido/)
    const sMatch = title.match(/(\d+)\s*suspendido/)
    if (vMatch) reinfoVigenteCount += parseInt(vMatch[1])
    if (eMatch) reinfoExcluidoCount += parseInt(eMatch[1])
    if (sMatch) reinfoSuspendidoCount += parseInt(sMatch[1])
  }

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
    onpeSanctionCount,

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

    // REINFO
    reinfoVigenteCount,
    reinfoExcluidoCount,
    reinfoSuspendidoCount,
  }
}

async function recalculateEnhancedScores() {
  console.log('🚀 Recalculando scores con datos mejorados...\n')
  console.log('='.repeat(60))

  // Get all candidates (include party_id for plan viability propagation)
  const candidates = await sql`
    SELECT
      id, slug, full_name, cargo, party_id,
      education_level, education_details,
      experience_details, political_trajectory,
      penal_sentences, civil_sentences,
      party_resignations, assets_declaration,
      birth_date, data_verified, data_source
    FROM candidates
    ORDER BY cargo, full_name
  `

  console.log(`📋 Candidatos a procesar: ${candidates.length}\n`)

  // Build party → plan_viability map from presidential candidates
  // This allows propagating the plan score to ALL party members
  const partyPlanMap = new Map<string, {
    overall: number
    fiscal: number
    legal: number
    coherence: number
    historical: number
  }>()

  const presViability = await sql`
    SELECT c.party_id, pva.overall_viability_score,
           pva.fiscal_viability_score, pva.legal_viability_score,
           pva.coherence_score, pva.historical_score
    FROM candidates c
    JOIN plan_viability_analysis pva ON c.id = pva.candidate_id
    WHERE c.cargo = 'presidente' AND c.is_active = true AND c.party_id IS NOT NULL
  `

  for (const row of presViability) {
    partyPlanMap.set(row.party_id as string, {
      overall: Number(row.overall_viability_score),
      fiscal: Number(row.fiscal_viability_score),
      legal: Number(row.legal_viability_score),
      coherence: Number(row.coherence_score),
      historical: Number(row.historical_score),
    })
  }

  console.log(`📊 Partidos con plan analizado: ${partyPlanMap.size}`)
  console.log(`   Partidos sin plan: candidatos usarán valor neutro (5.0)\n`)

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

  // Process a single candidate
  async function processCandidate(candidate: any) {
    // Transform to enhanced scoring data
    const scoringData = await transformToEnhancedScoringData(candidate)

    // Get plan viability: presidents from their own analysis, others from party's presidential candidate
    let planViabilityRaw: number | undefined
    let planViabilityBreakdown: { fiscal: number; legal: number; coherence: number; historical: number } | undefined

    if (candidate.cargo === 'presidente') {
      // Presidential candidates: use their own direct analysis
      const pva = await sql`
        SELECT overall_viability_score, fiscal_viability_score,
               legal_viability_score, coherence_score, historical_score
        FROM plan_viability_analysis
        WHERE candidate_id = ${candidate.id}::uuid
        LIMIT 1
      `
      if (pva.length > 0) {
        planViabilityRaw = Number(pva[0].overall_viability_score)
        planViabilityBreakdown = {
          fiscal: Number(pva[0].fiscal_viability_score),
          legal: Number(pva[0].legal_viability_score),
          coherence: Number(pva[0].coherence_score),
          historical: Number(pva[0].historical_score),
        }
      }
    } else if (candidate.party_id) {
      // Non-presidential candidates: use their party's presidential candidate's plan viability
      const partyPlan = partyPlanMap.get(candidate.party_id as string)
      if (partyPlan) {
        planViabilityRaw = partyPlan.overall
        planViabilityBreakdown = {
          fiscal: partyPlan.fiscal,
          legal: partyPlan.legal,
          coherence: partyPlan.coherence,
          historical: partyPlan.historical,
        }
      } else {
        // Party has no presidential candidate with analyzed plan → neutral value
        planViabilityRaw = 5.0 // Normalizes to 50/100
        planViabilityBreakdown = { fiscal: 5, legal: 5, coherence: 5, historical: 5 }
      }
    }

    // Calculate enhanced scores (with plan viability for ALL candidates)
    const result = calculateEnhancedScores(scoringData, candidate.cargo, planViabilityRaw)
    const experienceOverlap = calculateTotalExperienceYears(scoringData.experience)

    const breakdownData = {
      education_points: result.competence.education.total,
      education_level_points: result.competence.education.level,
      education_depth_points: result.competence.education.depth,
      experience_total_points: result.competence.experienceTotal,
      experience_relevant_points: result.competence.experienceRelevant,
      experience_raw_years: experienceOverlap.rawYears,
      experience_unique_years: experienceOverlap.uniqueYears,
      experience_has_overlap: experienceOverlap.hasOverlap,
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
      reinfo_penalty: result.integrity.reinfoPenalty,
      completeness_points: result.transparency.completeness,
      consistency_points: result.transparency.consistency,
      assets_quality_points: result.transparency.assetsQuality,
      onpe_penalty: result.transparency.onpePenalty,
      verification_points: result.confidence.verification,
      coverage_points: result.confidence.coverage,
    }

    // Upsert scores
    const planViabilityNorm = result.scores.planViability ?? null
    const balancedP = result.scores.balancedP != null ? Math.round(result.scores.balancedP * 10) / 10 : null
    const meritP = result.scores.meritP != null ? Math.round(result.scores.meritP * 10) / 10 : null
    const integrityP = result.scores.integrityFirstP != null ? Math.round(result.scores.integrityFirstP * 10) / 10 : null

    await sql`
      INSERT INTO scores (
        candidate_id, competence, integrity, transparency, confidence,
        score_balanced, score_merit, score_integrity,
        plan_viability, score_balanced_p, score_merit_p, score_integrity_p,
        updated_at
      ) VALUES (
        ${candidate.id}::uuid,
        ${Math.round(result.scores.competence)},
        ${Math.round(result.scores.integrity)},
        ${Math.round(result.scores.transparency)},
        ${Math.round(result.scores.confidence)},
        ${Math.round(result.scores.balanced * 10) / 10},
        ${Math.round(result.scores.merit * 10) / 10},
        ${Math.round(result.scores.integrityFirst * 10) / 10},
        ${planViabilityNorm},
        ${balancedP},
        ${meritP},
        ${integrityP},
        NOW()
      )
      ON CONFLICT (candidate_id) DO UPDATE SET
        competence = EXCLUDED.competence,
        integrity = EXCLUDED.integrity,
        transparency = EXCLUDED.transparency,
        confidence = EXCLUDED.confidence,
        score_balanced = EXCLUDED.score_balanced,
        score_merit = EXCLUDED.score_merit,
        score_integrity = EXCLUDED.score_integrity,
        plan_viability = EXCLUDED.plan_viability,
        score_balanced_p = EXCLUDED.score_balanced_p,
        score_merit_p = EXCLUDED.score_merit_p,
        score_integrity_p = EXCLUDED.score_integrity_p,
        updated_at = NOW()
    `

    // Plan viability breakdown values (normalized to 0-100)
    const pvOverall = planViabilityNorm
    const pvFiscal = planViabilityBreakdown ? planViabilityBreakdown.fiscal * 10 : null
    const pvLegal = planViabilityBreakdown ? planViabilityBreakdown.legal * 10 : null
    const pvCoherence = planViabilityBreakdown ? planViabilityBreakdown.coherence * 10 : null
    const pvHistorical = planViabilityBreakdown ? planViabilityBreakdown.historical * 10 : null

    // Upsert breakdown
    await sql`
      INSERT INTO score_breakdowns (
        candidate_id,
        education_points, education_level_points, education_depth_points,
        experience_total_points, experience_relevant_points,
        experience_raw_years, experience_unique_years, experience_has_overlap,
        leadership_points, leadership_seniority, leadership_stability,
        integrity_base, penal_penalty, civil_penalties, resignation_penalty,
        company_penalty, voting_penalty, voting_bonus, tax_penalty, omission_penalty, reinfo_penalty,
        completeness_points, consistency_points, assets_quality_points, onpe_penalty,
        verification_points, coverage_points,
        plan_viability_overall, plan_viability_fiscal, plan_viability_legal,
        plan_viability_coherence, plan_viability_historical
      ) VALUES (
        ${candidate.id}::uuid,
        ${breakdownData.education_points}, ${breakdownData.education_level_points}, ${breakdownData.education_depth_points},
        ${breakdownData.experience_total_points}, ${breakdownData.experience_relevant_points},
        ${breakdownData.experience_raw_years}, ${breakdownData.experience_unique_years}, ${breakdownData.experience_has_overlap},
        ${breakdownData.leadership_points}, ${breakdownData.leadership_seniority}, ${breakdownData.leadership_stability},
        ${breakdownData.integrity_base}, ${breakdownData.penal_penalty},
        ${JSON.stringify(breakdownData.civil_penalties)}::jsonb, ${breakdownData.resignation_penalty},
        ${breakdownData.company_penalty}, ${breakdownData.voting_penalty}, ${breakdownData.voting_bonus},
        ${breakdownData.tax_penalty}, ${breakdownData.omission_penalty}, ${breakdownData.reinfo_penalty},
        ${breakdownData.completeness_points}, ${breakdownData.consistency_points},
        ${breakdownData.assets_quality_points}, ${breakdownData.onpe_penalty},
        ${breakdownData.verification_points}, ${breakdownData.coverage_points},
        ${pvOverall}, ${pvFiscal}, ${pvLegal}, ${pvCoherence}, ${pvHistorical}
      )
      ON CONFLICT (candidate_id) DO UPDATE SET
        education_points = EXCLUDED.education_points,
        education_level_points = EXCLUDED.education_level_points,
        education_depth_points = EXCLUDED.education_depth_points,
        experience_total_points = EXCLUDED.experience_total_points,
        experience_relevant_points = EXCLUDED.experience_relevant_points,
        experience_raw_years = EXCLUDED.experience_raw_years,
        experience_unique_years = EXCLUDED.experience_unique_years,
        experience_has_overlap = EXCLUDED.experience_has_overlap,
        leadership_points = EXCLUDED.leadership_points,
        leadership_seniority = EXCLUDED.leadership_seniority,
        leadership_stability = EXCLUDED.leadership_stability,
        integrity_base = EXCLUDED.integrity_base,
        penal_penalty = EXCLUDED.penal_penalty,
        civil_penalties = EXCLUDED.civil_penalties,
        resignation_penalty = EXCLUDED.resignation_penalty,
        company_penalty = EXCLUDED.company_penalty,
        voting_penalty = EXCLUDED.voting_penalty,
        voting_bonus = EXCLUDED.voting_bonus,
        tax_penalty = EXCLUDED.tax_penalty,
        omission_penalty = EXCLUDED.omission_penalty,
        reinfo_penalty = EXCLUDED.reinfo_penalty,
        completeness_points = EXCLUDED.completeness_points,
        consistency_points = EXCLUDED.consistency_points,
        assets_quality_points = EXCLUDED.assets_quality_points,
        onpe_penalty = EXCLUDED.onpe_penalty,
        verification_points = EXCLUDED.verification_points,
        coverage_points = EXCLUDED.coverage_points,
        plan_viability_overall = EXCLUDED.plan_viability_overall,
        plan_viability_fiscal = EXCLUDED.plan_viability_fiscal,
        plan_viability_legal = EXCLUDED.plan_viability_legal,
        plan_viability_coherence = EXCLUDED.plan_viability_coherence,
        plan_viability_historical = EXCLUDED.plan_viability_historical
    `

    return {
      name: candidate.full_name,
      cargo: candidate.cargo,
      integrity: result.scores.integrity,
      companyPenalty: result.integrity.companyPenalty,
      votingPenalty: result.integrity.votingPenalty,
      balanced: result.scores.balanced,
    }
  }

  // Process in parallel batches of 20
  const BATCH_SIZE = 20
  for (let i = 0; i < candidates.length; i += BATCH_SIZE) {
    const batch = candidates.slice(i, i + BATCH_SIZE)
    const results = await Promise.allSettled(
      batch.map(c => processCandidate(c))
    )

    for (const r of results) {
      if (r.status === 'fulfilled') {
        processed++
        const d = r.value
        if (d.companyPenalty > 0 || d.votingPenalty > 0) {
          detailedResults.push({
            name: d.name,
            cargo: d.cargo,
            oldIntegrity: 100,
            newIntegrity: d.integrity,
            companyPenalty: d.companyPenalty,
            incumbentBonus: 0,
            balanced: d.balanced,
          })
        }
      } else {
        errors++
        console.error(`   ❌ Error: ${r.reason}`)
      }
    }

    if ((i + BATCH_SIZE) % 200 === 0 || i + BATCH_SIZE >= candidates.length) {
      console.log(`  Progreso: ${Math.min(i + BATCH_SIZE, candidates.length)} / ${candidates.length}`)
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

  // Show top 10 by balanced score (presidential with 4-pillar score)
  const topCandidates = await sql`
    SELECT c.full_name, c.cargo, s.score_balanced, s.score_balanced_p,
           s.competence, s.integrity, s.plan_viability
    FROM candidates c
    JOIN scores s ON c.id = s.candidate_id
    WHERE c.cargo = 'presidente'
    ORDER BY COALESCE(s.score_balanced_p, s.score_balanced) DESC
    LIMIT 10
  `

  console.log('\n📈 Top 10 candidatos presidenciales por score balanceado (4 pilares):')
  topCandidates.forEach((c: any, i: number) => {
    const score = c.score_balanced_p ?? c.score_balanced
    console.log(`  ${i + 1}. ${c.full_name}: ${score}`)
    console.log(`     C: ${c.competence} | I: ${c.integrity} | Plan: ${c.plan_viability ?? 'N/A'}`)
  })

  console.log('\n✅ Recálculo completado!')
}

recalculateEnhancedScores()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })
