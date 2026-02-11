'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from '@/i18n/routing'
import { useTranslations } from 'next-intl'
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

interface PartyWithFinance {
  party: {
    id: string
    name: string
    short_name: string | null
    logo_url: string | null
    color: string | null
  }
  latestFinance: {
    year: number
    public_funding: number
    private_funding_total: number
    donor_count: number
    total_income: number
    total_expenses: number
  } | null
}

function generatePartySlug(party: { name: string; short_name: string | null }): string {
  return (party.short_name || party.name)
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatCompact(amount: number): string {
  if (amount >= 1_000_000) return `S/ ${(amount / 1_000_000).toFixed(1)}M`
  if (amount >= 1_000) return `S/ ${(amount / 1_000).toFixed(0)}K`
  return formatCurrency(amount)
}

export function TransparencyContent() {
  const router = useRouter()
  const t = useTranslations('transparency')
  const tCommon = useTranslations('common')
  const [parties, setParties] = useState<PartyWithFinance[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/parties/finances')
        if (!response.ok) throw new Error('Error fetching data')
        const data = await response.json()
        setParties(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'unknown')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const partiesWithFinance = useMemo(
    () => parties.filter((p): p is PartyWithFinance & { latestFinance: NonNullable<PartyWithFinance['latestFinance']> } => p.latestFinance !== null),
    [parties]
  )

  // Sorted views
  const sortedByIncome = useMemo(
    () => [...partiesWithFinance].sort((a, b) => b.latestFinance.total_income - a.latestFinance.total_income),
    [partiesWithFinance]
  )
  const sortedByDonors = useMemo(
    () => [...partiesWithFinance].sort((a, b) => b.latestFinance.donor_count - a.latestFinance.donor_count),
    [partiesWithFinance]
  )

  // Aggregate totals
  const totals = useMemo(() => {
    return partiesWithFinance.reduce((acc, p) => {
      acc.publicFunding += p.latestFinance.public_funding
      acc.privateFunding += p.latestFinance.private_funding_total
      acc.totalDonors += p.latestFinance.donor_count
      acc.totalIncome += p.latestFinance.total_income
      acc.totalExpenses += p.latestFinance.total_expenses
      return acc
    }, { publicFunding: 0, privateFunding: 0, totalDonors: 0, totalIncome: 0, totalExpenses: 0 })
  }, [partiesWithFinance])

  const publicPct = totals.totalIncome > 0 ? (totals.publicFunding / totals.totalIncome) * 100 : 0
  const privatePct = totals.totalIncome > 0 ? (totals.privateFunding / totals.totalIncome) * 100 : 0
  const maxIncome = sortedByIncome.length > 0 ? sortedByIncome[0].latestFinance.total_income : 1

  // Key insights
  const insights = useMemo(() => {
    if (partiesWithFinance.length === 0) return null
    const mostPublic = [...partiesWithFinance].sort((a, b) => b.latestFinance.public_funding - a.latestFinance.public_funding)[0]
    const mostPrivate = [...partiesWithFinance].sort((a, b) => b.latestFinance.private_funding_total - a.latestFinance.private_funding_total)[0]
    const mostDonors = sortedByDonors[0]
    const bestBalance = [...partiesWithFinance].sort((a, b) => {
      const balA = a.latestFinance.total_income - a.latestFinance.total_expenses
      const balB = b.latestFinance.total_income - b.latestFinance.total_expenses
      return balB - balA
    })[0]
    const worstBalance = [...partiesWithFinance].sort((a, b) => {
      const balA = a.latestFinance.total_income - a.latestFinance.total_expenses
      const balB = b.latestFinance.total_income - b.latestFinance.total_expenses
      return balA - balB
    })[0]
    const avgDonors = Math.round(totals.totalDonors / partiesWithFinance.length)
    return { mostPublic, mostPrivate, mostDonors, bestBalance, worstBalance, avgDonors }
  }, [partiesWithFinance, sortedByDonors, totals])

  if (loading) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-20 bg-[var(--muted)] border-2 border-[var(--border)]" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-[var(--muted)] border-2 border-[var(--border)]" />)}
          </div>
          <div className="h-64 bg-[var(--muted)] border-2 border-[var(--border)]" />
          <div className="h-96 bg-[var(--muted)] border-2 border-[var(--border)]" />
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="p-8 text-center text-[var(--flag-red-text)] border-2 border-[var(--flag-red)] bg-[var(--flag-red-bg)]">
          <svg className="w-12 h-12 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="square" strokeLinejoin="miter" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="font-bold">{tCommon('error')}: {error}</p>
        </div>
      </main>
    )
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 border-3 border-[var(--border)] bg-[var(--score-high)] flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="square" strokeLinejoin="miter" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-3xl font-black text-[var(--foreground)] uppercase tracking-tight">
              {t('title')}
            </h1>
            <p className="text-sm sm:text-base text-[var(--muted-foreground)] font-medium">
              {t('pageSubtitle')}
            </p>
          </div>
        </div>

        <div className="bg-[var(--score-competence)]/10 border-2 border-[var(--score-competence)] p-3 sm:p-4 flex items-start gap-2 sm:gap-3">
          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--score-competence-text)] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="square" strokeLinejoin="miter" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-xs sm:text-sm text-[var(--score-competence-text)] font-medium">
            <strong>{t('sourceNote')}</strong> {t('sourceDescription')}
            <span className="hidden sm:inline"> {t('sourceDescriptionExtended')}</span>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* SECTION 1: Summary Stats */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-8">
        <Card className="p-3 sm:p-5 bg-[var(--score-high)] border-[var(--border)]">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-white/30 bg-white/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="square" strokeLinejoin="miter" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div className="min-w-0">
              <div className="text-lg sm:text-2xl font-black text-white truncate">{formatCompact(totals.publicFunding)}</div>
              <div className="text-white/80 text-xs sm:text-sm font-bold uppercase">{t('public')}</div>
            </div>
          </div>
        </Card>

        <Card className="p-3 sm:p-5 bg-[var(--score-competence)] border-[var(--border)]">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-white/30 bg-white/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="square" strokeLinejoin="miter" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="min-w-0">
              <div className="text-lg sm:text-2xl font-black text-white truncate">{formatCompact(totals.privateFunding)}</div>
              <div className="text-white/80 text-xs sm:text-sm font-bold uppercase">{t('private')}</div>
            </div>
          </div>
        </Card>

        <Card className="p-3 sm:p-5 bg-[var(--flag-red)] border-[var(--border)]">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-white/30 bg-white/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="square" strokeLinejoin="miter" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="min-w-0">
              <div className="text-lg sm:text-2xl font-black text-white truncate">{formatCompact(totals.totalExpenses)}</div>
              <div className="text-white/80 text-xs sm:text-sm font-bold uppercase">{t('expenses')}</div>
            </div>
          </div>
        </Card>

        <Card className="p-3 sm:p-5 bg-[var(--score-transparency)] border-[var(--border)]">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-white/30 bg-white/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="square" strokeLinejoin="miter" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="min-w-0">
              <div className="text-lg sm:text-2xl font-black text-white">{totals.totalDonors.toLocaleString()}</div>
              <div className="text-white/80 text-xs sm:text-sm font-bold uppercase">{t('donors')}</div>
            </div>
          </div>
        </Card>

        <Card className="p-3 sm:p-5 bg-[var(--score-medium)] border-[var(--border)] col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-white/30 bg-white/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="square" strokeLinejoin="miter" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div className="min-w-0">
              <div className="text-lg sm:text-2xl font-black text-white">{partiesWithFinance.length}</div>
              <div className="text-white/80 text-xs sm:text-sm font-bold uppercase">{t('parties')}</div>
            </div>
          </div>
        </Card>
      </div>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* SECTION 2: Funding Composition */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {partiesWithFinance.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{t('fundingComposition')}</CardTitle>
            <CardDescription>{t('fundingCompositionDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Overall bar */}
            <div className="flex h-10 sm:h-12 border-2 border-[var(--border)] overflow-hidden mb-4">
              <div
                className="bg-[var(--score-high)] flex items-center justify-center text-white text-sm font-black transition-all duration-500"
                style={{ width: `${publicPct}%` }}
              >
                {publicPct >= 15 && `${publicPct.toFixed(0)}%`}
              </div>
              <div
                className="bg-[var(--score-competence)] flex items-center justify-center text-white text-sm font-black transition-all duration-500"
                style={{ width: `${privatePct}%` }}
              >
                {privatePct >= 15 && `${privatePct.toFixed(0)}%`}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-8 mb-6">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 bg-[var(--score-high)] border border-[var(--border)] flex-shrink-0" />
                <span className="text-sm font-bold text-[var(--foreground)]">
                  {t('public')}: {formatCurrency(totals.publicFunding)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 bg-[var(--score-competence)] border border-[var(--border)] flex-shrink-0" />
                <span className="text-sm font-bold text-[var(--foreground)]">
                  {t('private')}: {formatCurrency(totals.privateFunding)}
                </span>
              </div>
            </div>

            {/* Per-party breakdown bars */}
            <div className="space-y-3 pt-4 border-t-2 border-[var(--border)]">
              <h4 className="text-xs font-black text-[var(--muted-foreground)] uppercase tracking-wide mb-2">
                {t('perPartyBreakdown')}
              </h4>
              {sortedByIncome.map((item) => {
                const partyPublicPct = item.latestFinance.total_income > 0
                  ? (item.latestFinance.public_funding / item.latestFinance.total_income) * 100
                  : 0
                const partyPrivatePct = 100 - partyPublicPct
                return (
                  <div key={item.party.id} className="flex items-center gap-2 sm:gap-3">
                    <div className="w-20 sm:w-28 flex items-center gap-1.5 flex-shrink-0 min-w-0">
                      <div
                        className="w-2.5 h-2.5 border border-[var(--border)] flex-shrink-0"
                        style={{ backgroundColor: item.party.color || '#ef4444' }}
                      />
                      <span className="text-xs font-bold text-[var(--foreground)] truncate uppercase">
                        {item.party.short_name || item.party.name}
                      </span>
                    </div>
                    <div className="flex-1 flex h-5 border border-[var(--border)] overflow-hidden">
                      <div
                        className="bg-[var(--score-high)] transition-all duration-500"
                        style={{ width: `${partyPublicPct}%` }}
                      />
                      <div
                        className="bg-[var(--score-competence)] transition-all duration-500"
                        style={{ width: `${partyPrivatePct}%` }}
                      />
                    </div>
                    <span className="text-xs font-black text-[var(--foreground)] w-16 sm:w-20 text-right flex-shrink-0">
                      {formatCompact(item.latestFinance.total_income)}
                    </span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* SECTION 3: Key Insights */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {insights && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-8">
          <Card className="p-4">
            <div className="text-xs font-bold text-[var(--muted-foreground)] uppercase mb-2">{t('insightMostPublic')}</div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 border border-[var(--border)]" style={{ backgroundColor: insights.mostPublic.party.color || '#ef4444' }} />
              <span className="font-black text-[var(--foreground)] uppercase text-sm">{insights.mostPublic.party.short_name || insights.mostPublic.party.name}</span>
            </div>
            <div className="text-lg font-black text-[var(--score-excellent-text)] mt-1">{formatCurrency(insights.mostPublic.latestFinance.public_funding)}</div>
          </Card>

          <Card className="p-4">
            <div className="text-xs font-bold text-[var(--muted-foreground)] uppercase mb-2">{t('insightMostPrivate')}</div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 border border-[var(--border)]" style={{ backgroundColor: insights.mostPrivate.party.color || '#ef4444' }} />
              <span className="font-black text-[var(--foreground)] uppercase text-sm">{insights.mostPrivate.party.short_name || insights.mostPrivate.party.name}</span>
            </div>
            <div className="text-lg font-black text-[var(--score-competence-text)] mt-1">{formatCurrency(insights.mostPrivate.latestFinance.private_funding_total)}</div>
          </Card>

          <Card className="p-4">
            <div className="text-xs font-bold text-[var(--muted-foreground)] uppercase mb-2">{t('insightMostDonors')}</div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 border border-[var(--border)]" style={{ backgroundColor: insights.mostDonors.party.color || '#ef4444' }} />
              <span className="font-black text-[var(--foreground)] uppercase text-sm">{insights.mostDonors.party.short_name || insights.mostDonors.party.name}</span>
            </div>
            <div className="text-lg font-black text-[var(--foreground)] mt-1">
              {insights.mostDonors.latestFinance.donor_count.toLocaleString()} <span className="text-xs font-bold text-[var(--muted-foreground)]">({t('avgDonors')}: {insights.avgDonors})</span>
            </div>
          </Card>

          <Card className="p-4">
            <div className="text-xs font-bold text-[var(--muted-foreground)] uppercase mb-2">{t('insightBestBalance')}</div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 border border-[var(--border)]" style={{ backgroundColor: insights.bestBalance.party.color || '#ef4444' }} />
              <span className="font-black text-[var(--foreground)] uppercase text-sm">{insights.bestBalance.party.short_name || insights.bestBalance.party.name}</span>
            </div>
            <div className="text-lg font-black text-[var(--score-excellent-text)] mt-1">
              +{formatCurrency(insights.bestBalance.latestFinance.total_income - insights.bestBalance.latestFinance.total_expenses)}
            </div>
          </Card>

          <Card className="p-4">
            <div className="text-xs font-bold text-[var(--muted-foreground)] uppercase mb-2">{t('insightWorstBalance')}</div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 border border-[var(--border)]" style={{ backgroundColor: insights.worstBalance.party.color || '#ef4444' }} />
              <span className="font-black text-[var(--foreground)] uppercase text-sm">{insights.worstBalance.party.short_name || insights.worstBalance.party.name}</span>
            </div>
            <div className={cn('text-lg font-black mt-1',
              (insights.worstBalance.latestFinance.total_income - insights.worstBalance.latestFinance.total_expenses) < 0
                ? 'text-[var(--flag-red-text)]' : 'text-[var(--score-excellent-text)]'
            )}>
              {formatCurrency(insights.worstBalance.latestFinance.total_income - insights.worstBalance.latestFinance.total_expenses)}
            </div>
          </Card>

          <Card className="p-4">
            <div className="text-xs font-bold text-[var(--muted-foreground)] uppercase mb-2">{t('insightTotalFlow')}</div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="font-bold text-[var(--muted-foreground)]">{t('totalIncome')}</span>
                <span className="font-black text-[var(--foreground)]">{formatCompact(totals.totalIncome)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="font-bold text-[var(--muted-foreground)]">{t('totalExpensesLabel')}</span>
                <span className="font-black text-[var(--flag-red-text)]">{formatCompact(totals.totalExpenses)}</span>
              </div>
              <div className="flex justify-between text-sm pt-1 border-t border-[var(--border)]">
                <span className="font-bold text-[var(--muted-foreground)]">{t('balance')}</span>
                <span className={cn('font-black', totals.totalIncome - totals.totalExpenses >= 0 ? 'text-[var(--score-excellent-text)]' : 'text-[var(--flag-red-text)]')}>
                  {formatCompact(totals.totalIncome - totals.totalExpenses)}
                </span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* SECTION 4: Parties List */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('partyFinancing')}</CardTitle>
              <CardDescription>{t('sortedByIncome')}</CardDescription>
            </div>
            <Badge variant="outline">{t('partiesCount', { count: partiesWithFinance.length })}</Badge>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {partiesWithFinance.length === 0 ? (
            <div className="p-8 text-center text-[var(--muted-foreground)]">
              <svg className="w-12 h-12 mx-auto mb-3 text-[var(--muted-foreground)]/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="square" strokeLinejoin="miter" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="font-bold">{t('noFinanceData')}</p>
            </div>
          ) : (
            <div className="divide-y-2 divide-[var(--border)]">
              {sortedByIncome.map((item, index) => {
                const balance = item.latestFinance.total_income - item.latestFinance.total_expenses
                return (
                  <div
                    key={item.party.id}
                    className="p-4 hover:bg-[var(--muted)] transition-colors cursor-pointer min-h-[48px]"
                    onClick={() => router.push(`/partido/${generatePartySlug(item.party)}/financiamiento`)}
                  >
                    <div className="flex items-center gap-3 sm:gap-4">
                      {/* Rank */}
                      <div className="w-8 h-8 border-2 border-[var(--border)] bg-[var(--muted)] flex items-center justify-center text-sm font-black text-[var(--foreground)] flex-shrink-0">
                        {index + 1}
                      </div>

                      {/* Party info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 border border-[var(--border)] flex-shrink-0"
                            style={{ backgroundColor: item.party.color || '#ef4444' }}
                          />
                          <span className="font-black text-[var(--foreground)] truncate uppercase">
                            {item.party.name}
                          </span>
                          {item.party.short_name && (
                            <Badge variant="outline" size="sm" className="hidden sm:inline-flex">{item.party.short_name}</Badge>
                          )}
                        </div>
                        {/* Income bar */}
                        <div className="mt-1.5 flex items-center gap-2">
                          <div className="flex-1 h-2 bg-[var(--muted)] border border-[var(--border)] overflow-hidden">
                            <div
                              className="h-full bg-[var(--primary)] transition-all duration-500"
                              style={{ width: `${(item.latestFinance.total_income / maxIncome) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-[var(--muted-foreground)] hidden sm:inline">
                            {item.latestFinance.donor_count} {t('donors').toLowerCase()}
                          </span>
                        </div>
                      </div>

                      {/* Financial breakdown - desktop only */}
                      <div className="hidden lg:flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-[10px] text-[var(--muted-foreground)] font-bold uppercase">{t('public')}</div>
                          <div className="font-black text-[var(--score-excellent-text)] text-sm">
                            {formatCompact(item.latestFinance.public_funding)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] text-[var(--muted-foreground)] font-bold uppercase">{t('private')}</div>
                          <div className="font-black text-[var(--score-competence-text)] text-sm">
                            {formatCompact(item.latestFinance.private_funding_total)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] text-[var(--muted-foreground)] font-bold uppercase">{t('expenses')}</div>
                          <div className="font-black text-[var(--flag-red-text)] text-sm">
                            {formatCompact(item.latestFinance.total_expenses)}
                          </div>
                        </div>
                      </div>

                      {/* Total + Balance */}
                      <div className="text-right flex-shrink-0">
                        <div className="text-lg font-black text-[var(--foreground)]">
                          {formatCompact(item.latestFinance.total_income)}
                        </div>
                        <div className={cn('text-xs font-bold', balance >= 0 ? 'text-[var(--score-excellent-text)]' : 'text-[var(--flag-red-text)]')}>
                          {balance >= 0 ? '+' : ''}{formatCompact(balance)}
                        </div>
                      </div>

                      {/* Arrow */}
                      <svg className="w-5 h-5 text-[var(--muted-foreground)] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="square" strokeLinejoin="miter" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* SECTION 5: Balance Table */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {partiesWithFinance.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{t('balanceTitle')}</CardTitle>
            <CardDescription>{t('balanceDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b-3 border-[var(--border)]">
                    <th className="text-left py-3 px-3 sm:px-4 text-xs font-black text-[var(--foreground)] uppercase">{t('partyCol')}</th>
                    <th className="text-right py-3 px-3 sm:px-4 text-xs font-black text-[var(--foreground)] uppercase">{t('public')}</th>
                    <th className="text-right py-3 px-3 sm:px-4 text-xs font-black text-[var(--foreground)] uppercase">{t('private')}</th>
                    <th className="text-right py-3 px-3 sm:px-4 text-xs font-black text-[var(--foreground)] uppercase">{t('totalIncome')}</th>
                    <th className="text-right py-3 px-3 sm:px-4 text-xs font-black text-[var(--foreground)] uppercase">{t('expenses')}</th>
                    <th className="text-right py-3 px-3 sm:px-4 text-xs font-black text-[var(--foreground)] uppercase">{t('balance')}</th>
                    <th className="text-right py-3 px-3 sm:px-4 text-xs font-black text-[var(--foreground)] uppercase">{t('donors')}</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedByIncome.map((item) => {
                    const balance = item.latestFinance.total_income - item.latestFinance.total_expenses
                    return (
                      <tr
                        key={item.party.id}
                        className="border-b-2 border-[var(--border)] hover:bg-[var(--muted)] transition-colors cursor-pointer"
                        onClick={() => router.push(`/partido/${generatePartySlug(item.party)}/financiamiento`)}
                      >
                        <td className="py-3 px-3 sm:px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 border border-[var(--border)] flex-shrink-0" style={{ backgroundColor: item.party.color || '#ef4444' }} />
                            <span className="font-black text-[var(--foreground)] text-sm uppercase truncate">{item.party.short_name || item.party.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 sm:px-4 text-right text-[var(--score-excellent-text)] font-bold text-xs sm:text-sm whitespace-nowrap">{formatCurrency(item.latestFinance.public_funding)}</td>
                        <td className="py-3 px-3 sm:px-4 text-right text-[var(--score-good-text)] font-bold text-xs sm:text-sm whitespace-nowrap">{formatCurrency(item.latestFinance.private_funding_total)}</td>
                        <td className="py-3 px-3 sm:px-4 text-right font-black text-[var(--foreground)] text-xs sm:text-sm whitespace-nowrap">{formatCurrency(item.latestFinance.total_income)}</td>
                        <td className="py-3 px-3 sm:px-4 text-right text-[var(--flag-red-text)] font-bold text-xs sm:text-sm whitespace-nowrap">{formatCurrency(item.latestFinance.total_expenses)}</td>
                        <td className={cn('py-3 px-3 sm:px-4 text-right font-black text-xs sm:text-sm whitespace-nowrap', balance >= 0 ? 'text-[var(--score-excellent-text)]' : 'text-[var(--flag-red-text)]')}>
                          {balance >= 0 ? '+' : ''}{formatCurrency(balance)}
                        </td>
                        <td className="py-3 px-3 sm:px-4 text-right text-[var(--muted-foreground)] font-bold text-sm">{item.latestFinance.donor_count}</td>
                      </tr>
                    )
                  })}
                  {/* Totals row */}
                  <tr className="border-t-3 border-[var(--border)] bg-[var(--muted)]">
                    <td className="py-3 px-3 sm:px-4 font-black text-[var(--foreground)] text-sm uppercase">TOTAL</td>
                    <td className="py-3 px-3 sm:px-4 text-right font-black text-[var(--score-excellent-text)] text-xs sm:text-sm whitespace-nowrap">{formatCurrency(totals.publicFunding)}</td>
                    <td className="py-3 px-3 sm:px-4 text-right font-black text-[var(--score-good-text)] text-xs sm:text-sm whitespace-nowrap">{formatCurrency(totals.privateFunding)}</td>
                    <td className="py-3 px-3 sm:px-4 text-right font-black text-[var(--foreground)] text-xs sm:text-sm whitespace-nowrap">{formatCurrency(totals.totalIncome)}</td>
                    <td className="py-3 px-3 sm:px-4 text-right font-black text-[var(--flag-red-text)] text-xs sm:text-sm whitespace-nowrap">{formatCurrency(totals.totalExpenses)}</td>
                    <td className={cn('py-3 px-3 sm:px-4 text-right font-black text-xs sm:text-sm whitespace-nowrap', totals.totalIncome - totals.totalExpenses >= 0 ? 'text-[var(--score-excellent-text)]' : 'text-[var(--flag-red-text)]')}>
                      {totals.totalIncome - totals.totalExpenses >= 0 ? '+' : ''}{formatCurrency(totals.totalIncome - totals.totalExpenses)}
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-right font-black text-[var(--foreground)] text-sm">{totals.totalDonors}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* SECTION 6: Donors Ranking */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {sortedByDonors.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{t('donorRanking')}</CardTitle>
            <CardDescription>{t('donorRankingDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sortedByDonors.map((item, index) => {
                const maxDonors = sortedByDonors[0].latestFinance.donor_count
                const donorPct = maxDonors > 0 ? (item.latestFinance.donor_count / maxDonors) * 100 : 0
                const avgDonation = item.latestFinance.donor_count > 0
                  ? item.latestFinance.private_funding_total / item.latestFinance.donor_count
                  : 0
                return (
                  <div
                    key={item.party.id}
                    className="flex items-center gap-3 cursor-pointer hover:bg-[var(--muted)] p-2 -mx-2 transition-colors"
                    onClick={() => router.push(`/partido/${generatePartySlug(item.party)}/financiamiento`)}
                  >
                    <div className="w-6 text-center text-xs font-black text-[var(--muted-foreground)]">{index + 1}</div>
                    <div className="w-20 sm:w-28 flex items-center gap-1.5 flex-shrink-0 min-w-0">
                      <div className="w-2.5 h-2.5 border border-[var(--border)] flex-shrink-0" style={{ backgroundColor: item.party.color || '#ef4444' }} />
                      <span className="text-xs font-bold text-[var(--foreground)] truncate uppercase">{item.party.short_name || item.party.name}</span>
                    </div>
                    <div className="flex-1 flex h-5 bg-[var(--muted)] border border-[var(--border)] overflow-hidden">
                      <div className="h-full bg-[var(--score-transparency)] transition-all duration-500" style={{ width: `${donorPct}%` }} />
                    </div>
                    <div className="text-right flex-shrink-0 w-16 sm:w-20">
                      <div className="text-sm font-black text-[var(--foreground)]">{item.latestFinance.donor_count}</div>
                    </div>
                    <div className="text-right flex-shrink-0 w-20 sm:w-24 hidden sm:block">
                      <div className="text-xs font-bold text-[var(--muted-foreground)]">{t('avg')} {formatCompact(avgDonation)}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* SECTION 7: About the Data */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{t('aboutDataTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-[var(--muted)] border-2 border-[var(--border)]">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-[var(--primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="square" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <h4 className="font-black text-[var(--foreground)] uppercase text-sm">{t('aboutPublicTitle')}</h4>
              </div>
              <p className="text-xs text-[var(--muted-foreground)] font-medium leading-relaxed">
                {t('aboutPublicDesc')}
              </p>
            </div>

            <div className="p-4 bg-[var(--muted)] border-2 border-[var(--border)]">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-[var(--primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="square" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <h4 className="font-black text-[var(--foreground)] uppercase text-sm">{t('aboutPrivateTitle')}</h4>
              </div>
              <p className="text-xs text-[var(--muted-foreground)] font-medium leading-relaxed">
                {t('aboutPrivateDesc')}
              </p>
            </div>

            <div className="p-4 bg-[var(--muted)] border-2 border-[var(--border)]">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-[var(--primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="square" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <h4 className="font-black text-[var(--foreground)] uppercase text-sm">{t('aboutSourceTitle')}</h4>
              </div>
              <p className="text-xs text-[var(--muted-foreground)] font-medium leading-relaxed">
                {t('aboutSourceDesc')}
              </p>
            </div>

            <div className="p-4 bg-[var(--muted)] border-2 border-[var(--border)]">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-[var(--primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="square" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h4 className="font-black text-[var(--foreground)] uppercase text-sm">{t('aboutUpdateTitle')}</h4>
              </div>
              <p className="text-xs text-[var(--muted-foreground)] font-medium leading-relaxed">
                {t('aboutUpdateDesc')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* Source Footer */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <div className="p-4 bg-[var(--muted)] border-2 border-[var(--border)] text-center text-sm text-[var(--muted-foreground)]">
        <p className="font-medium">
          {t('dataSource')}{' '}
          <a
            href="https://claridad.onpe.gob.pe"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--primary)] font-bold hover:underline"
          >
            {t('portalClaridad')}
          </a>
          {' '}{t('and')}{' '}
          <a
            href="https://datosabiertos.gob.pe"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--primary)] font-bold hover:underline"
          >
            {t('openData')}
          </a>
        </p>
        <p className="mt-1 text-xs font-medium">
          {t('lastUpdate')}
        </p>
      </div>
    </main>
  )
}
