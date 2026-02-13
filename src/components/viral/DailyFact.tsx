'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/Card'

interface DailyFact {
  id: string
  fact_text: string
  fact_type: string
  related_candidate_id?: string
  related_party_id?: string
  source_url?: string
}

interface DailyFactProps {
  className?: string
  variant?: 'card' | 'banner'
}

const FACT_TYPE_ICONS: Record<string, string> = {
  candidate: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  party: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
  statistic: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  history: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  comparison: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
}

export function DailyFact({ className, variant = 'card' }: DailyFactProps) {
  const t = useTranslations('dailyFact')
  const tCommon = useTranslations('common')
  const [fact, setFact] = useState<DailyFact | null>(null)
  const [loading, setLoading] = useState(true)

  // Format date with translated month names
  const formatDate = (date: Date): string => {
    const monthKeys = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
    const monthKey = monthKeys[date.getMonth()]
    return `${date.getDate()} ${tCommon(`months.${monthKey}`)}`
  }

  // Fallback facts using translations
  const getFallbackFacts = (): DailyFact[] => [
    { id: '1', fact_text: t('fallbackFacts.fact1'), fact_type: 'statistic' },
    { id: '2', fact_text: t('fallbackFacts.fact2'), fact_type: 'statistic' },
    { id: '3', fact_text: t('fallbackFacts.fact3'), fact_type: 'statistic' },
    { id: '4', fact_text: t('fallbackFacts.fact4'), fact_type: 'history' },
    { id: '5', fact_text: t('fallbackFacts.fact5'), fact_type: 'statistic' },
  ]

  useEffect(() => {
    async function fetchFact() {
      const fallbackFacts = getFallbackFacts()
      try {
        const response = await fetch('/api/facts/today')
        if (response.ok) {
          const data = await response.json()
          setFact(data)
        } else {
          // Use fallback based on day of year
          const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24))
          setFact(fallbackFacts[dayOfYear % fallbackFacts.length])
        }
      } catch {
        // Use fallback
        const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24))
        setFact(fallbackFacts[dayOfYear % fallbackFacts.length])
      } finally {
        setLoading(false)
      }
    }

    fetchFact()
  }, [t])

  const iconPath = fact ? (FACT_TYPE_ICONS[fact.fact_type] || FACT_TYPE_ICONS.statistic) : FACT_TYPE_ICONS.statistic

  // Banner variant - slim horizontal ticker
  if (variant === 'banner') {
    if (loading) {
      return (
        <div className={cn(
          'flex items-center gap-3 p-3 sm:p-4',
          'bg-[var(--muted)]',
          'border-2 border-[var(--border)]',
          'animate-pulse',
          className
        )}>
          <div className="w-8 h-8 bg-[var(--border)]" />
          <div className="flex-1 h-4 bg-[var(--border)]" />
        </div>
      )
    }

    if (!fact) return null

    return (
      <div className={cn(
        'flex items-center gap-3 p-3 sm:p-4',
        'bg-[var(--score-good)]/10 dark:bg-[var(--score-good)]/20',
        'border-2 border-[var(--score-good)]',
        className
      )}>
        <div className={cn(
          'w-8 h-8 flex-shrink-0',
          'bg-[var(--score-good)]',
          'border-2 border-[var(--border)]',
          'flex items-center justify-center'
        )}>
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="square" strokeLinejoin="miter" d={iconPath} />
          </svg>
        </div>
        <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
          <span className="text-xs font-black text-[var(--score-good)] uppercase tracking-wide whitespace-nowrap">
            {t('didYouKnow')}
          </span>
          <p className="text-sm font-medium text-[var(--foreground)] line-clamp-1 sm:line-clamp-none">
            {fact.fact_text}
          </p>
        </div>
        <span className="text-xs text-[var(--muted-foreground)] whitespace-nowrap hidden sm:block">
          {formatDate(new Date())}
        </span>
      </div>
    )
  }

  // Card variant (default) - original full card
  if (loading) {
    return (
      <Card className={cn('p-4 animate-pulse', className)}>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-[var(--muted)] border-2 border-[var(--border)]" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-[var(--muted)] w-1/4" />
            <div className="h-4 bg-[var(--muted)] w-full" />
            <div className="h-4 bg-[var(--muted)] w-3/4" />
          </div>
        </div>
      </Card>
    )
  }

  if (!fact) return null

  return (
    <Card className={cn('p-4 sm:p-5 h-full', className)}>
      <div className="flex items-start gap-3 sm:gap-4">
        <div className={cn(
          'w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0',
          'bg-[var(--score-good)]',
          'border-2 border-[var(--border)]',
          'shadow-[var(--shadow-brutal-sm)]',
          'flex items-center justify-center'
        )}>
          <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="square" strokeLinejoin="miter" d={iconPath} />
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-[var(--primary)] uppercase tracking-wide">
              {t('didYouKnow')}
            </span>
            <span className="text-xs text-[var(--muted-foreground)]">
              {formatDate(new Date())}
            </span>
          </div>
          <p className="text-sm sm:text-base font-medium text-[var(--foreground)] leading-relaxed">
            {fact.fact_text}
          </p>
          {fact.source_url && (
            <Link
              href={fact.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-bold text-[var(--muted-foreground)] hover:text-[var(--primary)] mt-2 transition-colors min-h-[44px] py-2 flex items-center"
            >
              {t('viewSource')}
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </Link>
          )}
        </div>
      </div>
    </Card>
  )
}
