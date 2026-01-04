'use client'

import Link from 'next/link'
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

function formatTimeAgo(dateString: string | null | undefined): string {
  if (!dateString) return ''

  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 60) return `hace ${diffMins}m`
  if (diffHours < 24) return `hace ${diffHours}h`
  if (diffDays < 7) return `hace ${diffDays}d`

  return date.toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })
}

export function NewsCard({
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
  return (
    <Card className={cn('overflow-hidden', className)}>
      {/* Header */}
      <div className="flex items-center gap-2 p-3 border-b-2 border-[var(--border)] bg-[var(--muted)]">
        <NewsSourceBadge source={source} size="sm" />
        <span className="text-xs font-bold text-[var(--foreground)] uppercase flex-1 truncate">
          {source}
        </span>
        {published_at && (
          <span className="text-xs text-[var(--muted-foreground)]">
            {formatTimeAgo(published_at)}
          </span>
        )}
        {sentiment && <NewsSentimentBadge sentiment={sentiment} size="sm" />}
      </div>

      {/* Content */}
      <div className="p-4">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="block group"
        >
          <h3 className={cn(
            'font-bold text-[var(--foreground)] leading-tight',
            'group-hover:text-[var(--primary)] transition-colors',
            compact ? 'text-sm line-clamp-2' : 'text-base line-clamp-3'
          )}>
            {title}
          </h3>
        </a>

        {!compact && excerpt && (
          <p className="mt-2 text-sm text-[var(--muted-foreground)] line-clamp-2">
            {excerpt}
          </p>
        )}
      </div>

      {/* Footer with tags */}
      {(candidate_name || party_name) && (
        <div className="px-4 pb-3 flex flex-wrap items-center gap-2">
          {candidate_name && candidate_slug && (
            <Link
              href={`/candidato/${candidate_slug}`}
              className={cn(
                'inline-flex items-center gap-1.5 px-2 py-1',
                'text-xs font-bold',
                'bg-[var(--primary)] text-white',
                'border-2 border-[var(--border)]',
                'hover:bg-[var(--primary)]/90 transition-colors'
              )}
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {candidate_name}
            </Link>
          )}
          {party_name && (
            <span className={cn(
              'inline-flex items-center gap-1.5 px-2 py-1',
              'text-xs font-medium',
              'bg-[var(--muted)] text-[var(--muted-foreground)]',
              'border-2 border-[var(--border)]'
            )}>
              {party_name}
            </span>
          )}
        </div>
      )}

      {/* Read more link */}
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          'flex items-center justify-center gap-2 p-2',
          'bg-[var(--foreground)] text-[var(--background)]',
          'text-xs font-bold uppercase tracking-wide',
          'hover:opacity-90 transition-opacity'
        )}
      >
        Leer en {source}
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </a>
    </Card>
  )
}
