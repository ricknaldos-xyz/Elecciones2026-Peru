'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { AIBadge } from '@/components/ui/AIBadge'
import { cn } from '@/lib/utils'

interface SocialStats {
  total_mentions: number
  twitter_mentions: number
  tiktok_mentions: number
  youtube_mentions: number
  positive_mentions: number
  negative_mentions: number
  neutral_mentions: number
  total_engagement: number
  total_views: number
}

interface SocialMention {
  platform: string
  author_handle: string
  author_name: string
  content: string
  url: string
  like_count: number
  comment_count: number
  share_count: number
  view_count: number
  engagement_total: number
  sentiment: string
  ai_summary: string | null
  published_at: string
}

interface SocialData {
  stats: SocialStats
  mentions: SocialMention[]
}

interface SocialMentionsCardProps {
  candidateId: string
}

const PLATFORM_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  twitter: { label: 'Twitter', color: '#1DA1F2', bg: 'bg-[#1DA1F2]' },
  youtube: { label: 'YouTube', color: '#FF0000', bg: 'bg-[#FF0000]' },
  tiktok: { label: 'TikTok', color: '#000000', bg: 'bg-black' },
}

function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return n.toString()
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('es-PE', {
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return dateStr
  }
}

export function SocialMentionsCard({ candidateId }: SocialMentionsCardProps) {
  const t = useTranslations('social')
  const [data, setData] = useState<SocialData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/candidates/${candidateId}/social-mentions`)
        if (!res.ok) {
          setData(null)
          return
        }
        const json = await res.json()
        setData(json)
      } catch {
        setData(null)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [candidateId])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="square" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
            {t('title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-[var(--muted)] rounded w-3/4"></div>
            <div className="h-4 bg-[var(--muted)] rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data || data.stats.total_mentions === 0) {
    return null
  }

  const { stats, mentions } = data
  const totalSentiment = stats.positive_mentions + stats.negative_mentions + stats.neutral_mentions

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="square" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
          </svg>
          {t('title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 bg-[var(--muted)] border-2 border-[var(--border)] text-center">
            <div className="text-2xl font-black text-[var(--foreground)]">{formatNumber(stats.total_mentions)}</div>
            <div className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase">{t('mentions')}</div>
          </div>
          <div className="p-3 bg-[var(--muted)] border-2 border-[var(--border)] text-center">
            <div className="text-2xl font-black text-[var(--foreground)]">{formatNumber(stats.total_engagement)}</div>
            <div className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase">{t('engagement')}</div>
          </div>
          <div className="p-3 bg-[var(--muted)] border-2 border-[var(--border)] text-center">
            <div className="text-2xl font-black text-[var(--foreground)]">{formatNumber(stats.total_views)}</div>
            <div className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase">{t('views')}</div>
          </div>
        </div>

        {/* Platform breakdown */}
        <div className="flex gap-2">
          {stats.twitter_mentions > 0 && (
            <div className="flex items-center gap-1.5 px-2 py-1 border-2 border-[var(--border)] bg-[var(--muted)]">
              <div className="w-3 h-3 bg-[#1DA1F2]" />
              <span className="text-xs font-black">{stats.twitter_mentions}</span>
            </div>
          )}
          {stats.youtube_mentions > 0 && (
            <div className="flex items-center gap-1.5 px-2 py-1 border-2 border-[var(--border)] bg-[var(--muted)]">
              <div className="w-3 h-3 bg-[#FF0000]" />
              <span className="text-xs font-black">{stats.youtube_mentions}</span>
            </div>
          )}
          {stats.tiktok_mentions > 0 && (
            <div className="flex items-center gap-1.5 px-2 py-1 border-2 border-[var(--border)] bg-[var(--muted)]">
              <div className="w-3 h-3 bg-black dark:bg-white" />
              <span className="text-xs font-black">{stats.tiktok_mentions}</span>
            </div>
          )}
        </div>

        {/* Sentiment bar */}
        {totalSentiment > 0 && (
          <div>
            <h4 className="text-xs font-black uppercase text-[var(--muted-foreground)] mb-1">{t('sentiment')}</h4>
            <div className="h-3 border-2 border-[var(--border)] flex overflow-hidden">
              {stats.positive_mentions > 0 && (
                <div
                  className="bg-green-500 h-full"
                  style={{ width: `${(stats.positive_mentions / totalSentiment) * 100}%` }}
                  title={`${t('positive')}: ${stats.positive_mentions}`}
                />
              )}
              {stats.neutral_mentions > 0 && (
                <div
                  className="bg-gray-400 h-full"
                  style={{ width: `${(stats.neutral_mentions / totalSentiment) * 100}%` }}
                  title={`${t('neutral')}: ${stats.neutral_mentions}`}
                />
              )}
              {stats.negative_mentions > 0 && (
                <div
                  className="bg-red-500 h-full"
                  style={{ width: `${(stats.negative_mentions / totalSentiment) * 100}%` }}
                  title={`${t('negative')}: ${stats.negative_mentions}`}
                />
              )}
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px] font-bold text-green-600">{t('positive')} ({stats.positive_mentions})</span>
              <span className="text-[10px] font-bold text-gray-500">{t('neutral')} ({stats.neutral_mentions})</span>
              <span className="text-[10px] font-bold text-red-600">{t('negative')} ({stats.negative_mentions})</span>
            </div>
          </div>
        )}

        {/* Top mentions */}
        {mentions.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-black uppercase text-[var(--muted-foreground)]">
              {t('topMentions')}
            </h4>
            {mentions.map((mention, idx) => {
              const platform = PLATFORM_CONFIG[mention.platform] || { label: mention.platform, color: '#666', bg: 'bg-gray-500' }
              return (
                <div key={idx} className="p-3 border-2 border-[var(--border)] bg-[var(--background)]">
                  <div className="flex items-center gap-2 mb-1">
                    <div className={cn('w-3 h-3', platform.bg)} />
                    <span className="text-xs font-black">{mention.author_name || mention.author_handle}</span>
                    <span className="text-[10px] text-[var(--muted-foreground)] ml-auto">
                      {formatDate(mention.published_at)}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--foreground)] mb-2 line-clamp-3">
                    {mention.ai_summary ? (
                      <>
                        {mention.ai_summary}
                        <AIBadge className="ml-1 inline-flex" />
                      </>
                    ) : (
                      mention.content
                    )}
                  </p>
                  <div className="flex items-center gap-3 text-[10px] text-[var(--muted-foreground)]">
                    {mention.like_count > 0 && <span className="font-bold">{formatNumber(mention.like_count)} likes</span>}
                    {mention.comment_count > 0 && <span className="font-bold">{formatNumber(mention.comment_count)} comments</span>}
                    {mention.view_count > 0 && <span className="font-bold">{formatNumber(mention.view_count)} views</span>}
                    {mention.url && (
                      <a
                        href={mention.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-auto text-[var(--primary)] font-bold hover:underline"
                      >
                        {t('view')}
                      </a>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
