import { cn } from '@/lib/utils'

interface PartyIndicatorProps {
  partyColor?: string | null
  partyName: string
  className?: string
  dotSize?: 'sm' | 'md'
}

export function PartyIndicator({ partyColor, partyName, className, dotSize = 'sm' }: PartyIndicatorProps) {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      <div
        className={cn(
          'border border-[var(--border)] flex-shrink-0',
          dotSize === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3'
        )}
        style={{ backgroundColor: partyColor || 'var(--party-default)' }}
      />
      <span className="text-xs font-bold text-[var(--muted-foreground)] uppercase line-clamp-1">
        {partyName}
      </span>
    </div>
  )
}
