'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

interface StatsData {
  totalCompletions: number
  topCandidate: string | null
  topCandidateCount: number
  profiles: { profile: string; count: number }[]
}

export function QuizStats() {
  const t = useTranslations('quiz')
  const [stats, setStats] = useState<StatsData | null>(null)

  useEffect(() => {
    fetch('/api/quiz/stats')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && data.totalCompletions > 0) setStats(data)
      })
      .catch(() => {})
  }, [])

  if (!stats) return null

  const totalProfiles = stats.profiles.reduce((sum, p) => sum + Number(p.count), 0)

  const profileColors: Record<string, string> = {
    'Progresista': 'var(--score-excellent)',
    'Centro-Izquierda': 'var(--score-good)',
    'Centrista': 'var(--score-medium)',
    'Centro-Derecha': 'var(--flag-amber)',
    'Conservador': 'var(--score-low)',
  }

  return (
    <div className="bg-[var(--muted)] border-3 border-[var(--border)] p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
        {/* Total participants */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="w-10 h-10 bg-[var(--primary)] border-2 border-[var(--border)] flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="square" strokeLinejoin="miter" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <div className="text-2xl font-black text-[var(--foreground)] leading-none">
              {stats.totalCompletions.toLocaleString()}
            </div>
            <div className="text-xs font-bold text-[var(--muted-foreground)] uppercase">
              {t('stats.participants')}
            </div>
          </div>
        </div>

        {/* Top candidate */}
        {stats.topCandidate && (
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="w-10 h-10 bg-[var(--score-medium)] border-2 border-[var(--border)] flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="square" strokeLinejoin="miter" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-black text-[var(--foreground)] leading-tight truncate max-w-[180px]">
                {stats.topCandidate}
              </div>
              <div className="text-xs font-bold text-[var(--muted-foreground)] uppercase">
                {t('stats.mostPopular')}
              </div>
            </div>
          </div>
        )}

        {/* Profile distribution */}
        {stats.profiles.length > 0 && (
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-[var(--muted-foreground)] uppercase mb-2">
              {t('stats.profileDistribution')}
            </div>
            <div className="flex h-3 border-2 border-[var(--border)] overflow-hidden">
              {stats.profiles.map((p) => {
                const pct = totalProfiles > 0 ? (Number(p.count) / totalProfiles) * 100 : 0
                return (
                  <div
                    key={p.profile}
                    className={cn('h-full transition-all', pct < 1 && 'hidden')}
                    style={{
                      width: `${pct}%`,
                      backgroundColor: profileColors[p.profile] || 'var(--muted-foreground)',
                    }}
                    title={`${p.profile}: ${Number(p.count)}`}
                  />
                )
              })}
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5">
              {stats.profiles.map((p) => (
                <span key={p.profile} className="flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
                  <span
                    className="w-2 h-2 flex-shrink-0"
                    style={{ backgroundColor: profileColors[p.profile] || 'var(--muted-foreground)' }}
                  />
                  <span className="font-medium">{p.profile}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
