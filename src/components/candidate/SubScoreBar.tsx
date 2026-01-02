'use client'

import { cn } from '@/lib/utils'
import { Progress } from '@/components/ui/Progress'

type ScoreType = 'competence' | 'integrity' | 'transparency' | 'confidence'

interface SubScoreBarProps {
  type: ScoreType
  value: number
  size?: 'sm' | 'md'
  showLabel?: boolean
  className?: string
}

const typeConfig: Record<ScoreType, { label: string; icon: string }> = {
  competence: { label: 'Competencia', icon: 'C' },
  integrity: { label: 'Integridad', icon: 'I' },
  transparency: { label: 'Transparencia', icon: 'T' },
  confidence: { label: 'Data', icon: 'D' },
}

function getVariant(type: ScoreType, value: number) {
  if (type === 'integrity') {
    if (value >= 90) return 'success'
    if (value >= 70) return 'warning'
    return 'danger'
  }
  if (type === 'confidence') {
    if (value >= 70) return 'success'
    if (value >= 40) return 'warning'
    return 'danger'
  }
  // competence and transparency
  if (value >= 70) return 'success'
  if (value >= 40) return 'default'
  return 'warning'
}

function getStatusLabel(type: ScoreType, value: number): string {
  if (type === 'integrity') {
    if (value >= 90) return 'Verde'
    if (value >= 70) return 'Amarillo'
    return 'Rojo'
  }
  if (type === 'confidence') {
    if (value >= 70) return 'Alta'
    if (value >= 40) return 'Media'
    return 'Baja'
  }
  if (value >= 70) return 'Alta'
  if (value >= 40) return 'Media'
  return 'Baja'
}

export function SubScoreBar({
  type,
  value,
  size = 'md',
  showLabel = true,
  className,
}: SubScoreBarProps) {
  const config = typeConfig[type]
  const variant = getVariant(type, value)
  const statusLabel = getStatusLabel(type, value)

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {showLabel && (
        <div className="flex items-center gap-1.5 min-w-[100px]">
          <span
            className={cn(
              'w-5 h-5 rounded flex items-center justify-center text-xs font-bold',
              variant === 'success' && 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
              variant === 'warning' && 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
              variant === 'danger' && 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
              variant === 'default' && 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
            )}
          >
            {config.icon}
          </span>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {config.label}
          </span>
        </div>
      )}
      <div className="flex-1">
        <Progress
          value={value}
          variant={variant}
          size={size === 'sm' ? 'sm' : 'md'}
        />
      </div>
      <span className="text-sm font-medium text-gray-900 dark:text-gray-100 min-w-[40px] text-right">
        {value.toFixed(0)}
      </span>
      {showLabel && (
        <span className="text-xs text-gray-500 dark:text-gray-500 min-w-[50px]">
          ({statusLabel})
        </span>
      )}
    </div>
  )
}

// Compact version for cards
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
  const variant = getVariant(type, value)

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <span className="text-xs text-gray-500 dark:text-gray-400 w-3">
        {config.icon}
      </span>
      <div className="flex-1">
        <Progress value={value} variant={variant} size="sm" />
      </div>
      <span className="text-xs font-medium text-gray-700 dark:text-gray-300 w-6 text-right">
        {value.toFixed(0)}
      </span>
    </div>
  )
}
