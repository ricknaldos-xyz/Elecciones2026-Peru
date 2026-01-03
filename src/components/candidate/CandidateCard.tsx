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

// Get rank medal style
function getRankStyle(rank: number): { bg: string; text: string; label: string } {
  switch (rank) {
    case 1:
      return { bg: 'bg-[var(--rank-gold)]', text: 'text-black', label: '1°' }
    case 2:
      return { bg: 'bg-[var(--rank-silver)]', text: 'text-black', label: '2°' }
    case 3:
      return { bg: 'bg-[var(--rank-bronze)]', text: 'text-white', label: '3°' }
    default:
      return { bg: 'bg-[var(--muted)]', text: 'text-[var(--foreground)]', label: `${rank}°` }
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

  // Compact variant
  if (variant === 'compact') {
    return (
      <Card
        hover
        onClick={handleView}
        className={cn(
          'relative overflow-hidden',
          isSelected && 'ring-4 ring-[var(--primary)]',
          className
        )}
      >
        <div className="p-4 flex items-center gap-4">
          {/* Rank Medal */}
          {rank && (
            <div className={cn(
              'flex-shrink-0 w-10 h-10',
              'border-3 border-[var(--border)]',
              'flex items-center justify-center',
              'font-bold text-lg',
              getRankStyle(rank).bg,
              getRankStyle(rank).text,
            )}>
              {getRankStyle(rank).label}
            </div>
          )}

          {/* Photo */}
          <div className="flex-shrink-0 w-12 h-12 border-3 border-[var(--border)] bg-[var(--muted)] overflow-hidden">
            {candidate.photo_url ? (
              <img src={candidate.photo_url} alt={candidate.full_name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[var(--muted-foreground)] text-sm font-bold">
                {candidate.full_name.split(' ').map(n => n[0]).slice(0, 2).join('')}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-[var(--foreground)] truncate">
              {candidate.full_name}
            </h3>
            <p className="text-sm font-medium text-[var(--muted-foreground)] truncate">
              {candidate.party?.short_name || candidate.cargo}
            </p>
          </div>

          {/* Score */}
          <ScorePill score={score} mode={mode} weights={weights} size="sm" variant="minimal" />
        </div>
      </Card>
    )
  }

  // Default variant
  return (
    <Card
      hover
      onClick={handleView}
      variant={rank === 1 ? 'gold' : rank === 2 ? 'silver' : rank === 3 ? 'bronze' : 'default'}
      className={cn(
        'relative overflow-hidden',
        isSelected && 'ring-4 ring-[var(--primary)]',
        className
      )}
    >
      <div className="p-5">
        {/* Header: Rank + Photo + Score */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {/* Rank Medal */}
            {rank && (
              <div className={cn(
                'w-12 h-12',
                'border-3 border-[var(--border)]',
                'shadow-[var(--shadow-brutal-sm)]',
                'flex items-center justify-center',
                'font-bold text-xl',
                getRankStyle(rank).bg,
                getRankStyle(rank).text,
              )}>
                {getRankStyle(rank).label}
              </div>
            )}
            {/* Photo */}
            <div className="w-16 h-16 border-3 border-[var(--border)] bg-[var(--muted)] overflow-hidden">
              {candidate.photo_url ? (
                <img
                  src={candidate.photo_url}
                  alt={candidate.full_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[var(--muted-foreground)] text-xl font-bold">
                  {candidate.full_name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                </div>
              )}
            </div>
          </div>

          <ScorePill score={score} mode={mode} weights={weights} size="lg" variant="card" />
        </div>

        {/* Name & Party */}
        <div className="mb-4">
          <h3 className="text-xl font-bold text-[var(--foreground)] leading-tight tracking-tight">
            {candidate.full_name}
          </h3>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {candidate.party && (
              <Badge variant="primary" size="sm">
                {candidate.party.short_name || candidate.party.name}
              </Badge>
            )}
            {candidate.district && (
              <Badge variant="secondary" size="sm">
                {candidate.district.name}
              </Badge>
            )}
            <Badge variant="outline" size="sm">
              {candidate.cargo}
            </Badge>
          </div>
        </div>

        {/* Sub-scores grid */}
        <div className="grid grid-cols-3 gap-3 py-4 border-t-3 border-[var(--border)]">
          <SubScoreStat type="competence" value={candidate.scores.competence} size="sm" />
          <SubScoreStat type="integrity" value={candidate.scores.integrity} size="sm" />
          <SubScoreStat type="transparency" value={candidate.scores.transparency} size="sm" />
        </div>

        {/* Flags */}
        {candidate.flags.length > 0 && (
          <div className="pt-3 border-t-3 border-[var(--border)]">
            <FlagChips flags={candidate.flags} maxVisible={3} />
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 mt-4 pt-4 border-t-3 border-[var(--border)]">
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
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="square" strokeLinejoin="miter" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </Button>
        </div>
      </div>
    </Card>
  )
}
