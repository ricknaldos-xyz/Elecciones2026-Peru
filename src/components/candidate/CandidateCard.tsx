'use client'

import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ScorePill } from './ScorePill'
import { SubScoreStat } from './SubScoreBar'
import { FlagChips } from './FlagChip'
import type { CandidateWithScores, PresetType, Weights } from '@/types/database'

interface CandidateCardProps {
  candidate: CandidateWithScores
  rank?: number
  mode: PresetType
  weights?: Weights
  onCompare?: () => void
  onView?: () => void
  onShare?: () => void
  isSelected?: boolean
  variant?: 'default' | 'compact' | 'featured'
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
  variant = 'default',
  className,
}: CandidateCardProps) {
  const router = useRouter()
  const score = getScoreByMode(candidate.scores, mode, weights)

  const handleView = () => {
    if (onView) {
      onView()
    } else {
      router.push(`/candidato/${candidate.slug}`)
    }
  }

  const handleShare = () => {
    if (onShare) {
      onShare()
    } else {
      const url = `${window.location.origin}/candidato/${candidate.slug}`
      if (navigator.share) {
        navigator.share({
          title: `${candidate.full_name} - Ranking Electoral 2026`,
          text: `Score: ${score.toFixed(1)}/100`,
          url,
        })
      } else {
        navigator.clipboard.writeText(url)
      }
    }
  }

  const handleCompare = () => {
    if (onCompare) {
      onCompare()
    } else {
      router.push(`/comparar?ids=${candidate.id}`)
    }
  }

  if (variant === 'compact') {
    return (
      <Card
        hover
        onClick={handleView}
        className={cn(
          'relative overflow-hidden',
          isSelected && 'ring-2 ring-red-500',
          className
        )}
      >
        <div className="p-4 flex items-center gap-4">
          {/* Rank */}
          {rank && (
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
              <span className="text-sm font-bold text-zinc-600 dark:text-zinc-400">
                #{rank}
              </span>
            </div>
          )}

          {/* Photo */}
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
            {candidate.photo_url ? (
              <img src={candidate.photo_url} alt={candidate.full_name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-400 text-xs font-bold">
                {candidate.full_name.split(' ').map(n => n[0]).slice(0, 2).join('')}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-zinc-900 dark:text-white truncate text-sm">
              {candidate.full_name}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
              {candidate.party?.short_name || candidate.cargo}
            </p>
          </div>

          {/* Score */}
          <ScorePill score={score} mode={mode} weights={weights} size="sm" variant="minimal" />
        </div>
      </Card>
    )
  }

  return (
    <Card
      hover
      onClick={handleView}
      className={cn(
        'relative overflow-hidden',
        isSelected && 'ring-2 ring-red-500',
        className
      )}
    >
      <div className="p-5">
        {/* Header: Rank + Score */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {rank && (
              <div className="w-10 h-10 rounded-xl bg-zinc-900 dark:bg-white flex items-center justify-center">
                <span className="text-lg font-bold text-white dark:text-zinc-900">
                  #{rank}
                </span>
              </div>
            )}
            {/* Photo */}
            <div className="w-14 h-14 rounded-xl bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
              {candidate.photo_url ? (
                <img
                  src={candidate.photo_url}
                  alt={candidate.full_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-400 dark:text-zinc-500 text-lg font-bold">
                  {candidate.full_name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                </div>
              )}
            </div>
          </div>

          <ScorePill score={score} mode={mode} weights={weights} size="md" variant="card" />
        </div>

        {/* Name & Party */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white leading-tight">
            {candidate.full_name}
          </h3>
          <div className="flex items-center gap-2 mt-1.5">
            {candidate.party && (
              <Badge variant="secondary" size="sm">
                {candidate.party.short_name || candidate.party.name}
              </Badge>
            )}
            {candidate.district && (
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {candidate.district.name}
              </span>
            )}
            <Badge variant="outline" size="sm">
              {candidate.cargo}
            </Badge>
          </div>
        </div>

        {/* Sub-scores grid */}
        <div className="grid grid-cols-3 gap-4 py-4 border-t border-zinc-100 dark:border-zinc-800">
          <SubScoreStat type="competence" value={candidate.scores.competence} size="sm" />
          <SubScoreStat type="integrity" value={candidate.scores.integrity} size="sm" />
          <SubScoreStat type="transparency" value={candidate.scores.transparency} size="sm" />
        </div>

        {/* Flags */}
        {candidate.flags.length > 0 && (
          <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <FlagChips flags={candidate.flags} maxVisible={3} />
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              handleCompare()
            }}
            className="flex-1"
          >
            {isSelected ? 'Quitar' : 'Comparar'}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              handleView()
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
              handleShare()
            }}
            aria-label="Compartir"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </Button>
        </div>
      </div>
    </Card>
  )
}
