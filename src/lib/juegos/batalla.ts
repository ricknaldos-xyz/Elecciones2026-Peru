import type { CandidateWithScores } from '@/types/database'
import { getBatallaComment } from './comentarios'

// ============================================
// TYPES
// ============================================

export type BatallaCategory = {
  id: string
  question: string
  getValue: (c: CandidateWithScores) => number
  format: (value: number) => string
  higherWins: boolean // true = higher is "winner", false = lower is "winner"
}

export interface BatallaRound {
  candidateA: CandidateWithScores
  candidateB: CandidateWithScores
  category: BatallaCategory
}

export interface BatallaGuess {
  round: BatallaRound
  chosenSlug: string
  correctSlug: string | null // null = tie
  correct: boolean
  comment: string
  valueA: number
  valueB: number
}

export interface BatallaState {
  streak: number
  bestStreak: number
  totalPlayed: number
  totalCorrect: number
}

// ============================================
// CATEGORIES
// ============================================

export const BATALLA_CATEGORIES: BatallaCategory[] = [
  {
    id: 'competence',
    question: '¿Quién tiene MAYOR puntaje de competencia?',
    getValue: (c) => c.scores?.competence ?? 0,
    format: (v) => `${Math.round(v)}/100`,
    higherWins: true,
  },
  {
    id: 'integrity',
    question: '¿Quién tiene MAYOR puntaje de integridad?',
    getValue: (c) => c.scores?.integrity ?? 0,
    format: (v) => `${Math.round(v)}/100`,
    higherWins: true,
  },
  {
    id: 'transparency',
    question: '¿Quién tiene MAYOR transparencia?',
    getValue: (c) => c.scores?.transparency ?? 0,
    format: (v) => `${Math.round(v)}/100`,
    higherWins: true,
  },
  {
    id: 'score_balanced',
    question: '¿Quién tiene MAYOR puntaje total?',
    getValue: (c) => c.scores?.score_balanced ?? 0,
    format: (v) => `${Math.round(v)}/100`,
    higherWins: true,
  },
  {
    id: 'flags',
    question: '¿Quién tiene MÁS alertas en su perfil?',
    getValue: (c) => c.flags?.length ?? 0,
    format: (v) => `${v} alerta${v !== 1 ? 's' : ''}`,
    higherWins: true,
  },
  {
    id: 'red_flags',
    question: '¿Quién tiene MÁS alertas ROJAS?',
    getValue: (c) => c.flags?.filter(f => f.severity === 'RED').length ?? 0,
    format: (v) => `${v} roja${v !== 1 ? 's' : ''}`,
    higherWins: true,
  },
  {
    id: 'confidence',
    question: '¿De quién tenemos MÁS datos verificados?',
    getValue: (c) => c.scores?.confidence ?? 0,
    format: (v) => `${Math.round(v)}%`,
    higherWins: true,
  },
  {
    id: 'score_gap',
    question: '¿Quién tiene MAYOR diferencia entre competencia e integridad?',
    getValue: (c) => Math.abs((c.scores?.competence ?? 0) - (c.scores?.integrity ?? 0)),
    format: (v) => `${Math.round(v)} puntos`,
    higherWins: true,
  },
]

// ============================================
// GAME LOGIC
// ============================================

/**
 * Get a random pair of candidates that haven't been paired in this session
 */
export function getRandomPair(
  candidates: CandidateWithScores[],
  usedPairKeys: Set<string>
): { a: CandidateWithScores; b: CandidateWithScores } | null {
  if (candidates.length < 2) return null

  // Try up to 50 times to find an unused pair
  for (let attempt = 0; attempt < 50; attempt++) {
    const indexA = Math.floor(Math.random() * candidates.length)
    let indexB = Math.floor(Math.random() * (candidates.length - 1))
    if (indexB >= indexA) indexB++

    const a = candidates[indexA]
    const b = candidates[indexB]
    const key = [a.slug, b.slug].sort().join('|')

    if (!usedPairKeys.has(key)) {
      return { a, b }
    }
  }

  // If all pairs used, reset and return any pair
  const indexA = Math.floor(Math.random() * candidates.length)
  let indexB = Math.floor(Math.random() * (candidates.length - 1))
  if (indexB >= indexA) indexB++
  return { a: candidates[indexA], b: candidates[indexB] }
}

/**
 * Get a random category
 */
export function getRandomCategory(usedIds: Set<string>): BatallaCategory {
  const available = BATALLA_CATEGORIES.filter(c => !usedIds.has(c.id))
  const pool = available.length > 0 ? available : BATALLA_CATEGORIES
  return pool[Math.floor(Math.random() * pool.length)]
}

/**
 * Determine the winner of a round
 */
export function determineWinner(
  round: BatallaRound
): { winnerSlug: string | null; valueA: number; valueB: number; isTie: boolean } {
  const valueA = round.category.getValue(round.candidateA)
  const valueB = round.category.getValue(round.candidateB)

  if (Math.abs(valueA - valueB) < 0.5) {
    return { winnerSlug: null, valueA, valueB, isTie: true }
  }

  const aWins = round.category.higherWins ? valueA > valueB : valueA < valueB
  return {
    winnerSlug: aWins ? round.candidateA.slug : round.candidateB.slug,
    valueA,
    valueB,
    isTie: false,
  }
}

/**
 * Process a guess and return the result
 */
export function processGuess(round: BatallaRound, chosenSlug: string): BatallaGuess {
  const { winnerSlug, valueA, valueB, isTie } = determineWinner(round)

  const correct = isTie || chosenSlug === winnerSlug
  const winnerValue = Math.max(valueA, valueB)
  const loserValue = Math.min(valueA, valueB)

  return {
    round,
    chosenSlug,
    correctSlug: winnerSlug,
    correct,
    comment: getBatallaComment(round.category.id, winnerValue, loserValue, isTie),
    valueA,
    valueB,
  }
}

/**
 * Build share text for batalla
 */
export function buildBatallaShareText(streak: number, bestStreak: number): string {
  const fire = streak >= 10 ? '🔥🔥🔥' : streak >= 5 ? '🔥🔥' : '🔥'
  const taunt = streak >= 10
    ? 'Conozco a los candidatos mejor que sus propios abogados.'
    : streak >= 5
    ? 'Sé más de política peruana que el 90% del Congreso.'
    : 'Al menos yo sí investigo antes de votar. ¿Y tú?'
  return [
    `⚔️ BATALLA PRESIDENCIAL 2026`,
    ``,
    `${streak} aciertos seguidos ${fire}`,
    `Mejor racha: ${bestStreak}`,
    ``,
    taunt,
    ``,
    `votainformado.pe/juegos/batalla`,
  ].join('\n')
}

// ============================================
// LOCALSTORAGE HELPERS
// ============================================

const STORAGE_KEY = 'batalla-stats'

export function loadBatallaStats(): BatallaState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return { streak: 0, bestStreak: 0, totalPlayed: 0, totalCorrect: 0 }
}

export function saveBatallaStats(stats: BatallaState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats))
  } catch { /* ignore */ }
}
