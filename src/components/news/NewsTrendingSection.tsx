'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/Card'
import { NewsSourceBadge } from './NewsSourceBadge'

interface CandidateActivity {
  candidate_name: string
  candidate_slug: string
  news_count: number
  positive: number
  negative: number
}

interface SourceDistribution {
  source: string
  count: number
}

interface TrendingData {
  stats: {
    candidateActivity: CandidateActivity[]
    sourceDistribution: SourceDistribution[]
  }
}

export function NewsTrendingSection() {
  const t = useTranslations('news')
  const [data, setData] = useState<TrendingData | null>(null)

  useEffect(() => {
    fetch('/api/news/trending?limit=5')
      .then(res => res.ok ? res.json() : null)
      .then(d => {
        if (d?.stats?.candidateActivity?.length > 0) setData(d)
      })
      .catch(() => {})
  }, [])

  if (!data) return null

  const { candidateActivity, sourceDistribution } = data.stats
  const maxCount = Math.max(...candidateActivity.map(c => Number(c.news_count)), 1)

  return (
    <Card className="overflow-hidden">
      <div className="bg-[var(--foreground)] text-[var(--background)] px-5 py-3 flex items-center gap-2">
        <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="square" strokeLinejoin="miter" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
        <h3 className="font-black uppercase text-sm tracking-wide">
          {t('trending')}
        </h3>
        <span className="text-xs font-medium opacity-70 ml-auto">7d</span>
      </div>

      <div className="p-5 space-y-5">
        {/* Top mentioned candidates */}
        {candidateActivity.length > 0 && (
          <div>
            <h4 className="text-xs font-black text-[var(--muted-foreground)] uppercase tracking-wide mb-3">
              {t('byCandidate')}
            </h4>
            <div className="space-y-2.5">
              {candidateActivity.map((c) => {
                const total = Number(c.news_count)
                const pos = Number(c.positive)
                const neg = Number(c.negative)
                const neutral = total - pos - neg
                const barWidth = (total / maxCount) * 100

                return (
                  <Link
                    key={c.candidate_slug}
                    href={`/candidato/${c.candidate_slug}`}
                    className="block group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-sm font-bold text-[var(--foreground)] truncate group-hover:text-[var(--primary)] transition-colors">
                            {c.candidate_name}
                          </span>
                          <span className="text-xs font-black text-[var(--muted-foreground)] flex-shrink-0">
                            {total}
                          </span>
                        </div>
                        <div className="h-2.5 bg-[var(--muted)] border border-[var(--border)] overflow-hidden">
                          <div className="h-full flex" style={{ width: `${barWidth}%` }}>
                            {pos > 0 && (
                              <div
                                className="h-full bg-[var(--score-good)]"
                                style={{ width: `${(pos / total) * 100}%` }}
                              />
                            )}
                            {neutral > 0 && (
                              <div
                                className="h-full bg-[var(--score-medium)]"
                                style={{ width: `${(neutral / total) * 100}%` }}
                              />
                            )}
                            {neg > 0 && (
                              <div
                                className="h-full bg-[var(--score-low)]"
                                style={{ width: `${(neg / total) * 100}%` }}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
            <div className="flex items-center gap-3 mt-2 text-xs text-[var(--muted-foreground)]">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-[var(--score-good)]" />
                {t('sentiment.positive')}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-[var(--score-medium)]" />
                {t('sentiment.neutral')}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-[var(--score-low)]" />
                {t('sentiment.negative')}
              </span>
            </div>
          </div>
        )}

        {/* Active sources */}
        {sourceDistribution.length > 0 && (
          <div className={cn(candidateActivity.length > 0 && 'pt-4 border-t-2 border-[var(--border)]')}>
            <h4 className="text-xs font-black text-[var(--muted-foreground)] uppercase tracking-wide mb-3">
              {t('sources')} (24h)
            </h4>
            <div className="flex flex-wrap gap-2">
              {sourceDistribution.map((s) => (
                <div
                  key={s.source}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--muted)] border-2 border-[var(--border)]"
                >
                  <NewsSourceBadge source={s.source} size="sm" />
                  <span className="text-xs font-bold text-[var(--foreground)] uppercase">
                    {s.source}
                  </span>
                  <span className="text-xs font-black text-[var(--primary)]">
                    {Number(s.count)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
