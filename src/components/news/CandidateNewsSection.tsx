'use client'

import { useState, useEffect } from 'react'
import { Link } from '@/i18n/routing'
import { useTranslations, useLocale } from 'next-intl'
import { cn } from '@/lib/utils'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { NewsSentimentBadge } from './NewsSentimentBadge'
import { NewsSourceBadge } from './NewsSourceBadge'

interface NewsItem {
  id: string
  title: string
  url: string
  excerpt: string | null
  source: string
  published_at: string | null
  sentiment: string | null
  relevance_score: number | null
}

interface CandidateNewsSectionProps {
  candidateSlug: string
  candidateName: string
  className?: string
}

export function CandidateNewsSection({
  candidateSlug,
  candidateName,
  className,
}: CandidateNewsSectionProps) {
  const t = useTranslations('candidateNews')
  const tNews = useTranslations('news')
  const tCommon = useTranslations('common')
  const locale = useLocale()
  const [news, setNews] = useState<NewsItem[]>([])
  const [sentimentSummary, setSentimentSummary] = useState<Record<string, number>>({})
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  function formatTimeAgo(dateString: string | null | undefined): string {
    if (!dateString) return ''

    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 60) return tNews('timeAgo.minutes', { count: diffMins })
    if (diffHours < 24) return tNews('timeAgo.hours', { count: diffHours })
    if (diffDays < 7) return tNews('timeAgo.days', { count: diffDays })

    const monthKeys = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
    const monthKey = monthKeys[date.getMonth()]
    return `${date.getDate()} ${tCommon(`months.${monthKey}`)}`
  }

  useEffect(() => {
    async function fetchNews() {
      try {
        const response = await fetch(`/api/news/by-candidate/${candidateSlug}?limit=5`)
        if (response.ok) {
          const data = await response.json()
          setNews(data.news)
          setSentimentSummary(data.sentimentSummary || {})
          setTotal(data.total || 0)
        }
      } catch (error) {
        console.error('Error fetching candidate news:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchNews()
  }, [candidateSlug])

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
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <svg className="w-5 h-5 text-[var(--primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
            {t('title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[var(--muted-foreground)]">
            {t('noRecentNews', { name: candidateName })}
          </p>
        </CardContent>
      </Card>
    )
  }

  const positiveCount = sentimentSummary.positive || 0
  const neutralCount = sentimentSummary.neutral || 0
  const negativeCount = sentimentSummary.negative || 0

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-[var(--primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
            {t('title')}
          </div>
          <span className="text-xs font-medium text-[var(--muted-foreground)]">
            {t('mentions', { count: total })}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Sentiment Summary */}
        {total > 0 && (
          <div className="flex items-center gap-3 mb-4 pb-4 border-b-2 border-[var(--border)]">
            <span className="text-xs font-bold text-[var(--muted-foreground)] uppercase">{t('sentiment')}</span>
            <div className="flex items-center gap-2">
              {positiveCount > 0 && (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-[var(--score-good)]">
                  <span className="w-2 h-2 bg-[var(--score-good)]" />
                  {positiveCount}
                </span>
              )}
              {neutralCount > 0 && (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-[var(--score-medium)]">
                  <span className="w-2 h-2 bg-[var(--score-medium)]" />
                  {neutralCount}
                </span>
              )}
              {negativeCount > 0 && (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-[var(--score-low)]">
                  <span className="w-2 h-2 bg-[var(--score-low)]" />
                  {negativeCount}
                </span>
              )}
            </div>
          </div>
        )}

        {/* News List */}
        <div className="space-y-3">
          {news.map((item) => (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'flex gap-3 p-2 -mx-2',
                'transition-colors',
                'hover:bg-[var(--muted)]',
                'group'
              )}
            >
              <NewsSourceBadge source={item.source} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--foreground)] line-clamp-2 group-hover:text-[var(--primary)] transition-colors">
                  {item.title}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {item.published_at && (
                    <span className="text-xs text-[var(--muted-foreground)]">
                      {formatTimeAgo(item.published_at)}
                    </span>
                  )}
                  {item.sentiment && (
                    <NewsSentimentBadge sentiment={item.sentiment} size="sm" />
                  )}
                </div>
              </div>
            </a>
          ))}
        </div>

        {/* View all link */}
        {total > 5 && (
          <div className="mt-4 pt-4 border-t-2 border-[var(--border)]">
            <Link href={`/noticias?candidato=${candidateSlug}`}>
              <Button variant="outline" size="sm" className="w-full">
                {t('viewAll', { count: total })}
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
