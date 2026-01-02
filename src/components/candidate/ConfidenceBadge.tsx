'use client'

import { cn } from '@/lib/utils'
import { Tooltip } from '@/components/ui/Tooltip'
import { CONFIDENCE_THRESHOLDS } from '@/lib/constants'

interface ConfidenceBadgeProps {
  value: number
  className?: string
  showLabel?: boolean
}

function getConfidenceStatus(value: number): 'high' | 'medium' | 'low' {
  if (value >= CONFIDENCE_THRESHOLDS.high) return 'high'
  if (value >= CONFIDENCE_THRESHOLDS.medium) return 'medium'
  return 'low'
}

const statusConfig = {
  high: {
    label: 'Data alta',
    color: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
    description: 'Datos completos y verificables',
  },
  medium: {
    label: 'Data media',
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
    description: 'Algunos datos pueden estar incompletos',
  },
  low: {
    label: 'Data baja',
    color: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
    description: 'Información limitada. El puntaje puede cambiar.',
  },
}

export function ConfidenceBadge({ value, className, showLabel = false }: ConfidenceBadgeProps) {
  const status = getConfidenceStatus(value)
  const config = statusConfig[status]

  return (
    <Tooltip content={config.description}>
      <span
        className={cn(
          'inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded',
          config.color,
          className
        )}
      >
        <svg
          className="w-3 h-3"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        </svg>
        {showLabel && <span className="mr-1">Confianza:</span>}
        {config.label} {value.toFixed(0)}%
      </span>
    </Tooltip>
  )
}
