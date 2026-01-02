import { createClient } from './client'
import type { CandidateWithScores, CargoType, Flag } from '@/types/database'

const supabase = createClient()

// Type for ranking view row
interface RankingViewRow {
  id: string
  slug: string
  full_name: string
  photo_url: string | null
  cargo: CargoType
  party_id: string | null
  party_name: string | null
  party_short_name: string | null
  party_color: string | null
  district_id: string | null
  district_name: string | null
  district_slug: string | null
  competence: number
  integrity: number
  transparency: number
  confidence: number
  score_balanced: number
  score_merit: number
  score_integrity: number
  red_flags_count: number
  amber_flags_count: number
  total_flags_count: number
}

// Type for flag with candidate_id
interface FlagRow extends Flag {
  candidate_id: string
}

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

  if (error || !data) {
    console.error('Error fetching candidates:', error)
    return []
  }

  const rows = data as RankingViewRow[]

  // Fetch flags for each candidate
  const candidateIds = rows.map((c) => c.id)
  const { data: flagsData } = await supabase
    .from('flags')
    .select('*')
    .in('candidate_id', candidateIds)

  const flags = (flagsData || []) as FlagRow[]
  const flagsByCandidate = flags.reduce<Record<string, Flag[]>>((acc, flag) => {
    if (!acc[flag.candidate_id]) {
      acc[flag.candidate_id] = []
    }
    acc[flag.candidate_id].push(flag)
    return acc
  }, {})

  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    full_name: row.full_name,
    photo_url: row.photo_url,
    cargo: row.cargo,
    party: row.party_id ? {
      id: row.party_id,
      name: row.party_name || '',
      short_name: row.party_short_name,
      color: row.party_color,
    } : null,
    district: row.district_id ? {
      id: row.district_id,
      name: row.district_name || '',
      slug: row.district_slug || '',
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

  const row = data as RankingViewRow

  // Fetch flags
  const { data: flagsData } = await supabase
    .from('flags')
    .select('*')
    .eq('candidate_id', row.id)

  const flags = (flagsData || []) as FlagRow[]

  return {
    id: row.id,
    slug: row.slug,
    full_name: row.full_name,
    photo_url: row.photo_url,
    cargo: row.cargo,
    party: row.party_id ? {
      id: row.party_id,
      name: row.party_name || '',
      short_name: row.party_short_name,
      color: row.party_color,
    } : null,
    district: row.district_id ? {
      id: row.district_id,
      name: row.district_name || '',
      slug: row.district_slug || '',
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
    flags: flags,
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

  const rows = data as RankingViewRow[]

  // Fetch flags
  const { data: flagsData } = await supabase
    .from('flags')
    .select('*')
    .in('candidate_id', ids)

  const flags = (flagsData || []) as FlagRow[]
  const flagsByCandidate = flags.reduce<Record<string, Flag[]>>((acc, flag) => {
    if (!acc[flag.candidate_id]) {
      acc[flag.candidate_id] = []
    }
    acc[flag.candidate_id].push(flag)
    return acc
  }, {})

  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    full_name: row.full_name,
    photo_url: row.photo_url,
    cargo: row.cargo,
    party: row.party_id ? {
      id: row.party_id,
      name: row.party_name || '',
      short_name: row.party_short_name,
      color: row.party_color,
    } : null,
    district: row.district_id ? {
      id: row.district_id,
      name: row.district_name || '',
      slug: row.district_slug || '',
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

  if (error || !data) {
    console.error('Error fetching counts:', error)
    return {
      presidente: 0,
      vicepresidente: 0,
      senador: 0,
      diputado: 0,
      parlamento_andino: 0,
    }
  }

  const rows = data as Array<{ cargo: string }>

  const counts: Record<CargoType, number> = {
    presidente: 0,
    vicepresidente: 0,
    senador: 0,
    diputado: 0,
    parlamento_andino: 0,
  }

  rows.forEach((row) => {
    counts[row.cargo as CargoType]++
  })

  return counts
}
