import { sql } from './index'
import type { CandidateWithScores, CargoType, Flag, ScoreBreakdown, CivilPenalty } from '@/types/database'

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
  data_verified: boolean | null
  data_source: string | null
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
    data_verified: row.data_verified ?? false,
    data_source: row.data_source,
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
      s.score_integrity,
      c.data_verified,
      c.data_source
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
      s.score_integrity,
      c.data_verified,
      c.data_source
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

/**
 * Get score breakdown for a candidate
 */
// ===========================================
// PARTY FINANCE QUERIES
// ===========================================

export interface PartyFinance {
  id: string
  party_id: string
  year: number
  public_funding: number
  private_funding_total: number
  donor_count: number
  campaign_expenses: number
  operational_expenses: number
  total_income: number
  total_expenses: number
  source_url: string | null
  last_updated: string
}

export interface PartyDonor {
  id: string
  party_id: string
  year: number
  donor_type: 'natural' | 'juridica'
  donor_name: string
  donor_ruc: string | null
  amount: number
  donation_type: 'efectivo' | 'especie' | 'servicios'
  donation_date: string | null
  is_verified: boolean
  source: string | null
}

export interface PartyExpense {
  id: string
  party_id: string
  year: number
  campaign_id: string | null
  category: string
  subcategory: string | null
  description: string | null
  amount: number
  expense_date: string | null
  vendor_name: string | null
  vendor_ruc: string | null
  source: string | null
}

export interface PartyFinanceSummary {
  party: {
    id: string
    name: string
    short_name: string | null
    logo_url: string | null
    color: string | null
  }
  finances: PartyFinance[]
  topDonors: PartyDonor[]
  expensesByCategory: {
    category: string
    total_amount: number
    transaction_count: number
  }[]
  totals: {
    totalPublicFunding: number
    totalPrivateFunding: number
    totalExpenses: number
    donorCount: number
  }
}

/**
 * Get party by ID
 */
export async function getPartyById(id: string) {
  const rows = await sql`
    SELECT * FROM parties WHERE id = ${id} LIMIT 1
  `
  return rows.length > 0 ? rows[0] : null
}

/**
 * Get party finance summary
 */
export async function getPartyFinances(partyId: string, year?: number): Promise<PartyFinance[]> {
  if (year) {
    const rows = await sql`
      SELECT
        id,
        party_id,
        year,
        public_funding,
        private_funding_total,
        donor_count,
        campaign_expenses,
        operational_expenses,
        (COALESCE(public_funding, 0) + COALESCE(private_funding_total, 0)) as total_income,
        (COALESCE(campaign_expenses, 0) + COALESCE(operational_expenses, 0)) as total_expenses,
        source_url,
        last_updated
      FROM party_finances
      WHERE party_id = ${partyId} AND year = ${year}
      ORDER BY year DESC
    `
    return rows.map(r => ({
      ...r,
      public_funding: Number(r.public_funding) || 0,
      private_funding_total: Number(r.private_funding_total) || 0,
      donor_count: Number(r.donor_count) || 0,
      campaign_expenses: Number(r.campaign_expenses) || 0,
      operational_expenses: Number(r.operational_expenses) || 0,
      total_income: Number(r.total_income) || 0,
      total_expenses: Number(r.total_expenses) || 0,
    })) as PartyFinance[]
  }

  const rows = await sql`
    SELECT
      id,
      party_id,
      year,
      public_funding,
      private_funding_total,
      donor_count,
      campaign_expenses,
      operational_expenses,
      (COALESCE(public_funding, 0) + COALESCE(private_funding_total, 0)) as total_income,
      (COALESCE(campaign_expenses, 0) + COALESCE(operational_expenses, 0)) as total_expenses,
      source_url,
      last_updated
    FROM party_finances
    WHERE party_id = ${partyId}
    ORDER BY year DESC
  `
  return rows.map(r => ({
    ...r,
    public_funding: Number(r.public_funding) || 0,
    private_funding_total: Number(r.private_funding_total) || 0,
    donor_count: Number(r.donor_count) || 0,
    campaign_expenses: Number(r.campaign_expenses) || 0,
    operational_expenses: Number(r.operational_expenses) || 0,
    total_income: Number(r.total_income) || 0,
    total_expenses: Number(r.total_expenses) || 0,
  })) as PartyFinance[]
}

/**
 * Get party donors
 */
export async function getPartyDonors(partyId: string, options?: {
  year?: number
  limit?: number
  offset?: number
}): Promise<PartyDonor[]> {
  const limit = options?.limit || 50
  const offset = options?.offset || 0

  if (options?.year) {
    const rows = await sql`
      SELECT *
      FROM party_donors
      WHERE party_id = ${partyId} AND year = ${options.year}
      ORDER BY amount DESC
      LIMIT ${limit} OFFSET ${offset}
    `
    return rows.map(r => ({
      ...r,
      amount: Number(r.amount) || 0,
    })) as PartyDonor[]
  }

  const rows = await sql`
    SELECT *
    FROM party_donors
    WHERE party_id = ${partyId}
    ORDER BY amount DESC
    LIMIT ${limit} OFFSET ${offset}
  `
  return rows.map(r => ({
    ...r,
    amount: Number(r.amount) || 0,
  })) as PartyDonor[]
}

/**
 * Get party expenses
 */
export async function getPartyExpenses(partyId: string, options?: {
  year?: number
  category?: string
  limit?: number
  offset?: number
}): Promise<PartyExpense[]> {
  const limit = options?.limit || 50
  const offset = options?.offset || 0

  let rows
  if (options?.year && options?.category) {
    rows = await sql`
      SELECT *
      FROM party_expenses
      WHERE party_id = ${partyId} AND year = ${options.year} AND category = ${options.category}
      ORDER BY amount DESC
      LIMIT ${limit} OFFSET ${offset}
    `
  } else if (options?.year) {
    rows = await sql`
      SELECT *
      FROM party_expenses
      WHERE party_id = ${partyId} AND year = ${options.year}
      ORDER BY amount DESC
      LIMIT ${limit} OFFSET ${offset}
    `
  } else if (options?.category) {
    rows = await sql`
      SELECT *
      FROM party_expenses
      WHERE party_id = ${partyId} AND category = ${options.category}
      ORDER BY amount DESC
      LIMIT ${limit} OFFSET ${offset}
    `
  } else {
    rows = await sql`
      SELECT *
      FROM party_expenses
      WHERE party_id = ${partyId}
      ORDER BY amount DESC
      LIMIT ${limit} OFFSET ${offset}
    `
  }

  return rows.map(r => ({
    ...r,
    amount: Number(r.amount) || 0,
  })) as PartyExpense[]
}

/**
 * Get party expenses by category (aggregated)
 */
export async function getPartyExpensesByCategory(partyId: string, year?: number) {
  if (year) {
    const rows = await sql`
      SELECT
        category,
        SUM(amount) as total_amount,
        COUNT(*) as transaction_count
      FROM party_expenses
      WHERE party_id = ${partyId} AND year = ${year}
      GROUP BY category
      ORDER BY total_amount DESC
    `
    return rows.map(r => ({
      category: r.category,
      total_amount: Number(r.total_amount) || 0,
      transaction_count: Number(r.transaction_count) || 0,
    }))
  }

  const rows = await sql`
    SELECT
      category,
      SUM(amount) as total_amount,
      COUNT(*) as transaction_count
    FROM party_expenses
    WHERE party_id = ${partyId}
    GROUP BY category
    ORDER BY total_amount DESC
  `
  return rows.map(r => ({
    category: r.category,
    total_amount: Number(r.total_amount) || 0,
    transaction_count: Number(r.transaction_count) || 0,
  }))
}

/**
 * Get full party finance summary
 */
export async function getPartyFinanceSummary(partyId: string): Promise<PartyFinanceSummary | null> {
  const party = await getPartyById(partyId)
  if (!party) return null

  const finances = await getPartyFinances(partyId)
  const topDonors = await getPartyDonors(partyId, { limit: 10 })
  const expensesByCategory = await getPartyExpensesByCategory(partyId)

  // Calculate totals
  const totals = finances.reduce((acc, f) => ({
    totalPublicFunding: acc.totalPublicFunding + f.public_funding,
    totalPrivateFunding: acc.totalPrivateFunding + f.private_funding_total,
    totalExpenses: acc.totalExpenses + f.total_expenses,
    donorCount: acc.donorCount + f.donor_count,
  }), {
    totalPublicFunding: 0,
    totalPrivateFunding: 0,
    totalExpenses: 0,
    donorCount: 0,
  })

  return {
    party: {
      id: party.id,
      name: party.name,
      short_name: party.short_name,
      logo_url: party.logo_url,
      color: party.color,
    },
    finances,
    topDonors,
    expensesByCategory,
    totals,
  }
}

/**
 * Get all parties with their latest finance summary
 */
export async function getAllPartiesWithFinances() {
  const rows = await sql`
    SELECT
      p.id,
      p.name,
      p.short_name,
      p.logo_url,
      p.color,
      pf.year,
      pf.public_funding,
      pf.private_funding_total,
      pf.donor_count,
      pf.campaign_expenses,
      pf.operational_expenses,
      (COALESCE(pf.public_funding, 0) + COALESCE(pf.private_funding_total, 0)) as total_income,
      (COALESCE(pf.campaign_expenses, 0) + COALESCE(pf.operational_expenses, 0)) as total_expenses
    FROM parties p
    LEFT JOIN party_finances pf ON p.id = pf.party_id
    WHERE pf.year = (SELECT MAX(year) FROM party_finances WHERE party_id = p.id)
    ORDER BY total_income DESC
  `

  return rows.map(r => ({
    party: {
      id: r.id,
      name: r.name,
      short_name: r.short_name,
      logo_url: r.logo_url,
      color: r.color,
    },
    latestFinance: r.year ? {
      year: r.year,
      public_funding: Number(r.public_funding) || 0,
      private_funding_total: Number(r.private_funding_total) || 0,
      donor_count: Number(r.donor_count) || 0,
      total_income: Number(r.total_income) || 0,
      total_expenses: Number(r.total_expenses) || 0,
    } : null,
  }))
}

// ============================================
// CANDIDATE DETAILS QUERIES
// ============================================

export interface CandidateDetails {
  birth_date: string | null
  dni: string | null
  education_details: EducationRecord[]
  experience_details: ExperienceRecord[]
  political_trajectory: PoliticalRecord[]
  assets_declaration: AssetsDeclaration | null
  penal_sentences: SentenceRecord[]
  civil_sentences: SentenceRecord[]
  party_resignations: number
  djhv_url: string | null
  plan_gobierno_url: string | null
}

export interface EducationRecord {
  level: string
  institution: string
  degree?: string
  field?: string
  year_start?: number
  year_end?: number
  completed: boolean
  country?: string
}

export interface ExperienceRecord {
  type: 'publico' | 'privado'
  institution: string
  position: string
  year_start: number
  year_end: number
  description?: string
}

export interface PoliticalRecord {
  type: 'afiliacion' | 'cargo_partidario' | 'cargo_electivo' | 'candidatura'
  party?: string
  position?: string
  year_start?: number
  year_end?: number | null
  year?: number
  institution?: string
  result?: string
}

export interface AssetsDeclaration {
  assets: {
    type: string
    description: string
    value: number
    currency: string
    acquisition_year?: number
  }[]
  total_value: number
  income: {
    monthly_salary: number
    other_income: number
    source: string
  }
  declaration_year: number
  djhv_compliant: boolean
}

export interface SentenceRecord {
  type: string
  case_number: string
  court: string
  date: string
  sentence?: string
  amount?: number
  status: string
  source: string
}

/**
 * Get detailed candidate information
 */
export async function getCandidateDetails(candidateId: string): Promise<CandidateDetails | null> {
  const rows = await sql`
    SELECT
      birth_date,
      dni,
      education_details,
      experience_details,
      political_trajectory,
      assets_declaration,
      penal_sentences,
      civil_sentences,
      party_resignations,
      djhv_url
    FROM candidates
    WHERE id = ${candidateId}
    LIMIT 1
  `

  if (rows.length === 0) return null

  const row = rows[0]
  return {
    birth_date: row.birth_date as string | null,
    dni: row.dni as string | null,
    education_details: (row.education_details as EducationRecord[]) || [],
    experience_details: (row.experience_details as ExperienceRecord[]) || [],
    political_trajectory: (row.political_trajectory as PoliticalRecord[]) || [],
    assets_declaration: row.assets_declaration as AssetsDeclaration | null,
    penal_sentences: (row.penal_sentences as SentenceRecord[]) || [],
    civil_sentences: (row.civil_sentences as SentenceRecord[]) || [],
    party_resignations: Number(row.party_resignations) || 0,
    djhv_url: row.djhv_url as string | null,
    plan_gobierno_url: null,
  }
}

/**
 * Get score breakdown for a candidate
 */
export async function getScoreBreakdown(candidateId: string): Promise<ScoreBreakdown | null> {
  const rows = await sql`
    SELECT * FROM score_breakdowns WHERE candidate_id = ${candidateId} LIMIT 1
  `

  if (rows.length === 0) return null

  const row = rows[0]

  return {
    education: {
      total: Number(row.education_level_points) + Number(row.education_depth_points),
      level: Number(row.education_level_points),
      depth: Number(row.education_depth_points),
    },
    experience: {
      total: Number(row.experience_total_points),
      relevant: Number(row.experience_relevant_points),
    },
    leadership: {
      total: Number(row.leadership_seniority_points) + Number(row.leadership_stability_points),
      seniority: Number(row.leadership_seniority_points),
      stability: Number(row.leadership_stability_points),
    },
    integrity: {
      base: Number(row.integrity_base),
      penal_penalty: Number(row.penal_penalty),
      civil_penalties: (typeof row.civil_penalties === 'string'
        ? JSON.parse(row.civil_penalties)
        : row.civil_penalties) as CivilPenalty[] || [],
      resignation_penalty: Number(row.resignation_penalty),
      final: Number(row.integrity_base) - Number(row.penal_penalty) - Number(row.resignation_penalty),
    },
    transparency: {
      completeness: Number(row.completeness_points),
      consistency: Number(row.consistency_points),
      assets_quality: Number(row.assets_quality_points),
      total: Number(row.completeness_points) + Number(row.consistency_points) + Number(row.assets_quality_points),
    },
    confidence: {
      verification: Number(row.verification_points),
      coverage: Number(row.coverage_points),
      total: Number(row.verification_points) + Number(row.coverage_points),
    },
  }
}
