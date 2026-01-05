'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { AccessibilityPanel } from './AccessibilityPanel'

export function AccessibilityButton() {
  const t = useTranslations('accessibility')
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'p-2.5 sm:p-2',
          'min-w-[44px] min-h-[44px]',
          'flex items-center justify-center',
          'text-[var(--foreground)]',
          'border-2 border-transparent',
          'transition-all duration-100',
          'hover:bg-[var(--muted)]',
          'hover:border-[var(--border)]',
          'hover:-translate-x-0.5 hover:-translate-y-0.5',
          'hover:shadow-[var(--shadow-brutal-sm)]',
          isOpen && [
            'bg-[var(--muted)]',
            'border-[var(--border)]',
            'shadow-[var(--shadow-brutal-sm)]',
          ]
        )}
        aria-label={t('title')}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        {/* Accessibility Icon (Universal Access) */}
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
          aria-hidden="true"
        >
          {/* Circle (head) */}
          <circle cx="12" cy="4" r="2" fill="currentColor" stroke="none" />
          {/* Body and arms */}
          <path
            strokeLinecap="square"
            strokeLinejoin="miter"
            d="M12 8v4m0 0l-3 6m3-6l3 6m-6-8h6"
          />
        </svg>
      </button>

      <AccessibilityPanel isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </div>
  )
}
