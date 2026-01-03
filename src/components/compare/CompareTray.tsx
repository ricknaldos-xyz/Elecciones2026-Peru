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
        // NEO BRUTAL tray
        'fixed bottom-0 left-0 right-0',
        'bg-[var(--card)]',
        'border-t-4 border-[var(--border)]',
        'shadow-[0_-4px_0_0_var(--border)]',
        'z-50',
        className
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Selected candidates */}
          <div className="flex items-center gap-2 overflow-x-auto">
            <span className="text-sm font-bold text-[var(--muted-foreground)] whitespace-nowrap uppercase tracking-wide">
              Comparar:
            </span>
            {candidates.map((c) => (
              <div
                key={c.id}
                className={cn(
                  'flex items-center gap-2',
                  'bg-[var(--muted)]',
                  'border-2 border-[var(--border)]',
                  'pl-3 pr-1 py-1'
                )}
              >
                <span className="text-sm font-bold text-[var(--foreground)] truncate max-w-[120px] uppercase">
                  {c.full_name.split(' ')[0]} {c.full_name.split(' ')[1]?.[0]}.
                </span>
                <button
                  onClick={() => onRemove(c.id)}
                  className={cn(
                    'w-6 h-6',
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
              <span className="text-xs font-bold text-[var(--muted-foreground)] uppercase">
                ({candidates.length}/4)
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClear}>
              Limpiar
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={onCompare}
              disabled={candidates.length < 2}
            >
              Comparar {candidates.length >= 2 ? `(${candidates.length})` : ''}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
