'use client'

import { cn } from '@/lib/utils'
import { Tooltip } from '@/components/ui/Tooltip'
import { CONFIDENCE_THRESHOLDS } from '@/lib/constants'
import { useTranslations } from 'next-intl'

interface ConfidenceBadgeProps {
  value: number
  className?: string
  showLabel?: boolean
  size?: 'sm' | 'md'
}

function getConfidenceStatus(value: number): 'high' | 'medium' | 'low' {
  if (value >= CONFIDENCE_THRESHOLDS.high) return 'high'
  if (value >= CONFIDENCE_THRESHOLDS.medium) return 'medium'
  return 'low'
}

const statusStyles = {
  high: {
    color: 'bg-[var(--score-excellent-bg)] text-[var(--score-excellent-text)] border-[var(--score-excellent)]',
    dot: 'bg-[var(--score-excellent)]',
    labelKey: 'verified' as const,
    descKey: 'verifiedDesc' as const,
  },
  medium: {
    color: 'bg-[var(--score-medium-bg)] text-[var(--score-medium-text)] border-[var(--score-medium)]',
    dot: 'bg-[var(--score-medium)]',
    labelKey: 'partial' as const,
    descKey: 'partialDesc' as const,
  },
  low: {
    color: 'bg-[var(--flag-red-bg)] text-[var(--flag-red-text)] border-[var(--flag-red)]',
    dot: 'bg-[var(--flag-red)]',
    labelKey: 'limited' as const,
    descKey: 'limitedDesc' as const,
  },
}

export function ConfidenceBadge({ value, className, showLabel = false, size = 'sm' }: ConfidenceBadgeProps) {
  const t = useTranslations('candidate.confidenceBadge')
  const status = getConfidenceStatus(value)
  const styles = statusStyles[status]

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs gap-1.5',
    md: 'px-2.5 py-1 text-sm gap-2',
  }

  const dotSizes = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
  }

  return (
    <Tooltip content={t(styles.descKey)}>
      <span
        className={cn(
          'inline-flex items-center font-bold border-2',
          sizeStyles[size],
          styles.color,
          className
        )}
      >
        <span className={cn('flex-shrink-0', dotSizes[size], styles.dot)} />
        {showLabel && <span className="uppercase">{t('label')}</span>}
        <span className="uppercase">{t(styles.labelKey)}</span>
        <span className="font-black">{value.toFixed(0)}%</span>
      </span>
    </Tooltip>
  )
}
