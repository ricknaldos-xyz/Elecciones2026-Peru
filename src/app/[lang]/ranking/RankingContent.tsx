'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useRouter } from '@/i18n/routing'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/Card'
import { CandidateCardSkeleton } from '@/components/ui/Skeleton'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { PresetSelector } from '@/components/ranking/PresetSelector'
import { RankingFilters } from '@/components/ranking/RankingFilters'
import { RankingList } from '@/components/ranking/RankingList'
import { CompareTray } from '@/components/compare/CompareTray'
import { useSuccessToast } from '@/components/ui/Toast'
import { AdBanner } from '@/components/ads/AdBanner'
import { useCandidates } from '@/hooks/useCandidates'
import { PRESETS, WEIGHT_LIMITS, PRESIDENTIAL_PRESETS, DISTRICTS, validateAndNormalizeWeights } from '@/lib/constants'
// Party type for filter dropdown
interface PartyOption {
  id: string
  name: string
  short_name: string | null
}
import { getScoreByMode } from '@/lib/scoring/utils'
import type { PresetType, CargoType, AnyWeights, CandidateWithScores } from '@/types/database'
import { isPresidentialWeights } from '@/types/database'

function sortCandidatesByScore(
  candidates: CandidateWithScores[],
  mode: PresetType,
  weights?: AnyWeights,
  isPresidential?: boolean
): CandidateWithScores[] {
  return [...candidates].sort((a, b) => {
    const scoreA = getScoreByMode(a.scores, mode, weights, isPresidential)
    const scoreB = getScoreByMode(b.scores, mode, weights, isPresidential)
    return scoreB - scoreA
  })
}

export function RankingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const t = useTranslations('ranking')
  const tCommon = useTranslations('common')
  const tShare = useTranslations('share')
  const showSuccess = useSuccessToast()

  // Get cargo labels from translations
  const cargoLabels: Record<CargoType, string> = {
    presidente: t('cargo.presidente'),
    vicepresidente: t('cargo.vicepresidente'),
    senador: t('cargo.senador'),
    diputado: t('cargo.diputado'),
    parlamento_andino: t('cargo.parlamento_andino'),
  }

  // Estado del modo/preset
  const [mode, setMode] = useState<PresetType>(() => {
    const param = searchParams.get('mode')
    if (param && (param === 'balanced' || param === 'merit' || param === 'integrity' || param === 'custom')) {
      return param
    }
    return 'balanced'
  })

  // Estado de pesos custom
  const [customWeights, setCustomWeights] = useState<AnyWeights>(() => {
    const wC = searchParams.get('wC')
    const wI = searchParams.get('wI')
    const wT = searchParams.get('wT')
    if (wC && wI && wT) {
      // Use centralized validation to ensure weights sum to 1.0
      return validateAndNormalizeWeights({
        wC: parseFloat(wC),
        wI: parseFloat(wI),
        wT: parseFloat(wT),
      })
    }
    return PRESETS.balanced
  })

  // Estado de filtros
  const [cargo, setCargo] = useState<CargoType>(() => {
    const param = searchParams.get('cargo')
    if (param && ['presidente', 'vicepresidente', 'senador', 'diputado', 'parlamento_andino'].includes(param)) {
      return param as CargoType
    }
    return 'presidente'
  })

  const [distrito, setDistrito] = useState<string | undefined>(() => {
    const param = searchParams.get('cargo')
    if (param && param !== 'diputado') return undefined
    return searchParams.get('distrito') || undefined
  })

  const [partyId, setPartyId] = useState<string | undefined>(() => {
    return searchParams.get('partido') || undefined
  })

  const [minConfidence, setMinConfidence] = useState<number>(() => {
    const param = searchParams.get('minConfidence')
    return param ? parseInt(param, 10) : 0
  })

  const [onlyClean, setOnlyClean] = useState<boolean>(() => {
    return searchParams.get('onlyClean') === 'true'
  })

  // Estado de comparación
  const [selectedForCompare, setSelectedForCompare] = useState<CandidateWithScores[]>([])

  // Panel de filtros móvil
  const [showFilters, setShowFilters] = useState(false)

  // View mode (list or grid)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')

  // Search query
  const [searchQuery, setSearchQuery] = useState('')

  // Back to top visibility
  const [showBackToTop, setShowBackToTop] = useState(false)

  // Parties from database
  const [parties, setParties] = useState<PartyOption[]>([])

  useEffect(() => {
    fetch('/api/parties')
      .then(res => res.json())
      .then((data: PartyOption[]) => {
        if (Array.isArray(data)) {
          setParties(data.sort((a, b) => a.name.localeCompare(b.name)))
        }
      })
      .catch(() => {})
  }, [])

  // Track scroll for back-to-top
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Fetch candidates from API
  const { candidates: rawCandidates, loading, error } = useCandidates({
    cargo,
    distrito,
    partyId,
    minConfidence: minConfidence > 0 ? minConfidence : undefined,
    onlyClean,
  })

  // Helper para actualizar URL sin recargar
  const updateURL = useCallback((params: Record<string, string>) => {
    const current = new URLSearchParams(searchParams.toString())
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        current.set(key, value)
      } else {
        current.delete(key)
      }
    })
    const newURL = current.toString() ? `?${current.toString()}` : ''
    window.history.replaceState(null, '', `/ranking${newURL}`)
  }, [searchParams])

  // Filtrar por búsqueda y ordenar candidatos por modo
  const candidates = useMemo(() => {
    let filtered = rawCandidates

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = rawCandidates.filter(c =>
        c.full_name.toLowerCase().includes(query) ||
        c.party?.name.toLowerCase().includes(query) ||
        c.party?.short_name?.toLowerCase().includes(query)
      )
    }

    return sortCandidatesByScore(filtered, mode, customWeights, cargo === 'presidente')
  }, [rawCandidates, mode, searchQuery, customWeights, cargo])

  // Pesos actuales
  const currentWeights = useMemo(() => {
    if (mode === 'custom') return customWeights
    return cargo === 'presidente' ? PRESIDENTIAL_PRESETS[mode] : PRESETS[mode]
  }, [mode, customWeights, cargo])

  // Handlers
  const handleCargoChange = useCallback((newCargo: CargoType) => {
    // Reset weights when switching to/from presidente (4-pillar vs 3-pillar)
    if ((newCargo === 'presidente') !== (cargo === 'presidente')) {
      const newDefaults = newCargo === 'presidente'
        ? PRESIDENTIAL_PRESETS.balanced
        : PRESETS.balanced
      setCustomWeights(newDefaults)
      setMode('balanced')
    }
    setCargo(newCargo)
    setDistrito(undefined)
    setSelectedForCompare([])
    updateURL({ cargo: newCargo, distrito: '' })
  }, [cargo, updateURL])

  const handleDistritoChange = useCallback((newDistrito?: string) => {
    setDistrito(newDistrito)
    updateURL({ distrito: newDistrito || '' })
  }, [updateURL])

  const handlePartyChange = useCallback((newPartyId?: string) => {
    setPartyId(newPartyId)
    updateURL({ partido: newPartyId || '' })
  }, [updateURL])

  const handleMinConfidenceChange = useCallback((value: number) => {
    setMinConfidence(value)
    updateURL({ minConfidence: value.toString() })
  }, [updateURL])

  const handleOnlyCleanChange = useCallback((value: boolean) => {
    setOnlyClean(value)
    updateURL({ onlyClean: value ? 'true' : '' })
  }, [updateURL])

  const handleResetFilters = useCallback(() => {
    setDistrito(undefined)
    setPartyId(undefined)
    setMinConfidence(0)
    setOnlyClean(false)
    updateURL({ distrito: '', partido: '', minConfidence: '', onlyClean: '' })
  }, [updateURL])

  const handleCompare = useCallback((id: string) => {
    setSelectedForCompare((prev) => {
      const existing = prev.find((c) => c.id === id)
      if (existing) {
        showSuccess(t('removedFromComparison'))
        return prev.filter((c) => c.id !== id)
      }
      if (prev.length >= 4) {
        return prev
      }
      const candidate = candidates.find((c) => c.id === id)
      if (candidate) {
        showSuccess(t('addedToComparison'), candidate.full_name)
        return [...prev, candidate]
      }
      return prev
    })
  }, [candidates, showSuccess])

  const handleRemoveFromCompare = useCallback((id: string) => {
    setSelectedForCompare((prev) => prev.filter((c) => c.id !== id))
    showSuccess(t('removedFromComparison'))
  }, [showSuccess, t])

  const handleClearCompare = useCallback(() => {
    setSelectedForCompare([])
  }, [])

  const handleGoToCompare = useCallback(() => {
    const ids = selectedForCompare.map((c) => c.id).join(',')
    router.push(`/comparar?ids=${ids}&mode=${mode}`)
  }, [selectedForCompare, mode, router])

  const handleViewCandidate = useCallback((slug: string) => {
    router.push(`/candidato/${slug}`)
  }, [router])

  const handleShareCandidate = useCallback((id: string) => {
    const candidate = candidates.find((c) => c.id === id)
    if (candidate) {
      const url = `${window.location.origin}/candidato/${candidate.slug}`
      navigator.clipboard.writeText(url)
    }
  }, [candidates])

  const handleShareRanking = useCallback(() => {
    const url = window.location.href
    if (navigator.share) {
      navigator.share({
        title: t('shareTitle', { cargo: cargoLabels[cargo] }),
        text: t('shareText', { count: candidates.length }),
        url,
      })
    } else {
      navigator.clipboard.writeText(url)
      showSuccess(tShare('linkCopied'), tShare('clipboardMessage'))
    }
  }, [cargo, candidates.length, t, tShare, cargoLabels, showSuccess])

  const selectedIds = useMemo(() => selectedForCompare.map((c) => c.id), [selectedForCompare])

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header currentPath="/ranking" />

      {/* Ad Banner - Header */}
      <AdBanner slotId="internal-header" className="py-2" />

      <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Page Header - NEO BRUTAL */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-black text-[var(--foreground)] uppercase tracking-tight">
                {t('title')} - {cargoLabels[cargo]}
              </h1>
              <p className="text-[var(--muted-foreground)] font-bold mt-1">
                {loading ? t('loading') : `${candidates.length} ${t('filters.all').toLowerCase()}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="primary" size="md">{t('elections2026')}</Badge>
              <button
                onClick={handleShareRanking}
                className={cn(
                  'p-2 min-w-[44px] min-h-[44px]',
                  'bg-[var(--muted)] border-2 border-[var(--border)]',
                  'hover:bg-[var(--primary)] hover:text-white',
                  'transition-all duration-100',
                  'flex items-center justify-center'
                )}
                title={t('shareRanking')}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="square" strokeLinejoin="miter" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Quick Cargo Pills - Mobile only */}
          <div className="lg:hidden overflow-x-auto -mx-4 px-4 mb-4">
            <div className="flex items-center gap-1.5 min-w-max">
              {(['presidente', 'senador', 'diputado', 'parlamento_andino'] as CargoType[]).map((c) => (
                <button
                  key={c}
                  onClick={() => handleCargoChange(c)}
                  className={cn(
                    'px-3 py-2 text-xs font-bold uppercase tracking-wide whitespace-nowrap',
                    'border-2 transition-all duration-100',
                    'min-h-[44px]',
                    cargo === c
                      ? 'bg-[var(--primary)] text-white border-[var(--border)] shadow-[var(--shadow-brutal-sm)]'
                      : 'bg-[var(--background)] text-[var(--foreground)] border-[var(--border)] hover:bg-[var(--muted)]'
                  )}
                >
                  {cargoLabels[c]}
                </button>
              ))}
            </div>
          </div>

          {/* Search Input */}
          <div className="relative mb-4">
            <input
              type="text"
              placeholder={t('filters.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                'w-full px-4 py-3 pl-11',
                'bg-[var(--background)]',
                'border-3 border-[var(--border)]',
                'text-sm font-bold text-[var(--foreground)]',
                'placeholder:text-[var(--muted-foreground)]',
                'focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2',
                'min-h-[48px]'
              )}
            />
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="square" strokeLinejoin="miter" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-[var(--muted)]"
              >
                <svg className="w-4 h-4 text-[var(--muted-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="square" strokeLinejoin="miter" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Preset Selector + View Toggle */}
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="flex-1">
              <PresetSelector
                value={mode}
                weights={customWeights}
                cargo={cargo}
                onChange={(newMode, newWeights) => {
                  setMode(newMode)
                  if (newWeights) {
                    setCustomWeights(newWeights)
                  }
                  updateURL({ mode: newMode })
                }}
              />
            </div>

            {/* View Toggle - All screens */}
            <div className="flex items-center gap-1 p-1 bg-[var(--muted)] border-3 border-[var(--border)] shadow-[var(--shadow-brutal-sm)]">
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'p-2 min-w-[44px] min-h-[44px] flex items-center justify-center border-2 transition-all duration-100',
                  viewMode === 'list'
                    ? 'bg-[var(--primary)] text-white border-[var(--border)] shadow-[var(--shadow-brutal-sm)] -translate-x-0.5 -translate-y-0.5'
                    : 'bg-[var(--background)] text-[var(--foreground)] border-transparent hover:border-[var(--border)]'
                )}
                aria-label={t('listView')}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="square" strokeLinejoin="miter" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  'p-2 min-w-[44px] min-h-[44px] flex items-center justify-center border-2 transition-all duration-100',
                  viewMode === 'grid'
                    ? 'bg-[var(--primary)] text-white border-[var(--border)] shadow-[var(--shadow-brutal-sm)] -translate-x-0.5 -translate-y-0.5'
                    : 'bg-[var(--background)] text-[var(--foreground)] border-transparent hover:border-[var(--border)]'
                )}
                aria-label={t('gridView')}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="square" strokeLinejoin="miter" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Active Weights Indicator - Show when not balanced */}
          {mode !== 'balanced' && (
            <div className="flex items-center gap-2 mt-3 text-xs font-bold">
              <span className="text-[var(--muted-foreground)] uppercase">{t('weights')}:</span>
              <span className="px-2 py-1 bg-[var(--score-competence-bg)] text-[var(--score-competence-text)] border border-[var(--border)]">
                C: {(currentWeights.wC * 100).toFixed(0)}%
              </span>
              <span className="px-2 py-1 bg-[var(--score-integrity-bg)] text-[var(--score-integrity-text)] border border-[var(--border)]">
                I: {(currentWeights.wI * 100).toFixed(0)}%
              </span>
              <span className="px-2 py-1 bg-[var(--score-transparency-bg)] text-[var(--score-transparency-text)] border border-[var(--border)]">
                T: {(currentWeights.wT * 100).toFixed(0)}%
              </span>
              {cargo === 'presidente' && isPresidentialWeights(currentWeights) && (
                <span className="px-2 py-1 bg-[var(--score-medium-bg)] text-[var(--score-plan-text)] border border-[var(--border)]">
                  P: {(currentWeights.wP * 100).toFixed(0)}%
                </span>
              )}
            </div>
          )}

          {/* Active Filter Chips */}
          {(distrito || partyId || minConfidence > 0 || onlyClean) && (
            <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t-2 border-[var(--border)]">
              <span className="text-sm font-bold text-[var(--muted-foreground)] uppercase">{t('activeFilters')}:</span>
              {distrito && (
                <button
                  onClick={() => handleDistritoChange(undefined)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--primary)] text-white text-sm font-bold border-2 border-[var(--border)] hover:opacity-90 transition-opacity"
                >
                  {DISTRICTS.find(d => d.slug === distrito)?.name || distrito}
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="square" strokeLinejoin="miter" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              {partyId && (
                <button
                  onClick={() => handlePartyChange(undefined)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--primary)] text-white text-sm font-bold border-2 border-[var(--border)] hover:opacity-90 transition-opacity"
                >
                  {parties.find(p => p.id === partyId)?.name || 'Partido'}
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="square" strokeLinejoin="miter" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              {minConfidence > 0 && (
                <button
                  onClick={() => handleMinConfidenceChange(0)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--score-good)] text-white text-sm font-bold border-2 border-[var(--border)] hover:opacity-90 transition-opacity"
                >
                  {t('filters.minInfo')} {minConfidence}%
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="square" strokeLinejoin="miter" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              {onlyClean && (
                <button
                  onClick={() => handleOnlyCleanChange(false)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--score-excellent)] text-white text-sm font-bold border-2 border-[var(--border)] hover:opacity-90 transition-opacity"
                >
                  {t('filters.noRecords')}
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="square" strokeLinejoin="miter" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              <button
                onClick={handleResetFilters}
                className="text-sm font-bold text-[var(--muted-foreground)] hover:text-[var(--foreground)] underline transition-colors"
              >
                {t('filters.clearAll')}
              </button>
            </div>
          )}
        </div>

        <div className="flex gap-6">
          {/* Sidebar Filters - Desktop - NEO BRUTAL */}
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <Card className="sticky top-20 p-5">
              <h2 className="font-black text-[var(--foreground)] mb-4 flex items-center gap-2 uppercase tracking-wide">
                <svg className="w-4 h-4 text-[var(--muted-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="square" strokeLinejoin="miter" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                {t('filters.filters')}
              </h2>
              <RankingFilters
                cargo={cargo}
                distrito={distrito}
                partyId={partyId}
                parties={parties}
                minConfidence={minConfidence}
                onlyClean={onlyClean}
                onCargoChange={handleCargoChange}
                onDistritoChange={handleDistritoChange}
                onPartyChange={handlePartyChange}
                onMinConfidenceChange={handleMinConfidenceChange}
                onOnlyCleanChange={handleOnlyCleanChange}
                onReset={handleResetFilters}
              />
            </Card>
          </aside>

          {/* Mobile Filter Button - NEO BRUTAL - Adjusts position when CompareTray is visible */}
          <button
            onClick={() => setShowFilters(true)}
            className={cn(
              'lg:hidden fixed right-4 z-30',
              'bg-[var(--primary)] text-white',
              'px-4 py-3 min-h-[48px]',
              'border-3 border-[var(--border)]',
              'shadow-[var(--shadow-brutal)]',
              'flex items-center gap-2',
              'font-bold uppercase tracking-wide',
              'transition-all duration-200',
              'hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[var(--shadow-brutal-lg)]',
              // Move up when CompareTray is visible
              selectedForCompare.length > 0
                ? 'bottom-32 sm:bottom-24'
                : 'bottom-6'
            )}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="square" strokeLinejoin="miter" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            {t('filters.filters')}
          </button>

          {/* Mobile Filter Panel - NEO BRUTAL with safe-area support */}
          {showFilters && (
            <div className="lg:hidden fixed inset-0 z-50">
              {/* Backdrop */}
              <div
                className="absolute inset-0 bg-black/50"
                onClick={() => setShowFilters(false)}
              />
              {/* Panel */}
              <div className={cn(
                'absolute right-0 top-0 bottom-0',
                'w-[85vw] max-w-[320px]',
                'bg-[var(--card)]',
                'border-l-3 border-[var(--border)]',
                'shadow-[var(--shadow-brutal-xl)]',
                'flex flex-col'
              )}>
                {/* Header - Fixed */}
                <div className="flex items-center justify-between p-4 border-b-3 border-[var(--border)] bg-[var(--muted)]">
                  <h2 className="font-black text-[var(--foreground)] flex items-center gap-2 uppercase tracking-wide">
                    <svg className="w-4 h-4 text-[var(--muted-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="square" strokeLinejoin="miter" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    {t('filters.filters')}
                  </h2>
                  <button
                    onClick={() => setShowFilters(false)}
                    className={cn(
                      'w-10 h-10',
                      'flex items-center justify-center',
                      'text-[var(--foreground)]',
                      'border-2 border-[var(--border)]',
                      'bg-[var(--background)]',
                      'hover:bg-[var(--flag-red)] hover:text-white hover:border-[var(--flag-red)]',
                      'transition-all duration-100'
                    )}
                    aria-label={tCommon('close')}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="square" strokeLinejoin="miter" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
                  <RankingFilters
                    cargo={cargo}
                    distrito={distrito}
                    partyId={partyId}
                    parties={parties}
                    minConfidence={minConfidence}
                    onlyClean={onlyClean}
                    onCargoChange={(newCargo) => {
                      handleCargoChange(newCargo)
                      setShowFilters(false)
                    }}
                    onDistritoChange={handleDistritoChange}
                    onPartyChange={handlePartyChange}
                    onMinConfidenceChange={handleMinConfidenceChange}
                    onOnlyCleanChange={handleOnlyCleanChange}
                    onReset={handleResetFilters}
                  />
                </div>

                {/* Apply Button - Fixed at bottom */}
                <div className="p-4 border-t-3 border-[var(--border)] bg-[var(--muted)] pb-[calc(1rem+env(safe-area-inset-bottom))]">
                  <button
                    onClick={() => setShowFilters(false)}
                    className={cn(
                      'w-full min-h-[48px]',
                      'bg-[var(--primary)] text-white',
                      'border-3 border-[var(--border)]',
                      'shadow-[var(--shadow-brutal-sm)]',
                      'font-bold uppercase tracking-wide',
                      'hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[var(--shadow-brutal)]',
                      'transition-all duration-100'
                    )}
                  >
                    {t('view')} {candidates.length} {t('candidates')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1 min-w-0" aria-live="polite" aria-atomic="false">
            {error ? (
              <div role="alert" aria-live="assertive">
                <Card className="p-6 bg-[var(--flag-red-bg)]">
                  <div className="flex items-center gap-3 text-[var(--flag-red-text)] font-bold">
                    <svg aria-hidden="true" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="square" strokeLinejoin="miter" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="uppercase">{t('error')}: {error}</span>
                  </div>
                </Card>
              </div>
            ) : loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <CandidateCardSkeleton key={i} />
                ))}
              </div>
            ) : (
              <RankingList
                candidates={candidates}
                mode={mode}
                weights={currentWeights}
                selectedIds={selectedIds}
                onCompare={handleCompare}
                onView={handleViewCandidate}
                onShare={handleShareCandidate}
                viewMode={viewMode}
              />
            )}
          </div>
        </div>
        {/* Ad Banner - Footer */}
        <AdBanner slotId="internal-footer" className="py-4 mt-6" />
      </main>

      {/* Compare Tray */}
      <CompareTray
        candidates={selectedForCompare}
        onRemove={handleRemoveFromCompare}
        onCompare={handleGoToCompare}
        onClear={handleClearCompare}
      />

      {/* Back to Top Button */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className={cn(
            'fixed z-40',
            'w-12 h-12',
            'bg-[var(--foreground)] text-[var(--background)]',
            'border-3 border-[var(--border)]',
            'shadow-[var(--shadow-brutal)]',
            'flex items-center justify-center',
            'hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[var(--shadow-brutal-lg)]',
            'transition-all duration-100',
            // Position: left on mobile (filter button is right), left on desktop too
            'left-4 sm:left-6',
            // Move up when CompareTray is visible
            selectedForCompare.length > 0
              ? 'bottom-32 sm:bottom-24'
              : 'bottom-6'
          )}
          aria-label={t('backToTop')}
        >
          <svg aria-hidden="true" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="square" strokeLinejoin="miter" d="M5 15l7-7 7 7" />
          </svg>
        </button>
      )}
    </div>
  )
}
