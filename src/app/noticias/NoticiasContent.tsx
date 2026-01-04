'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { NewsCard } from '@/components/news/NewsCard'

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

const SENTIMENT_LABELS: Record<string, string> = {
  positive: 'Positivo',
  neutral: 'Neutral',
  negative: 'Negativo',
}

const SENTIMENT_COLORS: Record<string, string> = {
  positive: 'bg-[var(--score-good)] text-white',
  neutral: 'bg-[var(--score-medium)] text-black',
  negative: 'bg-[var(--score-low)] text-white',
}

export function NoticiasContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

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
      {/* Filters */}
      <Card className="p-4 sm:p-6">
        {/* Search */}
        <form onSubmit={handleSearch} className="mb-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Buscar noticia..."
              className={cn(
                'flex-1 px-4 py-2',
                'bg-[var(--background)]',
                'border-2 border-[var(--border)]',
                'text-[var(--foreground)]',
                'placeholder:text-[var(--muted-foreground)]',
                'focus:outline-none focus:ring-2 focus:ring-[var(--primary)]'
              )}
            />
            <Button type="submit" variant="primary">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </Button>
          </div>
        </form>

        {/* Filter chips */}
        <div className="flex flex-wrap gap-2 sm:gap-3">
          {/* Source filter */}
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => updateFilters('fuente', '')}
              className={cn(
                'px-3 py-1 text-xs font-bold uppercase',
                'border-2 border-[var(--border)]',
                'transition-colors',
                !currentSource
                  ? 'bg-[var(--foreground)] text-[var(--background)]'
                  : 'bg-[var(--background)] text-[var(--foreground)] hover:bg-[var(--muted)]'
              )}
            >
              Todos
            </button>
            {sources.slice(0, 6).map((source) => (
              <button
                key={source.name}
                onClick={() => updateFilters('fuente', source.name)}
                className={cn(
                  'px-3 py-1 text-xs font-bold uppercase',
                  'border-2 border-[var(--border)]',
                  'transition-colors',
                  currentSource === source.name
                    ? 'bg-[var(--foreground)] text-[var(--background)]'
                    : 'bg-[var(--background)] text-[var(--foreground)] hover:bg-[var(--muted)]'
                )}
              >
                {source.name.length > 10 ? source.name.slice(0, 10) + '...' : source.name}
              </button>
            ))}
          </div>

          <div className="w-px bg-[var(--border)] hidden sm:block" />

          {/* Sentiment filter */}
          <div className="flex gap-1">
            {['positive', 'neutral', 'negative'].map((sentiment) => (
              <button
                key={sentiment}
                onClick={() => updateFilters('sentimiento', currentSentiment === sentiment ? '' : sentiment)}
                className={cn(
                  'px-2 py-1 text-xs font-bold',
                  'border-2 border-[var(--border)]',
                  'transition-colors',
                  currentSentiment === sentiment
                    ? SENTIMENT_COLORS[sentiment]
                    : 'bg-[var(--background)] text-[var(--foreground)] hover:bg-[var(--muted)]'
                )}
              >
                {sentiment === 'positive' && '+'}
                {sentiment === 'neutral' && '~'}
                {sentiment === 'negative' && '-'}
              </button>
            ))}
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className={cn(
                'px-3 py-1 text-xs font-bold uppercase',
                'border-2 border-[var(--border)]',
                'bg-[var(--score-low)] text-white',
                'hover:opacity-90 transition-opacity'
              )}
            >
              Limpiar
            </button>
          )}
        </div>

        {/* Active filters summary */}
        {hasActiveFilters && (
          <div className="mt-3 pt-3 border-t-2 border-[var(--border)] flex items-center gap-2 text-sm">
            <span className="text-[var(--muted-foreground)]">Filtros:</span>
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

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--muted-foreground)]">
          {loading ? 'Cargando...' : `${pagination.total} noticias encontradas`}
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
          <p className="font-bold text-[var(--foreground)]">No se encontraron noticias</p>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            Intenta con otros filtros o busqueda
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
        <Card className="p-4 flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(pagination.page - 1)}
            disabled={pagination.page <= 1}
          >
            Anterior
          </Button>

          <div className="flex items-center gap-1">
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
                  className={cn(
                    'w-8 h-8 text-sm font-bold',
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
            size="sm"
            onClick={() => goToPage(pagination.page + 1)}
            disabled={!pagination.hasMore}
          >
            Siguiente
          </Button>
        </Card>
      )}

      {/* Disclaimer */}
      <p className="text-xs text-[var(--muted-foreground)] text-center">
        Ranking Electoral es un agregador de noticias. Los articulos pertenecen a sus respectivos medios.
      </p>
    </div>
  )
}
