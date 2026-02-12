'use client'

import { memo } from 'react'
import { useRouter } from '@/i18n/routing'
import { cn, displayPartyName } from '@/lib/utils'
import { CandidateImage } from './CandidateImage'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ScorePill } from './ScorePill'
import { SubScoreStat } from './SubScoreBar'
import { FlagChips } from './FlagChip'
import { useSuccessToast } from '@/components/ui/Toast'
import { useTranslations } from 'next-intl'
import { getScoreByMode } from '@/lib/scoring/utils'
import type { CandidateWithScores, PresetType, AnyWeights } from '@/types/database'

interface CandidateCardProps {
  candidate: CandidateWithScores
  rank?: number
  mode: PresetType
  weights?: AnyWeights
  onCompare?: () => void
  onView?: () => void
  onShare?: () => void
  isSelected?: boolean
  variant?: 'default' | 'compact' | 'featured'
  className?: string
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

export const CandidateCard = memo(function CandidateCard({
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
  const showSuccess = useSuccessToast()
  const tShare = useTranslations('share')
  const t = useTranslations('candidateCard')
  const hasPlan = candidate.scores.plan_viability != null
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
        showSuccess(tShare('linkCopied'), candidate.full_name)
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

  // Compact variant - optimized for desktop grid
  if (variant === 'compact') {
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
        <div className="p-4">
          {/* Header row: Rank + Photo + Name + Score */}
          <div className="flex items-center gap-3 mb-3">
            {/* Rank Medal */}
            {rank && (
              <div className={cn(
                'flex-shrink-0 w-10 h-10',
                'border-3 border-[var(--border)]',
                'shadow-[var(--shadow-brutal-sm)]',
                'flex items-center justify-center',
                'font-bold text-lg',
                getRankStyle(rank).bg,
                getRankStyle(rank).text,
              )}>
                {getRankStyle(rank).label}
              </div>
            )}

            {/* Photo */}
            <div className="flex-shrink-0 w-12 h-12 border-3 border-[var(--border)] bg-[var(--muted)] overflow-hidden relative">
              <CandidateImage src={candidate.photo_url} name={candidate.full_name} fill sizes="48px" containerClassName="text-sm" />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-[var(--foreground)] truncate leading-tight">
                {candidate.full_name}
              </h3>
              <div className="flex items-center gap-1.5 mt-1">
                {candidate.party && (
                  <Badge variant="primary" size="sm">
                    {displayPartyName(candidate.party.name) || candidate.party.short_name}
                  </Badge>
                )}
              </div>
            </div>

            {/* Score */}
            <ScorePill score={score} mode={mode} weights={weights} size="md" variant="minimal" />
          </div>

          {/* Sub-scores row */}
          <div className={cn(
            'grid gap-2 py-2 border-t-2 border-[var(--border)]',
            hasPlan ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'
          )}>
            <div className="text-center">
              <div className="text-xs font-bold text-[var(--muted-foreground)] uppercase">Comp.</div>
              <div className="text-sm font-black text-[var(--foreground)]">{candidate.scores.competence.toFixed(0)}</div>
            </div>
            <div className="text-center">
              <div className="text-xs font-bold text-[var(--muted-foreground)] uppercase">Integ.</div>
              <div className="text-sm font-black text-[var(--foreground)]">{candidate.scores.integrity.toFixed(0)}</div>
            </div>
            <div className="text-center">
              <div className="text-xs font-bold text-[var(--muted-foreground)] uppercase">Trans.</div>
              <div className="text-sm font-black text-[var(--foreground)]">{candidate.scores.transparency.toFixed(0)}</div>
            </div>
            {hasPlan && (
              <div className="text-center">
                <div className="text-xs font-bold text-[var(--muted-foreground)] uppercase">Plan</div>
                <div className="text-sm font-black text-[var(--foreground)]">{candidate.scores.plan_viability!.toFixed(0)}</div>
              </div>
            )}
          </div>

          {/* Flags indicator */}
          {candidate.flags.length > 0 && (
            <div className="flex items-center gap-1.5 pt-2 border-t-2 border-[var(--border)]">
              <div
                aria-hidden="true"
                className={cn(
                'w-3 h-3',
                candidate.flags.some(f => f.severity === 'RED')
                  ? 'bg-[var(--flag-red)]'
                  : 'bg-[var(--flag-amber)]'
              )} />
              <span className="text-xs font-bold text-[var(--muted-foreground)]">
                {candidate.flags.length} {candidate.flags.length > 1 ? t('records') : t('record')}
              </span>
            </div>
          )}

          {/* Quick actions */}
          <div className="flex items-center gap-2 mt-3 pt-3 border-t-2 border-[var(--border)]">
            <Button
              variant="outline"
              size="sm"
              aria-pressed={isSelected}
              onClick={(e) => {
                e.stopPropagation()
                handleCompare()
              }}
              className="flex-1"
            >
              {isSelected ? t('remove') : t('compare')}
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
              {t('viewMore')}
            </Button>
          </div>
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
      <div className="p-4 sm:p-5">
        {/* Header: Rank + Photo + Score - Responsive layout */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-0 mb-4">
          <div className="flex items-center gap-3">
            {/* Rank Medal - Smaller on mobile */}
            {rank && (
              <div className={cn(
                'w-10 h-10 sm:w-12 sm:h-12',
                'border-3 border-[var(--border)]',
                'shadow-[var(--shadow-brutal-sm)]',
                'flex items-center justify-center',
                'font-bold text-lg sm:text-xl',
                getRankStyle(rank).bg,
                getRankStyle(rank).text,
              )}>
                {getRankStyle(rank).label}
              </div>
            )}
            {/* Photo - Smaller on mobile */}
            <div className="w-14 h-14 sm:w-16 sm:h-16 border-3 border-[var(--border)] bg-[var(--muted)] overflow-hidden relative">
              <CandidateImage src={candidate.photo_url} name={candidate.full_name} fill sizes="(max-width: 640px) 56px, 64px" containerClassName="text-lg sm:text-xl" />
            </div>
          </div>

          {/* Score - Medium on mobile, Large on desktop */}
          <ScorePill score={score} mode={mode} weights={weights} size="md" variant="card" className="sm:hidden" />
          <ScorePill score={score} mode={mode} weights={weights} size="lg" variant="card" className="hidden sm:flex" />
        </div>

        {/* Name & Party */}
        <div className="mb-3 sm:mb-4">
          <h3 className="text-lg sm:text-xl font-bold text-[var(--foreground)] leading-tight tracking-tight">
            {candidate.full_name}
          </h3>
          <div className="flex items-center gap-1.5 sm:gap-2 mt-2 flex-wrap">
            {candidate.party && (
              <Badge variant="primary" size="sm">
                {displayPartyName(candidate.party.name) || candidate.party.short_name}
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

        {/* Sub-scores grid - Reduced gap on mobile */}
        <div className={cn(
          'grid gap-2 sm:gap-3 py-3 sm:py-4 border-t-3 border-[var(--border)]',
          hasPlan ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'
        )}>
          <SubScoreStat type="competence" value={candidate.scores.competence} size="sm" />
          <SubScoreStat type="integrity" value={candidate.scores.integrity} size="sm" />
          <SubScoreStat type="transparency" value={candidate.scores.transparency} size="sm" />
          {hasPlan && (
            <SubScoreStat type="plan" value={candidate.scores.plan_viability!} size="sm" />
          )}
        </div>

        {/* Flags */}
        {candidate.flags.length > 0 && (
          <div className="pt-2 sm:pt-3 border-t-3 border-[var(--border)]">
            <FlagChips flags={candidate.flags} maxVisible={3} />
          </div>
        )}

        {/* Actions - Better mobile spacing and touch targets */}
        <div className="flex items-center gap-2 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t-3 border-[var(--border)]">
          <Button
            variant="outline"
            size="sm"
            aria-pressed={isSelected}
            onClick={(e) => {
              e.stopPropagation()
              handleCompare()
            }}
            className="flex-1 min-h-[44px]"
          >
            <span className="hidden sm:inline">{isSelected ? t('remove') : t('compare')}</span>
            <span className="sm:hidden">{isSelected ? t('remove') : t('compareShort')}</span>
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              handleView()
            }}
            className="flex-1 min-h-[44px]"
          >
            {t('viewProfile')}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              handleShare()
            }}
            aria-label={tShare('shareLabel')}
            className="min-h-[44px] min-w-[44px]"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="square" strokeLinejoin="miter" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </Button>
        </div>
      </div>
    </Card>
  )
})
