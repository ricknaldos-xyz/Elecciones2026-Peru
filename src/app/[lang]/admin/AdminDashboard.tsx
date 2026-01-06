'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Stats {
  candidates: {
    total: number
    active: number
    byCargo: Record<string, number>
  }
  parties: { total: number }
  news: {
    total: number
    pending: number
    approved: number
    rejected: number
    featured: number
    bySentiment: Record<string, number>
  }
  flags: {
    total: number
    pending: number
    verified: number
    rejected: number
    bySeverity: Record<string, number>
  }
  quiz: {
    total: number
    last24h: number
    last7d: number
  }
  sync: {
    last24h: number
    successful: number
    failed: number
    lastBySource: Array<{ source: string; status: string; time: string }>
  }
}

const adminModules = [
  {
    href: '/admin/noticias',
    icon: '📰',
    title: 'Noticias',
    description: 'Curación de noticias: aprobar, rechazar, destacar contenido.',
    statKey: 'news.pending' as const,
    statLabel: 'pendientes',
    badge: true,
  },
  {
    href: '/admin/flags',
    icon: '🚩',
    title: 'Alertas',
    description: 'Verificar alertas de riesgo antes de mostrarlas.',
    statKey: 'flags.pending' as const,
    statLabel: 'pendientes',
    badge: true,
  },
  {
    href: '/admin/candidatos',
    icon: '👤',
    title: 'Candidatos',
    description: 'Editar datos de candidatos, corregir errores.',
    statKey: 'candidates.total' as const,
    statLabel: 'candidatos',
  },
  {
    href: '/admin/sync',
    icon: '🔄',
    title: 'Sincronización',
    description: 'Gestionar sincronización de fuentes de datos.',
    statKey: 'sync.last24h' as const,
    statLabel: 'syncs (24h)',
  },
]

function getNestedValue(obj: Stats | null, path: string): number {
  if (!obj) return 0
  const parts = path.split('.')
  let value: unknown = obj
  for (const part of parts) {
    if (value && typeof value === 'object' && part in value) {
      value = (value as Record<string, unknown>)[part]
    } else {
      return 0
    }
  }
  return typeof value === 'number' ? value : 0
}

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)

  if (diffMins < 1) return 'Hace un momento'
  if (diffMins < 60) return `Hace ${diffMins}m`
  if (diffHours < 24) return `Hace ${diffHours}h`
  return `Hace ${Math.floor(diffHours / 24)}d`
}

export function AdminDashboard({ lang }: { lang: string }) {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch('/api/admin/stats')
        if (response.ok) {
          const data = await response.json()
          setStats(data)
        }
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black uppercase tracking-tight mb-2">
          Panel de Administración
        </h1>
        <p className="text-[var(--muted-foreground)]">
          Gestiona el contenido y datos del sistema.
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="bg-[var(--card)] border-3 border-[var(--border)] p-4">
          <div className="text-2xl font-black text-[var(--primary)]">
            {loading ? '...' : stats?.candidates.total || 0}
          </div>
          <div className="text-xs font-bold uppercase text-[var(--muted-foreground)]">
            Candidatos
          </div>
        </div>
        <div className="bg-[var(--card)] border-3 border-[var(--border)] p-4">
          <div className="text-2xl font-black text-blue-600">
            {loading ? '...' : stats?.parties.total || 0}
          </div>
          <div className="text-xs font-bold uppercase text-[var(--muted-foreground)]">
            Partidos
          </div>
        </div>
        <div className="bg-[var(--card)] border-3 border-[var(--border)] p-4">
          <div className="text-2xl font-black text-green-600">
            {loading ? '...' : stats?.news.total || 0}
          </div>
          <div className="text-xs font-bold uppercase text-[var(--muted-foreground)]">
            Noticias
          </div>
        </div>
        <div className="bg-[var(--card)] border-3 border-[var(--border)] p-4">
          <div className="text-2xl font-black text-orange-600">
            {loading ? '...' : stats?.flags.total || 0}
          </div>
          <div className="text-xs font-bold uppercase text-[var(--muted-foreground)]">
            Alertas
          </div>
        </div>
        <div className="bg-[var(--card)] border-3 border-[var(--border)] p-4">
          <div className="text-2xl font-black text-purple-600">
            {loading ? '...' : stats?.quiz.total || 0}
          </div>
          <div className="text-xs font-bold uppercase text-[var(--muted-foreground)]">
            Quiz
          </div>
        </div>
        <div className="bg-[var(--card)] border-3 border-[var(--border)] p-4">
          <div className="text-2xl font-black text-cyan-600">4</div>
          <div className="text-xs font-bold uppercase text-[var(--muted-foreground)]">
            Idiomas
          </div>
        </div>
      </div>

      {/* Alerts - Pending Items */}
      {stats && (stats.news.pending > 0 || stats.flags.pending > 0) && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-3 border-yellow-500 p-4">
          <h3 className="font-bold text-yellow-800 dark:text-yellow-200 mb-2">
            Requiere atención
          </h3>
          <div className="flex flex-wrap gap-4 text-sm">
            {stats.news.pending > 0 && (
              <Link href={`/${lang}/admin/noticias?status=pending`} className="text-yellow-700 dark:text-yellow-300 hover:underline">
                {stats.news.pending} noticias pendientes de revisión
              </Link>
            )}
            {stats.flags.pending > 0 && (
              <Link href={`/${lang}/admin/flags?status=pending`} className="text-yellow-700 dark:text-yellow-300 hover:underline">
                {stats.flags.pending} alertas pendientes de verificar
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Modules */}
      <div>
        <h2 className="text-xl font-bold uppercase tracking-tight mb-4">
          Módulos
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {adminModules.map((module) => {
            const statValue = getNestedValue(stats, module.statKey)
            const hasBadge = module.badge && statValue > 0

            return (
              <Link
                key={module.href}
                href={`/${lang}${module.href}`}
                className="group relative bg-[var(--card)] border-3 border-[var(--border)] p-6 shadow-brutal hover:translate-x-[-4px] hover:translate-y-[-4px] hover:shadow-brutal-lg transition-all"
              >
                {hasBadge && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    {statValue}
                  </span>
                )}
                <div className="text-4xl mb-4">{module.icon}</div>
                <h3 className="text-lg font-bold uppercase tracking-tight mb-2 group-hover:text-[var(--primary)] transition-colors">
                  {module.title}
                </h3>
                <p className="text-sm text-[var(--muted-foreground)] mb-4">
                  {module.description}
                </p>
                <div className="text-xs font-bold uppercase text-[var(--primary)]">
                  {loading ? '...' : `${statValue} ${module.statLabel}`}
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Recent Syncs */}
      {stats?.sync.lastBySource && stats.sync.lastBySource.length > 0 && (
        <div>
          <h2 className="text-xl font-bold uppercase tracking-tight mb-4">
            Últimas Sincronizaciones
          </h2>
          <div className="bg-[var(--card)] border-3 border-[var(--border)] divide-y divide-[var(--border)]">
            {stats.sync.lastBySource.slice(0, 5).map((sync, i) => (
              <div key={i} className="flex items-center justify-between p-3">
                <span className="font-medium">{sync.source}</span>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-bold px-2 py-1 rounded ${
                    sync.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                    sync.status === 'failed' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                  }`}>
                    {sync.status}
                  </span>
                  <span className="text-xs text-[var(--muted-foreground)]">
                    {formatTimeAgo(sync.time)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quiz Activity */}
      {stats && (
        <div>
          <h2 className="text-xl font-bold uppercase tracking-tight mb-4">
            Actividad del Quiz
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-[var(--card)] border-3 border-[var(--border)] p-4 text-center">
              <div className="text-3xl font-black text-purple-600">{stats.quiz.last24h}</div>
              <div className="text-xs font-bold uppercase text-[var(--muted-foreground)]">Últimas 24h</div>
            </div>
            <div className="bg-[var(--card)] border-3 border-[var(--border)] p-4 text-center">
              <div className="text-3xl font-black text-purple-600">{stats.quiz.last7d}</div>
              <div className="text-xs font-bold uppercase text-[var(--muted-foreground)]">Últimos 7 días</div>
            </div>
            <div className="bg-[var(--card)] border-3 border-[var(--border)] p-4 text-center">
              <div className="text-3xl font-black text-purple-600">{stats.quiz.total}</div>
              <div className="text-xs font-bold uppercase text-[var(--muted-foreground)]">Total</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
