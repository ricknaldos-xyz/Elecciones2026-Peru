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
 * Get candidates with scores and flags
 * Filters are applied at the SQL level for efficiency
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
  const cargoFilter = options?.cargo || null
  const districtSlugFilter = options?.districtSlug || null
  const partyIdFilter = options?.partyId || null
  const minConfidence = (options?.minConfidence && options.minConfidence > 0) ? options.minConfidence : null
  const onlyClean = options?.onlyClean || false
  const limit = (options?.limit && options.limit > 0) ? options.limit : 1000
  const offset = (options?.offset && options.offset > 0) ? options.offset : 0

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
      AND (${cargoFilter}::text IS NULL OR c.cargo = ${cargoFilter})
      AND (${districtSlugFilter}::text IS NULL OR d.slug = ${districtSlugFilter})
      AND (${partyIdFilter}::text IS NULL OR c.party_id = ${partyIdFilter}::uuid)
      AND (${minConfidence}::numeric IS NULL OR s.confidence >= ${minConfidence})
      AND (
        ${!onlyClean}
        OR NOT EXISTS (
          SELECT 1 FROM flags f
          WHERE f.candidate_id = c.id AND f.severity = 'RED'
        )
      )
    ORDER BY s.score_balanced DESC NULLS LAST
    LIMIT ${limit}
    OFFSET ${offset}
  `

  if (rows.length === 0) return []

  // Get flags for filtered candidates only
  const candidateIds = rows.map((r) => r.id as string)
  const flags = await sql`
    SELECT
      id,
      candidate_id,
      type,
      severity,
      title,
      description,
      source,
      evidence_url,
      date_captured
    FROM flags
    WHERE candidate_id = ANY(${candidateIds})
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
    SELECT id, candidate_id, type, severity, title, description, source, evidence_url, date_captured
    FROM flags WHERE candidate_id = ${row.id}
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
    WHERE (c.id = ANY(${ids}) OR c.slug = ANY(${ids})) AND c.is_active = true
  `

  if (rows.length === 0) return []

  // Get flags using resolved candidate IDs
  const resolvedIds = rows.map((r) => r.id as string)
  const flags = await sql`
    SELECT id, candidate_id, type, severity, title, description, source, evidence_url, date_captured
    FROM flags WHERE candidate_id = ANY(${resolvedIds})
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
    SELECT id, name, short_name, logo_url, color FROM parties ORDER BY name
  `
  return rows
}

/**
 * Get all districts
 */
export async function getDistricts() {
  const rows = await sql`
    SELECT id, name, slug, type, senators_count, deputies_count FROM districts ORDER BY name
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
    SELECT id, name, short_name, logo_url, color FROM parties WHERE id = ${id} LIMIT 1
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
 * Get party by slug (name or short_name converted to slug format)
 */
export async function getPartyBySlug(slug: string) {
  const parties = await getParties()
  const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  const party = parties.find((p) =>
    normalize(p.short_name || '') === slug ||
    normalize(p.name || '') === slug ||
    p.short_name?.toLowerCase().replace(/\s+/g, '-') === slug ||
    p.name?.toLowerCase().replace(/\s+/g, '-') === slug ||
    p.id === slug // Also allow lookup by ID for backwards compatibility
  )
  return party || null
}

/**
 * Generate slug from party name
 */
export function generatePartySlug(party: { name?: string; short_name?: string | null }): string {
  return (party.short_name || party.name || '')
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

/**
 * Get full party finance summary (accepts slug or ID)
 */
export async function getPartyFinanceSummary(slugOrId: string): Promise<PartyFinanceSummary | null> {
  // Try to find party by slug first, then by ID
  let party = await getPartyBySlug(slugOrId)
  if (!party) {
    party = await getPartyById(slugOrId)
  }
  if (!party) return null

  const partyId = party.id

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
  plan_pdf_local: string | null
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
  type: 'afiliacion' | 'cargo_partidario' | 'cargo_electivo' | 'candidatura' | 'cargo_publico'
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
  }[]
  total_value: number
  income: {
    annual_income: number
    other_income: number
    source: string
  } | null
  declaration_year: number | null
  djhv_compliant: boolean
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeAssetsDeclaration(raw: any): AssetsDeclaration | null {
  if (!raw || typeof raw !== 'object') return null

  // Already in the expected format
  if (Array.isArray(raw.assets)) return raw as AssetsDeclaration

  // Transform flat scraper format to structured UI format
  const assets: AssetsDeclaration['assets'] = []

  if (raw.real_estate_count > 0 || raw.real_estate_total > 0) {
    assets.push({
      type: 'Inmuebles',
      description: `${raw.real_estate_count || 0} propiedad(es)`,
      value: raw.real_estate_total || 0,
      currency: 'PEN',
    })
  }

  if (raw.vehicle_count > 0 || raw.vehicle_total > 0) {
    assets.push({
      type: 'Vehículos',
      description: `${raw.vehicle_count || 0} vehículo(s)`,
      value: raw.vehicle_total || 0,
      currency: 'PEN',
    })
  }

  const totalIncome = raw.total_income || 0
  const publicSalary = (raw.public_salary || 0) + (raw.public_rent || 0) + (raw.other_public || 0)
  const privateSalary = (raw.private_salary || 0) + (raw.private_rent || 0) + (raw.other_private || 0)

  const totalValue = (raw.real_estate_total || 0) + (raw.vehicle_total || 0)

  // If there's no meaningful data AND no source indicator, there's no declaration
  if (totalValue === 0 && totalIncome === 0 && assets.length === 0 && !raw.source) return null

  const incomeSource = publicSalary > 0 && privateSalary > 0
    ? 'Sector público y privado'
    : publicSalary > 0
      ? 'Sector público'
      : privateSalary > 0
        ? 'Sector privado'
        : ''

  return {
    assets,
    total_value: totalValue,
    income: totalIncome > 0 ? {
      annual_income: totalIncome,
      other_income: 0,
      source: incomeSource,
    } : null,
    declaration_year: raw.income_year ? parseInt(raw.income_year, 10) : null,
    djhv_compliant: true,
  }
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
      djhv_url,
      plan_gobierno_url,
      plan_pdf_local
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
    assets_declaration: normalizeAssetsDeclaration(row.assets_declaration),
    penal_sentences: (row.penal_sentences as SentenceRecord[]) || [],
    civil_sentences: (row.civil_sentences as SentenceRecord[]) || [],
    party_resignations: Number(row.party_resignations) || 0,
    djhv_url: row.djhv_url as string | null,
    plan_gobierno_url: row.plan_gobierno_url as string | null,
    plan_pdf_local: row.plan_pdf_local as string | null,
  }
}

/**
 * Get vice presidents for a party (presidential formula)
 */
export interface VicePresident {
  id: string
  slug: string
  full_name: string
  photo_url: string | null
  list_position: number
}

export async function getVicePresidents(partyId: string): Promise<VicePresident[]> {
  const rows = await sql`
    SELECT id, slug, full_name, photo_url, list_position
    FROM candidates
    WHERE party_id = ${partyId}
      AND cargo = 'vicepresidente'
      AND is_active = true
    ORDER BY list_position ASC
  `
  return rows.map(r => ({
    id: r.id as string,
    slug: r.slug as string,
    full_name: r.full_name as string,
    photo_url: r.photo_url as string | null,
    list_position: Number(r.list_position),
  }))
}

/**
 * Get score breakdown for a candidate
 */
export async function getScoreBreakdown(candidateId: string): Promise<ScoreBreakdown | null> {
  const rows = await sql`
    SELECT
      candidate_id,
      education_level_points, education_depth_points,
      experience_total_points, experience_relevant_points,
      leadership_seniority_points, leadership_stability_points,
      integrity_base, penal_penalty, civil_penalties, resignation_penalty,
      completeness_points, consistency_points, assets_quality_points,
      verification_points, coverage_points
    FROM score_breakdowns WHERE candidate_id = ${candidateId} LIMIT 1
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
      rawYears: Number(row.experience_raw_years) || 0,
      uniqueYears: Number(row.experience_unique_years) || 0,
      hasOverlap: Boolean(row.experience_has_overlap),
    },
    leadership: {
      total: (Number(row.leadership_seniority) || 0) + (Number(row.leadership_stability) || 0),
      seniority: Number(row.leadership_seniority) || 0,
      stability: Number(row.leadership_stability) || 0,
    },
    integrity: {
      base: Number(row.integrity_base),
      penal_penalty: Number(row.penal_penalty),
      civil_penalties: (() => {
        try {
          if (typeof row.civil_penalties === 'string') {
            return JSON.parse(row.civil_penalties) as CivilPenalty[]
          }
          return (row.civil_penalties as CivilPenalty[]) || []
        } catch {
          return []
        }
      })(),
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
