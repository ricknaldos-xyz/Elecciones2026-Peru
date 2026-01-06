'use client'

import { useState, useEffect, useCallback } from 'react'

interface FlagItem {
  id: string
  candidate_id: string
  type: string
  severity: 'RED' | 'AMBER' | 'GRAY'
  title: string
  description: string | null
  source: string
  evidence_url: string | null
  date_captured: string
  status: string | null
  verified_by: string | null
  verified_at: string | null
  candidates: {
    id: string
    full_name: string
    slug: string
    cargo: string
    photo_url: string | null
    parties: {
      name: string
      short_name: string | null
    } | null
  } | null
}

interface Counts {
  total: number
  pending: number
  verified: number
  rejected: number
  red: number
  amber: number
  gray: number
}

const SEVERITY_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  RED: { bg: 'bg-red-100 dark:bg-red-900', text: 'text-red-800 dark:text-red-200', label: 'Crítico' },
  AMBER: { bg: 'bg-yellow-100 dark:bg-yellow-900', text: 'text-yellow-800 dark:text-yellow-200', label: 'Advertencia' },
  GRAY: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-800 dark:text-gray-200', label: 'Información' },
}

const STATUS_STYLES: Record<string, { bg: string; label: string }> = {
  pending: { bg: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', label: 'Pendiente' },
  verified: { bg: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', label: 'Verificado' },
  rejected: { bg: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', label: 'Rechazado' },
}

const FLAG_TYPE_LABELS: Record<string, string> = {
  PENAL_SENTENCE: 'Sentencia Penal',
  CIVIL_SENTENCE: 'Sentencia Civil',
  VIOLENCE: 'Violencia',
  ALIMENTOS: 'Omisión Alimentos',
  LABORAL: 'Sentencia Laboral',
  CONTRACTUAL: 'Incumplimiento',
  MULTIPLE_RESIGNATIONS: 'Múltiples Renuncias',
  LOW_DATA: 'Datos Incompletos',
  UNDER_REVIEW: 'En Revisión',
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function FlagsManager() {
  const [flags, setFlags] = useState<FlagItem[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [counts, setCounts] = useState<Counts>({ total: 0, pending: 0, verified: 0, rejected: 0, red: 0, amber: 0, gray: 0 })

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [severityFilter, setSeverityFilter] = useState<string>('')

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [actionLoading, setActionLoading] = useState(false)

  // Detail modal
  const [selectedFlag, setSelectedFlag] = useState<FlagItem | null>(null)

  const fetchFlags = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', page.toString())
      params.set('limit', '20')
      if (statusFilter) params.set('status', statusFilter)
      if (severityFilter) params.set('severity', severityFilter)

      const response = await fetch(`/api/admin/flags?${params}`)
      const data = await response.json()

      if (response.ok) {
        setFlags(data.flags || [])
        setTotalPages(data.pagination?.totalPages || 1)
        setCounts(data.counts || { total: 0, pending: 0, verified: 0, rejected: 0, red: 0, amber: 0, gray: 0 })
      }
    } catch (error) {
      console.error('Error fetching flags:', error)
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter, severityFilter])

  useEffect(() => {
    fetchFlags()
  }, [fetchFlags])

  const handleBulkAction = async (action: string) => {
    if (selectedIds.size === 0) return
    setActionLoading(true)

    try {
      const response = await fetch('/api/admin/flags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ids: Array.from(selectedIds) }),
      })

      if (response.ok) {
        setSelectedIds(new Set())
        fetchFlags()
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setActionLoading(false)
    }
  }

  const handleSingleAction = async (id: string, action: string) => {
    setActionLoading(true)
    try {
      const statusMap: Record<string, string> = {
        verify: 'verified',
        reject: 'rejected',
        pending: 'pending',
      }

      const response = await fetch(`/api/admin/flags/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: statusMap[action] }),
      })

      if (response.ok) {
        fetchFlags()
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setActionLoading(false)
    }
  }

  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedIds)
    if (newSelection.has(id)) {
      newSelection.delete(id)
    } else {
      newSelection.add(id)
    }
    setSelectedIds(newSelection)
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === flags.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(flags.map(f => f.id)))
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black uppercase tracking-tight">
          Gestión de Alertas
        </h1>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">
          Verifica las alertas de riesgo antes de mostrarlas públicamente.
        </p>
      </div>

      {/* Stats by Status */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button
          onClick={() => setStatusFilter('')}
          className={`p-4 border-2 border-[var(--border)] transition-all ${!statusFilter ? 'bg-[var(--primary)] text-[var(--primary-foreground)]' : 'bg-[var(--card)] hover:bg-[var(--muted)]'}`}
        >
          <div className="text-2xl font-black">{counts.total}</div>
          <div className="text-xs font-bold uppercase">Total</div>
        </button>
        <button
          onClick={() => setStatusFilter('pending')}
          className={`p-4 border-2 border-[var(--border)] transition-all ${statusFilter === 'pending' ? 'bg-yellow-500 text-white' : 'bg-[var(--card)] hover:bg-[var(--muted)]'}`}
        >
          <div className="text-2xl font-black">{counts.pending}</div>
          <div className="text-xs font-bold uppercase">Pendientes</div>
        </button>
        <button
          onClick={() => setStatusFilter('verified')}
          className={`p-4 border-2 border-[var(--border)] transition-all ${statusFilter === 'verified' ? 'bg-green-500 text-white' : 'bg-[var(--card)] hover:bg-[var(--muted)]'}`}
        >
          <div className="text-2xl font-black">{counts.verified}</div>
          <div className="text-xs font-bold uppercase">Verificados</div>
        </button>
        <button
          onClick={() => setStatusFilter('rejected')}
          className={`p-4 border-2 border-[var(--border)] transition-all ${statusFilter === 'rejected' ? 'bg-red-500 text-white' : 'bg-[var(--card)] hover:bg-[var(--muted)]'}`}
        >
          <div className="text-2xl font-black">{counts.rejected}</div>
          <div className="text-xs font-bold uppercase">Rechazados</div>
        </button>
      </div>

      {/* Stats by Severity */}
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => setSeverityFilter(severityFilter === 'RED' ? '' : 'RED')}
          className={`p-3 border-2 transition-all ${severityFilter === 'RED' ? 'border-red-500 bg-red-500 text-white' : 'border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)]'}`}
        >
          <div className="text-xl font-black">{counts.red}</div>
          <div className="text-xs font-bold uppercase">Críticos (RED)</div>
        </button>
        <button
          onClick={() => setSeverityFilter(severityFilter === 'AMBER' ? '' : 'AMBER')}
          className={`p-3 border-2 transition-all ${severityFilter === 'AMBER' ? 'border-yellow-500 bg-yellow-500 text-white' : 'border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)]'}`}
        >
          <div className="text-xl font-black">{counts.amber}</div>
          <div className="text-xs font-bold uppercase">Advertencia (AMBER)</div>
        </button>
        <button
          onClick={() => setSeverityFilter(severityFilter === 'GRAY' ? '' : 'GRAY')}
          className={`p-3 border-2 transition-all ${severityFilter === 'GRAY' ? 'border-gray-500 bg-gray-500 text-white' : 'border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)]'}`}
        >
          <div className="text-xl font-black">{counts.gray}</div>
          <div className="text-xs font-bold uppercase">Info (GRAY)</div>
        </button>
      </div>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 p-3 bg-[var(--muted)] border-2 border-[var(--border)]">
          <span className="text-sm font-bold">{selectedIds.size} seleccionados</span>
          <div className="flex gap-2 ml-auto">
            <button
              onClick={() => handleBulkAction('verify')}
              disabled={actionLoading}
              className="px-3 py-1 text-sm font-bold bg-green-500 text-white hover:bg-green-600 disabled:opacity-50"
            >
              Verificar
            </button>
            <button
              onClick={() => handleBulkAction('reject')}
              disabled={actionLoading}
              className="px-3 py-1 text-sm font-bold bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
            >
              Rechazar
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="px-3 py-1 text-sm font-bold bg-[var(--background)] border border-[var(--border)]"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Flags List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]"></div>
        </div>
      ) : flags.length === 0 ? (
        <div className="text-center py-12 text-[var(--muted-foreground)]">
          No hay alertas que coincidan con los filtros.
        </div>
      ) : (
        <div className="space-y-3">
          {flags.map((flag) => (
            <div
              key={flag.id}
              className={`flex items-start gap-4 p-4 border-2 border-[var(--border)] ${SEVERITY_STYLES[flag.severity]?.bg || ''}`}
            >
              <input
                type="checkbox"
                checked={selectedIds.has(flag.id)}
                onChange={() => toggleSelection(flag.id)}
                className="w-4 h-4 mt-1"
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 text-xs font-bold rounded ${SEVERITY_STYLES[flag.severity]?.text}`}>
                        {flag.severity}
                      </span>
                      <span className="text-xs font-medium text-[var(--muted-foreground)]">
                        {FLAG_TYPE_LABELS[flag.type] || flag.type}
                      </span>
                    </div>
                    <h3 className="font-bold">{flag.title}</h3>
                    {flag.description && (
                      <p className="text-sm text-[var(--muted-foreground)] mt-1">{flag.description}</p>
                    )}
                  </div>

                  <span className={`px-2 py-1 text-xs font-bold rounded whitespace-nowrap ${STATUS_STYLES[flag.status || 'pending']?.bg}`}>
                    {STATUS_STYLES[flag.status || 'pending']?.label}
                  </span>
                </div>

                <div className="flex items-center gap-4 mt-3 text-xs text-[var(--muted-foreground)]">
                  {flag.candidates && (
                    <span className="font-medium">
                      {flag.candidates.full_name}
                      {flag.candidates.parties && ` (${flag.candidates.parties.short_name || flag.candidates.parties.name})`}
                    </span>
                  )}
                  <span>Fuente: {flag.source}</span>
                  <span>{formatDate(flag.date_captured)}</span>
                  {flag.evidence_url && (
                    <a href={flag.evidence_url} target="_blank" rel="noopener noreferrer" className="text-[var(--primary)] hover:underline">
                      Ver evidencia
                    </a>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleSingleAction(flag.id, 'verify')}
                  disabled={actionLoading}
                  title="Verificar"
                  className="p-2 hover:bg-green-200 dark:hover:bg-green-800 rounded disabled:opacity-50"
                >
                  ✅
                </button>
                <button
                  onClick={() => handleSingleAction(flag.id, 'reject')}
                  disabled={actionLoading}
                  title="Rechazar"
                  className="p-2 hover:bg-red-200 dark:hover:bg-red-800 rounded disabled:opacity-50"
                >
                  ❌
                </button>
                <button
                  onClick={() => setSelectedFlag(flag)}
                  title="Editar"
                  className="p-2 hover:bg-[var(--muted)] rounded"
                >
                  ✏️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border-2 border-[var(--border)] font-bold disabled:opacity-50"
          >
            Anterior
          </button>
          <span className="px-4 py-2 text-sm font-medium">
            Página {page} de {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 border-2 border-[var(--border)] font-bold disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      )}

      {/* Detail Modal */}
      {selectedFlag && (
        <FlagDetailModal
          flag={selectedFlag}
          onClose={() => setSelectedFlag(null)}
          onUpdate={() => { setSelectedFlag(null); fetchFlags() }}
        />
      )}
    </div>
  )
}

// Detail Modal
function FlagDetailModal({
  flag,
  onClose,
  onUpdate,
}: {
  flag: FlagItem
  onClose: () => void
  onUpdate: () => void
}) {
  const [title, setTitle] = useState(flag.title)
  const [description, setDescription] = useState(flag.description || '')
  const [severity, setSeverity] = useState(flag.severity)
  const [evidenceUrl, setEvidenceUrl] = useState(flag.evidence_url || '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/admin/flags/${flag.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          severity,
          evidence_url: evidenceUrl || null,
        }),
      })

      if (response.ok) {
        onUpdate()
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--card)] border-3 border-[var(--border)] shadow-brutal max-w-xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b-2 border-[var(--border)]">
          <div className="flex items-start justify-between">
            <h2 className="text-lg font-black uppercase">Editar Alerta</h2>
            <button onClick={onClose} className="text-2xl hover:opacity-70">×</button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-bold uppercase mb-2">Título</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border-2 border-[var(--border)] bg-[var(--background)]"
            />
          </div>

          <div>
            <label className="block text-sm font-bold uppercase mb-2">Descripción</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border-2 border-[var(--border)] bg-[var(--background)]"
            />
          </div>

          <div>
            <label className="block text-sm font-bold uppercase mb-2">Severidad</label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value as 'RED' | 'AMBER' | 'GRAY')}
              className="w-full px-3 py-2 border-2 border-[var(--border)] bg-[var(--background)]"
            >
              <option value="RED">RED - Crítico</option>
              <option value="AMBER">AMBER - Advertencia</option>
              <option value="GRAY">GRAY - Información</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold uppercase mb-2">URL de Evidencia</label>
            <input
              type="url"
              value={evidenceUrl}
              onChange={(e) => setEvidenceUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 border-2 border-[var(--border)] bg-[var(--background)]"
            />
          </div>

          <div className="pt-4 border-t border-[var(--border)]">
            <div className="text-xs text-[var(--muted-foreground)] space-y-1">
              <p><strong>Tipo:</strong> {FLAG_TYPE_LABELS[flag.type] || flag.type}</p>
              <p><strong>Fuente:</strong> {flag.source}</p>
              <p><strong>Fecha:</strong> {formatDate(flag.date_captured)}</p>
              {flag.candidates && (
                <p><strong>Candidato:</strong> {flag.candidates.full_name}</p>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 border-t-2 border-[var(--border)] flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 font-bold border-2 border-[var(--border)]"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 font-bold bg-[var(--primary)] text-[var(--primary-foreground)] border-2 border-[var(--border)] disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}
