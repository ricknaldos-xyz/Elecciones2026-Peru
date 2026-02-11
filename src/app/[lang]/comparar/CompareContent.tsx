'use client'

import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { CandidateImage } from '@/components/candidate/CandidateImage'
import { Header } from '@/components/layout/Header'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { PresetSelector } from '@/components/ranking/PresetSelector'
import { useCandidatesByIds } from '@/hooks/useCandidates'
import { useSuccessToast } from '@/components/ui/Toast'
import { PRESETS, PRESIDENTIAL_PRESETS } from '@/lib/constants'
import { getScoreByMode } from '@/lib/scoring/utils'
import { Link, useRouter } from '@/i18n/routing'
import { FlagChips } from '@/components/candidate/FlagChip'
import { SubScoreStat } from '@/components/candidate/SubScoreBar'
import type { CandidateWithScores, PresetType, AnyWeights, PlanViabilityAnalysis, CargoType } from '@/types/database'
import { ProposalsCompare } from '@/components/proposals/ProposalsCompare'
import { useLocale } from 'next-intl'

interface ViabilityDataMap {
  [candidateId: string]: PlanViabilityAnalysis | null
}

// IDs of suggested candidates (must exist in DB)
const SUGGESTED_IDS = [
  'keiko-fujimori',
  'george-forsyth',
  'lopez-aliaga-cazorla-rafael-bernardo',
  'luna-galvez-jose-leon',
]

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-[var(--score-excellent-text)]'
  if (score >= 60) return 'text-[var(--score-good-text)]'
  if (score >= 40) return 'text-[var(--score-medium-text)]'
  return 'text-[var(--score-low-text)]'
}

function getBarColor(score: number): string {
  if (score >= 80) return 'bg-[var(--score-excellent)]'
  if (score >= 60) return 'bg-[var(--score-good)]'
  if (score >= 40) return 'bg-[var(--score-medium)]'
  return 'bg-[var(--score-low)]'
}

interface CompareMetric {
  labelKey: 'total' | 'competence' | 'integrity' | 'transparency' | 'plan'
  key: 'competence' | 'integrity' | 'transparency' | 'plan' | 'total'
  max: number
  presidentialOnly?: boolean
}

const metrics: CompareMetric[] = [
  { labelKey: 'total', key: 'total', max: 100 },
  { labelKey: 'competence', key: 'competence', max: 100 },
  { labelKey: 'integrity', key: 'integrity', max: 100 },
  { labelKey: 'transparency', key: 'transparency', max: 100 },
  { labelKey: 'plan', key: 'plan', max: 100, presidentialOnly: true },
]

// ──────────────────────────────────────────────
// Inline candidate search component
// ──────────────────────────────────────────────
function CandidateSearch({
  onSelect,
  excludeIds,
  placeholder,
  className,
}: {
  onSelect: (slug: string) => void
  excludeIds: string[]
  placeholder: string
  className?: string
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<(CandidateWithScores & { allCargos?: CargoType[] })[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Server-side search on query change (deduplicate same person across cargos)
  useEffect(() => {
    if (query.length < 2) {
      setResults([])
      return
    }
    const timer = setTimeout(async () => {
      setIsSearching(true)
      try {
        const params = new URLSearchParams({ search: query, limit: '20' })
        const res = await fetch(`/api/candidates?${params}`)
        const data: CandidateWithScores[] = await res.json()

        // Deduplicate: group by full_name + party_id, keep highest scored, collect all cargos
        const grouped = new Map<string, CandidateWithScores & { allCargos: CargoType[] }>()
        for (const c of data) {
          const key = `${c.full_name}::${c.party?.id || ''}`
          const existing = grouped.get(key)
          if (!existing) {
            grouped.set(key, { ...c, allCargos: [c.cargo] })
          } else {
            if (!existing.allCargos.includes(c.cargo)) {
              existing.allCargos.push(c.cargo)
            }
            // Keep the entry with the higher score
            const existingScore = existing.scores.score_balanced_p ?? existing.scores.score_balanced
            const newScore = c.scores.score_balanced_p ?? c.scores.score_balanced
            if (newScore > existingScore) {
              const allCargos = existing.allCargos
              grouped.set(key, { ...c, allCargos })
            }
          }
        }
        setResults(Array.from(grouped.values()).slice(0, 8))
        setIsOpen(true)
      } catch {
        setResults([])
      } finally {
        setIsSearching(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  // Close on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Close on escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
        inputRef.current?.blur()
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [])

  const handleSelect = (slug: string) => {
    onSelect(slug)
    setQuery('')
    setResults([])
    setIsOpen(false)
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted-foreground)]"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
        >
          <path strokeLinecap="square" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          className={cn(
            'w-full pl-11 pr-4 py-3',
            'bg-[var(--background)] text-[var(--foreground)]',
            'border-3 border-[var(--border)]',
            'font-bold text-sm uppercase placeholder:normal-case placeholder:font-medium',
            'focus:outline-none focus:border-[var(--primary)] focus:shadow-[var(--shadow-brutal-sm)]',
            'transition-all duration-100'
          )}
        />
        {isSearching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 border-2 border-[var(--muted-foreground)] border-t-transparent animate-spin" />
        )}
      </div>

      {/* Results dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-[var(--card)] border-3 border-[var(--border)] shadow-[var(--shadow-brutal-lg)] max-h-[320px] overflow-y-auto">
          {results.map((c) => {
            const isAdded = excludeIds.includes(c.slug) || excludeIds.includes(c.id)
            return (
              <button
                key={c.id}
                onClick={() => !isAdded && handleSelect(c.slug)}
                disabled={isAdded}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 text-left',
                  'border-b-2 border-[var(--border)] last:border-b-0',
                  'transition-colors duration-100',
                  isAdded
                    ? 'opacity-40 cursor-not-allowed'
                    : 'hover:bg-[var(--muted)] cursor-pointer'
                )}
              >
                {/* Photo */}
                <div className="flex-shrink-0 w-10 h-10 border-2 border-[var(--border)] bg-[var(--muted)] overflow-hidden relative">
                  <CandidateImage src={c.photo_url} name={c.full_name} fill sizes="40px" containerClassName="text-xs" />
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm text-[var(--foreground)] truncate">
                    {c.full_name}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {c.party && (
                      <span
                        className="text-xs font-bold uppercase px-1.5 py-0.5 text-white"
                        style={{ backgroundColor: c.party.color || '#6B7280' }}
                      >
                        {c.party.short_name || c.party.name}
                      </span>
                    )}
                    {(c.allCargos || [c.cargo]).map((cargo) => (
                      <span key={cargo} className="text-xs font-bold text-[var(--muted-foreground)] uppercase">
                        {cargo}
                      </span>
                    ))}
                  </div>
                </div>
                {/* Score */}
                <div className={cn('text-lg font-black', getScoreColor(
                  c.cargo === 'presidente' && c.scores.score_balanced_p != null
                    ? c.scores.score_balanced_p : c.scores.score_balanced
                ))}>
                  {(c.cargo === 'presidente' && c.scores.score_balanced_p != null
                    ? c.scores.score_balanced_p : c.scores.score_balanced
                  ).toFixed(0)}
                </div>
                {isAdded && (
                  <span className="text-xs font-bold text-[var(--muted-foreground)] uppercase">
                    ✓
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* No results */}
      {isOpen && query.length >= 2 && results.length === 0 && !isSearching && (
        <div className="absolute z-50 w-full mt-1 bg-[var(--card)] border-3 border-[var(--border)] shadow-[var(--shadow-brutal-lg)] px-4 py-6 text-center">
          <div className="text-sm font-bold text-[var(--muted-foreground)]">
            No se encontraron candidatos
          </div>
        </div>
      )}
    </div>
  )
}

// ──────────────────────────────────────────────
// Main compare component
// ──────────────────────────────────────────────
export function CompareContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const t = useTranslations('compare')
  const tCommon = useTranslations('common')
  const tCargo = useTranslations('ranking.cargo')
  const showSuccess = useSuccessToast()
  const locale = useLocale()

  const [mode, setMode] = useState<PresetType>(() => {
    const param = searchParams.get('mode')
    if (param && ['balanced', 'merit', 'integrity', 'custom'].includes(param)) {
      return param as PresetType
    }
    return 'balanced'
  })

  const [customWeights, setCustomWeights] = useState<AnyWeights>(PRESETS.balanced)

  const candidateIds = useMemo(() => {
    const idsParam = searchParams.get('ids')
    if (!idsParam) return []
    return idsParam.split(',').filter(Boolean)
  }, [searchParams])

  const { candidates, loading, error } = useCandidatesByIds(candidateIds)

  // Fetch suggested candidates for empty state
  const { candidates: suggestedCandidates } = useCandidatesByIds(
    candidateIds.length === 0 ? SUGGESTED_IDS : []
  )

  // Plan viability comparison data
  const [viabilityData, setViabilityData] = useState<ViabilityDataMap>({})
  const [viabilityLoading, setViabilityLoading] = useState(false)

  useEffect(() => {
    const presidentialCandidates = candidates.filter(c => c.cargo === 'presidente' && c.scores.plan_viability != null)
    if (presidentialCandidates.length < 2) {
      setViabilityData({})
      return
    }
    setViabilityLoading(true)
    Promise.all(
      presidentialCandidates.map(async (c) => {
        try {
          const res = await fetch(`/api/candidates/${c.id}/plan-viability`)
          if (!res.ok) return { id: c.id, data: null }
          const json = await res.json()
          return { id: c.id, data: json as PlanViabilityAnalysis | null }
        } catch {
          return { id: c.id, data: null }
        }
      })
    ).then((results) => {
      const map: ViabilityDataMap = {}
      for (const r of results) {
        map[r.id] = r.data
      }
      setViabilityData(map)
      setViabilityLoading(false)
    })
  }, [candidates])

  // Remove a candidate from comparison
  const removeCandidate = (candidate: CandidateWithScores) => {
    const newIds = candidateIds.filter(id => id !== candidate.id && id !== candidate.slug)
    if (newIds.length === 0) {
      router.push('/comparar')
    } else {
      router.push(`/comparar?ids=${newIds.join(',')}`)
    }
  }

  // Add a candidate to comparison
  const addCandidate = (idToAdd: string) => {
    if (candidateIds.length >= 4) return
    if (candidateIds.includes(idToAdd)) return
    const newIds = [...candidateIds, idToAdd]
    router.push(`/comparar?ids=${newIds.join(',')}`)
  }

  // Detect if comparing presidential candidates (at least one has plan_viability)
  const hasPresidential = candidates.some(c => c.cargo === 'presidente' && c.scores.plan_viability != null)
  const currentWeights = mode === 'custom' ? customWeights : (hasPresidential ? PRESIDENTIAL_PRESETS[mode] : PRESETS[mode])

  const getMetricValue = (candidate: CandidateWithScores, key: CompareMetric['key']): number => {
    if (key === 'total') {
      const isPres = candidate.cargo === 'presidente' && candidate.scores.plan_viability != null
      return getScoreByMode(candidate.scores, mode, currentWeights, isPres)
    }
    if (key === 'plan') {
      return candidate.scores.plan_viability ?? 0
    }
    return candidate.scores[key]
  }

  const getBestScore = (key: CompareMetric['key']): number => {
    if (candidates.length === 0) return 0
    return Math.max(...candidates.map((c) => getMetricValue(c, key)))
  }

  const handleShare = () => {
    const url = window.location.href
    if (navigator.share) {
      navigator.share({
        title: t('shareTitle'),
        text: t('shareText', { names: candidates.map(c => c.full_name).join(' vs ') }),
        url,
      })
    } else {
      navigator.clipboard.writeText(url)
      showSuccess('Link copiado', 'El enlace está en tu portapapeles')
    }
  }

  const cargoLabels: Record<string, string> = {
    presidente: tCargo('presidente'),
    vicepresidente: tCargo('vicepresidente'),
    senador: tCargo('senador'),
    diputado: tCargo('diputado'),
    parlamento_andino: tCargo('parlamento_andino'),
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header currentPath="/comparar" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Breadcrumb */}
        <nav className="mb-4 flex items-center gap-2 text-sm">
          <Link href="/" className="text-[var(--muted-foreground)] hover:text-[var(--primary)] font-bold uppercase transition-colors">
            {t('breadcrumb.home')}
          </Link>
          <svg className="w-4 h-4 text-[var(--muted-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="square" d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-[var(--foreground)] font-bold uppercase">
            {t('breadcrumb.compare')}
          </span>
        </nav>

        {/* Title & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-[var(--foreground)] uppercase tracking-tight">
              {t('title')}
            </h1>
            <p className="text-sm text-[var(--muted-foreground)] font-medium mt-1">
              {loading ? t('loading') : candidates.length === 0 ? t('selectToCompare') : t('candidateCount', { count: candidates.length })}
            </p>
          </div>
          {candidates.length > 0 && (
            <div className="flex gap-2 items-center">
              <Button variant="outline" size="sm" onClick={handleShare} className="min-h-[40px]">
                <svg className="w-4 h-4 sm:mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="square" strokeLinejoin="miter" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                <span className="hidden sm:inline font-bold">{t('share').toUpperCase()}</span>
              </Button>
            </div>
          )}
        </div>

        {/* Preset Selector */}
        <div className="mb-6">
          <PresetSelector
            value={mode}
            weights={customWeights}
            cargo={hasPresidential ? 'presidente' : undefined}
            onChange={(newMode, newWeights) => {
              setMode(newMode)
              if (newWeights) {
                setCustomWeights(newWeights)
              }
            }}
          />
        </div>

        {error ? (
          <div role="alert" aria-live="assertive">
            <Card>
              <CardContent className="py-12 text-center">
                <div className="text-[var(--flag-red-text)] font-bold">
                  {tCommon('error')}: {error}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : loading ? (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-5">
                  <div className="flex flex-col items-center">
                    <div className="w-24 h-24 bg-[var(--muted)] border-2 border-[var(--border)] mb-3" />
                    <div className="h-5 w-32 bg-[var(--muted)] border border-[var(--border)] mb-2" />
                    <div className="h-4 w-24 bg-[var(--muted)] border border-[var(--border)]" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : candidates.length === 0 ? (
          /* ─── EMPTY STATE ─── */
          <Card>
            <CardContent className="py-8 sm:py-12">
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-[var(--muted)] border-3 border-[var(--border)] flex items-center justify-center">
                  <svg className="w-8 h-8 text-[var(--muted-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="square" strokeLinejoin="miter" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-black text-[var(--foreground)] mb-2 uppercase">
                  {t('emptyState.title')}
                </h3>
                <p className="text-sm text-[var(--muted-foreground)] font-medium max-w-md mx-auto">
                  {t('emptyState.description')}
                </p>
              </div>

              {/* Search input */}
              <div className="max-w-lg mx-auto mb-8">
                <CandidateSearch
                  onSelect={addCandidate}
                  excludeIds={candidateIds}
                  placeholder={t('searchPlaceholder')}
                />
              </div>

              {/* Suggested candidates */}
              <div className="border-t-2 border-[var(--border)] pt-6">
                <p className="text-xs font-bold text-[var(--muted-foreground)] uppercase mb-4 text-center">
                  {t('emptyState.suggestedTitle')}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto">
                  {(suggestedCandidates.length > 0 ? suggestedCandidates : []).map((c) => (
                    <button
                      key={c.id}
                      onClick={() => addCandidate(c.slug)}
                      className={cn(
                        'p-3 text-center',
                        'bg-[var(--card)] border-3 border-[var(--border)]',
                        'shadow-[var(--shadow-brutal-sm)]',
                        'hover:bg-[var(--primary)] hover:text-white hover:border-[var(--primary)]',
                        'hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[var(--shadow-brutal)]',
                        'active:translate-x-0 active:translate-y-0 active:shadow-none',
                        'transition-all duration-100 group'
                      )}
                    >
                      {/* Photo */}
                      <div className="w-14 h-14 mx-auto mb-2 border-2 border-[var(--border)] bg-[var(--muted)] overflow-hidden relative group-hover:border-white/50">
                        <CandidateImage src={c.photo_url} name={c.full_name} fill sizes="56px" containerClassName="text-xs" />
                      </div>
                      {/* Name */}
                      <div className="text-xs font-black uppercase truncate leading-tight">
                        {c.full_name.split(' ').slice(0, 2).join(' ')}
                      </div>
                      {/* Party */}
                      <div className="text-xs font-bold opacity-60 truncate mt-0.5">
                        {c.party?.short_name || c.party?.name || ''}
                      </div>
                      {/* Score */}
                      <div className={cn(
                        'text-lg font-black mt-1 group-hover:text-white',
                        getScoreColor(c.cargo === 'presidente' && c.scores.score_balanced_p != null
                          ? c.scores.score_balanced_p : c.scores.score_balanced)
                      )}>
                        {(c.cargo === 'presidente' && c.scores.score_balanced_p != null
                          ? c.scores.score_balanced_p : c.scores.score_balanced
                        ).toFixed(0)}
                      </div>
                    </button>
                  ))}
                  {suggestedCandidates.length === 0 && SUGGESTED_IDS.map((id) => (
                    <div key={id} className="p-3 bg-[var(--muted)] border-3 border-[var(--border)] animate-pulse">
                      <div className="w-14 h-14 mx-auto mb-2 bg-[var(--background)] border-2 border-[var(--border)]" />
                      <div className="h-3 w-16 mx-auto bg-[var(--background)] border border-[var(--border)] mb-1" />
                      <div className="h-3 w-12 mx-auto bg-[var(--background)] border border-[var(--border)]" />
                    </div>
                  ))}
                </div>
                <div className="text-center mt-6">
                  <Link href="/ranking">
                    <Button variant="outline" size="sm">
                      {t('emptyState.viewAllRanking')}
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Search bar for adding more */}
            {candidates.length < 4 && (
              <div className="mb-6">
                <CandidateSearch
                  onSelect={addCandidate}
                  excludeIds={candidateIds}
                  placeholder={t('searchPlaceholder')}
                />
              </div>
            )}

            {/* ─── CANDIDATE CARDS ─── */}
            <div className={cn(
              'mb-6',
              // Mobile: horizontal scroll for 3+
              candidates.length >= 3
                ? 'flex overflow-x-auto snap-x snap-mandatory gap-4 -mx-4 px-4 pb-2 md:grid md:overflow-visible md:mx-0 md:px-0 md:pb-0 md:grid-cols-3'
                : 'grid gap-4',
              candidates.length >= 4 && 'md:grid-cols-4',
              candidates.length === 1 && 'grid-cols-1 max-w-sm mx-auto',
              candidates.length === 2 && 'grid-cols-1 sm:grid-cols-2',
            )}>
              {candidates.map((candidate) => {
                const isPres = candidate.cargo === 'presidente' && candidate.scores.plan_viability != null
                const score = getScoreByMode(candidate.scores, mode, currentWeights, isPres)
                const isBest = score === getBestScore('total') && candidates.length > 1

                return (
                  <Card
                    key={candidate.id}
                    className={cn(
                      'relative',
                      isBest && 'ring-3 ring-[var(--score-excellent)]',
                      // Snap for horizontal scroll
                      candidates.length >= 3 && 'min-w-[270px] max-w-[300px] flex-shrink-0 snap-start md:min-w-0 md:max-w-none',
                    )}
                  >
                    {/* Remove button */}
                    <button
                      onClick={() => removeCandidate(candidate)}
                      className={cn(
                        'absolute top-2 right-2 z-10',
                        'w-11 h-11 sm:w-9 sm:h-9 flex items-center justify-center',
                        'bg-[var(--muted)] border-2 border-[var(--border)]',
                        'text-[var(--muted-foreground)]',
                        'hover:bg-[var(--flag-red)] hover:text-white hover:border-[var(--flag-red)]',
                        'transition-colors'
                      )}
                      title={t('removeFromComparison')}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="square" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>

                    {isBest && (
                      <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-[var(--score-excellent)] text-white text-xs sm:text-xs font-black uppercase px-2 py-1 border-2 border-[var(--border)]">
                        {t('best')}
                      </div>
                    )}
                    <CardContent className="p-4 sm:p-5">
                      <div className="flex flex-col items-center text-center">
                        {/* Photo - bigger */}
                        <div className="w-20 h-20 sm:w-24 sm:h-24 border-3 border-[var(--border)] bg-[var(--muted)] overflow-hidden mb-3 relative">
                          <CandidateImage src={candidate.photo_url} name={candidate.full_name} fill sizes="(max-width: 640px) 80px, 96px" containerClassName="text-2xl" />
                        </div>

                        {/* Name */}
                        <h3 className="font-black text-[var(--foreground)] text-sm sm:text-base uppercase tracking-tight leading-tight">
                          {candidate.full_name}
                        </h3>

                        {/* Party + Cargo badges */}
                        <div className="flex flex-wrap items-center justify-center gap-1.5 mt-1.5">
                          {candidate.party && (
                            <Badge
                              size="sm"
                              style={{
                                backgroundColor: candidate.party.color || '#6B7280',
                                color: '#fff',
                              }}
                            >
                              {candidate.party.short_name || candidate.party.name}
                            </Badge>
                          )}
                          <Badge variant="outline" size="sm">
                            {cargoLabels[candidate.cargo] || candidate.cargo}
                          </Badge>
                        </div>

                        {/* Score */}
                        <div className={cn(
                          'text-3xl sm:text-4xl font-black mt-3',
                          getScoreColor(score)
                        )}>
                          {score.toFixed(0)}
                        </div>
                        <div className="text-xs sm:text-xs font-bold text-[var(--muted-foreground)] uppercase">
                          {t('outOf100')}
                        </div>

                        {/* Sub-scores */}
                        <div className={cn(
                          'w-full grid gap-2 mt-3 pt-3 border-t-2 border-[var(--border)]',
                          isPres ? 'grid-cols-4' : 'grid-cols-3'
                        )}>
                          <SubScoreStat type="competence" value={candidate.scores.competence} size="sm" />
                          <SubScoreStat type="integrity" value={candidate.scores.integrity} size="sm" />
                          <SubScoreStat type="transparency" value={candidate.scores.transparency} size="sm" />
                          {isPres && (
                            <SubScoreStat type="plan" value={candidate.scores.plan_viability!} size="sm" />
                          )}
                        </div>

                        {/* Flags */}
                        {candidate.flags.length > 0 && (
                          <div className="w-full mt-3 pt-3 border-t-2 border-[var(--border)]">
                            <FlagChips flags={candidate.flags} maxVisible={2} size="sm" />
                          </div>
                        )}

                        {/* View Profile Link - bigger */}
                        <Link
                          href={`/candidato/${candidate.slug}`}
                          className={cn(
                            'mt-3 inline-flex items-center gap-1',
                            'px-4 py-2 min-h-[44px]',
                            'text-sm font-bold text-[var(--primary)]',
                            'border-2 border-[var(--primary)]',
                            'hover:bg-[var(--primary)] hover:text-white',
                            'transition-colors uppercase'
                          )}
                        >
                          {t('viewProfile')}
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Single candidate prompt */}
            {candidates.length === 1 && (
              <Card className="mb-6 bg-[var(--muted)]">
                <CardContent className="py-4 px-6">
                  <p className="text-sm font-medium text-[var(--foreground)] mb-3">
                    {t('addAtLeastOne')}
                  </p>
                  <CandidateSearch
                    onSelect={addCandidate}
                    excludeIds={candidateIds}
                    placeholder={t('searchPlaceholder')}
                  />
                </CardContent>
              </Card>
            )}

            {/* ─── COMPARISON METRICS ─── (Only show with 2+) */}
            {candidates.length >= 2 && (
            <div>
              <h2 className="text-lg sm:text-xl font-black text-[var(--foreground)] uppercase tracking-tight mb-4">
                {t('metricsComparison')}
              </h2>

              {/* Mobile: Single compact card with all metrics */}
              <Card className="md:hidden">
                <CardContent className="p-4">
                  {/* Candidate names header */}
                  <div className="flex items-center gap-2 mb-4 pb-3 border-b-2 border-[var(--border)]">

                    {candidates.map((c) => (
                      <div key={c.id} className="flex-1 flex items-center gap-1.5 min-w-0">
                        <div className="w-6 h-6 flex-shrink-0 border-2 border-[var(--border)] bg-[var(--muted)] overflow-hidden relative">
                          <CandidateImage src={c.photo_url} name={c.full_name} fill sizes="24px" containerClassName="text-[8px]" />
                        </div>
                        <span className="text-xs font-bold text-[var(--foreground)] truncate">
                          {c.full_name.split(' ')[0]}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Metric rows */}
                  <div className="space-y-5">
                    {metrics.filter(m => !m.presidentialOnly || hasPresidential).map((metric) => {
                      const best = getBestScore(metric.key)
                      return (
                        <div key={metric.key}>
                          <div className="text-xs font-black text-[var(--muted-foreground)] uppercase mb-2">
                            {t(`metrics.${metric.labelKey}`)}
                          </div>
                          <div className="space-y-2">
                            {candidates.map((candidate) => {
                              const value = getMetricValue(candidate, metric.key)
                              const isBest = value === best && candidates.length > 1
                              return (
                                <div key={candidate.id} className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-[var(--foreground)] w-14 truncate">
                                    {candidate.full_name.split(' ')[0]}
                                  </span>
                                  <div className="flex-1 h-3 bg-[var(--muted)] border-2 border-[var(--border)] overflow-hidden">
                                    <div
                                      className={cn('h-full transition-all', getBarColor(value))}
                                      style={{ width: `${(value / metric.max) * 100}%` }}
                                    />
                                  </div>
                                  <span className={cn(
                                    'text-sm font-black w-8 text-right tabular-nums',
                                    isBest ? 'text-[var(--score-excellent-text)]' : 'text-[var(--foreground)]'
                                  )}>
                                    {value.toFixed(0)}
                                  </span>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Desktop: Table */}
              <Card className="hidden md:block">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b-3 border-[var(--border)]">
                          <th className="text-left p-5 font-black text-[var(--muted-foreground)] uppercase tracking-wide text-sm">
                            {t('metrics.total').split(' ')[0]}
                          </th>
                          {candidates.map((candidate) => (
                            <th
                              key={candidate.id}
                              className="text-center p-5 font-black text-[var(--foreground)] uppercase tracking-tight text-sm"
                            >
                              {candidate.full_name.split(' ').slice(0, 2).join(' ')}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {metrics.filter(m => !m.presidentialOnly || hasPresidential).map((metric) => {
                          const best = getBestScore(metric.key)

                          return (
                            <tr
                              key={metric.key}
                              className="border-b-2 border-[var(--border)] last:border-0 hover:bg-[var(--muted)]/50 transition-colors"
                            >
                              <td className="p-5 font-bold text-[var(--foreground)]">
                                {t(`metrics.${metric.labelKey}`)}
                              </td>
                              {candidates.map((candidate) => {
                                const value = getMetricValue(candidate, metric.key)
                                const isBest = value === best && candidates.length > 1

                                return (
                                  <td key={candidate.id} className={cn('p-5', isBest && 'bg-[var(--score-excellent)]/5')}>
                                    <div className="flex flex-col items-center gap-2">
                                      <div className={cn(
                                        'font-black text-xl',
                                        isBest ? 'text-[var(--score-excellent-text)]' : 'text-[var(--foreground)]'
                                      )}>
                                        {value.toFixed(1)}
                                        {isBest && (
                                          <svg className="inline-block w-5 h-5 ml-1" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                          </svg>
                                        )}
                                      </div>
                                      <div className="w-full max-w-[120px] h-3 bg-[var(--muted)] border-2 border-[var(--border)] overflow-hidden">
                                        <div
                                          className={cn(
                                            'h-full transition-all',
                                            getBarColor(value)
                                          )}
                                          style={{ width: `${(value / metric.max) * 100}%` }}
                                        />
                                      </div>
                                    </div>
                                  </td>
                                )
                              })}
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Legend */}
              <div className="mt-4 text-center text-xs sm:text-sm text-[var(--muted-foreground)] font-medium">
                <p>
                  {t('scoresVaryByMode')}{' '}
                  <Link href="/metodologia" className="text-[var(--primary)] font-bold hover:underline uppercase">
                    {t('viewMethodology')}
                  </Link>
                </p>
              </div>
            </div>
            )}

            {/* ─── PROPOSALS COMPARISON ─── */}
            {candidates.length >= 2 && (
              <div className="mt-8">
                <h2 className="text-lg sm:text-xl font-black text-[var(--foreground)] uppercase tracking-tight mb-4">
                  {t('proposalsComparison')}
                </h2>
                <p className="text-sm text-[var(--muted-foreground)] font-medium mb-4">
                  {t('proposalsDescription')}
                </p>
                <Card>
                  <CardContent className="p-4 sm:p-6">
                    <ProposalsCompare
                      candidateIds={candidates.map(c => c.id)}
                      lang={locale}
                    />
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ─── PLAN VIABILITY COMPARISON ─── */}
            {hasPresidential && candidates.length >= 2 && (
              <div className="mt-8">
                <h2 className="text-lg sm:text-xl font-black text-[var(--foreground)] uppercase tracking-tight mb-4">
                  {t('viabilityComparison')}
                </h2>
                <p className="text-sm text-[var(--muted-foreground)] font-medium mb-4">
                  {t('viabilityDescription')}
                </p>

                {viabilityLoading ? (
                  <Card>
                    <CardContent className="p-6">
                      <div className="animate-pulse space-y-4">
                        <div className="h-4 bg-[var(--muted)] rounded w-3/4" />
                        <div className="h-4 bg-[var(--muted)] rounded w-1/2" />
                        <div className="h-4 bg-[var(--muted)] rounded w-2/3" />
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-6">
                    {/* Viability metric bars */}
                    {(['fiscal_viability_score', 'legal_viability_score', 'coherence_score', 'historical_score'] as const).map((metricKey) => {
                      const labelMap: Record<string, string> = {
                        fiscal_viability_score: t('viabilityFiscal'),
                        legal_viability_score: t('viabilityLegal'),
                        coherence_score: t('viabilityCoherence'),
                        historical_score: t('viabilityHistorical'),
                      }
                      return (
                        <Card key={metricKey}>
                          <CardContent className="p-4">
                            <h4 className="text-xs font-black uppercase text-[var(--muted-foreground)] mb-3">
                              {labelMap[metricKey]}
                            </h4>
                            <div className="space-y-2">
                              {candidates.filter(c => c.cargo === 'presidente').map((c) => {
                                const v = viabilityData[c.id]
                                const score = v ? Number(v[metricKey]) : 0
                                const normalized = score * 10 // 1-10 scale → percentage
                                return (
                                  <div key={c.id} className="flex items-center gap-3">
                                    <div className="w-24 sm:w-32 truncate text-xs font-bold">
                                      {c.full_name.split(' ').slice(-2).join(' ')}
                                    </div>
                                    <div className="flex-1 h-5 border-2 border-[var(--border)] bg-[var(--muted)] overflow-hidden">
                                      <div
                                        className={cn('h-full', getBarColor(normalized))}
                                        style={{ width: `${normalized}%` }}
                                      />
                                    </div>
                                    <div className={cn('w-10 text-right text-sm font-black', getScoreColor(normalized))}>
                                      {score.toFixed(1)}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}

                    {/* Overall score + summaries per candidate */}
                    <div className={cn(
                      'grid gap-4',
                      candidates.filter(c => c.cargo === 'presidente').length === 2 ? 'grid-cols-1 sm:grid-cols-2' :
                      candidates.filter(c => c.cargo === 'presidente').length === 3 ? 'grid-cols-1 sm:grid-cols-3' :
                      'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
                    )}>
                      {candidates.filter(c => c.cargo === 'presidente').map((c) => {
                        const v = viabilityData[c.id]
                        if (!v) {
                          return (
                            <Card key={c.id}>
                              <CardContent className="p-4 text-center">
                                <div className="text-sm font-bold mb-2">{c.full_name.split(' ').slice(-2).join(' ')}</div>
                                <div className="text-xs text-[var(--muted-foreground)]">{t('viabilityNoData')}</div>
                              </CardContent>
                            </Card>
                          )
                        }
                        const overallPct = v.overall_viability_score * 10
                        return (
                          <Card key={c.id}>
                            <CardContent className="p-4 space-y-3">
                              {/* Candidate name + overall score */}
                              <div className="flex items-center justify-between">
                                <div className="text-sm font-bold truncate">{c.full_name.split(' ').slice(-2).join(' ')}</div>
                                <div className={cn('text-2xl font-black', getScoreColor(overallPct))}>
                                  {v.overall_viability_score.toFixed(1)}
                                </div>
                              </div>
                              <div className="text-xs font-black uppercase text-[var(--muted-foreground)]">
                                {t('viabilityOverall')}
                              </div>

                              {/* Executive summary */}
                              <div>
                                <h5 className="text-xs font-black uppercase text-[var(--muted-foreground)] mb-1">
                                  {t('viabilitySummary')}
                                </h5>
                                <p className="text-xs text-[var(--foreground)] line-clamp-4">
                                  {v.executive_summary}
                                </p>
                              </div>

                              {/* Strengths */}
                              {v.key_strengths.length > 0 && (
                                <div>
                                  <h5 className="text-xs font-black uppercase text-green-600 mb-1">
                                    {t('viabilityStrengths')}
                                  </h5>
                                  <div className="flex flex-wrap gap-1">
                                    {v.key_strengths.slice(0, 3).map((s, i) => (
                                      <span key={i} className="text-xs px-1.5 py-0.5 bg-green-100 text-green-800 border border-green-300 font-bold">
                                        {s}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Weaknesses */}
                              {v.key_weaknesses.length > 0 && (
                                <div>
                                  <h5 className="text-xs font-black uppercase text-red-600 mb-1">
                                    {t('viabilityWeaknesses')}
                                  </h5>
                                  <div className="flex flex-wrap gap-1">
                                    {v.key_weaknesses.slice(0, 3).map((w, i) => (
                                      <span key={i} className="text-xs px-1.5 py-0.5 bg-red-100 text-red-800 border border-red-300 font-bold">
                                        {w}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Risks */}
                              {v.key_risks.length > 0 && (
                                <div>
                                  <h5 className="text-xs font-black uppercase text-[var(--flag-amber-text)] mb-1">
                                    {t('viabilityRisks')}
                                  </h5>
                                  <div className="flex flex-wrap gap-1">
                                    {v.key_risks.slice(0, 3).map((r, i) => (
                                      <span key={i} className="text-xs px-1.5 py-0.5 bg-amber-100 text-amber-800 border border-amber-300 font-bold">
                                        {r}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
