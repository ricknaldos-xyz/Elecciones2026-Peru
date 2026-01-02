'use client'

import { cn } from '@/lib/utils'
import type { FlagSeverity, FlagType } from '@/types/database'

interface FlagChipProps {
  type: FlagType
  severity: FlagSeverity
  title: string
  onClick?: () => void
  size?: 'sm' | 'md'
  className?: string
}

const severityStyles: Record<FlagSeverity, string> = {
  RED: 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300',
  AMBER: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300',
  GRAY: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
}

const severityDots: Record<FlagSeverity, string> = {
  RED: 'bg-red-500',
  AMBER: 'bg-amber-500',
  GRAY: 'bg-zinc-400',
}

export function FlagChip({ type, severity, title, onClick, size = 'sm', className }: FlagChipProps) {
  const isClickable = !!onClick

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs gap-1.5',
    md: 'px-2.5 py-1 text-sm gap-2',
  }

  const dotSizes = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
  }

  return (
    <button
      onClick={onClick}
      disabled={!isClickable}
      className={cn(
        'inline-flex items-center font-medium rounded-lg transition-all',
        sizeStyles[size],
        severityStyles[severity],
        isClickable && 'cursor-pointer hover:opacity-80',
        !isClickable && 'cursor-default',
        className
      )}
    >
      <span className={cn('rounded-full flex-shrink-0', dotSizes[size], severityDots[severity])} />
      <span className="truncate max-w-[120px]">{title}</span>
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
  size?: 'sm' | 'md'
  className?: string
}

export function FlagChips({
  flags,
  maxVisible = 3,
  onFlagClick,
  size = 'sm',
  className,
}: FlagChipsProps) {
  if (flags.length === 0) return null

  // Sort by severity: RED first, then AMBER, then GRAY
  const sortedFlags = [...flags].sort((a, b) => {
    const order: Record<FlagSeverity, number> = { RED: 0, AMBER: 1, GRAY: 2 }
    return order[a.severity] - order[b.severity]
  })

  const visibleFlags = sortedFlags.slice(0, maxVisible)
  const hiddenCount = sortedFlags.length - maxVisible

  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      {visibleFlags.map((flag) => (
        <FlagChip
          key={flag.id}
          type={flag.type}
          severity={flag.severity}
          title={flag.title}
          size={size}
          onClick={onFlagClick ? () => onFlagClick(flag.id) : undefined}
        />
      ))}
      {hiddenCount > 0 && (
        <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
          +{hiddenCount} más
        </span>
      )}
    </div>
  )
}
