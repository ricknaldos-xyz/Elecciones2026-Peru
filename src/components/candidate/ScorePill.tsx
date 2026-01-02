'use client'

import { cn } from '@/lib/utils'
import { Tooltip } from '@/components/ui/Tooltip'
import type { PresetType, Weights } from '@/types/database'
import { PRESETS } from '@/lib/constants'

interface ScorePillProps {
  score: number
  mode: PresetType
  weights?: Weights
  size?: 'sm' | 'md' | 'lg'
  showMode?: boolean
  className?: string
}

const sizeStyles = {
  sm: 'text-lg font-bold px-2 py-0.5',
  md: 'text-2xl font-bold px-3 py-1',
  lg: 'text-4xl font-bold px-4 py-2',
}

const modeLabels: Record<PresetType, string> = {
  balanced: 'Balanced',
  merit: 'Merit-first',
  integrity: 'Integrity-first',
  custom: 'Custom',
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
  if (score >= 60) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
  if (score >= 40) return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
  return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
}

export function ScorePill({
  score,
  mode,
  weights,
  size = 'md',
  showMode = true,
  className,
}: ScorePillProps) {
  const displayWeights = weights || PRESETS[mode === 'custom' ? 'balanced' : mode]

  const tooltipContent = (
    <div className="text-xs">
      <div className="font-medium mb-1">Fórmula:</div>
      <div>Score = {(displayWeights.wC * 100).toFixed(0)}% Competencia</div>
      <div className="ml-4">+ {(displayWeights.wI * 100).toFixed(0)}% Integridad</div>
      <div className="ml-4">+ {(displayWeights.wT * 100).toFixed(0)}% Transparencia</div>
    </div>
  )

  return (
    <Tooltip content={tooltipContent}>
      <div
        className={cn(
          'inline-flex flex-col items-center rounded-xl',
          getScoreColor(score),
          className
        )}
      >
        <span className={sizeStyles[size]}>{score.toFixed(1)}</span>
        {showMode && (
          <span className="text-xs opacity-75 pb-1">{modeLabels[mode]}</span>
        )}
      </div>
    </Tooltip>
  )
}
