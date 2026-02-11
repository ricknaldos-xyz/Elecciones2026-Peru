'use client'

import { useState, useEffect, useRef } from 'react'
import { Link } from '@/i18n/routing'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import { CandidateImage } from '@/components/candidate/CandidateImage'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { Header } from '@/components/layout/Header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Tabs, TabList, Tab, TabPanel } from '@/components/ui/Tabs'
import { ScorePill } from '@/components/candidate/ScorePill'
import { SubScoreBar, SubScoreStat } from '@/components/candidate/SubScoreBar'
import { Progress } from '@/components/ui/Progress'
import { FlagChips } from '@/components/candidate/FlagChip'
import { ConfidenceBadge } from '@/components/candidate/ConfidenceBadge'
import { ShareButton } from '@/components/share/ShareButton'
import { PartyLogo } from '@/components/party/PartyLogo'
import { AdBanner } from '@/components/ads/AdBanner'
import { AdSlot } from '@/components/ads/AdSlot'
import { TaxStatusCard } from '@/components/candidate/TaxStatusCard'
import { ProposalQualityCard } from '@/components/candidate/ProposalQualityCard'
import { PlanViabilityCard } from '@/components/candidate/PlanViabilityCard'
import { JudicialDiscrepancyCard } from '@/components/candidate/JudicialDiscrepancyCard'
import { IncumbentPerformanceCard } from '@/components/candidate/IncumbentPerformanceCard'
import { CompanyIssuesCard } from '@/components/candidate/CompanyIssuesCard'
import { ControversialVotesCard } from '@/components/candidate/ControversialVotesCard'
import { AssetsDeclarationCard } from '@/components/candidate/AssetsDeclarationCard'
import { ExperienceOverlapBadge } from '@/components/candidate/ExperienceOverlapBadge'

// Lazy load heavy components used in secondary tabs
const SocialMentionsCard = dynamic(() => import('@/components/candidate/SocialMentionsCard').then(m => ({ default: m.SocialMentionsCard })), { ssr: false })
const CandidateProposals = dynamic(() => import('@/components/proposals/CandidateProposals').then(m => ({ default: m.CandidateProposals })), { ssr: false })
const VotingRecordCard = dynamic(() => import('@/components/candidate/VotingRecordCard').then(m => ({ default: m.VotingRecordCard })), { ssr: false })
const CandidateNewsSection = dynamic(() => import('@/components/news/CandidateNewsSection').then(m => ({ default: m.CandidateNewsSection })), { ssr: false })
import { PRESETS, PRESIDENTIAL_PRESETS } from '@/lib/constants'
import { getScoreByMode } from '@/lib/scoring/utils'
import type { CandidateWithScores, PresetType, ScoreBreakdown } from '@/types/database'
import type { CandidateDetails, VicePresident } from '@/lib/db/queries'

interface CandidateProfileContentProps {
  candidate: CandidateWithScores
  breakdown: ScoreBreakdown | null
  details: CandidateDetails | null
  vicePresidents?: VicePresident[]
}

const severityColors: Record<string, { bg: string; text: string; border: string }> = {
  RED: { bg: 'bg-[var(--flag-red-bg)]', text: 'text-[var(--flag-red-text)]', border: 'border-[var(--flag-red)]' },
  AMBER: { bg: 'bg-[var(--flag-amber-bg)]', text: 'text-[var(--flag-amber-text)]', border: 'border-[var(--flag-amber)]' },
  GRAY: { bg: 'bg-[var(--muted)]', text: 'text-[var(--flag-gray-text)]', border: 'border-[var(--border)]' },
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value)
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' })
  } catch {
    return dateStr
  }
}

// Visual breakdown bar component
function BreakdownBar({
  label,
  value,
  max,
  color
}: {
  label: string
  value: number
  max: number
  color: 'competence' | 'integrity' | 'transparency' | 'plan' | 'default'
}) {
  const percentage = Math.min((value / max) * 100, 100)
  const colorClasses = {
    competence: 'bg-[var(--score-competence)]',
    integrity: 'bg-[var(--score-integrity)]',
    transparency: 'bg-[var(--score-transparency)]',
    plan: 'bg-[var(--score-plan)]',
    default: 'bg-[var(--muted-foreground)]',
  }
  const patternClasses = {
    competence: 'pattern-competence',
    integrity: 'pattern-integrity',
    transparency: 'pattern-transparency',
    plan: 'pattern-plan',
    default: '',
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="font-bold text-[var(--muted-foreground)] uppercase">{label}</span>
        <span className="font-black text-[var(--foreground)]">{value.toFixed(1)}/{max}</span>
      </div>
      <div className="h-2 bg-[var(--muted)] border-2 border-[var(--border)] overflow-hidden">
        <div
          className={cn('h-full transition-all duration-300', colorClasses[color], patternClasses[color])}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

export function CandidateProfileContent({ candidate, breakdown, details, vicePresidents = [] }: CandidateProfileContentProps) {
  const router = useRouter()
  const t = useTranslations('candidate')
  const tRanking = useTranslations('ranking')
  const tMeta = useTranslations('meta')
  const tCommon = useTranslations('common')
  const [mode, setMode] = useState<PresetType>('balanced')
  const [showStickyBar, setShowStickyBar] = useState(false)
  const heroRef = useRef<HTMLDivElement>(null)

  // Trajectory context: voting and performance summaries
  const [trajectoryContext, setTrajectoryContext] = useState<{
    votedInFavor?: number
    votedAgainst?: number
    totalControversialLaws?: number
    budgetExecutionPct?: number
    budgetRating?: string
    cargoActual?: string
  } | null>(null)

  useEffect(() => {
    async function fetchTrajectoryContext() {
      const results: typeof trajectoryContext = {}
      try {
        const [votingRes, perfRes] = await Promise.all([
          fetch(`/api/candidates/${candidate.id}/voting-details`).catch(() => null),
          fetch(`/api/candidates/${candidate.id}/performance`).catch(() => null),
        ])
        if (votingRes?.ok) {
          const v = await votingRes.json()
          if (v.controversialVotes?.length > 0) {
            results.votedInFavor = v.votedInFavor
            results.votedAgainst = v.votedAgainst
            results.totalControversialLaws = v.totalControversialLaws
          }
        }
        if (perfRes?.ok) {
          const p = await perfRes.json()
          if (p.isIncumbent && p.budgetExecution) {
            results.budgetExecutionPct = p.budgetExecution.pct
            results.budgetRating = p.budgetExecution.rating
            results.cargoActual = p.cargoActual
          }
        }
        if (Object.keys(results).length > 0) {
          setTrajectoryContext(results)
        }
      } catch {
        // Silently fail - badges are optional
      }
    }
    fetchTrajectoryContext()
  }, [candidate.id])

  // Fetch similar candidates (same cargo, excluding current)
  const [similarCandidates, setSimilarCandidates] = useState<CandidateWithScores[]>([])
  useEffect(() => {
    async function fetchSimilar() {
      try {
        const res = await fetch(`/api/candidates?cargo=${candidate.cargo}&limit=5`)
        if (!res.ok) return
        const data: CandidateWithScores[] = await res.json()
        setSimilarCandidates(data.filter(c => c.id !== candidate.id).slice(0, 4))
      } catch {
        // Optional — silently fail
      }
    }
    fetchSimilar()
  }, [candidate.id, candidate.cargo])

  // Detect scroll to show/hide sticky bar
  useEffect(() => {
    const handleScroll = () => {
      if (heroRef.current) {
        const heroBottom = heroRef.current.getBoundingClientRect().bottom
        setShowStickyBar(heroBottom < 60)
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const isPresidential = candidate.cargo === 'presidente'
  const activeWeights = isPresidential && candidate.scores.plan_viability != null
    ? PRESIDENTIAL_PRESETS[mode as keyof typeof PRESIDENTIAL_PRESETS]
    : PRESETS[mode as keyof typeof PRESETS]

  const getScore = () => {
    return getScoreByMode(candidate.scores, mode, activeWeights, isPresidential)
  }

  const getCargoLabel = (cargo: string) => {
    try {
      return tRanking(`cargo.${cargo}`)
    } catch {
      return cargo
    }
  }

  const getFlagTypeLabel = (type: string) => {
    try {
      return t(`flagTypes.${type}`)
    } catch {
      return type
    }
  }

  const getFlagSeverityLabel = (severity: string) => {
    try {
      return t(`flagSeverity.${severity}`)
    } catch {
      return severity
    }
  }

  const shareTitle = `${candidate.full_name} - ${tMeta('title')}`
  const shareDescription = `${t('scores.title')}: ${getScore().toFixed(1)}/100 | ${t('scores.competence')}: ${candidate.scores.competence.toFixed(0)} | ${t('scores.integrity')}: ${candidate.scores.integrity.toFixed(0)} | ${t('scores.transparency')}: ${candidate.scores.transparency.toFixed(0)}`

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header />

      {/* Ad Banner - Header */}
      <AdBanner slotId="internal-header" className="py-2" />

      {/* Sticky Summary Bar - appears on scroll */}
      <div
        className={cn(
          'fixed top-0 left-0 right-0 z-40',
          'bg-[var(--card)] border-b-3 border-[var(--border)]',
          'shadow-[var(--shadow-brutal)]',
          'transition-transform duration-200',
          showStickyBar ? 'translate-y-0' : '-translate-y-full'
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {/* Back button */}
              <button
                onClick={() => router.back()}
                className="p-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="square" strokeLinejoin="miter" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              {/* Photo mini */}
              <div className="w-8 h-8 border-2 border-[var(--border)] bg-[var(--muted)] overflow-hidden flex-shrink-0 relative">
                <CandidateImage src={candidate.photo_url} name={candidate.full_name} fill sizes="32px" priority containerClassName="text-xs" />
              </div>
              {/* Name truncated */}
              <span className="font-bold text-[var(--foreground)] truncate text-sm uppercase">
                {candidate.full_name}
              </span>
            </div>
            {/* Score pill mini */}
            <div className={cn(
              'flex-shrink-0 px-3 py-1 border-2 border-[var(--border)]',
              'font-black text-sm',
              getScore() >= 70 ? 'bg-[var(--score-excellent-bg)] text-[var(--score-excellent-text)]' :
              getScore() >= 50 ? 'bg-[var(--score-good-bg)] text-[var(--score-good-text)]' :
              getScore() >= 30 ? 'bg-[var(--score-medium-bg)] text-[var(--score-medium-text)]' :
              'bg-[var(--score-low-bg)] text-[var(--score-low-text)]'
            )}>
              {getScore().toFixed(0)}
            </div>
          </div>
        </div>
      </div>

      <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb Navigation */}
        <nav className="mb-4 flex items-center gap-2 text-sm">
          <Link href="/ranking" className="text-[var(--muted-foreground)] hover:text-[var(--primary)] font-bold uppercase transition-colors">
            {tRanking('title')}
          </Link>
          <svg className="w-4 h-4 text-[var(--muted-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="square" d="M9 5l7 7-7 7" />
          </svg>
          <Link href={`/ranking?cargo=${candidate.cargo}`} className="text-[var(--muted-foreground)] hover:text-[var(--primary)] font-bold uppercase transition-colors">
            {getCargoLabel(candidate.cargo)}
          </Link>
          <svg className="w-4 h-4 text-[var(--muted-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="square" d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-[var(--foreground)] font-bold uppercase truncate">
            {candidate.full_name.split(' ').slice(0, 2).join(' ')}
          </span>
        </nav>

        {/* Main Layout - Sidebar on desktop */}
        <div className="lg:grid lg:grid-cols-[1fr_320px] lg:gap-6">
          {/* Main Content Column */}
          <div className="space-y-6">
            {/* Hero Section - Mobile Optimized */}
            <div ref={heroRef}>
              <Card className="overflow-hidden">
          <div className="p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
              {/* Photo - Smaller on mobile */}
              <div className="flex-shrink-0">
                <div className="w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 border-3 border-[var(--border)] bg-[var(--muted)] overflow-hidden mx-auto sm:mx-0 relative">
                  <CandidateImage src={candidate.photo_url} name={candidate.full_name} fill sizes="(max-width: 640px) 96px, (max-width: 1024px) 112px, 128px" priority containerClassName="text-2xl sm:text-3xl" />
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-[var(--foreground)] mb-2 sm:mb-3 uppercase tracking-tight">
                  {candidate.full_name}
                </h1>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                  <Badge variant="primary" size="sm" className="sm:size-md">
                    {getCargoLabel(candidate.cargo)}
                  </Badge>
                  {candidate.party && (
                    <Badge
                      size="sm"
                      className="sm:size-md"
                      style={{
                        backgroundColor: candidate.party.color || '#6B7280',
                        color: '#fff',
                      }}
                    >
                      {candidate.party.name}
                    </Badge>
                  )}
                  {candidate.district && (
                    <Badge variant="outline" size="sm" className="sm:size-md">{candidate.district.name}</Badge>
                  )}
                </div>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  {candidate.data_verified ? (
                    <Badge variant="success" size="sm" className="gap-1">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="square" strokeLinejoin="miter" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {t('verified')}
                    </Badge>
                  ) : (
                    <Badge variant="warning" size="sm" className="gap-1">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="square" strokeLinejoin="miter" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      {t('notVerified')}
                    </Badge>
                  )}
                  <ConfidenceBadge value={candidate.scores.confidence} size="md" />
                  <ShareButton
                    title={shareTitle}
                    description={shareDescription}
                    variant="icon"
                  />
                </div>
              </div>

              {/* Score - Responsive sizing and touch-friendly mode buttons */}
              <div className="flex-shrink-0 flex flex-col items-center justify-center">
                {/* Mobile: md size, Desktop: lg size */}
                <div className="sm:hidden">
                  <ScorePill
                    score={getScore()}
                    mode={mode}
                    weights={activeWeights}
                    size="md"
                    variant="default"
                    showMode
                  />
                </div>
                <div className="hidden sm:flex">
                  <ScorePill
                    score={getScore()}
                    mode={mode}
                    weights={activeWeights}
                    size="lg"
                    variant="default"
                    showMode
                  />
                </div>
                {/* Mode selector with touch-friendly targets (44px min) */}
                <div className="flex flex-wrap justify-center gap-1 sm:gap-1.5 mt-3">
                  {(['balanced', 'merit', 'integrity'] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setMode(m)}
                      className={cn(
                        'px-2.5 py-2.5 sm:px-3 sm:py-1.5 text-xs font-bold uppercase tracking-wide border-2 transition-all duration-100',
                        'min-h-[44px] min-w-[64px] sm:min-h-0 sm:min-w-0',
                        mode === m
                          ? 'bg-[var(--primary)] text-white border-[var(--border)] shadow-[var(--shadow-brutal-sm)] -translate-x-0.5 -translate-y-0.5'
                          : 'bg-[var(--background)] text-[var(--foreground)] border-transparent hover:border-[var(--border)] hover:-translate-x-0.5 hover:-translate-y-0.5'
                      )}
                    >
                      {tRanking(`presets.${m}`)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sub-scores strip - Responsive gaps */}
          <div className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4 bg-[var(--muted)] border-t-3 border-[var(--border)]">
            <div className={cn(
              'grid gap-2 sm:gap-4 lg:gap-6',
              candidate.scores.plan_viability != null ? 'grid-cols-4' : 'grid-cols-3'
            )}>
              <SubScoreStat type="competence" value={candidate.scores.competence} size="sm" />
              <SubScoreStat type="integrity" value={candidate.scores.integrity} size="sm" />
              <SubScoreStat type="transparency" value={candidate.scores.transparency} size="sm" />
              {candidate.scores.plan_viability != null && (
                <SubScoreStat type="plan" value={candidate.scores.plan_viability} size="sm" />
              )}
            </div>
          </div>
        </Card>
            </div>

        {/* Flags Alert */}
        {candidate.flags.length > 0 && (
          <Card className={cn(
            'mb-6 border-3',
            candidate.flags.some(f => f.severity === 'RED')
              ? 'bg-[var(--flag-red)]/10 border-[var(--flag-red)]'
              : 'bg-[var(--flag-amber)]/10 border-[var(--flag-amber)]'
          )}>
            {/* Reduced padding on mobile */}
            <div className="p-4 sm:p-5">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className={cn(
                  'p-2 sm:p-2.5 border-2 flex-shrink-0',
                  candidate.flags.some(f => f.severity === 'RED')
                    ? 'bg-[var(--flag-red-bg)] border-[var(--flag-red)]'
                    : 'bg-[var(--flag-amber-bg)] border-[var(--flag-amber)]'
                )}>
                  <svg className={cn(
                    'w-4 h-4 sm:w-5 sm:h-5',
                    candidate.flags.some(f => f.severity === 'RED')
                      ? 'text-[var(--flag-red-text)]'
                      : 'text-[var(--flag-amber-text)]'
                  )} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="square" strokeLinejoin="miter" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className={cn(
                    'text-sm sm:text-base font-black uppercase tracking-wide mb-1',
                    candidate.flags.some(f => f.severity === 'RED')
                      ? 'text-[var(--flag-red-text)]'
                      : 'text-[var(--flag-amber-text)]'
                  )}>
                    {t('flagsFound', { count: candidate.flags.length })}
                  </h3>
                  <p className={cn(
                    'text-xs sm:text-sm font-medium mb-2 sm:mb-3',
                    candidate.flags.some(f => f.severity === 'RED')
                      ? 'text-[var(--flag-red-text)]'
                      : 'text-[var(--flag-amber-text)]'
                  )}>
                    {t('flagsDescription')}
                  </p>
                  <FlagChips flags={candidate.flags} maxVisible={5} size="sm" className="sm:size-md" />
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Tabs - Edge-to-edge scroll on mobile */}
        <Tabs defaultTab="resumen">
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 sm:overflow-visible mb-4">
            <TabList className="min-w-max sm:min-w-0">
              <Tab value="resumen">{t('tabs.summary')}</Tab>
              <Tab value="propuestas">{t('tabs.proposals') || 'Propuestas'}</Tab>
              <Tab value="noticias">{t('tabs.news')}</Tab>
              <Tab value="evidencia">{t('tabs.evidence')}</Tab>
              <Tab value="breakdown">{t('tabs.breakdown')}</Tab>
            </TabList>
          </div>

          {/* ==================== RESUMEN TAB ==================== */}
          <TabPanel value="resumen">
            <div className="space-y-6">
              {/* Datos Personales */}
              {details && (
                <Card>
                  <CardHeader>
                    <CardTitle>{t('personalData')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* Grid-1 on mobile, grid-2 on tablet+ */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {details.birth_date && (
                        <div>
                          <span className="text-sm font-bold uppercase text-[var(--muted-foreground)]">{t('birthDate')}</span>
                          <p className="font-bold text-[var(--foreground)]">{formatDate(details.birth_date)}</p>
                        </div>
                      )}
                      {details.dni && (
                        <div>
                          <span className="text-sm font-bold uppercase text-[var(--muted-foreground)]">{t('dni')}</span>
                          <p className="font-bold text-[var(--foreground)]">{details.dni}</p>
                        </div>
                      )}
                    </div>
                    {details.djhv_url && (
                      <div className="mt-4 pt-4 border-t-2 border-[var(--border)]">
                        <a
                          href={details.djhv_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[var(--primary)] hover:underline text-sm font-bold flex items-center gap-1 uppercase"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="square" strokeLinejoin="miter" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          {t('viewDJHV')}
                        </a>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Educación */}
              {details && details.education_details.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>{t('academicBackground')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {details.education_details.map((edu, idx) => (
                        <div key={idx} className="flex gap-3 sm:gap-4 pb-4 border-b-2 border-[var(--border)] last:border-0 last:pb-0">
                          {/* Smaller icon on mobile */}
                          <div className={cn(
                            'w-8 h-8 sm:w-10 sm:h-10 border-2 border-[var(--border)] flex items-center justify-center flex-shrink-0',
                            edu.level === 'Doctorado' ? 'bg-[var(--score-integrity)]/20 text-[var(--score-integrity-text)]' :
                            edu.level === 'Maestría' ? 'bg-[var(--score-transparency)]/20 text-[var(--score-transparency-text)]' :
                            edu.level === 'Universitario' || edu.level === 'Título Profesional' ? 'bg-[var(--score-competence)]/20 text-[var(--score-competence-text)]' :
                            'bg-[var(--muted)] text-[var(--muted-foreground)]'
                          )}>
                            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path d="M12 14l9-5-9-5-9 5 9 5z" />
                              <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                              <path strokeLinecap="square" strokeLinejoin="miter" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-bold text-[var(--foreground)]">
                                  {edu.degree || edu.level}
                                </h4>
                                <p className="text-sm font-medium text-[var(--muted-foreground)]">{edu.institution}</p>
                                {edu.field && (
                                  <p className="text-xs text-[var(--muted-foreground)]">{edu.field}</p>
                                )}
                              </div>
                              <Badge variant="outline" size="sm">
                                {edu.year_end || (edu.completed ? t('completed') : t('inProgress'))}
                              </Badge>
                            </div>
                            {edu.country && edu.country !== 'Perú' && (
                              <span className="text-xs text-[var(--muted-foreground)] mt-1 inline-block">
                                {edu.country}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Experiencia Laboral */}
              {details && details.experience_details.length > 0 && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between gap-3">
                      <CardTitle>{t('professionalExperience')}</CardTitle>
                      {breakdown && breakdown.experience.hasOverlap && (
                        <ExperienceOverlapBadge
                          rawYears={breakdown.experience.rawYears}
                          uniqueYears={breakdown.experience.uniqueYears}
                          hasOverlap={breakdown.experience.hasOverlap}
                        />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {details.experience_details.map((exp, idx) => (
                        <div key={idx} className="flex gap-3 sm:gap-4 pb-4 border-b-2 border-[var(--border)] last:border-0 last:pb-0">
                          {/* Smaller icon on mobile */}
                          <div className={cn(
                            'w-8 h-8 sm:w-10 sm:h-10 border-2 border-[var(--border)] flex items-center justify-center flex-shrink-0',
                            exp.type === 'publico' ? 'bg-[var(--score-transparency)]/20 text-[var(--score-transparency-text)]' : 'bg-[var(--score-competence)]/20 text-[var(--score-competence-text)]'
                          )}>
                            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="square" strokeLinejoin="miter" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-bold text-[var(--foreground)]">{exp.position}</h4>
                                <p className="text-sm font-medium text-[var(--muted-foreground)]">{exp.institution}</p>
                              </div>
                              <Badge variant={exp.type === 'publico' ? 'secondary' : 'outline'} size="sm">
                                {exp.year_start && exp.year_end
                                  ? `${exp.year_start} - ${exp.year_end}`
                                  : exp.year_start
                                    ? `${exp.year_start} - ${t('present')}`
                                    : exp.year_end
                                      ? `${exp.year_end}`
                                      : t('candidate.noDate') || '—'
                                }
                              </Badge>
                            </div>
                            {exp.description && (
                              <p className="text-sm text-[var(--muted-foreground)] mt-1">{exp.description}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Trayectoria Política */}
              {details && details.political_trajectory.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>{t('trajectory')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {details.political_trajectory.map((pol, idx) => (
                        <div key={idx} className="flex gap-3 sm:gap-4 pb-4 border-b-2 border-[var(--border)] last:border-0 last:pb-0">
                          {/* Smaller icon on mobile */}
                          <div className={cn(
                            'w-8 h-8 sm:w-10 sm:h-10 border-2 border-[var(--border)] flex items-center justify-center flex-shrink-0',
                            pol.type === 'cargo_electivo' ? 'bg-[var(--flag-red-bg)] text-[var(--flag-red-text)]' :
                            pol.type === 'cargo_publico' ? 'bg-[var(--score-integrity)]/20 text-[var(--score-integrity-text)]' :
                            pol.type === 'cargo_partidario' ? 'bg-[var(--flag-amber-bg)] text-[var(--flag-amber-text)]' :
                            pol.type === 'candidatura' ? 'bg-[var(--muted)] text-[var(--muted-foreground)]' :
                            'bg-[var(--muted)] text-[var(--muted-foreground)]'
                          )}>
                            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="square" strokeLinejoin="miter" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-bold text-[var(--foreground)]">
                                  {pol.position || (pol.type === 'afiliacion' ? t('partyAffiliation') : pol.type === 'candidatura' ? t('candidacy') : pol.type === 'cargo_publico' ? 'Cargo Público' : t('politicalPosition'))}
                                </h4>
                                <p className="text-sm font-medium text-[var(--muted-foreground)]">
                                  {pol.party || pol.institution}
                                </p>
                              </div>
                              <div className="text-right">
                                {pol.year_start && (
                                  <Badge variant="outline" size="sm">
                                    {pol.year_start}{pol.year_end === null ? ` - ${t('present')}` : pol.year_end ? ` - ${pol.year_end}` : ''}
                                  </Badge>
                                )}
                                {pol.year && (
                                  <Badge variant="outline" size="sm">{pol.year}</Badge>
                                )}
                              </div>
                            </div>
                            {pol.result && (
                              <Badge
                                variant={pol.result === 'Electo' ? 'success' : 'default'}
                                size="sm"
                                className="mt-1"
                              >
                                {pol.result}
                              </Badge>
                            )}
                            {/* Context badges for ex-congresspeople */}
                            {trajectoryContext && pol.type === 'cargo_electivo' &&
                              (pol.position || '').toLowerCase().includes('congres') &&
                              trajectoryContext.votedInFavor !== undefined && (
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {trajectoryContext.votedInFavor > 0 && (
                                  <Badge variant="destructive" size="sm">
                                    {trajectoryContext.votedInFavor} votos pro-crimen
                                  </Badge>
                                )}
                                {trajectoryContext.votedAgainst !== undefined && trajectoryContext.votedAgainst > 0 && (
                                  <Badge variant="success" size="sm">
                                    {trajectoryContext.votedAgainst} votos en contra
                                  </Badge>
                                )}
                              </div>
                            )}
                            {/* Context badges for ex-alcaldes/gobernadores */}
                            {trajectoryContext && (pol.type === 'cargo_electivo' || pol.type === 'cargo_publico') &&
                              (pol.position || '').toLowerCase().match(/alcalde|gobernador/) &&
                              trajectoryContext.budgetExecutionPct !== undefined && (
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                <Badge
                                  variant={trajectoryContext.budgetExecutionPct >= 70 ? 'success' : trajectoryContext.budgetExecutionPct >= 50 ? 'warning' : 'destructive'}
                                  size="sm"
                                >
                                  Ejecución {trajectoryContext.budgetExecutionPct.toFixed(0)}%
                                </Badge>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Patrimonio */}
              {details?.assets_declaration && (
                <AssetsDeclarationCard assets={details.assets_declaration} />
              )}

              {/* Partido Político */}
              {candidate.party && (
                <Card>
                  <CardHeader>
                    <CardTitle>{t('politicalParty')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Link href={`/partido/${candidate.party.id}`} className="flex items-center gap-3 p-3 bg-[var(--muted)] border-2 border-[var(--border)] hover:shadow-[var(--shadow-brutal-sm)] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all duration-100">
                      <PartyLogo
                        name={candidate.party.name}
                        shortName={candidate.party.short_name}
                        color={candidate.party.color}
                        logoUrl={candidate.party.logo_url}
                        size="md"
                      />
                      <div className="flex-1">
                        <div className="font-bold text-[var(--foreground)]">
                          {candidate.party.name}
                        </div>
                        {candidate.party.short_name && (
                          <div className="text-sm text-[var(--muted-foreground)]">
                            {candidate.party.short_name}
                          </div>
                        )}
                      </div>
                      <svg className="w-5 h-5 text-[var(--muted-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="square" strokeLinejoin="miter" d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabPanel>

          {/* ==================== PROPUESTAS TAB ==================== */}
          <TabPanel value="propuestas">
            <div className="space-y-6">
              {/* Evaluación de Calidad por IA */}
              <ProposalQualityCard candidateId={candidate.id} />

              {/* Análisis de Viabilidad del Plan de Gobierno (solo presidenciales) */}
              {candidate.cargo === 'presidente' && (
                <PlanViabilityCard candidateId={candidate.id} />
              )}

              {/* Lista de Propuestas */}
              <CandidateProposals
                candidateId={candidate.id}
                planUrl={details?.plan_pdf_local || details?.plan_gobierno_url}
              />
            </div>
          </TabPanel>

          {/* ==================== NOTICIAS TAB ==================== */}
          <TabPanel value="noticias">
            <CandidateNewsSection
              candidateSlug={candidate.slug}
              candidateName={candidate.full_name}
            />
          </TabPanel>

          {/* ==================== EVIDENCIA TAB ==================== */}
          <TabPanel value="evidencia">
            <div className="space-y-6">
              {/* Desempeño en Cargo Actual (solo incumbentes) */}
              <IncumbentPerformanceCard candidateId={candidate.id} />

              {/* Empresas Vinculadas y Problemas Legales */}
              <CompanyIssuesCard candidateId={candidate.id} />

              {/* Verificación Judicial Cruzada */}
              <JudicialDiscrepancyCard candidateId={candidate.id} />

              {/* Historial de Votaciones Congresales */}
              <VotingRecordCard candidateId={candidate.id} />

              {/* Votaciones en Leyes Controversiales */}
              <ControversialVotesCard candidateId={candidate.id} />

              {/* Estado Tributario SUNAT */}
              <TaxStatusCard candidateId={candidate.id} />

              {/* Menciones en Redes Sociales */}
              <SocialMentionsCard candidateId={candidate.id} />

              {/* Sentencias Penales */}
              {details && details.penal_sentences.length > 0 && (
                <Card className="border-[var(--flag-red)]">
                  <CardHeader className="bg-[var(--flag-red)]/10">
                    <CardTitle className="text-[var(--flag-red-text)] flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="square" strokeLinejoin="miter" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      {t('penalSentences')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    {details.penal_sentences.map((sentence, idx) => (
                      <div key={idx} className="p-4 bg-[var(--flag-red)]/10 border-2 border-[var(--flag-red)] mb-3 last:mb-0">
                        <div className="flex justify-between items-start mb-2">
                          <Badge variant="destructive">{sentence.type}</Badge>
                          <span className="text-xs text-[var(--muted-foreground)] font-mono">{sentence.case_number}</span>
                        </div>
                        <p className="text-sm text-[var(--foreground)] mb-2 font-medium">{sentence.sentence}</p>
                        <div className="grid grid-cols-2 gap-2 text-xs text-[var(--muted-foreground)]">
                          <div><strong>{t('court')}:</strong> {sentence.court}</div>
                          <div><strong>{t('date')}:</strong> {formatDate(sentence.date)}</div>
                          <div><strong>{t('status')}:</strong> {sentence.status}</div>
                          <div><strong>{t('source')}:</strong> {sentence.source}</div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Sentencias Civiles */}
              {details && details.civil_sentences.length > 0 && (
                <Card className="border-[var(--flag-amber)]">
                  <CardHeader className="bg-[var(--flag-amber)]/10">
                    <CardTitle className="text-[var(--flag-amber-text)] flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="square" strokeLinejoin="miter" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                      </svg>
                      {t('civilSentences')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    {details.civil_sentences.map((sentence, idx) => (
                      <div key={idx} className="p-4 bg-[var(--flag-amber)]/10 border-2 border-[var(--flag-amber)] mb-3 last:mb-0">
                        <div className="flex justify-between items-start mb-2">
                          <Badge variant="warning">{sentence.type}</Badge>
                          <span className="text-xs text-[var(--muted-foreground)] font-mono">{sentence.case_number}</span>
                        </div>
                        {sentence.amount && (
                          <p className="text-lg font-black text-[var(--flag-amber-text)] mb-2">
                            {t('amount')}: {formatCurrency(sentence.amount)}
                          </p>
                        )}
                        <div className="grid grid-cols-2 gap-2 text-xs text-[var(--muted-foreground)]">
                          <div><strong>{t('court')}:</strong> {sentence.court}</div>
                          <div><strong>{t('date')}:</strong> {formatDate(sentence.date)}</div>
                          <div><strong>{t('status')}:</strong> {sentence.status}</div>
                          <div><strong>{t('source')}:</strong> {sentence.source}</div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Flags from database */}
              {candidate.flags.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>{t('verifiedRecords')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {candidate.flags.map((flag) => {
                        const colors = severityColors[flag.severity] || severityColors.GRAY
                        return (
                          <div
                            key={flag.id}
                            className={cn(
                              'p-4 border-2',
                              colors.bg,
                              colors.border
                            )}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge
                                    variant={flag.severity === 'RED' ? 'destructive' : flag.severity === 'AMBER' ? 'warning' : 'default'}
                                    size="sm"
                                  >
                                    {getFlagSeverityLabel(flag.severity)}
                                  </Badge>
                                  <span className={cn('text-sm font-bold uppercase', colors.text)}>
                                    {getFlagTypeLabel(flag.type)}
                                  </span>
                                </div>
                                <h4 className={cn('font-black mb-1', colors.text)}>
                                  {flag.title}
                                </h4>
                                {flag.description && (
                                  <p className={cn('text-sm mb-2', colors.text)}>
                                    {flag.description}
                                  </p>
                                )}
                                <div className="flex items-center gap-4 text-xs text-[var(--muted-foreground)]">
                                  <span>{t('source')}: {flag.source}</span>
                                  {flag.date_captured && (
                                    <span>
                                      {t('captured')}: {new Date(flag.date_captured).toLocaleDateString('es-PE')}
                                    </span>
                                  )}
                                </div>
                              </div>
                              {flag.evidence_url && (
                                <a
                                  href={flag.evidence_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex-shrink-0 p-2 text-[var(--primary)] hover:text-[var(--primary)]"
                                >
                                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="square" strokeLinejoin="miter" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                  </svg>
                                </a>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Sin alertas */}
              {(!details || (details.penal_sentences.length === 0 && details.civil_sentences.length === 0)) && candidate.flags.length === 0 && (
                <Card>
                  <CardContent className="py-12">
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-4 bg-[var(--score-excellent-bg)] border-3 border-[var(--score-excellent)] flex items-center justify-center">
                        <svg className="w-8 h-8 text-[var(--score-excellent-text)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="square" strokeLinejoin="miter" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <h4 className="font-black text-[var(--foreground)] mb-1 uppercase">
                        {t('noNegativeRecords')}
                      </h4>
                      <p className="text-sm text-[var(--muted-foreground)]">
                        {t('noNegativeRecordsDesc')}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabPanel>

          {/* ==================== DESGLOSE TAB ==================== */}
          <TabPanel value="breakdown">
            <Card>
              <CardHeader>
                <CardTitle>{t('scoreBreakdown')}</CardTitle>
              </CardHeader>
              <CardContent>
                {breakdown ? (
                  <div className="space-y-8">
                    {/* Competence Breakdown with Visual Bars */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-black text-[var(--foreground)] flex items-center gap-2 uppercase">
                          <div className="w-4 h-4 bg-[var(--score-competence)] border-2 border-[var(--border)]" />
                          {t('scores.competence')}
                        </h4>
                        <span className="text-2xl font-black text-[var(--score-competence-text)]">
                          {candidate.scores.competence.toFixed(0)}
                        </span>
                      </div>
                      <div className="space-y-3">
                        <BreakdownBar label={t('breakdown.educationLevel')} value={breakdown.education.level} max={22} color="competence" />
                        <BreakdownBar label={t('breakdown.educationDepth')} value={breakdown.education.depth} max={8} color="competence" />
                        <BreakdownBar label={t('breakdown.totalExperience')} value={breakdown.experience.total} max={25} color="competence" />
                        <BreakdownBar label={t('breakdown.relevantExperience')} value={breakdown.experience.relevant} max={25} color="competence" />
                        {breakdown.experience.hasOverlap && (
                          <div className="flex items-center gap-2 p-2 bg-[var(--muted)] border-2 border-[var(--border)]">
                            <ExperienceOverlapBadge
                              rawYears={breakdown.experience.rawYears}
                              uniqueYears={breakdown.experience.uniqueYears}
                              hasOverlap={true}
                            />
                            <span className="text-xs text-[var(--muted-foreground)] font-medium">
                              Periodos solapados deduplicados
                            </span>
                          </div>
                        )}
                        <BreakdownBar label={t('breakdown.leadershipSeniority')} value={breakdown.leadership.seniority} max={14} color="competence" />
                        <BreakdownBar label={t('breakdown.leadershipStability')} value={breakdown.leadership.stability} max={6} color="competence" />
                      </div>
                    </div>

                    {/* Integrity Breakdown with Visual Bars */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-black text-[var(--foreground)] flex items-center gap-2 uppercase">
                          <div className="w-4 h-4 bg-[var(--score-integrity)] border-2 border-[var(--border)]" />
                          {t('scores.integrity')}
                        </h4>
                        <span className="text-2xl font-black text-[var(--score-integrity-text)]">
                          {candidate.scores.integrity.toFixed(0)}
                        </span>
                      </div>
                      <div className="space-y-3">
                        <BreakdownBar label={t('breakdown.baseScore')} value={breakdown.integrity.base} max={100} color="integrity" />
                        {breakdown.integrity.penal_penalty > 0 && (
                          <div className="flex items-center gap-3 p-2 bg-[var(--flag-red)]/10 border-2 border-[var(--flag-red)]">
                            <span className="text-xs font-bold text-[var(--flag-red-text)] flex-1 uppercase">{t('penalSentences')}</span>
                            <span className="font-black text-[var(--flag-red-text)]">-{breakdown.integrity.penal_penalty.toFixed(0)}</span>
                          </div>
                        )}
                        {breakdown.integrity.civil_penalties.map((penalty, idx) => (
                          <div key={idx} className="flex items-center gap-3 p-2 bg-[var(--flag-amber)]/10 border-2 border-[var(--flag-amber)]">
                            <span className="text-xs font-bold text-[var(--flag-amber-text)] flex-1 uppercase">{t('civilSentence')} ({penalty.type})</span>
                            <span className="font-black text-[var(--flag-amber-text)]">-{penalty.penalty.toFixed(0)}</span>
                          </div>
                        ))}
                        {breakdown.integrity.resignation_penalty > 0 && (
                          <div className="flex items-center gap-3 p-2 bg-[var(--flag-amber)]/10 border-2 border-[var(--flag-amber)]">
                            <span className="text-xs font-bold text-[var(--flag-amber-text)] flex-1 uppercase">{t('partyResignations')}</span>
                            <span className="font-black text-[var(--flag-amber-text)]">-{breakdown.integrity.resignation_penalty.toFixed(0)}</span>
                          </div>
                        )}
                        {breakdown.integrity.reinfo_penalty > 0 && (
                          <div className="flex items-center gap-3 p-2 bg-[var(--flag-red)]/10 border-2 border-[var(--flag-red)]">
                            <span className="text-xs font-bold text-[var(--flag-red-text)] flex-1 uppercase">REINFO (Minería)</span>
                            <span className="font-black text-[var(--flag-red-text)]">-{breakdown.integrity.reinfo_penalty.toFixed(0)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Transparency Breakdown with Visual Bars */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-black text-[var(--foreground)] flex items-center gap-2 uppercase">
                          <div className="w-4 h-4 bg-[var(--score-transparency)] border-2 border-[var(--border)]" />
                          {t('scores.transparency')}
                        </h4>
                        <span className="text-2xl font-black text-[var(--score-transparency-text)]">
                          {candidate.scores.transparency.toFixed(0)}
                        </span>
                      </div>
                      <div className="space-y-3">
                        <BreakdownBar label={t('breakdown.completeness')} value={breakdown.transparency.completeness} max={35} color="transparency" />
                        <BreakdownBar label={t('breakdown.consistency')} value={breakdown.transparency.consistency} max={35} color="transparency" />
                        <BreakdownBar label={t('breakdown.assetsQuality')} value={breakdown.transparency.assets_quality} max={30} color="transparency" />
                      </div>
                    </div>

                    {/* Confidence Breakdown with Visual Bars */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-black text-[var(--foreground)] flex items-center gap-2 uppercase">
                          <div className="w-4 h-4 bg-[var(--muted-foreground)] border-2 border-[var(--border)]" />
                          {t('scores.confidence')}
                        </h4>
                        <span className="text-2xl font-black text-[var(--muted-foreground)]">
                          {candidate.scores.confidence.toFixed(0)}
                        </span>
                      </div>
                      <div className="space-y-3">
                        <BreakdownBar label={t('breakdown.verification')} value={breakdown.confidence.verification} max={50} color="default" />
                        <BreakdownBar label={t('breakdown.coverage')} value={breakdown.confidence.coverage} max={50} color="default" />
                      </div>
                    </div>

                    {/* Plan de Gobierno (presidential only) */}
                    {breakdown.planViability && (
                      <div className="pt-6 border-t-2 border-[var(--border)]">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-black text-[var(--foreground)] flex items-center gap-2 uppercase">
                            <div className="w-4 h-4 bg-[var(--score-plan)] border-2 border-[var(--border)]" />
                            Plan de Gobierno
                          </h4>
                          <span className="text-2xl font-black text-[var(--score-plan-text)]">
                            {candidate.scores.plan_viability?.toFixed(0) ?? '-'}
                          </span>
                        </div>
                        <div className="space-y-3">
                          <BreakdownBar label="Viabilidad Fiscal" value={breakdown.planViability.fiscal} max={100} color="plan" />
                          <BreakdownBar label="Viabilidad Legal" value={breakdown.planViability.legal} max={100} color="plan" />
                          <BreakdownBar label="Coherencia Interna" value={breakdown.planViability.coherence} max={100} color="plan" />
                          <BreakdownBar label="Comparación Histórica" value={breakdown.planViability.historical} max={100} color="plan" />
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-[var(--muted-foreground)]">
                    <p>{t('breakdownNotAvailable')}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabPanel>
        </Tabs>
          </div>

          {/* ========== SIDEBAR - Desktop Only ========== */}
          <aside className="hidden lg:block space-y-6">
            {/* Quick Stats Card */}
            <Card className="sticky top-20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">{t('quickSummary')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Overall Score */}
                <div className="text-center p-4 bg-[var(--muted)] border-2 border-[var(--border)]">
                  <div className="text-3xl font-black text-[var(--foreground)] mb-1">
                    {getScore().toFixed(0)}
                  </div>
                  <div className="text-xs font-bold text-[var(--muted-foreground)] uppercase">
                    {t('scores.title')} {t(`scoreMode.${mode}`)}
                  </div>
                </div>

                {/* Sub-scores mini */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--muted-foreground)] uppercase">{t('scores.competence')}</span>
                    <span className="font-black text-[var(--score-competence-text)]">{candidate.scores.competence.toFixed(0)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--muted-foreground)] uppercase">{t('scores.integrity')}</span>
                    <span className="font-black text-[var(--score-integrity-text)]">{candidate.scores.integrity.toFixed(0)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--muted-foreground)] uppercase">{t('scores.transparency')}</span>
                    <span className="font-black text-[var(--score-transparency-text)]">{candidate.scores.transparency.toFixed(0)}</span>
                  </div>
                </div>

                {/* Flags summary */}
                {candidate.flags.length > 0 && (
                  <div className={cn(
                    'p-3 border-2',
                    candidate.flags.some(f => f.severity === 'RED')
                      ? 'bg-[var(--flag-red)]/10 border-[var(--flag-red)]'
                      : 'bg-[var(--flag-amber)]/10 border-[var(--flag-amber)]'
                  )}>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-[var(--flag-red-text)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="square" strokeLinejoin="miter" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span className="text-xs font-bold uppercase">
                        {candidate.flags.length} {candidate.flags.length > 1 ? t('records') : t('record')}
                      </span>
                    </div>
                  </div>
                )}

                {/* Confidence */}
                <div className="pt-3 border-t-2 border-[var(--border)]">
                  <ConfidenceBadge value={candidate.scores.confidence} size="md" />
                </div>

                {/* Quick Actions */}
                <div className="pt-3 border-t-2 border-[var(--border)] space-y-2">
                  <Link href={`/comparar?ids=${candidate.id}`} className="block">
                    <Button variant="primary" size="sm" className="w-full">
                      <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="square" strokeLinejoin="miter" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      {t('compareButton')}
                    </Button>
                  </Link>
                  <ShareButton
                    title={shareTitle}
                    description={shareDescription}
                    variant="button"
                    className="w-full"
                  />
                </div>

                {/* Party link */}
                {candidate.party && (
                  <Link
                    href={`/partido/${candidate.party.id}`}
                    className="flex items-center gap-2 p-3 bg-[var(--muted)] border-2 border-[var(--border)] hover:shadow-[var(--shadow-brutal-sm)] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all duration-100"
                  >
                    <PartyLogo
                      name={candidate.party.name}
                      shortName={candidate.party.short_name}
                      color={candidate.party.color}
                      logoUrl={candidate.party.logo_url}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-[var(--foreground)] truncate uppercase">
                        {candidate.party.short_name || candidate.party.name}
                      </div>
                      <div className="text-xs text-[var(--muted-foreground)]">{t('viewParty')}</div>
                    </div>
                    <svg className="w-4 h-4 text-[var(--muted-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="square" strokeLinejoin="miter" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                )}

                {/* Vice Presidents (Presidential Formula) */}
                {vicePresidents.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-black text-[var(--muted-foreground)] uppercase tracking-wider">
                      {t('presidentialFormula')}
                    </h4>
                    {vicePresidents.map((vp) => (
                      <Link
                        key={vp.id}
                        href={`/candidato/${vp.slug}`}
                        className="flex items-center gap-2 p-2 bg-[var(--muted)] border-2 border-[var(--border)] hover:shadow-[var(--shadow-brutal-sm)] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all duration-100"
                      >
                        <div className="w-8 h-8 border-2 border-[var(--border)] bg-[var(--muted)] overflow-hidden relative">
                          <CandidateImage src={vp.photo_url} name={vp.full_name} fill sizes="32px" containerClassName="text-xs" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-[var(--foreground)] truncate uppercase">
                            {vp.full_name}
                          </div>
                          <div className="text-xs text-[var(--muted-foreground)]">
                            {vp.list_position === 2 ? t('firstVP') : t('secondVP')}
                          </div>
                        </div>
                        <svg className="w-4 h-4 text-[var(--muted-foreground)] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="square" strokeLinejoin="miter" d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    ))}
                  </div>
                )}

                {/* DJHV link */}
                {details?.djhv_url && (
                  <a
                    href={details.djhv_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs font-bold text-[var(--primary)] hover:underline uppercase"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="square" strokeLinejoin="miter" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    {t('cvJNE')}
                  </a>
                )}
              </CardContent>
            </Card>

            {/* Sidebar Ads */}
            <div className="space-y-4">
              <AdSlot slotId="internal-sidebar-top" size="300x250" />
              <AdSlot slotId="internal-sidebar-bottom" size="300x600" />
            </div>
          </aside>
        </div>

        {/* Mobile Action Bar */}
        <div className="mt-8 flex flex-col sm:flex-row gap-3 lg:hidden">
          <Link href="/ranking" className="flex-1">
            <Button variant="outline" size="lg" className="w-full">
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="square" strokeLinejoin="miter" d="M15 19l-7-7 7-7" />
              </svg>
              {t('backToRanking')}
            </Button>
          </Link>
          <Link href={`/comparar?ids=${candidate.id}`} className="flex-1">
            <Button variant="primary" size="lg" className="w-full">
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="square" strokeLinejoin="miter" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              {t('compareWithOthers')}
            </Button>
          </Link>
        </div>

        {/* Similar Candidates Section */}
        <section className="mt-12 pt-8 border-t-3 border-[var(--border)]">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg sm:text-xl font-black text-[var(--foreground)] uppercase tracking-tight">
              {t('similarCandidates')}
            </h2>
            <Link
              href={`/ranking?cargo=${candidate.cargo}`}
              className="text-sm font-bold text-[var(--primary)] hover:underline uppercase flex items-center gap-1"
            >
              {t('viewAll')}
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="square" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          <p className="text-sm text-[var(--muted-foreground)] mb-4">
            {t('otherCandidatesTo', { cargo: getCargoLabel(candidate.cargo) })}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {similarCandidates.length > 0 ? (
              similarCandidates.map((sim) => {
                const simScore = getScoreByMode(sim.scores, mode, undefined, sim.cargo === 'presidente')
                return (
                  <Link
                    key={sim.id}
                    href={`/candidato/${sim.slug}`}
                    className="p-4 bg-[var(--muted)] border-2 border-[var(--border)] hover:shadow-[var(--shadow-brutal-sm)] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all duration-100 text-center"
                  >
                    <div className="w-12 h-12 mx-auto mb-2 border-2 border-[var(--border)] bg-[var(--background)] overflow-hidden relative">
                      <CandidateImage src={sim.photo_url} name={sim.full_name} fill sizes="48px" containerClassName="text-sm" />
                    </div>
                    <h3 className="text-xs font-bold text-[var(--foreground)] uppercase leading-tight truncate">
                      {sim.full_name}
                    </h3>
                    {sim.party && (
                      <p className="text-[10px] font-bold text-[var(--muted-foreground)] truncate mt-0.5">
                        {sim.party.short_name || sim.party.name}
                      </p>
                    )}
                    <div className="mt-1.5 text-lg font-black text-[var(--primary)]">
                      {simScore.toFixed(0)}
                      <span className="text-xs font-bold text-[var(--muted-foreground)]">/100</span>
                    </div>
                  </Link>
                )
              })
            ) : (
              <Link
                href={`/ranking?cargo=${candidate.cargo}`}
                className="col-span-full p-6 bg-[var(--muted)] border-2 border-[var(--border)] hover:shadow-[var(--shadow-brutal-sm)] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all duration-100 text-center"
              >
                <span className="text-sm font-bold text-[var(--muted-foreground)] uppercase">
                  {t('viewMoreCandidates')}
                </span>
              </Link>
            )}
          </div>
        </section>

        {/* Ad Banner - Footer */}
        <AdBanner slotId="internal-footer" className="py-4" />
      </main>
    </div>
  )
}
