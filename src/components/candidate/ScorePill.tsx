'use client'

import { cn } from '@/lib/utils'
import { Tooltip } from '@/components/ui/Tooltip'
import type { PresetType, AnyWeights } from '@/types/database'
import { isPresidentialWeights } from '@/types/database'
import { PRESETS } from '@/lib/constants'

interface ScorePillProps {
  score: number
  mode: PresetType
  weights?: AnyWeights
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showMode?: boolean
  showMax?: boolean
  variant?: 'default' | 'minimal' | 'card'
  className?: string
}

const modeLabels: Record<PresetType, string> = {
  balanced: 'Equilibrado',
  merit: 'Mérito',
  integrity: 'Integridad',
  custom: 'Personalizado',
}

function getScoreLevel(score: number): string {
  if (score >= 80) return 'Excelente'
  if (score >= 60) return 'Bueno'
  if (score >= 40) return 'Regular'
  return 'Bajo'
}

function getScoreLevelKey(score: number): 'excellent' | 'good' | 'medium' | 'low' {
  if (score >= 80) return 'excellent'
  if (score >= 60) return 'good'
  if (score >= 40) return 'medium'
  return 'low'
}

function getScoreColor(score: number): { text: string; bg: string; border: string } {
  // Usar colores de texto de alto contraste para mejor legibilidad
  if (score >= 80) return {
    text: 'text-[var(--score-excellent-text)]',
    bg: 'bg-[var(--score-excellent-bg)]',
    border: 'border-[var(--score-excellent)]',
  }
  if (score >= 60) return {
    text: 'text-[var(--score-good-text)]',
    bg: 'bg-[var(--score-good-bg)]',
    border: 'border-[var(--score-good)]',
  }
  if (score >= 40) return {
    text: 'text-[var(--score-medium-text)]',
    bg: 'bg-[var(--score-medium-bg)]',
    border: 'border-[var(--score-medium)]',
  }
  return {
    text: 'text-[var(--score-low-text)]',
    bg: 'bg-[var(--score-low-bg)]',
    border: 'border-[var(--score-low)]',
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
  const isPres = weights ? isPresidentialWeights(weights) : false

  const tooltipContent = (
    <div className="text-xs font-bold">
      <div className="font-black mb-2 uppercase tracking-wide">Cómo se calcula:</div>
      <div>Puntaje = {(displayWeights.wC * 100).toFixed(0)}% Competencia</div>
      <div className="ml-4">+ {(displayWeights.wI * 100).toFixed(0)}% Integridad</div>
      <div className="ml-4">+ {(displayWeights.wT * 100).toFixed(0)}% Transparencia</div>
      {isPres && isPresidentialWeights(displayWeights) && (
        <div className="ml-4">+ {(displayWeights.wP * 100).toFixed(0)}% Plan de Gobierno</div>
      )}
    </div>
  )

  // Size configurations - NEO BRUTAL with responsive sizes for mobile
  const sizeConfig = {
    sm: { score: 'text-xl sm:text-2xl', max: 'text-xs', gap: 'gap-0', padding: 'px-2 py-1 sm:px-3' },
    md: { score: 'text-2xl sm:text-4xl', max: 'text-xs sm:text-sm', gap: 'gap-0.5', padding: 'px-3 py-1.5 sm:px-4 sm:py-2' },
    lg: { score: 'text-3xl sm:text-5xl', max: 'text-sm sm:text-base', gap: 'gap-0.5 sm:gap-1', padding: 'px-4 py-2 sm:px-5 sm:py-3' },
    xl: { score: 'text-4xl sm:text-6xl', max: 'text-base sm:text-lg', gap: 'gap-0.5 sm:gap-1', padding: 'px-5 py-3 sm:px-6 sm:py-4' },
  }

  const config = sizeConfig[size]
  const scoreLevel = getScoreLevel(score)
  const ariaLabel = `Puntuación ${score.toFixed(0)} de 100, nivel ${scoreLevel}, modo ${modeLabels[mode]}`

  if (variant === 'minimal') {
    return (
      <Tooltip content={tooltipContent}>
        <div
          data-score={getScoreLevelKey(score)}
          className={cn('inline-flex items-baseline', config.gap, className)}
          role="img"
          aria-label={ariaLabel}
        >
          <span className={cn(
            'font-black score-display tracking-tighter',
            config.score,
            colors.text
          )}>
            {score.toFixed(0)}
          </span>
          {showMax && (
            <span className={cn(
              'font-bold text-[var(--muted-foreground)]',
              config.max
            )}>
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
        <div
          data-score={getScoreLevelKey(score)}
          className={cn('flex flex-col items-end', className)}
          role="img"
          aria-label={ariaLabel}
        >
          <div className={cn('inline-flex items-baseline', config.gap)}>
            <span className={cn(
              'font-black score-display tracking-tighter',
              config.score,
              colors.text
            )}>
              {score.toFixed(0)}
            </span>
            {showMax && (
              <span className={cn(
                'font-bold text-[var(--muted-foreground)]',
                config.max
              )}>
                /100
              </span>
            )}
          </div>
          {showMode && (
            <span className="text-xs font-bold text-[var(--muted-foreground)] mt-1 uppercase tracking-wide">
              {modeLabels[mode]}
            </span>
          )}
        </div>
      </Tooltip>
    )
  }

  // Default variant with background - NEO BRUTAL BOX
  return (
    <Tooltip content={tooltipContent}>
      <div
        data-score={getScoreLevelKey(score)}
        role="img"
        aria-label={ariaLabel}
        className={cn(
          'inline-flex flex-col items-center',
          'border-3 border-[var(--border)]',
          'shadow-[var(--shadow-brutal-sm)]',
          colors.bg,
          config.padding,
          className
        )}
      >
        <div className={cn('inline-flex items-baseline', config.gap)}>
          <span className={cn(
            'font-black score-display tracking-tighter',
            config.score,
            colors.text
          )}>
            {score.toFixed(0)}
          </span>
          {showMax && (
            <span className={cn(
              'font-bold text-[var(--muted-foreground)]',
              config.max
            )}>
              /100
            </span>
          )}
        </div>
        {showMode && (
          <span className="text-xs font-bold text-[var(--muted-foreground)] mt-1 uppercase tracking-wide">
            {modeLabels[mode]}
          </span>
        )}
      </div>
    </Tooltip>
  )
}
