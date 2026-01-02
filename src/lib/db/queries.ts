import { sql } from './index'
import type { CandidateWithScores, CargoType, Flag } from '@/types/database'

interface CandidateRow {
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
  competence: number | null
  integrity: number | null
  transparency: number | null
  confidence: number | null
  score_balanced: number | null
  score_merit: number | null
  score_integrity: number | null
}

function mapRowToCandidate(row: CandidateRow, flags: Flag[] = []): CandidateWithScores {
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
      competence: Number(row.competence) || 0,
      integrity: Number(row.integrity) || 0,
      transparency: Number(row.transparency) || 0,
      confidence: Number(row.confidence) || 0,
      score_balanced: Number(row.score_balanced) || 0,
      score_merit: Number(row.score_merit) || 0,
      score_integrity: Number(row.score_integrity) || 0,
    },
    flags,
  }
}

/**
 * Get all candidates with scores and flags
 * Filters are applied in-memory for simplicity
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
  // Fetch all active candidates
  const rows = await sql`
    SELECT
      c.id,
      c.slug,
      c.full_name,
      c.photo_url,
      c.cargo,
      c.party_id,
      p.name as party_name,
      p.short_name as party_short_name,
      p.color as party_color,
      c.district_id,
      d.name as district_name,
      d.slug as district_slug,
      s.competence,
      s.integrity,
      s.transparency,
      s.confidence,
      s.score_balanced,
      s.score_merit,
      s.score_integrity
    FROM candidates c
    LEFT JOIN parties p ON c.party_id = p.id
    LEFT JOIN districts d ON c.district_id = d.id
    LEFT JOIN scores s ON c.id = s.candidate_id
    WHERE c.is_active = true
    ORDER BY s.score_balanced DESC NULLS LAST
  `

  if (rows.length === 0) return []

  // Get flags for all candidates
  const candidateIds = rows.map((r) => r.id as string)
  const flags = await sql`
    SELECT * FROM flags WHERE candidate_id = ANY(${candidateIds})
  `

  const flagsByCandidate = flags.reduce<Record<string, Flag[]>>((acc, flag) => {
    const cid = flag.candidate_id as string
    if (!acc[cid]) acc[cid] = []
    acc[cid].push(flag as Flag)
    return acc
  }, {})

  // Map rows to candidates with flags
  let result = rows.map((row) =>
    mapRowToCandidate(row as unknown as CandidateRow, flagsByCandidate[row.id as string] || [])
  )

  // Apply filters in memory
  if (options?.cargo) {
    result = result.filter((c) => c.cargo === options.cargo)
  }

  if (options?.districtSlug) {
    result = result.filter((c) => c.district?.slug === options.districtSlug)
  }

  if (options?.partyId) {
    result = result.filter((c) => c.party?.id === options.partyId)
  }

  if (options?.minConfidence && options.minConfidence > 0) {
    result = result.filter((c) => c.scores.confidence >= options.minConfidence!)
  }

  if (options?.onlyClean) {
    result = result.filter((c) => !c.flags.some((f) => f.severity === 'RED'))
  }

  // Apply limit and offset
  if (options?.offset && options.offset > 0) {
    result = result.slice(options.offset)
  }

  if (options?.limit && options.limit > 0) {
    result = result.slice(0, options.limit)
  }

  return result
}

/**
 * Get a single candidate by slug
 */
export async function getCandidateBySlug(slug: string): Promise<CandidateWithScores | null> {
  const rows = await sql`
    SELECT
      c.id,
      c.slug,
      c.full_name,
      c.photo_url,
      c.cargo,
      c.party_id,
      p.name as party_name,
      p.short_name as party_short_name,
      p.color as party_color,
      c.district_id,
      d.name as district_name,
      d.slug as district_slug,
      s.competence,
      s.integrity,
      s.transparency,
      s.confidence,
      s.score_balanced,
      s.score_merit,
      s.score_integrity
    FROM candidates c
    LEFT JOIN parties p ON c.party_id = p.id
    LEFT JOIN districts d ON c.district_id = d.id
    LEFT JOIN scores s ON c.id = s.candidate_id
    WHERE c.slug = ${slug} AND c.is_active = true
    LIMIT 1
  `

  if (rows.length === 0) return null

  const row = rows[0]

  // Get flags
  const flags = await sql`
    SELECT * FROM flags WHERE candidate_id = ${row.id}
  `

  return mapRowToCandidate(row as unknown as CandidateRow, flags as Flag[])
}

/**
 * Get candidates by IDs (for comparison)
 */
export async function getCandidatesByIds(ids: string[]): Promise<CandidateWithScores[]> {
  if (ids.length === 0) return []

  const rows = await sql`
    SELECT
      c.id,
      c.slug,
      c.full_name,
      c.photo_url,
      c.cargo,
      c.party_id,
      p.name as party_name,
      p.short_name as party_short_name,
      p.color as party_color,
      c.district_id,
      d.name as district_name,
      d.slug as district_slug,
      s.competence,
      s.integrity,
      s.transparency,
      s.confidence,
      s.score_balanced,
      s.score_merit,
      s.score_integrity
    FROM candidates c
    LEFT JOIN parties p ON c.party_id = p.id
    LEFT JOIN districts d ON c.district_id = d.id
    LEFT JOIN scores s ON c.id = s.candidate_id
    WHERE c.id = ANY(${ids}) AND c.is_active = true
  `

  if (rows.length === 0) return []

  // Get flags
  const flags = await sql`
    SELECT * FROM flags WHERE candidate_id = ANY(${ids})
  `

  const flagsByCandidate = flags.reduce<Record<string, Flag[]>>((acc, flag) => {
    const cid = flag.candidate_id as string
    if (!acc[cid]) acc[cid] = []
    acc[cid].push(flag as Flag)
    return acc
  }, {})

  return rows.map((row) =>
    mapRowToCandidate(row as unknown as CandidateRow, flagsByCandidate[row.id as string] || [])
  )
}

/**
 * Get all parties
 */
export async function getParties() {
  const rows = await sql`
    SELECT * FROM parties ORDER BY name
  `
  return rows
}

/**
 * Get all districts
 */
export async function getDistricts() {
  const rows = await sql`
    SELECT * FROM districts ORDER BY name
  `
  return rows
}

/**
 * Get candidate count by cargo
 */
export async function getCandidateCountByCargo(): Promise<Record<CargoType, number>> {
  const rows = await sql`
    SELECT cargo, COUNT(*) as count
    FROM candidates
    WHERE is_active = true
    GROUP BY cargo
  `

  const counts: Record<CargoType, number> = {
    presidente: 0,
    vicepresidente: 0,
    senador: 0,
    diputado: 0,
    parlamento_andino: 0,
  }

  rows.forEach((row) => {
    counts[row.cargo as CargoType] = Number(row.count)
  })

  return counts
}
