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
        'fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-lg z-50',
        className
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Selected candidates */}
          <div className="flex items-center gap-2 overflow-x-auto">
            <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
              Comparar:
            </span>
            {candidates.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-full pl-3 pr-1 py-1"
              >
                <span className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[120px]">
                  {c.full_name.split(' ')[0]} {c.full_name.split(' ')[1]?.[0]}.
                </span>
                <button
                  onClick={() => onRemove(c.id)}
                  className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center justify-center text-gray-500 dark:text-gray-400"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
            {candidates.length < 4 && (
              <span className="text-xs text-gray-400 dark:text-gray-500">
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
