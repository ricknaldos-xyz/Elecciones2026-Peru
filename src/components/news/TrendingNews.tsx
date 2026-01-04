'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { NewsSentimentBadge } from './NewsSentimentBadge'
import { NewsSourceBadge } from './NewsSourceBadge'

interface NewsItem {
  id: string
  title: string
  url: string
  source: string
  published_at: string | null
  sentiment: string | null
  candidate_name: string | null
  candidate_slug: string | null
}

interface CandidateActivity {
  candidate_name: string
  candidate_slug: string
  news_count: number
  positive: number
  negative: number
}

interface TrendingNewsProps {
  className?: string
  limit?: number
  variant?: 'list' | 'grid'
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

export function TrendingNews({ className, limit = 5, variant = 'list' }: TrendingNewsProps) {
  const [news, setNews] = useState<NewsItem[]>([])
  const [candidateActivity, setCandidateActivity] = useState<CandidateActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchTrending() {
      try {
        const response = await fetch(`/api/news/trending?limit=${limit}`)
        if (response.ok) {
          const data = await response.json()
          setNews(data.trending || [])
          setCandidateActivity(data.stats?.candidateActivity || [])
        }
      } catch (error) {
        console.error('Error fetching trending news:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTrending()
  }, [limit])

  // Grid variant - full width with horizontal news cards
  if (variant === 'grid') {
    if (loading) {
      return (
        <Card className={cn('p-4 sm:p-6', className)}>
          <div className="animate-pulse">
            <div className="flex items-center justify-between mb-4">
              <div className="h-6 bg-[var(--muted)] w-1/4" />
              <div className="h-6 bg-[var(--muted)] w-1/6" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="p-4 bg-[var(--muted)] border-2 border-[var(--border)]">
                  <div className="h-4 bg-[var(--border)] w-full mb-2" />
                  <div className="h-4 bg-[var(--border)] w-3/4" />
                </div>
              ))}
            </div>
          </div>
        </Card>
      )
    }

    if (news.length === 0) return null

    return (
      <Card className={cn('p-4 sm:p-6', className)}>
        {/* Header with title and most mentioned */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[var(--primary)] border-2 border-[var(--border)] flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </div>
            <h2 className="text-lg font-black text-[var(--foreground)] uppercase">
              Noticias del Momento
            </h2>
          </div>

          {/* Most mentioned tags inline */}
          {candidateActivity.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto">
              <span className="text-xs font-bold text-[var(--muted-foreground)] uppercase whitespace-nowrap">
                Ahora hablan de:
              </span>
              {candidateActivity.slice(0, 4).map((candidate) => (
                <Link
                  key={candidate.candidate_slug}
                  href={`/candidato/${candidate.candidate_slug}`}
                  className={cn(
                    'inline-flex items-center gap-1 px-2 py-1',
                    'text-xs font-bold whitespace-nowrap',
                    'bg-[var(--muted)]',
                    'border-2 border-[var(--border)]',
                    'hover:bg-[var(--primary)] hover:text-white',
                    'transition-colors'
                  )}
                >
                  {candidate.candidate_name.split(' ').pop()}
                  <span className="text-[var(--muted-foreground)]">{candidate.news_count}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* News grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {news.map((item) => (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'group flex flex-col',
                'p-4',
                'bg-[var(--card)]',
                'border-3 border-[var(--border)]',
                'shadow-[var(--shadow-brutal-sm)]',
                'hover:-translate-x-1 hover:-translate-y-1',
                'hover:shadow-[var(--shadow-brutal)]',
                'transition-all duration-100'
              )}
            >
              {/* Source header */}
              <div className="flex items-center gap-2 mb-3 pb-2 border-b-2 border-[var(--border)]">
                <NewsSourceBadge source={item.source} size="sm" />
                <span className="text-[10px] font-black text-[var(--muted-foreground)] uppercase truncate">
                  {item.source.replace('news.google.com', 'Google News').replace('.com', '').replace('.pe', '')}
                </span>
                {item.published_at && (
                  <span className="text-[10px] font-bold text-[var(--muted-foreground)] ml-auto whitespace-nowrap">
                    {formatTimeAgo(item.published_at)}
                  </span>
                )}
              </div>

              {/* Title */}
              <p className="text-sm font-bold text-[var(--foreground)] line-clamp-3 group-hover:text-[var(--primary)] transition-colors flex-1">
                {item.title}
              </p>

              {/* Footer with candidate tag */}
              {item.candidate_name && (
                <div className="flex items-center gap-2 mt-3 pt-2 border-t border-[var(--border)]">
                  <span className={cn(
                    'inline-flex items-center px-2 py-1',
                    'text-[10px] font-black uppercase',
                    'bg-[var(--primary)] text-white',
                    'border-2 border-[var(--border)]'
                  )}>
                    {item.candidate_name.split(' ').pop()}
                  </span>
                  {item.sentiment && (
                    <NewsSentimentBadge sentiment={item.sentiment} size="sm" />
                  )}
                </div>
              )}
            </a>
          ))}
        </div>

        {/* View all button */}
        <div className="mt-4 pt-4 border-t-2 border-[var(--border)] flex justify-center">
          <Link href="/noticias">
            <Button variant="secondary" size="sm">
              Ver todas las noticias
              <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Button>
          </Link>
        </div>
      </Card>
    )
  }

  // List variant (default) - original vertical list in card
  if (loading) {
    return (
      <Card className={cn('animate-pulse', className)}>
        <CardHeader>
          <div className="h-6 bg-[var(--muted)] w-1/3" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-8 h-8 bg-[var(--muted)]" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-[var(--muted)] w-full" />
                  <div className="h-4 bg-[var(--muted)] w-3/4" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (news.length === 0) {
    return null
  }

  return (
    <Card className={cn('h-full', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[var(--primary)] border-2 border-[var(--border)] flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
          </div>
          Noticias del Momento
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Most active candidates this week */}
        {candidateActivity.length > 0 && (
          <div className="mb-4 pb-4 border-b-2 border-[var(--border)]">
            <p className="text-xs font-bold text-[var(--muted-foreground)] uppercase mb-2">
              Los más mencionados esta semana
            </p>
            <div className="flex flex-wrap gap-2">
              {candidateActivity.slice(0, 4).map((candidate) => (
                <Link
                  key={candidate.candidate_slug}
                  href={`/candidato/${candidate.candidate_slug}`}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-2 py-1',
                    'text-xs font-bold',
                    'bg-[var(--muted)]',
                    'border-2 border-[var(--border)]',
                    'hover:bg-[var(--primary)] hover:text-white',
                    'transition-colors'
                  )}
                >
                  <span>{candidate.candidate_name.split(' ').pop()}</span>
                  <span className="text-[var(--muted-foreground)]">{candidate.news_count}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* News list */}
        <div className="space-y-3">
          {news.map((item) => (
            <div key={item.id} className="flex gap-3 group">
              <NewsSourceBadge source={item.source} size="sm" />
              <div className="flex-1 min-w-0">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <p className="text-sm font-medium text-[var(--foreground)] line-clamp-2 group-hover:text-[var(--primary)] transition-colors">
                    {item.title}
                  </p>
                </a>
                <div className="flex items-center gap-2 mt-1">
                  {item.published_at && (
                    <span className="text-xs text-[var(--muted-foreground)]">
                      {formatTimeAgo(item.published_at)}
                    </span>
                  )}
                  {item.sentiment && (
                    <NewsSentimentBadge sentiment={item.sentiment} size="sm" />
                  )}
                  {item.candidate_name && item.candidate_slug && (
                    <Link
                      href={`/candidato/${item.candidate_slug}`}
                      className="text-xs font-bold text-[var(--primary)] hover:underline"
                    >
                      {item.candidate_name.split(' ').pop()}
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* View all link */}
        <div className="mt-4 pt-4 border-t-2 border-[var(--border)]">
          <Link href="/noticias">
            <Button variant="secondary" size="sm" className="w-full">
              Ver todas las noticias
              <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
