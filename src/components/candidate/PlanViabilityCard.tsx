'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import { cn } from '@/lib/utils'
import type { PlanViabilityAnalysis } from '@/types/database'

interface PlanViabilityCardProps {
  candidateId: string
}

function getScoreColor(score: number) {
  if (score >= 7) return 'text-green-600'
  if (score >= 5) return 'text-yellow-600'
  return 'text-red-600'
}

function getScoreBg(score: number) {
  if (score >= 7) return 'bg-green-100 border-green-500'
  if (score >= 5) return 'bg-yellow-100 border-yellow-500'
  return 'bg-red-100 border-red-500'
}

function getRiskBadge(risk: 'low' | 'medium' | 'high') {
  const map = { low: 'success', medium: 'warning', high: 'danger' } as const
  const labels = { low: 'Bajo', medium: 'Medio', high: 'Alto' }
  return { variant: map[risk], label: labels[risk] }
}

interface DimensionSectionProps {
  label: string
  description: string
  score: number
  analysis: string
  children?: React.ReactNode
}

function DimensionSection({ label, description, score, analysis, children }: DimensionSectionProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="font-bold uppercase text-[var(--muted-foreground)]">{label}</span>
        <span className={cn('font-black', getScoreColor(score))}>
          {score.toFixed(1)}/10
        </span>
      </div>
      <Progress value={score * 10} size="sm" variant={score >= 7 ? 'success' : score >= 5 ? 'warning' : 'danger'} />
      <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{description}</p>

      <button
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        className="flex items-center gap-1 text-xs font-bold text-[var(--primary)] mt-1.5 hover:underline focus:outline-2 focus:outline-[var(--primary)]"
      >
        <svg
          className={cn('w-3 h-3 transition-transform duration-100', expanded && 'rotate-90')}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={3}
        >
          <path strokeLinecap="square" strokeLinejoin="miter" d="M9 5l7 7-7 7" />
        </svg>
        {expanded ? 'Ocultar detalles' : 'Ver detalles'}
      </button>

      {expanded && (
        <div
          role="region"
          className="mt-2 p-3 bg-[var(--muted)] border-2 border-[var(--border)] text-sm space-y-2"
        >
          <p className="text-[var(--foreground)]">{analysis}</p>
          {children}
        </div>
      )}
    </div>
  )
}

export function PlanViabilityCard({ candidateId }: PlanViabilityCardProps) {
  const [data, setData] = useState<PlanViabilityAnalysis | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/candidates/${candidateId}/plan-viability`)
        if (!res.ok) {
          setData(null)
          return
        }
        const json = await res.json()
        setData(json)
      } catch {
        setData(null)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [candidateId])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="square" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Análisis de Viabilidad del Plan de Gobierno
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-16 bg-[var(--muted)] rounded w-full"></div>
            <div className="h-4 bg-[var(--muted)] rounded w-3/4"></div>
            <div className="h-4 bg-[var(--muted)] rounded w-1/2"></div>
            <div className="h-4 bg-[var(--muted)] rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data) {
    return null
  }

  const fiscalDetails = data.fiscal_viability_details
  const legalDetails = data.legal_viability_details
  const coherenceDetails = data.coherence_details
  const historicalDetails = data.historical_details

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="square" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Análisis de Viabilidad del Plan de Gobierno
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {/* Overall Score */}
        <div className={cn('text-center p-4 border-2', getScoreBg(data.overall_viability_score))}>
          <div className={cn('text-4xl font-black', getScoreColor(data.overall_viability_score))}>
            {data.overall_viability_score.toFixed(1)}
          </div>
          <div className="text-xs font-bold text-[var(--muted-foreground)] uppercase mt-1">
            Viabilidad General (1-10)
          </div>
          <div className="text-xs text-[var(--muted-foreground)] mt-1">
            {data.proposals_analyzed} propuestas analizadas
          </div>
        </div>

        {/* Executive Summary */}
        {data.executive_summary && (
          <div className="p-3 bg-[var(--muted)] border-2 border-[var(--border)]">
            <p className="text-sm text-[var(--foreground)] leading-relaxed">
              {data.executive_summary}
            </p>
          </div>
        )}

        {/* Four Dimension Scores */}
        <div className="space-y-4">
          {/* Fiscal Viability */}
          <DimensionSection
            label="Viabilidad Fiscal"
            description="¿Es compatible con la realidad fiscal del Perú?"
            score={data.fiscal_viability_score}
            analysis={data.fiscal_viability_analysis}
          >
            {fiscalDetails && (
              <div className="space-y-1.5 text-xs">
                {fiscalDetails.estimated_cost_soles != null && (
                  <div className="flex justify-between">
                    <span className="text-[var(--muted-foreground)]">Costo estimado:</span>
                    <span className="font-bold">S/. {(fiscalDetails.estimated_cost_soles / 1e9).toFixed(1)}B</span>
                  </div>
                )}
                {fiscalDetails.budget_gap_pct != null && (
                  <div className="flex justify-between">
                    <span className="text-[var(--muted-foreground)]">Brecha presupuestal:</span>
                    <span className="font-bold">{fiscalDetails.budget_gap_pct}%</span>
                  </div>
                )}
                {fiscalDetails.inflation_risk && (
                  <div className="flex justify-between items-center">
                    <span className="text-[var(--muted-foreground)]">Riesgo de inflación:</span>
                    <Badge variant={getRiskBadge(fiscalDetails.inflation_risk).variant} size="sm">
                      {getRiskBadge(fiscalDetails.inflation_risk).label}
                    </Badge>
                  </div>
                )}
                {fiscalDetails.key_findings?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {fiscalDetails.key_findings.map((finding, idx) => (
                      <Badge key={idx} variant="gray" size="sm">{finding}</Badge>
                    ))}
                  </div>
                )}
              </div>
            )}
          </DimensionSection>

          {/* Legal Viability */}
          <DimensionSection
            label="Viabilidad Legal e Institucional"
            description="¿Es factible jurídica e institucionalmente?"
            score={data.legal_viability_score}
            analysis={data.legal_viability_analysis}
          >
            {legalDetails && (
              <div className="space-y-1.5 text-xs">
                {legalDetails.constitutional_amendments_needed > 0 && (
                  <div className="flex justify-between">
                    <span className="text-[var(--muted-foreground)]">Enmiendas constitucionales:</span>
                    <Badge variant="danger" size="sm">{legalDetails.constitutional_amendments_needed}</Badge>
                  </div>
                )}
                {legalDetails.simple_legislation_needed > 0 && (
                  <div className="flex justify-between">
                    <span className="text-[var(--muted-foreground)]">Leyes (mayoría simple):</span>
                    <Badge variant="warning" size="sm">{legalDetails.simple_legislation_needed}</Badge>
                  </div>
                )}
                {legalDetails.executive_decree_possible > 0 && (
                  <div className="flex justify-between">
                    <span className="text-[var(--muted-foreground)]">Decretos ejecutivos:</span>
                    <Badge variant="success" size="sm">{legalDetails.executive_decree_possible}</Badge>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-[var(--muted-foreground)]">Cronograma realista:</span>
                  <Badge variant={legalDetails.timeline_realistic ? 'success' : 'danger'} size="sm">
                    {legalDetails.timeline_realistic ? 'Sí' : 'No'}
                  </Badge>
                </div>
                {legalDetails.key_findings?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {legalDetails.key_findings.map((finding, idx) => (
                      <Badge key={idx} variant="gray" size="sm">{finding}</Badge>
                    ))}
                  </div>
                )}
              </div>
            )}
          </DimensionSection>

          {/* Coherence */}
          <DimensionSection
            label="Coherencia Interna"
            description="¿Son consistentes entre sí las propuestas?"
            score={data.coherence_score}
            analysis={data.coherence_analysis}
          >
            {coherenceDetails && (
              <div className="space-y-1.5 text-xs">
                {coherenceDetails.contradictions?.length > 0 && (
                  <div>
                    <span className="font-bold text-[var(--muted-foreground)] uppercase block mb-1">
                      Contradicciones:
                    </span>
                    {coherenceDetails.contradictions.map((c, idx) => (
                      <div key={idx} className="p-2 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 mb-1">
                        <span className="font-bold">{c.proposal_a}</span>
                        {' vs '}
                        <span className="font-bold">{c.proposal_b}</span>
                        <p className="text-[var(--muted-foreground)] mt-0.5">{c.explanation}</p>
                      </div>
                    ))}
                  </div>
                )}
                {coherenceDetails.coverage_gaps?.length > 0 && (
                  <div>
                    <span className="font-bold text-[var(--muted-foreground)] uppercase block mb-1">
                      Brechas de cobertura:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {coherenceDetails.coverage_gaps.map((gap, idx) => (
                        <Badge key={idx} variant="warning" size="sm">{gap}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {coherenceDetails.key_findings?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {coherenceDetails.key_findings.map((finding, idx) => (
                      <Badge key={idx} variant="gray" size="sm">{finding}</Badge>
                    ))}
                  </div>
                )}
              </div>
            )}
          </DimensionSection>

          {/* Historical Comparison */}
          <DimensionSection
            label="Comparación Histórica"
            description="¿Hay precedentes que respalden las propuestas?"
            score={data.historical_score}
            analysis={data.historical_analysis}
          >
            {historicalDetails && (
              <div className="space-y-1.5 text-xs">
                {historicalDetails.similar_past_proposals?.length > 0 && (
                  <div>
                    <span className="font-bold text-[var(--muted-foreground)] uppercase block mb-1">
                      Precedentes en Perú:
                    </span>
                    {historicalDetails.similar_past_proposals.map((p, idx) => (
                      <div key={idx} className="p-2 bg-[var(--background)] border border-[var(--border)] mb-1">
                        <span className="font-bold">{p.proposal}</span>
                        <span className="text-[var(--muted-foreground)]"> — {p.past_government}</span>
                        <p className="text-[var(--muted-foreground)] mt-0.5">{p.outcome}</p>
                      </div>
                    ))}
                  </div>
                )}
                {historicalDetails.international_comparisons?.length > 0 && (
                  <div>
                    <span className="font-bold text-[var(--muted-foreground)] uppercase block mb-1">
                      Comparaciones internacionales:
                    </span>
                    {historicalDetails.international_comparisons.map((c, idx) => (
                      <div key={idx} className="p-2 bg-[var(--background)] border border-[var(--border)] mb-1">
                        <span className="font-bold">{c.proposal}</span>
                        <span className="text-[var(--muted-foreground)]"> — {c.country}</span>
                        <p className="text-[var(--muted-foreground)] mt-0.5">{c.result}</p>
                      </div>
                    ))}
                  </div>
                )}
                {historicalDetails.expert_consensus_alignment && (
                  <div className="flex justify-between items-center">
                    <span className="text-[var(--muted-foreground)]">Consenso de expertos:</span>
                    <Badge
                      variant={
                        historicalDetails.expert_consensus_alignment === 'aligned'
                          ? 'success'
                          : historicalDetails.expert_consensus_alignment === 'mixed'
                            ? 'warning'
                            : 'danger'
                      }
                      size="sm"
                    >
                      {historicalDetails.expert_consensus_alignment === 'aligned'
                        ? 'Alineado'
                        : historicalDetails.expert_consensus_alignment === 'mixed'
                          ? 'Mixto'
                          : 'Divergente'}
                    </Badge>
                  </div>
                )}
                {historicalDetails.key_findings?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {historicalDetails.key_findings.map((finding, idx) => (
                      <Badge key={idx} variant="gray" size="sm">{finding}</Badge>
                    ))}
                  </div>
                )}
              </div>
            )}
          </DimensionSection>
        </div>

        {/* Strengths */}
        {data.key_strengths?.length > 0 && (
          <div className="pt-3 border-t-2 border-[var(--border)]">
            <h4 className="font-bold text-sm text-[var(--muted-foreground)] uppercase mb-2">
              Principales Fortalezas
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {data.key_strengths.slice(0, 5).map((strength, idx) => (
                <Badge key={idx} variant="success" size="sm">
                  {strength}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Weaknesses */}
        {data.key_weaknesses?.length > 0 && (
          <div className="pt-3 border-t-2 border-[var(--border)]">
            <h4 className="font-bold text-sm text-[var(--muted-foreground)] uppercase mb-2">
              Principales Debilidades
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {data.key_weaknesses.slice(0, 5).map((weakness, idx) => (
                <Badge key={idx} variant="warning" size="sm">
                  {weakness}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Risks */}
        {data.key_risks?.length > 0 && (
          <div className="pt-3 border-t-2 border-[var(--border)]">
            <h4 className="font-bold text-sm text-[var(--muted-foreground)] uppercase mb-2">
              Factores de Riesgo
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {data.key_risks.slice(0, 5).map((risk, idx) => (
                <Badge key={idx} variant="danger" size="sm">
                  {risk}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* AI Disclaimer */}
        <p className="text-xs text-[var(--muted-foreground)] pt-2 border-t-2 border-[var(--border)]">
          Análisis generado por IA (Gemini). Evalúa la viabilidad técnica del plan de gobierno,
          no su orientación política.
        </p>
      </CardContent>
    </Card>
  )
}
