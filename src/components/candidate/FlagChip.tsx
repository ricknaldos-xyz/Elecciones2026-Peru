'use client'

import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'
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

// Severity icons - distinct shapes for colorblind accessibility
function SeverityIcon({ severity, size }: { severity: FlagSeverity; size: 'sm' | 'md' }) {
  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'

  switch (severity) {
    case 'RED':
      // Warning triangle - high severity
      return (
        <svg className={cn(iconSize, 'flex-shrink-0')} viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
          <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
        </svg>
      )
    case 'AMBER':
      // Lightning bolt / exclamation - medium severity
      return (
        <svg className={cn(iconSize, 'flex-shrink-0')} viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
          <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
        </svg>
      )
    case 'GRAY':
    default:
      // Info circle - low severity
      return (
        <svg className={cn(iconSize, 'flex-shrink-0')} viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
          <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
          <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
        </svg>
      )
  }
}

export function FlagChip({ type, severity, title, onClick, size = 'sm', className }: FlagChipProps) {
  const t = useTranslations('ranking')
  const isClickable = !!onClick
  const severityLabel = t(`flagSeverityAria.${severity}`)

  // NEO BRUTAL sizing - more padding, bolder + 44px mobile touch targets
  const sizeStyles = {
    sm: 'px-2.5 py-1 text-xs gap-1.5 min-h-[44px] sm:min-h-0',
    md: 'px-3 py-1.5 text-sm gap-2 min-h-[44px] sm:min-h-0',
  }

  return (
    <button
      onClick={onClick}
      disabled={!isClickable}
      aria-label={`${severityLabel}: ${title}`}
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
        // Pattern for colorblind users
        severity === 'RED' && 'pattern-severity-high',
        severity === 'AMBER' && 'pattern-severity-medium',
        severity === 'GRAY' && 'pattern-severity-low',
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
      {/* Severity icon - distinct shape for each level */}
      <SeverityIcon severity={severity} size={size} />
      <span className="truncate max-w-[180px] sm:max-w-[120px]">{title}</span>
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
  const t = useTranslations('ranking')
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
          {t('flagMore', { count: hiddenCount })}
        </span>
      )}
    </div>
  )
}
