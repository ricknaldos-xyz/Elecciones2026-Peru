'use client'

import { cn } from '@/lib/utils'

type ProgressVariant = 'default' | 'success' | 'warning' | 'danger'

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
  default: 'bg-blue-500',
  success: 'bg-green-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
}

const sizeStyles = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
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
        <div className="flex justify-between mb-1">
          {label && <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>}
          {showLabel && (
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      <div
        className={cn(
          'w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden',
          sizeStyles[size]
        )}
      >
        <div
          className={cn('h-full rounded-full transition-all duration-300', variantStyles[variant])}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
