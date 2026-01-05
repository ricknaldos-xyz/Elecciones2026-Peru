'use client'

import { cn } from '@/lib/utils'

type ProgressVariant = 'default' | 'success' | 'warning' | 'danger' | 'primary'

interface ProgressProps {
  value: number
  max?: number
  variant?: ProgressVariant
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  label?: string
  /** Accessible label for screen readers (required for accessibility) */
  ariaLabel?: string
  className?: string
}

const variantStyles: Record<ProgressVariant, { color: string; pattern: string; scoreLevel: 'excellent' | 'good' | 'medium' | 'low' }> = {
  default: { color: 'bg-[var(--score-good)]', pattern: 'pattern-score-good', scoreLevel: 'good' },
  success: { color: 'bg-[var(--score-excellent)]', pattern: 'pattern-score-excellent', scoreLevel: 'excellent' },
  warning: { color: 'bg-[var(--score-medium)]', pattern: 'pattern-score-medium', scoreLevel: 'medium' },
  danger: { color: 'bg-[var(--flag-red)]', pattern: 'pattern-severity-high', scoreLevel: 'low' },
  primary: { color: 'bg-[var(--primary)]', pattern: 'pattern-competence', scoreLevel: 'good' },
}

const sizeStyles = {
  sm: 'h-3',
  md: 'h-4',
  lg: 'h-6',
}

export function Progress({
  value,
  max = 100,
  variant = 'default',
  size = 'md',
  showLabel = false,
  label,
  ariaLabel,
  className,
}: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

  return (
    <div className={cn('w-full', className)}>
      {(showLabel || label) && (
        <div className="flex justify-between mb-2">
          {label && (
            <span className="text-sm font-bold text-[var(--foreground)] uppercase tracking-wide">
              {label}
            </span>
          )}
          {showLabel && (
            <span className="text-sm font-bold text-[var(--foreground)]">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={ariaLabel || label || `${Math.round(percentage)}%`}
        data-score={variantStyles[variant].scoreLevel}
        className={cn(
          // Container - NEO BRUTAL
          'w-full bg-[var(--muted)]',
          'border-2 border-[var(--border)]',
          'overflow-hidden',
          sizeStyles[size]
        )}
      >
        <div
          className={cn(
            'h-full transition-all duration-300',
            variantStyles[variant].color,
            variantStyles[variant].pattern
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
