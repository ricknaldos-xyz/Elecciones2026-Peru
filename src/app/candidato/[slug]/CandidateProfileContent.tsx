'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
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
import { CandidateNewsSection } from '@/components/news/CandidateNewsSection'
import { PRESETS } from '@/lib/constants'
import type { CandidateWithScores, PresetType, ScoreBreakdown } from '@/types/database'
import type { CandidateDetails } from '@/lib/db/queries'

interface CandidateProfileContentProps {
  candidate: CandidateWithScores
  breakdown: ScoreBreakdown | null
  details: CandidateDetails | null
}

const cargoLabels: Record<string, string> = {
  presidente: 'Presidente',
  vicepresidente: 'Vicepresidente',
  senador: 'Senador',
  diputado: 'Diputado',
  parlamento_andino: 'Parlamento Andino',
}

const flagTypeLabels: Record<string, string> = {
  PENAL_SENTENCE: 'Sentencia Penal',
  CIVIL_SENTENCE: 'Sentencia Civil',
  VIOLENCE: 'Violencia Familiar',
  ALIMENTOS: 'Omisión Alimentaria',
  MULTIPLE_RESIGNATIONS: 'Múltiples Renuncias',
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
  color: 'competence' | 'integrity' | 'transparency' | 'default'
}) {
  const percentage = Math.min((value / max) * 100, 100)
  const colorClasses = {
    competence: 'bg-[var(--score-competence)]',
    integrity: 'bg-[var(--score-integrity)]',
    transparency: 'bg-[var(--score-transparency)]',
    default: 'bg-[var(--muted-foreground)]',
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="font-bold text-[var(--muted-foreground)] uppercase">{label}</span>
        <span className="font-black text-[var(--foreground)]">{value.toFixed(1)}/{max}</span>
      </div>
      <div className="h-2 bg-[var(--muted)] border-2 border-[var(--border)] overflow-hidden">
        <div
          className={cn('h-full transition-all duration-300', colorClasses[color])}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

export function CandidateProfileContent({ candidate, breakdown, details }: CandidateProfileContentProps) {
  const router = useRouter()
  const [mode, setMode] = useState<PresetType>('balanced')
  const [showStickyBar, setShowStickyBar] = useState(false)
  const heroRef = useRef<HTMLDivElement>(null)

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

  const getScore = () => {
    switch (mode) {
      case 'merit':
        return candidate.scores.score_merit
      case 'integrity':
        return candidate.scores.score_integrity
      default:
        return candidate.scores.score_balanced
    }
  }

  const shareTitle = `${candidate.full_name} - Ranking Electoral 2026`
  const shareDescription = `Puntaje: ${getScore().toFixed(1)}/100 | Competencia: ${candidate.scores.competence.toFixed(0)} | Integridad: ${candidate.scores.integrity.toFixed(0)} | Transparencia: ${candidate.scores.transparency.toFixed(0)}`

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header />

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
                {candidate.photo_url ? (
                  <Image
                    src={candidate.photo_url}
                    alt=""
                    fill
                    sizes="32px"
                    className="object-cover"
                    loading="eager"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[var(--muted-foreground)] text-xs font-bold">
                    {candidate.full_name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                  </div>
                )}
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb Navigation */}
        <nav className="mb-4 flex items-center gap-2 text-sm">
          <Link href="/ranking" className="text-[var(--muted-foreground)] hover:text-[var(--primary)] font-bold uppercase transition-colors">
            Ranking
          </Link>
          <svg className="w-4 h-4 text-[var(--muted-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="square" d="M9 5l7 7-7 7" />
          </svg>
          <Link href={`/ranking?cargo=${candidate.cargo}`} className="text-[var(--muted-foreground)] hover:text-[var(--primary)] font-bold uppercase transition-colors">
            {cargoLabels[candidate.cargo] || candidate.cargo}
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
                  {candidate.photo_url ? (
                    <Image
                      src={candidate.photo_url}
                      alt={candidate.full_name}
                      fill
                      sizes="(max-width: 640px) 96px, (max-width: 1024px) 112px, 128px"
                      className="object-cover"
                      priority
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[var(--muted-foreground)] text-2xl sm:text-3xl font-black uppercase">
                      {candidate.full_name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                    </div>
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-[var(--foreground)] mb-2 sm:mb-3 uppercase tracking-tight">
                  {candidate.full_name}
                </h1>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                  <Badge variant="primary" size="sm" className="sm:size-md">
                    {cargoLabels[candidate.cargo] || candidate.cargo}
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
                      VERIFICADO JNE
                    </Badge>
                  ) : (
                    <Badge variant="warning" size="sm" className="gap-1">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="square" strokeLinejoin="miter" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      SIN VERIFICAR
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
                    weights={PRESETS[mode as keyof typeof PRESETS]}
                    size="md"
                    variant="default"
                    showMode
                  />
                </div>
                <div className="hidden sm:flex">
                  <ScorePill
                    score={getScore()}
                    mode={mode}
                    weights={PRESETS[mode as keyof typeof PRESETS]}
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
                      {m === 'balanced' ? 'Balance' : m === 'merit' ? 'Mérito' : 'Integridad'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sub-scores strip - Responsive gaps */}
          <div className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4 bg-[var(--muted)] border-t-3 border-[var(--border)]">
            <div className="grid grid-cols-3 gap-2 sm:gap-4 lg:gap-6">
              <SubScoreStat type="competence" value={candidate.scores.competence} size="sm" />
              <SubScoreStat type="integrity" value={candidate.scores.integrity} size="sm" />
              <SubScoreStat type="transparency" value={candidate.scores.transparency} size="sm" />
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
                    {candidate.flags.length} Antecedente{candidate.flags.length > 1 ? 's' : ''} Encontrado{candidate.flags.length > 1 ? 's' : ''}
                  </h3>
                  <p className={cn(
                    'text-xs sm:text-sm font-medium mb-2 sm:mb-3',
                    candidate.flags.some(f => f.severity === 'RED')
                      ? 'text-[var(--flag-red-text)]'
                      : 'text-[var(--flag-amber-text)]'
                  )}>
                    Este candidato tiene antecedentes verificados que afectan su puntaje de integridad.
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
              <Tab value="resumen">RESUMEN</Tab>
              <Tab value="noticias">NOTICIAS</Tab>
              <Tab value="evidencia">EVIDENCIA</Tab>
              <Tab value="breakdown">DESGLOSE</Tab>
            </TabList>
          </div>

          {/* ==================== RESUMEN TAB ==================== */}
          <TabPanel value="resumen">
            <div className="space-y-6">
              {/* Datos Personales */}
              {details && (
                <Card>
                  <CardHeader>
                    <CardTitle>DATOS PERSONALES</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* Grid-1 on mobile, grid-2 on tablet+ */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {details.birth_date && (
                        <div>
                          <span className="text-sm font-bold uppercase text-[var(--muted-foreground)]">Fecha de nacimiento</span>
                          <p className="font-bold text-[var(--foreground)]">{formatDate(details.birth_date)}</p>
                        </div>
                      )}
                      {details.dni && (
                        <div>
                          <span className="text-sm font-bold uppercase text-[var(--muted-foreground)]">DNI</span>
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
                          Ver Hoja de Vida JNE
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
                    <CardTitle>FORMACIÓN ACADÉMICA</CardTitle>
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
                                {edu.year_end || 'En curso'}
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
                    <CardTitle>EXPERIENCIA PROFESIONAL</CardTitle>
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
                                {exp.year_start} - {exp.year_end}
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
                    <CardTitle>TRAYECTORIA POLÍTICA</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {details.political_trajectory.map((pol, idx) => (
                        <div key={idx} className="flex gap-3 sm:gap-4 pb-4 border-b-2 border-[var(--border)] last:border-0 last:pb-0">
                          {/* Smaller icon on mobile */}
                          <div className={cn(
                            'w-8 h-8 sm:w-10 sm:h-10 border-2 border-[var(--border)] flex items-center justify-center flex-shrink-0',
                            pol.type === 'cargo_electivo' ? 'bg-[var(--flag-red-bg)] text-[var(--flag-red-text)]' :
                            pol.type === 'cargo_partidario' ? 'bg-[var(--flag-amber-bg)] text-[var(--flag-amber-text)]' :
                            pol.type === 'candidatura' ? 'bg-[var(--score-integrity)]/20 text-[var(--score-integrity-text)]' :
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
                                  {pol.position || (pol.type === 'afiliacion' ? 'Afiliación partidaria' : pol.type === 'candidatura' ? 'Candidatura' : 'Cargo político')}
                                </h4>
                                <p className="text-sm font-medium text-[var(--muted-foreground)]">
                                  {pol.party || pol.institution}
                                </p>
                              </div>
                              <div className="text-right">
                                {pol.year_start && (
                                  <Badge variant="outline" size="sm">
                                    {pol.year_start}{pol.year_end === null ? ' - Actualidad' : pol.year_end ? ` - ${pol.year_end}` : ''}
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
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Patrimonio */}
              {details && details.assets_declaration && (
                <Card>
                  <CardHeader>
                    <CardTitle>DECLARACIÓN PATRIMONIAL {details.assets_declaration.declaration_year}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Resumen - Grid-1 on mobile, grid-2 on tablet+ */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-[var(--muted)] border-2 border-[var(--border)]">
                        <div>
                          <span className="text-sm font-bold uppercase text-[var(--muted-foreground)]">Patrimonio Total</span>
                          <p className="text-lg sm:text-xl font-black text-[var(--foreground)]">
                            {formatCurrency(details.assets_declaration.total_value)}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm font-bold uppercase text-[var(--muted-foreground)]">Ingreso Mensual</span>
                          <p className="text-lg sm:text-xl font-black text-[var(--foreground)]">
                            {formatCurrency(details.assets_declaration.income.monthly_salary)}
                          </p>
                        </div>
                      </div>

                      {/* Lista de bienes */}
                      <div>
                        <h4 className="text-sm font-black uppercase text-[var(--foreground)] mb-2">Bienes Declarados</h4>
                        <div className="space-y-2">
                          {details.assets_declaration.assets.map((asset, idx) => (
                            <div key={idx} className="flex justify-between items-center py-2 border-b-2 border-[var(--border)] last:border-0">
                              <div>
                                <span className="text-sm font-bold text-[var(--foreground)]">{asset.type}</span>
                                <p className="text-xs text-[var(--muted-foreground)]">{asset.description}</p>
                              </div>
                              <span className="text-sm font-bold text-[var(--foreground)]">
                                {formatCurrency(asset.value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Fuente de ingresos */}
                      {details.assets_declaration.income.source && (
                        <div className="pt-2">
                          <span className="text-sm text-[var(--muted-foreground)]">Fuente de ingresos: </span>
                          <span className="text-sm font-bold text-[var(--foreground)]">{details.assets_declaration.income.source}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Partido Político */}
              {candidate.party && (
                <Card>
                  <CardHeader>
                    <CardTitle>PARTIDO POLÍTICO</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Link href={`/partido/${candidate.party.id}`} className="flex items-center gap-3 p-3 bg-[var(--muted)] border-2 border-[var(--border)] hover:shadow-[var(--shadow-brutal-sm)] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all duration-100">
                      <div
                        className="w-10 h-10 border-2 border-[var(--border)] flex items-center justify-center text-white font-black"
                        style={{ backgroundColor: candidate.party.color || '#6B7280' }}
                      >
                        {candidate.party.short_name?.substring(0, 2) || candidate.party.name.substring(0, 2)}
                      </div>
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
              {/* Sentencias Penales */}
              {details && details.penal_sentences.length > 0 && (
                <Card className="border-[var(--flag-red)]">
                  <CardHeader className="bg-[var(--flag-red)]/10">
                    <CardTitle className="text-[var(--flag-red-text)] flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="square" strokeLinejoin="miter" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      SENTENCIAS PENALES
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
                          <div><strong>Juzgado:</strong> {sentence.court}</div>
                          <div><strong>Fecha:</strong> {formatDate(sentence.date)}</div>
                          <div><strong>Estado:</strong> {sentence.status}</div>
                          <div><strong>Fuente:</strong> {sentence.source}</div>
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
                      SENTENCIAS CIVILES
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
                            Monto: {formatCurrency(sentence.amount)}
                          </p>
                        )}
                        <div className="grid grid-cols-2 gap-2 text-xs text-[var(--muted-foreground)]">
                          <div><strong>Juzgado:</strong> {sentence.court}</div>
                          <div><strong>Fecha:</strong> {formatDate(sentence.date)}</div>
                          <div><strong>Estado:</strong> {sentence.status}</div>
                          <div><strong>Fuente:</strong> {sentence.source}</div>
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
                    <CardTitle>ANTECEDENTES VERIFICADOS</CardTitle>
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
                                    {flag.severity}
                                  </Badge>
                                  <span className={cn('text-sm font-bold uppercase', colors.text)}>
                                    {flagTypeLabels[flag.type] || flag.type}
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
                                  <span>Fuente: {flag.source}</span>
                                  {flag.date_captured && (
                                    <span>
                                      Capturado: {new Date(flag.date_captured).toLocaleDateString('es-PE')}
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
                        Sin antecedentes negativos
                      </h4>
                      <p className="text-sm text-[var(--muted-foreground)]">
                        No encontramos sentencias ni procesos judiciales para este candidato.
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
                <CardTitle>DESGLOSE DEL PUNTAJE</CardTitle>
              </CardHeader>
              <CardContent>
                {breakdown ? (
                  <div className="space-y-8">
                    {/* Competence Breakdown with Visual Bars */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-black text-[var(--foreground)] flex items-center gap-2 uppercase">
                          <div className="w-4 h-4 bg-[var(--score-competence)] border-2 border-[var(--border)]" />
                          Competencia
                        </h4>
                        <span className="text-2xl font-black text-[var(--score-competence-text)]">
                          {candidate.scores.competence.toFixed(0)}
                        </span>
                      </div>
                      <div className="space-y-3">
                        <BreakdownBar label="Nivel educativo" value={breakdown.education.level} max={22} color="competence" />
                        <BreakdownBar label="Profundidad educativa" value={breakdown.education.depth} max={8} color="competence" />
                        <BreakdownBar label="Experiencia total" value={breakdown.experience.total} max={25} color="competence" />
                        <BreakdownBar label="Experiencia relevante" value={breakdown.experience.relevant} max={25} color="competence" />
                        <BreakdownBar label="Liderazgo - Seniority" value={breakdown.leadership.seniority} max={14} color="competence" />
                        <BreakdownBar label="Liderazgo - Estabilidad" value={breakdown.leadership.stability} max={6} color="competence" />
                      </div>
                    </div>

                    {/* Integrity Breakdown with Visual Bars */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-black text-[var(--foreground)] flex items-center gap-2 uppercase">
                          <div className="w-4 h-4 bg-[var(--score-integrity)] border-2 border-[var(--border)]" />
                          Integridad
                        </h4>
                        <span className="text-2xl font-black text-[var(--score-integrity-text)]">
                          {candidate.scores.integrity.toFixed(0)}
                        </span>
                      </div>
                      <div className="space-y-3">
                        <BreakdownBar label="Puntaje base" value={breakdown.integrity.base} max={100} color="integrity" />
                        {breakdown.integrity.penal_penalty > 0 && (
                          <div className="flex items-center gap-3 p-2 bg-[var(--flag-red)]/10 border-2 border-[var(--flag-red)]">
                            <span className="text-xs font-bold text-[var(--flag-red-text)] flex-1 uppercase">Sentencias penales</span>
                            <span className="font-black text-[var(--flag-red-text)]">-{breakdown.integrity.penal_penalty.toFixed(0)}</span>
                          </div>
                        )}
                        {breakdown.integrity.civil_penalties.map((penalty, idx) => (
                          <div key={idx} className="flex items-center gap-3 p-2 bg-[var(--flag-amber)]/10 border-2 border-[var(--flag-amber)]">
                            <span className="text-xs font-bold text-[var(--flag-amber-text)] flex-1 uppercase">Sentencia civil ({penalty.type})</span>
                            <span className="font-black text-[var(--flag-amber-text)]">-{penalty.penalty.toFixed(0)}</span>
                          </div>
                        ))}
                        {breakdown.integrity.resignation_penalty > 0 && (
                          <div className="flex items-center gap-3 p-2 bg-[var(--flag-amber)]/10 border-2 border-[var(--flag-amber)]">
                            <span className="text-xs font-bold text-[var(--flag-amber-text)] flex-1 uppercase">Renuncias a partidos</span>
                            <span className="font-black text-[var(--flag-amber-text)]">-{breakdown.integrity.resignation_penalty.toFixed(0)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Transparency Breakdown with Visual Bars */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-black text-[var(--foreground)] flex items-center gap-2 uppercase">
                          <div className="w-4 h-4 bg-[var(--score-transparency)] border-2 border-[var(--border)]" />
                          Transparencia
                        </h4>
                        <span className="text-2xl font-black text-[var(--score-transparency-text)]">
                          {candidate.scores.transparency.toFixed(0)}
                        </span>
                      </div>
                      <div className="space-y-3">
                        <BreakdownBar label="Completitud" value={breakdown.transparency.completeness} max={35} color="transparency" />
                        <BreakdownBar label="Consistencia" value={breakdown.transparency.consistency} max={35} color="transparency" />
                        <BreakdownBar label="Calidad patrimonial" value={breakdown.transparency.assets_quality} max={30} color="transparency" />
                      </div>
                    </div>

                    {/* Confidence Breakdown with Visual Bars */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-black text-[var(--foreground)] flex items-center gap-2 uppercase">
                          <div className="w-4 h-4 bg-[var(--muted-foreground)] border-2 border-[var(--border)]" />
                          Nivel de Confianza
                        </h4>
                        <span className="text-2xl font-black text-[var(--muted-foreground)]">
                          {candidate.scores.confidence.toFixed(0)}
                        </span>
                      </div>
                      <div className="space-y-3">
                        <BreakdownBar label="Verificación" value={breakdown.confidence.verification} max={50} color="default" />
                        <BreakdownBar label="Cobertura" value={breakdown.confidence.coverage} max={50} color="default" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-[var(--muted-foreground)]">
                    <p>Datos de desglose no disponibles para este candidato.</p>
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
                <CardTitle className="text-sm">RESUMEN RÁPIDO</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Overall Score */}
                <div className="text-center p-4 bg-[var(--muted)] border-2 border-[var(--border)]">
                  <div className="text-3xl font-black text-[var(--foreground)] mb-1">
                    {getScore().toFixed(0)}
                  </div>
                  <div className="text-xs font-bold text-[var(--muted-foreground)] uppercase">
                    Puntaje {mode === 'balanced' ? 'Equilibrado' : mode === 'merit' ? 'Mérito' : 'Integridad'}
                  </div>
                </div>

                {/* Sub-scores mini */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--muted-foreground)] uppercase">Competencia</span>
                    <span className="font-black text-[var(--score-competence-text)]">{candidate.scores.competence.toFixed(0)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--muted-foreground)] uppercase">Integridad</span>
                    <span className="font-black text-[var(--score-integrity-text)]">{candidate.scores.integrity.toFixed(0)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--muted-foreground)] uppercase">Transparencia</span>
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
                        {candidate.flags.length} antecedente{candidate.flags.length > 1 ? 's' : ''}
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
                      COMPARAR
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
                    <div
                      className="w-8 h-8 border-2 border-[var(--border)] flex items-center justify-center text-white font-bold text-xs"
                      style={{ backgroundColor: candidate.party.color || '#6B7280' }}
                    >
                      {candidate.party.short_name?.substring(0, 2) || candidate.party.name.substring(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-[var(--foreground)] truncate uppercase">
                        {candidate.party.short_name || candidate.party.name}
                      </div>
                      <div className="text-xs text-[var(--muted-foreground)]">Ver partido</div>
                    </div>
                    <svg className="w-4 h-4 text-[var(--muted-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="square" strokeLinejoin="miter" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
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
                    Hoja de Vida JNE
                  </a>
                )}
              </CardContent>
            </Card>
          </aside>
        </div>

        {/* Mobile Action Bar */}
        <div className="mt-8 flex flex-col sm:flex-row gap-3 lg:hidden">
          <Link href="/ranking" className="flex-1">
            <Button variant="outline" size="lg" className="w-full">
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="square" strokeLinejoin="miter" d="M15 19l-7-7 7-7" />
              </svg>
              VOLVER AL RANKING
            </Button>
          </Link>
          <Link href={`/comparar?ids=${candidate.id}`} className="flex-1">
            <Button variant="primary" size="lg" className="w-full">
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="square" strokeLinejoin="miter" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              COMPARAR CON OTROS
            </Button>
          </Link>
        </div>

        {/* Similar Candidates Section */}
        <section className="mt-12 pt-8 border-t-3 border-[var(--border)]">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg sm:text-xl font-black text-[var(--foreground)] uppercase tracking-tight">
              Candidatos similares
            </h2>
            <Link
              href={`/ranking?cargo=${candidate.cargo}`}
              className="text-sm font-bold text-[var(--primary)] hover:underline uppercase flex items-center gap-1"
            >
              Ver todos
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="square" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          <p className="text-sm text-[var(--muted-foreground)] mb-4">
            Otros candidatos a {cargoLabels[candidate.cargo] || candidate.cargo} para comparar.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {/* Placeholder cards - will be filled with real data */}
            {[1, 2, 3, 4].map((i) => (
              <Link
                key={i}
                href={`/ranking?cargo=${candidate.cargo}`}
                className="p-4 bg-[var(--muted)] border-2 border-[var(--border)] hover:shadow-[var(--shadow-brutal-sm)] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all duration-100 text-center"
              >
                <div className="w-12 h-12 mx-auto mb-2 bg-[var(--background)] border-2 border-[var(--border)] flex items-center justify-center">
                  <svg className="w-6 h-6 text-[var(--muted-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="square" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <span className="text-xs font-bold text-[var(--muted-foreground)] uppercase">
                  Ver más candidatos
                </span>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
