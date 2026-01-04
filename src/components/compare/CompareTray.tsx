'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import type { CandidateWithScores } from '@/types/database'

interface CompareTrayProps {
  candidates: CandidateWithScores[]
  onRemove: (id: string) => void
  onCompare: () => void
  onClear: () => void
  className?: string
}

export function CompareTray({
  candidates,
  onRemove,
  onCompare,
  onClear,
  className,
}: CompareTrayProps) {
  if (candidates.length === 0) return null

  return (
    <div
      className={cn(
        // NEO BRUTAL tray with safe-area support
        'fixed bottom-0 left-0 right-0',
        'bg-[var(--card)]',
        'border-t-4 border-[var(--border)]',
        'shadow-[0_-4px_0_0_var(--border)]',
        'z-50',
        'pb-[env(safe-area-inset-bottom)]',
        className
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        {/* Mobile: Stack layout */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          {/* Selected candidates - Horizontal scroll */}
          <div className="flex items-center gap-2 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 pb-1 sm:pb-0">
            <span className="text-xs sm:text-sm font-bold text-[var(--muted-foreground)] whitespace-nowrap uppercase tracking-wide">
              Comparar:
            </span>
            {candidates.map((c) => (
              <div
                key={c.id}
                className={cn(
                  'flex items-center gap-1.5 sm:gap-2',
                  'bg-[var(--muted)]',
                  'border-2 border-[var(--border)]',
                  'pl-2.5 sm:pl-3 pr-1 py-1',
                  'flex-shrink-0'
                )}
              >
                <span className="text-xs sm:text-sm font-bold text-[var(--foreground)] truncate max-w-[80px] sm:max-w-[120px] uppercase">
                  {c.full_name.split(' ')[0]} {c.full_name.split(' ')[1]?.[0]}.
                </span>
                <button
                  onClick={() => onRemove(c.id)}
                  className={cn(
                    'w-7 h-7 sm:w-6 sm:h-6',
                    'bg-[var(--background)]',
                    'border-2 border-[var(--border)]',
                    'flex items-center justify-center',
                    'text-[var(--muted-foreground)]',
                    'hover:bg-[var(--flag-red)] hover:text-white',
                    'transition-colors duration-100'
                  )}
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="square" strokeLinejoin="miter" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
            {candidates.length < 4 && (
              <span className="text-xs font-bold text-[var(--muted-foreground)] uppercase whitespace-nowrap">
                ({candidates.length}/4)
              </span>
            )}
          </div>

          {/* Actions - Full width on mobile */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              className="min-h-[44px] sm:min-h-0 flex-1 sm:flex-initial"
            >
              Limpiar
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={onCompare}
              disabled={candidates.length < 2}
              className="min-h-[44px] sm:min-h-0 flex-1 sm:flex-initial"
            >
              Comparar {candidates.length >= 2 ? `(${candidates.length})` : ''}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
