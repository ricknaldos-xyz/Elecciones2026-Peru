import { createClient } from './client'
import type { CandidateWithScores, CargoType, Flag } from '@/types/database'

const supabase = createClient()

/**
 * Get all candidates with scores and flags
 */
export async function getCandidates(options?: {
  cargo?: CargoType
  districtSlug?: string
  partyId?: string
  minConfidence?: number
  onlyClean?: boolean
  limit?: number
  offset?: number
}): Promise<CandidateWithScores[]> {
  let query = supabase
    .from('ranking_view')
    .select('*')

  if (options?.cargo) {
    query = query.eq('cargo', options.cargo)
  }

  if (options?.districtSlug) {
    query = query.eq('district_slug', options.districtSlug)
  }

  if (options?.partyId) {
    query = query.eq('party_id', options.partyId)
  }

  if (options?.minConfidence) {
    query = query.gte('confidence', options.minConfidence)
  }

  if (options?.onlyClean) {
    query = query.eq('red_flags_count', 0)
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
  }

  const { data, error } = await query.order('score_balanced', { ascending: false })

  if (error) {
    console.error('Error fetching candidates:', error)
    return []
  }

  // Fetch flags for each candidate
  const candidateIds = data.map((c: { id: string }) => c.id)
  const { data: flags } = await supabase
    .from('flags')
    .select('*')
    .in('candidate_id', candidateIds)

  const flagsByCandidate = (flags || []).reduce((acc: Record<string, Flag[]>, flag: Flag & { candidate_id: string }) => {
    if (!acc[flag.candidate_id]) {
      acc[flag.candidate_id] = []
    }
    acc[flag.candidate_id].push(flag)
    return acc
  }, {})

  return data.map((row: Record<string, unknown>) => ({
    id: row.id as string,
    slug: row.slug as string,
    full_name: row.full_name as string,
    photo_url: row.photo_url as string | null,
    cargo: row.cargo as CargoType,
    party: row.party_id ? {
      id: row.party_id as string,
      name: row.party_name as string,
      short_name: row.party_short_name as string | null,
      color: row.party_color as string | null,
    } : null,
    district: row.district_id ? {
      id: row.district_id as string,
      name: row.district_name as string,
      slug: row.district_slug as string,
    } : null,
    scores: {
      competence: row.competence as number,
      integrity: row.integrity as number,
      transparency: row.transparency as number,
      confidence: row.confidence as number,
      score_balanced: row.score_balanced as number,
      score_merit: row.score_merit as number,
      score_integrity: row.score_integrity as number,
    },
    flags: flagsByCandidate[row.id as string] || [],
  }))
}

/**
 * Get a single candidate by slug
 */
export async function getCandidateBySlug(slug: string): Promise<CandidateWithScores | null> {
  const { data, error } = await supabase
    .from('candidates_full')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error || !data) {
    console.error('Error fetching candidate:', error)
    return null
  }

  // Fetch flags
  const { data: flags } = await supabase
    .from('flags')
    .select('*')
    .eq('candidate_id', data.id)

  return {
    id: data.id,
    slug: data.slug,
    full_name: data.full_name,
    photo_url: data.photo_url,
    cargo: data.cargo,
    party: data.party_id ? {
      id: data.party_id,
      name: data.party_name,
      short_name: data.party_short_name,
      color: data.party_color,
    } : null,
    district: data.district_id ? {
      id: data.district_id,
      name: data.district_name,
      slug: data.district_slug,
    } : null,
    scores: {
      competence: data.competence,
      integrity: data.integrity,
      transparency: data.transparency,
      confidence: data.confidence,
      score_balanced: data.score_balanced,
      score_merit: data.score_merit,
      score_integrity: data.score_integrity,
    },
    flags: flags || [],
  }
}

/**
 * Get candidates by IDs (for comparison)
 */
export async function getCandidatesByIds(ids: string[]): Promise<CandidateWithScores[]> {
  const { data, error } = await supabase
    .from('candidates_full')
    .select('*')
    .in('id', ids)

  if (error || !data) {
    console.error('Error fetching candidates:', error)
    return []
  }

  // Fetch flags
  const { data: flags } = await supabase
    .from('flags')
    .select('*')
    .in('candidate_id', ids)

  const flagsByCandidate = (flags || []).reduce((acc: Record<string, Flag[]>, flag: Flag & { candidate_id: string }) => {
    if (!acc[flag.candidate_id]) {
      acc[flag.candidate_id] = []
    }
    acc[flag.candidate_id].push(flag)
    return acc
  }, {})

  return data.map((row) => ({
    id: row.id,
    slug: row.slug,
    full_name: row.full_name,
    photo_url: row.photo_url,
    cargo: row.cargo,
    party: row.party_id ? {
      id: row.party_id,
      name: row.party_name,
      short_name: row.party_short_name,
      color: row.party_color,
    } : null,
    district: row.district_id ? {
      id: row.district_id,
      name: row.district_name,
      slug: row.district_slug,
    } : null,
    scores: {
      competence: row.competence,
      integrity: row.integrity,
      transparency: row.transparency,
      confidence: row.confidence,
      score_balanced: row.score_balanced,
      score_merit: row.score_merit,
      score_integrity: row.score_integrity,
    },
    flags: flagsByCandidate[row.id] || [],
  }))
}

/**
 * Get all parties
 */
export async function getParties() {
  const { data, error } = await supabase
    .from('parties')
    .select('*')
    .order('name')

  if (error) {
    console.error('Error fetching parties:', error)
    return []
  }

  return data
}

/**
 * Get all districts
 */
export async function getDistricts() {
  const { data, error } = await supabase
    .from('districts')
    .select('*')
    .order('name')

  if (error) {
    console.error('Error fetching districts:', error)
    return []
  }

  return data
}

/**
 * Get candidate count by cargo
 */
export async function getCandidateCountByCargo(): Promise<Record<CargoType, number>> {
  const { data, error } = await supabase
    .from('candidates')
    .select('cargo')
    .eq('is_active', true)

  if (error) {
    console.error('Error fetching counts:', error)
    return {
      presidente: 0,
      vicepresidente: 0,
      senador: 0,
      diputado: 0,
      parlamento_andino: 0,
    }
  }

  const counts: Record<CargoType, number> = {
    presidente: 0,
    vicepresidente: 0,
    senador: 0,
    diputado: 0,
    parlamento_andino: 0,
  }

  data.forEach((row) => {
    counts[row.cargo as CargoType]++
  })

  return counts
}
