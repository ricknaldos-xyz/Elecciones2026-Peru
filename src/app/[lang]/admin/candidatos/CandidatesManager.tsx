'use client'

import { useState, useEffect, useCallback } from 'react'

interface Candidate {
  id: string
  slug: string
  full_name: string
  photo_url: string | null
  cargo: string
  birth_date: string | null
  education_level: string | null
  is_active: boolean
  data_source: string | null
  data_verified: boolean
  last_updated: string
  parties: { id: string; name: string; short_name: string | null } | null
  districts: { id: string; name: string } | null
}

interface Party { id: string; name: string; short_name: string | null }
interface District { id: string; name: string }

const CARGO_LABELS: Record<string, string> = {
  presidente: 'Presidente',
  vicepresidente: 'Vicepresidente',
  senador: 'Senador',
  diputado: 'Diputado',
  parlamento_andino: 'Parlamento Andino',
}

export function CandidatesManager() {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [parties, setParties] = useState<Party[]>([])
  const [districts, setDistricts] = useState<District[]>([])

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [cargoFilter, setCargoFilter] = useState('')
  const [partyFilter, setPartyFilter] = useState('')

  // Edit modal
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)

  const fetchCandidates = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', page.toString())
      params.set('limit', '20')
      if (searchQuery) params.set('q', searchQuery)
      if (cargoFilter) params.set('cargo', cargoFilter)
      if (partyFilter) params.set('party_id', partyFilter)

      const response = await fetch(`/api/admin/candidates?${params}`)
      const data = await response.json()

      if (response.ok) {
        setCandidates(data.candidates || [])
        setTotalPages(data.pagination?.totalPages || 1)
        setCounts(data.counts || {})
        setParties(data.parties || [])
        setDistricts(data.districts || [])
      }
    } catch (error) {
      console.error('Error fetching candidates:', error)
    } finally {
      setLoading(false)
    }
  }, [page, searchQuery, cargoFilter, partyFilter])

  useEffect(() => {
    fetchCandidates()
  }, [fetchCandidates])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black uppercase tracking-tight">
          Gestión de Candidatos
        </h1>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">
          Edita y corrige datos de candidatos.
        </p>
      </div>

      {/* Stats by Cargo */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <button
          onClick={() => setCargoFilter('')}
          className={`p-3 border-2 border-[var(--border)] transition-all ${!cargoFilter ? 'bg-[var(--primary)] text-[var(--primary-foreground)]' : 'bg-[var(--card)] hover:bg-[var(--muted)]'}`}
        >
          <div className="text-xl font-black">{counts.total || 0}</div>
          <div className="text-xs font-bold uppercase">Total</div>
        </button>
        {Object.entries(CARGO_LABELS).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setCargoFilter(cargoFilter === key ? '' : key)}
            className={`p-3 border-2 border-[var(--border)] transition-all ${cargoFilter === key ? 'bg-[var(--primary)] text-[var(--primary-foreground)]' : 'bg-[var(--card)] hover:bg-[var(--muted)]'}`}
          >
            <div className="text-xl font-black">{counts[key] || 0}</div>
            <div className="text-xs font-bold uppercase truncate">{label}</div>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Buscar por nombre..."
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setPage(1) }}
          className="px-3 py-2 border-2 border-[var(--border)] bg-[var(--background)] text-sm flex-1 min-w-[200px]"
        />
        <select
          value={partyFilter}
          onChange={(e) => { setPartyFilter(e.target.value); setPage(1) }}
          className="px-3 py-2 border-2 border-[var(--border)] bg-[var(--background)] text-sm"
        >
          <option value="">Todos los partidos</option>
          {parties.map(party => (
            <option key={party.id} value={party.id}>
              {party.short_name || party.name}
            </option>
          ))}
        </select>
      </div>

      {/* Candidates List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]"></div>
        </div>
      ) : candidates.length === 0 ? (
        <div className="text-center py-12 text-[var(--muted-foreground)]">
          No hay candidatos que coincidan con los filtros.
        </div>
      ) : (
        <div className="bg-[var(--card)] border-2 border-[var(--border)] divide-y divide-[var(--border)]">
          {candidates.map((candidate) => (
            <div
              key={candidate.id}
              className="flex items-center gap-4 p-4 hover:bg-[var(--muted)] transition-colors"
            >
              {/* Photo */}
              <div className="w-12 h-12 rounded-full bg-[var(--muted)] overflow-hidden flex-shrink-0">
                {candidate.photo_url ? (
                  <img
                    src={candidate.photo_url}
                    alt={candidate.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xl">
                    👤
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold truncate">{candidate.full_name}</span>
                  {candidate.data_verified && (
                    <span className="text-green-600" title="Verificado">✓</span>
                  )}
                  {!candidate.is_active && (
                    <span className="text-xs bg-gray-200 dark:bg-gray-700 px-1 rounded">Inactivo</span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                  <span className="font-medium">{CARGO_LABELS[candidate.cargo] || candidate.cargo}</span>
                  {candidate.parties && (
                    <>
                      <span>•</span>
                      <span>{candidate.parties.short_name || candidate.parties.name}</span>
                    </>
                  )}
                  {candidate.districts && (
                    <>
                      <span>•</span>
                      <span>{candidate.districts.name}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Data Quality */}
              <div className="hidden md:flex items-center gap-3 text-xs">
                <div className={`px-2 py-1 rounded ${candidate.data_source === 'jne' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'}`}>
                  {candidate.data_source || 'Sin fuente'}
                </div>
              </div>

              {/* Actions */}
              <button
                onClick={() => setSelectedCandidate(candidate)}
                className="px-3 py-1.5 text-sm font-bold border-2 border-[var(--border)] hover:bg-[var(--muted)]"
              >
                Editar
              </button>
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

      {/* Edit Modal */}
      {selectedCandidate && (
        <CandidateEditModal
          candidate={selectedCandidate}
          onClose={() => setSelectedCandidate(null)}
          onUpdate={() => { setSelectedCandidate(null); fetchCandidates() }}
        />
      )}
    </div>
  )
}

// Edit Modal
function CandidateEditModal({
  candidate,
  onClose,
  onUpdate,
}: {
  candidate: Candidate
  onClose: () => void
  onUpdate: () => void
}) {
  const [fullName, setFullName] = useState(candidate.full_name)
  const [photoUrl, setPhotoUrl] = useState(candidate.photo_url || '')
  const [birthDate, setBirthDate] = useState(candidate.birth_date || '')
  const [educationLevel, setEducationLevel] = useState(candidate.education_level || '')
  const [isActive, setIsActive] = useState(candidate.is_active)
  const [dataVerified, setDataVerified] = useState(candidate.data_verified)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/admin/candidates/${candidate.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          photo_url: photoUrl || null,
          birth_date: birthDate || null,
          education_level: educationLevel || null,
          is_active: isActive,
          data_verified: dataVerified,
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
            <h2 className="text-lg font-black uppercase">Editar Candidato</h2>
            <button onClick={onClose} className="text-2xl hover:opacity-70">×</button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-bold uppercase mb-2">Nombre completo</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 border-2 border-[var(--border)] bg-[var(--background)]"
            />
          </div>

          <div>
            <label className="block text-sm font-bold uppercase mb-2">URL de foto</label>
            <input
              type="url"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 border-2 border-[var(--border)] bg-[var(--background)]"
            />
          </div>

          <div>
            <label className="block text-sm font-bold uppercase mb-2">Fecha de nacimiento</label>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="w-full px-3 py-2 border-2 border-[var(--border)] bg-[var(--background)]"
            />
          </div>

          <div>
            <label className="block text-sm font-bold uppercase mb-2">Nivel educativo</label>
            <select
              value={educationLevel}
              onChange={(e) => setEducationLevel(e.target.value)}
              className="w-full px-3 py-2 border-2 border-[var(--border)] bg-[var(--background)]"
            >
              <option value="">Sin información</option>
              <option value="primaria_completa">Primaria completa</option>
              <option value="secundaria_incompleta">Secundaria incompleta</option>
              <option value="secundaria_completa">Secundaria completa</option>
              <option value="tecnico_incompleto">Técnico incompleto</option>
              <option value="tecnico_completo">Técnico completo</option>
              <option value="universitario_incompleto">Universitario incompleto</option>
              <option value="universitario_completo">Universitario completo</option>
              <option value="titulo_profesional">Título profesional</option>
              <option value="maestria">Maestría</option>
              <option value="doctorado">Doctorado</option>
            </select>
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium">Activo</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={dataVerified}
                onChange={(e) => setDataVerified(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium">Datos verificados</span>
            </label>
          </div>

          <div className="pt-4 border-t border-[var(--border)]">
            <div className="text-xs text-[var(--muted-foreground)] space-y-1">
              <p><strong>Cargo:</strong> {CARGO_LABELS[candidate.cargo] || candidate.cargo}</p>
              <p><strong>Partido:</strong> {candidate.parties?.name || 'Sin partido'}</p>
              <p><strong>Distrito:</strong> {candidate.districts?.name || 'Sin distrito'}</p>
              <p><strong>Fuente:</strong> {candidate.data_source || 'Desconocida'}</p>
              <p><strong>Slug:</strong> {candidate.slug}</p>
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
