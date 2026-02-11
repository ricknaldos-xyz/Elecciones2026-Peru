'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

interface SyncSourceStatus {
  status: string
  completed_at: string | null
  records_processed: number
  records_updated: number
}

interface SyncStatusResponse {
  sources: Record<string, SyncSourceStatus>
}

const SOURCE_LABELS: Record<string, string> = {
  jne: 'JNE',
  onpe: 'ONPE',
  poder_judicial: 'Poder Judicial',
  news: 'Noticias',
  google_news: 'Google News',
  twitter: 'Twitter/X',
  youtube: 'YouTube',
  tiktok: 'TikTok',
  sunat: 'SUNAT',
  congreso_votaciones: 'Congreso',
  contraloria: 'Contraloría',
  mef: 'MEF',
  plan_viability: 'Planes',
}

function formatRelativeTime(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  if (hours < 1) return 'hace <1h'
  if (hours < 24) return `hace ${hours}h`
  const days = Math.floor(hours / 24)
  return `hace ${days}d`
}

function getFreshnessStyle(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime()
  const hours = diff / (1000 * 60 * 60)
  if (hours < 24) return 'bg-green-100 text-green-900 border-green-400'
  if (hours < 72) return 'bg-amber-100 text-amber-900 border-amber-400'
  return 'bg-red-100 text-red-900 border-red-400'
}

export function DataFreshnessFooter() {
  const t = useTranslations('dataFreshness')
  const [data, setData] = useState<SyncStatusResponse | null>(null)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    fetch('/api/sync/status')
      .then(res => res.ok ? res.json() : null)
      .then(json => setData(json))
      .catch(() => setData(null))
  }, [])

  if (!data) {
    return (
      <div className="text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wide text-center">
        {t('updatedPeriodically')}
      </div>
    )
  }

  const completedSources = Object.entries(data.sources)
    .filter(([, s]) => s.status === 'completed' && s.completed_at)
    .sort(([, a], [, b]) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime())

  if (completedSources.length === 0) {
    return (
      <div className="text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wide text-center">
        {t('updatedPeriodically')}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <button
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        className="w-full text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wide text-center hover:text-[var(--foreground)] transition-colors flex items-center justify-center gap-1"
      >
        <span>{t('dataSources')}</span>
        <svg
          aria-hidden="true"
          className={cn('w-3 h-3 transition-transform', expanded && 'rotate-180')}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="flex flex-wrap justify-center gap-1.5">
          {completedSources.map(([source, status]) => (
            <span
              key={source}
              className={cn(
                'text-[10px] font-bold px-1.5 py-0.5 border',
                getFreshnessStyle(status.completed_at!)
              )}
            >
              {SOURCE_LABELS[source] || source} · {formatRelativeTime(status.completed_at!)}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
