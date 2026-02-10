'use client'

import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import type { ScoreBreakdown } from '@/types/database'

interface IntegritySummaryCardProps {
  breakdown: ScoreBreakdown
  integrityScore: number
}

function getScoreColor(value: number): { bg: string; text: string; border: string } {
  if (value >= 90) return { bg: 'bg-[var(--score-excellent)]/10', text: 'text-[var(--score-excellent-text)]', border: 'border-[var(--score-excellent)]' }
  if (value >= 70) return { bg: 'bg-[var(--score-medium)]/10', text: 'text-[var(--score-medium-text)]', border: 'border-[var(--score-medium)]' }
  return { bg: 'bg-[var(--score-low)]/10', text: 'text-[var(--score-low-text)]', border: 'border-[var(--score-low)]' }
}

export function IntegritySummaryCard({ breakdown, integrityScore }: IntegritySummaryCardProps) {
  const { integrity } = breakdown
  const hasPenalties = integrity.penal_penalty > 0 ||
    integrity.civil_penalties.length > 0 ||
    integrity.resignation_penalty > 0 ||
    integrity.reinfo_penalty > 0

  const scoreColor = getScoreColor(integrityScore)

  const penalties: { label: string; value: number; color: 'red' | 'amber' }[] = []

  if (integrity.penal_penalty > 0) {
    penalties.push({ label: 'Sentencias penales', value: integrity.penal_penalty, color: 'red' })
  }
  for (const civil of integrity.civil_penalties) {
    const typeLabels: Record<string, string> = {
      violencia_familiar: 'Violencia familiar',
      alimentos: 'Pensión de alimentos',
      laboral: 'Demanda laboral',
      contractual: 'Incumplimiento contractual',
    }
    penalties.push({
      label: typeLabels[civil.type] || `Sentencia civil (${civil.type})`,
      value: civil.penalty,
      color: civil.type === 'violencia_familiar' ? 'red' : 'amber',
    })
  }
  if (integrity.resignation_penalty > 0) {
    penalties.push({ label: 'Renuncias partidarias', value: integrity.resignation_penalty, color: 'amber' })
  }
  if (integrity.reinfo_penalty > 0) {
    penalties.push({ label: 'REINFO (Minería)', value: integrity.reinfo_penalty, color: 'red' })
  }

  return (
    <Card className={cn(hasPenalties ? scoreColor.border : 'border-[var(--score-excellent)]')}>
      <CardHeader className={cn(hasPenalties ? scoreColor.bg : 'bg-[var(--score-excellent)]/10')}>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="square" strokeLinejoin="miter" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
            Resumen de Integridad
          </span>
          <span className={cn('text-3xl font-black', scoreColor.text)}>
            {integrityScore.toFixed(0)}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {!hasPenalties ? (
          <div className="flex items-center gap-2 p-3 bg-[var(--score-excellent)]/10 border-2 border-[var(--score-excellent)]">
            <svg className="w-5 h-5 text-[var(--score-excellent-text)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="square" strokeLinejoin="miter" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            <span className="text-sm font-black text-[var(--score-excellent-text)] uppercase">
              Sin antecedentes negativos registrados
            </span>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Base score */}
            <div className="flex items-center justify-between p-2 bg-[var(--muted)] border-2 border-[var(--border)]">
              <span className="text-xs font-bold text-[var(--foreground)] uppercase">Puntaje base</span>
              <span className="font-black text-[var(--foreground)]">{integrity.base.toFixed(0)}</span>
            </div>

            {/* Penalties */}
            {penalties.map((penalty, idx) => {
              const colorVar = penalty.color === 'red' ? 'flag-red' : 'flag-amber'
              return (
                <div
                  key={idx}
                  className={`flex items-center gap-3 p-2 bg-[var(--${colorVar})]/10 border-2 border-[var(--${colorVar})]`}
                >
                  <span className={`text-xs font-bold text-[var(--${colorVar}-text)] flex-1 uppercase`}>
                    {penalty.label}
                  </span>
                  <span className={`font-black text-[var(--${colorVar}-text)]`}>
                    -{penalty.value.toFixed(0)}
                  </span>
                </div>
              )
            })}

            {/* Final score */}
            <div className={cn('flex items-center justify-between p-2 border-2', scoreColor.border, scoreColor.bg)}>
              <span className="text-xs font-bold text-[var(--foreground)] uppercase">Score final</span>
              <span className={cn('font-black text-lg', scoreColor.text)}>{integrityScore.toFixed(0)}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
