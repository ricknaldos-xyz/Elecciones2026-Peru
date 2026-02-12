import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/routing'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Header } from '@/components/layout/Header'
import { CountdownBanner } from '@/components/viral/CountdownBanner'
import { DailyFact } from '@/components/viral/DailyFact'
import { TrendingNews } from '@/components/news/TrendingNews'
import { CandidateCardMini } from '@/components/candidate/CandidateCardMini'
import { CandidateImage } from '@/components/candidate/CandidateImage'
import { AdBanner } from '@/components/ads/AdBanner'
import { AdSlot } from '@/components/ads/AdSlot'
import { PartiesGrid } from '@/components/home/PartiesGrid'
import { DISTRICTS } from '@/lib/constants'
import { sql } from '@/lib/db'
import { generateWebSiteSchema, generateOrganizationSchema } from '@/lib/schema'
import { DataFreshnessFooter } from '@/components/layout/DataFreshnessFooter'

interface HomePageProps {
  params: Promise<{ lang: string }>
}

export async function generateMetadata({ params }: HomePageProps): Promise<Metadata> {
  const { lang } = await params
  const t = await getTranslations({ locale: lang, namespace: 'meta' })

  return {
    title: t('title'),
    description: t('description'),
  }
}

async function getStats() {
  try {
    const [candidatesResult, partiesResult] = await Promise.all([
      sql`SELECT COUNT(*) as total FROM candidates`,
      sql`SELECT COUNT(*) as total FROM parties`
    ])

    return {
      totalCandidates: Number(candidatesResult[0].total),
      totalParties: Number(partiesResult[0].total)
    }
  } catch {
    return { totalCandidates: 44, totalParties: 36 }
  }
}

interface PartyWithCount {
  id: string
  name: string
  short_name: string | null
  color: string | null
  logo_url: string | null
  candidate_count: number
}

async function getPartiesWithCounts(): Promise<PartyWithCount[]> {
  try {
    const rows = await sql`
      SELECT p.id, p.name, p.short_name, p.color, p.logo_url, COUNT(c.id) as candidate_count
      FROM parties p
      LEFT JOIN candidates c ON c.party_id = p.id AND c.is_active = true
      GROUP BY p.id, p.name, p.short_name, p.color, p.logo_url
      HAVING COUNT(c.id) > 0
      ORDER BY COUNT(c.id) DESC, p.name
    `
    return rows.map(r => ({
      id: r.id as string,
      name: r.name as string,
      short_name: r.short_name as string | null,
      color: r.color as string | null,
      logo_url: r.logo_url as string | null,
      candidate_count: Number(r.candidate_count),
    }))
  } catch {
    return []
  }
}

interface TopCandidate {
  id: string
  full_name: string
  slug: string
  photo_url: string | null
  score_balanced: number
  party_name: string | null
  party_short_name: string | null
  party_color: string | null
}

async function getTopPresidentialCandidates(): Promise<TopCandidate[]> {
  try {
    const result = await sql`
      SELECT
        c.id,
        c.full_name,
        c.slug,
        c.photo_url,
        COALESCE(s.score_balanced_p, s.score_balanced) as score,
        p.name as party_name,
        p.short_name as party_short_name,
        p.color as party_color
      FROM candidates c
      LEFT JOIN scores s ON c.id = s.candidate_id
      LEFT JOIN parties p ON c.party_id = p.id
      WHERE c.cargo = 'presidente' AND c.is_active = true
      ORDER BY COALESCE(s.score_balanced_p, s.score_balanced) DESC NULLS LAST
      LIMIT 3
    `
    return result.map(row => ({
      id: row.id as string,
      full_name: row.full_name as string,
      slug: row.slug as string,
      photo_url: row.photo_url as string | null,
      score_balanced: Number(row.score) || 0,
      party_name: row.party_name as string | null,
      party_short_name: row.party_short_name as string | null,
      party_color: row.party_color as string | null,
    }))
  } catch (error) {
    console.error('Error fetching top candidates:', error)
    return []
  }
}

// ── New data queries for 5 sections ──

interface AlertCandidate {
  id: string
  full_name: string
  slug: string
  photo_url: string | null
  integrity_score: number
  party_name: string | null
  party_short_name: string | null
  party_color: string | null
  flag_count: number
  flag_types: string[]
}

async function getWorstIntegrityCandidates(): Promise<AlertCandidate[]> {
  try {
    const result = await sql`
      SELECT
        c.id,
        c.full_name,
        c.slug,
        c.photo_url,
        COALESCE(s.integrity, 50) as integrity_score,
        p.name as party_name,
        p.short_name as party_short_name,
        p.color as party_color,
        COUNT(DISTINCT f.id) as flag_count,
        ARRAY_AGG(DISTINCT f.type) FILTER (WHERE f.type IS NOT NULL) as flag_types
      FROM candidates c
      LEFT JOIN scores s ON c.id = s.candidate_id
      LEFT JOIN parties p ON c.party_id = p.id
      LEFT JOIN flags f ON c.id = f.candidate_id AND f.severity IN ('RED', 'AMBER')
      WHERE c.cargo = 'presidente' AND c.is_active = true
      AND (s.integrity < 40 OR (SELECT COUNT(*) FROM flags WHERE candidate_id = c.id AND severity IN ('RED', 'AMBER')) > 0)
      GROUP BY c.id, c.full_name, c.slug, c.photo_url, s.integrity, p.name, p.short_name, p.color
      ORDER BY COALESCE(s.integrity, 50) ASC
      LIMIT 6
    `
    return result.map(row => ({
      id: row.id as string,
      full_name: row.full_name as string,
      slug: row.slug as string,
      photo_url: row.photo_url as string | null,
      integrity_score: Number(row.integrity_score) || 0,
      party_name: row.party_name as string | null,
      party_short_name: row.party_short_name as string | null,
      party_color: row.party_color as string | null,
      flag_count: Number(row.flag_count) || 0,
      flag_types: (row.flag_types as string[]) || [],
    }))
  } catch {
    return []
  }
}

interface WorstVoter {
  id: string
  full_name: string
  slug: string
  photo_url: string | null
  party_name: string | null
  party_short_name: string | null
  party_color: string | null
  cargo: string
  favor_count: number
}

async function getWorstVoters(): Promise<{ voters: WorstVoter[]; totalLaws: number }> {
  try {
    const [votersResult, lawsCount] = await Promise.all([
      sql`
        SELECT
          c.id,
          c.full_name,
          c.slug,
          c.photo_url,
          c.cargo,
          p.name as party_name,
          p.short_name as party_short_name,
          p.color as party_color,
          COUNT(CASE WHEN cv.vote = 'favor' THEN 1 END) as favor_count
        FROM candidates c
        JOIN congressional_votes cv ON c.id = cv.candidate_id
        LEFT JOIN parties p ON c.party_id = p.id
        WHERE cv.vote = 'favor'
        GROUP BY c.id, c.full_name, c.slug, c.photo_url, c.cargo, p.name, p.short_name, p.color
        ORDER BY favor_count DESC
        LIMIT 6
      `,
      sql`SELECT COUNT(*) as total FROM controversial_laws`
    ])

    return {
      voters: votersResult.map(row => ({
        id: row.id as string,
        full_name: row.full_name as string,
        slug: row.slug as string,
        photo_url: row.photo_url as string | null,
        party_name: row.party_name as string | null,
        party_short_name: row.party_short_name as string | null,
        party_color: row.party_color as string | null,
        cargo: row.cargo as string,
        favor_count: Number(row.favor_count) || 0,
      })),
      totalLaws: Number(lawsCount[0].total) || 0,
    }
  } catch {
    return { voters: [], totalLaws: 0 }
  }
}

interface ReinfoCandidate {
  id: string
  full_name: string
  slug: string
  photo_url: string | null
  party_name: string | null
  party_short_name: string | null
  party_color: string | null
  cargo: string
  severity: string
  concession_count: number
}

async function getReinfoCandidates(): Promise<ReinfoCandidate[]> {
  try {
    const result = await sql`
      SELECT
        c.id,
        c.full_name,
        c.slug,
        c.photo_url,
        c.cargo,
        p.name as party_name,
        p.short_name as party_short_name,
        p.color as party_color,
        f.severity,
        COUNT(DISTINCT f.id) as concession_count
      FROM candidates c
      JOIN flags f ON c.id = f.candidate_id AND f.type = 'REINFO'
      LEFT JOIN parties p ON c.party_id = p.id
      WHERE c.is_active = true
      GROUP BY c.id, c.full_name, c.slug, c.photo_url, c.cargo, p.name, p.short_name, p.color, f.severity
      ORDER BY
        CASE f.severity WHEN 'RED' THEN 1 WHEN 'AMBER' THEN 2 ELSE 3 END,
        c.full_name
      LIMIT 8
    `
    return result.map(row => ({
      id: row.id as string,
      full_name: row.full_name as string,
      slug: row.slug as string,
      photo_url: row.photo_url as string | null,
      party_name: row.party_name as string | null,
      party_short_name: row.party_short_name as string | null,
      party_color: row.party_color as string | null,
      cargo: row.cargo as string,
      severity: row.severity as string,
      concession_count: Number(row.concession_count) || 0,
    }))
  } catch {
    return []
  }
}

interface ProposalCategory {
  category: string
  count: number
}

async function getProposalsByCategory(): Promise<ProposalCategory[]> {
  try {
    const result = await sql`
      SELECT category, COUNT(*) as count
      FROM candidate_proposals
      GROUP BY category
      ORDER BY count DESC
    `
    return result.map(row => ({
      category: row.category as string,
      count: Number(row.count) || 0,
    }))
  } catch {
    return []
  }
}

async function getBottomPresidentialCandidates(): Promise<TopCandidate[]> {
  try {
    const result = await sql`
      SELECT
        c.id,
        c.full_name,
        c.slug,
        c.photo_url,
        COALESCE(s.score_balanced_p, s.score_balanced) as score,
        p.name as party_name,
        p.short_name as party_short_name,
        p.color as party_color
      FROM candidates c
      LEFT JOIN scores s ON c.id = s.candidate_id
      LEFT JOIN parties p ON c.party_id = p.id
      WHERE c.cargo = 'presidente' AND c.is_active = true
      ORDER BY COALESCE(s.score_balanced_p, s.score_balanced) ASC NULLS FIRST
      LIMIT 5
    `
    return result.map(row => ({
      id: row.id as string,
      full_name: row.full_name as string,
      slug: row.slug as string,
      photo_url: row.photo_url as string | null,
      score_balanced: Number(row.score) || 0,
      party_name: row.party_name as string | null,
      party_short_name: row.party_short_name as string | null,
      party_color: row.party_color as string | null,
    }))
  } catch {
    return []
  }
}

// ── Category icons/colors for proposals ──
const CATEGORY_STYLES: Record<string, { icon: string; color: string }> = {
  economia: { icon: '💰', color: 'bg-emerald-600' },
  seguridad: { icon: '🛡️', color: 'bg-red-700' },
  infraestructura: { icon: '🏗️', color: 'bg-amber-600' },
  reforma_politica: { icon: '⚖️', color: 'bg-blue-700' },
  educacion: { icon: '📚', color: 'bg-purple-600' },
  mineria_ambiente: { icon: '⛏️', color: 'bg-orange-700' },
  social: { icon: '🤝', color: 'bg-pink-600' },
  salud: { icon: '🏥', color: 'bg-teal-600' },
  corrupcion: { icon: '🔍', color: 'bg-indigo-700' },
  otros: { icon: '📋', color: 'bg-gray-600' },
}

export default async function Home() {
  const [stats, topCandidates, parties, alertCandidates, worstVotersData, reinfoCandidates, proposalCategories, bottomCandidates, t] = await Promise.all([
    getStats(),
    getTopPresidentialCandidates(),
    getPartiesWithCounts(),
    getWorstIntegrityCandidates(),
    getWorstVoters(),
    getReinfoCandidates(),
    getProposalsByCategory(),
    getBottomPresidentialCandidates(),
    getTranslations('home')
  ])
  const webSiteSchema = generateWebSiteSchema()
  const orgSchema = generateOrganizationSchema()

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }} />
      <Header currentPath="/" />

      <main id="main-content">
        {/* Ad Banner - Header */}
        <AdBanner slotId="home-header" className="py-2" />

        {/* Countdown Banner - Full Width Urgency */}
        <CountdownBanner />

      {/* Hero Section: CTA + Top 5 Side by Side, with lateral ads */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="flex gap-4">
          {/* Left sidebar ad */}
          <aside className="hidden xl:block w-[160px] flex-shrink-0">
            <div className="sticky top-20">
              <AdSlot slotId="home-sidebar" size="300x250" />
            </div>
          </aside>

          {/* Main content */}
          <div className="flex-1 min-w-0">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">

          {/* Left: Hero CTA */}
          <div className="bg-[var(--primary)] border-3 border-[var(--border)] shadow-[var(--shadow-brutal-xl)] overflow-hidden">
            <div className="h-full p-5 sm:p-6 lg:p-8 flex flex-col justify-between text-white min-h-[300px] sm:min-h-[380px]">
              <div>
                <Badge variant="warning" size="md" className="mb-3">
                  {t('electionDate')}
                </Badge>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black leading-tight mb-3 uppercase tracking-tight">
                  {t('heroTitle')}<br />
                  {t('heroTitleLine2')}
                </h1>
                <p className="text-white/80 text-sm sm:text-base max-w-md font-medium">
                  {t('heroDescription')}
                </p>
              </div>

              {/* Stats inline */}
              <div className="flex items-center gap-4 my-4 py-3 border-t border-b border-white/20">
                <div className="text-center">
                  <span className="text-2xl sm:text-3xl font-black">{stats.totalCandidates}</span>
                  <span className="text-xs font-bold text-white/70 ml-1 uppercase">{t('candidates')}</span>
                </div>
                <div className="w-px h-8 bg-white/30" />
                <div className="text-center">
                  <span className="text-2xl sm:text-3xl font-black">{stats.totalParties}</span>
                  <span className="text-xs font-bold text-white/70 ml-1 uppercase">{t('parties')}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 sm:gap-3">
                <Link href="/ranking">
                  <Button size="lg" className="bg-white text-[var(--primary)] hover:bg-[var(--muted)] border-[var(--border)]">
                    {t('viewRanking')}
                  </Button>
                </Link>
                <Link href="/comparar">
                  <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white/10">
                    {t('compare')}
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Right: Top 5 Presidenciables */}
          <div className="border-3 border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-brutal-lg)]">
            <div className="p-4 sm:p-5 border-b-3 border-[var(--border)] bg-[var(--muted)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-[var(--primary)] border-2 border-[var(--border)] flex items-center justify-center">
                    <span className="text-white font-black text-xs">P</span>
                  </div>
                  <h2 className="text-base sm:text-lg font-black text-[var(--foreground)] uppercase">
                    {t('top3Presidential')}
                  </h2>
                </div>
                <Link
                  href="/ranking?cargo=presidente"
                  className="text-xs font-bold text-[var(--primary)] hover:underline uppercase flex items-center gap-1"
                >
                  {t('viewMore')}
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="square" strokeLinejoin="miter" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>

            {/* Top 3 Grid */}
            {topCandidates.length > 0 ? (
              <div className="p-3 sm:p-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                  {topCandidates.map((candidate, index) => (
                    <CandidateCardMini
                      key={candidate.id}
                      rank={index + 1}
                      candidate={candidate}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-8 text-center">
                <p className="text-sm text-[var(--muted-foreground)]">{t('loadingCandidates')}</p>
              </div>
            )}

            {/* Otros cargos - Mini links */}
            <div className="px-4 pb-4 pt-2 border-t-2 border-[var(--border)]">
              <p className="text-xs font-bold text-[var(--muted-foreground)] uppercase mb-2">{t('alsoView')}</p>
              <div className="flex flex-wrap gap-2">
                <Link href="/ranking?cargo=senador" className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-[var(--background)] border-2 border-[var(--border)] hover:bg-[var(--score-good)] hover:text-white transition-colors uppercase min-h-[44px]">
                  <span className="w-4 h-4 bg-[var(--score-good)] border border-[var(--border)] flex items-center justify-center text-white text-xs font-black">S</span>
                  {t('senators')}
                </Link>
                <Link href="/ranking?cargo=diputado" className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-[var(--background)] border-2 border-[var(--border)] hover:bg-[var(--score-excellent)] hover:text-white transition-colors uppercase min-h-[44px]">
                  <span className="w-4 h-4 bg-[var(--score-excellent)] border border-[var(--border)] flex items-center justify-center text-white text-xs font-black">D</span>
                  {t('deputies')}
                </Link>
                <Link href="/ranking?cargo=parlamento_andino" className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-[var(--background)] border-2 border-[var(--border)] hover:bg-[var(--score-medium)] hover:text-black transition-colors uppercase min-h-[44px]">
                  <span className="w-4 h-4 bg-[var(--score-medium)] border border-[var(--border)] flex items-center justify-center text-black text-xs font-black">A</span>
                  {t('andeanParliament')}
                </Link>
              </div>
            </div>
          </div>

        </div>
          </div>

          {/* Right sidebar ad */}
          <aside className="hidden xl:block w-[160px] flex-shrink-0">
            <div className="sticky top-20">
              <AdSlot slotId="home-sidebar" size="300x250" />
            </div>
          </aside>
        </div>
      </section>

      {/* Quiz CTA - Full width accent */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-4">
        <Link href="/quiz" className="block">
          <div className="bg-gradient-to-r from-[var(--primary)] via-[#8B0000] to-[var(--primary)] border-3 border-[var(--border)] shadow-[var(--shadow-brutal)] p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3 hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[var(--shadow-brutal-xl)] transition-all duration-100">
            <div className="flex items-center gap-3">
              <Badge variant="warning" size="sm">{t('new')}</Badge>
              <span className="text-base sm:text-lg font-black text-white uppercase">
                {t('quizQuestion')}
              </span>
              <span className="text-white/70 text-sm hidden sm:inline">
                {t('quizDescription')}
              </span>
            </div>
            <Button size="sm" className="bg-white text-[var(--primary)] hover:bg-[var(--muted)] border-[var(--border)] whitespace-nowrap">
              {t('takeQuiz')}
              <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="square" strokeLinejoin="miter" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Button>
          </div>
        </Link>
      </section>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* SECTION 1: ALERTA CIUDADANA — Candidates with criminal records */}
      {/* ══════════════════════════════════════════════════════════ */}
      {alertCandidates.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="border-3 border-[var(--score-low)] bg-[var(--card)] shadow-[var(--shadow-brutal-lg)]">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b-3 border-[var(--score-low)] bg-red-50 dark:bg-red-950/30">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[var(--score-low)] border-2 border-[var(--border)] flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15.75h.007v.008H12v-.008z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-black text-[var(--score-low)] uppercase tracking-tight">
                      {t('alertTitle')}
                    </h2>
                    <p className="text-xs sm:text-sm text-[var(--muted-foreground)] font-medium">
                      {t('alertSubtitle')}
                    </p>
                  </div>
                </div>
                <Link
                  href="/ranking?cargo=presidente&preset=integrity"
                  className="text-xs font-bold text-[var(--score-low)] hover:underline uppercase flex items-center gap-1"
                >
                  {t('seeAllFlags')}
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="square" strokeLinejoin="miter" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>

            {/* Candidate grid */}
            <div className="p-3 sm:p-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
                {alertCandidates.map((candidate) => (
                  <Link
                    key={candidate.id}
                    href={`/candidato/${candidate.slug}`}
                    className="group flex flex-col bg-[var(--card)] border-3 border-[var(--border)] hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[var(--shadow-brutal)] transition-all duration-100 overflow-hidden"
                  >
                    <div className="p-3 flex-1 flex flex-col">
                      <h3 className="text-xs font-black text-[var(--foreground)] uppercase leading-tight line-clamp-2 mb-1 group-hover:text-[var(--score-low)] transition-colors">
                        {candidate.full_name}
                      </h3>
                      {candidate.party_name && (
                        <div className="flex items-center gap-1 mb-2">
                          <div
                            className="w-2.5 h-2.5 border border-[var(--border)] flex-shrink-0"
                            style={{ backgroundColor: candidate.party_color || '#6B7280' }}
                          />
                          <span className="text-xs font-bold text-[var(--muted-foreground)] uppercase line-clamp-1">
                            {candidate.party_name}
                          </span>
                        </div>
                      )}
                      <div className="mt-auto space-y-1">
                        {candidate.flag_count > 0 && (
                          <span className="inline-block text-xs font-black text-[var(--score-low)] bg-red-50 dark:bg-red-950/30 px-1.5 py-0.5 border border-[var(--score-low)] uppercase">
                            {candidate.flag_count} {t('flagsCount')}
                          </span>
                        )}
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-bold text-[var(--muted-foreground)] uppercase">{t('integrityScore')}:</span>
                          <span className={`text-xs font-black ${candidate.integrity_score < 30 ? 'text-[var(--score-low)]' : candidate.integrity_score < 50 ? 'text-[var(--score-medium)]' : 'text-[var(--foreground)]'}`}>
                            {candidate.integrity_score.toFixed(0)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* SECTION 2: VOTARON CONTRA EL PERÚ — Worst congressional voters */}
      {/* ══════════════════════════════════════════════════════════ */}
      {worstVotersData.voters.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="border-3 border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-brutal-lg)]">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b-3 border-[var(--border)] bg-[var(--muted)]">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[var(--primary)] border-2 border-[var(--border)] flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 15h2.25m8.024-9.75c.011.05.028.1.052.148.591 1.2.924 2.55.924 3.977a8.96 8.96 0 01-.999 4.125m.023-8.25c-.076-.365.183-.75.575-.75h.908c.889 0 1.713.518 1.972 1.368.339 1.11.521 2.287.521 3.507 0 1.553-.295 3.036-.831 4.398C20.613 14.547 19.833 15 19 15h-1.053c-.472 0-.745-.556-.5-.96a8.95 8.95 0 00.303-.54m.023-8.25H16.48a4.5 4.5 0 01-1.423-.23l-3.114-1.04a4.5 4.5 0 00-1.423-.23H6.504c-.694 0-1.352.353-1.725.926L2.1 12.262a2.25 2.25 0 00-.165.871v.112c0 .796.418 1.534 1.1 1.945l.005.003c.168.097.324.217.455.36l.115.126a2.67 2.67 0 002.395 1.07l.292-.039c.252-.034.503-.076.752-.126" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-black text-[var(--foreground)] uppercase tracking-tight">
                      {t('votedAgainstTitle')}
                    </h2>
                    <p className="text-xs sm:text-sm text-[var(--muted-foreground)] font-medium">
                      {t('votedAgainstSubtitle')}
                    </p>
                  </div>
                </div>
                <Link
                  href="/ranking?cargo=presidente"
                  className="text-xs font-bold text-[var(--primary)] hover:underline uppercase flex items-center gap-1"
                >
                  {t('seeVotingRecords')}
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="square" strokeLinejoin="miter" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>

            {/* Info banner */}
            <div className="px-4 py-3 bg-amber-50 dark:bg-amber-950/20 border-b-2 border-[var(--border)]">
              <p className="text-xs text-[var(--muted-foreground)] font-medium">
                <span className="font-black text-[var(--foreground)]">{worstVotersData.totalLaws}</span> {t('controversialLaws')}. {t('lawCategories')}
              </p>
            </div>

            {/* Voters grid */}
            <div className="p-3 sm:p-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
                {worstVotersData.voters.map((voter) => (
                  <Link
                    key={voter.id}
                    href={`/candidato/${voter.slug}`}
                    className="group flex flex-col bg-[var(--card)] border-3 border-[var(--border)] hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[var(--shadow-brutal)] transition-all duration-100 overflow-hidden"
                  >
                    <div className="p-3 flex-1 flex flex-col">
                      <h3 className="text-xs font-black text-[var(--foreground)] uppercase leading-tight line-clamp-2 mb-1 group-hover:text-[var(--primary)] transition-colors">
                        {voter.full_name}
                      </h3>
                      {voter.party_name && (
                        <div className="flex items-center gap-1 mb-2">
                          <div
                            className="w-2.5 h-2.5 border border-[var(--border)] flex-shrink-0"
                            style={{ backgroundColor: voter.party_color || '#6B7280' }}
                          />
                          <span className="text-xs font-bold text-[var(--muted-foreground)] uppercase line-clamp-1">
                            {voter.party_name}
                          </span>
                        </div>
                      )}
                      <div className="mt-auto">
                        <span className="text-xs font-bold text-[var(--muted-foreground)] uppercase">{t('votedInFavor')}</span>
                        <div className="flex items-baseline gap-1 mt-0.5">
                          <span className="text-lg font-black text-[var(--score-low)]">{voter.favor_count}</span>
                          <span className="text-xs font-bold text-[var(--muted-foreground)]">{t('of17Laws')}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Parties Grid */}
      {parties.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-black text-[var(--foreground)] uppercase tracking-tight">
              {t('politicalParties')}
            </h2>
            <span className="text-xs font-bold text-[var(--muted-foreground)] uppercase">
              {parties.length} {t('partiesCount')}
            </span>
          </div>
          <PartiesGrid parties={parties} />
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* SECTION 3: REINFO — Mining-linked candidates */}
      {/* ══════════════════════════════════════════════════════════ */}
      {reinfoCandidates.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="border-3 border-orange-600 bg-[var(--card)] shadow-[var(--shadow-brutal-lg)]">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b-3 border-orange-600 bg-orange-50 dark:bg-orange-950/30">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-600 border-2 border-[var(--border)] flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20.893 13.393l-1.135-1.135a2.252 2.252 0 01-.421-.585l-1.08-2.16a.414.414 0 00-.663-.107.827.827 0 01-.812.21l-1.273-.363a.89.89 0 00-.738 1.595l.587.39c.59.395.674 1.23.172 1.732l-.2.2c-.212.212-.33.498-.33.796v.41c0 .409-.11.809-.32 1.158l-1.315 2.191a2.11 2.11 0 01-1.81 1.025 1.055 1.055 0 01-1.055-1.055v-1.172c0-.92-.56-1.747-1.414-2.089l-.655-.261a2.25 2.25 0 01-1.383-2.46l.007-.042a2.25 2.25 0 01.29-.787l.09-.15a2.25 2.25 0 012.37-1.048l1.178.236a1.125 1.125 0 001.302-.795l.208-.73a1.125 1.125 0 00-.578-1.315l-.665-.332-.091.091a2.25 2.25 0 01-1.591.659h-.18c-.249 0-.487.1-.662.274a.931.931 0 01-1.458-1.137l1.411-2.353a2.25 2.25 0 00.286-.76m11.928 9.869A9 9 0 008.965 3.525m11.928 9.868A9 9 0 118.965 3.525" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-black text-orange-700 dark:text-orange-400 uppercase tracking-tight">
                      {t('reinfoTitle')}
                    </h2>
                    <p className="text-xs sm:text-sm text-[var(--muted-foreground)] font-medium">
                      {t('reinfoSubtitle')}
                    </p>
                  </div>
                </div>
                <Link
                  href="/ranking?cargo=presidente"
                  className="text-xs font-bold text-orange-700 dark:text-orange-400 hover:underline uppercase flex items-center gap-1"
                >
                  {t('seeAllReinfo')}
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="square" strokeLinejoin="miter" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>

            {/* Source */}
            <div className="px-4 py-2 bg-orange-50/50 dark:bg-orange-950/10 border-b-2 border-[var(--border)]">
              <p className="text-[10px] text-[var(--muted-foreground)] font-medium uppercase tracking-wide">
                {t('reinfoSource')}
              </p>
            </div>

            {/* Candidates grid */}
            <div className="p-3 sm:p-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {reinfoCandidates.map((candidate) => (
                  <Link
                    key={candidate.id}
                    href={`/candidato/${candidate.slug}`}
                    className="group flex flex-col bg-[var(--card)] border-2 border-[var(--border)] hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[var(--shadow-brutal)] transition-all duration-100 overflow-hidden"
                  >
                    {/* Photo with severity overlay */}
                    <div className="relative aspect-square bg-[var(--muted)] overflow-hidden">
                      <CandidateImage
                        src={candidate.photo_url}
                        name={candidate.full_name}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      />
                      <div className={`absolute top-2 left-2 flex items-center gap-1 px-2 py-1 text-xs font-black text-white uppercase ${candidate.severity === 'RED' ? 'bg-red-600/90' : 'bg-orange-500/90'}`}>
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                        </svg>
                        {candidate.severity === 'RED' ? 'ALTO' : 'MEDIO'}
                      </div>
                    </div>
                    {/* Info */}
                    <div className="p-3 flex-1 flex flex-col">
                      <h3 className="text-sm font-black text-[var(--foreground)] uppercase leading-tight line-clamp-2 mb-1 group-hover:text-orange-700 transition-colors">
                        {candidate.full_name}
                      </h3>
                      {candidate.party_name && (
                        <span className="text-xs font-bold text-[var(--muted-foreground)] uppercase line-clamp-1">
                          {candidate.party_name}
                        </span>
                      )}
                      <div className="mt-auto pt-2 flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-orange-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M20.893 13.393l-1.135-1.135a2.252 2.252 0 01-.421-.585l-1.08-2.16a.414.414 0 00-.663-.107.827.827 0 01-.812.21l-1.273-.363a.89.89 0 00-.738 1.595l.587.39c.59.395.674 1.23.172 1.732l-.2.2c-.212.212-.33.498-.33.796v.41c0 .409-.11.809-.32 1.158l-1.315 2.191a2.11 2.11 0 01-1.81 1.025 1.055 1.055 0 01-1.055-1.055v-1.172c0-.92-.56-1.747-1.414-2.089l-.655-.261a2.25 2.25 0 01-1.383-2.46l.007-.042a2.25 2.25 0 01.29-.787l.09-.15a2.25 2.25 0 012.37-1.048l1.178.236a1.125 1.125 0 001.302-.795l.208-.73a1.125 1.125 0 00-.578-1.315l-.665-.332-.091.091a2.25 2.25 0 01-1.591.659h-.18c-.249 0-.487.1-.662.274a.931.931 0 01-1.458-1.137l1.411-2.353a2.25 2.25 0 00.286-.76m11.928 9.869A9 9 0 008.965 3.525m11.928 9.868A9 9 0 118.965 3.525" />
                        </svg>
                        <span className="text-xs font-bold text-orange-700 dark:text-orange-400 uppercase">
                          {candidate.concession_count} {candidate.concession_count === 1 ? t('concession') : t('concessions')}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Ad Banner - Mid */}
      <AdBanner slotId="home-mid" className="py-2" />

      {/* ══════════════════════════════════════════════════════════ */}
      {/* SECTION 4: ¿QUÉ PROPONEN? — Proposals by category */}
      {/* ══════════════════════════════════════════════════════════ */}
      {proposalCategories.length > 0 && (() => {
        const maxCount = Math.max(...proposalCategories.map(c => c.count))
        return (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <div className="border-3 border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-brutal-lg)]">
              {/* Header */}
              <div className="p-4 sm:p-5 border-b-3 border-[var(--border)] bg-[var(--muted)]">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h2 className="text-lg sm:text-xl font-black text-[var(--foreground)] uppercase tracking-tight">
                      {t('proposalsTitle')}
                    </h2>
                    <p className="text-xs sm:text-sm text-[var(--muted-foreground)] font-medium mt-1">
                      {t('proposalsSubtitle')}
                    </p>
                  </div>
                  <Link
                    href="/ranking?cargo=presidente"
                    className="text-xs font-bold text-[var(--primary)] hover:underline uppercase flex items-center gap-1"
                  >
                    {t('seeProposals')}
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="square" strokeLinejoin="miter" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>

              {/* Bar chart rows */}
              <div className="divide-y-2 divide-[var(--border)]">
                {proposalCategories.map((cat, index) => {
                  const style = CATEGORY_STYLES[cat.category] || CATEGORY_STYLES.otros
                  const categoryKey = `propCategory_${cat.category}` as const
                  const percentage = (cat.count / maxCount) * 100
                  return (
                    <div
                      key={cat.category}
                      className="flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3 sm:py-4 hover:bg-[var(--muted)]/50 transition-colors"
                    >
                      {/* Icon */}
                      <div className={`w-9 h-9 sm:w-10 sm:h-10 ${style.color} border-2 border-[var(--border)] flex items-center justify-center text-white text-sm sm:text-base flex-shrink-0`}>
                        {style.icon}
                      </div>
                      {/* Name + Bar */}
                      <div className="flex-1 min-w-0">
                        <span className="text-xs sm:text-sm font-black text-[var(--foreground)] uppercase leading-tight">
                          {t.has(categoryKey) ? t(categoryKey) : cat.category.replace(/_/g, ' ')}
                        </span>
                        <div className="mt-1.5 h-3 sm:h-4 bg-[var(--muted)] border border-[var(--border)] overflow-hidden">
                          <div
                            className={`h-full ${style.color} ${index === 0 ? 'opacity-100' : 'opacity-75'} transition-all duration-500`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                      {/* Count */}
                      <div className="flex items-baseline gap-1 flex-shrink-0">
                        <span className={`text-xl sm:text-2xl font-black ${index === 0 ? 'text-[var(--primary)]' : 'text-[var(--foreground)]'}`}>
                          {cat.count}
                        </span>
                        <span className="text-xs font-bold text-[var(--muted-foreground)] uppercase hidden sm:inline">
                          {t('proposalsCount')}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>
        )
      })()}

      {/* Daily Fact - Full width */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <DailyFact variant="card" />
      </section>

      {/* Trending News - With sidebar ad on desktop */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="lg:flex lg:gap-6">
          <div className="flex-1 min-w-0">
            <TrendingNews limit={6} variant="grid" />
          </div>
          <aside className="hidden lg:block w-[300px] flex-shrink-0">
            <div className="sticky top-20 space-y-4">
              <AdSlot slotId="home-sidebar" size="300x250" />
            </div>
          </aside>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* SECTION 5: PEORES PUNTAJES — Bottom 5 presidential candidates */}
      {/* ══════════════════════════════════════════════════════════ */}
      {bottomCandidates.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="border-3 border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-brutal-lg)]">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b-3 border-[var(--border)] bg-[var(--muted)]">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[var(--score-low)] border-2 border-[var(--border)] flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h14.25M3 9h9.75M3 13.5h5.25m5.25-.75L17.25 9m0 0L21 12.75M17.25 9v12" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-black text-[var(--foreground)] uppercase tracking-tight">
                      {t('bottom5Title')}
                    </h2>
                    <p className="text-xs sm:text-sm text-[var(--muted-foreground)] font-medium">
                      {t('bottom5Subtitle')}
                    </p>
                  </div>
                </div>
                <Link
                  href="/ranking?cargo=presidente"
                  className="text-xs font-bold text-[var(--primary)] hover:underline uppercase flex items-center gap-1"
                >
                  {t('seeFullRanking')}
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="square" strokeLinejoin="miter" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>

            {/* Bottom 5 grid */}
            <div className="p-3 sm:p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {bottomCandidates.map((candidate, index) => (
                  <Link
                    key={candidate.id}
                    href={`/candidato/${candidate.slug}`}
                    className="group flex flex-col bg-[var(--card)] border-3 border-[var(--border)] hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[var(--shadow-brutal)] transition-all duration-100 overflow-hidden"
                  >
                    {/* Photo with position badge and gradient overlay */}
                    <div className="relative aspect-[4/3] bg-[var(--muted)] overflow-hidden">
                      <CandidateImage
                        src={candidate.photo_url}
                        name={candidate.full_name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 20vw"
                      />
                      {/* Position badge */}
                      <div className="absolute top-2 left-2 w-8 h-8 bg-[var(--score-low)] border-2 border-[var(--border)] flex items-center justify-center">
                        <span className="text-white font-black text-sm">{index + 1}</span>
                      </div>
                      {/* Gradient overlay with name */}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 pt-8">
                        <h3 className="text-sm font-black text-white uppercase leading-tight line-clamp-2">
                          {candidate.full_name}
                        </h3>
                        {candidate.party_name && (
                          <div className="flex items-center gap-1.5 mt-1">
                            <div
                              className="w-2.5 h-2.5 border border-white/50 flex-shrink-0"
                              style={{ backgroundColor: candidate.party_color || '#6B7280' }}
                            />
                            <span className="text-xs font-bold text-white/80 uppercase line-clamp-1">
                              {candidate.party_name}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Score bar */}
                    <div className="p-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-[var(--muted-foreground)] uppercase">{t('scoreLabel')}</span>
                        <div className={`inline-flex items-center gap-1 px-2 py-0.5 border-2 border-[var(--border)] font-black text-sm ${candidate.score_balanced < 30 ? 'bg-[var(--score-low)] text-white' : candidate.score_balanced < 50 ? 'bg-[var(--score-medium)] text-black' : 'bg-[var(--score-good)] text-white'}`}>
                          <span>{candidate.score_balanced.toFixed(0)}</span>
                          <span className="text-xs font-bold opacity-70">/100</span>
                        </div>
                      </div>
                      <div className="h-2.5 bg-[var(--muted)] border border-[var(--border)] overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${candidate.score_balanced < 30 ? 'bg-[var(--score-low)]' : candidate.score_balanced < 50 ? 'bg-[var(--score-medium)]' : 'bg-[var(--score-good)]'}`}
                          style={{ width: `${candidate.score_balanced}%` }}
                        />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Scoring Methodology - Con hover interactivo */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mb-4">
          <h2 className="text-lg sm:text-xl font-black text-[var(--foreground)] uppercase tracking-tight">
            {t('howWeEvaluate')}
          </h2>
          <Link href="/metodologia" className="text-sm font-bold text-[var(--primary)] hover:underline uppercase flex items-center gap-1">
            {t('viewFullMethodology')}
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="square" strokeLinejoin="miter" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Link href="/metodologia#competencia" className="group">
            <Card className="p-4 h-full hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[var(--shadow-brutal-lg)] transition-all duration-100">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[var(--score-competence)] border-3 border-[var(--border)] flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <span className="text-lg sm:text-xl font-black text-white">C</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-black text-[var(--foreground)] mb-1 uppercase group-hover:text-[var(--primary)] transition-colors">
                    {t('competence')}
                  </h3>
                  <p className="text-xs text-[var(--muted-foreground)] leading-relaxed font-medium">
                    {t('competenceDesc')}
                  </p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/metodologia#historial-legal" className="group">
            <Card className="p-4 h-full hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[var(--shadow-brutal-lg)] transition-all duration-100">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[var(--score-integrity)] border-3 border-[var(--border)] flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <span className="text-lg sm:text-xl font-black text-white">I</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-black text-[var(--foreground)] mb-1 uppercase group-hover:text-[var(--primary)] transition-colors">
                    {t('integrity')}
                  </h3>
                  <p className="text-xs text-[var(--muted-foreground)] leading-relaxed font-medium">
                    {t('integrityDesc')}
                  </p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/metodologia#transparencia" className="group">
            <Card className="p-4 h-full hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[var(--shadow-brutal-lg)] transition-all duration-100">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[var(--score-transparency)] border-3 border-[var(--border)] flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <span className="text-lg sm:text-xl font-black text-black">T</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-black text-[var(--foreground)] mb-1 uppercase group-hover:text-[var(--primary)] transition-colors">
                    {t('transparency')}
                  </h3>
                  <p className="text-xs text-[var(--muted-foreground)] leading-relaxed font-medium">
                    {t('transparencyDesc')}
                  </p>
                </div>
              </div>
            </Card>
          </Link>
        </div>

        {/* Trust indicators inline - más compacto que sección separada */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-4 sm:gap-6 py-3 border-t-2 border-b-2 border-[var(--border)]">
          <div className="flex items-center gap-2 text-xs font-bold text-[var(--muted-foreground)] uppercase">
            <svg className="w-4 h-4 text-[var(--score-excellent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="square" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            {t('officialSources')}
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-[var(--muted-foreground)] uppercase">
            <svg className="w-4 h-4 text-[var(--score-good)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="square" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {t('verifiable')}
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-[var(--muted-foreground)] uppercase">
            <svg className="w-4 h-4 text-[var(--primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="square" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
            {t('noPoliticalAffiliation')}
          </div>
        </div>
      </section>

      {/* Districts - Más compacto, integrado */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <Card className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <h2 className="text-sm sm:text-base font-black text-[var(--foreground)] uppercase tracking-tight">
              {t('deputiesByDistrict')}
            </h2>
            <Link href="/ranking?cargo=diputado" className="text-xs font-bold text-[var(--primary)] hover:underline uppercase">
              {t('viewAll')} →
            </Link>
          </div>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {DISTRICTS.slice(0, 12).map((district) => (
              <Link
                key={district.slug}
                href={`/distrito/${district.slug}`}
              >
                <Badge
                  variant="outline"
                  size="sm"
                  className="cursor-pointer hover:bg-[var(--primary)] hover:text-white hover:border-[var(--primary)] transition-all duration-100 text-xs"
                >
                  {district.name}
                </Badge>
              </Link>
            ))}
            {DISTRICTS.length > 12 && (
              <Link href="/ranking?cargo=diputado">
                <Badge variant="primary" size="sm" className="cursor-pointer">
                  +{DISTRICTS.length - 12} {t('more')}
                </Badge>
              </Link>
            )}
          </div>
        </Card>
      </section>
      {/* Ad Banner - Footer */}
      <AdBanner slotId="home-footer" className="py-2" />
      </main>

      {/* Footer - NEO BRUTAL - Mobile Optimized */}
      <footer className="border-t-4 border-[var(--border)] bg-[var(--card)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 md:gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--primary)] border-3 border-[var(--border)] shadow-[var(--shadow-brutal-sm)] flex items-center justify-center">
                <span className="text-white font-black text-sm">PE</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm sm:text-base font-black text-[var(--foreground)] uppercase">{t('rankingElectoral')}</span>
                <span className="text-xs text-[var(--primary)] font-bold uppercase tracking-widest">{t('peru2026')}</span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
              <Link href="/metodologia" className="text-sm font-bold text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors uppercase tracking-wide min-h-[44px] flex items-center">
                {t('methodology')}
              </Link>
              <Link href="/ranking" className="text-sm font-bold text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors uppercase tracking-wide min-h-[44px] flex items-center">
                {t('rankings')}
              </Link>
              <Link href="/comparar" className="text-sm font-bold text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors uppercase tracking-wide min-h-[44px] flex items-center">
                {t('compare')}
              </Link>
              <Link href="/privacidad" className="text-sm font-bold text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors uppercase tracking-wide min-h-[44px] flex items-center">
                {t('privacy')}
              </Link>
              <Link href="/rectificacion" className="text-sm font-bold text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors uppercase tracking-wide min-h-[44px] flex items-center">
                {t('rectification')}
              </Link>
            </div>
            <div className="flex flex-col items-center md:items-end gap-2">
              <DataFreshnessFooter />
              <div className="text-xs text-[var(--muted-foreground)] font-medium text-center md:text-right">
                <span>{t('operatedBy')}</span>
                <span className="mx-1">·</span>
                <a href="mailto:legal@rankingelectoral.pe" className="hover:text-[var(--foreground)] transition-colors">
                  legal@rankingelectoral.pe
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
