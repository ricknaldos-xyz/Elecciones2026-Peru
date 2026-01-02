'use client'

import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ScorePill } from './ScorePill'
import { SubScoreBarMini } from './SubScoreBar'
import { FlagChips } from './FlagChip'
import { ConfidenceBadge } from './ConfidenceBadge'
import type { CandidateWithScores, PresetType, Weights } from '@/types/database'
import { PRESETS } from '@/lib/constants'

interface CandidateCardProps {
  candidate: CandidateWithScores
  rank?: number
  mode: PresetType
  weights?: Weights
  onCompare?: () => void
  onView?: () => void
  onShare?: () => void
  isSelected?: boolean
  className?: string
}

function getScoreByMode(
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

export function CandidateCard({
  candidate,
  rank,
  mode,
  weights,
  onCompare,
  onView,
  onShare,
  isSelected = false,
  className,
}: CandidateCardProps) {
  const score = getScoreByMode(candidate.scores, mode, weights)

  return (
    <Card
      hover
      onClick={onView}
      className={cn(
        'relative',
        isSelected && 'ring-2 ring-blue-500',
        className
      )}
    >
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Photo & Rank */}
          <div className="relative flex-shrink-0">
            {rank && (
              <div className="absolute -top-2 -left-2 w-6 h-6 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-full flex items-center justify-center text-xs font-bold z-10">
                {rank}
              </div>
            )}
            <div className="w-16 h-16 rounded-lg bg-gray-200 dark:bg-gray-700 overflow-hidden">
              {candidate.photo_url ? (
                <img
                  src={candidate.photo_url}
                  alt={candidate.full_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            {/* Name & Party */}
            <div className="flex items-start justify-between gap-2 mb-1">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {candidate.full_name}
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  {candidate.party && (
                    <Badge variant="default" size="sm">
                      {candidate.party.short_name || candidate.party.name}
                    </Badge>
                  )}
                  {candidate.district && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {candidate.district.name}
                    </span>
                  )}
                </div>
              </div>
              <ScorePill score={score} mode={mode} weights={weights} size="sm" />
            </div>

            {/* Sub-scores */}
            <div className="space-y-1 my-2">
              <SubScoreBarMini type="competence" value={candidate.scores.competence} />
              <SubScoreBarMini type="integrity" value={candidate.scores.integrity} />
              <SubScoreBarMini type="transparency" value={candidate.scores.transparency} />
            </div>

            {/* Confidence & Flags */}
            <div className="flex items-center justify-between gap-2 mt-2">
              <ConfidenceBadge value={candidate.scores.confidence} />
              <FlagChips
                flags={candidate.flags}
                maxVisible={2}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onCompare?.()
            }}
            className="flex-1"
          >
            {isSelected ? 'Quitar' : 'Comparar'}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onView?.()
            }}
            className="flex-1"
          >
            Ver perfil
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onShare?.()
            }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
