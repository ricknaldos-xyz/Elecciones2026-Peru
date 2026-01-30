import type { CandidateWithScores } from '@/types/database'
import { getFrankensteinVerdict } from './comentarios'

// ============================================
// TYPES
// ============================================

export interface FrankensteinCategory {
  id: string
  label: string
  getValue: (c: CandidateWithScores) => number
  format: (c: CandidateWithScores) => string
  detail: (c: CandidateWithScores) => string
}

export interface FrankensteinSelection {
  categoryId: string
  candidate: CandidateWithScores
}

export interface FrankensteinResult {
  selections: FrankensteinSelection[]
  combinedScore: number
  rank: number
  totalCandidates: number
  name: string
  verdict: string
}

export interface FrankensteinState {
  totalPlayed: number
}

// ============================================
// CATEGORIES
// ============================================

export const FRANKENSTEIN_CATEGORIES: FrankensteinCategory[] = [
  {
    id: 'education',
    label: 'Educación',
    getValue: (c) => c.scores?.competence ?? 0,
    format: (c) => `${Math.round(c.scores?.competence ?? 0)}/100`,
    detail: (c) => `Competencia: ${Math.round(c.scores?.competence ?? 0)}/100`,
  },
  {
    id: 'integrity',
    label: 'Integridad',
    getValue: (c) => c.scores?.integrity ?? 0,
    format: (c) => `${Math.round(c.scores?.integrity ?? 0)}/100`,
    detail: (c) => {
      const flags = c.flags?.filter(f => f.severity === 'RED').length ?? 0
      return flags > 0
        ? `Integridad: ${Math.round(c.scores?.integrity ?? 0)}/100 (${flags} alerta${flags > 1 ? 's' : ''} roja${flags > 1 ? 's' : ''})`
        : `Integridad: ${Math.round(c.scores?.integrity ?? 0)}/100`
    },
  },
  {
    id: 'transparency',
    label: 'Transparencia',
    getValue: (c) => c.scores?.transparency ?? 0,
    format: (c) => `${Math.round(c.scores?.transparency ?? 0)}/100`,
    detail: (c) => `Transparencia: ${Math.round(c.scores?.transparency ?? 0)}/100`,
  },
  {
    id: 'confidence',
    label: 'Datos Verificados',
    getValue: (c) => c.scores?.confidence ?? 0,
    format: (c) => `${Math.round(c.scores?.confidence ?? 0)}%`,
    detail: (c) => `Datos verificados: ${Math.round(c.scores?.confidence ?? 0)}%`,
  },
  {
    id: 'overall',
    label: 'Puntaje General',
    getValue: (c) => c.scores?.score_balanced ?? 0,
    format: (c) => `${Math.round(c.scores?.score_balanced ?? 0)}/100`,
    detail: (c) => `Score balanceado: ${Math.round(c.scores?.score_balanced ?? 0)}/100`,
  },
]

// ============================================
// GAME LOGIC
// ============================================

/**
 * Get a random subset of candidates for a category selection
 */
export function getCandidateOptions(
  candidates: CandidateWithScores[],
  count = 5
): CandidateWithScores[] {
  const shuffled = [...candidates].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

/**
 * Build the Frankenstein result from selections
 */
export function buildFrankenstein(
  selections: FrankensteinSelection[],
  allCandidates: CandidateWithScores[]
): FrankensteinResult {
  // Combined score: average of each selected category's value
  const scores = selections.map(s => {
    const cat = FRANKENSTEIN_CATEGORIES.find(c => c.id === s.categoryId)
    return cat ? cat.getValue(s.candidate) : 0
  })
  const combinedScore = scores.length > 0
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : 0

  // Compare to real candidates (using score_balanced)
  const realScores = allCandidates
    .map(c => c.scores?.score_balanced ?? 0)
    .sort((a, b) => b - a)

  let rank = 1
  for (const rs of realScores) {
    if (combinedScore < rs) rank++
    else break
  }

  const beatsCount = allCandidates.length - rank
  const totalCandidates = allCandidates.length

  // Generate funny combined name
  const name = generateName(selections)

  const verdict = getFrankensteinVerdict(combinedScore, beatsCount, totalCandidates)

  return {
    selections,
    combinedScore,
    rank,
    totalCandidates,
    name,
    verdict,
  }
}

/**
 * Generate a combined name from selected candidates
 */
function generateName(selections: FrankensteinSelection[]): string {
  if (selections.length === 0) return 'Nadie'

  const names = selections.map(s => s.candidate.full_name)
  const parts: string[] = []

  for (let i = 0; i < names.length && i < 3; i++) {
    const nameParts = names[i].split(' ')
    if (i === 0 && nameParts.length > 0) {
      // First name of first selection
      parts.push(nameParts[0])
    } else if (nameParts.length > 1) {
      // Last name of others
      parts.push(nameParts[nameParts.length - 1])
    } else {
      parts.push(nameParts[0])
    }
  }

  return parts.join(' ')
}

// ============================================
// SHARE TEXT
// ============================================

export function buildFrankensteinShareText(
  result: FrankensteinResult
): string {
  const lines = [
    'MI PRESIDENTE FRANKENSTEIN 🧟',
    '',
    ...result.selections.map(s => {
      const cat = FRANKENSTEIN_CATEGORIES.find(c => c.id === s.categoryId)
      return `${cat?.label || s.categoryId}: de ${'█'.repeat(8)}`
    }),
    '',
    `Score: ${result.combinedScore}/100`,
    `Mejor que ${result.totalCandidates - result.rank} de ${result.totalCandidates} reales`,
    '',
    '¡Arma el tuyo!',
    'rankinelectoral.pe/juegos/frankenstein',
  ]
  return lines.join('\n')
}

// ============================================
// LOCALSTORAGE HELPERS
// ============================================

const STORAGE_KEY = 'frankenstein-stats'

export function loadFrankensteinStats(): FrankensteinState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return { totalPlayed: 0 }
}

export function saveFrankensteinStats(stats: FrankensteinState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats))
  } catch { /* ignore */ }
}
