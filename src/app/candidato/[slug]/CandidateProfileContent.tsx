'use client'

import { useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Header } from '@/components/layout/Header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Tabs, TabList, Tab, TabPanel } from '@/components/ui/Tabs'
import { ScorePill } from '@/components/candidate/ScorePill'
import { SubScoreBar, SubScoreStat } from '@/components/candidate/SubScoreBar'
import { FlagChips } from '@/components/candidate/FlagChip'
import { ConfidenceBadge } from '@/components/candidate/ConfidenceBadge'
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

export function CandidateProfileContent({ candidate, breakdown, details }: CandidateProfileContentProps) {
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
    <div className="min-h-screen bg-[var(--background)]">
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Hero Section */}
        <Card className="mb-6 overflow-hidden">
          <div className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row gap-6">
              {/* Photo */}
              <div className="flex-shrink-0">
                <div className="w-28 h-28 sm:w-32 sm:h-32 border-3 border-[var(--border)] bg-[var(--muted)] overflow-hidden mx-auto sm:mx-0">
                  {candidate.photo_url ? (
                    <img
                      src={candidate.photo_url}
                      alt={candidate.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[var(--muted-foreground)] text-3xl font-black uppercase">
                      {candidate.full_name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                    </div>
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-2xl sm:text-3xl font-black text-[var(--foreground)] mb-3 uppercase tracking-tight">
                  {candidate.full_name}
                </h1>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-4">
                  <Badge variant="primary" size="md">
                    {cargoLabels[candidate.cargo] || candidate.cargo}
                  </Badge>
                  {candidate.party && (
                    <Badge
                      size="md"
                      style={{
                        backgroundColor: candidate.party.color || '#6B7280',
                        color: '#fff',
                      }}
                    >
                      {candidate.party.name}
                    </Badge>
                  )}
                  {candidate.district && (
                    <Badge variant="outline" size="md">{candidate.district.name}</Badge>
                  )}
                </div>
                <div className="flex items-center justify-center sm:justify-start gap-3">
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
                  <Button variant="ghost" size="sm" onClick={handleShare}>
                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="square" strokeLinejoin="miter" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    COMPARTIR
                  </Button>
                </div>
              </div>

              {/* Score */}
              <div className="flex-shrink-0 flex flex-col items-center justify-center">
                <ScorePill
                  score={getScore()}
                  mode={mode}
                  weights={PRESETS[mode as keyof typeof PRESETS]}
                  size="lg"
                  variant="default"
                  showMode
                />
                <div className="flex gap-1 mt-3">
                  {(['balanced', 'merit', 'integrity'] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setMode(m)}
                      className={cn(
                        'px-3 py-1.5 text-xs font-bold uppercase tracking-wide border-2 transition-all duration-100',
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

          {/* Sub-scores strip */}
          <div className="px-6 sm:px-8 py-4 bg-[var(--muted)] border-t-3 border-[var(--border)]">
            <div className="grid grid-cols-3 gap-6">
              <SubScoreStat type="competence" value={candidate.scores.competence} size="md" />
              <SubScoreStat type="integrity" value={candidate.scores.integrity} size="md" />
              <SubScoreStat type="transparency" value={candidate.scores.transparency} size="md" />
            </div>
          </div>
        </Card>

        {/* Flags Alert */}
        {candidate.flags.length > 0 && (
          <Card className={cn(
            'mb-6 border-3',
            candidate.flags.some(f => f.severity === 'RED')
              ? 'bg-[var(--flag-red)]/10 border-[var(--flag-red)]'
              : 'bg-[var(--flag-amber)]/10 border-[var(--flag-amber)]'
          )}>
            <div className="p-5">
              <div className="flex items-start gap-4">
                <div className={cn(
                  'p-2.5 border-2 flex-shrink-0',
                  candidate.flags.some(f => f.severity === 'RED')
                    ? 'bg-[var(--flag-red-bg)] border-[var(--flag-red)]'
                    : 'bg-[var(--flag-amber-bg)] border-[var(--flag-amber)]'
                )}>
                  <svg className={cn(
                    'w-5 h-5',
                    candidate.flags.some(f => f.severity === 'RED')
                      ? 'text-[var(--flag-red-text)]'
                      : 'text-[var(--flag-amber-text)]'
                  )} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="square" strokeLinejoin="miter" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className={cn(
                    'font-black uppercase tracking-wide mb-1',
                    candidate.flags.some(f => f.severity === 'RED')
                      ? 'text-[var(--flag-red-text)]'
                      : 'text-[var(--flag-amber-text)]'
                  )}>
                    {candidate.flags.length} Alerta{candidate.flags.length > 1 ? 's' : ''} Registrada{candidate.flags.length > 1 ? 's' : ''}
                  </h3>
                  <p className={cn(
                    'text-sm font-medium mb-3',
                    candidate.flags.some(f => f.severity === 'RED')
                      ? 'text-[var(--flag-red-text)]'
                      : 'text-[var(--flag-amber-text)]'
                  )}>
                    Este candidato tiene antecedentes verificados que afectan su puntaje de integridad.
                  </p>
                  <FlagChips flags={candidate.flags} maxVisible={5} size="md" />
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Tabs */}
        <Tabs defaultTab="resumen">
          <TabList className="mb-4">
            <Tab value="resumen">RESUMEN</Tab>
            <Tab value="evidencia">EVIDENCIA</Tab>
            <Tab value="breakdown">DESGLOSE</Tab>
          </TabList>

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
                    <div className="grid grid-cols-2 gap-4">
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
                        <div key={idx} className="flex gap-4 pb-4 border-b-2 border-[var(--border)] last:border-0 last:pb-0">
                          <div className={cn(
                            'w-10 h-10 border-2 border-[var(--border)] flex items-center justify-center flex-shrink-0',
                            edu.level === 'Doctorado' ? 'bg-[var(--score-integrity)]/20 text-[var(--score-integrity-text)]' :
                            edu.level === 'Maestría' ? 'bg-[var(--score-transparency)]/20 text-[var(--score-transparency-text)]' :
                            edu.level === 'Universitario' || edu.level === 'Título Profesional' ? 'bg-[var(--score-competence)]/20 text-[var(--score-competence-text)]' :
                            'bg-[var(--muted)] text-[var(--muted-foreground)]'
                          )}>
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
                        <div key={idx} className="flex gap-4 pb-4 border-b-2 border-[var(--border)] last:border-0 last:pb-0">
                          <div className={cn(
                            'w-10 h-10 border-2 border-[var(--border)] flex items-center justify-center flex-shrink-0',
                            exp.type === 'publico' ? 'bg-[var(--score-transparency)]/20 text-[var(--score-transparency-text)]' : 'bg-[var(--score-competence)]/20 text-[var(--score-competence-text)]'
                          )}>
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
                        <div key={idx} className="flex gap-4 pb-4 border-b-2 border-[var(--border)] last:border-0 last:pb-0">
                          <div className={cn(
                            'w-10 h-10 border-2 border-[var(--border)] flex items-center justify-center flex-shrink-0',
                            pol.type === 'cargo_electivo' ? 'bg-[var(--flag-red-bg)] text-[var(--flag-red-text)]' :
                            pol.type === 'cargo_partidario' ? 'bg-[var(--flag-amber-bg)] text-[var(--flag-amber-text)]' :
                            pol.type === 'candidatura' ? 'bg-[var(--score-integrity)]/20 text-[var(--score-integrity-text)]' :
                            'bg-[var(--muted)] text-[var(--muted-foreground)]'
                          )}>
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
                      {/* Resumen */}
                      <div className="grid grid-cols-2 gap-4 p-4 bg-[var(--muted)] border-2 border-[var(--border)]">
                        <div>
                          <span className="text-sm font-bold uppercase text-[var(--muted-foreground)]">Patrimonio Total</span>
                          <p className="text-xl font-black text-[var(--foreground)]">
                            {formatCurrency(details.assets_declaration.total_value)}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm font-bold uppercase text-[var(--muted-foreground)]">Ingreso Mensual</span>
                          <p className="text-xl font-black text-[var(--foreground)]">
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
                    <CardTitle>ALERTAS VERIFICADAS</CardTitle>
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
                        Sin alertas registradas
                      </h4>
                      <p className="text-sm text-[var(--muted-foreground)]">
                        No se encontraron antecedentes negativos verificados para este candidato.
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
                  <div className="space-y-6">
                    {/* Competence Breakdown */}
                    <div>
                      <h4 className="font-black text-[var(--foreground)] mb-3 flex items-center gap-2 uppercase">
                        <div className="w-3 h-3 bg-[var(--score-competence)]" />
                        Competencia: {candidate.scores.competence.toFixed(1)}/100
                      </h4>
                      <div className="ml-5 space-y-2 text-sm text-[var(--muted-foreground)]">
                        <div className="flex justify-between">
                          <span>Nivel educativo (máx. 22)</span>
                          <span className="font-bold text-[var(--foreground)]">{breakdown.education.level.toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Profundidad educativa (máx. 8)</span>
                          <span className="font-bold text-[var(--foreground)]">{breakdown.education.depth.toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Experiencia total (máx. 25)</span>
                          <span className="font-bold text-[var(--foreground)]">{breakdown.experience.total.toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Experiencia relevante (máx. 25)</span>
                          <span className="font-bold text-[var(--foreground)]">{breakdown.experience.relevant.toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Liderazgo - Seniority (máx. 14)</span>
                          <span className="font-bold text-[var(--foreground)]">{breakdown.leadership.seniority.toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Liderazgo - Estabilidad (máx. 6)</span>
                          <span className="font-bold text-[var(--foreground)]">{breakdown.leadership.stability.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Integrity Breakdown */}
                    <div>
                      <h4 className="font-black text-[var(--foreground)] mb-3 flex items-center gap-2 uppercase">
                        <div className="w-3 h-3 bg-[var(--score-integrity)]" />
                        Integridad: {candidate.scores.integrity.toFixed(1)}/100
                      </h4>
                      <div className="ml-5 space-y-2 text-sm text-[var(--muted-foreground)]">
                        <div className="flex justify-between">
                          <span>Base</span>
                          <span className="font-bold text-[var(--foreground)]">{breakdown.integrity.base.toFixed(0)}</span>
                        </div>
                        {breakdown.integrity.penal_penalty > 0 && (
                          <div className="flex justify-between text-[var(--flag-red-text)]">
                            <span>Sentencias penales</span>
                            <span className="font-bold">-{breakdown.integrity.penal_penalty.toFixed(0)}</span>
                          </div>
                        )}
                        {breakdown.integrity.civil_penalties.map((penalty, idx) => (
                          <div key={idx} className="flex justify-between text-[var(--flag-amber-text)]">
                            <span>Sentencia civil ({penalty.type})</span>
                            <span className="font-bold">-{penalty.penalty.toFixed(0)}</span>
                          </div>
                        ))}
                        {breakdown.integrity.resignation_penalty > 0 && (
                          <div className="flex justify-between text-[var(--flag-amber-text)]">
                            <span>Renuncias a partidos</span>
                            <span className="font-bold">-{breakdown.integrity.resignation_penalty.toFixed(0)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Transparency Breakdown */}
                    <div>
                      <h4 className="font-black text-[var(--foreground)] mb-3 flex items-center gap-2 uppercase">
                        <div className="w-3 h-3 bg-[var(--score-transparency)]" />
                        Transparencia: {candidate.scores.transparency.toFixed(1)}/100
                      </h4>
                      <div className="ml-5 space-y-2 text-sm text-[var(--muted-foreground)]">
                        <div className="flex justify-between">
                          <span>Completitud (máx. 35)</span>
                          <span className="font-bold text-[var(--foreground)]">{breakdown.transparency.completeness.toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Consistencia (máx. 35)</span>
                          <span className="font-bold text-[var(--foreground)]">{breakdown.transparency.consistency.toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Calidad Patrimonial (máx. 30)</span>
                          <span className="font-bold text-[var(--foreground)]">{breakdown.transparency.assets_quality.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Confidence Breakdown */}
                    <div>
                      <h4 className="font-black text-[var(--foreground)] mb-3 flex items-center gap-2 uppercase">
                        <div className="w-3 h-3 bg-[var(--muted-foreground)]" />
                        Confianza de datos: {candidate.scores.confidence.toFixed(1)}/100
                      </h4>
                      <div className="ml-5 space-y-2 text-sm text-[var(--muted-foreground)]">
                        <div className="flex justify-between">
                          <span>Verificación (máx. 50)</span>
                          <span className="font-bold text-[var(--foreground)]">{breakdown.confidence.verification.toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Cobertura (máx. 50)</span>
                          <span className="font-bold text-[var(--foreground)]">{breakdown.confidence.coverage.toFixed(1)}</span>
                        </div>
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

        {/* Action Bar */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/ranking">
            <Button variant="outline" size="lg">
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="square" strokeLinejoin="miter" d="M15 19l-7-7 7-7" />
              </svg>
              VOLVER AL RANKING
            </Button>
          </Link>
          <Link href={`/comparar?ids=${candidate.id}`}>
            <Button variant="primary" size="lg">
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="square" strokeLinejoin="miter" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              COMPARAR CON OTROS
            </Button>
          </Link>
        </div>
      </main>
    </div>
  )
}
