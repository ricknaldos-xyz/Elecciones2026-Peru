'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Tooltip } from '@/components/ui/Tooltip'
import { PRESETS, WEIGHT_LIMITS, PRESIDENTIAL_PRESETS, PRESIDENTIAL_WEIGHT_LIMITS, validateAndNormalizeWeights, validateAndNormalizePresidentialWeights } from '@/lib/constants'
import type { PresetType, Weights, AnyWeights, PresidentialWeights, CargoType } from '@/types/database'
import { isPresidentialWeights } from '@/types/database'

interface PresetSelectorProps {
  value: PresetType
  weights?: AnyWeights
  onChange: (mode: PresetType, weights?: AnyWeights) => void
  cargo?: CargoType
  className?: string
}

const presetConfig: Record<Exclude<PresetType, 'custom'>, { label: string; description: string; descriptionPres?: string }> = {
  balanced: {
    label: 'Equilibrado',
    description: 'Equilibra preparación e historial legal',
    descriptionPres: 'Equilibra preparación, historial legal y plan de gobierno',
  },
  merit: {
    label: 'Mérito',
    description: 'Prioriza experiencia y estudios; mantiene historial legal como filtro clave',
    descriptionPres: 'Prioriza experiencia y estudios; incluye viabilidad del plan',
  },
  integrity: {
    label: 'Historial Legal',
    description: 'Prioriza ausencia de antecedentes verificables',
    descriptionPres: 'Prioriza ausencia de antecedentes; incluye viabilidad del plan',
  },
}

export function PresetSelector({
  value,
  weights,
  onChange,
  cargo,
  className,
}: PresetSelectorProps) {
  const isPresidential = cargo === 'presidente'
  const [showCustom, setShowCustom] = useState(value === 'custom')
  const [customWeights, setCustomWeights] = useState<AnyWeights>(
    weights || (isPresidential ? PRESIDENTIAL_PRESETS.balanced : PRESETS.balanced)
  )

  const handlePresetClick = (preset: Exclude<PresetType, 'custom'>) => {
    setShowCustom(false)
    onChange(preset)
  }

  const handleCustomClick = () => {
    setShowCustom(!showCustom)
    if (!showCustom) {
      // Initialize custom weights with proper pillar count
      const defaultCustom = isPresidential
        ? { ...PRESIDENTIAL_PRESETS.balanced }
        : { ...PRESETS.balanced }
      setCustomWeights(defaultCustom)
      onChange('custom', defaultCustom)
    }
  }

  const handleWeightChange = (key: string, newValue: number) => {
    const currentLimits = isPresidential ? PRESIDENTIAL_WEIGHT_LIMITS : WEIGHT_LIMITS
    const limits = currentLimits[key as keyof typeof currentLimits]
    const clampedValue = Math.max(limits.min, Math.min(limits.max, newValue))

    // Redistribute remaining weight proportionally
    const remaining = 1 - clampedValue
    const allKeys = Object.keys(customWeights) as string[]
    const otherKeys = allKeys.filter((k) => k !== key)

    const weightsRecord = customWeights as unknown as Record<string, number>
    const otherTotal = otherKeys.reduce((sum, k) => sum + weightsRecord[k], 0)
    const prelimWeights: Record<string, number> = { ...weightsRecord, [key]: clampedValue }

    if (otherTotal > 0) {
      otherKeys.forEach((k) => {
        const proportion = weightsRecord[k] / otherTotal
        let newVal = remaining * proportion
        const kLimits = currentLimits[k as keyof typeof currentLimits]
        newVal = Math.max(kLimits.min, Math.min(kLimits.max, newVal))
        prelimWeights[k] = newVal
      })
    }

    // Use centralized validation and normalization
    const newWeights = isPresidential
      ? validateAndNormalizePresidentialWeights(prelimWeights as unknown as PresidentialWeights)
      : validateAndNormalizeWeights(prelimWeights as unknown as Weights)

    setCustomWeights(newWeights as AnyWeights)
    onChange('custom', newWeights as AnyWeights)
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Preset Pills - NEO BRUTAL - Horizontal scroll on mobile */}
      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 sm:overflow-visible">
        <div className="flex items-center gap-1 p-1 bg-[var(--muted)] border-3 border-[var(--border)] shadow-[var(--shadow-brutal-sm)] min-w-max sm:min-w-0">
          {(Object.keys(presetConfig) as Array<Exclude<PresetType, 'custom'>>).map(
            (preset) => (
              <Tooltip key={preset} content={isPresidential ? (presetConfig[preset].descriptionPres || presetConfig[preset].description) : presetConfig[preset].description}>
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
                const defaults = isPresidential
                  ? { ...PRESIDENTIAL_PRESETS.balanced }
                  : { ...PRESETS.balanced }
                setCustomWeights(defaults)
                onChange('custom', defaults as AnyWeights)
              }}
              className="text-xs font-bold text-[var(--primary)] hover:underline uppercase tracking-wide whitespace-nowrap"
            >
              Resetear a Equilibrado
            </button>
          </div>

          {/* Sliders - columns on desktop, stack on mobile */}
          <div className={cn(
            'grid grid-cols-1 gap-4 lg:gap-6',
            isPresidential ? 'lg:grid-cols-4' : 'lg:grid-cols-3'
          )}>
            <WeightSlider
              label="Competencia"
              value={(customWeights as unknown as Record<string, number>).wC}
              min={(isPresidential ? PRESIDENTIAL_WEIGHT_LIMITS : WEIGHT_LIMITS).wC.min}
              max={(isPresidential ? PRESIDENTIAL_WEIGHT_LIMITS : WEIGHT_LIMITS).wC.max}
              onChange={(v) => handleWeightChange('wC', v)}
            />
            <WeightSlider
              label="Historial Legal"
              value={(customWeights as unknown as Record<string, number>).wI}
              min={(isPresidential ? PRESIDENTIAL_WEIGHT_LIMITS : WEIGHT_LIMITS).wI.min}
              max={(isPresidential ? PRESIDENTIAL_WEIGHT_LIMITS : WEIGHT_LIMITS).wI.max}
              onChange={(v) => handleWeightChange('wI', v)}
            />
            <WeightSlider
              label="Transparencia"
              value={(customWeights as unknown as Record<string, number>).wT}
              min={(isPresidential ? PRESIDENTIAL_WEIGHT_LIMITS : WEIGHT_LIMITS).wT.min}
              max={(isPresidential ? PRESIDENTIAL_WEIGHT_LIMITS : WEIGHT_LIMITS).wT.max}
              onChange={(v) => handleWeightChange('wT', v)}
            />
            {isPresidential && (
              <WeightSlider
                label="Plan de Gob."
                value={(customWeights as unknown as Record<string, number>).wP || PRESIDENTIAL_PRESETS.balanced.wP}
                min={PRESIDENTIAL_WEIGHT_LIMITS.wP.min}
                max={PRESIDENTIAL_WEIGHT_LIMITS.wP.max}
                onChange={(v) => handleWeightChange('wP', v)}
              />
            )}
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
