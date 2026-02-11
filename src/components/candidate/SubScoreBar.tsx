'use client'

import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'

type ScoreType = 'competence' | 'integrity' | 'transparency' | 'confidence' | 'plan'

interface SubScoreBarProps {
  type: ScoreType
  value: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  variant?: 'horizontal' | 'vertical'
  className?: string
}

const scoreKeyMap: Record<ScoreType, string> = {
  competence: 'competence',
  integrity: 'integrity',
  transparency: 'transparency',
  confidence: 'confidence',
  plan: 'plan',
}

const shortLabelKeyMap: Record<ScoreType, string> = {
  competence: 'compShort',
  integrity: 'intShort',
  transparency: 'transShort',
  confidence: 'confShort',
  plan: 'planShort',
}

const typeIcons: Record<ScoreType, string> = {
  competence: 'C',
  integrity: 'I',
  transparency: 'T',
  confidence: 'D',
  plan: 'P',
}

function useTypeConfig() {
  const t = useTranslations('candidate')
  return (type: ScoreType) => ({
    label: type === 'plan' ? t('planLabel') : t(`scores.${scoreKeyMap[type]}`),
    shortLabel: t(`subScores.${shortLabelKeyMap[type]}`),
    icon: typeIcons[type],
  })
}

function getBarColor(type: ScoreType, value: number): string {
  // Use semantic colors based on score value
  if (type === 'integrity') {
    if (value >= 90) return 'bg-[var(--score-excellent)]'
    if (value >= 70) return 'bg-[var(--score-medium)]'
    return 'bg-[var(--score-low)]'
  }
  if (type === 'confidence') {
    if (value >= 70) return 'bg-[var(--score-excellent)]'
    if (value >= 40) return 'bg-[var(--score-medium)]'
    return 'bg-[var(--score-low)]'
  }
  // Default scoring
  if (value >= 70) return 'bg-[var(--score-excellent)]'
  if (value >= 40) return 'bg-[var(--score-good)]'
  return 'bg-[var(--score-medium)]'
}

function getTextColor(type: ScoreType, value: number): string {
  // Usar colores de texto de alto contraste para mejor legibilidad
  if (type === 'integrity') {
    if (value >= 90) return 'text-[var(--score-excellent-text)]'
    if (value >= 70) return 'text-[var(--score-medium-text)]'
    return 'text-[var(--score-low-text)]'
  }
  if (type === 'confidence') {
    if (value >= 70) return 'text-[var(--score-excellent-text)]'
    if (value >= 40) return 'text-[var(--score-medium-text)]'
    return 'text-[var(--score-low-text)]'
  }
  if (value >= 70) return 'text-[var(--score-excellent-text)]'
  if (value >= 40) return 'text-[var(--score-good-text)]'
  return 'text-[var(--score-medium-text)]'
}

function getScoreLevelKey(type: ScoreType, value: number): 'excellent' | 'good' | 'medium' | 'low' {
  if (type === 'integrity') {
    if (value >= 90) return 'excellent'
    if (value >= 70) return 'medium'
    return 'low'
  }
  if (type === 'confidence') {
    if (value >= 70) return 'excellent'
    if (value >= 40) return 'medium'
    return 'low'
  }
  if (value >= 70) return 'excellent'
  if (value >= 40) return 'good'
  return 'medium'
}

export function SubScoreBar({
  type,
  value,
  size = 'md',
  showLabel = true,
  variant = 'horizontal',
  className,
}: SubScoreBarProps) {
  const getConfig = useTypeConfig()
  const config = getConfig(type)
  const barColor = getBarColor(type, value)
  const textColor = getTextColor(type, value)
  const percentage = Math.min(Math.max(value, 0), 100)

  // NEO BRUTAL - taller bars
  const heightStyles = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  }

  if (variant === 'vertical') {
    return (
      <div className={cn('flex flex-col items-center gap-1', className)}>
        <span className={cn('text-lg sm:text-xl font-black score-display', textColor)} aria-hidden="true">
          {value.toFixed(0)}
        </span>
        {/* NEO BRUTAL bar - no rounded corners */}
        <div
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${config.label}: ${value.toFixed(0)} de 100`}
          data-score={getScoreLevelKey(type, value)}
          className="w-full h-2 bg-[var(--muted)] border-2 border-[var(--border)] overflow-hidden"
        >
          <div
            className={cn(
              'h-full transition-all duration-300',
              barColor,
              type === 'competence' && 'pattern-competence',
              type === 'integrity' && 'pattern-integrity',
              type === 'transparency' && 'pattern-transparency',
              type === 'plan' && 'pattern-plan',
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wide" aria-hidden="true">
          {config.shortLabel}
        </span>
      </div>
    )
  }

  return (
    <div className={cn('flex items-center gap-3', className)}>
      {showLabel && (
        <span className="text-sm font-bold text-[var(--foreground)] min-w-[100px] uppercase tracking-wide" id={`label-${type}`}>
          {config.label}
        </span>
      )}
      <div className="flex-1">
        {/* NEO BRUTAL bar - thick border, no rounded corners */}
        <div
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${config.label}: ${value.toFixed(0)} de 100`}
          data-score={getScoreLevelKey(type, value)}
          className={cn(
            'w-full bg-[var(--muted)]',
            'border-2 border-[var(--border)]',
            'overflow-hidden',
            heightStyles[size]
          )}
        >
          <div
            className={cn(
              'h-full transition-all duration-300',
              barColor,
              type === 'competence' && 'pattern-competence',
              type === 'integrity' && 'pattern-integrity',
              type === 'transparency' && 'pattern-transparency',
              type === 'plan' && 'pattern-plan',
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
      <span className={cn(
        'text-sm font-black min-w-[36px] text-right tabular-nums',
        textColor
      )} aria-hidden="true">
        {value.toFixed(0)}
      </span>
    </div>
  )
}

// Compact version for cards - NEO BRUTAL mini
export function SubScoreBarMini({
  type,
  value,
  className,
}: {
  type: ScoreType
  value: number
  className?: string
}) {
  const getConfig = useTypeConfig()
  const config = getConfig(type)
  const barColor = getBarColor(type, value)
  const textColor = getTextColor(type, value)
  const percentage = Math.min(Math.max(value, 0), 100)

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className="text-xs font-black text-[var(--foreground)] w-4 uppercase" aria-hidden="true">
        {config.icon}
      </span>
      {/* NEO BRUTAL mini bar */}
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${config.label}: ${value.toFixed(0)} de 100`}
        data-score={getScoreLevelKey(type, value)}
        className="flex-1 h-1.5 bg-[var(--muted)] border border-[var(--border)] overflow-hidden"
      >
        <div
          className={cn(
            'h-full transition-all duration-300',
            barColor,
            type === 'competence' && 'pattern-competence',
            type === 'integrity' && 'pattern-integrity',
            type === 'transparency' && 'pattern-transparency',
            type === 'plan' && 'pattern-plan',
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className={cn('text-xs font-black w-6 text-right tabular-nums', textColor)} aria-hidden="true">
        {value.toFixed(0)}
      </span>
    </div>
  )
}

// NEO BRUTAL stat display for bento cards
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
  const getConfig = useTypeConfig()
  const config = getConfig(type)
  const barColor = getBarColor(type, value)
  const textColor = getTextColor(type, value)
  const percentage = Math.min(Math.max(value, 0), 100)

  const sizeStyles = {
    sm: { text: 'text-xl', label: 'text-xs', height: 'h-1' },
    md: { text: 'text-2xl', label: 'text-xs', height: 'h-1.5' },
    lg: { text: 'text-3xl', label: 'text-sm', height: 'h-2' },
  }

  const styles = sizeStyles[size]

  return (
    <div className={cn('flex flex-col', className)}>
      <div className="flex items-baseline gap-1">
        <span className={cn('font-black score-display', styles.text, textColor)} aria-hidden="true">
          {value.toFixed(0)}
        </span>
      </div>
      {/* NEO BRUTAL progress bar */}
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${config.label}: ${value.toFixed(0)} de 100`}
        data-score={getScoreLevelKey(type, value)}
        className={cn(
          'w-full bg-[var(--muted)]',
          'border-2 border-[var(--border)]',
          'overflow-hidden mt-1',
          styles.height
        )}
      >
        <div
          className={cn(
            'h-full transition-all duration-300',
            barColor,
            type === 'competence' && 'pattern-competence',
            type === 'integrity' && 'pattern-integrity',
            type === 'transparency' && 'pattern-transparency',
            type === 'plan' && 'pattern-plan',
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className={cn(
        'text-[var(--muted-foreground)] mt-1 font-bold uppercase tracking-wide',
        styles.label
      )} aria-hidden="true">
        {config.shortLabel}
      </span>
    </div>
  )
}
