/**
 * SCORING ENGINE v1.0
 * Motor de cálculo de scores para candidatos electorales
 *
 * Este módulo implementa el modelo de scoring auditable y legal-safe
 * basado en datos de la DJHV del JNE.
 */

import {
  EDUCATION_LEVEL_POINTS,
  EDUCATION_DEPTH,
  getExperienceTotalPoints,
  RELEVANCE_POINTS_BY_CARGO,
  SENIORITY_POINTS,
  getLeadershipStabilityPoints,
  INTEGRITY_PENALTIES,
  getResignationPenalty,
  PRESETS,
  CONFIDENCE_THRESHOLDS,
  INTEGRITY_THRESHOLDS,
  FLAG_TYPES,
  FLAG_SEVERITY,
  type CargoType,
  type RoleType,
} from '@/lib/constants'

import type {
  EducationDetail,
  ExperienceDetail,
  Sentence,
  ScoreBreakdown,
  Weights,
  Flag,
  FlagType,
  FlagSeverity,
  CivilPenalty,
} from '@/types/database'

// ============================================
// EDUCATION SCORING
// ============================================

interface EducationResult {
  total: number
  level: number
  depth: number
}

export function calculateEducationScore(
  details: EducationDetail[],
  educationLevel?: string | null
): EducationResult {
  if (!details || details.length === 0) {
    // Si no hay detalles pero hay nivel declarado
    if (educationLevel && EDUCATION_LEVEL_POINTS[educationLevel]) {
      return {
        total: EDUCATION_LEVEL_POINTS[educationLevel],
        level: EDUCATION_LEVEL_POINTS[educationLevel],
        depth: 0,
      }
    }
    return { total: 0, level: 0, depth: 0 }
  }

  // Encontrar el nivel máximo alcanzado
  let maxLevelPoints = 0
  let specializationCount = 0
  let hasAdditionalMaster = false

  const completedEducation = details.filter((d) => d.is_completed)
  const masterCount = completedEducation.filter((d) => d.level === 'maestria').length

  for (const edu of completedEducation) {
    const levelPoints = EDUCATION_LEVEL_POINTS[edu.level] || 0
    if (levelPoints > maxLevelPoints) {
      maxLevelPoints = levelPoints
    }

    // Contar especializaciones/diplomados (excluir el grado máximo)
    if (
      edu.level !== 'doctorado' &&
      edu.level !== 'maestria' &&
      edu.level !== 'universitario_completo' &&
      edu.level !== 'titulo_profesional'
    ) {
      // Son especializaciones si tienen grado menor
    }
  }

  // Profundidad: especializaciones adicionales
  // Por cada diplomado/especialización relevante: +2 (máx 6)
  const specializationPoints = Math.min(
    specializationCount * EDUCATION_DEPTH.specializationPoints,
    EDUCATION_DEPTH.maxSpecializations * EDUCATION_DEPTH.specializationPoints
  )

  // Segunda maestría: +2
  const additionalMasterPoints =
    masterCount > 1 ? EDUCATION_DEPTH.additionalMasterPoints : 0

  const depthPoints = Math.min(specializationPoints + additionalMasterPoints, 8)
  const total = Math.min(maxLevelPoints + depthPoints, 30)

  return {
    total,
    level: maxLevelPoints,
    depth: depthPoints,
  }
}

// ============================================
// EXPERIENCE TOTAL SCORING
// ============================================

export function calculateExperienceTotal(experiences: ExperienceDetail[]): number {
  if (!experiences || experiences.length === 0) return 0

  // Calcular años totales de experiencia
  // Consolidando solapes
  const periods: { start: Date; end: Date }[] = []

  for (const exp of experiences) {
    const start = new Date(exp.start_date)
    const end = exp.is_current ? new Date() : exp.end_date ? new Date(exp.end_date) : new Date()
    periods.push({ start, end })
  }

  // Ordenar por fecha de inicio
  periods.sort((a, b) => a.start.getTime() - b.start.getTime())

  // Merge overlapping periods
  const merged: { start: Date; end: Date }[] = []
  for (const period of periods) {
    if (merged.length === 0) {
      merged.push(period)
    } else {
      const last = merged[merged.length - 1]
      if (period.start <= last.end) {
        // Overlap - extend the end date
        last.end = new Date(Math.max(last.end.getTime(), period.end.getTime()))
      } else {
        merged.push(period)
      }
    }
  }

  // Calcular años totales
  let totalYears = 0
  for (const period of merged) {
    const years = (period.end.getTime() - period.start.getTime()) / (1000 * 60 * 60 * 24 * 365)
    totalYears += years
  }

  return getExperienceTotalPoints(Math.floor(totalYears))
}

// ============================================
// EXPERIENCE RELEVANT SCORING
// ============================================

export function calculateExperienceRelevant(
  experiences: ExperienceDetail[],
  cargo: CargoType
): number {
  if (!experiences || experiences.length === 0) return 0

  const pointsMap = RELEVANCE_POINTS_BY_CARGO[cargo]
  if (!pointsMap) return 0

  // Calcular puntos por año en cada tipo de rol
  // Cap: 10 años máximo considerados
  const yearsByRole: Record<string, number> = {}

  for (const exp of experiences) {
    const start = new Date(exp.start_date)
    const end = exp.is_current ? new Date() : exp.end_date ? new Date(exp.end_date) : new Date()
    const years = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365)

    const roleType = exp.role_type as RoleType
    yearsByRole[roleType] = (yearsByRole[roleType] || 0) + years
  }

  // Calcular puntos
  let totalPoints = 0
  let totalYearsConsidered = 0

  // Ordenar roles por puntos (de mayor a menor) para priorizar los mejores
  const sortedRoles = Object.entries(yearsByRole).sort((a, b) => {
    const ptsA = pointsMap[a[0] as RoleType] || 0
    const ptsB = pointsMap[b[0] as RoleType] || 0
    return ptsB - ptsA
  })

  for (const [role, years] of sortedRoles) {
    const remainingYears = 10 - totalYearsConsidered
    if (remainingYears <= 0) break

    const yearsToCount = Math.min(years, remainingYears)
    const ptsPerYear = pointsMap[role as RoleType] || 0
    totalPoints += yearsToCount * ptsPerYear
    totalYearsConsidered += yearsToCount
  }

  return Math.min(Math.round(totalPoints * 10) / 10, 25)
}

// ============================================
// LEADERSHIP SCORING
// ============================================

interface LeadershipResult {
  total: number
  seniority: number
  stability: number
}

export function calculateLeadership(experiences: ExperienceDetail[]): LeadershipResult {
  if (!experiences || experiences.length === 0) {
    return { total: 0, seniority: 0, stability: 0 }
  }

  // Encontrar el nivel de seniority más alto
  let maxSeniority = 0
  let leadershipYears = 0

  for (const exp of experiences) {
    const seniorityPoints = SENIORITY_POINTS[exp.seniority_level] || 0
    if (seniorityPoints > maxSeniority) {
      maxSeniority = seniorityPoints
    }

    // Contar años en roles de liderazgo (coordinador+)
    if (
      exp.seniority_level !== 'individual' &&
      SENIORITY_POINTS[exp.seniority_level] >= 6
    ) {
      const start = new Date(exp.start_date)
      const end = exp.is_current ? new Date() : exp.end_date ? new Date(exp.end_date) : new Date()
      const years = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365)
      leadershipYears += years
    }
  }

  const stabilityPoints = getLeadershipStabilityPoints(Math.floor(leadershipYears))
  const total = Math.min(maxSeniority + stabilityPoints, 20)

  return {
    total,
    seniority: maxSeniority,
    stability: stabilityPoints,
  }
}

// ============================================
// COMPETENCE SCORING (AGGREGATED)
// ============================================

interface CompetenceResult {
  total: number
  education: EducationResult
  experienceTotal: number
  experienceRelevant: number
  leadership: LeadershipResult
}

export function calculateCompetence(
  educationDetails: EducationDetail[],
  educationLevel: string | null | undefined,
  experiences: ExperienceDetail[],
  cargo: CargoType
): CompetenceResult {
  const education = calculateEducationScore(educationDetails, educationLevel)
  const experienceTotal = calculateExperienceTotal(experiences)
  const experienceRelevant = calculateExperienceRelevant(experiences, cargo)
  const leadership = calculateLeadership(experiences)

  const total = Math.min(
    education.total + experienceTotal + experienceRelevant + leadership.total,
    100
  )

  return {
    total,
    education,
    experienceTotal,
    experienceRelevant,
    leadership,
  }
}

// ============================================
// INTEGRITY SCORING
// ============================================

interface IntegrityResult {
  score: number
  base: number
  penalPenalty: number
  civilPenalties: CivilPenalty[]
  resignationPenalty: number
}

export function calculateIntegrity(
  penalSentences: Sentence[],
  civilSentences: Sentence[],
  partyResignations: number
): IntegrityResult {
  let score = 100
  const civilPenalties: CivilPenalty[] = []

  // Penalidad por sentencias penales
  const penalCount = penalSentences.filter((s) => s.status === 'firme').length
  let penalPenalty = 0
  if (penalCount === 1) {
    penalPenalty = Math.abs(INTEGRITY_PENALTIES.PENAL_SENTENCE_1)
  } else if (penalCount >= 2) {
    penalPenalty = Math.abs(INTEGRITY_PENALTIES.PENAL_SENTENCE_2_PLUS)
  }
  score -= penalPenalty

  // Penalidades por sentencias civiles
  for (const sentence of civilSentences) {
    if (sentence.status !== 'firme') continue

    let penalty = 0
    switch (sentence.type) {
      case 'violencia_familiar':
        penalty = Math.abs(INTEGRITY_PENALTIES.VIOLENCIA_FAMILIAR)
        break
      case 'alimentos':
        penalty = Math.abs(INTEGRITY_PENALTIES.OBLIGACIONES_ALIMENTARIAS)
        break
      case 'laboral':
        penalty = Math.abs(INTEGRITY_PENALTIES.LABORAL)
        break
      case 'contractual':
        penalty = Math.abs(INTEGRITY_PENALTIES.CONTRACTUAL)
        break
    }
    if (penalty > 0) {
      civilPenalties.push({ type: sentence.type, penalty })
      score -= penalty
    }
  }

  // Penalidad por renuncias
  const resignationPenalty = Math.abs(getResignationPenalty(partyResignations))
  score -= resignationPenalty

  return {
    score: Math.max(score, 0),
    base: 100,
    penalPenalty,
    civilPenalties,
    resignationPenalty,
  }
}

// ============================================
// TRANSPARENCY SCORING
// ============================================

interface TransparencyResult {
  total: number
  completeness: number
  consistency: number
  assetsQuality: number
}

interface TransparencyInput {
  hasIdentification: boolean
  hasEducation: boolean
  hasExperience: boolean
  hasPoliticalTrajectory: boolean
  hasPenalDeclaration: boolean
  hasCivilDeclaration: boolean
  hasAssets: boolean
  // Consistency checks
  educationDatesPlausible: boolean
  experienceDatesPlausible: boolean
  educationOccupationCoherent: boolean | null // null = no evaluable
  experienceFieldsComplete: boolean
  educationFieldsComplete: boolean
  trajectoryFieldsComplete: boolean
  noInternalContradictions: boolean
  // Assets quality
  assetsHasAtLeastOneItem: boolean
  assetsNoEmptyEssentialFields: boolean
  assetsDeclaresParticipations: boolean | null
  assetsIncomeOccupationCoherent: boolean | null
  assetsDeclaresRealEstate: boolean
  assetsSectionComplete: boolean
}

export function calculateTransparency(input: TransparencyInput): TransparencyResult {
  // Completitud (0-35): 7 secciones x 5 puntos
  let completeness = 0
  if (input.hasIdentification) completeness += 5
  if (input.hasEducation) completeness += 5
  if (input.hasExperience) completeness += 5
  if (input.hasPoliticalTrajectory) completeness += 5
  if (input.hasPenalDeclaration) completeness += 5
  if (input.hasCivilDeclaration) completeness += 5
  if (input.hasAssets) completeness += 5

  // Consistencia (0-35): 7 checks x 5 puntos
  let consistency = 0

  // Check pasa = 5, falla = 0, no evaluable = 2
  const checkValue = (check: boolean | null) => {
    if (check === null) return 2
    return check ? 5 : 0
  }

  consistency += input.educationDatesPlausible ? 5 : 0
  consistency += input.experienceDatesPlausible ? 5 : 0
  consistency += checkValue(input.educationOccupationCoherent)
  consistency += input.experienceFieldsComplete ? 5 : 0
  consistency += input.educationFieldsComplete ? 5 : 0
  consistency += input.trajectoryFieldsComplete ? 5 : 0
  consistency += input.noInternalContradictions ? 5 : 0

  // Calidad bienes y rentas (0-30): 6 checks x 5 puntos
  let assetsQuality = 0
  if (input.assetsHasAtLeastOneItem) assetsQuality += 5
  if (input.assetsNoEmptyEssentialFields) assetsQuality += 5
  assetsQuality += checkValue(input.assetsDeclaresParticipations)
  assetsQuality += checkValue(input.assetsIncomeOccupationCoherent)
  if (input.assetsDeclaresRealEstate) assetsQuality += 5
  if (input.assetsSectionComplete) assetsQuality += 5

  const total = completeness + consistency + assetsQuality

  return {
    total: Math.min(total, 100),
    completeness,
    consistency,
    assetsQuality,
  }
}

// ============================================
// CONFIDENCE SCORING
// ============================================

interface ConfidenceResult {
  total: number
  verification: number
  coverage: number
}

interface ConfidenceInput {
  // Verificación: 12 campos críticos (5 puntos c/u = 60)
  // 5 = respaldo oficial, 3 = declarado, 0 = ausente
  fieldsVerification: {
    name: 0 | 3 | 5
    education_level: 0 | 3 | 5
    education_dates: 0 | 3 | 5
    experience_periods: 0 | 3 | 5
    experience_institution: 0 | 3 | 5
    experience_position: 0 | 3 | 5
    penal_declaration: 0 | 3 | 5
    civil_declaration: 0 | 3 | 5
    sentence_details: 0 | 3 | 5
    resignations: 0 | 3 | 5
    assets_declaration: 0 | 3 | 5
    assets_details: 0 | 3 | 5
  }
  // Cobertura: 8 rubros (5 puntos c/u = 40)
  coverage: {
    identification: boolean
    education: boolean
    experience: boolean
    politicalTrajectory: boolean
    penalResponse: boolean
    civilResponse: boolean
    resignationsResponse: boolean
    assetsResponse: boolean
  }
}

export function calculateConfidence(input: ConfidenceInput): ConfidenceResult {
  // Verificación (0-60)
  const verification = Object.values(input.fieldsVerification).reduce<number>((sum, val) => sum + val, 0)

  // Cobertura (0-40)
  const coverage = Object.values(input.coverage).filter(Boolean).length * 5

  const total = verification + coverage

  return {
    total: Math.min(total, 100),
    verification,
    coverage,
  }
}

// ============================================
// SCORE TOTAL
// ============================================

export function calculateScoreTotal(
  competence: number,
  integrity: number,
  transparency: number,
  weights: Weights
): number {
  const raw = weights.wC * competence + weights.wI * integrity + weights.wT * transparency
  return Math.round(raw * 10) / 10 // 1 decimal
}

// ============================================
// FLAGS GENERATION
// ============================================

export function generateFlags(
  penalSentences: Sentence[],
  civilSentences: Sentence[],
  partyResignations: number,
  confidence: number,
  integrity: number
): Omit<Flag, 'id' | 'candidate_id' | 'date_captured'>[] {
  const flags: Omit<Flag, 'id' | 'candidate_id' | 'date_captured'>[] = []

  // Flags por sentencias penales
  const firmePenal = penalSentences.filter((s) => s.status === 'firme')
  for (const sentence of firmePenal) {
    flags.push({
      type: FLAG_TYPES.PENAL_SENTENCE as FlagType,
      severity: FLAG_SEVERITY.RED as FlagSeverity,
      title: 'Sentencia penal firme declarada',
      description: sentence.description,
      source: sentence.source,
      evidence_url: sentence.evidence_url || null,
    })
  }

  // Flags por sentencias civiles
  for (const sentence of civilSentences) {
    if (sentence.status !== 'firme') continue

    let flagType: FlagType = FLAG_TYPES.CIVIL_SENTENCE as FlagType
    let severity: FlagSeverity = FLAG_SEVERITY.AMBER as FlagSeverity
    let title = 'Sentencia civil firme declarada'

    switch (sentence.type) {
      case 'violencia_familiar':
        flagType = FLAG_TYPES.VIOLENCE as FlagType
        severity = FLAG_SEVERITY.RED as FlagSeverity
        title = 'Sentencia por violencia familiar'
        break
      case 'alimentos':
        flagType = FLAG_TYPES.ALIMENTOS as FlagType
        title = 'Sentencia por obligaciones alimentarias'
        break
      case 'laboral':
        flagType = FLAG_TYPES.LABORAL as FlagType
        title = 'Sentencia por incumplimiento laboral'
        break
      case 'contractual':
        flagType = FLAG_TYPES.CONTRACTUAL as FlagType
        title = 'Sentencia por incumplimiento contractual'
        break
    }

    flags.push({
      type: flagType,
      severity,
      title,
      description: sentence.description,
      source: sentence.source,
      evidence_url: sentence.evidence_url || null,
    })
  }

  // Flag por múltiples renuncias
  if (partyResignations >= 4) {
    flags.push({
      type: FLAG_TYPES.MULTIPLE_RESIGNATIONS as FlagType,
      severity: FLAG_SEVERITY.AMBER as FlagSeverity,
      title: 'Múltiples renuncias a partidos políticos',
      description: `Ha renunciado a ${partyResignations} organizaciones políticas`,
      source: 'DJHV - JNE',
      evidence_url: null,
    })
  }

  // Flag por baja confianza de datos
  if (confidence < CONFIDENCE_THRESHOLDS.medium) {
    flags.push({
      type: FLAG_TYPES.LOW_DATA as FlagType,
      severity: FLAG_SEVERITY.GRAY as FlagSeverity,
      title: 'Datos incompletos',
      description: 'La información disponible es limitada. El puntaje puede cambiar.',
      source: 'Sistema',
      evidence_url: null,
    })
  }

  return flags
}

// ============================================
// INTEGRITY STATUS
// ============================================

export type IntegrityStatus = 'green' | 'yellow' | 'red'

export function getIntegrityStatus(
  integrityScore: number,
  hasPenalSentence: boolean
): IntegrityStatus {
  if (hasPenalSentence || integrityScore < INTEGRITY_THRESHOLDS.yellow) {
    return 'red'
  }
  if (integrityScore < INTEGRITY_THRESHOLDS.green) {
    return 'yellow'
  }
  return 'green'
}

// ============================================
// CONFIDENCE STATUS
// ============================================

export type ConfidenceStatus = 'high' | 'medium' | 'low'

export function getConfidenceStatus(confidenceScore: number): ConfidenceStatus {
  if (confidenceScore >= CONFIDENCE_THRESHOLDS.high) return 'high'
  if (confidenceScore >= CONFIDENCE_THRESHOLDS.medium) return 'medium'
  return 'low'
}

// ============================================
// FULL CANDIDATE SCORING
// ============================================

export interface FullScoreResult {
  competence: number
  integrity: number
  transparency: number
  confidence: number
  scoreBalanced: number
  scoreMerit: number
  scoreIntegrity: number
  breakdown: ScoreBreakdown
  flags: Omit<Flag, 'id' | 'candidate_id' | 'date_captured'>[]
  integrityStatus: IntegrityStatus
  confidenceStatus: ConfidenceStatus
}

export interface CandidateDataForScoring {
  cargo: CargoType
  educationLevel: string | null
  educationDetails: EducationDetail[]
  experienceDetails: ExperienceDetail[]
  penalSentences: Sentence[]
  civilSentences: Sentence[]
  partyResignations: number
  transparencyInput: TransparencyInput
  confidenceInput: ConfidenceInput
}

export function calculateFullScore(data: CandidateDataForScoring): FullScoreResult {
  // Competencia
  const competenceResult = calculateCompetence(
    data.educationDetails,
    data.educationLevel,
    data.experienceDetails,
    data.cargo
  )

  // Integridad
  const integrityResult = calculateIntegrity(
    data.penalSentences,
    data.civilSentences,
    data.partyResignations
  )

  // Transparencia
  const transparencyResult = calculateTransparency(data.transparencyInput)

  // Confidence
  const confidenceResult = calculateConfidence(data.confidenceInput)

  // Score totales por preset
  const scoreBalanced = calculateScoreTotal(
    competenceResult.total,
    integrityResult.score,
    transparencyResult.total,
    PRESETS.balanced
  )

  const scoreMerit = calculateScoreTotal(
    competenceResult.total,
    integrityResult.score,
    transparencyResult.total,
    PRESETS.merit
  )

  const scoreIntegrity = calculateScoreTotal(
    competenceResult.total,
    integrityResult.score,
    transparencyResult.total,
    PRESETS.integrity
  )

  // Flags
  const hasPenalSentence = data.penalSentences.some((s) => s.status === 'firme')
  const flags = generateFlags(
    data.penalSentences,
    data.civilSentences,
    data.partyResignations,
    confidenceResult.total,
    integrityResult.score
  )

  // Breakdown completo
  const breakdown: ScoreBreakdown = {
    education: competenceResult.education,
    experience: {
      total: competenceResult.experienceTotal,
      relevant: competenceResult.experienceRelevant,
    },
    leadership: competenceResult.leadership,
    integrity: {
      base: integrityResult.base,
      penal_penalty: integrityResult.penalPenalty,
      civil_penalties: integrityResult.civilPenalties,
      resignation_penalty: integrityResult.resignationPenalty,
      final: integrityResult.score,
    },
    transparency: {
      completeness: transparencyResult.completeness,
      consistency: transparencyResult.consistency,
      assets_quality: transparencyResult.assetsQuality,
      total: transparencyResult.total,
    },
    confidence: {
      verification: confidenceResult.verification,
      coverage: confidenceResult.coverage,
      total: confidenceResult.total,
    },
  }

  return {
    competence: competenceResult.total,
    integrity: integrityResult.score,
    transparency: transparencyResult.total,
    confidence: confidenceResult.total,
    scoreBalanced,
    scoreMerit,
    scoreIntegrity,
    breakdown,
    flags,
    integrityStatus: getIntegrityStatus(integrityResult.score, hasPenalSentence),
    confidenceStatus: getConfidenceStatus(confidenceResult.total),
  }
}
