/**
 * SCORING ENGINE - Ranking Electoral Perú 2026
 *
 * Calculates candidate scores based on:
 * - Competence (Education, Experience, Leadership)
 * - Integrity (Penalties for sentences, resignations)
 * - Transparency (Completeness, Consistency, Assets quality)
 */

import type { CargoType } from '@/types/database'

// ============================================
// TYPES
// ============================================

export interface EducationDetail {
  level: EducationLevel
  field?: string
  institution?: string
  year?: number
  isVerified?: boolean
}

export type EducationLevel =
  | 'sin_informacion'
  | 'primaria'
  | 'secundaria_incompleta'
  | 'secundaria_completa'
  | 'tecnico_incompleto'
  | 'tecnico_completo'
  | 'universitario_incompleto'
  | 'universitario_completo'
  | 'titulo_profesional'
  | 'maestria'
  | 'doctorado'

export interface Experience {
  role: string
  roleType: RoleType
  organization: string
  startYear: number
  endYear?: number
  isLeadership?: boolean
  seniorityLevel?: SeniorityLevel
}

export type RoleType =
  | 'electivo_alto'
  | 'electivo_medio'
  | 'ejecutivo_publico_alto'
  | 'ejecutivo_publico_medio'
  | 'ejecutivo_privado_alto'
  | 'ejecutivo_privado_medio'
  | 'tecnico_profesional'
  | 'academia'
  | 'internacional'
  | 'partidario'

export type SeniorityLevel =
  | 'individual_contributor'
  | 'coordinador'
  | 'jefatura'
  | 'gerencia'
  | 'direccion'

export interface PenalSentence {
  type: 'penal'
  description: string
  isFirm: boolean
  year?: number
}

export interface CivilSentence {
  type: 'violence' | 'alimentos' | 'laboral' | 'contractual'
  description: string
  year?: number
}

export interface CandidateData {
  education: EducationDetail[]
  experience: Experience[]
  penalSentences: PenalSentence[]
  civilSentences: CivilSentence[]
  partyResignations: number
  declarationCompleteness: number
  declarationConsistency: number
  assetsQuality: number
  verificationLevel: number
  coverageLevel: number
}

export interface Weights {
  wC: number
  wI: number
  wT: number
}

// ============================================
// CONSTANTS
// ============================================

const EDUCATION_POINTS: Record<EducationLevel, number> = {
  sin_informacion: 0,
  primaria: 2,
  secundaria_incompleta: 4,
  secundaria_completa: 6,
  tecnico_incompleto: 7,
  tecnico_completo: 10,
  universitario_incompleto: 9,
  universitario_completo: 14,
  titulo_profesional: 16,
  maestria: 18,
  doctorado: 22,
}

const EXPERIENCE_TOTAL_POINTS: { minYears: number; points: number }[] = [
  { minYears: 15, points: 25 },
  { minYears: 11, points: 20 },
  { minYears: 8, points: 16 },
  { minYears: 5, points: 12 },
  { minYears: 2, points: 6 },
  { minYears: 0, points: 0 },
]

const RELEVANCE_BY_CARGO: Record<CargoType, Record<RoleType, number>> = {
  presidente: {
    electivo_alto: 3.0,
    ejecutivo_publico_alto: 3.0,
    ejecutivo_privado_alto: 2.8,
    ejecutivo_publico_medio: 2.0,
    ejecutivo_privado_medio: 1.8,
    internacional: 1.8,
    electivo_medio: 1.5,
    tecnico_profesional: 1.2,
    academia: 1.0,
    partidario: 0.6,
  },
  vicepresidente: {
    electivo_alto: 3.0,
    ejecutivo_publico_alto: 3.0,
    ejecutivo_privado_alto: 2.8,
    ejecutivo_publico_medio: 2.0,
    ejecutivo_privado_medio: 1.8,
    internacional: 1.8,
    electivo_medio: 1.5,
    tecnico_profesional: 1.2,
    academia: 1.0,
    partidario: 0.6,
  },
  senador: {
    electivo_alto: 3.0,
    ejecutivo_publico_alto: 2.6,
    electivo_medio: 2.2,
    ejecutivo_publico_medio: 2.0,
    ejecutivo_privado_alto: 1.8,
    tecnico_profesional: 1.6,
    ejecutivo_privado_medio: 1.4,
    academia: 1.4,
    internacional: 1.2,
    partidario: 0.8,
  },
  diputado: {
    electivo_alto: 3.0,
    ejecutivo_publico_alto: 2.6,
    electivo_medio: 2.2,
    ejecutivo_publico_medio: 2.0,
    ejecutivo_privado_alto: 1.8,
    tecnico_profesional: 1.6,
    ejecutivo_privado_medio: 1.4,
    academia: 1.4,
    internacional: 1.2,
    partidario: 0.8,
  },
  parlamento_andino: {
    internacional: 3.0,
    electivo_alto: 2.2,
    ejecutivo_publico_alto: 2.2,
    academia: 1.8,
    tecnico_profesional: 1.6,
    ejecutivo_privado_alto: 1.6,
    ejecutivo_publico_medio: 1.6,
    electivo_medio: 1.6,
    ejecutivo_privado_medio: 1.2,
    partidario: 0.8,
  },
}

const SENIORITY_POINTS: Record<SeniorityLevel, number> = {
  individual_contributor: 2,
  coordinador: 6,
  jefatura: 8,
  gerencia: 10,
  direccion: 14,
}

const STABILITY_POINTS: { minYears: number; points: number }[] = [
  { minYears: 7, points: 6 },
  { minYears: 4, points: 4 },
  { minYears: 2, points: 2 },
  { minYears: 0, points: 0 },
]

const CIVIL_PENALTIES: Record<CivilSentence['type'], number> = {
  violence: 50,
  alimentos: 35,
  laboral: 25,
  contractual: 15,
}

// Caps per type to prevent extreme accumulation
const CIVIL_PENALTY_CAPS: Record<CivilSentence['type'], number> = {
  violence: 70,    // Max 70 pts even with multiple violence sentences
  alimentos: 50,   // Max 50 pts for multiple alimentos cases
  laboral: 40,     // Max 40 pts for multiple labor cases
  contractual: 25, // Max 25 pts for multiple contractual cases
}

// Maximum total civil penalty (prevents score going too negative)
const MAX_TOTAL_CIVIL_PENALTY = 85

const RESIGNATION_PENALTIES: { minCount: number; penalty: number }[] = [
  { minCount: 4, penalty: 15 },
  { minCount: 2, penalty: 10 },
  { minCount: 1, penalty: 5 },
  { minCount: 0, penalty: 0 },
]

// ============================================
// SCORING FUNCTIONS
// ============================================

export function calculateEducationScore(education: EducationDetail[]): {
  level: number
  depth: number
  total: number
} {
  if (education.length === 0) {
    return { level: 0, depth: 0, total: 0 }
  }

  const levels = education.map((e) => EDUCATION_POINTS[e.level] || 0)
  const maxLevel = Math.max(...levels)

  let depthBonus = 0
  const sortedLevels = [...levels].sort((a, b) => b - a)

  for (let i = 1; i < sortedLevels.length && depthBonus < 8; i++) {
    if (sortedLevels[i] >= 10) {
      depthBonus += 2
    }
  }

  return {
    level: Math.min(maxLevel, 22),
    depth: Math.min(depthBonus, 8),
    total: Math.min(maxLevel + depthBonus, 30),
  }
}

interface TimeRange {
  start: number
  end: number
}

/**
 * Merge overlapping time ranges to get unique coverage
 */
function mergeTimeRanges(ranges: TimeRange[]): TimeRange[] {
  if (ranges.length === 0) return []

  // Sort by start year
  const sorted = [...ranges].sort((a, b) => a.start - b.start)
  const merged: TimeRange[] = [{ ...sorted[0] }]

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i]
    const lastMerged = merged[merged.length - 1]

    if (current.start <= lastMerged.end) {
      // Overlap detected, extend the range
      lastMerged.end = Math.max(lastMerged.end, current.end)
    } else {
      // No overlap, add new range
      merged.push({ ...current })
    }
  }

  return merged
}

/**
 * Calculate total experience years, properly handling overlapping periods
 */
export function calculateTotalExperienceYears(experience: Experience[]): {
  rawYears: number
  uniqueYears: number
  hasOverlap: boolean
} {
  const currentYear = new Date().getFullYear()

  if (experience.length === 0) {
    return { rawYears: 0, uniqueYears: 0, hasOverlap: false }
  }

  // Create time ranges
  const ranges: TimeRange[] = experience.map((exp) => ({
    start: exp.startYear,
    end: exp.endYear || currentYear,
  }))

  // Calculate raw total (with potential overlap)
  const rawYears = ranges.reduce((sum, r) => sum + (r.end - r.start), 0)

  // Calculate unique years (without overlap)
  const mergedRanges = mergeTimeRanges(ranges)
  const uniqueYears = mergedRanges.reduce((sum, r) => sum + (r.end - r.start), 0)

  return {
    rawYears,
    uniqueYears,
    hasOverlap: rawYears !== uniqueYears,
  }
}

export function calculateExperienceTotal(experience: Experience[]): number {
  // Use uniqueYears to avoid double-counting overlapping experience
  const { uniqueYears } = calculateTotalExperienceYears(experience)

  for (const tier of EXPERIENCE_TOTAL_POINTS) {
    if (uniqueYears >= tier.minYears) {
      return tier.points
    }
  }

  return 0
}

export function calculateExperienceRelevant(
  experience: Experience[],
  cargo: CargoType
): number {
  const currentYear = new Date().getFullYear()
  const relevanceTable = RELEVANCE_BY_CARGO[cargo]
  let relevanceScore = 0

  for (const exp of experience) {
    const years = Math.min((exp.endYear || currentYear) - exp.startYear, 10)
    const ptsPerYear = relevanceTable[exp.roleType] || 0.5
    relevanceScore += years * ptsPerYear
  }

  return Math.min(relevanceScore, 25)
}

export function calculateLeadership(experience: Experience[]): {
  seniority: number
  stability: number
  total: number
} {
  const currentYear = new Date().getFullYear()
  const leadershipExps = experience.filter((e) => e.isLeadership && e.seniorityLevel)

  if (leadershipExps.length === 0) {
    return { seniority: 0, stability: 0, total: 0 }
  }

  const maxSeniority = Math.max(
    ...leadershipExps.map((e) => SENIORITY_POINTS[e.seniorityLevel!] || 0)
  )

  let leadershipYears = 0
  for (const exp of leadershipExps) {
    leadershipYears += (exp.endYear || currentYear) - exp.startYear
  }

  let stabilityPoints = 0
  for (const tier of STABILITY_POINTS) {
    if (leadershipYears >= tier.minYears) {
      stabilityPoints = tier.points
      break
    }
  }

  return {
    seniority: Math.min(maxSeniority, 14),
    stability: Math.min(stabilityPoints, 6),
    total: Math.min(maxSeniority + stabilityPoints, 20),
  }
}

export function calculateCompetence(
  data: CandidateData,
  cargo: CargoType
): {
  education: { level: number; depth: number; total: number }
  experienceTotal: number
  experienceRelevant: number
  leadership: { seniority: number; stability: number; total: number }
  total: number
} {
  const education = calculateEducationScore(data.education)
  const experienceTotal = calculateExperienceTotal(data.experience)
  const experienceRelevant = calculateExperienceRelevant(data.experience, cargo)
  const leadership = calculateLeadership(data.experience)

  const total = education.total + experienceTotal + experienceRelevant + leadership.total

  return {
    education,
    experienceTotal,
    experienceRelevant,
    leadership,
    total: Math.min(total, 100),
  }
}

export function calculateIntegrity(data: CandidateData): {
  base: number
  penalPenalty: number
  civilPenalties: { type: string; penalty: number; count: number; capped: boolean }[]
  totalCivilPenalty: number
  civilPenaltiesCapped: boolean
  resignationPenalty: number
  total: number
} {
  let score = 100
  const civilPenalties: { type: string; penalty: number; count: number; capped: boolean }[] = []

  // Sentencias penales firmes (mayor penalidad)
  const firmPenalCount = data.penalSentences.filter((s) => s.isFirm).length
  // Sentencias penales en proceso/apelación (penalidad menor pero significativa)
  const pendingPenalCount = data.penalSentences.filter((s) => !s.isFirm).length

  let penalPenalty = 0
  // Penalidad por sentencias firmes
  if (firmPenalCount >= 2) {
    penalPenalty = 85
  } else if (firmPenalCount === 1) {
    penalPenalty = 70
  }
  // Penalidad adicional por casos en proceso/apelación (35 puntos por caso)
  if (pendingPenalCount > 0 && penalPenalty < 85) {
    penalPenalty += Math.min(pendingPenalCount * 35, 85 - penalPenalty)
  }
  score -= penalPenalty

  // Group civil sentences by type for capped calculation
  const civilByType: Record<string, CivilSentence[]> = {}
  for (const sentence of data.civilSentences) {
    if (!civilByType[sentence.type]) {
      civilByType[sentence.type] = []
    }
    civilByType[sentence.type].push(sentence)
  }

  let totalCivilPenalty = 0
  let anyCapped = false

  for (const [type, sentences] of Object.entries(civilByType)) {
    const sentenceType = type as CivilSentence['type']
    const basePenalty = CIVIL_PENALTIES[sentenceType] || 10
    const cap = CIVIL_PENALTY_CAPS[sentenceType] || 30

    // Decreasing returns: 1st = 100%, 2nd = 50%, 3rd+ = 25%
    let typePenalty = 0
    sentences.forEach((_, index) => {
      const multiplier = index === 0 ? 1.0 : index === 1 ? 0.5 : 0.25
      typePenalty += basePenalty * multiplier
    })

    // Apply per-type cap
    const cappedTypePenalty = Math.min(typePenalty, cap)
    const wasCapped = typePenalty > cap

    if (wasCapped) anyCapped = true

    civilPenalties.push({
      type,
      penalty: cappedTypePenalty,
      count: sentences.length,
      capped: wasCapped,
    })

    totalCivilPenalty += cappedTypePenalty
  }

  // Apply total civil penalty cap
  const finalCivilPenalty = Math.min(totalCivilPenalty, MAX_TOTAL_CIVIL_PENALTY)
  if (totalCivilPenalty > MAX_TOTAL_CIVIL_PENALTY) anyCapped = true

  score -= finalCivilPenalty

  let resignationPenalty = 0
  for (const tier of RESIGNATION_PENALTIES) {
    if (data.partyResignations >= tier.minCount) {
      resignationPenalty = tier.penalty
      break
    }
  }
  score -= resignationPenalty

  return {
    base: 100,
    penalPenalty,
    civilPenalties,
    totalCivilPenalty: finalCivilPenalty,
    civilPenaltiesCapped: anyCapped,
    resignationPenalty,
    total: Math.max(score, 0),
  }
}

export function calculateTransparency(data: CandidateData): {
  completeness: number
  consistency: number
  assetsQuality: number
  total: number
} {
  const completeness = Math.round((data.declarationCompleteness / 100) * 35)
  const consistency = Math.round((data.declarationConsistency / 100) * 35)
  const assetsQuality = Math.round((data.assetsQuality / 100) * 30)

  return {
    completeness,
    consistency,
    assetsQuality,
    total: completeness + consistency + assetsQuality,
  }
}

export function calculateConfidence(data: CandidateData): {
  verification: number
  coverage: number
  total: number
} {
  const verification = Math.round((data.verificationLevel / 100) * 50)
  const coverage = Math.round((data.coverageLevel / 100) * 50)

  return {
    verification,
    coverage,
    total: verification + coverage,
  }
}

export function calculateWeightedScore(
  competence: number,
  integrity: number,
  transparency: number,
  weights: Weights
): number {
  return (
    weights.wC * competence +
    weights.wI * integrity +
    weights.wT * transparency
  )
}

export function calculateAllScores(
  data: CandidateData,
  cargo: CargoType
) {
  const competence = calculateCompetence(data, cargo)
  const integrity = calculateIntegrity(data)
  const transparency = calculateTransparency(data)
  const confidence = calculateConfidence(data)

  const balanced = calculateWeightedScore(
    competence.total,
    integrity.total,
    transparency.total,
    { wC: 0.45, wI: 0.45, wT: 0.10 }
  )

  const merit = calculateWeightedScore(
    competence.total,
    integrity.total,
    transparency.total,
    { wC: 0.60, wI: 0.30, wT: 0.10 }
  )

  const integrityFirst = calculateWeightedScore(
    competence.total,
    integrity.total,
    transparency.total,
    { wC: 0.30, wI: 0.60, wT: 0.10 }
  )

  return {
    competence,
    integrity,
    transparency,
    confidence,
    scores: {
      competence: competence.total,
      integrity: integrity.total,
      transparency: transparency.total,
      confidence: confidence.total,
      balanced,
      merit,
      integrityFirst,
    },
  }
}

// ============================================
// ENHANCED SCORING WITH NEW DATA SOURCES
// ============================================

/**
 * Extended integrity data that includes new penalty sources
 */
export interface EnhancedIntegrityData extends CandidateData {
  // Congressional voting record
  proCrimeVotesInFavor?: number
  proCrimeVotesAgainst?: number
  antiDemocraticVotes?: number
  votingIntegrityPenalty?: number
  votingIntegrityBonus?: number

  // SUNAT tax status
  taxCondition?: 'habido' | 'no_habido' | 'no_hallado' | 'pendiente'
  taxStatus?: 'activo' | 'suspendido' | 'baja_definitiva' | 'baja_provisional'
  hasCoactiveDebts?: boolean
  coactiveDebtCount?: number

  // Judicial verification
  hasJudicialDiscrepancy?: boolean
  undeclaredCasesCount?: number
  discrepancySeverity?: 'none' | 'minor' | 'major' | 'critical'

  // Company issues
  companyPenalCases?: number
  companyLaborIssues?: number
  companyEnvironmentalIssues?: number
  companyConsumerComplaints?: number

  // Incumbent performance
  isIncumbent?: boolean
  budgetExecutionPct?: number
  contraloríaReports?: number
  performanceScore?: number
}

/**
 * Calculate penalty from congressional voting record
 */
export function calculateVotingPenalty(data: EnhancedIntegrityData): {
  penalty: number
  bonus: number
  net: number
} {
  const penalty = data.votingIntegrityPenalty || 0
  const bonus = data.votingIntegrityBonus || 0

  return {
    penalty: Math.min(penalty, 85), // Cap at 85
    bonus: Math.min(bonus, 15), // Cap bonus at 15
    net: Math.max(-85, bonus - penalty), // Net impact
  }
}

/**
 * Calculate penalty from SUNAT tax status
 */
export function calculateTaxPenalty(data: EnhancedIntegrityData): number {
  let penalty = 0

  // NO HABIDO is a major red flag
  if (data.taxCondition === 'no_habido') {
    penalty += 50
  } else if (data.taxCondition === 'no_hallado') {
    penalty += 20
  }

  // Suspended or closed RUC
  if (data.taxStatus === 'suspendido') {
    penalty += 15
  } else if (data.taxStatus === 'baja_definitiva' || data.taxStatus === 'baja_provisional') {
    penalty += 10
  }

  // Coactive debts
  if (data.hasCoactiveDebts) {
    penalty += 20 * Math.min(data.coactiveDebtCount || 1, 3)
  }

  return Math.min(penalty, 85)
}

/**
 * Calculate penalty from judicial discrepancies (omissions)
 */
export function calculateOmissionPenalty(data: EnhancedIntegrityData): number {
  if (!data.hasJudicialDiscrepancy) return 0

  const severityPenalties: Record<string, number> = {
    critical: 60,
    major: 40,
    minor: 20,
    none: 0,
  }

  const basePenalty = severityPenalties[data.discrepancySeverity || 'none'] || 0
  const additionalPenalty = (data.undeclaredCasesCount || 0) * 10

  return Math.min(basePenalty + additionalPenalty, 85)
}

/**
 * Calculate penalty from company legal issues
 */
export function calculateCompanyPenalty(data: EnhancedIntegrityData): number {
  let penalty = 0

  // Penal cases in companies are serious
  if (data.companyPenalCases) {
    penalty += data.companyPenalCases * 40
  }

  // Labor violations
  if (data.companyLaborIssues) {
    penalty += data.companyLaborIssues * 20
  }

  // Environmental violations
  if (data.companyEnvironmentalIssues) {
    penalty += data.companyEnvironmentalIssues * 25
  }

  // Consumer complaints (less severe but still relevant)
  if (data.companyConsumerComplaints && data.companyConsumerComplaints > 5) {
    penalty += 15
  }

  return Math.min(penalty, 60) // Cap company penalties lower than personal
}

/**
 * Calculate enhanced integrity score with all new data sources
 */
export function calculateEnhancedIntegrity(data: EnhancedIntegrityData): {
  base: number
  penalPenalty: number
  civilPenalties: { type: string; penalty: number; count: number; capped: boolean }[]
  totalCivilPenalty: number
  civilPenaltiesCapped: boolean
  resignationPenalty: number
  votingPenalty: number
  votingBonus: number
  taxPenalty: number
  omissionPenalty: number
  companyPenalty: number
  total: number
  breakdown: {
    base: number
    traditionalPenalties: number  // Sum of penal + civil + resignation (negative)
    votingRecord: number
    taxCompliance: number
    judicialVerification: number
    corporateRecord: number
    subtotals: {
      afterTraditional: number
      afterVoting: number
      afterTax: number
      afterJudicial: number
      final: number
    }
  }
} {
  // Start with base integrity calculation
  const baseIntegrity = calculateIntegrity(data)

  // Calculate new penalties
  const voting = calculateVotingPenalty(data)
  const taxPenalty = calculateTaxPenalty(data)
  const omissionPenalty = calculateOmissionPenalty(data)
  const companyPenalty = calculateCompanyPenalty(data)

  // Calculate traditional penalties as negative value for clear breakdown
  const traditionalPenalties = -(
    baseIntegrity.penalPenalty +
    baseIntegrity.totalCivilPenalty +
    baseIntegrity.resignationPenalty
  )

  // Calculate subtotals incrementally for auditability
  const afterTraditional = 100 + traditionalPenalties
  const afterVoting = afterTraditional - voting.penalty + voting.bonus
  const afterTax = afterVoting - taxPenalty
  const afterJudicial = afterTax - omissionPenalty
  const final = Math.max(0, Math.min(100, afterJudicial - companyPenalty))

  return {
    base: 100,
    penalPenalty: baseIntegrity.penalPenalty,
    civilPenalties: baseIntegrity.civilPenalties,
    totalCivilPenalty: baseIntegrity.totalCivilPenalty,
    civilPenaltiesCapped: baseIntegrity.civilPenaltiesCapped,
    resignationPenalty: baseIntegrity.resignationPenalty,
    votingPenalty: voting.penalty,
    votingBonus: voting.bonus,
    taxPenalty,
    omissionPenalty,
    companyPenalty,
    total: final,
    breakdown: {
      base: 100,
      traditionalPenalties,
      votingRecord: -voting.penalty + voting.bonus,
      taxCompliance: -taxPenalty,
      judicialVerification: -omissionPenalty,
      corporateRecord: -companyPenalty,
      subtotals: {
        afterTraditional,
        afterVoting,
        afterTax,
        afterJudicial,
        final,
      },
    },
  }
}

/**
 * Calculate performance score for incumbents
 */
export function calculatePerformanceScore(data: EnhancedIntegrityData): number | null {
  if (!data.isIncumbent) return null

  let score = 50 // Base score

  // Budget execution (higher is better)
  if (data.budgetExecutionPct !== undefined) {
    // 80%+ execution: bonus
    // 50%- execution: penalty
    score += (data.budgetExecutionPct - 50) * 0.5
  }

  // Contraloría reports (audits/findings are bad)
  if (data.contraloríaReports) {
    score -= data.contraloríaReports * 10
  }

  // Override with direct performance score if available
  if (data.performanceScore !== undefined) {
    score = data.performanceScore
  }

  return Math.max(0, Math.min(100, score))
}

/**
 * Calculate all scores with enhanced integrity
 */
export function calculateEnhancedScores(
  data: EnhancedIntegrityData,
  cargo: CargoType
) {
  const competence = calculateCompetence(data, cargo)
  const integrity = calculateEnhancedIntegrity(data)
  const transparency = calculateTransparency(data)
  const confidence = calculateConfidence(data)
  const performance = calculatePerformanceScore(data)

  const balanced = calculateWeightedScore(
    competence.total,
    integrity.total,
    transparency.total,
    { wC: 0.45, wI: 0.45, wT: 0.10 }
  )

  const merit = calculateWeightedScore(
    competence.total,
    integrity.total,
    transparency.total,
    { wC: 0.60, wI: 0.30, wT: 0.10 }
  )

  const integrityFirst = calculateWeightedScore(
    competence.total,
    integrity.total,
    transparency.total,
    { wC: 0.30, wI: 0.60, wT: 0.10 }
  )

  return {
    competence,
    integrity,
    transparency,
    confidence,
    performance,
    scores: {
      competence: competence.total,
      integrity: integrity.total,
      transparency: transparency.total,
      confidence: confidence.total,
      performance,
      balanced,
      merit,
      integrityFirst,
    },
    integrityBreakdown: integrity.breakdown,
  }
}
