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
    // Usando colores sólidos de alto contraste en lugar de transparencias
    color: 'bg-[var(--score-excellent-bg)] text-[var(--score-excellent-text)] border-[var(--score-excellent)]',
    dot: 'bg-[var(--score-excellent)]',
    description: 'Datos completos y verificables',
  },
  medium: {
    label: 'Data media',
    color: 'bg-[var(--score-medium-bg)] text-[var(--score-medium-text)] border-[var(--score-medium)]',
    dot: 'bg-[var(--score-medium)]',
    description: 'Algunos datos pueden estar incompletos',
  },
  low: {
    label: 'Data baja',
    color: 'bg-[var(--flag-red-bg)] text-[var(--flag-red-text)] border-[var(--flag-red)]',
    dot: 'bg-[var(--flag-red)]',
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
          'inline-flex items-center font-bold border-2',
          sizeStyles[size],
          config.color,
          className
        )}
      >
        <span className={cn('flex-shrink-0', dotSizes[size], config.dot)} />
        {showLabel && <span className="uppercase">Confianza:</span>}
        <span className="uppercase">{config.label}</span>
        <span className="font-black">{value.toFixed(0)}%</span>
      </span>
    </Tooltip>
  )
}
