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
  className?: string
}

const variantStyles: Record<ProgressVariant, string> = {
  default: 'bg-[var(--score-good)]',
  success: 'bg-[var(--score-excellent)]',
  warning: 'bg-[var(--score-medium)]',
  danger: 'bg-[var(--flag-red)]',
  primary: 'bg-[var(--primary)]',
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
            variantStyles[variant]
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
