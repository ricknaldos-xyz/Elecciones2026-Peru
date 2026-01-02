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
      {/* Preset Pills */}
      <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
        {(Object.keys(presetConfig) as Array<Exclude<PresetType, 'custom'>>).map(
          (preset) => (
            <Tooltip key={preset} content={presetConfig[preset].description}>
              <button
                onClick={() => handlePresetClick(preset)}
                className={cn(
                  'flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                  value === preset && !showCustom
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
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
              'flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
              showCustom
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            )}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            Personalizado
          </button>
        </Tooltip>
      </div>

      {/* Custom Sliders */}
      {showCustom && (
        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg space-y-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Este ranking es personalizado. La información base no cambia; cambian tus
            prioridades (pesos).
          </p>

          <div className="space-y-3">
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

          <button
            onClick={() => {
              setCustomWeights(PRESETS.balanced)
              onChange('custom', PRESETS.balanced)
            }}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            Resetear a Equilibrado
          </button>
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
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-gray-700 dark:text-gray-300">{label}</span>
        <span className="font-medium text-gray-900 dark:text-gray-100">
          {(value * 100).toFixed(0)}%
        </span>
      </div>
      <input
        type="range"
        min={min * 100}
        max={max * 100}
        value={value * 100}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
      />
      <div className="flex justify-between text-xs text-gray-400">
        <span>{(min * 100).toFixed(0)}%</span>
        <span>{(max * 100).toFixed(0)}%</span>
      </div>
    </div>
  )
}
