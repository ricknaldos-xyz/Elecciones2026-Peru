'use client'

import { useState, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { Header } from '@/components/layout/Header'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { PresetSelector } from '@/components/ranking/PresetSelector'
import { useCandidatesByIds } from '@/hooks/useCandidates'
import { useSuccessToast } from '@/components/ui/Toast'
import { PRESETS } from '@/lib/constants'
import { Link, useRouter } from '@/i18n/routing'
import type { CandidateWithScores, PresetType, Weights } from '@/types/database'

// Popular candidates to suggest when empty or can add more
const SUGGESTED_CANDIDATES = [
  { id: 'keiko-fujimori', name: 'Keiko Fujimori', party: 'Fuerza Popular' },
  { id: 'antauro-humala', name: 'Antauro Humala', party: 'A.N.T.A.U.R.O.' },
  { id: 'cesar-acuna', name: 'Cesar Acuna', party: 'APP' },
  { id: 'jose-luna', name: 'Jose Luna', party: 'Podemos Peru' },
]

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
  labelKey: 'total' | 'competence' | 'integrity' | 'transparency' | 'confidence'
  key: 'competence' | 'integrity' | 'transparency' | 'confidence' | 'total'
  max: number
}

const metrics: CompareMetric[] = [
  { labelKey: 'total', key: 'total', max: 100 },
  { labelKey: 'competence', key: 'competence', max: 100 },
  { labelKey: 'integrity', key: 'integrity', max: 100 },
  { labelKey: 'transparency', key: 'transparency', max: 100 },
  { labelKey: 'confidence', key: 'confidence', max: 100 },
]

export function CompareContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const t = useTranslations('compare')
  const tCommon = useTranslations('common')
  const showSuccess = useSuccessToast()

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

  // Remove a candidate from comparison
  const removeCandidate = (idToRemove: string) => {
    const newIds = candidateIds.filter(id => id !== idToRemove)
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
        title: t('shareTitle'),
        text: t('shareText', { names: candidates.map(c => c.full_name).join(' vs ') }),
        url,
      })
    } else {
      navigator.clipboard.writeText(url)
      showSuccess('Link copiado', 'El enlace está en tu portapapeles')
    }
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
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleShare} className="min-h-[40px]">
                <svg className="w-4 h-4 sm:mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="square" strokeLinejoin="miter" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                <span className="hidden sm:inline font-bold">{t('share').toUpperCase()}</span>
              </Button>
              {candidates.length < 4 && (
                <Link href="/ranking">
                  <Button variant="primary" size="sm" className="min-h-[40px]">
                    <svg className="w-4 h-4 sm:mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="square" d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="hidden sm:inline font-bold">{t('addMore').toUpperCase()}</span>
                  </Button>
                </Link>
              )}
            </div>
          )}
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
            <CardContent className="py-8 sm:py-12">
              <div className="text-center mb-8">
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

              {/* Suggested candidates */}
              <div className="border-t-2 border-[var(--border)] pt-6">
                <p className="text-xs font-bold text-[var(--muted-foreground)] uppercase mb-4 text-center">
                  {t('emptyState.suggestedTitle')}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-w-2xl mx-auto">
                  {SUGGESTED_CANDIDATES.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => addCandidate(c.id)}
                      className={cn(
                        'p-3 text-left',
                        'bg-[var(--muted)] border-2 border-[var(--border)]',
                        'hover:bg-[var(--primary)] hover:text-white hover:border-[var(--primary)]',
                        'transition-all duration-100'
                      )}
                    >
                      <div className="text-xs font-bold uppercase truncate">{c.name}</div>
                      <div className="text-[10px] font-medium opacity-70 truncate">{c.party}</div>
                    </button>
                  ))}
                </div>
                <div className="text-center mt-4">
                  <Link href="/ranking">
                    <Button variant="primary" size="sm">
                      {t('emptyState.viewAllRanking')}
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Candidate Cards */}
            <div className={cn(
              'grid gap-4 mb-6',
              candidates.length === 1 && 'grid-cols-1 max-w-sm mx-auto',
              candidates.length === 2 && 'grid-cols-1 sm:grid-cols-2',
              candidates.length === 3 && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
              candidates.length >= 4 && 'grid-cols-2 lg:grid-cols-4',
            )}>
              {candidates.map((candidate) => {
                const score = getScoreByMode(candidate.scores, mode, currentWeights)
                const isBest = score === getBestScore('total') && candidates.length > 1

                return (
                  <Card
                    key={candidate.id}
                    className={cn(
                      'relative',
                      isBest && 'ring-3 ring-[var(--score-excellent)]'
                    )}
                  >
                    {/* Remove button */}
                    <button
                      onClick={() => removeCandidate(candidate.id)}
                      className={cn(
                        'absolute top-2 right-2 z-10',
                        'w-7 h-7 flex items-center justify-center',
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
                      <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-[var(--score-excellent)] text-white text-[10px] sm:text-xs font-black uppercase px-2 py-1 border-2 border-[var(--border)]">
                        {t('best')}
                      </div>
                    )}
                    <CardContent className="p-4 sm:p-5">
                      <div className="flex flex-col items-center text-center">
                        {/* Photo */}
                        <div className="w-16 h-16 sm:w-20 sm:h-20 border-3 border-[var(--border)] bg-[var(--muted)] overflow-hidden mb-3">
                          {candidate.photo_url ? (
                            <img
                              src={candidate.photo_url}
                              alt={candidate.full_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[var(--muted-foreground)]">
                              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                              </svg>
                            </div>
                          )}
                        </div>

                        {/* Name & Party */}
                        <h3 className="font-black text-[var(--foreground)] text-sm sm:text-base uppercase tracking-tight leading-tight">
                          {candidate.full_name}
                        </h3>
                        {candidate.party && (
                          <Badge
                            size="sm"
                            className="mt-1.5"
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
                          'text-3xl sm:text-4xl font-black mt-3',
                          getScoreColor(score)
                        )}>
                          {score.toFixed(0)}
                        </div>
                        <div className="text-[10px] sm:text-xs font-bold text-[var(--muted-foreground)] uppercase">
                          {t('outOf100')}
                        </div>

                        {/* Flags with descriptions */}
                        {candidate.flags.length > 0 && (
                          <div className="w-full mt-3 pt-3 border-t-2 border-[var(--border)]">
                            <div className="space-y-1">
                              {candidate.flags.slice(0, 2).map((flag) => (
                                <div
                                  key={flag.id}
                                  className={cn(
                                    'text-[10px] sm:text-xs font-bold px-2 py-1 truncate',
                                    flag.severity === 'RED'
                                      ? 'bg-[var(--flag-red)]/10 text-[var(--flag-red-text)]'
                                      : 'bg-[var(--flag-amber)]/10 text-[var(--flag-amber-text)]'
                                  )}
                                >
                                  {flag.title || flag.type}
                                </div>
                              ))}
                              {candidate.flags.length > 2 && (
                                <div className="text-[10px] font-bold text-[var(--muted-foreground)]">
                                  {t('moreFlags', { count: candidate.flags.length - 2 })}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* View Profile Link */}
                        <Link
                          href={`/candidato/${candidate.slug}`}
                          className="mt-3 inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-[var(--primary)] border-2 border-[var(--primary)] hover:bg-[var(--primary)] hover:text-white transition-colors uppercase"
                        >
                          {t('viewProfile')}
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}

              {/* Add more card when space available */}
              {candidates.length < 4 && candidates.length > 0 && (
                <Link
                  href="/ranking"
                  className={cn(
                    'border-3 border-dashed border-[var(--border)]',
                    'flex flex-col items-center justify-center p-6',
                    'text-[var(--muted-foreground)]',
                    'hover:border-[var(--primary)] hover:text-[var(--primary)]',
                    'transition-colors min-h-[200px]'
                  )}
                >
                  <svg className="w-10 h-10 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="square" d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="text-xs font-bold uppercase">{t('addCandidate')}</span>
                </Link>
              )}
            </div>

            {/* Single candidate prompt */}
            {candidates.length === 1 && (
              <Card className="mb-6 bg-[var(--muted)]">
                <CardContent className="py-4 px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <p className="text-sm font-medium text-[var(--foreground)]">
                    {t('addAtLeastOne')}
                  </p>
                  <Link href="/ranking">
                    <Button variant="primary" size="sm">
                      {t('addAnother')}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Comparison Section - Only show with 2+ candidates */}
            {candidates.length >= 2 && (
            <div>
              <h2 className="text-lg sm:text-xl font-black text-[var(--foreground)] uppercase tracking-tight mb-4">
                {t('metricsComparison')}
              </h2>

              {/* Vista movil: Cards por metrica */}
              <div className="space-y-4 md:hidden">
                {metrics.map((metric) => {
                  const best = getBestScore(metric.key)

                  return (
                    <Card key={metric.key}>
                      <CardContent className="p-5">
                        <h3 className="text-base font-black text-[var(--foreground)] uppercase mb-4">
                          {t(`metrics.${metric.labelKey}`)}
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
                        {metrics.map((metric) => {
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
          </>
        )}
      </main>
    </div>
  )
}
