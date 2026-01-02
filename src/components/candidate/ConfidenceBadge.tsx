'use client'

import { cn } from '@/lib/utils'
import { Tooltip } from '@/components/ui/Tooltip'
import { CONFIDENCE_THRESHOLDS } from '@/lib/constants'

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

const statusConfig = {
  high: {
    label: 'Data alta',
    color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
    dot: 'bg-emerald-500',
    description: 'Datos completos y verificables',
  },
  medium: {
    label: 'Data media',
    color: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300',
    dot: 'bg-amber-500',
    description: 'Algunos datos pueden estar incompletos',
  },
  low: {
    label: 'Data baja',
    color: 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300',
    dot: 'bg-red-500',
    description: 'Información limitada. El puntaje puede cambiar.',
  },
}

export function ConfidenceBadge({ value, className, showLabel = false, size = 'sm' }: ConfidenceBadgeProps) {
  const status = getConfidenceStatus(value)
  const config = statusConfig[status]

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs gap-1.5',
    md: 'px-2.5 py-1 text-sm gap-2',
  }

  const dotSizes = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
  }

  return (
    <Tooltip content={config.description}>
      <span
        className={cn(
          'inline-flex items-center font-medium rounded-lg',
          sizeStyles[size],
          config.color,
          className
        )}
      >
        <span className={cn('rounded-full flex-shrink-0', dotSizes[size], config.dot)} />
        {showLabel && <span>Confianza:</span>}
        <span>{config.label}</span>
        <span className="opacity-75">{value.toFixed(0)}%</span>
      </span>
    </Tooltip>
  )
}
