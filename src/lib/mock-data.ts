/**
 * MOCK DATA
 * Datos de ejemplo para desarrollo
 * TODO: Reemplazar con datos reales de Supabase
 */

import type { CandidateWithScores, CargoType } from '@/types/database'

// Partidos políticos
export const MOCK_PARTIES = [
  { id: '1', name: 'Fuerza Popular', short_name: 'FP', color: '#FF6B00' },
  { id: '2', name: 'Renovación Popular', short_name: 'RP', color: '#0066CC' },
  { id: '3', name: 'Alianza para el Progreso', short_name: 'APP', color: '#00AA55' },
  { id: '4', name: 'Somos Perú', short_name: 'SP', color: '#FFD700' },
  { id: '5', name: 'Perú Libre', short_name: 'PL', color: '#CC0000' },
  { id: '6', name: 'Avanza País', short_name: 'AP', color: '#4169E1' },
  { id: '7', name: 'Partido Morado', short_name: 'PM', color: '#8B008B' },
  { id: '8', name: 'Acción Popular', short_name: 'AP', color: '#DC143C' },
  { id: '9', name: 'Fe en el Perú', short_name: 'FEP', color: '#228B22' },
  { id: '10', name: 'Podemos Perú', short_name: 'PP', color: '#FF69B4' },
]

// Distritos
export const MOCK_DISTRICTS = [
  { id: '1', name: 'Lima Metropolitana', slug: 'lima-metropolitana' },
  { id: '2', name: 'Arequipa', slug: 'arequipa' },
  { id: '3', name: 'La Libertad', slug: 'la-libertad' },
  { id: '4', name: 'Piura', slug: 'piura' },
  { id: '5', name: 'Cusco', slug: 'cusco' },
  { id: '6', name: 'Lambayeque', slug: 'lambayeque' },
  { id: '7', name: 'Junín', slug: 'junin' },
  { id: '8', name: 'Callao', slug: 'callao' },
]

// Candidatos presidenciales mock
export const MOCK_PRESIDENTIAL_CANDIDATES: CandidateWithScores[] = [
  {
    id: '1',
    slug: 'keiko-fujimori',
    full_name: 'Keiko Fujimori Higuchi',
    photo_url: null,
    cargo: 'presidente' as CargoType,
    party: MOCK_PARTIES[0],
    district: null,
    scores: {
      competence: 72,
      integrity: 45,
      transparency: 78,
      confidence: 85,
      score_balanced: 58.3,
      score_merit: 62.1,
      score_integrity: 54.5,
    },
    flags: [
      {
        id: 'f1',
        type: 'PENAL_SENTENCE',
        severity: 'RED',
        title: 'Proceso judicial en curso',
        description: 'Caso Cocteles',
        source: 'Poder Judicial',
        evidence_url: null,
        date_captured: '2025-12-01',
      },
    ],
  },
  {
    id: '2',
    slug: 'rafael-lopez-aliaga',
    full_name: 'Rafael López Aliaga Cazorla',
    photo_url: null,
    cargo: 'presidente' as CargoType,
    party: MOCK_PARTIES[1],
    district: null,
    scores: {
      competence: 68,
      integrity: 82,
      transparency: 71,
      confidence: 78,
      score_balanced: 74.6,
      score_merit: 71.8,
      score_integrity: 77.4,
    },
    flags: [],
  },
  {
    id: '3',
    slug: 'cesar-acuna',
    full_name: 'César Acuña Peralta',
    photo_url: null,
    cargo: 'presidente' as CargoType,
    party: MOCK_PARTIES[2],
    district: null,
    scores: {
      competence: 75,
      integrity: 58,
      transparency: 65,
      confidence: 82,
      score_balanced: 66.3,
      score_merit: 69.9,
      score_integrity: 62.7,
    },
    flags: [
      {
        id: 'f2',
        type: 'CIVIL_SENTENCE',
        severity: 'AMBER',
        title: 'Sanción por plagio',
        description: 'Plagio de tesis doctoral',
        source: 'SUNEDU',
        evidence_url: null,
        date_captured: '2025-12-01',
      },
    ],
  },
  {
    id: '4',
    slug: 'george-forsyth',
    full_name: 'George Patrick Forsyth Sommer',
    photo_url: null,
    cargo: 'presidente' as CargoType,
    party: MOCK_PARTIES[3],
    district: null,
    scores: {
      competence: 52,
      integrity: 88,
      transparency: 72,
      confidence: 75,
      score_balanced: 70.2,
      score_merit: 62.4,
      score_integrity: 78.0,
    },
    flags: [],
  },
  {
    id: '5',
    slug: 'vladimir-cerron',
    full_name: 'Vladimir Roy Cerrón Rojas',
    photo_url: null,
    cargo: 'presidente' as CargoType,
    party: MOCK_PARTIES[4],
    district: null,
    scores: {
      competence: 65,
      integrity: 15,
      transparency: 55,
      confidence: 80,
      score_balanced: 41.5,
      score_merit: 49.5,
      score_integrity: 33.5,
    },
    flags: [
      {
        id: 'f3',
        type: 'PENAL_SENTENCE',
        severity: 'RED',
        title: 'Sentencia penal firme',
        description: 'Delito de corrupción - Caso Aeródromo Wanka',
        source: 'Poder Judicial',
        evidence_url: null,
        date_captured: '2025-12-01',
      },
    ],
  },
  {
    id: '6',
    slug: 'jose-williams',
    full_name: 'José Williams Zapata',
    photo_url: null,
    cargo: 'presidente' as CargoType,
    party: MOCK_PARTIES[5],
    district: null,
    scores: {
      competence: 70,
      integrity: 75,
      transparency: 68,
      confidence: 72,
      score_balanced: 72.1,
      score_merit: 71.3,
      score_integrity: 72.9,
    },
    flags: [],
  },
  {
    id: '7',
    slug: 'mesias-guevara',
    full_name: 'Mesías Antonio Guevara Amasifuen',
    photo_url: null,
    cargo: 'presidente' as CargoType,
    party: MOCK_PARTIES[6],
    district: null,
    scores: {
      competence: 78,
      integrity: 92,
      transparency: 85,
      confidence: 88,
      score_balanced: 84.8,
      score_merit: 82.2,
      score_integrity: 87.4,
    },
    flags: [],
  },
  {
    id: '8',
    slug: 'marisol-perez-tello',
    full_name: 'Marisol Pérez Tello',
    photo_url: null,
    cargo: 'presidente' as CargoType,
    party: { id: '11', name: 'Primero la Gente', short_name: 'PLG', color: '#9932CC' },
    district: null,
    scores: {
      competence: 82,
      integrity: 95,
      transparency: 88,
      confidence: 90,
      score_balanced: 88.5,
      score_merit: 85.9,
      score_integrity: 91.1,
    },
    flags: [],
  },
  {
    id: '9',
    slug: 'alvaro-paz-de-la-barra',
    full_name: 'Álvaro Gonzalo Paz de la Barra Freigeiro',
    photo_url: null,
    cargo: 'presidente' as CargoType,
    party: MOCK_PARTIES[8],
    district: null,
    scores: {
      competence: 58,
      integrity: 72,
      transparency: 62,
      confidence: 68,
      score_balanced: 64.7,
      score_merit: 62.6,
      score_integrity: 66.8,
    },
    flags: [
      {
        id: 'f4',
        type: 'MULTIPLE_RESIGNATIONS',
        severity: 'AMBER',
        title: 'Múltiples renuncias a partidos',
        description: 'Ha renunciado a 3 organizaciones políticas',
        source: 'JNE',
        evidence_url: null,
        date_captured: '2025-12-01',
      },
    ],
  },
  {
    id: '10',
    slug: 'jose-luna-galvez',
    full_name: 'José Luna Gálvez',
    photo_url: null,
    cargo: 'presidente' as CargoType,
    party: MOCK_PARTIES[9],
    district: null,
    scores: {
      competence: 62,
      integrity: 48,
      transparency: 55,
      confidence: 70,
      score_balanced: 55.0,
      score_merit: 57.4,
      score_integrity: 52.6,
    },
    flags: [
      {
        id: 'f5',
        type: 'CIVIL_SENTENCE',
        severity: 'AMBER',
        title: 'Investigación fiscal',
        description: 'Caso Telesup',
        source: 'Fiscalía',
        evidence_url: null,
        date_captured: '2025-12-01',
      },
    ],
  },
]

// Función para obtener candidatos por cargo
export function getMockCandidates(cargo?: CargoType): CandidateWithScores[] {
  if (!cargo || cargo === 'presidente') {
    return MOCK_PRESIDENTIAL_CANDIDATES
  }
  // Para otros cargos, generamos candidatos mock basados en presidenciales
  return MOCK_PRESIDENTIAL_CANDIDATES.map((c, i) => ({
    ...c,
    id: `${cargo}-${i}`,
    slug: `${cargo}-${c.slug}`,
    cargo: cargo,
  }))
}

// Función para ordenar candidatos por score
export function sortCandidatesByScore(
  candidates: CandidateWithScores[],
  mode: 'balanced' | 'merit' | 'integrity',
  order: 'asc' | 'desc' = 'desc'
): CandidateWithScores[] {
  const sorted = [...candidates].sort((a, b) => {
    let scoreA: number
    let scoreB: number

    switch (mode) {
      case 'merit':
        scoreA = a.scores.score_merit
        scoreB = b.scores.score_merit
        break
      case 'integrity':
        scoreA = a.scores.score_integrity
        scoreB = b.scores.score_integrity
        break
      default:
        scoreA = a.scores.score_balanced
        scoreB = b.scores.score_balanced
    }

    return order === 'desc' ? scoreB - scoreA : scoreA - scoreB
  })

  return sorted
}

// Función para filtrar candidatos
export function filterCandidates(
  candidates: CandidateWithScores[],
  filters: {
    partyId?: string
    districtSlug?: string
    minConfidence?: number
    onlyClean?: boolean
  }
): CandidateWithScores[] {
  return candidates.filter((c) => {
    if (filters.partyId && c.party?.id !== filters.partyId) return false
    if (filters.districtSlug && c.district?.slug !== filters.districtSlug) return false
    if (filters.minConfidence && c.scores.confidence < filters.minConfidence) return false
    if (filters.onlyClean && c.flags.some((f) => f.severity === 'RED')) return false
    return true
  })
}
