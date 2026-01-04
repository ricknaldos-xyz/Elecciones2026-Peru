'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { CandidateCard } from '@/components/candidate/CandidateCard'
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
