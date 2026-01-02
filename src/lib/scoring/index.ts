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

function calculateTotalExperienceYears(experience: Experience[]): number {
  const currentYear = new Date().getFullYear()
  let totalYears = 0

  for (const exp of experience) {
    const endYear = exp.endYear || currentYear
    totalYears += endYear - exp.startYear
  }

  return totalYears
}

export function calculateExperienceTotal(experience: Experience[]): number {
  const years = calculateTotalExperienceYears(experience)

  for (const tier of EXPERIENCE_TOTAL_POINTS) {
    if (years >= tier.minYears) {
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
  civilPenalties: { type: string; penalty: number }[]
  resignationPenalty: number
  total: number
} {
  let score = 100
  const civilPenalties: { type: string; penalty: number }[] = []

  const firmPenalCount = data.penalSentences.filter((s) => s.isFirm).length
  let penalPenalty = 0
  if (firmPenalCount >= 2) {
    penalPenalty = 85
  } else if (firmPenalCount === 1) {
    penalPenalty = 70
  }
  score -= penalPenalty

  for (const sentence of data.civilSentences) {
    const penalty = CIVIL_PENALTIES[sentence.type] || 10
    civilPenalties.push({ type: sentence.type, penalty })
    score -= penalty
  }

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
