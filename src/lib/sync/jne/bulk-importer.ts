/**
 * Bulk Importer for Congressional Candidates
 *
 * Supports importing candidates from:
 * - JSON files
 * - CSV files
 * - Direct data arrays
 */

import { sql } from '@/lib/db'
import {
  CongressionalCandidate,
  bulkInsertCandidates,
  parseCandidatesFromJSON,
} from './congressional-fetcher'

export interface ImportResult {
  success: boolean
  cargo: string
  total: number
  inserted: number
  skipped: number
  errors: Array<{ name: string; error: string }>
  duration: number
}

/**
 * Parse CSV string to array of objects
 */
function parseCSV(csvString: string): Array<Record<string, string>> {
  const lines = csvString.trim().split('\n')
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase())
  const rows: Array<Record<string, string>> = []

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map((v) => v.trim())
    const row: Record<string, string> = {}

    headers.forEach((header, index) => {
      row[header] = values[index] || ''
    })

    rows.push(row)
  }

  return rows
}

/**
 * Import candidates from JSON data
 */
export async function importFromJSON(
  jsonData: Array<Record<string, unknown>>,
  cargo: 'senador' | 'diputado' | 'parlamento_andino'
): Promise<ImportResult> {
  const startTime = Date.now()

  const candidates = parseCandidatesFromJSON(jsonData, cargo)
  const result = await bulkInsertCandidates(candidates)

  return {
    success: result.errors.length === 0,
    cargo,
    total: result.total,
    inserted: result.inserted,
    skipped: result.skipped,
    errors: result.errors,
    duration: Date.now() - startTime,
  }
}

/**
 * Import candidates from CSV string
 */
export async function importFromCSV(
  csvString: string,
  cargo: 'senador' | 'diputado' | 'parlamento_andino'
): Promise<ImportResult> {
  const startTime = Date.now()

  const rows = parseCSV(csvString)
  const candidates = parseCandidatesFromJSON(rows, cargo)
  const result = await bulkInsertCandidates(candidates)

  return {
    success: result.errors.length === 0,
    cargo,
    total: result.total,
    inserted: result.inserted,
    skipped: result.skipped,
    errors: result.errors,
    duration: Date.now() - startTime,
  }
}

/**
 * Import candidates directly from array
 */
export async function importCandidates(
  candidates: CongressionalCandidate[]
): Promise<ImportResult> {
  const startTime = Date.now()

  if (candidates.length === 0) {
    return {
      success: true,
      cargo: 'mixed',
      total: 0,
      inserted: 0,
      skipped: 0,
      errors: [],
      duration: 0,
    }
  }

  const result = await bulkInsertCandidates(candidates)

  return {
    success: result.errors.length === 0,
    cargo: candidates[0].cargo,
    total: result.total,
    inserted: result.inserted,
    skipped: result.skipped,
    errors: result.errors,
    duration: Date.now() - startTime,
  }
}

/**
 * Create initial scores for newly imported candidates
 */
export async function createInitialScores(
  candidateIds?: string[]
): Promise<{ created: number; skipped: number }> {
  // Find candidates without scores
  let candidates
  if (candidateIds && candidateIds.length > 0) {
    candidates = await sql`
      SELECT c.id
      FROM candidates c
      LEFT JOIN scores s ON c.id = s.candidate_id
      WHERE c.id = ANY(${candidateIds})
      AND s.id IS NULL
    `
  } else {
    candidates = await sql`
      SELECT c.id
      FROM candidates c
      LEFT JOIN scores s ON c.id = s.candidate_id
      WHERE c.is_active = true
      AND s.id IS NULL
    `
  }

  let created = 0
  for (const candidate of candidates) {
    await sql`
      INSERT INTO scores (
        candidate_id,
        competence,
        integrity,
        transparency,
        confidence,
        score_balanced,
        score_merit,
        score_integrity
      ) VALUES (
        ${candidate.id},
        50,
        50,
        50,
        30,
        50,
        50,
        50
      )
      ON CONFLICT (candidate_id) DO NOTHING
    `
    created++
  }

  return { created, skipped: candidates.length - created }
}

/**
 * Get import status summary
 */
export async function getImportStatus(): Promise<{
  totalCandidates: number
  byCargo: Record<string, number>
  byParty: Array<{ party: string; count: number }>
  byDistrict: Array<{ district: string; count: number }>
  withoutScores: number
}> {
  const [total] = await sql`
    SELECT COUNT(*) as count FROM candidates WHERE is_active = true
  `

  const byCargo = await sql`
    SELECT cargo, COUNT(*) as count
    FROM candidates
    WHERE is_active = true
    GROUP BY cargo
  `

  const byParty = await sql`
    SELECT p.name as party, COUNT(*) as count
    FROM candidates c
    JOIN parties p ON c.party_id = p.id
    WHERE c.is_active = true
    GROUP BY p.name
    ORDER BY count DESC
    LIMIT 20
  `

  const byDistrict = await sql`
    SELECT d.name as district, COUNT(*) as count
    FROM candidates c
    JOIN districts d ON c.district_id = d.id
    WHERE c.is_active = true
    GROUP BY d.name
    ORDER BY count DESC
    LIMIT 10
  `

  const [withoutScores] = await sql`
    SELECT COUNT(*) as count
    FROM candidates c
    LEFT JOIN scores s ON c.id = s.candidate_id
    WHERE c.is_active = true
    AND s.id IS NULL
  `

  return {
    totalCandidates: Number(total.count),
    byCargo: Object.fromEntries(
      byCargo.map((r) => [r.cargo as string, Number(r.count)])
    ),
    byParty: byParty.map((r) => ({
      party: r.party as string,
      count: Number(r.count),
    })),
    byDistrict: byDistrict.map((r) => ({
      district: r.district as string,
      count: Number(r.count),
    })),
    withoutScores: Number(withoutScores.count),
  }
}

/**
 * Validate import data before inserting
 */
export async function validateImportData(
  candidates: CongressionalCandidate[]
): Promise<{
  valid: CongressionalCandidate[]
  invalid: Array<{ candidate: CongressionalCandidate; errors: string[] }>
}> {
  const valid: CongressionalCandidate[] = []
  const invalid: Array<{ candidate: CongressionalCandidate; errors: string[] }> =
    []

  for (const candidate of candidates) {
    const errors: string[] = []

    // Check required fields
    if (!candidate.fullName || candidate.fullName.trim().length < 3) {
      errors.push('Nombre completo requerido (mínimo 3 caracteres)')
    }

    if (!candidate.partyName) {
      errors.push('Partido político requerido')
    }

    if (!['senador', 'diputado', 'parlamento_andino'].includes(candidate.cargo)) {
      errors.push(
        'Cargo inválido (debe ser: senador, diputado, o parlamento_andino)'
      )
    }

    // Senadores and diputados require a district
    if (
      (candidate.cargo === 'senador' || candidate.cargo === 'diputado') &&
      !candidate.districtName
    ) {
      errors.push('Distrito requerido para senadores y diputados')
    }

    if (errors.length > 0) {
      invalid.push({ candidate, errors })
    } else {
      valid.push(candidate)
    }
  }

  return { valid, invalid }
}
