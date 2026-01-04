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
  const showDistrito = cargo === 'diputado' || cargo === 'senador'

  return (
    <div className={cn('space-y-4', className)}>
      {/* Cargo - NEO BRUTAL */}
      <div>
        <label className="block text-sm font-bold text-[var(--foreground)] mb-2 uppercase tracking-wide">
          Cargo
        </label>
        <select
          value={cargo}
          onChange={(e) => onCargoChange(e.target.value as CargoType)}
          className={cn(
            'w-full px-3 py-2.5',
            'bg-[var(--background)]',
            'border-2 border-[var(--border)]',
            'text-sm font-bold text-[var(--foreground)]',
            'focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2',
            'cursor-pointer'
          )}
        >
          {Object.entries(CARGOS).map(([key, value]) => (
            <option key={value} value={value}>
              {cargoLabels[value as CargoType]}
            </option>
          ))}
        </select>
      </div>

      {/* Distrito - NEO BRUTAL */}
      {showDistrito && (
        <div>
          <label className="block text-sm font-bold text-[var(--foreground)] mb-2 uppercase tracking-wide">
            Distrito Electoral
          </label>
          <select
            value={distrito || ''}
            onChange={(e) => onDistritoChange(e.target.value || undefined)}
            className={cn(
              'w-full px-3 py-2.5',
              'bg-[var(--background)]',
              'border-2 border-[var(--border)]',
              'text-sm font-bold text-[var(--foreground)]',
              'focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2',
              'cursor-pointer'
            )}
          >
            <option value="">Todos los distritos</option>
            {DISTRICTS.map((d) => (
              <option key={d.slug} value={d.slug}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Partido - NEO BRUTAL */}
      <div>
        <label className="block text-sm font-bold text-[var(--foreground)] mb-2 uppercase tracking-wide">
          Partido Político
        </label>
        <select
          value={partyId || ''}
          onChange={(e) => onPartyChange(e.target.value || undefined)}
          className={cn(
            'w-full px-3 py-2.5',
            'bg-[var(--background)]',
            'border-2 border-[var(--border)]',
            'text-sm font-bold text-[var(--foreground)]',
            'focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2',
            'cursor-pointer'
          )}
        >
          <option value="">Todos los partidos</option>
          {MOCK_PARTIES.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* Min Confidence - NEO BRUTAL */}
      <div>
        <label className="block text-sm font-bold text-[var(--foreground)] mb-2 uppercase tracking-wide">
          Confianza mínima: <span className="text-[var(--primary)]">{minConfidence}%</span>
        </label>
        <input
          type="range"
          min={0}
          max={100}
          step={10}
          value={minConfidence}
          onChange={(e) => onMinConfidenceChange(Number(e.target.value))}
          className="w-full h-3 bg-[var(--muted)] border-2 border-[var(--border)] appearance-none cursor-pointer accent-[var(--primary)]"
        />
        <div className="flex justify-between text-xs font-bold text-[var(--muted-foreground)] mt-1">
          <span>0%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Only Clean - NEO BRUTAL */}
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="onlyClean"
          checked={onlyClean}
          onChange={(e) => onOnlyCleanChange(e.target.checked)}
          className="w-5 h-5 bg-[var(--background)] border-2 border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)] focus:ring-2 cursor-pointer"
        />
        <label
          htmlFor="onlyClean"
          className="text-sm font-bold text-[var(--foreground)] uppercase tracking-wide cursor-pointer"
        >
          Solo sin antecedentes negativos
        </label>
      </div>

      {/* Reset - NEO BRUTAL */}
      <Button variant="outline" size="sm" onClick={onReset} className="w-full">
        Limpiar filtros
      </Button>
    </div>
  )
}
