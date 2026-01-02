'use client'

import { cn } from '@/lib/utils'
import { Tooltip } from '@/components/ui/Tooltip'
import type { PresetType, Weights } from '@/types/database'
import { PRESETS } from '@/lib/constants'

interface ScorePillProps {
  score: number
  mode: PresetType
  weights?: Weights
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showMode?: boolean
  showMax?: boolean
  variant?: 'default' | 'minimal' | 'card'
  className?: string
}

const modeLabels: Record<PresetType, string> = {
  balanced: 'Balanceado',
  merit: 'Meritocrático',
  integrity: 'Integridad',
  custom: 'Personalizado',
}

function getScoreColor(score: number): { text: string; bg: string } {
  if (score >= 80) return {
    text: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-950/50'
  }
  if (score >= 60) return {
    text: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-950/50'
  }
  if (score >= 40) return {
    text: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/50'
  }
  return {
    text: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-950/50'
  }
}

export function ScorePill({
  score,
  mode,
  weights,
  size = 'md',
  showMode = false,
  showMax = true,
  variant = 'default',
  className,
}: ScorePillProps) {
  const displayWeights = weights || PRESETS[mode === 'custom' ? 'balanced' : mode]
  const colors = getScoreColor(score)

  const tooltipContent = (
    <div className="text-xs">
      <div className="font-medium mb-1">Fórmula:</div>
      <div>Score = {(displayWeights.wC * 100).toFixed(0)}% Competencia</div>
      <div className="ml-4">+ {(displayWeights.wI * 100).toFixed(0)}% Integridad</div>
      <div className="ml-4">+ {(displayWeights.wT * 100).toFixed(0)}% Transparencia</div>
    </div>
  )

  // Size configurations for the large number display style
  const sizeConfig = {
    sm: { score: 'text-2xl', max: 'text-xs', gap: 'gap-0' },
    md: { score: 'text-4xl', max: 'text-sm', gap: 'gap-0.5' },
    lg: { score: 'text-6xl', max: 'text-base', gap: 'gap-1' },
    xl: { score: 'text-7xl', max: 'text-lg', gap: 'gap-1' },
  }

  const config = sizeConfig[size]

  if (variant === 'minimal') {
    return (
      <Tooltip content={tooltipContent}>
        <div className={cn('inline-flex items-baseline', config.gap, className)}>
          <span className={cn('font-black score-display', config.score, colors.text)}>
            {score.toFixed(0)}
          </span>
          {showMax && (
            <span className={cn('font-normal text-zinc-400 dark:text-zinc-500', config.max)}>
              /100
            </span>
          )}
        </div>
      </Tooltip>
    )
  }

  if (variant === 'card') {
    return (
      <Tooltip content={tooltipContent}>
        <div className={cn('flex flex-col items-end', className)}>
          <div className={cn('inline-flex items-baseline', config.gap)}>
            <span className={cn('font-black score-display', config.score, colors.text)}>
              {score.toFixed(0)}
            </span>
            {showMax && (
              <span className={cn('font-normal text-zinc-400 dark:text-zinc-500', config.max)}>
                /100
              </span>
            )}
          </div>
          {showMode && (
            <span className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              {modeLabels[mode]}
            </span>
          )}
        </div>
      </Tooltip>
    )
  }

  // Default variant with background
  return (
    <Tooltip content={tooltipContent}>
      <div
        className={cn(
          'inline-flex flex-col items-center rounded-2xl px-4 py-2',
          colors.bg,
          className
        )}
      >
        <div className={cn('inline-flex items-baseline', config.gap)}>
          <span className={cn('font-black score-display', config.score, colors.text)}>
            {score.toFixed(0)}
          </span>
          {showMax && (
            <span className={cn('font-medium text-zinc-400 dark:text-zinc-500', config.max)}>
              /100
            </span>
          )}
        </div>
        {showMode && (
          <span className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            {modeLabels[mode]}
          </span>
        )}
      </div>
    </Tooltip>
  )
}
