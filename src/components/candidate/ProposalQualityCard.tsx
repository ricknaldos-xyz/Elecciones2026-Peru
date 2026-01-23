'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import { cn } from '@/lib/utils'

interface ProposalQuality {
  totalProposals: number
  evaluatedProposals: number
  averageSpecificity: number
  averageViability: number
  averageImpact: number
  averageEvidence: number
  overallQuality: number
  topConcerns: string[]
  topStrengths: string[]
}

interface ProposalQualityCardProps {
  candidateId: string
}

export function ProposalQualityCard({ candidateId }: ProposalQualityCardProps) {
  const [data, setData] = useState<ProposalQuality | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/candidates/${candidateId}/proposal-quality`)
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
              <path strokeLinecap="square" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
            Calidad de Propuestas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-[var(--muted)] rounded w-3/4"></div>
            <div className="h-4 bg-[var(--muted)] rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data || data.evaluatedProposals === 0) {
    return null // No proposals evaluated
  }

  const getScoreColor = (score: number) => {
    if (score >= 7) return 'text-green-600'
    if (score >= 5) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBg = (score: number) => {
    if (score >= 7) return 'bg-green-100 border-green-500'
    if (score >= 5) return 'bg-yellow-100 border-yellow-500'
    return 'bg-red-100 border-red-500'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="square" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
          Evaluación de Propuestas (IA)
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {/* Overall Score */}
        <div className="text-center p-4 bg-[var(--muted)] border-2 border-[var(--border)]">
          <div className={cn('text-4xl font-black', getScoreColor(data.overallQuality))}>
            {data.overallQuality.toFixed(1)}
          </div>
          <div className="text-xs font-bold text-[var(--muted-foreground)] uppercase mt-1">
            Calidad General (1-10)
          </div>
          <div className="text-xs text-[var(--muted-foreground)] mt-1">
            {data.evaluatedProposals} de {data.totalProposals} propuestas evaluadas
          </div>
        </div>

        {/* Individual Scores */}
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="font-bold uppercase text-[var(--muted-foreground)]">Especificidad</span>
              <span className={cn('font-black', getScoreColor(data.averageSpecificity))}>
                {data.averageSpecificity.toFixed(1)}/10
              </span>
            </div>
            <Progress value={data.averageSpecificity * 10} className="h-2" />
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">¿Qué tan concretas y detalladas son?</p>
          </div>

          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="font-bold uppercase text-[var(--muted-foreground)]">Viabilidad</span>
              <span className={cn('font-black', getScoreColor(data.averageViability))}>
                {data.averageViability.toFixed(1)}/10
              </span>
            </div>
            <Progress value={data.averageViability * 10} className="h-2" />
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">¿Son realizables en un período de gobierno?</p>
          </div>

          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="font-bold uppercase text-[var(--muted-foreground)]">Impacto Potencial</span>
              <span className={cn('font-black', getScoreColor(data.averageImpact))}>
                {data.averageImpact.toFixed(1)}/10
              </span>
            </div>
            <Progress value={data.averageImpact * 10} className="h-2" />
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">¿Qué tanto beneficio traerían al país?</p>
          </div>

          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="font-bold uppercase text-[var(--muted-foreground)]">Evidencia</span>
              <span className={cn('font-black', getScoreColor(data.averageEvidence))}>
                {data.averageEvidence.toFixed(1)}/10
              </span>
            </div>
            <Progress value={data.averageEvidence * 10} className="h-2" />
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">¿Están basadas en datos o estudios?</p>
          </div>
        </div>

        {/* Concerns */}
        {data.topConcerns.length > 0 && (
          <div className="pt-3 border-t-2 border-[var(--border)]">
            <h4 className="font-bold text-sm text-[var(--muted-foreground)] uppercase mb-2">
              Principales Preocupaciones
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {data.topConcerns.slice(0, 3).map((concern, idx) => (
                <Badge key={idx} variant="warning" size="sm">
                  {concern}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Strengths */}
        {data.topStrengths.length > 0 && (
          <div className="pt-3 border-t-2 border-[var(--border)]">
            <h4 className="font-bold text-sm text-[var(--muted-foreground)] uppercase mb-2">
              Principales Fortalezas
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {data.topStrengths.slice(0, 3).map((strength, idx) => (
                <Badge key={idx} variant="success" size="sm">
                  {strength}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <p className="text-xs text-[var(--muted-foreground)] pt-2 border-t-2 border-[var(--border)]">
          Evaluación generada por IA (Claude). Los criterios evalúan la calidad técnica de las propuestas,
          no su orientación política.
        </p>
      </CardContent>
    </Card>
  )
}
