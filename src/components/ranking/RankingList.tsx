'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { CandidateCard } from '@/components/candidate/CandidateCard'
import { useListNavigationShortcuts } from '@/hooks/useKeyboardShortcuts'
import type { CandidateWithScores, PresetType, Weights, CargoType } from '@/types/database'

interface RankingListProps {
  candidates: CandidateWithScores[]
  mode: PresetType
  weights?: Weights
  selectedIds: string[]
  onCompare: (id: string) => void
  onView: (slug: string) => void
  onShare: (id: string) => void
  viewMode?: 'list' | 'grid'
  // For empty state
  searchQuery?: string
  activeFilters?: {
    distrito?: string
    partyId?: string
    minConfidence?: number
    onlyClean?: boolean
  }
  onResetFilters?: () => void
  onClearSearch?: () => void
  onCargoChange?: (cargo: CargoType) => void
}

const cargoLabels: Record<CargoType, string> = {
  presidente: 'Presidente',
  vicepresidente: 'Vicepresidente',
  senador: 'Senador',
  diputado: 'Diputado',
  parlamento_andino: 'Parlamento Andino',
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
  searchQuery,
  activeFilters,
  onResetFilters,
  onClearSearch,
  onCargoChange,
}: RankingListProps) {
  // Keyboard navigation state
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const listRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])

  // Reset focus when candidates change
  useEffect(() => {
    setFocusedIndex(-1)
    cardRefs.current = []
  }, [candidates])

  // Scroll focused card into view
  useEffect(() => {
    if (focusedIndex >= 0 && cardRefs.current[focusedIndex]) {
      cardRefs.current[focusedIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
      cardRefs.current[focusedIndex]?.focus()
    }
  }, [focusedIndex])

  // Keyboard navigation handlers
  const handleNext = useCallback(() => {
    setFocusedIndex(prev =>
      prev < candidates.length - 1 ? prev + 1 : prev
    )
  }, [candidates.length])

  const handlePrevious = useCallback(() => {
    setFocusedIndex(prev => (prev > 0 ? prev - 1 : 0))
  }, [])

  const handleSelect = useCallback(() => {
    if (focusedIndex >= 0 && candidates[focusedIndex]) {
      onView(candidates[focusedIndex].slug)
    }
  }, [focusedIndex, candidates, onView])

  // j/k keyboard navigation
  useListNavigationShortcuts(handleNext, handlePrevious, handleSelect)

  if (candidates.length === 0) {
    const hasSearch = searchQuery && searchQuery.trim().length > 0
    const hasFilters = activeFilters && (
      activeFilters.distrito ||
      activeFilters.partyId ||
      (activeFilters.minConfidence && activeFilters.minConfidence > 0) ||
      activeFilters.onlyClean
    )

    return (
      <div className="text-center py-10 sm:py-12 bg-[var(--card)] border-3 border-[var(--border)] shadow-[var(--shadow-brutal)]">
        <div className="text-5xl sm:text-6xl mb-4">🔍</div>
        <h3 className="text-lg font-black text-[var(--foreground)] mb-2 uppercase tracking-tight">
          {hasSearch ? 'Sin resultados para tu búsqueda' : 'No se encontraron candidatos'}
        </h3>

        {/* Show what's filtering */}
        <div className="space-y-3 mt-4 px-4">
          {hasSearch && (
            <p className="text-sm text-[var(--muted-foreground)] font-bold">
              Buscando: &ldquo;<span className="text-[var(--foreground)]">{searchQuery}</span>&rdquo;
            </p>
          )}

          {hasFilters && (
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="text-xs font-bold text-[var(--muted-foreground)] uppercase">Filtros activos:</span>
              {activeFilters.distrito && (
                <span className="px-2 py-1 text-xs font-bold bg-[var(--muted)] border border-[var(--border)]">
                  {activeFilters.distrito}
                </span>
              )}
              {activeFilters.partyId && (
                <span className="px-2 py-1 text-xs font-bold bg-[var(--muted)] border border-[var(--border)]">
                  Partido filtrado
                </span>
              )}
              {activeFilters.minConfidence && activeFilters.minConfidence > 0 && (
                <span className="px-2 py-1 text-xs font-bold bg-[var(--muted)] border border-[var(--border)]">
                  Info. mín. {activeFilters.minConfidence}%
                </span>
              )}
              {activeFilters.onlyClean && (
                <span className="px-2 py-1 text-xs font-bold bg-[var(--muted)] border border-[var(--border)]">
                  Sin antecedentes
                </span>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 mt-4">
            {hasSearch && onClearSearch && (
              <Button variant="outline" size="sm" onClick={onClearSearch}>
                Limpiar búsqueda
              </Button>
            )}
            {hasFilters && onResetFilters && (
              <Button variant="outline" size="sm" onClick={onResetFilters}>
                Limpiar filtros
              </Button>
            )}
          </div>

          {/* Suggestions */}
          {onCargoChange && (
            <div className="mt-6 pt-4 border-t-2 border-[var(--border)]">
              <p className="text-xs font-bold text-[var(--muted-foreground)] uppercase mb-3">
                Prueba con otro cargo:
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {(['presidente', 'senador', 'diputado'] as CargoType[]).map((cargo) => (
                  <button
                    key={cargo}
                    onClick={() => onCargoChange(cargo)}
                    className={cn(
                      'px-3 py-2 text-xs font-bold uppercase',
                      'bg-[var(--background)] border-2 border-[var(--border)]',
                      'hover:bg-[var(--primary)] hover:text-white',
                      'transition-all duration-100'
                    )}
                  >
                    {cargoLabels[cargo]}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Grid view - 2 columns with compact cards
  if (viewMode === 'grid') {
    return (
      <div ref={listRef} className="grid grid-cols-1 lg:grid-cols-2 gap-4" role="list" aria-label="Lista de candidatos (usa j/k para navegar)">
        {candidates.map((candidate, index) => (
          <div
            key={candidate.id}
            ref={(el) => { cardRefs.current[index] = el }}
            tabIndex={focusedIndex === index ? 0 : -1}
            className={cn(
              'outline-none transition-all duration-100',
              focusedIndex === index && 'ring-4 ring-[var(--primary)] ring-offset-2'
            )}
            role="listitem"
            aria-label={`Candidato ${index + 1}: ${candidate.full_name}`}
          >
            <CandidateCard
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
          </div>
        ))}
      </div>
    )
  }

  // List view - default
  return (
    <div ref={listRef} className="space-y-4" role="list" aria-label="Lista de candidatos (usa j/k para navegar)">
      {candidates.map((candidate, index) => (
        <div
          key={candidate.id}
          ref={(el) => { cardRefs.current[index] = el }}
          tabIndex={focusedIndex === index ? 0 : -1}
          className={cn(
            'outline-none transition-all duration-100',
            focusedIndex === index && 'ring-4 ring-[var(--primary)] ring-offset-2'
          )}
          role="listitem"
          aria-label={`Candidato ${index + 1}: ${candidate.full_name}`}
        >
          <CandidateCard
            candidate={candidate}
            rank={index + 1}
            mode={mode}
            weights={weights}
            isSelected={selectedIds.includes(candidate.id)}
            onCompare={() => onCompare(candidate.id)}
            onView={() => onView(candidate.slug)}
            onShare={() => onShare(candidate.id)}
          />
        </div>
      ))}
    </div>
  )
}
