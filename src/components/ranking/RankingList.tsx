'use client'

import { cn } from '@/lib/utils'
import { CandidateCard } from '@/components/candidate/CandidateCard'
import type { CandidateWithScores, PresetType, Weights } from '@/types/database'

interface RankingListProps {
  candidates: CandidateWithScores[]
  mode: PresetType
  weights?: Weights
  selectedIds: string[]
  onCompare: (id: string) => void
  onView: (slug: string) => void
  onShare: (id: string) => void
  viewMode?: 'list' | 'grid'
}

export function RankingList({
  candidates,
  mode,
  weights,
  selectedIds,
  onCompare,
  onView,
  onShare,
  viewMode = 'list',
}: RankingListProps) {
  if (candidates.length === 0) {
    return (
      <div className="text-center py-12 bg-[var(--card)] border-3 border-[var(--border)] shadow-[var(--shadow-brutal)]">
        <div className="text-6xl mb-4">?</div>
        <h3 className="text-lg font-black text-[var(--foreground)] mb-2 uppercase tracking-tight">
          No se encontraron candidatos
        </h3>
        <p className="text-[var(--muted-foreground)] font-bold">
          Intenta ajustar los filtros para ver más resultados
        </p>
      </div>
    )
  }

  // Grid view - 2 columns with compact cards
  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {candidates.map((candidate, index) => (
          <CandidateCard
            key={candidate.id}
            candidate={candidate}
            rank={index + 1}
            mode={mode}
            weights={weights}
            isSelected={selectedIds.includes(candidate.id)}
            onCompare={() => onCompare(candidate.id)}
            onView={() => onView(candidate.slug)}
            onShare={() => onShare(candidate.id)}
            variant="compact"
          />
        ))}
      </div>
    )
  }

  // List view - default
  return (
    <div className="space-y-4">
      {candidates.map((candidate, index) => (
        <CandidateCard
          key={candidate.id}
          candidate={candidate}
          rank={index + 1}
          mode={mode}
          weights={weights}
          isSelected={selectedIds.includes(candidate.id)}
          onCompare={() => onCompare(candidate.id)}
          onView={() => onView(candidate.slug)}
          onShare={() => onShare(candidate.id)}
        />
      ))}
    </div>
  )
}
