import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/routing'
import { getCandidates, getPartyBySlug, getPartyFinances } from '@/lib/db/queries'
import { generatePoliticalPartySchema, generateBreadcrumbSchema } from '@/lib/schema'
import { locales } from '@/i18n/config'
import { Header } from '@/components/layout/Header'
import { CandidateCard } from '@/components/candidate/CandidateCard'
import { CandidateCardMini } from '@/components/candidate/CandidateCardMini'
import { CandidateImage } from '@/components/candidate/CandidateImage'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { PartyLogo } from '@/components/party/PartyLogo'
import type { CargoType, CandidateWithScores } from '@/types/database'

export const revalidate = 86400

interface PageProps {
  params: Promise<{ slug: string }>
}

const cargoColors: Record<CargoType, string> = {
  presidente: '#6366f1',
  vicepresidente: '#8b5cf6',
  senador: '#3b82f6',
  diputado: '#10b981',
  parlamento_andino: '#f59e0b',
}

const cargoOrder: CargoType[] = ['presidente', 'vicepresidente', 'senador', 'diputado', 'parlamento_andino']

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function getScoreLevel(score: number, t: (key: string) => string): { label: string; color: string; bg: string; text: string } {
  if (score >= 70) return { label: t('scoreLevelHigh'), color: 'var(--score-excellent)', bg: 'bg-[var(--score-excellent)]', text: 'text-[var(--score-excellent-text)]' }
  if (score >= 50) return { label: t('scoreLevelGood'), color: 'var(--score-good)', bg: 'bg-[var(--score-good)]', text: 'text-[var(--score-good-text)]' }
  if (score >= 30) return { label: t('scoreLevelRegular'), color: 'var(--score-medium)', bg: 'bg-[var(--score-medium)]', text: 'text-[var(--score-medium-text)]' }
  return { label: t('scoreLevelLow'), color: 'var(--score-low)', bg: 'bg-[var(--score-low)]', text: 'text-[var(--score-low-text)]' }
}

function getEffectiveScore(c: CandidateWithScores): number {
  if (c.cargo === 'presidente' && c.scores.score_balanced_p != null) {
    return c.scores.score_balanced_p
  }
  return c.scores.score_balanced
}

function computePartyStats(candidates: CandidateWithScores[], tCargo: (key: string) => string) {
  const total = candidates.length
  if (total === 0) return null

  const avgBalanced = Math.round(candidates.reduce((s, c) => s + getEffectiveScore(c), 0) / total)
  const avgCompetence = Math.round(candidates.reduce((s, c) => s + c.scores.competence, 0) / total)
  const avgIntegrity = Math.round(candidates.reduce((s, c) => s + c.scores.integrity, 0) / total)
  const avgTransparency = Math.round(candidates.reduce((s, c) => s + c.scores.transparency, 0) / total)

  const redFlagCandidates = candidates.filter(c => c.flags.some(f => f.severity === 'RED'))
  const amberFlagCandidates = candidates.filter(c => c.flags.some(f => f.severity === 'AMBER') && !c.flags.some(f => f.severity === 'RED'))
  const reinfoCandidates = candidates.filter(c => c.flags.some(f => f.type === 'REINFO'))
  const cleanCandidates = candidates.filter(c => c.flags.length === 0)
  const totalFlags = candidates.reduce((s, c) => s + c.flags.length, 0)

  const dedup = (list: CandidateWithScores[]) => {
    const seen = new Set<string>()
    return list.filter(c => {
      const name = c.full_name.toUpperCase()
      if (seen.has(name)) return false
      seen.add(name)
      return true
    })
  }

  const top3 = dedup([...candidates].sort((a, b) => getEffectiveScore(b) - getEffectiveScore(a))).slice(0, 3)
  const worst3 = dedup([...candidates]
    .filter(c => c.flags.some(f => f.severity === 'RED'))
    .sort((a, b) => {
      const aRed = a.flags.filter(f => f.severity === 'RED').length
      const bRed = b.flags.filter(f => f.severity === 'RED').length
      return bRed - aRed
    }))
    .slice(0, 3)

  const byCargo = cargoOrder
    .map(cargo => ({
      cargo,
      label: tCargo(cargo),
      color: cargoColors[cargo],
      count: candidates.filter(c => c.cargo === cargo).length,
    }))
    .filter(g => g.count > 0)

  return {
    total,
    avgBalanced,
    avgCompetence,
    avgIntegrity,
    avgTransparency,
    redFlagCandidates,
    amberFlagCandidates,
    reinfoCandidates,
    cleanCandidates,
    totalFlags,
    top3,
    worst3,
    byCargo,
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const party = await getPartyBySlug(slug)

  if (!party) {
    const t = await getTranslations('partyPage')
    return { title: t('notFound') }
  }

  const candidates = await getCandidates({ partyId: party.id as string })
  const avgScore = candidates.length > 0
    ? candidates.reduce((sum, c) => {
        const score = c.cargo === 'presidente' && c.scores.score_balanced_p != null
          ? c.scores.score_balanced_p : c.scores.score_balanced
        return sum + score
      }, 0) / candidates.length
    : 0

  const ogParams = new URLSearchParams({
    type: 'party',
    name: party.name,
    short_name: party.short_name || '',
    color: party.color || '#DC2626',
    candidates: candidates.length.toString(),
    avgScore: avgScore.toFixed(1),
  })

  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://eleccionesperu2026.xyz'
  const t = await getTranslations('partyPage')
  return {
    title: `${party.name} - Ranking Electoral 2026`,
    description: t('metaDesc', { name: party.name as string }),
    openGraph: {
      images: [`/api/og?${ogParams.toString()}`],
    },
    alternates: {
      canonical: `${BASE_URL}/es/partido/${slug}`,
      languages: {
        ...Object.fromEntries(
          locales.map((l) => [l, `${BASE_URL}/${l}/partido/${slug}`])
        ),
        'x-default': `${BASE_URL}/es/partido/${slug}`,
      },
    },
  }
}

export default async function PartidoPage({ params }: PageProps) {
  const { slug } = await params
  const party = await getPartyBySlug(slug)

  if (!party) {
    notFound()
  }

  const [candidates, finances, t, tCargo, tScores] = await Promise.all([
    getCandidates({ partyId: party.id as string }),
    getPartyFinances(party.id as string),
    getTranslations('partyPage'),
    getTranslations('ranking.cargo'),
    getTranslations('candidate.scores'),
  ])

  const latestFinance = finances.length > 0 ? finances[0] : null
  const stats = computePartyStats(candidates, tCargo)

  const groupedByCargo = candidates.reduce((acc, c) => {
    if (!acc[c.cargo]) acc[c.cargo] = []
    acc[c.cargo].push(c)
    return acc
  }, {} as Record<CargoType, typeof candidates>)

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://eleccionesperu2026.xyz'
  const partySchema = generatePoliticalPartySchema(party as { name: string; short_name?: string | null; logo_url?: string | null }, slug)
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Ranking', url: `${baseUrl}/es/ranking` },
    { name: (party.name as string), url: `${baseUrl}/es/partido/${slug}` },
  ])

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(partySchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ========== HEADER ========== */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <PartyLogo
              name={party.name as string}
              shortName={party.short_name as string | null}
              color={party.color as string | null}
              logoUrl={party.logo_url as string | null}
              size="lg"
              className="border-3"
            />
            <div>
              <h1 className="text-3xl font-black text-[var(--foreground)] uppercase tracking-tight">
                {party.name}
              </h1>
              <p className="text-[var(--muted-foreground)] font-medium">
                {t('registeredCandidates', { count: candidates.length })}
              </p>
            </div>
          </div>
          <Link href={`/partido/${party.id}/financiamiento`}>
            <Button variant="outline" size="sm">
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="square" strokeLinejoin="miter" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {t('viewFinancing')}
            </Button>
          </Link>
        </div>

        {stats && (
          <>
            {/* ========== SCORES PROMEDIO ========== */}
            <section className="mb-8">
              <h2 className="text-lg font-black text-[var(--foreground)] mb-4 uppercase tracking-tight flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="square" strokeLinejoin="miter" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                {t('avgScores')}
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {/* Score General */}
                <Card className="p-4">
                  <div className="text-xs font-bold text-[var(--muted-foreground)] uppercase mb-2">{t('overallScore')}</div>
                  <div className={`text-3xl font-black ${getScoreLevel(stats.avgBalanced, t).text}`}>
                    {stats.avgBalanced}
                  </div>
                  <div className="mt-2 h-2.5 bg-[var(--muted)] border-2 border-[var(--border)]">
                    <div
                      className="h-full transition-all"
                      style={{ width: `${stats.avgBalanced}%`, backgroundColor: getScoreLevel(stats.avgBalanced, t).color }}
                    />
                  </div>
                  <div className="text-xs font-bold text-[var(--muted-foreground)] mt-1">{getScoreLevel(stats.avgBalanced, t).label}</div>
                </Card>

                {/* Competencia */}
                <Card className="p-4">
                  <div className="text-xs font-bold text-[var(--muted-foreground)] uppercase mb-2">{tScores('competence')}</div>
                  <div className="text-3xl font-black text-[var(--score-competence-text)]">
                    {stats.avgCompetence}
                  </div>
                  <div className="mt-2 h-2.5 bg-[var(--muted)] border-2 border-[var(--border)]">
                    <div
                      className="h-full bg-[var(--score-competence)] transition-all"
                      style={{ width: `${stats.avgCompetence}%` }}
                    />
                  </div>
                  <div className="text-xs font-bold text-[var(--muted-foreground)] mt-1">{t('average')}</div>
                </Card>

                {/* Historial Legal */}
                <Card className="p-4">
                  <div className="text-xs font-bold text-[var(--muted-foreground)] uppercase mb-2">{tScores('integrity')}</div>
                  <div className="text-3xl font-black text-[var(--score-integrity-text)]">
                    {stats.avgIntegrity}
                  </div>
                  <div className="mt-2 h-2.5 bg-[var(--muted)] border-2 border-[var(--border)]">
                    <div
                      className="h-full bg-[var(--score-integrity)] transition-all"
                      style={{ width: `${stats.avgIntegrity}%` }}
                    />
                  </div>
                  <div className="text-xs font-bold text-[var(--muted-foreground)] mt-1">{t('average')}</div>
                </Card>

                {/* Transparencia */}
                <Card className="p-4">
                  <div className="text-xs font-bold text-[var(--muted-foreground)] uppercase mb-2">{tScores('transparency')}</div>
                  <div className="text-3xl font-black text-[var(--score-transparency-text)]">
                    {stats.avgTransparency}
                  </div>
                  <div className="mt-2 h-2.5 bg-[var(--muted)] border-2 border-[var(--border)]">
                    <div
                      className="h-full bg-[var(--score-transparency)] transition-all"
                      style={{ width: `${stats.avgTransparency}%` }}
                    />
                  </div>
                  <div className="text-xs font-bold text-[var(--muted-foreground)] mt-1">{t('average')}</div>
                </Card>
              </div>
            </section>

            {/* ========== RESUMEN DE ALERTAS ========== */}
            <section className="mb-8">
              <h2 className="text-lg font-black text-[var(--foreground)] mb-4 uppercase tracking-tight flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="square" strokeLinejoin="miter" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {t('partyLegalHistory')}
              </h2>
              <Card className="p-5">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
                  {/* Candidatos limpios */}
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-[var(--score-excellent)] border-2 border-[var(--border)] flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="square" strokeLinejoin="miter" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-2xl font-black text-[var(--score-excellent-text)]">{stats.cleanCandidates.length}</div>
                      <div className="text-xs font-bold text-[var(--muted-foreground)] uppercase">{t('noAlerts')}</div>
                      <div className="text-xs text-[var(--muted-foreground)]">{t('ofTotal', { percent: Math.round(stats.cleanCandidates.length / stats.total * 100) })}</div>
                    </div>
                  </div>

                  {/* Alertas rojas */}
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-[var(--flag-red)] border-2 border-[var(--border)] flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="square" strokeLinejoin="miter" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-2xl font-black text-[var(--flag-red-text)]">{stats.redFlagCandidates.length}</div>
                      <div className="text-xs font-bold text-[var(--muted-foreground)] uppercase">{t('redAlert')}</div>
                      <div className="text-xs text-[var(--muted-foreground)]">{t('ofTotal', { percent: Math.round(stats.redFlagCandidates.length / stats.total * 100) })}</div>
                    </div>
                  </div>

                  {/* Alertas ámbar */}
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-[var(--flag-amber)] border-2 border-[var(--border)] flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="square" strokeLinejoin="miter" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-2xl font-black text-[var(--flag-amber-text)]">{stats.amberFlagCandidates.length}</div>
                      <div className="text-xs font-bold text-[var(--muted-foreground)] uppercase">{t('amberAlert')}</div>
                      <div className="text-xs text-[var(--muted-foreground)]">{t('ofTotal', { percent: Math.round(stats.amberFlagCandidates.length / stats.total * 100) })}</div>
                    </div>
                  </div>

                  {/* Total alertas */}
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-[var(--muted)] border-2 border-[var(--border)] flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-[var(--foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="square" strokeLinejoin="miter" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-2xl font-black text-[var(--foreground)]">{stats.totalFlags}</div>
                      <div className="text-xs font-bold text-[var(--muted-foreground)] uppercase">{t('totalAlerts')}</div>
                      <div className="text-xs text-[var(--muted-foreground)]">{t('candidatesCount', { count: stats.redFlagCandidates.length + stats.amberFlagCandidates.length })}</div>
                    </div>
                  </div>
                </div>

                {/* Barra visual limpios vs alertas */}
                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-[var(--muted-foreground)] uppercase mb-1.5">
                    <span>{t('noAlertsPercent', { percent: Math.round(stats.cleanCandidates.length / stats.total * 100) })}</span>
                    <span>{t('withAlertsPercent', { percent: Math.round((stats.total - stats.cleanCandidates.length) / stats.total * 100) })}</span>
                  </div>
                  <div className="h-4 border-2 border-[var(--border)] flex overflow-hidden">
                    <div
                      className="bg-[var(--score-excellent)] transition-all"
                      style={{ width: `${(stats.cleanCandidates.length / stats.total) * 100}%` }}
                    />
                    <div
                      className="bg-[var(--flag-amber)] transition-all"
                      style={{ width: `${(stats.amberFlagCandidates.length / stats.total) * 100}%` }}
                    />
                    <div
                      className="bg-[var(--flag-red)] transition-all"
                      style={{ width: `${(stats.redFlagCandidates.length / stats.total) * 100}%` }}
                    />
                  </div>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 bg-[var(--score-excellent)] border border-[var(--border)]" />
                      <span className="text-xs font-medium text-[var(--muted-foreground)]">{t('clean')}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 bg-[var(--flag-amber)] border border-[var(--border)]" />
                      <span className="text-xs font-medium text-[var(--muted-foreground)]">{t('medium')}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 bg-[var(--flag-red)] border border-[var(--border)]" />
                      <span className="text-xs font-medium text-[var(--muted-foreground)]">{t('red')}</span>
                    </div>
                  </div>
                </div>
              </Card>
            </section>

            {/* ========== DISTRIBUCIÓN POR CARGO ========== */}
            <section className="mb-8">
              <h2 className="text-lg font-black text-[var(--foreground)] mb-4 uppercase tracking-tight flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="square" strokeLinejoin="miter" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {t('distributionByCargo')}
              </h2>
              <Card className="p-5">
                {/* Stacked bar */}
                <div className="h-8 border-2 border-[var(--border)] flex overflow-hidden mb-4">
                  {stats.byCargo.map(g => (
                    <div
                      key={g.cargo}
                      className="flex items-center justify-center text-xs font-black text-white transition-all"
                      style={{
                        width: `${(g.count / stats.total) * 100}%`,
                        backgroundColor: g.color,
                        minWidth: g.count > 0 ? '24px' : '0',
                      }}
                    >
                      {(g.count / stats.total) * 100 >= 8 ? g.count : ''}
                    </div>
                  ))}
                </div>

                {/* Legend list */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {stats.byCargo.map(g => (
                    <div key={g.cargo} className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 border-2 border-[var(--border)] flex-shrink-0"
                        style={{ backgroundColor: g.color }}
                      />
                      <div>
                        <div className="text-sm font-black text-[var(--foreground)]">{g.count}</div>
                        <div className="text-xs font-bold text-[var(--muted-foreground)] uppercase">{g.label}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </section>

            {/* ========== TOP 3 Y PEORES 3 ========== */}
            <section className="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Top 3 */}
              <div>
                <h2 className="text-lg font-black text-[var(--foreground)] mb-4 uppercase tracking-tight flex items-center gap-2">
                  <svg className="w-5 h-5 text-[var(--score-excellent-text)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="square" strokeLinejoin="miter" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                  {t('bestRanked')}
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {stats.top3.map((c, i) => (
                    <CandidateCardMini
                      key={c.id}
                      rank={i + 1}
                      candidate={{
                        id: c.id,
                        full_name: c.full_name,
                        slug: c.slug,
                        photo_url: c.photo_url,
                        score_balanced: getEffectiveScore(c),
                        party_name: c.party?.name || null,
                        party_short_name: c.party?.short_name || null,
                        party_color: c.party?.color || null,
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Peores 3 (con más alertas rojas) */}
              {stats.worst3.length > 0 && (
                <div>
                  <h2 className="text-lg font-black text-[var(--foreground)] mb-4 uppercase tracking-tight flex items-center gap-2">
                    <svg className="w-5 h-5 text-[var(--flag-red-text)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="square" strokeLinejoin="miter" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    {t('mostAlerts')}
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {stats.worst3.map((c, i) => (
                      <CandidateCardMini
                        key={c.id}
                        rank={i + 1}
                        candidate={{
                          id: c.id,
                          full_name: c.full_name,
                          slug: c.slug,
                          photo_url: c.photo_url,
                          score_balanced: getEffectiveScore(c),
                          party_name: c.party?.name || null,
                          party_short_name: c.party?.short_name || null,
                          party_color: c.party?.color || null,
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* ========== CANDIDATOS REINFO ========== */}
            {stats.reinfoCandidates.length > 0 && (
              <section className="mb-8">
                <h2 className="text-lg font-black text-[var(--foreground)] mb-4 uppercase tracking-tight flex items-center gap-2">
                  <svg className="w-5 h-5 text-[var(--flag-red-text)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="square" strokeLinejoin="miter" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                  {t('reinfoTitle')}
                </h2>
                <Card className="p-5 border-[var(--flag-red)] border-opacity-50">
                  <div className="flex items-center gap-3 mb-4 pb-4 border-b-2 border-[var(--border)]">
                    <Badge variant="danger">{t('candidatesCount', { count: stats.reinfoCandidates.length })}</Badge>
                    <span className="text-sm text-[var(--muted-foreground)]">
                      {t('reinfoDesc')}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {stats.reinfoCandidates.map(c => {
                      const reinfoFlags = c.flags.filter(f => f.type === 'REINFO')
                      const vigentes = reinfoFlags.filter(f => f.title.includes('Vigente')).length
                      const otros = reinfoFlags.length - vigentes
                      return (
                        <Link
                          key={c.id}
                          href={`/candidato/${c.slug}`}
                          className="flex items-center gap-3 p-3 border-2 border-[var(--border)] bg-[var(--background)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[var(--shadow-brutal-sm)] transition-all duration-100"
                        >
                          <div className="w-10 h-10 border-2 border-[var(--border)] overflow-hidden flex-shrink-0 relative">
                            <CandidateImage
                              src={c.photo_url}
                              name={c.full_name}
                              fill
                              sizes="40px"
                              containerClassName="text-xs"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-black text-[var(--foreground)] uppercase truncate">
                              {c.full_name}
                            </div>
                            <div className="text-xs text-[var(--muted-foreground)] font-medium">
                              {tCargo(c.cargo)}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {vigentes > 0 && (
                              <Badge variant="danger">{t('vigentes', { count: vigentes })}</Badge>
                            )}
                            {otros > 0 && (
                              <Badge variant="warning">{t('exclSusp', { count: otros })}</Badge>
                            )}
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                  <div className="mt-4 pt-3 border-t-2 border-[var(--border)]">
                    <p className="text-xs text-[var(--muted-foreground)]">
                      Fuente: <a href="https://www.territoriotomado.pe/mapa-de-candidatos-al-reinfo-2026" target="_blank" rel="noopener noreferrer" className="underline font-bold hover:text-[var(--primary)]">Territorio Tomado</a> / GEOCATMIN
                    </p>
                  </div>
                </Card>
              </section>
            )}
          </>
        )}

        {/* ========== FINANCE SUMMARY ========== */}
        {latestFinance && (
          <Link href={`/partido/${party.id}/financiamiento`}>
            <Card className="mb-8 p-5 hover:shadow-[var(--shadow-brutal)] hover:-translate-x-1 hover:-translate-y-1 transition-all duration-100 cursor-pointer">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-black text-[var(--foreground)] flex items-center gap-2 uppercase">
                  <svg className="w-5 h-5 text-[var(--score-excellent-text)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="square" strokeLinejoin="miter" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {t('financialTransparency', { year: latestFinance.year })}
                </h2>
                <Badge variant="outline">ONPE</Badge>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div>
                  <div className="text-xs sm:text-sm text-[var(--muted-foreground)] font-bold uppercase">{t('publicFunding')}</div>
                  <div className="text-base sm:text-lg font-black text-[var(--score-excellent-text)]">{formatCurrency(latestFinance.public_funding)}</div>
                </div>
                <div>
                  <div className="text-xs sm:text-sm text-[var(--muted-foreground)] font-bold uppercase">{t('privateFunding')}</div>
                  <div className="text-base sm:text-lg font-black text-[var(--score-good-text)]">{formatCurrency(latestFinance.private_funding_total)}</div>
                </div>
                <div>
                  <div className="text-xs sm:text-sm text-[var(--muted-foreground)] font-bold uppercase">{t('totalLabel')}</div>
                  <div className="text-base sm:text-lg font-black text-[var(--foreground)]">{formatCurrency(latestFinance.total_income)}</div>
                </div>
                <div>
                  <div className="text-xs sm:text-sm text-[var(--muted-foreground)] font-bold uppercase">{t('donorsLabel')}</div>
                  <div className="text-base sm:text-lg font-black text-[var(--foreground)]">{latestFinance.donor_count}</div>
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm text-[var(--primary)] font-bold uppercase">
                {t('viewFullDetail')}
                <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="square" strokeLinejoin="miter" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Card>
          </Link>
        )}

        {/* ========== CANDIDATOS POR CARGO ========== */}
        {cargoOrder.map(cargo => {
          const cargoCandidates = groupedByCargo[cargo]
          if (!cargoCandidates || cargoCandidates.length === 0) return null
          return (
            <section key={cargo} className="mb-8">
              <h2 className="text-xl font-black text-[var(--foreground)] mb-4 uppercase tracking-tight">
                {tCargo(cargo)}
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {cargoCandidates.map((candidate, index) => (
                  <CandidateCard
                    key={candidate.id}
                    candidate={candidate}
                    rank={index + 1}
                    mode="balanced"
                  />
                ))}
              </div>
            </section>
          )
        })}

        {candidates.length === 0 && (
          <div className="text-center py-12 bg-[var(--card)] border-3 border-[var(--border)] shadow-[var(--shadow-brutal)]">
            <p className="text-[var(--muted-foreground)] font-medium">
              {t('noCandidatesParty')}
            </p>
            <Link href="/ranking">
              <Button variant="primary" className="mt-4">
                {t('viewAllCandidates')}
              </Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
