'use client'

import { cn } from '@/lib/utils'
import { Tooltip } from '@/components/ui/Tooltip'
import { useTranslations } from 'next-intl'

interface AIBadgeProps {
  className?: string
}

export function AIBadge({ className }: AIBadgeProps) {
  const t = useTranslations('common')
  return (
    <Tooltip content={t('aiGenerated')}>
      <span
        className={cn(
          'inline-flex items-center gap-0.5 px-1.5 py-0.5',
          'text-[10px] font-bold uppercase tracking-wide',
          'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
          'border border-purple-300 dark:border-purple-700',
          className
        )}
      >
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="square" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
        </svg>
        {t('aiBadge')}
      </span>
    </Tooltip>
  )
}
