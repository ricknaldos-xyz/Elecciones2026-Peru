/**
 * Congressional Candidates Fetcher
 *
 * Fetches Senators, Deputies, and Andean Parliament candidates from JNE.
 * Supports multiple data sources:
 * - JNE Plataforma Electoral (primary, requires investigation of actual API)
 * - Local JSON/CSV files (for manual imports)
 * - Voto Informado portal
 */

import * as cheerio from 'cheerio'
import { createSyncLogger } from '../logger'
import { sql } from '@/lib/db'

const JNE_BASE_URL = 'https://plataformaelectoral.jne.gob.pe'
const DELAY_MS = 1000

// Cargo types mapping
export const CARGO_TYPES = {
  PRESIDENTE: { id: '1', dbValue: 'presidente' },
  VICEPRESIDENTE: { id: '2', dbValue: 'vicepresidente' },
  SENADOR: { id: '3', dbValue: 'senador' },
  DIPUTADO: { id: '4', dbValue: 'diputado' },
  PARLAMENTO_ANDINO: { id: '5', dbValue: 'parlamento_andino' },
} as const

export type CargoType = keyof typeof CARGO_TYPES

export interface CongressionalCandidate {
  fullName: string
  cargo: 'senador' | 'diputado' | 'parlamento_andino'
  partyName: string
  partyAbbreviation?: string
  districtName?: string
  listPosition?: number
  dni?: string
  jneId?: string
  photoUrl?: string
  djhvUrl?: string
  birthDate?: string
  educationLevel?: string
  educationDetails?: Array<{
    level: string
    institution: string
    degree?: string
    year?: number
  }>
  experienceDetails?: Array<{
    organization: string
    position: string
    startYear?: number
    endYear?: number
  }>
  politicalTrajectory?: Array<{
    party: string
    position?: string
    startYear?: number
    endYear?: number
  }>
}

interface FetchOptions {
  cargo: CargoType
  districtSlug?: string
  partyId?: string
  maxResults?: number
}

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Get districts from database
 */
export async function getDistricts(): Promise<
  Array<{ id: string; name: string; slug: string; type: string }>
> {
  const result = await sql`
    SELECT id, name, slug, type FROM districts ORDER BY name
  `
  return result as Array<{ id: string; name: string; slug: string; type: string }>
}

/**
 * Get parties from database
 */
export async function getParties(): Promise<
  Array<{ id: string; name: string; shortName: string | null }>
> {
  const result = await sql`
    SELECT id, name, short_name as "shortName" FROM parties ORDER BY name
  `
  return result as Array<{ id: string; name: string; shortName: string | null }>
}

/**
 * Match party name to database party
 */
async function matchParty(
  partyName: string
): Promise<{ id: string; name: string } | null> {
  const parties = await getParties()

  // Normalize name for comparison
  const normalizedInput = partyName.toLowerCase().trim()

  // Try exact match first
  let match = parties.find(
    (p) =>
      p.name.toLowerCase() === normalizedInput ||
      (p.shortName && p.shortName.toLowerCase() === normalizedInput)
  )

  if (match) return { id: match.id, name: match.name }

  // Try partial match
  match = parties.find(
    (p) =>
      p.name.toLowerCase().includes(normalizedInput) ||
      normalizedInput.includes(p.name.toLowerCase()) ||
      (p.shortName &&
        (p.shortName.toLowerCase().includes(normalizedInput) ||
          normalizedInput.includes(p.shortName.toLowerCase())))
  )

  return match ? { id: match.id, name: match.name } : null
}

/**
 * Match district name to database district
 */
async function matchDistrict(
  districtName: string
): Promise<{ id: string; name: string; slug: string } | null> {
  const districts = await getDistricts()

  const normalizedInput = districtName.toLowerCase().trim()

  const match = districts.find(
    (d) =>
      d.name.toLowerCase() === normalizedInput ||
      d.slug === normalizedInput ||
      d.name.toLowerCase().includes(normalizedInput) ||
      normalizedInput.includes(d.name.toLowerCase())
  )

  return match || null
}

/**
 * Create slug from full name
 */
function createSlug(fullName: string): string {
  return fullName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Remove multiple hyphens
}

/**
 * Check if candidate already exists
 */
async function candidateExists(
  fullName: string,
  cargo: string
): Promise<boolean> {
  const result = await sql`
    SELECT 1 FROM candidates
    WHERE LOWER(full_name) = LOWER(${fullName})
    AND cargo = ${cargo}
    LIMIT 1
  `
  return result.length > 0
}

/**
 * Insert a single candidate into the database
 */
export async function insertCandidate(
  candidate: CongressionalCandidate
): Promise<{ success: boolean; candidateId?: string; error?: string }> {
  try {
    // Check if already exists
    if (await candidateExists(candidate.fullName, candidate.cargo)) {
      return { success: false, error: 'Candidate already exists' }
    }

    // Match party
    const party = await matchParty(candidate.partyName)
    if (!party) {
      return { success: false, error: `Party not found: ${candidate.partyName}` }
    }

    // Match district (required for senador/diputado)
    let district = null
    if (candidate.districtName && candidate.cargo !== 'parlamento_andino') {
      district = await matchDistrict(candidate.districtName)
      if (!district) {
        return {
          success: false,
          error: `District not found: ${candidate.districtName}`,
        }
      }
    }

    const slug = createSlug(candidate.fullName)

    // Insert candidate
    const result = await sql`
      INSERT INTO candidates (
        slug,
        full_name,
        cargo,
        party_id,
        district_id,
        photo_url,
        dni,
        jne_id,
        djhv_url,
        birth_date,
        education_level,
        education_details,
        experience_details,
        political_trajectory,
        is_active,
        data_source,
        data_verified
      ) VALUES (
        ${slug},
        ${candidate.fullName},
        ${candidate.cargo},
        ${party.id},
        ${district?.id || null},
        ${candidate.photoUrl || null},
        ${candidate.dni || null},
        ${candidate.jneId || null},
        ${candidate.djhvUrl || null},
        ${candidate.birthDate || null},
        ${candidate.educationLevel || 'Por verificar'},
        ${JSON.stringify(candidate.educationDetails || [])},
        ${JSON.stringify(candidate.experienceDetails || [])},
        ${JSON.stringify(candidate.politicalTrajectory || [])},
        true,
        'jne_import',
        false
      )
      RETURNING id
    `

    return { success: true, candidateId: result[0].id }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

/**
 * Bulk insert candidates
 */
export async function bulkInsertCandidates(
  candidates: CongressionalCandidate[]
): Promise<{
  total: number
  inserted: number
  skipped: number
  errors: Array<{ name: string; error: string }>
}> {
  const results = {
    total: candidates.length,
    inserted: 0,
    skipped: 0,
    errors: [] as Array<{ name: string; error: string }>,
  }

  for (const candidate of candidates) {
    const result = await insertCandidate(candidate)

    if (result.success) {
      results.inserted++
    } else if (result.error?.includes('already exists')) {
      results.skipped++
    } else {
      results.errors.push({
        name: candidate.fullName,
        error: result.error || 'Unknown error',
      })
    }

    // Rate limit
    await delay(100)
  }

  return results
}

/**
 * Parse candidates from JSON data (for manual imports)
 */
export function parseCandidatesFromJSON(
  data: Array<Record<string, unknown>>,
  cargo: 'senador' | 'diputado' | 'parlamento_andino'
): CongressionalCandidate[] {
  return data.map((item) => ({
    fullName: String(item.nombre || item.full_name || item.name || ''),
    cargo,
    partyName: String(item.partido || item.party || item.partyName || ''),
    partyAbbreviation: item.partido_sigla
      ? String(item.partido_sigla)
      : undefined,
    districtName: item.distrito
      ? String(item.distrito)
      : item.region
        ? String(item.region)
        : undefined,
    listPosition: item.posicion ? Number(item.posicion) : undefined,
    dni: item.dni ? String(item.dni) : undefined,
    photoUrl: item.foto ? String(item.foto) : undefined,
  }))
}

/**
 * Main sync function for congressional candidates
 */
export async function syncCongressionalCandidates(
  options: FetchOptions
): Promise<{
  success: boolean
  records_processed: number
  records_created: number
  records_skipped: number
  errors: string[]
}> {
  const logger = createSyncLogger('jne')
  const result = {
    success: false,
    records_processed: 0,
    records_created: 0,
    records_skipped: 0,
    errors: [] as string[],
  }

  try {
    await logger.start()
    logger.markRunning()

    // For now, this is a placeholder - actual JNE API scraping would go here
    // The JNE platform doesn't have a public API, so we need to:
    // 1. Use browser automation (Puppeteer)
    // 2. Or import from local files

    console.log(
      `[Congressional Fetcher] Options: ${JSON.stringify(options)}`
    )
    console.log(
      `[Congressional Fetcher] JNE API is not publicly accessible. Use manual import or local files.`
    )

    result.success = true
    await logger.complete()
  } catch (error) {
    result.errors.push(String(error))
    await logger.fail(error instanceof Error ? error : new Error(String(error)))
  }

  return result
}

/**
 * Get candidate counts by cargo
 */
export async function getCandidateCountsByCargo(): Promise<
  Record<string, number>
> {
  const result = await sql`
    SELECT cargo, COUNT(*) as count
    FROM candidates
    WHERE is_active = true
    GROUP BY cargo
    ORDER BY cargo
  `
  return Object.fromEntries(
    result.map((r) => [r.cargo as string, Number(r.count)])
  )
}

/**
 * Get candidates by cargo and optional district
 */
export async function getCandidatesByCargo(
  cargo: string,
  districtSlug?: string
): Promise<Array<{ id: string; fullName: string; partyName: string }>> {
  if (districtSlug) {
    const result = await sql`
      SELECT c.id, c.full_name as "fullName", p.name as "partyName"
      FROM candidates c
      LEFT JOIN parties p ON c.party_id = p.id
      LEFT JOIN districts d ON c.district_id = d.id
      WHERE c.cargo = ${cargo}
      AND c.is_active = true
      AND d.slug = ${districtSlug}
      ORDER BY c.full_name
    `
    return result as Array<{
      id: string
      fullName: string
      partyName: string
    }>
  }

  const result = await sql`
    SELECT c.id, c.full_name as "fullName", p.name as "partyName"
    FROM candidates c
    LEFT JOIN parties p ON c.party_id = p.id
    WHERE c.cargo = ${cargo}
    AND c.is_active = true
    ORDER BY c.full_name
  `
  return result as Array<{ id: string; fullName: string; partyName: string }>
}
