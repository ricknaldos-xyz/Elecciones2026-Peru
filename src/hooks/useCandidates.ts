'use client'

import { useState, useEffect, useCallback } from 'react'
import type { CandidateWithScores, CargoType } from '@/types/database'

interface UseCandidatesOptions {
  cargo?: CargoType
  distrito?: string
  partyId?: string
  minConfidence?: number
  onlyClean?: boolean
}

interface UseCandidatesResult {
  candidates: CandidateWithScores[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useCandidates(options: UseCandidatesOptions = {}): UseCandidatesResult {
  const [candidates, setCandidates] = useState<CandidateWithScores[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCandidates = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (options.cargo) params.set('cargo', options.cargo)
      if (options.distrito) params.set('distrito', options.distrito)
      if (options.partyId) params.set('partido', options.partyId)
      if (options.minConfidence) params.set('minConfidence', options.minConfidence.toString())
      if (options.onlyClean) params.set('onlyClean', 'true')

      const response = await fetch(`/api/candidates?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to fetch candidates')
      }
      const data = await response.json()
      setCandidates(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching candidates')
      setCandidates([])
    } finally {
      setLoading(false)
    }
  }, [options.cargo, options.distrito, options.partyId, options.minConfidence, options.onlyClean])

  useEffect(() => {
    fetchCandidates()
  }, [fetchCandidates])

  return { candidates, loading, error, refetch: fetchCandidates }
}

export function useCandidatesByIds(ids: string[]): UseCandidatesResult {
  const [candidates, setCandidates] = useState<CandidateWithScores[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCandidates = useCallback(async () => {
    if (ids.length === 0) {
      setCandidates([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/candidates/by-ids?ids=${ids.join(',')}`)
      if (!response.ok) {
        throw new Error('Failed to fetch candidates')
      }
      const data = await response.json()
      setCandidates(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching candidates')
      setCandidates([])
    } finally {
      setLoading(false)
    }
  }, [ids.join(',')])

  useEffect(() => {
    fetchCandidates()
  }, [fetchCandidates])

  return { candidates, loading, error, refetch: fetchCandidates }
}
