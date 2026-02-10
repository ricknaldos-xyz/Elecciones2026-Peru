import type { CandidateWithScores, PresetType, AnyWeights, Weights } from '@/types/database'
import { isPresidentialWeights } from '@/types/database'

export function getScoreByMode(
  scores: CandidateWithScores['scores'],
  mode: PresetType,
  weights?: AnyWeights,
  isPresidential?: boolean
): number {
  // Presidential 4-pillar scoring
  if (isPresidential && scores.plan_viability != null) {
    if (mode === 'custom' && weights && isPresidentialWeights(weights)) {
      return (
        weights.wC * scores.competence +
        weights.wI * scores.integrity +
        weights.wT * scores.transparency +
        weights.wP * scores.plan_viability
      )
    }
    // Use pre-calculated presidential scores when available
    switch (mode) {
      case 'merit':
        return scores.score_merit_p ?? scores.score_merit
      case 'integrity':
        return scores.score_integrity_p ?? scores.score_integrity
      default:
        return scores.score_balanced_p ?? scores.score_balanced
    }
  }

  // Standard 3-pillar scoring
  if (mode === 'custom' && weights) {
    return (
      weights.wC * scores.competence +
      weights.wI * scores.integrity +
      weights.wT * scores.transparency
    )
  }
  switch (mode) {
    case 'merit':
      return scores.score_merit
    case 'integrity':
      return scores.score_integrity
    default:
      return scores.score_balanced
  }
}

// Re-export Weights type for backward compatibility
export type { Weights }
