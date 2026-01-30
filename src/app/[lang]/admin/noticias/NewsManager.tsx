'use client'

import { useState, useEffect, useCallback } from 'react'

interface NewsItem {
  id: string
  title: string
  url: string
  excerpt: string | null
  source: string
  published_at: string | null
  sentiment: string | null
  relevance_score: number | null
  status: string | null
  moderated_by: string | null
  moderated_at: string | null
  moderation_note: string | null
  candidates: {
    id: string
    full_name: string
    slug: string
    cargo: string
    parties: {
      name: string
      short_name: string | null
    } | null
  } | null
}

interface Counts {
  total: number
  pending: number
  approved: number
  rejected: number
  featured: number
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
  approved: { label: 'Aprobada', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  rejected: { label: 'Rechazada', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
  featured: { label: 'Destacada', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
}

const SENTIMENT_LABELS: Record<string, { label: string; color: string }> = {
  positive: { label: 'Positivo', color: 'text-green-600' },
  neutral: { label: 'Neutral', color: 'text-gray-600' },
  negative: { label: 'Negativo', color: 'text-red-600' },
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function NewsManager() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [counts, setCounts] = useState<Counts>({ total: 0, pending: 0, approved: 0, rejected: 0, featured: 0 })
  const [sources, setSources] = useState<string[]>([])

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [sourceFilter, setSourceFilter] = useState<string>('')
  const [sentimentFilter, setSentimentFilter] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [actionLoading, setActionLoading] = useState(false)

  // Detail modal
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null)
  const [editMode, setEditMode] = useState(false)

  const fetchNews = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', page.toString())
      params.set('limit', '20')
      if (statusFilter) params.set('status', statusFilter)
      if (sourceFilter) params.set('source', sourceFilter)
      if (sentimentFilter) params.set('sentiment', sentimentFilter)
      if (searchQuery) params.set('q', searchQuery)

      const response = await fetch(`/api/admin/news?${params}`)
      const data = await response.json()

      if (response.ok) {
        setNews(data.news || [])
        setTotalPages(data.pagination?.totalPages || 1)
        setCounts(data.counts || { total: 0, pending: 0, approved: 0, rejected: 0, featured: 0 })
        setSources(data.sources || [])
      }
    } catch (error) {
      console.error('Error fetching news:', error)
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter, sourceFilter, sentimentFilter, searchQuery])

  useEffect(() => {
    fetchNews()
  }, [fetchNews])

  const handleBulkAction = async (action: string) => {
    if (selectedIds.size === 0) return
    setActionLoading(true)

    try {
      const response = await fetch('/api/admin/news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ids: Array.from(selectedIds) }),
      })

      if (response.ok) {
        setSelectedIds(new Set())
        fetchNews()
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
        approve: 'approved',
        reject: 'rejected',
        feature: 'featured',
        pending: 'pending',
      }

      const response = await fetch(`/api/admin/news/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: statusMap[action] }),
      })

      if (response.ok) {
        fetchNews()
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
    if (selectedIds.size === news.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(news.map(n => n.id)))
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black uppercase tracking-tight">
          Curación de Noticias
        </h1>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">
          Revisa, aprueba o rechaza noticias antes de mostrarlas en el sitio.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
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
          onClick={() => setStatusFilter('approved')}
          className={`p-4 border-2 border-[var(--border)] transition-all ${statusFilter === 'approved' ? 'bg-green-500 text-white' : 'bg-[var(--card)] hover:bg-[var(--muted)]'}`}
        >
          <div className="text-2xl font-black">{counts.approved}</div>
          <div className="text-xs font-bold uppercase">Aprobadas</div>
        </button>
        <button
          onClick={() => setStatusFilter('rejected')}
          className={`p-4 border-2 border-[var(--border)] transition-all ${statusFilter === 'rejected' ? 'bg-red-500 text-white' : 'bg-[var(--card)] hover:bg-[var(--muted)]'}`}
        >
          <div className="text-2xl font-black">{counts.rejected}</div>
          <div className="text-xs font-bold uppercase">Rechazadas</div>
        </button>
        <button
          onClick={() => setStatusFilter('featured')}
          className={`p-4 border-2 border-[var(--border)] transition-all ${statusFilter === 'featured' ? 'bg-blue-500 text-white' : 'bg-[var(--card)] hover:bg-[var(--muted)]'}`}
        >
          <div className="text-2xl font-black">{counts.featured}</div>
          <div className="text-xs font-bold uppercase">Destacadas</div>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Buscar por título..."
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setPage(1) }}
          className="px-3 py-2 border-2 border-[var(--border)] bg-[var(--background)] text-sm flex-1 min-w-[200px]"
        />
        <select
          value={sourceFilter}
          onChange={(e) => { setSourceFilter(e.target.value); setPage(1) }}
          className="px-3 py-2 border-2 border-[var(--border)] bg-[var(--background)] text-sm"
        >
          <option value="">Todas las fuentes</option>
          {sources.map(source => (
            <option key={source} value={source}>{source}</option>
          ))}
        </select>
        <select
          value={sentimentFilter}
          onChange={(e) => { setSentimentFilter(e.target.value); setPage(1) }}
          className="px-3 py-2 border-2 border-[var(--border)] bg-[var(--background)] text-sm"
        >
          <option value="">Todo sentimiento</option>
          <option value="positive">Positivo</option>
          <option value="neutral">Neutral</option>
          <option value="negative">Negativo</option>
        </select>
      </div>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 p-3 bg-[var(--muted)] border-2 border-[var(--border)]">
          <span className="text-sm font-bold">{selectedIds.size} seleccionadas</span>
          <div className="flex gap-2 ml-auto">
            <button
              onClick={() => handleBulkAction('approve')}
              disabled={actionLoading}
              className="px-3 py-1 text-sm font-bold bg-green-500 text-white hover:bg-green-600 disabled:opacity-50"
            >
              Aprobar
            </button>
            <button
              onClick={() => handleBulkAction('reject')}
              disabled={actionLoading}
              className="px-3 py-1 text-sm font-bold bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
            >
              Rechazar
            </button>
            <button
              onClick={() => handleBulkAction('feature')}
              disabled={actionLoading}
              className="px-3 py-1 text-sm font-bold bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50"
            >
              Destacar
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

      {/* News List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]"></div>
        </div>
      ) : news.length === 0 ? (
        <div className="text-center py-12 text-[var(--muted-foreground)]">
          No hay noticias que coincidan con los filtros.
        </div>
      ) : (
        <div className="bg-[var(--card)] border-2 border-[var(--border)] divide-y divide-[var(--border)]">
          {/* Header Row */}
          <div className="flex items-center gap-4 p-3 bg-[var(--muted)] text-xs font-bold uppercase">
            <input
              type="checkbox"
              checked={selectedIds.size === news.length && news.length > 0}
              onChange={toggleSelectAll}
              className="w-4 h-4"
            />
            <div className="flex-1">Noticia</div>
            <div className="w-24 text-center">Fuente</div>
            <div className="w-24 text-center">Sentimiento</div>
            <div className="w-24 text-center">Estado</div>
            <div className="w-32 text-center">Acciones</div>
          </div>

          {/* News Items */}
          {news.map((item) => (
            <div key={item.id} className="flex items-start gap-4 p-4 hover:bg-[var(--muted)] transition-colors">
              <input
                type="checkbox"
                checked={selectedIds.has(item.id)}
                onChange={() => toggleSelection(item.id)}
                className="w-4 h-4 mt-1"
              />
              <div className="flex-1 min-w-0">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-sm hover:text-[var(--primary)] line-clamp-2"
                >
                  {item.title}
                </a>
                {item.excerpt && (
                  <p className="text-xs text-[var(--muted-foreground)] mt-1 line-clamp-2">
                    {item.excerpt}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-2 text-xs text-[var(--muted-foreground)]">
                  <span>{formatDate(item.published_at)}</span>
                  {item.candidates && (
                    <>
                      <span>•</span>
                      <span className="font-medium">{item.candidates.full_name}</span>
                      {item.candidates.parties && (
                        <span>({item.candidates.parties.short_name || item.candidates.parties.name})</span>
                      )}
                    </>
                  )}
                </div>
              </div>
              <div className="w-24 text-center">
                <span className="text-xs font-medium truncate block">{item.source}</span>
              </div>
              <div className="w-24 text-center">
                {item.sentiment && (
                  <span className={`text-xs font-bold ${SENTIMENT_LABELS[item.sentiment]?.color || ''}`}>
                    {SENTIMENT_LABELS[item.sentiment]?.label || item.sentiment}
                  </span>
                )}
              </div>
              <div className="w-24 text-center">
                <span className={`inline-block px-2 py-1 text-xs font-bold rounded ${STATUS_LABELS[item.status || 'pending']?.color}`}>
                  {STATUS_LABELS[item.status || 'pending']?.label}
                </span>
              </div>
              <div className="w-32 flex items-center justify-center gap-1">
                <button
                  onClick={() => handleSingleAction(item.id, 'approve')}
                  disabled={actionLoading}
                  title="Aprobar"
                  className="p-1.5 hover:bg-green-100 dark:hover:bg-green-900 rounded disabled:opacity-50"
                >
                  ✅
                </button>
                <button
                  onClick={() => handleSingleAction(item.id, 'reject')}
                  disabled={actionLoading}
                  title="Rechazar"
                  className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900 rounded disabled:opacity-50"
                >
                  ❌
                </button>
                <button
                  onClick={() => handleSingleAction(item.id, 'feature')}
                  disabled={actionLoading}
                  title="Destacar"
                  className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900 rounded disabled:opacity-50"
                >
                  ⭐
                </button>
                <button
                  onClick={() => setSelectedNews(item)}
                  title="Ver detalle"
                  className="p-1.5 hover:bg-[var(--muted)] rounded"
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
      {selectedNews && (
        <NewsDetailModal
          news={selectedNews}
          onClose={() => { setSelectedNews(null); setEditMode(false) }}
          onUpdate={() => { setSelectedNews(null); fetchNews() }}
        />
      )}
    </div>
  )
}

// Detail Modal Component
function NewsDetailModal({
  news,
  onClose,
  onUpdate,
}: {
  news: NewsItem
  onClose: () => void
  onUpdate: () => void
}) {
  const [title, setTitle] = useState(news.title)
  const [excerpt, setExcerpt] = useState(news.excerpt || '')
  const [sentiment, setSentiment] = useState(news.sentiment || 'neutral')
  const [note, setNote] = useState(news.moderation_note || '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/admin/news/${news.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          excerpt,
          sentiment,
          moderation_note: note,
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
      <div className="bg-[var(--card)] border-3 border-[var(--border)] shadow-brutal max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b-2 border-[var(--border)]">
          <div className="flex items-start justify-between">
            <h2 className="text-lg font-black uppercase">Editar Noticia</h2>
            <button onClick={onClose} className="text-2xl hover:opacity-70" aria-label="Cerrar modal">×</button>
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
            <label className="block text-sm font-bold uppercase mb-2">Extracto</label>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border-2 border-[var(--border)] bg-[var(--background)]"
            />
          </div>

          <div>
            <label className="block text-sm font-bold uppercase mb-2">Sentimiento</label>
            <select
              value={sentiment}
              onChange={(e) => setSentiment(e.target.value)}
              className="w-full px-3 py-2 border-2 border-[var(--border)] bg-[var(--background)]"
            >
              <option value="positive">Positivo</option>
              <option value="neutral">Neutral</option>
              <option value="negative">Negativo</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold uppercase mb-2">Nota de moderación</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Razón de la decisión..."
              className="w-full px-3 py-2 border-2 border-[var(--border)] bg-[var(--background)]"
            />
          </div>

          <div className="pt-4 border-t border-[var(--border)]">
            <div className="text-xs text-[var(--muted-foreground)] space-y-1">
              <p><strong>Fuente:</strong> {news.source}</p>
              <p><strong>URL:</strong> <a href={news.url} target="_blank" rel="noopener noreferrer" className="text-[var(--primary)] hover:underline">{news.url}</a></p>
              <p><strong>Publicado:</strong> {formatDate(news.published_at)}</p>
              {news.candidates && (
                <p><strong>Candidato:</strong> {news.candidates.full_name}</p>
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
