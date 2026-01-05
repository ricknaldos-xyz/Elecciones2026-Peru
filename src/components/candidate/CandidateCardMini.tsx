'use client'

import Link from 'next/link'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface TopCandidate {
  id: string
  full_name: string
  slug: string
  photo_url: string | null
  score_balanced: number
  party_name: string | null
  party_short_name: string | null
  party_color: string | null
}

interface CandidateCardMiniProps {
  rank: number
  candidate: TopCandidate
  className?: string
}

function getRankStyle(rank: number): { bg: string; text: string; border: string } {
  switch (rank) {
    case 1:
      return { bg: 'bg-[var(--rank-gold)]', text: 'text-black', border: 'border-[var(--rank-gold)]' }
    case 2:
      return { bg: 'bg-[var(--rank-silver)]', text: 'text-black', border: 'border-[var(--rank-silver)]' }
    case 3:
      return { bg: 'bg-[var(--rank-bronze)]', text: 'text-white', border: 'border-[var(--rank-bronze)]' }
    default:
      return { bg: 'bg-[var(--muted)]', text: 'text-[var(--foreground)]', border: 'border-[var(--border)]' }
  }
}

function getScoreColor(score: number): string {
  if (score >= 70) return 'bg-[var(--score-excellent)] text-white'
  if (score >= 50) return 'bg-[var(--score-good)] text-white'
  if (score >= 30) return 'bg-[var(--score-medium)] text-black'
  return 'bg-[var(--score-low)] text-white'
}

export function CandidateCardMini({ rank, candidate, className }: CandidateCardMiniProps) {
  const rankStyle = getRankStyle(rank)
  const scoreColor = getScoreColor(candidate.score_balanced)

  return (
    <Link
      href={`/candidato/${candidate.slug}`}
      className={cn(
        'group flex flex-col',
        'bg-[var(--card)]',
        'border-3 border-[var(--border)]',
        'hover:-translate-x-1 hover:-translate-y-1',
        'hover:shadow-[var(--shadow-brutal)]',
        'transition-all duration-100',
        'overflow-hidden',
        'min-w-[140px] sm:min-w-0',
        className
      )}
    >
      {/* Rank Badge - Top corner */}
      <div className="relative">
        <div className={cn(
          'absolute top-2 left-2 z-10',
          'w-8 h-8',
          'border-2 border-[var(--border)]',
          'flex items-center justify-center',
          'font-black text-sm',
          'shadow-[2px_2px_0_0_var(--border)]',
          rankStyle.bg,
          rankStyle.text
        )}>
          {rank}°
        </div>

        {/* Photo */}
        <div className="aspect-square bg-[var(--muted)] relative overflow-hidden">
          {candidate.photo_url ? (
            <Image
              src={candidate.photo_url}
              alt={candidate.full_name}
              fill
              sizes="(max-width: 640px) 140px, (max-width: 1024px) 180px, 200px"
              className="object-cover group-hover:scale-105 transition-transform duration-200"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[var(--muted-foreground)] text-2xl font-black">
              {candidate.full_name.split(' ').map(n => n[0]).slice(0, 2).join('')}
            </div>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-3 flex-1 flex flex-col">
        {/* Name */}
        <h3 className="text-xs sm:text-sm font-black text-[var(--foreground)] uppercase leading-tight line-clamp-2 mb-1 group-hover:text-[var(--primary)] transition-colors">
          {candidate.full_name}
        </h3>

        {/* Party */}
        {candidate.party_name && (
          <div className="flex items-center gap-1.5 mb-2">
            <div
              className="w-3 h-3 border border-[var(--border)] flex-shrink-0"
              style={{ backgroundColor: candidate.party_color || '#6B7280' }}
            />
            <span className="text-xs font-bold text-[var(--muted-foreground)] truncate uppercase">
              {candidate.party_short_name || candidate.party_name}
            </span>
          </div>
        )}

        {/* Score - At bottom */}
        <div className="mt-auto">
          <div className={cn(
            'inline-flex items-center gap-1 px-2 py-1',
            'border-2 border-[var(--border)]',
            'font-black text-sm',
            scoreColor
          )}>
            <span>{candidate.score_balanced.toFixed(0)}</span>
            <span className="text-xs font-bold opacity-70">/100</span>
          </div>
        </div>
      </div>
    </Link>
  )
}

// Skeleton for loading state
export function CandidateCardMiniSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn(
      'flex flex-col',
      'bg-[var(--card)]',
      'border-3 border-[var(--border)]',
      'overflow-hidden',
      'min-w-[140px] sm:min-w-0',
      'animate-pulse',
      className
    )}>
      <div className="aspect-square bg-[var(--muted)]" />
      <div className="p-3">
        <div className="h-4 bg-[var(--muted)] border border-[var(--border)] mb-2 w-full" />
        <div className="h-3 bg-[var(--muted)] border border-[var(--border)] mb-2 w-2/3" />
        <div className="h-6 bg-[var(--muted)] border border-[var(--border)] w-16" />
      </div>
    </div>
  )
}
