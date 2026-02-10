'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { CARGOS, DISTRICTS } from '@/lib/constants'
import { MOCK_PARTIES } from '@/lib/mock-data'
import type { CargoType } from '@/types/database'

interface RankingFiltersProps {
  cargo: CargoType
  distrito?: string
  partyId?: string
  minConfidence: number
  onlyClean: boolean
  onCargoChange: (cargo: CargoType) => void
  onDistritoChange: (distrito?: string) => void
  onPartyChange: (partyId?: string) => void
  onMinConfidenceChange: (value: number) => void
  onOnlyCleanChange: (value: boolean) => void
  onReset: () => void
  className?: string
}

const cargoLabels: Record<CargoType, string> = {
  presidente: 'Presidente',
  vicepresidente: 'Vicepresidente',
  senador: 'Senador',
  diputado: 'Diputado',
  parlamento_andino: 'Parlamento Andino',
}

export function RankingFilters({
  cargo,
  distrito,
  partyId,
  minConfidence,
  onlyClean,
  onCargoChange,
  onDistritoChange,
  onPartyChange,
  onMinConfidenceChange,
  onOnlyCleanChange,
  onReset,
  className,
}: RankingFiltersProps) {
  const showDistrito = cargo === 'diputado'

  return (
    <form className={cn('space-y-5', className)} role="search" aria-label="Filtros de ranking">
      {/* Cargo - NEO BRUTAL */}
      <fieldset>
        <legend className="block text-sm font-bold text-[var(--foreground)] mb-2 uppercase tracking-wide">
          ¿A qué cargo postulan?
        </legend>
        <select
          value={cargo}
          onChange={(e) => onCargoChange(e.target.value as CargoType)}
          className={cn(
            'w-full px-3 py-3',
            'bg-[var(--background)]',
            'border-2 border-[var(--border)]',
            'text-sm font-bold text-[var(--foreground)]',
            'focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2',
            'cursor-pointer',
            'min-h-[48px]'
          )}
        >
          {Object.entries(CARGOS).map(([key, value]) => (
            <option key={value} value={value}>
              {cargoLabels[value as CargoType]}
            </option>
          ))}
        </select>
      </fieldset>

      {/* Distrito - NEO BRUTAL */}
      {showDistrito && (
        <fieldset>
          <legend className="block text-sm font-bold text-[var(--foreground)] mb-2 uppercase tracking-wide">
            ¿De qué región?
          </legend>
          <select
            value={distrito || ''}
            onChange={(e) => onDistritoChange(e.target.value || undefined)}
            className={cn(
              'w-full px-3 py-3',
              'bg-[var(--background)]',
              'border-2 border-[var(--border)]',
              'text-sm font-bold text-[var(--foreground)]',
              'focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2',
              'cursor-pointer',
              'min-h-[48px]'
            )}
          >
            <option value="">Todos los distritos</option>
            {DISTRICTS.map((d) => (
              <option key={d.slug} value={d.slug}>
                {d.name}
              </option>
            ))}
          </select>
        </fieldset>
      )}

      {/* Partido - NEO BRUTAL */}
      <fieldset>
        <legend className="block text-sm font-bold text-[var(--foreground)] mb-2 uppercase tracking-wide">
          ¿De qué partido?
        </legend>
        <select
          value={partyId || ''}
          onChange={(e) => onPartyChange(e.target.value || undefined)}
          className={cn(
            'w-full px-3 py-3',
            'bg-[var(--background)]',
            'border-2 border-[var(--border)]',
            'text-sm font-bold text-[var(--foreground)]',
            'focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2',
            'cursor-pointer',
            'min-h-[48px]'
          )}
        >
          <option value="">Todos los partidos</option>
          {MOCK_PARTIES.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </fieldset>

      {/* Min Confidence - NEO BRUTAL */}
      <fieldset>
        <legend className="block text-sm font-bold text-[var(--foreground)] mb-2 uppercase tracking-wide">
          Nivel de información mínimo: <span className="text-[var(--primary)]">{minConfidence}%</span>
        </legend>
        <input
          type="range"
          min={0}
          max={100}
          step={10}
          value={minConfidence}
          onChange={(e) => onMinConfidenceChange(Number(e.target.value))}
          className="w-full h-4 bg-[var(--muted)] border-2 border-[var(--border)] appearance-none cursor-pointer accent-[var(--primary)]"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={minConfidence}
          aria-valuetext={`${minConfidence}% mínimo de información`}
        />
        <div className="flex justify-between text-xs font-bold text-[var(--muted-foreground)] mt-1" aria-hidden="true">
          <span>0%</span>
          <span>100%</span>
        </div>
      </fieldset>

      {/* Only Clean - NEO BRUTAL - Better touch target */}
      <label
        htmlFor="onlyClean"
        className={cn(
          'flex items-center gap-3 p-3',
          'bg-[var(--muted)]',
          'border-2 border-[var(--border)]',
          'cursor-pointer',
          'hover:bg-[var(--background)]',
          'transition-colors',
          'min-h-[48px]'
        )}
      >
        <input
          type="checkbox"
          id="onlyClean"
          checked={onlyClean}
          onChange={(e) => onOnlyCleanChange(e.target.checked)}
          className="w-5 h-5 bg-[var(--background)] border-2 border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)] focus:ring-2 cursor-pointer flex-shrink-0"
        />
        <span className="text-sm font-bold text-[var(--foreground)] uppercase tracking-wide">
          Solo sin antecedentes negativos
        </span>
      </label>

      {/* Active filter chips */}
      {(distrito || partyId || minConfidence > 0 || onlyClean) && (
        <div className="flex flex-wrap gap-2 pt-3 border-t-2 border-[var(--border)]">
          {distrito && (
            <button
              type="button"
              onClick={() => onDistritoChange(undefined)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5',
                'text-xs font-bold',
                'bg-[var(--primary)] text-white',
                'border-2 border-[var(--border)]',
                'hover:opacity-80 transition-opacity'
              )}
            >
              {DISTRICTS.find(d => d.slug === distrito)?.name || distrito}
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          {partyId && (
            <button
              type="button"
              onClick={() => onPartyChange(undefined)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5',
                'text-xs font-bold',
                'bg-[var(--primary)] text-white',
                'border-2 border-[var(--border)]',
                'hover:opacity-80 transition-opacity'
              )}
            >
              {MOCK_PARTIES.find(p => p.id === partyId)?.short_name || 'Partido'}
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          {minConfidence > 0 && (
            <button
              type="button"
              onClick={() => onMinConfidenceChange(0)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5',
                'text-xs font-bold',
                'bg-[var(--primary)] text-white',
                'border-2 border-[var(--border)]',
                'hover:opacity-80 transition-opacity'
              )}
            >
              Info. mín. {minConfidence}%
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          {onlyClean && (
            <button
              type="button"
              onClick={() => onOnlyCleanChange(false)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5',
                'text-xs font-bold',
                'bg-[var(--score-good)] text-white',
                'border-2 border-[var(--border)]',
                'hover:opacity-80 transition-opacity'
              )}
            >
              Sin antecedentes
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* Reset - NEO BRUTAL */}
      <Button variant="outline" size="sm" onClick={onReset} className="w-full min-h-[48px]" type="button">
        Limpiar filtros
      </Button>
    </form>
  )
}
