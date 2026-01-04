'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Header } from '@/components/layout/Header'
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
  // Usar colores de texto de alto contraste
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
  label: string
  key: 'competence' | 'integrity' | 'transparency' | 'confidence' | 'total'
  max: number
}

const metrics: CompareMetric[] = [
  { label: 'PUNTAJE TOTAL', key: 'total', max: 100 },
  { label: 'COMPETENCIA', key: 'competence', max: 100 },
  { label: 'INTEGRIDAD', key: 'integrity', max: 100 },
  { label: 'TRANSPARENCIA', key: 'transparency', max: 100 },
  { label: 'CONFIANZA', key: 'confidence', max: 100 },
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
    <div className="min-h-screen bg-[var(--background)]">
      <Header currentPath="/comparar" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Title & Actions */}
        <div className="flex flex-col gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[var(--foreground)] uppercase tracking-tight">
              Comparar Candidatos
            </h1>
            <p className="text-base text-[var(--muted-foreground)] font-medium mt-2">
              {loading ? 'Cargando...' : `${candidates.length} candidato${candidates.length !== 1 ? 's' : ''} seleccionado${candidates.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline" onClick={handleShare} className="min-h-[48px] flex-1 sm:flex-initial">
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="square" strokeLinejoin="miter" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              <span className="font-bold">COMPARTIR</span>
            </Button>
            <Link href="/ranking" className="flex-1 sm:flex-initial">
              <Button variant="outline" className="w-full min-h-[48px]">
                <span className="font-bold">AGREGAR MÁS</span>
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
              <div className="text-[var(--flag-red-text)] font-bold">
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
                    <div className="w-20 h-20 bg-[var(--muted)] border-2 border-[var(--border)] mb-3" />
                    <div className="h-5 w-32 bg-[var(--muted)] border border-[var(--border)] mb-2" />
                    <div className="h-4 w-24 bg-[var(--muted)] border border-[var(--border)]" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : candidates.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-[var(--muted)] border-3 border-[var(--border)] flex items-center justify-center">
                <svg className="w-8 h-8 text-[var(--muted-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="square" strokeLinejoin="miter" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-black text-[var(--foreground)] mb-2 uppercase">
                No hay candidatos para comparar
              </h3>
              <p className="text-[var(--muted-foreground)] font-medium mb-6">
                Selecciona candidatos desde el ranking para compararlos
              </p>
              <Link href="/ranking">
                <Button variant="primary">
                  IR AL RANKING
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Candidate Cards */}
            <div className={cn(
              'grid gap-5 mb-8',
              candidates.length === 1 && 'grid-cols-1 max-w-md mx-auto',
              candidates.length === 2 && 'grid-cols-1 sm:grid-cols-2',
              candidates.length === 3 && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
              candidates.length >= 4 && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
            )}>
              {candidates.map((candidate) => {
                const score = getScoreByMode(candidate.scores, mode, currentWeights)
                const isBest = score === getBestScore('total') && candidates.length > 1

                return (
                  <Card
                    key={candidate.id}
                    className={cn(
                      'relative',
                      isBest && 'ring-4 ring-[var(--score-high)]'
                    )}
                  >
                    {isBest && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[var(--score-high)] text-white text-sm font-black uppercase px-3 py-1.5 border-2 border-[var(--border)]">
                        Mejor Score
                      </div>
                    )}
                    <CardContent className="p-6">
                      <div className="flex flex-col items-center text-center">
                        {/* Photo */}
                        <div className="w-24 h-24 sm:w-28 sm:h-28 border-3 border-[var(--border)] bg-[var(--muted)] overflow-hidden mb-4">
                          {candidate.photo_url ? (
                            <img
                              src={candidate.photo_url}
                              alt={candidate.full_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[var(--muted-foreground)]">
                              <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                              </svg>
                            </div>
                          )}
                        </div>

                        {/* Name & Party */}
                        <h3 className="font-black text-[var(--foreground)] text-base sm:text-lg uppercase tracking-tight leading-tight">
                          {candidate.full_name}
                        </h3>
                        {candidate.party && (
                          <Badge
                            className="mt-2"
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
                          'text-4xl sm:text-5xl font-black mt-4',
                          getScoreColor(score)
                        )}>
                          {score.toFixed(1)}
                        </div>
                        <div className="text-sm font-bold text-[var(--muted-foreground)] uppercase">
                          de 100
                        </div>

                        {/* Flags */}
                        {candidate.flags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3 justify-center">
                            {candidate.flags.map((flag) => (
                              <Badge
                                key={flag.id}
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
                          className="mt-4 inline-flex items-center gap-1 px-4 py-2 text-sm font-bold text-[var(--primary)] border-2 border-[var(--primary)] hover:bg-[var(--primary)] hover:text-white transition-colors uppercase min-h-[40px]"
                        >
                          Ver perfil
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Comparison Section */}
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-[var(--foreground)] uppercase tracking-tight mb-5">
                Comparación de Métricas
              </h2>

              {/* Vista móvil: Cards por métrica */}
              <div className="space-y-4 md:hidden">
                {metrics.map((metric) => {
                  const best = getBestScore(metric.key)

                  return (
                    <Card key={metric.key}>
                      <CardContent className="p-5">
                        <h3 className="text-base font-black text-[var(--foreground)] uppercase mb-4">
                          {metric.label}
                        </h3>
                        <div className="space-y-4">
                          {candidates.map((candidate) => {
                            const value = getMetricValue(candidate, metric.key)
                            const isBest = value === best && candidates.length > 1

                            return (
                              <div key={candidate.id} className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-sm text-[var(--foreground)] truncate flex-1">
                                    {candidate.full_name.split(' ').slice(0, 2).join(' ')}
                                  </span>
                                  <span className={cn(
                                    'font-black text-xl ml-3',
                                    isBest ? 'text-[var(--score-excellent-text)]' : 'text-[var(--foreground)]'
                                  )}>
                                    {value.toFixed(1)}
                                    {isBest && (
                                      <svg className="inline-block w-5 h-5 ml-1" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                      </svg>
                                    )}
                                  </span>
                                </div>
                                <div className="h-3 bg-[var(--muted)] border-2 border-[var(--border)] overflow-hidden">
                                  <div
                                    className={cn(
                                      'h-full transition-all',
                                      getBarColor(value)
                                    )}
                                    style={{ width: `${(value / metric.max) * 100}%` }}
                                  />
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              {/* Vista desktop: Tabla */}
              <Card className="hidden md:block">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b-3 border-[var(--border)]">
                          <th className="text-left p-5 font-black text-[var(--muted-foreground)] uppercase tracking-wide text-sm">
                            Métrica
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
                        {metrics.map((metric) => {
                          const best = getBestScore(metric.key)

                          return (
                            <tr
                              key={metric.key}
                              className="border-b-2 border-[var(--border)] last:border-0"
                            >
                              <td className="p-5 font-bold text-[var(--foreground)]">
                                {metric.label}
                              </td>
                              {candidates.map((candidate) => {
                                const value = getMetricValue(candidate, metric.key)
                                const isBest = value === best && candidates.length > 1

                                return (
                                  <td key={candidate.id} className="p-5">
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
            </div>

            {/* Legend */}
            <div className="mt-6 text-center text-sm text-[var(--muted-foreground)] font-medium">
              <p>
                Los scores varían según el modo seleccionado.{' '}
                <Link href="/metodologia" className="text-[var(--primary)] font-bold hover:underline uppercase">
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
