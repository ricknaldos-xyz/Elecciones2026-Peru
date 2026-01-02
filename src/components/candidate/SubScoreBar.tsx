'use client'

import { cn } from '@/lib/utils'

type ScoreType = 'competence' | 'integrity' | 'transparency' | 'confidence'

interface SubScoreBarProps {
  type: ScoreType
  value: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  variant?: 'horizontal' | 'vertical'
  className?: string
}

const typeConfig: Record<ScoreType, { label: string; shortLabel: string; icon: string }> = {
  competence: { label: 'Competencia', shortLabel: 'Comp', icon: 'C' },
  integrity: { label: 'Integridad', shortLabel: 'Integ', icon: 'I' },
  transparency: { label: 'Transparencia', shortLabel: 'Trans', icon: 'T' },
  confidence: { label: 'Confianza', shortLabel: 'Data', icon: 'D' },
}

function getBarColor(type: ScoreType, value: number): string {
  if (type === 'integrity') {
    if (value >= 90) return 'bg-emerald-500'
    if (value >= 70) return 'bg-amber-500'
    return 'bg-red-500'
  }
  if (type === 'confidence') {
    if (value >= 70) return 'bg-emerald-500'
    if (value >= 40) return 'bg-amber-500'
    return 'bg-red-500'
  }
  if (value >= 70) return 'bg-emerald-500'
  if (value >= 40) return 'bg-blue-500'
  return 'bg-amber-500'
}

function getTextColor(type: ScoreType, value: number): string {
  if (type === 'integrity') {
    if (value >= 90) return 'text-emerald-600 dark:text-emerald-400'
    if (value >= 70) return 'text-amber-600 dark:text-amber-400'
    return 'text-red-600 dark:text-red-400'
  }
  if (type === 'confidence') {
    if (value >= 70) return 'text-emerald-600 dark:text-emerald-400'
    if (value >= 40) return 'text-amber-600 dark:text-amber-400'
    return 'text-red-600 dark:text-red-400'
  }
  if (value >= 70) return 'text-emerald-600 dark:text-emerald-400'
  if (value >= 40) return 'text-blue-600 dark:text-blue-400'
  return 'text-amber-600 dark:text-amber-400'
}

export function SubScoreBar({
  type,
  value,
  size = 'md',
  showLabel = true,
  variant = 'horizontal',
  className,
}: SubScoreBarProps) {
  const config = typeConfig[type]
  const barColor = getBarColor(type, value)
  const textColor = getTextColor(type, value)
  const percentage = Math.min(Math.max(value, 0), 100)

  const heightStyles = {
    sm: 'h-1',
    md: 'h-1.5',
    lg: 'h-2',
  }

  if (variant === 'vertical') {
    return (
      <div className={cn('flex flex-col items-center gap-1', className)}>
        <span className={cn('text-lg font-bold score-display', textColor)}>
          {value.toFixed(0)}
        </span>
        <div className="w-full h-1 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-500', barColor)}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {config.shortLabel}
        </span>
      </div>
    )
  }

  return (
    <div className={cn('flex items-center gap-3', className)}>
      {showLabel && (
        <span className="text-sm text-zinc-600 dark:text-zinc-400 min-w-[90px]">
          {config.label}
        </span>
      )}
      <div className="flex-1">
        <div className={cn('w-full bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden', heightStyles[size])}>
          <div
            className={cn('h-full rounded-full transition-all duration-500', barColor)}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
      <span className={cn('text-sm font-semibold min-w-[32px] text-right tabular-nums', textColor)}>
        {value.toFixed(0)}
      </span>
    </div>
  )
}

// Compact version for cards - now more minimal
export function SubScoreBarMini({
  type,
  value,
  className,
}: {
  type: ScoreType
  value: number
  className?: string
}) {
  const config = typeConfig[type]
  const barColor = getBarColor(type, value)
  const textColor = getTextColor(type, value)
  const percentage = Math.min(Math.max(value, 0), 100)

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 w-4">
        {config.icon}
      </span>
      <div className="flex-1 h-1 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', barColor)}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className={cn('text-xs font-semibold w-6 text-right tabular-nums', textColor)}>
        {value.toFixed(0)}
      </span>
    </div>
  )
}

// New compact stat display for bento cards
export function SubScoreStat({
  type,
  value,
  size = 'md',
  className,
}: {
  type: ScoreType
  value: number
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const config = typeConfig[type]
  const barColor = getBarColor(type, value)
  const textColor = getTextColor(type, value)
  const percentage = Math.min(Math.max(value, 0), 100)

  const sizeStyles = {
    sm: { text: 'text-lg', label: 'text-[10px]', height: 'h-0.5' },
    md: { text: 'text-xl', label: 'text-xs', height: 'h-1' },
    lg: { text: 'text-2xl', label: 'text-xs', height: 'h-1' },
  }

  const styles = sizeStyles[size]

  return (
    <div className={cn('flex flex-col', className)}>
      <div className="flex items-baseline gap-1">
        <span className={cn('font-bold score-display', styles.text, textColor)}>
          {value.toFixed(0)}
        </span>
      </div>
      <div className={cn('w-full bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden mt-1', styles.height)}>
        <div
          className={cn('h-full rounded-full transition-all duration-500', barColor)}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className={cn('text-zinc-500 dark:text-zinc-400 mt-0.5', styles.label)}>
        {config.shortLabel}
      </span>
    </div>
  )
}
