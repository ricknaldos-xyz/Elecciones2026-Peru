'use client'

import { useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import { Tabs, TabList, Tab, TabPanel } from '@/components/ui/Tabs'
import { ScorePill } from '@/components/candidate/ScorePill'
import { SubScoreBar } from '@/components/candidate/SubScoreBar'
import { FlagChips } from '@/components/candidate/FlagChip'
import { ConfidenceBadge } from '@/components/candidate/ConfidenceBadge'
import { PRESETS } from '@/lib/constants'
import type { CandidateWithScores, PresetType, ScoreBreakdown } from '@/types/database'

interface CandidateProfileContentProps {
  candidate: CandidateWithScores
  breakdown: ScoreBreakdown | null
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
  RED: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', border: 'border-red-200 dark:border-red-800' },
  AMBER: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800' },
  GRAY: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-300', border: 'border-gray-200 dark:border-gray-700' },
}

export function CandidateProfileContent({ candidate, breakdown }: CandidateProfileContentProps) {
  const [mode, setMode] = useState<PresetType>('balanced')

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

  const handleShare = () => {
    const url = window.location.href
    if (navigator.share) {
      navigator.share({
        title: `${candidate.full_name} - Ranking Electoral 2026`,
        text: `Score: ${getScore().toFixed(1)}/100`,
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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
            </div>
            <Button variant="outline" size="sm" onClick={handleShare}>
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Compartir
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-6">
            {/* Photo */}
            <div className="flex-shrink-0">
              <div className="w-32 h-32 rounded-xl bg-gray-200 dark:bg-gray-700 overflow-hidden mx-auto sm:mx-0">
                {candidate.photo_url ? (
                  <img
                    src={candidate.photo_url}
                    alt={candidate.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
                    <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                  </div>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {candidate.full_name}
              </h1>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-4">
                <Badge variant="default">
                  {cargoLabels[candidate.cargo] || candidate.cargo}
                </Badge>
                {candidate.party && (
                  <Badge
                    style={{
                      backgroundColor: candidate.party.color || '#6B7280',
                      color: '#fff',
                    }}
                  >
                    {candidate.party.name}
                  </Badge>
                )}
                {candidate.district && (
                  <Badge variant="outline">{candidate.district.name}</Badge>
                )}
              </div>
              <ConfidenceBadge value={candidate.scores.confidence} showLabel />
            </div>

            {/* Score */}
            <div className="flex-shrink-0 flex flex-col items-center justify-center">
              <ScorePill
                score={getScore()}
                mode={mode}
                weights={PRESETS[mode as keyof typeof PRESETS]}
                size="lg"
              />
              <div className="flex gap-1 mt-3">
                {(['balanced', 'merit', 'integrity'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={cn(
                      'px-2 py-1 text-xs rounded transition-colors',
                      mode === m
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                    )}
                  >
                    {m === 'balanced' ? 'Bal' : m === 'merit' ? 'Mér' : 'Int'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Flags Alert */}
        {candidate.flags.length > 0 && (
          <div className="mb-6">
            <div className={cn(
              'rounded-xl border p-4',
              candidate.flags.some(f => f.severity === 'RED')
                ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
            )}>
              <div className="flex items-start gap-3">
                <div className={cn(
                  'p-2 rounded-lg',
                  candidate.flags.some(f => f.severity === 'RED')
                    ? 'bg-red-100 dark:bg-red-900/30'
                    : 'bg-amber-100 dark:bg-amber-900/30'
                )}>
                  <svg className={cn(
                    'w-5 h-5',
                    candidate.flags.some(f => f.severity === 'RED')
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-amber-600 dark:text-amber-400'
                  )} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className={cn(
                    'font-semibold mb-1',
                    candidate.flags.some(f => f.severity === 'RED')
                      ? 'text-red-800 dark:text-red-200'
                      : 'text-amber-800 dark:text-amber-200'
                  )}>
                    {candidate.flags.length} Alerta{candidate.flags.length > 1 ? 's' : ''} Registrada{candidate.flags.length > 1 ? 's' : ''}
                  </h3>
                  <p className={cn(
                    'text-sm',
                    candidate.flags.some(f => f.severity === 'RED')
                      ? 'text-red-700 dark:text-red-300'
                      : 'text-amber-700 dark:text-amber-300'
                  )}>
                    Este candidato tiene antecedentes verificados que afectan su puntaje de integridad.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Scores Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Puntajes Detallados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <SubScoreBar type="competence" value={candidate.scores.competence} />
            <SubScoreBar type="integrity" value={candidate.scores.integrity} />
            <SubScoreBar type="transparency" value={candidate.scores.transparency} />
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultTab="resumen">
          <TabList className="mb-4">
            <Tab value="resumen">Resumen</Tab>
            <Tab value="evidencia">Evidencia</Tab>
            <Tab value="breakdown">Desglose</Tab>
          </TabList>

          <TabPanel value="resumen">
            <Card>
              <CardHeader>
                <CardTitle>Resumen del Candidato</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Score Summary */}
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                      Puntajes por Modo
                    </h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {candidate.scores.score_balanced.toFixed(1)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Balanced</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {candidate.scores.score_merit.toFixed(1)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Merit</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {candidate.scores.score_integrity.toFixed(1)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Integrity</div>
                      </div>
                    </div>
                  </div>

                  {/* Party Info */}
                  {candidate.party && (
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                        Partido Político
                      </h4>
                      <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: candidate.party.color || '#6B7280' }}
                        />
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {candidate.party.name}
                          </div>
                          {candidate.party.short_name && (
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {candidate.party.short_name}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Flags Summary */}
                  {candidate.flags.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                        Alertas
                      </h4>
                      <FlagChips flags={candidate.flags} maxVisible={10} />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabPanel>

          <TabPanel value="evidencia">
            <Card>
              <CardHeader>
                <CardTitle>Evidencia y Fuentes</CardTitle>
              </CardHeader>
              <CardContent>
                {candidate.flags.length > 0 ? (
                  <div className="space-y-4">
                    {candidate.flags.map((flag) => {
                      const colors = severityColors[flag.severity] || severityColors.GRAY
                      return (
                        <div
                          key={flag.id}
                          className={cn(
                            'p-4 rounded-lg border',
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
                                <span className={cn('text-sm font-medium', colors.text)}>
                                  {flagTypeLabels[flag.type] || flag.type}
                                </span>
                              </div>
                              <h4 className={cn('font-semibold mb-1', colors.text)}>
                                {flag.title}
                              </h4>
                              {flag.description && (
                                <p className={cn('text-sm mb-2', colors.text)}>
                                  {flag.description}
                                </p>
                              )}
                              <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
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
                                className="flex-shrink-0 p-2 text-blue-600 hover:text-blue-700 dark:text-blue-400"
                              >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              </a>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-4 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                      Sin alertas registradas
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No se encontraron antecedentes negativos verificados para este candidato.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabPanel>

          <TabPanel value="breakdown">
            <Card>
              <CardHeader>
                <CardTitle>Desglose del Puntaje</CardTitle>
              </CardHeader>
              <CardContent>
                {breakdown ? (
                  <div className="space-y-6">
                    {/* Competence Breakdown */}
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500" />
                        Competencia: {candidate.scores.competence.toFixed(1)}/100
                      </h4>
                      <div className="ml-5 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex justify-between">
                          <span>Nivel educativo (máx. 22)</span>
                          <span className="font-medium text-gray-900 dark:text-white">{breakdown.education.level.toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Profundidad educativa (máx. 8)</span>
                          <span className="font-medium text-gray-900 dark:text-white">{breakdown.education.depth.toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Experiencia total (máx. 25)</span>
                          <span className="font-medium text-gray-900 dark:text-white">{breakdown.experience.total.toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Experiencia relevante (máx. 25)</span>
                          <span className="font-medium text-gray-900 dark:text-white">{breakdown.experience.relevant.toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Liderazgo - Seniority (máx. 14)</span>
                          <span className="font-medium text-gray-900 dark:text-white">{breakdown.leadership.seniority.toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Liderazgo - Estabilidad (máx. 6)</span>
                          <span className="font-medium text-gray-900 dark:text-white">{breakdown.leadership.stability.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Integrity Breakdown */}
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                        Integridad: {candidate.scores.integrity.toFixed(1)}/100
                      </h4>
                      <div className="ml-5 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex justify-between">
                          <span>Base</span>
                          <span className="font-medium text-gray-900 dark:text-white">{breakdown.integrity.base.toFixed(0)}</span>
                        </div>
                        {breakdown.integrity.penal_penalty > 0 && (
                          <div className="flex justify-between text-red-600 dark:text-red-400">
                            <span>Sentencias penales</span>
                            <span className="font-medium">-{breakdown.integrity.penal_penalty.toFixed(0)}</span>
                          </div>
                        )}
                        {breakdown.integrity.civil_penalties.map((penalty, idx) => (
                          <div key={idx} className="flex justify-between text-amber-600 dark:text-amber-400">
                            <span>Sentencia civil ({penalty.type})</span>
                            <span className="font-medium">-{penalty.penalty.toFixed(0)}</span>
                          </div>
                        ))}
                        {breakdown.integrity.resignation_penalty > 0 && (
                          <div className="flex justify-between text-amber-600 dark:text-amber-400">
                            <span>Renuncias a partidos</span>
                            <span className="font-medium">-{breakdown.integrity.resignation_penalty.toFixed(0)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Transparency Breakdown */}
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-purple-500" />
                        Transparencia: {candidate.scores.transparency.toFixed(1)}/100
                      </h4>
                      <div className="ml-5 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex justify-between">
                          <span>Completitud (máx. 35)</span>
                          <span className="font-medium text-gray-900 dark:text-white">{breakdown.transparency.completeness.toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Consistencia (máx. 35)</span>
                          <span className="font-medium text-gray-900 dark:text-white">{breakdown.transparency.consistency.toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Calidad Patrimonial (máx. 30)</span>
                          <span className="font-medium text-gray-900 dark:text-white">{breakdown.transparency.assets_quality.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Confidence Breakdown */}
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-gray-500" />
                        Confianza de datos: {candidate.scores.confidence.toFixed(1)}/100
                      </h4>
                      <div className="ml-5 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex justify-between">
                          <span>Verificación (máx. 50)</span>
                          <span className="font-medium text-gray-900 dark:text-white">{breakdown.confidence.verification.toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Cobertura (máx. 50)</span>
                          <span className="font-medium text-gray-900 dark:text-white">{breakdown.confidence.coverage.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <p>Datos de desglose no disponibles para este candidato.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabPanel>
        </Tabs>

        {/* Action Bar */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/ranking">
            <Button variant="outline" size="lg">
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Volver al Ranking
            </Button>
          </Link>
          <Link href={`/comparar?ids=${candidate.id}`}>
            <Button variant="primary" size="lg">
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Comparar con otros
            </Button>
          </Link>
        </div>
      </main>
    </div>
  )
}
