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
export const WEIGHT_LIMITS = {
  wC: { min: 0.20, max: 0.75 },
  wI: { min: 0.20, max: 0.75 },
  wT: { min: 0.05, max: 0.20 },
} as const

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
// ============================================

export const DISTRICTS = [
  { slug: 'amazonas', name: 'Amazonas', type: 'departamento' },
  { slug: 'ancash', name: 'Áncash', type: 'departamento' },
  { slug: 'apurimac', name: 'Apurímac', type: 'departamento' },
  { slug: 'arequipa', name: 'Arequipa', type: 'departamento' },
  { slug: 'ayacucho', name: 'Ayacucho', type: 'departamento' },
  { slug: 'cajamarca', name: 'Cajamarca', type: 'departamento' },
  { slug: 'callao', name: 'Callao', type: 'callao' },
  { slug: 'cusco', name: 'Cusco', type: 'departamento' },
  { slug: 'huancavelica', name: 'Huancavelica', type: 'departamento' },
  { slug: 'huanuco', name: 'Huánuco', type: 'departamento' },
  { slug: 'ica', name: 'Ica', type: 'departamento' },
  { slug: 'junin', name: 'Junín', type: 'departamento' },
  { slug: 'la-libertad', name: 'La Libertad', type: 'departamento' },
  { slug: 'lambayeque', name: 'Lambayeque', type: 'departamento' },
  { slug: 'lima-provincias', name: 'Lima Provincias', type: 'departamento' },
  { slug: 'lima-metropolitana', name: 'Lima Metropolitana', type: 'lima_provincia' },
  { slug: 'loreto', name: 'Loreto', type: 'departamento' },
  { slug: 'madre-de-dios', name: 'Madre de Dios', type: 'departamento' },
  { slug: 'moquegua', name: 'Moquegua', type: 'departamento' },
  { slug: 'pasco', name: 'Pasco', type: 'departamento' },
  { slug: 'piura', name: 'Piura', type: 'departamento' },
  { slug: 'puno', name: 'Puno', type: 'departamento' },
  { slug: 'san-martin', name: 'San Martín', type: 'departamento' },
  { slug: 'tacna', name: 'Tacna', type: 'departamento' },
  { slug: 'tumbes', name: 'Tumbes', type: 'departamento' },
  { slug: 'ucayali', name: 'Ucayali', type: 'departamento' },
  { slug: 'extranjero', name: 'Peruanos en el Extranjero', type: 'extranjero' },
] as const
