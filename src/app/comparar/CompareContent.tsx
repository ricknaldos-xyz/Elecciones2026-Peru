'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { PresetSelector } from '@/components/ranking/PresetSelector'
import { useCandidatesByIds } from '@/hooks/useCandidates'
import { PRESETS } from '@/lib/constants'
import type { CandidateWithScores, PresetType, Weights } from '@/types/database'

function getScoreByMode(
  scores: CandidateWithScores['scores'],
  mode: PresetType,
  weights?: Weights
): number {
  if (mode === 'custom' && weights) {
    return (
      weights.wC * scores.competence +
      weights.wI * scores.integrity +
      weights.wT * scores.transparency
    )
  }
  switch (mode) {
    case 'merit':
      return scores.score_merit
    case 'integrity':
      return scores.score_integrity
    default:
      return scores.score_balanced
  }
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600 dark:text-green-400'
  if (score >= 60) return 'text-blue-600 dark:text-blue-400'
  if (score >= 40) return 'text-yellow-600 dark:text-yellow-400'
  return 'text-red-600 dark:text-red-400'
}

function getBarColor(score: number): string {
  if (score >= 80) return 'bg-green-500'
  if (score >= 60) return 'bg-blue-500'
  if (score >= 40) return 'bg-yellow-500'
  return 'bg-red-500'
}

interface CompareMetric {
  label: string
  key: 'competence' | 'integrity' | 'transparency' | 'confidence' | 'total'
  max: number
}

const metrics: CompareMetric[] = [
  { label: 'Puntaje Total', key: 'total', max: 100 },
  { label: 'Competencia', key: 'competence', max: 100 },
  { label: 'Integridad', key: 'integrity', max: 100 },
  { label: 'Transparencia', key: 'transparency', max: 100 },
  { label: 'Confianza de Datos', key: 'confidence', max: 100 },
]

export function CompareContent() {
  const searchParams = useSearchParams()

  const [mode, setMode] = useState<PresetType>(() => {
    const param = searchParams.get('mode')
    if (param && ['balanced', 'merit', 'integrity', 'custom'].includes(param)) {
      return param as PresetType
    }
    return 'balanced'
  })

  const [customWeights, setCustomWeights] = useState<Weights>(PRESETS.balanced)

  const candidateIds = useMemo(() => {
    const idsParam = searchParams.get('ids')
    if (!idsParam) return []
    return idsParam.split(',').filter(Boolean)
  }, [searchParams])

  const { candidates, loading, error } = useCandidatesByIds(candidateIds)

  const currentWeights = mode === 'custom' ? customWeights : PRESETS[mode]

  const getMetricValue = (candidate: CandidateWithScores, key: CompareMetric['key']): number => {
    if (key === 'total') {
      return getScoreByMode(candidate.scores, mode, currentWeights)
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
        title: 'Comparación de Candidatos - Ranking Electoral 2026',
        text: `Comparando ${candidates.map(c => c.full_name).join(' vs ')}`,
        url,
      })
    } else {
      navigator.clipboard.writeText(url)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/ranking" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <Link href="/" className="text-xl font-bold text-gray-900 dark:text-white">
                Ranking Electoral
              </Link>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Perú 2026
              </span>
            </div>
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/ranking" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                Ranking
              </Link>
              <Link href="/comparar" className="text-sm font-medium text-blue-600 dark:text-blue-400">
                Comparar
              </Link>
              <Link href="/metodologia" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                Metodología
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Title & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Comparar Candidatos
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {loading ? 'Cargando...' : `${candidates.length} candidato${candidates.length !== 1 ? 's' : ''} seleccionado${candidates.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleShare}>
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Compartir
            </Button>
            <Link href="/ranking">
              <Button variant="outline" size="sm">
                Agregar más
              </Button>
            </Link>
          </div>
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
            }}
          />
        </div>

        {error ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="text-red-600 dark:text-red-400">
                Error: {error}
              </div>
            </CardContent>
          </Card>
        ) : loading ? (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="flex flex-col items-center">
                    <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-full mb-3" />
                    <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                    <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : candidates.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No hay candidatos para comparar
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Selecciona candidatos desde el ranking para compararlos
              </p>
              <Link href="/ranking">
                <Button variant="primary">
                  Ir al Ranking
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Candidate Cards */}
            <div className={cn(
              'grid gap-4 mb-8',
              candidates.length === 1 && 'grid-cols-1 max-w-md mx-auto',
              candidates.length === 2 && 'grid-cols-1 md:grid-cols-2',
              candidates.length === 3 && 'grid-cols-1 md:grid-cols-3',
              candidates.length >= 4 && 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
            )}>
              {candidates.map((candidate) => {
                const score = getScoreByMode(candidate.scores, mode, currentWeights)
                const isBest = score === getBestScore('total') && candidates.length > 1

                return (
                  <Card
                    key={candidate.id}
                    className={cn(
                      'relative',
                      isBest && 'ring-2 ring-green-500'
                    )}
                  >
                    {isBest && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500 text-white text-xs font-medium px-2 py-1 rounded-full">
                        Mejor Score
                      </div>
                    )}
                    <CardContent className="p-4">
                      <div className="flex flex-col items-center text-center">
                        {/* Photo */}
                        <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden mb-3">
                          {candidate.photo_url ? (
                            <img
                              src={candidate.photo_url}
                              alt={candidate.full_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                              </svg>
                            </div>
                          )}
                        </div>

                        {/* Name & Party */}
                        <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                          {candidate.full_name}
                        </h3>
                        {candidate.party && (
                          <Badge
                            size="sm"
                            className="mt-1"
                            style={{
                              backgroundColor: candidate.party.color || '#6B7280',
                              color: '#fff',
                            }}
                          >
                            {candidate.party.short_name || candidate.party.name}
                          </Badge>
                        )}

                        {/* Score */}
                        <div className={cn(
                          'text-3xl font-bold mt-3',
                          getScoreColor(score)
                        )}>
                          {score.toFixed(1)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          de 100
                        </div>

                        {/* Flags */}
                        {candidate.flags.length > 0 && (
                          <div className="flex gap-1 mt-2">
                            {candidate.flags.map((flag) => (
                              <Badge
                                key={flag.id}
                                size="sm"
                                variant={flag.severity === 'RED' ? 'destructive' : flag.severity === 'AMBER' ? 'warning' : 'default'}
                              >
                                {flag.severity}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {/* View Profile Link */}
                        <Link
                          href={`/candidato/${candidate.slug}`}
                          className="mt-3 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          Ver perfil completo
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Comparison Table */}
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-800">
                        <th className="text-left p-4 font-medium text-gray-500 dark:text-gray-400">
                          Métrica
                        </th>
                        {candidates.map((candidate) => (
                          <th
                            key={candidate.id}
                            className="text-center p-4 font-medium text-gray-900 dark:text-white"
                          >
                            {candidate.full_name.split(' ').slice(0, 2).join(' ')}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.map((metric) => {
                        const best = getBestScore(metric.key)

                        return (
                          <tr
                            key={metric.key}
                            className="border-b border-gray-100 dark:border-gray-800 last:border-0"
                          >
                            <td className="p-4 font-medium text-gray-700 dark:text-gray-300">
                              {metric.label}
                            </td>
                            {candidates.map((candidate) => {
                              const value = getMetricValue(candidate, metric.key)
                              const isBest = value === best && candidates.length > 1

                              return (
                                <td key={candidate.id} className="p-4">
                                  <div className="flex flex-col items-center gap-2">
                                    <div className={cn(
                                      'font-bold text-lg',
                                      isBest ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'
                                    )}>
                                      {value.toFixed(1)}
                                      {isBest && (
                                        <svg className="inline-block w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                      )}
                                    </div>
                                    <div className="w-full max-w-[100px] h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                      <div
                                        className={cn(
                                          'h-full rounded-full transition-all',
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
            <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
              <p>
                Los scores varían según el modo seleccionado.{' '}
                <Link href="/metodologia" className="text-blue-600 dark:text-blue-400 hover:underline">
                  Conoce la metodología
                </Link>
              </p>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
