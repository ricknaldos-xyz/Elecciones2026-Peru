import type { CandidateWithScores, PresetType, Weights } from '@/types/database'

export function getScoreByMode(
  scores: CandidateWithScores['scores'],
  mode: PresetType,
  weights?: Weights
): number {
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
