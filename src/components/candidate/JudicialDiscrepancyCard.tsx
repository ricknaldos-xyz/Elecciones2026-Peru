'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

interface JudicialDiscrepancy {
  hasDiscrepancy: boolean
  severity: 'none' | 'minor' | 'major' | 'critical'
  undeclaredCount: number
  details: string[]
  integrityPenalty: number
}

interface JudicialDiscrepancyCardProps {
  candidateId: string
}

export function JudicialDiscrepancyCard({ candidateId }: JudicialDiscrepancyCardProps) {
  const [data, setData] = useState<JudicialDiscrepancy | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/candidates/${candidateId}/judicial-verification`)
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
              <path strokeLinecap="square" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Verificación Judicial
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

  if (!data) {
    return null // No verification data
  }

  if (!data.hasDiscrepancy) {
    return (
      <Card className="border-2 border-green-500">
        <CardHeader className="bg-green-100">
          <CardTitle className="flex items-center gap-2 text-green-700">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="square" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Verificación Judicial Aprobada
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <p className="text-sm text-green-600">
            Los antecedentes declarados por el candidato en el JNE coinciden con los registros
            encontrados en el Poder Judicial.
          </p>
        </CardContent>
      </Card>
    )
  }

  const severityConfig = {
    minor: {
      bg: 'bg-[var(--flag-amber)]/10',
      border: 'border-[var(--flag-amber)]',
      text: 'text-[var(--flag-amber-text)]',
      label: 'DISCREPANCIA MENOR',
    },
    major: {
      bg: 'bg-[var(--flag-red)]/10',
      border: 'border-[var(--flag-red)]',
      text: 'text-[var(--flag-red-text)]',
      label: 'DISCREPANCIA GRAVE',
    },
    critical: {
      bg: 'bg-[var(--flag-red)]/20',
      border: 'border-[var(--flag-red)]',
      text: 'text-[var(--flag-red-text)]',
      label: 'DISCREPANCIA CRÍTICA',
    },
    none: {
      bg: '',
      border: 'border-[var(--border)]',
      text: '',
      label: '',
    },
  }

  const config = severityConfig[data.severity]

  return (
    <Card className={cn('border-2', config.border)}>
      <CardHeader className={config.bg}>
        <CardTitle className={cn('flex items-center gap-2', config.text)}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="square" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {config.label}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        <div className={cn('p-4 border-2', config.border, config.bg)}>
          <div className="flex items-start gap-3">
            <div className={cn('p-2 border-2', config.border, config.bg)}>
              <svg className={cn('w-5 h-5', config.text)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="square" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className={cn('font-black uppercase mb-2', config.text)}>
                {data.undeclaredCount} Caso(s) No Declarado(s)
              </h4>
              <p className={cn('text-sm mb-3', config.text)}>
                Se encontraron {data.undeclaredCount} caso(s) en el Poder Judicial que el candidato
                <strong> no declaró</strong> en su Hoja de Vida ante el JNE.
              </p>

              {data.details.length > 0 && (
                <div className="space-y-1.5">
                  {data.details.map((detail, idx) => (
                    <div key={idx} className={cn('text-sm flex items-start gap-2', config.text)}>
                      <span className="font-bold">•</span>
                      <span>{detail}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-3">
                <Badge variant={data.severity === 'critical' || data.severity === 'major' ? 'destructive' : 'warning'}>
                  Penalización: -{data.integrityPenalty} pts
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <p className="text-xs text-[var(--muted-foreground)]">
          Verificación cruzada entre declaraciones del JNE y registros del Poder Judicial (CEJ).
          Las discrepancias pueden deberse a omisiones del candidato o a casos recientes no actualizados.
        </p>
      </CardContent>
    </Card>
  )
}
