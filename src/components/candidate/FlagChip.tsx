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

// NEO BRUTAL severity styles - usando colores de texto de alto contraste
const severityStyles: Record<FlagSeverity, string> = {
  RED: 'bg-[var(--flag-red-bg)] text-[var(--flag-red-text)]',
  AMBER: 'bg-[var(--flag-amber-bg)] text-[var(--flag-amber-text)]',
  GRAY: 'bg-[var(--muted)] text-[var(--flag-gray-text)]',
}

const severityBorders: Record<FlagSeverity, string> = {
  RED: 'border-[var(--flag-red)]',
  AMBER: 'border-[var(--flag-amber)]',
  GRAY: 'border-[var(--border)]',
}

const severityDots: Record<FlagSeverity, string> = {
  RED: 'bg-[var(--flag-red)]',
  AMBER: 'bg-[var(--flag-amber)]',
  GRAY: 'bg-[var(--muted-foreground)]',
}

export function FlagChip({ type, severity, title, onClick, size = 'sm', className }: FlagChipProps) {
  const isClickable = !!onClick

  // NEO BRUTAL sizing - more padding, bolder
  const sizeStyles = {
    sm: 'px-2.5 py-1 text-xs gap-2',
    md: 'px-3 py-1.5 text-sm gap-2',
  }

  const dotSizes = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
  }

  return (
    <button
      onClick={onClick}
      disabled={!isClickable}
      className={cn(
        // NEO BRUTAL chip
        'inline-flex items-center',
        'font-bold uppercase tracking-wide',
        'border-2',
        'shadow-[var(--shadow-brutal-sm)]',
        'transition-all duration-100',
        sizeStyles[size],
        severityStyles[severity],
        severityBorders[severity],
        // Hover effect for clickable
        isClickable && [
          'cursor-pointer',
          'hover:-translate-x-0.5 hover:-translate-y-0.5',
          'hover:shadow-[var(--shadow-brutal)]',
          'active:translate-x-0 active:translate-y-0',
          'active:shadow-none',
        ],
        !isClickable && 'cursor-default',
        className
      )}
    >
      {/* Square dot indicator */}
      <span className={cn('flex-shrink-0', dotSizes[size], severityDots[severity])} />
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
    <div className={cn('flex flex-wrap gap-2', className)}>
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
        <span className={cn(
          'inline-flex items-center',
          'px-2.5 py-1 text-xs',
          'font-bold uppercase tracking-wide',
          'text-[var(--muted-foreground)]',
          'bg-[var(--muted)]',
          'border-2 border-[var(--border)]',
          'shadow-[var(--shadow-brutal-sm)]',
        )}>
          +{hiddenCount} más
        </span>
      )}
    </div>
  )
}
