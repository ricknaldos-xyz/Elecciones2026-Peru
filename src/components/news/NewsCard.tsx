'use client'

import { memo } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/Card'
import { NewsSentimentBadge } from './NewsSentimentBadge'
import { NewsSourceBadge } from './NewsSourceBadge'

interface NewsCardProps {
  id: string
  title: string
  url: string
  excerpt?: string | null
  source: string
  published_at?: string | null
  sentiment?: string | null
  candidate_name?: string | null
  candidate_slug?: string | null
  candidate_cargo?: string | null
  party_name?: string | null
  party_short_name?: string | null
  compact?: boolean
  className?: string
}

export const NewsCard = memo(function NewsCard({
  title,
  url,
  excerpt,
  source,
  published_at,
  sentiment,
  candidate_name,
  candidate_slug,
  party_name,
  compact = false,
  className,
}: NewsCardProps) {
  const t = useTranslations('news')

  function formatTimeAgo(dateString: string | null | undefined): string {
    if (!dateString) return ''

    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 60) return t('timeAgo.minutes', { count: diffMins })
    if (diffHours < 24) return t('timeAgo.hours', { count: diffHours })
    if (diffDays < 7) return t('timeAgo.days', { count: diffDays })

    return date.toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })
  }

  return (
    <Card className={cn('overflow-hidden flex flex-col', className)}>
      {/* Header - Stack en movil si hay mucha info */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 p-4 border-b-2 border-[var(--border)] bg-[var(--muted)]">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <NewsSourceBadge source={source} size="sm" />
          <span className="text-sm font-bold text-[var(--foreground)] uppercase truncate">
            {source}
          </span>
        </div>
        <div className="flex items-center gap-2 justify-between sm:justify-end">
          {published_at && (
            <span className="text-xs text-[var(--muted-foreground)] font-medium">
              {formatTimeAgo(published_at)}
            </span>
          )}
          {sentiment && <NewsSentimentBadge sentiment={sentiment} size="sm" />}
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex-1">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="block group"
        >
          <h3 className={cn(
            'font-bold text-[var(--foreground)] leading-snug',
            'group-hover:text-[var(--primary)] transition-colors',
            compact ? 'text-base line-clamp-2' : 'text-base sm:text-lg line-clamp-3'
          )}>
            {title}
          </h3>
        </a>

        {!compact && excerpt && (
          <p className="mt-3 text-sm text-[var(--muted-foreground)] leading-relaxed line-clamp-2">
            {excerpt}
          </p>
        )}
      </div>

      {/* Footer with tags */}
      {(candidate_name || party_name) && (
        <div className="px-5 pb-4 flex flex-wrap items-center gap-2">
          {candidate_name && candidate_slug && (
            <Link
              href={`/candidato/${candidate_slug}`}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5',
                'text-sm font-bold',
                'bg-[var(--primary)] text-white',
                'border-2 border-[var(--border)]',
                'hover:bg-[var(--primary)]/90 transition-colors',
                'min-h-[36px]'
              )}
            >
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="truncate max-w-[200px]">{candidate_name}</span>
            </Link>
          )}
          {party_name && (
            <span className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5',
              'text-sm font-medium',
              'bg-[var(--muted)] text-[var(--muted-foreground)]',
              'border-2 border-[var(--border)]',
              'min-h-[36px]'
            )}>
              <span className="truncate max-w-[150px]">{party_name}</span>
            </span>
          )}
        </div>
      )}

      {/* Read more link - Boton mas grande */}
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          'flex items-center justify-center gap-2 py-3 px-4',
          'bg-[var(--foreground)] text-[var(--background)]',
          'text-sm font-bold uppercase tracking-wide',
          'hover:opacity-90 transition-opacity',
          'min-h-[48px]'
        )}
      >
        <span className="hidden sm:inline">{t('readInSource', { source })}</span>
        <span className="sm:hidden">{t('readArticle')}</span>
        <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </a>
    </Card>
  )
})
