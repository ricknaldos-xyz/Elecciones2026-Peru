// ============================================
// SCORING PRESETS
// ============================================

export const PRESETS = {
  balanced: { wC: 0.45, wI: 0.45, wT: 0.10 },
  merit: { wC: 0.60, wI: 0.30, wT: 0.10 },
  integrity: { wC: 0.30, wI: 0.60, wT: 0.10 },
} as const

export type PresetType = keyof typeof PRESETS

// Guardrails para modo custom
// Límites ajustados para que la suma máxima no exceda 1.0 significativamente
// max(wC) + max(wI) + min(wT) = 0.55 + 0.55 + 0.05 = 1.15 (se normaliza)
// max(wC) + min(wI) + max(wT) = 0.55 + 0.20 + 0.20 = 0.95 (válido)
export const WEIGHT_LIMITS = {
  wC: { min: 0.20, max: 0.55 },
  wI: { min: 0.20, max: 0.55 },
  wT: { min: 0.05, max: 0.20 },
} as const

export type Weights = { wC: number; wI: number; wT: number }

/**
 * Validates and normalizes weights to ensure they sum to exactly 1.0
 * Also clamps each weight to its valid range
 */
export function validateAndNormalizeWeights(weights: Weights): Weights {
  // First, clamp to limits
  let wC = Math.max(WEIGHT_LIMITS.wC.min, Math.min(WEIGHT_LIMITS.wC.max, weights.wC))
  let wI = Math.max(WEIGHT_LIMITS.wI.min, Math.min(WEIGHT_LIMITS.wI.max, weights.wI))
  let wT = Math.max(WEIGHT_LIMITS.wT.min, Math.min(WEIGHT_LIMITS.wT.max, weights.wT))

  const total = wC + wI + wT

  // If already normalized (within tolerance), return clamped values
  if (Math.abs(total - 1.0) < 0.001) {
    return { wC, wI, wT }
  }

  // Normalize proportionally
  const factor = 1.0 / total
  wC = Math.round(wC * factor * 1000) / 1000
  wI = Math.round(wI * factor * 1000) / 1000
  wT = Math.round(wT * factor * 1000) / 1000

  // Adjust for rounding errors (ensure exact sum of 1.0)
  const newTotal = wC + wI + wT
  if (newTotal !== 1.0) {
    // Adjust the largest weight to compensate
    const diff = 1.0 - newTotal
    if (wC >= wI && wC >= wT) {
      wC = Math.round((wC + diff) * 1000) / 1000
    } else if (wI >= wC && wI >= wT) {
      wI = Math.round((wI + diff) * 1000) / 1000
    } else {
      wT = Math.round((wT + diff) * 1000) / 1000
    }
  }

  return { wC, wI, wT }
}

/**
 * Checks if weights are valid (sum to 1.0 and within limits)
 */
export function areWeightsValid(weights: Weights): boolean {
  const { wC, wI, wT } = weights
  const total = wC + wI + wT

  const withinLimits =
    wC >= WEIGHT_LIMITS.wC.min && wC <= WEIGHT_LIMITS.wC.max &&
    wI >= WEIGHT_LIMITS.wI.min && wI <= WEIGHT_LIMITS.wI.max &&
    wT >= WEIGHT_LIMITS.wT.min && wT <= WEIGHT_LIMITS.wT.max

  return withinLimits && Math.abs(total - 1.0) < 0.001
}

// ============================================
// THRESHOLDS
// ============================================

export const CONFIDENCE_THRESHOLDS = {
  high: 70,
  medium: 40,
  low: 0,
} as const

export const INTEGRITY_THRESHOLDS = {
  green: 90,
  yellow: 70,
  red: 0,
} as const

// ============================================
// EDUCATION SCORING
// ============================================

export const EDUCATION_LEVEL_POINTS: Record<string, number> = {
  'sin_informacion': 0,
  'primaria_completa': 2,
  'secundaria_incompleta': 4,
  'secundaria_completa': 6,
  'tecnico_incompleto': 7,
  'tecnico_completo': 10,
  'universitario_incompleto': 9,
  'universitario_completo': 14,
  'titulo_profesional': 16,
  'maestria': 18,
  'doctorado': 22,
} as const

// Profundidad académica (máximo 8 puntos adicionales)
export const EDUCATION_DEPTH = {
  specializationPoints: 2, // por cada especialización/diplomado
  maxSpecializations: 3, // máximo 6 puntos por especializaciones
  additionalMasterPoints: 2, // segunda maestría o especialidad grande
} as const

// ============================================
// EXPERIENCE SCORING
// ============================================

export const EXPERIENCE_TOTAL_POINTS: Record<string, number> = {
  '0-1': 0,
  '2-4': 6,
  '5-7': 12,
  '8-10': 16,
  '11-14': 20,
  '15+': 25,
} as const

export function getExperienceTotalPoints(years: number): number {
  if (years <= 1) return 0
  if (years <= 4) return 6
  if (years <= 7) return 12
  if (years <= 10) return 16
  if (years <= 14) return 20
  return 25
}

// ============================================
// ROLE TYPES
// ============================================

export const ROLE_TYPES = {
  ELECTIVO_ALTO: 'electivo_alto',
  ELECTIVO_MEDIO: 'electivo_medio',
  EJECUTIVO_PUBLICO_ALTO: 'ejecutivo_publico_alto',
  EJECUTIVO_PUBLICO_MEDIO: 'ejecutivo_publico_medio',
  EJECUTIVO_PRIVADO_ALTO: 'ejecutivo_privado_alto',
  EJECUTIVO_PRIVADO_MEDIO: 'ejecutivo_privado_medio',
  TECNICO_PROFESIONAL: 'tecnico_profesional',
  ACADEMIA: 'academia',
  INTERNACIONAL: 'internacional',
  PARTIDARIO: 'partidario',
} as const

export type RoleType = typeof ROLE_TYPES[keyof typeof ROLE_TYPES]

// Puntos por año para experiencia relevante según cargo
export const RELEVANCE_POINTS_BY_CARGO = {
  presidente: {
    [ROLE_TYPES.ELECTIVO_ALTO]: 3.0,
    [ROLE_TYPES.EJECUTIVO_PUBLICO_ALTO]: 3.0,
    [ROLE_TYPES.EJECUTIVO_PRIVADO_ALTO]: 2.8,
    [ROLE_TYPES.EJECUTIVO_PUBLICO_MEDIO]: 2.0,
    [ROLE_TYPES.EJECUTIVO_PRIVADO_MEDIO]: 1.8,
    [ROLE_TYPES.INTERNACIONAL]: 1.8,
    [ROLE_TYPES.ELECTIVO_MEDIO]: 1.5,
    [ROLE_TYPES.TECNICO_PROFESIONAL]: 1.2,
    [ROLE_TYPES.ACADEMIA]: 1.0,
    [ROLE_TYPES.PARTIDARIO]: 0.6,
  },
  vicepresidente: {
    [ROLE_TYPES.ELECTIVO_ALTO]: 3.0,
    [ROLE_TYPES.EJECUTIVO_PUBLICO_ALTO]: 3.0,
    [ROLE_TYPES.EJECUTIVO_PRIVADO_ALTO]: 2.8,
    [ROLE_TYPES.EJECUTIVO_PUBLICO_MEDIO]: 2.0,
    [ROLE_TYPES.EJECUTIVO_PRIVADO_MEDIO]: 1.8,
    [ROLE_TYPES.INTERNACIONAL]: 1.8,
    [ROLE_TYPES.ELECTIVO_MEDIO]: 1.5,
    [ROLE_TYPES.TECNICO_PROFESIONAL]: 1.2,
    [ROLE_TYPES.ACADEMIA]: 1.0,
    [ROLE_TYPES.PARTIDARIO]: 0.6,
  },
  senador: {
    [ROLE_TYPES.ELECTIVO_ALTO]: 3.0,
    [ROLE_TYPES.EJECUTIVO_PUBLICO_ALTO]: 2.6,
    [ROLE_TYPES.ELECTIVO_MEDIO]: 2.2,
    [ROLE_TYPES.EJECUTIVO_PUBLICO_MEDIO]: 2.0,
    [ROLE_TYPES.EJECUTIVO_PRIVADO_ALTO]: 1.8,
    [ROLE_TYPES.TECNICO_PROFESIONAL]: 1.6,
    [ROLE_TYPES.EJECUTIVO_PRIVADO_MEDIO]: 1.4,
    [ROLE_TYPES.ACADEMIA]: 1.4,
    [ROLE_TYPES.INTERNACIONAL]: 1.2,
    [ROLE_TYPES.PARTIDARIO]: 0.8,
  },
  diputado: {
    [ROLE_TYPES.ELECTIVO_ALTO]: 3.0,
    [ROLE_TYPES.EJECUTIVO_PUBLICO_ALTO]: 2.6,
    [ROLE_TYPES.ELECTIVO_MEDIO]: 2.2,
    [ROLE_TYPES.EJECUTIVO_PUBLICO_MEDIO]: 2.0,
    [ROLE_TYPES.EJECUTIVO_PRIVADO_ALTO]: 1.8,
    [ROLE_TYPES.TECNICO_PROFESIONAL]: 1.6,
    [ROLE_TYPES.EJECUTIVO_PRIVADO_MEDIO]: 1.4,
    [ROLE_TYPES.ACADEMIA]: 1.4,
    [ROLE_TYPES.INTERNACIONAL]: 1.2,
    [ROLE_TYPES.PARTIDARIO]: 0.8,
  },
  parlamento_andino: {
    [ROLE_TYPES.INTERNACIONAL]: 3.0,
    [ROLE_TYPES.ELECTIVO_ALTO]: 2.2,
    [ROLE_TYPES.EJECUTIVO_PUBLICO_ALTO]: 2.2,
    [ROLE_TYPES.ACADEMIA]: 1.8,
    [ROLE_TYPES.TECNICO_PROFESIONAL]: 1.6,
    [ROLE_TYPES.EJECUTIVO_PRIVADO_ALTO]: 1.6,
    [ROLE_TYPES.EJECUTIVO_PUBLICO_MEDIO]: 1.6,
    [ROLE_TYPES.ELECTIVO_MEDIO]: 1.6,
    [ROLE_TYPES.EJECUTIVO_PRIVADO_MEDIO]: 1.2,
    [ROLE_TYPES.PARTIDARIO]: 0.8,
  },
} as const

export type CargoType = keyof typeof RELEVANCE_POINTS_BY_CARGO

// ============================================
// LEADERSHIP SCORING
// ============================================

export const SENIORITY_POINTS: Record<string, number> = {
  'individual': 2,
  'coordinador': 6,
  'jefatura': 8,
  'gerencia': 10,
  'direccion': 14,
} as const

export function getLeadershipStabilityPoints(years: number): number {
  if (years <= 1) return 0
  if (years <= 3) return 2
  if (years <= 6) return 4
  return 6
}

// ============================================
// INTEGRITY PENALTIES
// ============================================

export const INTEGRITY_PENALTIES = {
  PENAL_SENTENCE_1: -70,
  PENAL_SENTENCE_2_PLUS: -85, // cap
  VIOLENCIA_FAMILIAR: -50,
  OBLIGACIONES_ALIMENTARIAS: -35,
  LABORAL: -25,
  CONTRACTUAL: -15,
  RENUNCIAS_1: -5,
  RENUNCIAS_2_3: -10,
  RENUNCIAS_4_PLUS: -15,
} as const

export function getResignationPenalty(count: number): number {
  if (count === 0) return 0
  if (count === 1) return INTEGRITY_PENALTIES.RENUNCIAS_1
  if (count <= 3) return INTEGRITY_PENALTIES.RENUNCIAS_2_3
  return INTEGRITY_PENALTIES.RENUNCIAS_4_PLUS
}

// ============================================
// FLAG TYPES
// ============================================

export const FLAG_TYPES = {
  PENAL_SENTENCE: 'PENAL_SENTENCE',
  CIVIL_SENTENCE: 'CIVIL_SENTENCE',
  VIOLENCE: 'VIOLENCE',
  ALIMENTOS: 'ALIMENTOS',
  LABORAL: 'LABORAL',
  CONTRACTUAL: 'CONTRACTUAL',
  MULTIPLE_RESIGNATIONS: 'MULTIPLE_RESIGNATIONS',
  LOW_DATA: 'LOW_DATA',
  UNDER_REVIEW: 'UNDER_REVIEW',
} as const

export const FLAG_SEVERITY = {
  RED: 'RED',
  AMBER: 'AMBER',
  GRAY: 'GRAY',
} as const

export type FlagType = typeof FLAG_TYPES[keyof typeof FLAG_TYPES]
export type FlagSeverity = typeof FLAG_SEVERITY[keyof typeof FLAG_SEVERITY]

// ============================================
// TRANSPARENCY SCORING
// ============================================

export const TRANSPARENCY_SECTIONS = [
  'identificacion',
  'estudios',
  'experiencia_laboral',
  'trayectoria_politica',
  'sentencias_penales',
  'sentencias_civiles',
  'bienes_rentas',
] as const

export const CONSISTENCY_CHECKS = [
  'fechas_estudios_plausibles',
  'fechas_laborales_plausibles',
  'coherencia_estudios_ocupacion',
  'experiencias_campos_completos',
  'estudios_campos_completos',
  'trayectoria_campos_completos',
  'sin_contradicciones_internas',
] as const

// ============================================
// CARGOS (POSITIONS)
// ============================================

export const CARGOS = {
  PRESIDENTE: 'presidente',
  VICEPRESIDENTE: 'vicepresidente',
  SENADOR: 'senador',
  DIPUTADO: 'diputado',
  PARLAMENTO_ANDINO: 'parlamento_andino',
} as const

// ============================================
// DISTRICTS (27 electoral districts)
// Sincronizado con supabase/migrations/006_districts_data.sql
// ============================================

export const DISTRICTS = [
  // Departamentos principales (ordenados por número de diputados)
  { slug: 'lima-metropolitana', name: 'Lima Metropolitana', type: 'departamento', deputies: 36 },
  { slug: 'la-libertad', name: 'La Libertad', type: 'departamento', deputies: 7 },
  { slug: 'piura', name: 'Piura', type: 'departamento', deputies: 7 },
  { slug: 'arequipa', name: 'Arequipa', type: 'departamento', deputies: 6 },
  { slug: 'cajamarca', name: 'Cajamarca', type: 'departamento', deputies: 6 },
  { slug: 'cusco', name: 'Cusco', type: 'departamento', deputies: 5 },
  { slug: 'junin', name: 'Junín', type: 'departamento', deputies: 5 },
  { slug: 'lambayeque', name: 'Lambayeque', type: 'departamento', deputies: 5 },
  { slug: 'puno', name: 'Puno', type: 'departamento', deputies: 5 },
  { slug: 'ancash', name: 'Áncash', type: 'departamento', deputies: 4 },
  { slug: 'loreto', name: 'Loreto', type: 'departamento', deputies: 4 },
  { slug: 'ica', name: 'Ica', type: 'departamento', deputies: 3 },
  { slug: 'san-martin', name: 'San Martín', type: 'departamento', deputies: 3 },
  { slug: 'huanuco', name: 'Huánuco', type: 'departamento', deputies: 3 },
  { slug: 'ayacucho', name: 'Ayacucho', type: 'departamento', deputies: 3 },
  { slug: 'ucayali', name: 'Ucayali', type: 'departamento', deputies: 2 },
  { slug: 'apurimac', name: 'Apurímac', type: 'departamento', deputies: 2 },
  { slug: 'huancavelica', name: 'Huancavelica', type: 'departamento', deputies: 2 },
  { slug: 'amazonas', name: 'Amazonas', type: 'departamento', deputies: 2 },
  { slug: 'tacna', name: 'Tacna', type: 'departamento', deputies: 2 },
  { slug: 'pasco', name: 'Pasco', type: 'departamento', deputies: 2 },
  { slug: 'tumbes', name: 'Tumbes', type: 'departamento', deputies: 1 },
  { slug: 'moquegua', name: 'Moquegua', type: 'departamento', deputies: 1 },
  { slug: 'madre-de-dios', name: 'Madre de Dios', type: 'departamento', deputies: 1 },
  // Distritos especiales
  { slug: 'lima-provincias', name: 'Lima Provincias', type: 'lima_provincia', deputies: 4 },
  { slug: 'callao', name: 'Callao', type: 'callao', deputies: 4 },
  { slug: 'extranjero', name: 'Peruanos en el Extranjero', type: 'extranjero', deputies: 2 },
] as const
