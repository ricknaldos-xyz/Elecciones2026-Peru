'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

interface MetaAdSummary {
  total_ads: number
  total_spent_lower: number
  total_spent_upper: number
  total_spent_mid: number
  currency: string
  pages_count: number
  earliest_period: string
  latest_period: string
  disclaimers: string[]
}

interface MetaAdPageInfo {
  page_name: string
  page_id: string
  is_candidate_page: boolean
  total_ads: number
  amount_spent_mid: number
}

interface MetaAdData {
  summary: MetaAdSummary | null
  pages: MetaAdPageInfo[]
  party_total_spent_mid: number | null
  party_name: string | null
}

interface MetaAdSpendingCardProps {
  candidateId: string
}

function formatCurrency(amount: number, currency: string = 'PEN'): string {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return n.toString()
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-PE', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

export function MetaAdSpendingCard({ candidateId }: MetaAdSpendingCardProps) {
  const t = useTranslations('metaAds')
  const [data, setData] = useState<MetaAdData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/candidates/${candidateId}/meta-ads`)
        if (!res.ok) {
          setData(null)
          return
        }
        setData(await res.json())
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
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            {t('title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-16 bg-[var(--muted)]"></div>
            <div className="grid grid-cols-2 gap-2">
              <div className="h-12 bg-[var(--muted)]"></div>
              <div className="h-12 bg-[var(--muted)]"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data?.summary) return null

  const { summary, pages, party_total_spent_mid, party_name } = data
  const showRange = summary.total_spent_lower !== summary.total_spent_upper

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
          {t('title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {/* Total spending */}
        <div className="text-center p-4 bg-[var(--muted)] border-2 border-[var(--border)]">
          <div className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase mb-1">
            {t('totalSpent')}
          </div>
          <div className="text-2xl font-black text-[var(--foreground)]">
            {showRange
              ? `${formatCurrency(summary.total_spent_lower, summary.currency)} - ${formatCurrency(summary.total_spent_upper, summary.currency)}`
              : formatCurrency(summary.total_spent_mid, summary.currency)}
          </div>
          <div className="text-[10px] text-[var(--muted-foreground)] font-medium mt-1">
            {formatDate(summary.earliest_period)} - {formatDate(summary.latest_period)}
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-3 bg-[var(--muted)] border-2 border-[var(--border)] text-center">
            <div className="text-2xl font-black text-[var(--foreground)]">{formatNumber(summary.total_ads)}</div>
            <div className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase">{t('ads')}</div>
          </div>
          <div className="p-3 bg-[var(--muted)] border-2 border-[var(--border)] text-center">
            <div className="text-2xl font-black text-[var(--foreground)]">{summary.pages_count}</div>
            <div className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase">{t('pages')}</div>
          </div>
        </div>

        {/* Party comparison bar */}
        {party_total_spent_mid != null && party_total_spent_mid > 0 && (
          <div>
            <div className="text-[10px] font-black uppercase text-[var(--muted-foreground)] mb-1">
              {t('vsParty', { party: party_name || '' })}
            </div>
            <div className="h-3 border-2 border-[var(--border)] overflow-hidden bg-[var(--background)]">
              <div
                className="bg-[var(--primary)] h-full transition-all duration-300"
                style={{
                  width: `${Math.min((summary.total_spent_mid / party_total_spent_mid) * 100, 100)}%`,
                }}
              />
            </div>
            <div className="flex justify-between mt-1 text-[10px] font-bold text-[var(--muted-foreground)]">
              <span>{t('candidate')}: {formatCurrency(summary.total_spent_mid, summary.currency)}</span>
              <span>{t('partyTotal')}: {formatCurrency(party_total_spent_mid, summary.currency)}</span>
            </div>
          </div>
        )}

        {/* Per-page breakdown */}
        {pages.length > 1 && (
          <div className="space-y-2">
            <div className="text-[10px] font-black uppercase text-[var(--muted-foreground)]">
              {t('pageBreakdown')}
            </div>
            {pages.map((page) => (
              <div
                key={page.page_id}
                className="flex items-center justify-between p-2 border-2 border-[var(--border)] bg-[var(--background)]"
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black">{page.page_name}</span>
                  {!page.is_candidate_page && (
                    <Badge variant="outline" size="sm">
                      {t('partyPage')}
                    </Badge>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-xs font-black">
                    {formatCurrency(page.amount_spent_mid, summary.currency)}
                  </div>
                  <div className="text-[10px] text-[var(--muted-foreground)]">
                    {formatNumber(page.total_ads)} {t('ads')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Disclaimers */}
        {summary.disclaimers.length > 0 && (
          <div>
            <div className="text-[10px] font-black uppercase text-[var(--muted-foreground)] mb-1">
              {t('fundedBy')}
            </div>
            <div className="flex flex-wrap gap-1">
              {summary.disclaimers.map((d, i) => (
                <Badge key={i} variant="outline" size="sm">
                  {d}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Source link */}
        <div className="text-center pt-2 border-t-2 border-[var(--border)]">
          <a
            href="https://www.facebook.com/ads/library/?active_status=all&ad_type=political_and_issue_ads&country=PE"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] font-bold text-[var(--primary)] hover:underline uppercase"
          >
            {t('viewOnMeta')}
          </a>
        </div>
      </CardContent>
    </Card>
  )
}
