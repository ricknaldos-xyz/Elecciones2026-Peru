import { getSwipeRevealComment } from './comentarios'

// ============================================
// TYPES
// ============================================

export interface SwipeProposal {
  id: string
  candidateId: string
  candidateName: string
  candidateSlug: string
  candidatePhoto: string | null
  category: string
  title: string
  description: string
}

export interface SwipeResult {
  candidateId: string
  candidateName: string
  candidateSlug: string
  candidatePhoto: string | null
  matchPercent: number
  agreed: number
  total: number
  integrity: number
}

export interface SwipeState {
  totalPlayed: number
  lastMatches: SwipeResult[]
}

// ============================================
// CATEGORY LABELS
// ============================================

export const CATEGORY_LABELS: Record<string, string> = {
  economia: 'Economía',
  salud: 'Salud',
  educacion: 'Educación',
  seguridad: 'Seguridad',
  corrupcion: 'Anticorrupción',
  mineria_ambiente: 'Medio Ambiente',
  infraestructura: 'Infraestructura',
  social: 'Social',
  reforma_politica: 'Reforma Política',
  otros: 'Otros',
}

// ============================================
// PROPOSAL SELECTION
// ============================================

/**
 * Select a diverse set of proposals from the fetched data.
 * Max 2 per candidate, spread across categories.
 */
export function selectProposals(
  allProposals: SwipeProposal[],
  count = 10
): SwipeProposal[] {
  if (allProposals.length <= count) return shuffleArray(allProposals)

  const selected: SwipeProposal[] = []
  const candidateCount: Record<string, number> = {}
  const usedCategories = new Set<string>()

  // Shuffle to randomize
  const shuffled = shuffleArray(allProposals)

  // Pass 1: one per category, one per candidate
  for (const p of shuffled) {
    if (selected.length >= count) break
    if ((candidateCount[p.candidateId] || 0) >= 2) continue
    if (usedCategories.has(p.category) && selected.length < 8) continue

    selected.push(p)
    candidateCount[p.candidateId] = (candidateCount[p.candidateId] || 0) + 1
    usedCategories.add(p.category)
  }

  // Pass 2: fill remaining if needed
  if (selected.length < count) {
    const selectedIds = new Set(selected.map(s => s.id))
    for (const p of shuffled) {
      if (selected.length >= count) break
      if (selectedIds.has(p.id)) continue
      if ((candidateCount[p.candidateId] || 0) >= 2) continue

      selected.push(p)
      candidateCount[p.candidateId] = (candidateCount[p.candidateId] || 0) + 1
    }
  }

  return shuffleArray(selected)
}

// ============================================
// MATCH CALCULATION
// ============================================

/**
 * Calculate match percentages per candidate based on user swipes.
 */
export function calculateMatches(
  swipes: Record<string, 'agree' | 'disagree'>,
  proposals: SwipeProposal[],
  candidateIntegrity: Record<string, number>
): SwipeResult[] {
  // Group proposals by candidate
  const byCand: Record<string, { agreed: number; total: number; name: string; slug: string; photo: string | null }> = {}

  for (const p of proposals) {
    const vote = swipes[p.id]
    if (!vote) continue

    if (!byCand[p.candidateId]) {
      byCand[p.candidateId] = { agreed: 0, total: 0, name: p.candidateName, slug: p.candidateSlug, photo: p.candidatePhoto }
    }
    byCand[p.candidateId].total++
    if (vote === 'agree') byCand[p.candidateId].agreed++
  }

  const results: SwipeResult[] = Object.entries(byCand)
    .map(([candidateId, data]) => ({
      candidateId,
      candidateName: data.name,
      candidateSlug: data.slug,
      candidatePhoto: data.photo,
      matchPercent: data.total > 0 ? Math.round((data.agreed / data.total) * 100) : 0,
      agreed: data.agreed,
      total: data.total,
      integrity: candidateIntegrity[candidateId] ?? 50,
    }))
    .sort((a, b) => b.matchPercent - a.matchPercent)

  return results
}

/**
 * Get satirical reveal comment
 */
export function getRevealComment(matches: SwipeResult[]): string {
  if (matches.length === 0) return 'Sin propuestas, sin matches.'
  const top = matches[0]
  return getSwipeRevealComment(top.candidateName, top.matchPercent, top.integrity)
}

// ============================================
// SHARE TEXT
// ============================================

export function buildSwipeShareText(matches: SwipeResult[]): string {
  const top3 = matches.slice(0, 3)
  const lines = [
    'SWIPE ELECTORAL 💘',
    'Mis matches:',
    ...top3.map((m, i) => `${i + 1}. ${'█'.repeat(8)} ${m.matchPercent}%${i === 0 ? ' 😱' : ''}`),
    '',
    '¿Con quién matcheas tú?',
    'rankinelectoral.pe/juegos/swipe',
  ]
  return lines.join('\n')
}

// ============================================
// LOCALSTORAGE HELPERS
// ============================================

const STORAGE_KEY = 'swipe-stats'

export function loadSwipeStats(): SwipeState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return { totalPlayed: 0, lastMatches: [] }
}

export function saveSwipeStats(stats: SwipeState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats))
  } catch { /* ignore */ }
}

// ============================================
// UTILS
// ============================================

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}
