'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

interface TaxSummary {
  isCompliant: boolean
  status: string | null
  condition: string | null
  hasCoactiveDebts: boolean
  integrityPenalty: number
}

interface TaxStatusCardProps {
  candidateId: string
}

export function TaxStatusCard({ candidateId }: TaxStatusCardProps) {
  const [data, setData] = useState<TaxSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/candidates/${candidateId}/tax-status`)
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
              <path strokeLinecap="square" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z" />
            </svg>
            Estado SUNAT
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

  if (!data || (!data.status && !data.condition)) {
    return null // No tax data available
  }

  const isNoHabido = data.condition === 'no_habido'
  const hasProblem = !data.isCompliant || isNoHabido || data.hasCoactiveDebts

  const conditionLabels: Record<string, { label: string; color: string }> = {
    habido: { label: 'HABIDO', color: 'bg-green-100 text-green-700 border-green-500' },
    no_habido: { label: 'NO HABIDO', color: 'bg-red-100 text-red-700 border-red-500' },
    no_hallado: { label: 'NO HALLADO', color: 'bg-yellow-100 text-yellow-700 border-yellow-500' },
    pendiente: { label: 'PENDIENTE', color: 'bg-gray-100 text-gray-700 border-gray-500' },
  }

  const statusLabels: Record<string, { label: string; color: string }> = {
    activo: { label: 'ACTIVO', color: 'bg-green-100 text-green-700 border-green-500' },
    suspendido: { label: 'SUSPENDIDO', color: 'bg-yellow-100 text-yellow-700 border-yellow-500' },
    baja_definitiva: { label: 'BAJA DEFINITIVA', color: 'bg-red-100 text-red-700 border-red-500' },
    baja_provisional: { label: 'BAJA PROVISIONAL', color: 'bg-orange-100 text-orange-700 border-orange-500' },
  }

  const conditionInfo = data.condition ? conditionLabels[data.condition] : null
  const statusInfo = data.status ? statusLabels[data.status] : null

  return (
    <Card className={cn(
      'border-2',
      hasProblem ? 'border-[var(--flag-red)]' : 'border-[var(--border)]'
    )}>
      <CardHeader className={cn(
        hasProblem && 'bg-[var(--flag-red)]/10'
      )}>
        <CardTitle className="flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="square" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z" />
          </svg>
          Estado Tributario (SUNAT)
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {/* Status badges */}
        <div className="flex flex-wrap gap-2">
          {conditionInfo && (
            <span className={cn(
              'px-3 py-1.5 font-black text-sm uppercase border-2',
              conditionInfo.color
            )}>
              {conditionInfo.label}
            </span>
          )}
          {statusInfo && (
            <span className={cn(
              'px-3 py-1.5 font-black text-sm uppercase border-2',
              statusInfo.color
            )}>
              {statusInfo.label}
            </span>
          )}
          {data.hasCoactiveDebts && (
            <span className="px-3 py-1.5 font-black text-sm uppercase border-2 bg-red-100 text-red-700 border-red-500">
              DEUDAS COACTIVAS
            </span>
          )}
        </div>

        {/* Warning for NO HABIDO */}
        {isNoHabido && (
          <div className="p-4 bg-[var(--flag-red)]/10 border-2 border-[var(--flag-red)]">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-[var(--flag-red-bg)] border-2 border-[var(--flag-red)]">
                <svg className="w-5 h-5 text-[var(--flag-red-text)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="square" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h4 className="font-black text-[var(--flag-red-text)] uppercase mb-1">
                  Contribuyente NO HABIDO
                </h4>
                <p className="text-sm text-[var(--flag-red-text)]">
                  Este candidato tiene la condición de &quot;NO HABIDO&quot; en SUNAT, lo que indica que ha evadido
                  el domicilio fiscal declarado. Esta es una infracción tributaria grave.
                </p>
                <div className="mt-2">
                  <Badge variant="destructive">
                    Penalización: -{data.integrityPenalty} pts
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Compliant status */}
        {data.isCompliant && (
          <div className="p-4 bg-green-100 border-2 border-green-500">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-200 border-2 border-green-500">
                <svg className="w-5 h-5 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="square" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h4 className="font-black text-green-700 uppercase mb-1">
                  En Regla Tributaria
                </h4>
                <p className="text-sm text-green-600">
                  El candidato está al día con sus obligaciones tributarias según SUNAT.
                </p>
              </div>
            </div>
          </div>
        )}

        <p className="text-xs text-[var(--muted-foreground)]">
          Fuente: SUNAT - Consulta RUC. Los datos se actualizan periódicamente.
        </p>
      </CardContent>
    </Card>
  )
}
