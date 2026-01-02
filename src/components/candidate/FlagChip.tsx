'use client'

import { cn } from '@/lib/utils'
import type { FlagSeverity, FlagType } from '@/types/database'

interface FlagChipProps {
  type: FlagType
  severity: FlagSeverity
  title: string
  onClick?: () => void
  className?: string
}

const severityStyles: Record<FlagSeverity, string> = {
  RED: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/50 dark:text-red-200 dark:border-red-800',
  AMBER: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/50 dark:text-amber-200 dark:border-amber-800',
  GRAY: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700',
}

const severityIcons: Record<FlagSeverity, string> = {
  RED: '!',
  AMBER: '!',
  GRAY: 'i',
}

export function FlagChip({ type, severity, title, onClick, className }: FlagChipProps) {
  const isClickable = !!onClick

  return (
    <button
      onClick={onClick}
      disabled={!isClickable}
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border',
        severityStyles[severity],
        isClickable && 'cursor-pointer hover:opacity-80 transition-opacity',
        !isClickable && 'cursor-default',
        className
      )}
    >
      <span
        className={cn(
          'w-3.5 h-3.5 rounded-full flex items-center justify-center text-[10px] font-bold',
          severity === 'RED' && 'bg-red-500 text-white',
          severity === 'AMBER' && 'bg-amber-500 text-white',
          severity === 'GRAY' && 'bg-gray-400 text-white'
        )}
      >
        {severityIcons[severity]}
      </span>
      <span className="truncate max-w-[150px]">{title}</span>
    </button>
  )
}

// Component to show multiple flags with overflow
interface FlagChipsProps {
  flags: Array<{
    id: string
    type: FlagType
    severity: FlagSeverity
    title: string
  }>
  maxVisible?: number
  onFlagClick?: (flagId: string) => void
  className?: string
}

export function FlagChips({
  flags,
  maxVisible = 3,
  onFlagClick,
  className,
}: FlagChipsProps) {
  if (flags.length === 0) return null

  const visibleFlags = flags.slice(0, maxVisible)
  const hiddenCount = flags.length - maxVisible

  return (
    <div className={cn('flex flex-wrap gap-1', className)}>
      {visibleFlags.map((flag) => (
        <FlagChip
          key={flag.id}
          type={flag.type}
          severity={flag.severity}
          title={flag.title}
          onClick={onFlagClick ? () => onFlagClick(flag.id) : undefined}
        />
      ))}
      {hiddenCount > 0 && (
        <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium text-gray-500 dark:text-gray-400">
          +{hiddenCount}
        </span>
      )}
    </div>
  )
}
