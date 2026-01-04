'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/Card'

interface DailyFact {
  id: string
  fact_text: string
  fact_type: string
  related_candidate_id?: string
  related_party_id?: string
  source_url?: string
}

interface DailyFactProps {
  className?: string
}

const FACT_TYPE_ICONS: Record<string, string> = {
  candidate: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  party: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
  statistic: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  history: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  comparison: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
}

const FALLBACK_FACTS: DailyFact[] = [
  { id: '1', fact_text: 'El Peru eligira 196 representantes: 1 Presidente, 60 Senadores, 130 Diputados y 5 al Parlamento Andino.', fact_type: 'statistic' },
  { id: '2', fact_text: '36 candidatos presidenciales compiten por llegar a Palacio de Gobierno.', fact_type: 'statistic' },
  { id: '3', fact_text: 'Lima Metropolitana elige mas diputados: 32 de los 130 totales.', fact_type: 'statistic' },
  { id: '4', fact_text: 'Esta es la primera eleccion con Senado desde 1992, cuando Fujimori lo cerro.', fact_type: 'history' },
  { id: '5', fact_text: '12 candidatos presidenciales tienen sentencias o procesos judiciales registrados.', fact_type: 'statistic' },
]

export function DailyFact({ className }: DailyFactProps) {
  const [fact, setFact] = useState<DailyFact | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchFact() {
      try {
        const response = await fetch('/api/facts/today')
        if (response.ok) {
          const data = await response.json()
          setFact(data)
        } else {
          // Use fallback based on day of year
          const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24))
          setFact(FALLBACK_FACTS[dayOfYear % FALLBACK_FACTS.length])
        }
      } catch {
        // Use fallback
        const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24))
        setFact(FALLBACK_FACTS[dayOfYear % FALLBACK_FACTS.length])
      } finally {
        setLoading(false)
      }
    }

    fetchFact()
  }, [])

  if (loading) {
    return (
      <Card className={cn('p-4 animate-pulse', className)}>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-[var(--muted)] border-2 border-[var(--border)]" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-[var(--muted)] w-1/4" />
            <div className="h-4 bg-[var(--muted)] w-full" />
            <div className="h-4 bg-[var(--muted)] w-3/4" />
          </div>
        </div>
      </Card>
    )
  }

  if (!fact) return null

  const iconPath = FACT_TYPE_ICONS[fact.fact_type] || FACT_TYPE_ICONS.statistic

  return (
    <Card className={cn('p-4 sm:p-5 h-full', className)}>
      <div className="flex items-start gap-3 sm:gap-4">
        <div className={cn(
          'w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0',
          'bg-[var(--score-good)]',
          'border-2 border-[var(--border)]',
          'shadow-[var(--shadow-brutal-sm)]',
          'flex items-center justify-center'
        )}>
          <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="square" strokeLinejoin="miter" d={iconPath} />
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-[var(--primary)] uppercase tracking-wide">
              Dato del Dia
            </span>
            <span className="text-xs text-[var(--muted-foreground)]">
              {new Date().toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })}
            </span>
          </div>
          <p className="text-sm sm:text-base font-medium text-[var(--foreground)] leading-relaxed">
            {fact.fact_text}
          </p>
          {fact.source_url && (
            <Link
              href={fact.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-bold text-[var(--muted-foreground)] hover:text-[var(--primary)] mt-2 transition-colors"
            >
              Ver fuente
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </Link>
          )}
        </div>
      </div>
    </Card>
  )
}
