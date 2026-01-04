'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Tooltip } from '@/components/ui/Tooltip'
import { PRESETS, WEIGHT_LIMITS } from '@/lib/constants'
import type { PresetType, Weights } from '@/types/database'

interface PresetSelectorProps {
  value: PresetType
  weights?: Weights
  onChange: (mode: PresetType, weights?: Weights) => void
  className?: string
}

const presetConfig: Record<Exclude<PresetType, 'custom'>, { label: string; description: string }> = {
  balanced: {
    label: 'Equilibrado',
    description: 'Equilibra preparación e integridad',
  },
  merit: {
    label: 'Mérito',
    description: 'Prioriza experiencia y estudios; mantiene integridad como filtro clave',
  },
  integrity: {
    label: 'Integridad',
    description: 'Prioriza historial limpio y señales verificables',
  },
}

export function PresetSelector({
  value,
  weights,
  onChange,
  className,
}: PresetSelectorProps) {
  const [showCustom, setShowCustom] = useState(value === 'custom')
  const [customWeights, setCustomWeights] = useState<Weights>(
    weights || PRESETS.balanced
  )

  const handlePresetClick = (preset: Exclude<PresetType, 'custom'>) => {
    setShowCustom(false)
    onChange(preset)
  }

  const handleCustomClick = () => {
    setShowCustom(!showCustom)
    if (!showCustom) {
      onChange('custom', customWeights)
    }
  }

  const handleWeightChange = (key: keyof Weights, newValue: number) => {
    const limits = WEIGHT_LIMITS[key]
    const clampedValue = Math.max(limits.min, Math.min(limits.max, newValue))

    // Redistribute remaining weight
    const remaining = 1 - clampedValue
    const otherKeys = (Object.keys(customWeights) as Array<keyof Weights>).filter(
      (k) => k !== key
    )

    // Simple proportional redistribution
    const otherTotal = otherKeys.reduce((sum, k) => sum + customWeights[k], 0)
    const newWeights: Weights = { ...customWeights, [key]: clampedValue }

    if (otherTotal > 0) {
      otherKeys.forEach((k) => {
        const proportion = customWeights[k] / otherTotal
        let newVal = remaining * proportion
        const kLimits = WEIGHT_LIMITS[k]
        newVal = Math.max(kLimits.min, Math.min(kLimits.max, newVal))
        newWeights[k] = newVal
      })
    }

    // Normalize to sum to 1
    const total = Object.values(newWeights).reduce((sum, v) => sum + v, 0)
    if (total !== 1) {
      const factor = 1 / total
      Object.keys(newWeights).forEach((k) => {
        newWeights[k as keyof Weights] *= factor
      })
    }

    setCustomWeights(newWeights)
    onChange('custom', newWeights)
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Preset Pills - NEO BRUTAL - Horizontal scroll on mobile */}
      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 sm:overflow-visible">
        <div className="flex items-center gap-1 p-1 bg-[var(--muted)] border-3 border-[var(--border)] shadow-[var(--shadow-brutal-sm)] min-w-max sm:min-w-0">
          {(Object.keys(presetConfig) as Array<Exclude<PresetType, 'custom'>>).map(
            (preset) => (
              <Tooltip key={preset} content={presetConfig[preset].description}>
                <button
                  onClick={() => handlePresetClick(preset)}
                  className={cn(
                    'px-3 sm:px-4 py-2.5 sm:py-2 text-sm font-bold uppercase tracking-wide',
                    'border-2 transition-all duration-100',
                    'min-h-[44px] sm:min-h-0 whitespace-nowrap',
                    'sm:flex-1',
                    value === preset && !showCustom
                      ? [
                          'bg-[var(--primary)] text-white',
                          'border-[var(--border)]',
                          'shadow-[var(--shadow-brutal-sm)]',
                          '-translate-x-0.5 -translate-y-0.5',
                        ]
                      : [
                          'bg-[var(--background)] text-[var(--foreground)]',
                          'border-transparent',
                          'hover:border-[var(--border)]',
                          'hover:-translate-x-0.5 hover:-translate-y-0.5',
                          'hover:shadow-[var(--shadow-brutal-sm)]',
                        ]
                  )}
                >
                  {presetConfig[preset].label}
                </button>
              </Tooltip>
            )
          )}
          <Tooltip content="Define tus pesos (con límites para evitar rankings engañosos)">
            <button
              onClick={handleCustomClick}
              className={cn(
                'flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-2 text-sm font-bold uppercase tracking-wide',
                'border-2 transition-all duration-100',
                'min-h-[44px] sm:min-h-0 whitespace-nowrap',
                showCustom
                  ? [
                      'bg-[var(--primary)] text-white',
                      'border-[var(--border)]',
                      'shadow-[var(--shadow-brutal-sm)]',
                      '-translate-x-0.5 -translate-y-0.5',
                    ]
                  : [
                      'bg-[var(--background)] text-[var(--foreground)]',
                      'border-transparent',
                      'hover:border-[var(--border)]',
                      'hover:-translate-x-0.5 hover:-translate-y-0.5',
                      'hover:shadow-[var(--shadow-brutal-sm)]',
                    ]
              )}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="square" strokeLinejoin="miter" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              <span className="hidden sm:inline">Custom</span>
              <span className="sm:hidden">Ajustar</span>
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Custom Sliders - NEO BRUTAL - Horizontal on desktop */}
      {showCustom && (
        <div className="p-4 bg-[var(--muted)] border-3 border-[var(--border)] shadow-[var(--shadow-brutal-sm)]">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4">
            <p className="text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wide lg:max-w-xs">
              Ranking personalizado. La información no cambia, solo tus prioridades.
            </p>
            <button
              onClick={() => {
                setCustomWeights(PRESETS.balanced)
                onChange('custom', PRESETS.balanced)
              }}
              className="text-xs font-bold text-[var(--primary)] hover:underline uppercase tracking-wide whitespace-nowrap"
            >
              Resetear a Equilibrado
            </button>
          </div>

          {/* Sliders - 3 columns on desktop, stack on mobile */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
            <WeightSlider
              label="Competencia"
              value={customWeights.wC}
              min={WEIGHT_LIMITS.wC.min}
              max={WEIGHT_LIMITS.wC.max}
              onChange={(v) => handleWeightChange('wC', v)}
            />
            <WeightSlider
              label="Integridad"
              value={customWeights.wI}
              min={WEIGHT_LIMITS.wI.min}
              max={WEIGHT_LIMITS.wI.max}
              onChange={(v) => handleWeightChange('wI', v)}
            />
            <WeightSlider
              label="Transparencia"
              value={customWeights.wT}
              min={WEIGHT_LIMITS.wT.min}
              max={WEIGHT_LIMITS.wT.max}
              onChange={(v) => handleWeightChange('wT', v)}
            />
          </div>
        </div>
      )}
    </div>
  )
}

interface WeightSliderProps {
  label: string
  value: number
  min: number
  max: number
  onChange: (value: number) => void
}

function WeightSlider({ label, value, min, max, onChange }: WeightSliderProps) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="font-bold text-[var(--foreground)] uppercase tracking-wide">{label}</span>
        <span className="font-black text-[var(--foreground)]">
          {(value * 100).toFixed(0)}%
        </span>
      </div>
      <input
        type="range"
        min={min * 100}
        max={max * 100}
        value={value * 100}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        className="w-full h-3 bg-[var(--background)] border-2 border-[var(--border)] appearance-none cursor-pointer accent-[var(--primary)]"
      />
      <div className="flex justify-between text-xs font-bold text-[var(--muted-foreground)]">
        <span>{(min * 100).toFixed(0)}%</span>
        <span>{(max * 100).toFixed(0)}%</span>
      </div>
    </div>
  )
}
