'use client'

import { useState, useMemo, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { PresetSelector } from '@/components/ranking/PresetSelector'
import { RankingFilters } from '@/components/ranking/RankingFilters'
import { RankingList } from '@/components/ranking/RankingList'
import { CompareTray } from '@/components/compare/CompareTray'
import { useCandidates } from '@/hooks/useCandidates'
import { PRESETS, WEIGHT_LIMITS } from '@/lib/constants'
import type { PresetType, CargoType, Weights, CandidateWithScores } from '@/types/database'

const cargoLabels: Record<CargoType, string> = {
  presidente: 'Presidente',
  vicepresidente: 'Vicepresidente',
  senador: 'Senador',
  diputado: 'Diputado',
  parlamento_andino: 'Parlamento Andino',
}

function sortCandidatesByScore(
  candidates: CandidateWithScores[],
  mode: 'balanced' | 'merit' | 'integrity'
): CandidateWithScores[] {
  const scoreKey = mode === 'balanced'
    ? 'score_balanced'
    : mode === 'merit'
    ? 'score_merit'
    : 'score_integrity'

  return [...candidates].sort((a, b) => b.scores[scoreKey] - a.scores[scoreKey])
}

export function RankingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Estado del modo/preset
  const [mode, setMode] = useState<PresetType>(() => {
    const param = searchParams.get('mode')
    if (param && (param === 'balanced' || param === 'merit' || param === 'integrity' || param === 'custom')) {
      return param
    }
    return 'balanced'
  })

  // Estado de pesos custom
  const [customWeights, setCustomWeights] = useState<Weights>(() => {
    const wC = searchParams.get('wC')
    const wI = searchParams.get('wI')
    const wT = searchParams.get('wT')
    if (wC && wI && wT) {
      return {
        wC: Math.max(WEIGHT_LIMITS.wC.min, Math.min(WEIGHT_LIMITS.wC.max, parseFloat(wC))),
        wI: Math.max(WEIGHT_LIMITS.wI.min, Math.min(WEIGHT_LIMITS.wI.max, parseFloat(wI))),
        wT: Math.max(WEIGHT_LIMITS.wT.min, Math.min(WEIGHT_LIMITS.wT.max, parseFloat(wT))),
      }
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

  // Ordenar candidatos por modo
  const candidates = useMemo(() => {
    const sortMode = mode === 'custom' ? 'balanced' : mode
    return sortCandidatesByScore(rawCandidates, sortMode)
  }, [rawCandidates, mode])

  // Pesos actuales
  const currentWeights = useMemo(() => {
    return mode === 'custom' ? customWeights : PRESETS[mode]
  }, [mode, customWeights])

  // Handlers
  const handleCargoChange = useCallback((newCargo: CargoType) => {
    setCargo(newCargo)
    setDistrito(undefined)
    setSelectedForCompare([])
    updateURL({ cargo: newCargo, distrito: '' })
  }, [updateURL])

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
        return prev.filter((c) => c.id !== id)
      }
      if (prev.length >= 4) {
        return prev
      }
      const candidate = candidates.find((c) => c.id === id)
      if (candidate) {
        return [...prev, candidate]
      }
      return prev
    })
  }, [candidates])

  const handleRemoveFromCompare = useCallback((id: string) => {
    setSelectedForCompare((prev) => prev.filter((c) => c.id !== id))
  }, [])

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

  const selectedIds = useMemo(() => selectedForCompare.map((c) => c.id), [selectedForCompare])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <a href="/" className="text-xl font-bold text-gray-900 dark:text-white">
                Ranking Electoral
              </a>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Perú 2026
              </span>
            </div>
            <nav className="hidden md:flex items-center gap-6">
              <a href="/ranking" className="text-sm font-medium text-blue-600 dark:text-blue-400">
                Ranking
              </a>
              <a href="/comparar" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                Comparar
              </a>
              <a href="/metodologia" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                Metodología
              </a>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Ranking de Candidatos - {cargoLabels[cargo]}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {loading ? 'Cargando...' : `${candidates.length} candidatos encontrados`}
          </p>
        </div>

        {/* Preset Selector */}
        <div className="mb-6">
          <PresetSelector
            value={mode}
            weights={customWeights}
            onChange={(newMode, newWeights) => {
              setMode(newMode)
              if (newWeights) {
                setCustomWeights(newWeights)
              }
              updateURL({ mode: newMode })
            }}
          />
        </div>

        <div className="flex gap-8">
          {/* Sidebar Filters - Desktop */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-24 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-4">
                Filtros
              </h2>
              <RankingFilters
                cargo={cargo}
                distrito={distrito}
                partyId={partyId}
                minConfidence={minConfidence}
                onlyClean={onlyClean}
                onCargoChange={handleCargoChange}
                onDistritoChange={handleDistritoChange}
                onPartyChange={handlePartyChange}
                onMinConfidenceChange={handleMinConfidenceChange}
                onOnlyCleanChange={handleOnlyCleanChange}
                onReset={handleResetFilters}
              />
            </div>
          </aside>

          {/* Mobile Filter Button */}
          <button
            onClick={() => setShowFilters(true)}
            className="lg:hidden fixed bottom-20 right-4 z-30 bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filtros
          </button>

          {/* Mobile Filter Panel */}
          {showFilters && (
            <div className="lg:hidden fixed inset-0 z-50 bg-black/50">
              <div className="absolute right-0 top-0 bottom-0 w-80 bg-white dark:bg-gray-900 p-4 overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-gray-900 dark:text-white">
                    Filtros
                  </h2>
                  <button
                    onClick={() => setShowFilters(false)}
                    className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <RankingFilters
                  cargo={cargo}
                  distrito={distrito}
                  partyId={partyId}
                  minConfidence={minConfidence}
                  onlyClean={onlyClean}
                  onCargoChange={handleCargoChange}
                  onDistritoChange={handleDistritoChange}
                  onPartyChange={handlePartyChange}
                  onMinConfidenceChange={handleMinConfidenceChange}
                  onOnlyCleanChange={handleOnlyCleanChange}
                  onReset={handleResetFilters}
                />
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {error ? (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg">
                Error: {error}
              </div>
            ) : loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 animate-pulse">
                    <div className="flex gap-4">
                      <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full" />
                      <div className="flex-1">
                        <div className="h-5 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                        <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
                      </div>
                      <div className="w-20 h-12 bg-gray-200 dark:bg-gray-700 rounded" />
                    </div>
                  </div>
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
              />
            )}
          </div>
        </div>
      </main>

      {/* Compare Tray */}
      <CompareTray
        candidates={selectedForCompare}
        onRemove={handleRemoveFromCompare}
        onCompare={handleGoToCompare}
        onClear={handleClearCompare}
      />
    </div>
  )
}
