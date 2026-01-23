'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import { cn } from '@/lib/utils'

interface PerformanceSummary {
  isIncumbent: boolean
  cargoActual: string | null
  entidad: string | null
  period: string | null
  budgetExecution: {
    pct: number
    rating: string
  } | null
  contraloria: {
    reports: number
    findings: number
    hasCriminalReferral: boolean
  } | null
  performanceScore: number | null
  competenceImpact: number
  integrityPenalty: number
}

interface IncumbentPerformanceCardProps {
  candidateId: string
}

export function IncumbentPerformanceCard({ candidateId }: IncumbentPerformanceCardProps) {
  const [data, setData] = useState<PerformanceSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/candidates/${candidateId}/performance`)
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
            Desempeño en Cargo Actual
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

  if (!data || !data.isIncumbent) {
    return null // Not an incumbent - don't show card
  }

  const hasProblems = data.integrityPenalty > 0 || (data.budgetExecution && data.budgetExecution.pct < 50)

  const ratingColors: Record<string, { bg: string; text: string; border: string }> = {
    excelente: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-500' },
    bueno: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-500' },
    regular: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-500' },
    deficiente: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-500' },
    critico: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-500' },
    sin_datos: { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-400' },
  }

  return (
    <Card className={cn(
      'border-2',
      hasProblems ? 'border-[var(--flag-amber)]' : 'border-[var(--border)]'
    )}>
      <CardHeader className={cn(
        hasProblems && 'bg-[var(--flag-amber)]/10'
      )}>
        <CardTitle className="flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="square" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Desempeño en Cargo Actual
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {/* Current Position Info */}
        <div className="p-3 bg-[var(--muted)] border-2 border-[var(--border)]">
          <div className="text-sm font-bold text-[var(--muted-foreground)] uppercase">Cargo Actual</div>
          <div className="text-lg font-black text-[var(--foreground)]">{data.cargoActual}</div>
          {data.entidad && (
            <div className="text-sm text-[var(--muted-foreground)]">{data.entidad}</div>
          )}
          {data.period && (
            <div className="text-xs text-[var(--muted-foreground)]">Período: {data.period}</div>
          )}
        </div>

        {/* Budget Execution */}
        {data.budgetExecution && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-[var(--muted-foreground)] uppercase">
                Ejecución Presupuestal
              </span>
              <span className={cn(
                'px-2 py-0.5 text-xs font-black uppercase border-2',
                ratingColors[data.budgetExecution.rating]?.bg,
                ratingColors[data.budgetExecution.rating]?.text,
                ratingColors[data.budgetExecution.rating]?.border
              )}>
                {data.budgetExecution.rating.replace('_', ' ')}
              </span>
            </div>
            <div className="space-y-1">
              <Progress value={data.budgetExecution.pct} className="h-4" />
              <div className="flex justify-between text-xs">
                <span className="text-[var(--muted-foreground)]">0%</span>
                <span className="font-black text-[var(--foreground)]">
                  {data.budgetExecution.pct.toFixed(1)}%
                </span>
                <span className="text-[var(--muted-foreground)]">100%</span>
              </div>
            </div>
            <p className="text-xs text-[var(--muted-foreground)]">
              Porcentaje del presupuesto ejecutado (devengado vs PIM). Fuente: MEF.
            </p>
            {data.competenceImpact !== 0 && (
              <Badge variant={data.competenceImpact > 0 ? 'success' : 'warning'}>
                {data.competenceImpact > 0 ? '+' : ''}{data.competenceImpact} pts competencia
              </Badge>
            )}
          </div>
        )}

        {/* Contraloría Info */}
        {data.contraloria && data.contraloria.reports > 0 && (
          <div className={cn(
            'p-4 border-2',
            data.contraloria.hasCriminalReferral
              ? 'bg-[var(--flag-red)]/10 border-[var(--flag-red)]'
              : data.contraloria.findings > 0
              ? 'bg-[var(--flag-amber)]/10 border-[var(--flag-amber)]'
              : 'bg-[var(--muted)] border-[var(--border)]'
          )}>
            <h4 className="font-black text-sm uppercase mb-2">Informes de Contraloría</h4>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-2xl font-black">{data.contraloria.reports}</div>
                <div className="text-xs text-[var(--muted-foreground)]">Informes</div>
              </div>
              <div>
                <div className={cn(
                  'text-2xl font-black',
                  data.contraloria.findings > 0 ? 'text-[var(--flag-amber-text)]' : ''
                )}>
                  {data.contraloria.findings}
                </div>
                <div className="text-xs text-[var(--muted-foreground)]">Hallazgos</div>
              </div>
              <div>
                <div className={cn(
                  'text-2xl font-black',
                  data.contraloria.hasCriminalReferral ? 'text-[var(--flag-red-text)]' : ''
                )}>
                  {data.contraloria.hasCriminalReferral ? 'SÍ' : 'NO'}
                </div>
                <div className="text-xs text-[var(--muted-foreground)]">Referido Penal</div>
              </div>
            </div>

            {data.contraloria.hasCriminalReferral && (
              <div className="mt-3 p-2 bg-[var(--flag-red)]/10 border-2 border-[var(--flag-red)]">
                <p className="text-xs text-[var(--flag-red-text)] font-bold">
                  La Contraloría ha referido casos al Ministerio Público para investigación penal.
                </p>
              </div>
            )}

            {data.integrityPenalty > 0 && (
              <div className="mt-2">
                <Badge variant="destructive">
                  Penalización: -{data.integrityPenalty} pts integridad
                </Badge>
              </div>
            )}
          </div>
        )}

        {/* No data message */}
        {!data.budgetExecution && (!data.contraloria || data.contraloria.reports === 0) && (
          <div className="text-center py-4 text-[var(--muted-foreground)]">
            <p className="text-sm">No hay datos de desempeño disponibles aún.</p>
          </div>
        )}

        <p className="text-xs text-[var(--muted-foreground)] pt-2 border-t-2 border-[var(--border)]">
          Datos de ejecución presupuestal del MEF e informes de auditoría de la Contraloría General.
        </p>
      </CardContent>
    </Card>
  )
}
