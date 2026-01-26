/**
 * MOCK DATA
 * Datos de ejemplo para desarrollo
 * IDs sincronizados con la base de datos Supabase
 */

import type { CandidateWithScores, CargoType } from '@/types/database'

// Partidos políticos - IDs sincronizados con base de datos
export const MOCK_PARTIES = [
  { id: '11111111-1111-1111-1111-111111111101', name: 'Fuerza Popular', short_name: 'FP', color: '#FF6B00' },
  { id: '11111111-1111-1111-1111-111111111102', name: 'Renovación Popular', short_name: 'RP', color: '#0066CC' },
  { id: '11111111-1111-1111-1111-111111111103', name: 'Alianza para el Progreso', short_name: 'APP', color: '#00AA55' },
  { id: '11111111-1111-1111-1111-111111111104', name: 'Somos Perú', short_name: 'SP', color: '#FFD700' },
  { id: '11111111-1111-1111-1111-111111111105', name: 'Perú Libre', short_name: 'PL', color: '#CC0000' },
  { id: '11111111-1111-1111-1111-111111111106', name: 'Avanza País', short_name: 'AP', color: '#4169E1' },
  { id: '11111111-1111-1111-1111-111111111107', name: 'Partido Morado', short_name: 'PM', color: '#8B008B' },
  { id: '11111111-1111-1111-1111-111111111108', name: 'Acción Popular', short_name: 'AP', color: '#DC143C' },
  { id: '11111111-1111-1111-1111-111111111109', name: 'Fe en el Perú', short_name: 'FEP', color: '#228B22' },
  { id: '11111111-1111-1111-1111-111111111110', name: 'Podemos Perú', short_name: 'PP', color: '#FF69B4' },
  { id: '11111111-1111-1111-1111-111111111111', name: 'Primero la Gente', short_name: 'PLG', color: '#9932CC' },
  { id: '11111111-1111-1111-1111-111111111112', name: 'Juntos por el Perú', short_name: 'JP', color: '#FF4500' },
  { id: '11111111-1111-1111-1111-111111111113', name: 'Victoria Nacional', short_name: 'VN', color: '#006400' },
]

// Distritos electorales - IDs sincronizados con base de datos
export const MOCK_DISTRICTS = [
  { id: '22222222-2222-2222-2222-222222222201', name: 'Amazonas', slug: 'amazonas' },
  { id: '22222222-2222-2222-2222-222222222202', name: 'Áncash', slug: 'ancash' },
  { id: '22222222-2222-2222-2222-222222222203', name: 'Apurímac', slug: 'apurimac' },
  { id: '22222222-2222-2222-2222-222222222204', name: 'Arequipa', slug: 'arequipa' },
  { id: '22222222-2222-2222-2222-222222222205', name: 'Ayacucho', slug: 'ayacucho' },
  { id: '22222222-2222-2222-2222-222222222206', name: 'Cajamarca', slug: 'cajamarca' },
  { id: '22222222-2222-2222-2222-222222222207', name: 'Callao', slug: 'callao' },
  { id: '22222222-2222-2222-2222-222222222208', name: 'Cusco', slug: 'cusco' },
  { id: '22222222-2222-2222-2222-222222222209', name: 'Huancavelica', slug: 'huancavelica' },
  { id: '22222222-2222-2222-2222-222222222210', name: 'Huánuco', slug: 'huanuco' },
  { id: '22222222-2222-2222-2222-222222222211', name: 'Ica', slug: 'ica' },
  { id: '22222222-2222-2222-2222-222222222212', name: 'Junín', slug: 'junin' },
  { id: '22222222-2222-2222-2222-222222222213', name: 'La Libertad', slug: 'la-libertad' },
  { id: '22222222-2222-2222-2222-222222222214', name: 'Lambayeque', slug: 'lambayeque' },
  { id: '22222222-2222-2222-2222-222222222215', name: 'Lima Metropolitana', slug: 'lima-metropolitana' },
  { id: '22222222-2222-2222-2222-222222222216', name: 'Lima Provincias', slug: 'lima-provincias' },
  { id: '22222222-2222-2222-2222-222222222217', name: 'Loreto', slug: 'loreto' },
  { id: '22222222-2222-2222-2222-222222222218', name: 'Madre de Dios', slug: 'madre-de-dios' },
  { id: '22222222-2222-2222-2222-222222222219', name: 'Moquegua', slug: 'moquegua' },
  { id: '22222222-2222-2222-2222-222222222220', name: 'Pasco', slug: 'pasco' },
  { id: '22222222-2222-2222-2222-222222222221', name: 'Piura', slug: 'piura' },
  { id: '22222222-2222-2222-2222-222222222222', name: 'Puno', slug: 'puno' },
  { id: '22222222-2222-2222-2222-222222222223', name: 'San Martín', slug: 'san-martin' },
  { id: '22222222-2222-2222-2222-222222222224', name: 'Tacna', slug: 'tacna' },
  { id: '22222222-2222-2222-2222-222222222225', name: 'Tumbes', slug: 'tumbes' },
  { id: '22222222-2222-2222-2222-222222222226', name: 'Ucayali', slug: 'ucayali' },
  { id: '22222222-2222-2222-2222-222222222227', name: 'Peruanos en el Extranjero', slug: 'extranjero' },
]

// Candidatos presidenciales mock (no usados en producción - datos vienen de la DB)
// Mantenidos para referencia y desarrollo offline
export const MOCK_PRESIDENTIAL_CANDIDATES: CandidateWithScores[] = [
  {
    id: '33333333-3333-3333-3333-333333333301',
    slug: 'keiko-fujimori',
    full_name: 'Keiko Sofía Fujimori Higuchi',
    photo_url: null,
    cargo: 'presidente' as CargoType,
    party: MOCK_PARTIES[0], // Fuerza Popular
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
    data_verified: true,
    data_source: 'mock_data',
  },
  {
    id: '33333333-3333-3333-3333-333333333302',
    slug: 'rafael-lopez-aliaga',
    full_name: 'Rafael Bernardo López Aliaga Cazorla',
    photo_url: null,
    cargo: 'presidente' as CargoType,
    party: MOCK_PARTIES[1], // Renovación Popular
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
    data_verified: true,
    data_source: 'mock_data',
  },
  {
    id: '33333333-3333-3333-3333-333333333303',
    slug: 'cesar-acuna',
    full_name: 'César Acuña Peralta',
    photo_url: null,
    cargo: 'presidente' as CargoType,
    party: MOCK_PARTIES[2], // Alianza para el Progreso
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
    data_verified: true,
    data_source: 'mock_data',
  },
  {
    id: '33333333-3333-3333-3333-333333333304',
    slug: 'george-forsyth',
    full_name: 'George Patrick Forsyth Sommer',
    photo_url: null,
    cargo: 'presidente' as CargoType,
    party: MOCK_PARTIES[3], // Somos Perú
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
    data_verified: true,
    data_source: 'mock_data',
  },
  {
    id: '33333333-3333-3333-3333-333333333305',
    slug: 'vladimir-cerron',
    full_name: 'Vladimir Roy Cerrón Rojas',
    photo_url: null,
    cargo: 'presidente' as CargoType,
    party: MOCK_PARTIES[4], // Perú Libre
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
    data_verified: true,
    data_source: 'mock_data',
  },
  {
    id: '33333333-3333-3333-3333-333333333306',
    slug: 'jose-williams',
    full_name: 'José Williams Zapata',
    photo_url: null,
    cargo: 'presidente' as CargoType,
    party: MOCK_PARTIES[5], // Avanza País
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
    data_verified: true,
    data_source: 'mock_data',
  },
  {
    id: '33333333-3333-3333-3333-333333333307',
    slug: 'mesias-guevara',
    full_name: 'Mesías Antonio Guevara Amasifuen',
    photo_url: null,
    cargo: 'presidente' as CargoType,
    party: MOCK_PARTIES[6], // Partido Morado
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
    data_verified: true,
    data_source: 'mock_data',
  },
  {
    id: '33333333-3333-3333-3333-333333333308',
    slug: 'marisol-perez-tello',
    full_name: 'Marisol Pérez Tello',
    photo_url: null,
    cargo: 'presidente' as CargoType,
    party: MOCK_PARTIES[10], // Primero la Gente
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
    data_verified: true,
    data_source: 'mock_data',
  },
  {
    id: '33333333-3333-3333-3333-333333333309',
    slug: 'alvaro-paz-de-la-barra',
    full_name: 'Álvaro Gonzalo Paz de la Barra Freigeiro',
    photo_url: null,
    cargo: 'presidente' as CargoType,
    party: MOCK_PARTIES[8], // Fe en el Perú
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
    data_verified: true,
    data_source: 'mock_data',
  },
  {
    id: '33333333-3333-3333-3333-333333333310',
    slug: 'jose-luna-galvez',
    full_name: 'José Luna Gálvez',
    photo_url: null,
    cargo: 'presidente' as CargoType,
    party: MOCK_PARTIES[9], // Podemos Perú
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
    data_verified: true,
    data_source: 'mock_data',
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
