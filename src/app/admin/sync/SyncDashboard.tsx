'use client'

import { useState, useEffect, useCallback } from 'react'

interface SyncStatus {
  status: 'started' | 'running' | 'completed' | 'failed'
  records_processed: number
  records_updated: number
  records_created: number
  records_skipped: number
  error_message: string | null
  started_at: string
  completed_at: string | null
  duration_ms: number | null
}

interface SyncLog {
  id: string
  source: string
  status: string
  records_processed: number
  records_updated: number
  records_created: number
  records_skipped: number
  error_message: string | null
  started_at: string
  completed_at: string | null
  duration_ms: number | null
}

const SOURCE_LABELS: Record<string, { name: string; description: string; icon: string }> = {
  jne: {
    name: 'JNE',
    description: 'Candidatos y hojas de vida',
    icon: '📋',
  },
  onpe: {
    name: 'ONPE CLARIDAD',
    description: 'Financiamiento de partidos',
    icon: '💰',
  },
  news: {
    name: 'Noticias',
    description: 'Medios digitales y RSS',
    icon: '📰',
  },
  poder_judicial: {
    name: 'Poder Judicial',
    description: 'Antecedentes judiciales',
    icon: '⚖️',
  },
}

const STATUS_STYLES: Record<string, string> = {
  completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  running: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  started: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  failed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
}

function formatDuration(ms: number | null): string {
  if (!ms) return '-'
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${(ms / 60000).toFixed(1)}min`
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return 'Nunca'
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'Hace un momento'
  if (diffMins < 60) return `Hace ${diffMins} minutos`
  if (diffHours < 24) return `Hace ${diffHours} horas`
  return `Hace ${diffDays} días`
}

export function SyncDashboard() {
  const [status, setStatus] = useState<Record<string, SyncStatus>>({})
  const [logs, setLogs] = useState<SyncLog[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedSource, setSelectedSource] = useState<string | null>(null)

  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/sync/status')
      const data = await response.json()
      setStatus(data.sources || {})
      setError(null)
    } catch (err) {
      setError('Error al cargar estado')
      console.error(err)
    }
  }, [])

  const fetchLogs = useCallback(async () => {
    try {
      const url = new URL('/api/sync/status', window.location.origin)
      url.searchParams.set('detailed', 'true')
      url.searchParams.set('limit', '50')
      if (selectedSource) {
        url.searchParams.set('source', selectedSource)
      }

      const response = await fetch(url.toString())
      const data = await response.json()
      setLogs(data.logs || [])
    } catch (err) {
      console.error('Error fetching logs:', err)
    }
  }, [selectedSource])

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([fetchStatus(), fetchLogs()])
      setLoading(false)
    }
    loadData()

    // Refresh every 30 seconds
    const interval = setInterval(() => {
      fetchStatus()
      fetchLogs()
    }, 30000)

    return () => clearInterval(interval)
  }, [fetchStatus, fetchLogs])

  const triggerSync = async (source: string) => {
    if (syncing) return

    setSyncing(source)
    setError(null)

    try {
      const response = await fetch(`/api/sync/${source}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET || 'test'}`,
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const result = await response.json()
      console.log(`Sync ${source} result:`, result)

      // Refresh data
      await Promise.all([fetchStatus(), fetchLogs()])
    } catch (err) {
      setError(`Error sincronizando ${source}`)
      console.error(err)
    } finally {
      setSyncing(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-200">
          {error}
        </div>
      )}

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(SOURCE_LABELS).map(([key, info]) => {
          const sourceStatus = status[key]

          return (
            <div
              key={key}
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{info.icon}</span>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {info.name}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {info.description}
                    </p>
                  </div>
                </div>
                {sourceStatus && (
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      STATUS_STYLES[sourceStatus.status] || 'bg-gray-100'
                    }`}
                  >
                    {sourceStatus.status}
                  </span>
                )}
              </div>

              {sourceStatus ? (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-600 dark:text-gray-300">
                    <span>Procesados:</span>
                    <span className="font-medium">
                      {sourceStatus.records_processed}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-600 dark:text-gray-300">
                    <span>Actualizados:</span>
                    <span className="font-medium text-green-600 dark:text-green-400">
                      {sourceStatus.records_updated}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-600 dark:text-gray-300">
                    <span>Creados:</span>
                    <span className="font-medium text-blue-600 dark:text-blue-400">
                      {sourceStatus.records_created}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-600 dark:text-gray-300">
                    <span>Duración:</span>
                    <span className="font-medium">
                      {formatDuration(sourceStatus.duration_ms)}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Última sync: {timeAgo(sourceStatus.completed_at || sourceStatus.started_at)}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Sin datos de sincronización
                </p>
              )}

              <button
                onClick={() => triggerSync(key)}
                disabled={syncing !== null}
                className={`mt-3 w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                  syncing === key
                    ? 'bg-blue-100 text-blue-600 cursor-wait'
                    : syncing
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {syncing === key ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></span>
                    Sincronizando...
                  </span>
                ) : (
                  'Sincronizar ahora'
                )}
              </button>
            </div>
          )
        })}
      </div>

      {/* Logs Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Historial de Sincronización
            </h2>
            <div className="flex gap-2">
              <select
                value={selectedSource || ''}
                onChange={(e) => setSelectedSource(e.target.value || null)}
                className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Todas las fuentes</option>
                {Object.entries(SOURCE_LABELS).map(([key, info]) => (
                  <option key={key} value={key}>
                    {info.name}
                  </option>
                ))}
              </select>
              <button
                onClick={() => {
                  fetchStatus()
                  fetchLogs()
                }}
                className="text-sm px-3 py-1.5 text-blue-600 hover:text-blue-800 dark:text-blue-400"
              >
                Actualizar
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Fuente
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Estado
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Procesados
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Actualizados
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Duración
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Fecha
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {logs.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
                  >
                    No hay registros de sincronización
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span>{SOURCE_LABELS[log.source]?.icon || '📄'}</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {SOURCE_LABELS[log.source]?.name || log.source}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          STATUS_STYLES[log.status] || 'bg-gray-100'
                        }`}
                      >
                        {log.status}
                      </span>
                      {log.error_message && (
                        <p className="mt-1 text-xs text-red-600 dark:text-red-400 truncate max-w-xs">
                          {log.error_message}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      {log.records_processed}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-green-600 dark:text-green-400">
                        {log.records_updated}
                      </span>
                      {log.records_created > 0 && (
                        <span className="text-blue-600 dark:text-blue-400 ml-2">
                          +{log.records_created}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      {formatDuration(log.duration_ms)}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300 text-sm">
                      {formatDate(log.started_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Schedule Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
        <h3 className="font-medium text-blue-900 dark:text-blue-200 mb-2">
          Programación de Sincronización Automática
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-blue-700 dark:text-blue-300 font-medium">JNE</p>
            <p className="text-blue-600 dark:text-blue-400">Diario a las 3:00 AM</p>
          </div>
          <div>
            <p className="text-blue-700 dark:text-blue-300 font-medium">ONPE</p>
            <p className="text-blue-600 dark:text-blue-400">Diario a las 4:00 AM</p>
          </div>
          <div>
            <p className="text-blue-700 dark:text-blue-300 font-medium">Noticias</p>
            <p className="text-blue-600 dark:text-blue-400">Diario a las 5:00 AM</p>
          </div>
          <div>
            <p className="text-blue-700 dark:text-blue-300 font-medium">Judicial</p>
            <p className="text-blue-600 dark:text-blue-400">Diario a las 6:00 AM</p>
          </div>
        </div>
      </div>
    </div>
  )
}
