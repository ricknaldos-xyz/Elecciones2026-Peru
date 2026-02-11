'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/routing'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { NewsCard } from '@/components/news/NewsCard'
import { NewsTrendingSection } from '@/components/news/NewsTrendingSection'

interface NewsItem {
  id: string
  title: string
  url: string
  excerpt: string | null
  source: string
  published_at: string | null
  sentiment: string | null
  relevance_score: number | null
  keywords: string[] | null
  candidate_name: string | null
  candidate_slug: string | null
  candidate_cargo: string | null
  party_name: string | null
  party_short_name: string | null
}

interface FilterSource {
  name: string
  count: number
}

interface NewsResponse {
  news: NewsItem[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasMore: boolean
  }
  filters: {
    sources: FilterSource[]
    sentiments: string[]
  }
}

const SENTIMENT_COLORS: Record<string, string> = {
  positive: 'bg-[var(--score-good)] text-white',
  neutral: 'bg-[var(--score-medium)] text-black',
  negative: 'bg-[var(--score-low)] text-white',
}

export function NoticiasContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const t = useTranslations('news')

  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasMore: false,
  })
  const [sources, setSources] = useState<FilterSource[]>([])

  // Filter state from URL params
  const currentSource = searchParams.get('fuente') || ''
  const currentSentiment = searchParams.get('sentimiento') || ''
  const currentSearch = searchParams.get('q') || ''
  const currentPage = parseInt(searchParams.get('page') || '1', 10)

  const [searchInput, setSearchInput] = useState(currentSearch)

  // Sentiment labels from translations
  const SENTIMENT_LABELS: Record<string, string> = {
    positive: t('sentiment.positive'),
    neutral: t('sentiment.neutral'),
    negative: t('sentiment.negative'),
  }

  // Tone labels for mobile
  const TONE_LABELS: Record<string, string> = {
    positive: t('tonePositive'),
    neutral: t('toneNeutral'),
    negative: t('toneNegative'),
  }

  const fetchNews = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', currentPage.toString())
      if (currentSource) params.set('fuente', currentSource)
      if (currentSentiment) params.set('sentimiento', currentSentiment)
      if (currentSearch) params.set('q', currentSearch)

      const response = await fetch(`/api/news?${params.toString()}`)
      if (response.ok) {
        const data: NewsResponse = await response.json()
        setNews(data.news)
        setPagination(data.pagination)
        setSources(data.filters.sources)
      }
    } catch (error) {
      console.error('Error fetching news:', error)
    } finally {
      setLoading(false)
    }
  }, [currentPage, currentSource, currentSentiment, currentSearch])

  useEffect(() => {
    fetchNews()
  }, [fetchNews])

  const updateFilters = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.delete('page') // Reset to page 1 when filters change
    router.push(`/noticias?${params.toString()}`)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    updateFilters('q', searchInput)
  }

  const clearFilters = () => {
    router.push('/noticias')
    setSearchInput('')
  }

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', page.toString())
    router.push(`/noticias?${params.toString()}`)
  }

  const hasActiveFilters = currentSource || currentSentiment || currentSearch

  return (
    <div className="space-y-6">
      {/* Trending Section */}
      <NewsTrendingSection />

      {/* Filters */}
      <Card className="p-5 sm:p-6">
        {/* Search */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className={cn(
                'flex-1 px-4 py-3 text-base',
                'bg-[var(--background)]',
                'border-2 border-[var(--border)]',
                'text-[var(--foreground)]',
                'placeholder:text-[var(--muted-foreground)]',
                'focus:outline-none focus:ring-2 focus:ring-[var(--primary)]',
                'min-h-[48px]'
              )}
            />
            <Button type="submit" variant="primary" className="px-4 min-h-[48px] min-w-[48px]">
              <svg className="w-5 h-5 sm:mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="hidden sm:inline font-bold">{t('search')}</span>
            </Button>
          </div>
        </form>

        {/* Source Filters - Horizontal scroll en movil */}
        <div className="mb-4">
          <h3 className="text-xs font-black text-[var(--muted-foreground)] uppercase tracking-wide mb-3">
            {t('filterBySource')}
          </h3>
          <div className="overflow-x-auto -mx-5 px-5 sm:mx-0 sm:px-0">
            <div className="flex gap-2 pb-2 sm:flex-wrap">
              <button
                onClick={() => updateFilters('fuente', '')}
                className={cn(
                  'px-4 py-2.5 text-sm font-bold uppercase whitespace-nowrap',
                  'border-2 border-[var(--border)]',
                  'transition-all duration-100',
                  'min-h-[44px]',
                  !currentSource
                    ? 'bg-[var(--foreground)] text-[var(--background)]'
                    : 'bg-[var(--background)] text-[var(--foreground)] hover:bg-[var(--muted)]'
                )}
              >
                {t('allSources')}
              </button>
              {sources.slice(0, 8).map((source) => (
                <button
                  key={source.name}
                  onClick={() => updateFilters('fuente', source.name)}
                  className={cn(
                    'px-4 py-2.5 text-sm font-bold uppercase whitespace-nowrap',
                    'border-2 border-[var(--border)]',
                    'transition-all duration-100',
                    'min-h-[44px]',
                    currentSource === source.name
                      ? 'bg-[var(--foreground)] text-[var(--background)]'
                      : 'bg-[var(--background)] text-[var(--foreground)] hover:bg-[var(--muted)]'
                  )}
                >
                  {source.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sentiment Filter - Con labels en movil */}
        <div className="mb-4">
          <h3 className="text-xs font-black text-[var(--muted-foreground)] uppercase tracking-wide mb-3">
            {t('filterByTone')}
          </h3>
          <div className="flex gap-2 flex-wrap">
            {['positive', 'neutral', 'negative'].map((sentiment) => (
              <button
                key={sentiment}
                onClick={() => updateFilters('sentimiento', currentSentiment === sentiment ? '' : sentiment)}
                className={cn(
                  'px-4 py-2.5 text-sm font-bold',
                  'border-2 border-[var(--border)]',
                  'transition-all duration-100',
                  'min-h-[44px]',
                  currentSentiment === sentiment
                    ? SENTIMENT_COLORS[sentiment]
                    : 'bg-[var(--background)] text-[var(--foreground)] hover:bg-[var(--muted)]'
                )}
              >
                <span className="sm:hidden">
                  {TONE_LABELS[sentiment]}
                </span>
                <span className="hidden sm:inline">
                  {SENTIMENT_LABELS[sentiment]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <div className="pt-4 border-t-2 border-[var(--border)]">
            <button
              onClick={clearFilters}
              className={cn(
                'w-full sm:w-auto px-4 py-2.5 text-sm font-bold uppercase',
                'border-2 border-[var(--border)]',
                'bg-[var(--score-low)] text-white',
                'hover:opacity-90 transition-opacity',
                'min-h-[44px]'
              )}
            >
              {t('clearFilters')}
            </button>
          </div>
        )}

        {/* Active filters summary */}
        {hasActiveFilters && (
          <div className="mt-3 pt-3 border-t-2 border-[var(--border)] flex items-center gap-2 text-sm">
            <span className="text-[var(--muted-foreground)]">{t('viewing')}</span>
            {currentSource && (
              <span className="px-2 py-0.5 bg-[var(--muted)] border border-[var(--border)] text-xs font-medium">
                {currentSource}
              </span>
            )}
            {currentSentiment && (
              <span className={cn(
                'px-2 py-0.5 border border-[var(--border)] text-xs font-medium',
                SENTIMENT_COLORS[currentSentiment]
              )}>
                {SENTIMENT_LABELS[currentSentiment]}
              </span>
            )}
            {currentSearch && (
              <span className="px-2 py-0.5 bg-[var(--muted)] border border-[var(--border)] text-xs font-medium">
                &quot;{currentSearch}&quot;
              </span>
            )}
          </div>
        )}
      </Card>

      {/* Aria-live region for search results */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {!loading && news.length > 0 && `${pagination.total || news.length} noticias encontradas`}
        {!loading && news.length === 0 && 'No se encontraron noticias'}
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--muted-foreground)]">
          {loading ? t('loading') : t('newsFound', { count: pagination.total })}
        </p>
      </div>

      {/* News grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-12 bg-[var(--muted)]" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-[var(--muted)] w-3/4" />
                <div className="h-4 bg-[var(--muted)] w-full" />
                <div className="h-4 bg-[var(--muted)] w-1/2" />
              </div>
              <div className="h-8 bg-[var(--muted)]" />
            </Card>
          ))}
        </div>
      ) : news.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-[var(--muted)] border-2 border-[var(--border)] flex items-center justify-center">
            <svg className="w-8 h-8 text-[var(--muted-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
          </div>
          <p className="font-bold text-[var(--foreground)]">{t('noResults')}</p>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            {t('tryOtherFilter')}
          </p>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {news.map((item) => (
            <NewsCard
              key={item.id}
              id={item.id}
              title={item.title}
              url={item.url}
              excerpt={item.excerpt}
              source={item.source}
              published_at={item.published_at}
              sentiment={item.sentiment}
              candidate_name={item.candidate_name}
              candidate_slug={item.candidate_slug}
              candidate_cargo={item.candidate_cargo}
              party_name={item.party_name}
              party_short_name={item.party_short_name}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <Card className="p-4 flex items-center justify-center gap-2 sm:gap-3">
          <Button
            variant="outline"
            onClick={() => goToPage(pagination.page - 1)}
            disabled={pagination.page <= 1}
            className="min-h-[44px] px-4"
            aria-label="Página anterior"
          >
            <span className="hidden sm:inline">{t('previous')}</span>
            <span className="sm:hidden">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </span>
          </Button>

          <div className="flex items-center gap-1 sm:gap-2">
            {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
              let pageNum: number
              if (pagination.totalPages <= 5) {
                pageNum = i + 1
              } else if (pagination.page <= 3) {
                pageNum = i + 1
              } else if (pagination.page >= pagination.totalPages - 2) {
                pageNum = pagination.totalPages - 4 + i
              } else {
                pageNum = pagination.page - 2 + i
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => goToPage(pageNum)}
                  aria-label={`Página ${pageNum}`}
                  aria-current={pagination.page === pageNum ? 'page' : undefined}
                  className={cn(
                    'min-w-[44px] min-h-[44px] px-3 text-sm font-bold',
                    'border-2 border-[var(--border)]',
                    'transition-colors',
                    pagination.page === pageNum
                      ? 'bg-[var(--primary)] text-white'
                      : 'bg-[var(--background)] text-[var(--foreground)] hover:bg-[var(--muted)]'
                  )}
                >
                  {pageNum}
                </button>
              )
            })}
          </div>

          <Button
            variant="outline"
            onClick={() => goToPage(pagination.page + 1)}
            disabled={!pagination.hasMore}
            className="min-h-[44px] px-4"
            aria-label="Página siguiente"
          >
            <span className="hidden sm:inline">{t('next')}</span>
            <span className="sm:hidden">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </Button>
        </Card>
      )}

      {/* Disclaimer */}
      <p className="text-xs text-[var(--muted-foreground)] text-center">
        {t('disclaimer')}
      </p>
    </div>
  )
}
