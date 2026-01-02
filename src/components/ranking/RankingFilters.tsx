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
      {/* Cargo */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Cargo
        </label>
        <select
          value={cargo}
          onChange={(e) => onCargoChange(e.target.value as CargoType)}
          className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {Object.entries(CARGOS).map(([key, value]) => (
            <option key={value} value={value}>
              {cargoLabels[value as CargoType]}
            </option>
          ))}
        </select>
      </div>

      {/* Distrito */}
      {showDistrito && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Distrito Electoral
          </label>
          <select
            value={distrito || ''}
            onChange={(e) => onDistritoChange(e.target.value || undefined)}
            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

      {/* Partido */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Partido Político
        </label>
        <select
          value={partyId || ''}
          onChange={(e) => onPartyChange(e.target.value || undefined)}
          className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Todos los partidos</option>
          {MOCK_PARTIES.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* Min Confidence */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Confianza mínima de datos: {minConfidence}%
        </label>
        <input
          type="range"
          min={0}
          max={100}
          step={10}
          value={minConfidence}
          onChange={(e) => onMinConfidenceChange(Number(e.target.value))}
          className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>0%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Only Clean */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="onlyClean"
          checked={onlyClean}
          onChange={(e) => onOnlyCleanChange(e.target.checked)}
          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
        />
        <label
          htmlFor="onlyClean"
          className="text-sm text-gray-700 dark:text-gray-300"
        >
          Solo sin Red Flags
        </label>
      </div>

      {/* Reset */}
      <Button variant="ghost" size="sm" onClick={onReset} className="w-full">
        Limpiar filtros
      </Button>
    </div>
  )
}
