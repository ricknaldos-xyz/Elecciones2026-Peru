import { sql } from '@/lib/db'
import { createHash } from 'crypto'
import {
  JNECandidateData,
  JNEPenalSentence,
  JNECivilSentence,
  normalizeName,
  isSameCandidate
} from './parser'
import type { Sentence } from '@/types/database'

interface ReconcileResult {
  updated: number
  created: number
  skipped: number
}

interface ExistingCandidate {
  id: string
  dni: string | null
  full_name: string
  cargo: string
  party_id: string | null
}

/**
 * Creates a hash of candidate data for change detection
 */
function createDataHash(data: JNECandidateData): string {
  const hashContent = JSON.stringify({
    full_name: data.full_name,
    dni: data.dni,
    cargo: data.cargo,
    party_name: data.party_name,
    region: data.region,
    education: data.education,
    experience: data.experience,
    political_trajectory: data.political_trajectory,
    assets: data.assets,
    declared_sentences: data.declared_sentences,
    // Include enhanced sentence data in hash
    penal_sentences_detail: data.penal_sentences_detail,
    civil_sentences_detail: data.civil_sentences_detail,
    party_resignations_detail: data.party_resignations_detail,
  })
  return createHash('md5').update(hashContent).digest('hex')
}

/**
 * Converts enhanced penal sentences to database format
 */
function convertPenalSentences(sentences: JNEPenalSentence[]): Sentence[] {
  return sentences.map(s => ({
    type: 'penal_dolosa' as const,
    description: s.delito + (s.pena_impuesta ? ` - ${s.pena_impuesta}` : ''),
    date: s.fecha_sentencia,
    status: s.estado === 'proceso' ? 'otro' as const : s.estado,
    source: 'jne_declaracion',
    expediente: s.expediente,
    juzgado: s.juzgado,
    delito: s.delito,
    pena_impuesta: s.pena_impuesta,
    tipo_pena: s.tipo_pena,
    rehabilitado: s.rehabilitado
  }))
}

/**
 * Converts enhanced civil sentences to database format
 */
function convertCivilSentences(sentences: JNECivilSentence[]): Sentence[] {
  return sentences.map(s => ({
    type: s.tipo,
    description: s.descripcion,
    date: s.fecha_sentencia,
    status: s.estado === 'proceso' ? 'otro' as const : s.estado,
    source: 'jne_declaracion',
    expediente: s.expediente,
    juzgado: s.juzgado,
    monto: s.monto
  }))
}

/**
 * Checks if a candidate's data has changed since last sync
 */
async function hasDataChanged(
  candidateId: string,
  newHash: string
): Promise<boolean> {
  const result = await sql`
    SELECT data_hash
    FROM data_hashes
    WHERE entity_type = 'candidate'
      AND entity_id = ${candidateId}::uuid
      AND source = 'jne'
  `

  if (result.length === 0) {
    return true // No previous hash, consider it changed
  }

  return result[0].data_hash !== newHash
}

/**
 * Updates the data hash for a candidate
 */
async function updateDataHash(candidateId: string, hash: string): Promise<void> {
  await sql`
    INSERT INTO data_hashes (entity_type, entity_id, source, data_hash, last_changed_at)
    VALUES ('candidate', ${candidateId}::uuid, 'jne', ${hash}, NOW())
    ON CONFLICT (entity_type, entity_id, source)
    DO UPDATE SET
      data_hash = ${hash},
      last_checked_at = NOW(),
      last_changed_at = CASE
        WHEN data_hashes.data_hash != ${hash} THEN NOW()
        ELSE data_hashes.last_changed_at
      END
  `
}

/**
 * Finds or creates a party by name
 */
async function findOrCreateParty(
  partyName: string,
  shortName?: string
): Promise<string | null> {
  if (!partyName) return null

  // Try to find existing party
  const normalizedName = normalizeName(partyName)

  const existing = await sql`
    SELECT id FROM parties
    WHERE LOWER(name) = ${partyName.toLowerCase()}
       OR LOWER(short_name) = ${partyName.toLowerCase()}
       OR LOWER(short_name) = ${shortName?.toLowerCase() || ''}
    LIMIT 1
  `

  if (existing.length > 0) {
    return existing[0].id
  }

  // Create new party
  const slug = normalizedName.replace(/\s+/g, '-')

  const result = await sql`
    INSERT INTO parties (name, short_name, slug)
    VALUES (${partyName}, ${shortName || null}, ${slug})
    ON CONFLICT (name) DO UPDATE SET name = parties.name
    RETURNING id
  `

  return result[0]?.id || null
}

/**
 * Converts JNE cargo to database cargo type
 */
function mapCargo(cargo: JNECandidateData['cargo']): string {
  const cargoMap: Record<string, string> = {
    Presidente: 'Presidente',
    Vicepresidente: 'Vicepresidente',
    Congresista: 'Congresista',
    'Parlamento Andino': 'Parlamento Andino',
  }
  return cargoMap[cargo] || 'Congresista'
}

/**
 * Creates a URL-friendly slug from a name
 */
function createSlug(fullName: string): string {
  return normalizeName(fullName).replace(/\s+/g, '-')
}

/**
 * Updates an existing candidate with new JNE data
 */
async function updateCandidate(
  candidateId: string,
  data: JNECandidateData,
  partyId: string | null
): Promise<void> {
  // Update main candidate record
  await sql`
    UPDATE candidates
    SET
      dni = COALESCE(${data.dni || null}, dni),
      birth_date = COALESCE(${data.birth_date || null}::date, birth_date),
      photo_url = COALESCE(${data.photo_url || null}, photo_url),
      region = COALESCE(${data.region || null}, region),
      party_id = COALESCE(${partyId}::uuid, party_id),
      education_details = COALESCE(${JSON.stringify(data.education || [])}::jsonb, education_details),
      experience_details = COALESCE(${JSON.stringify(data.experience || [])}::jsonb, experience_details),
      political_trajectory = COALESCE(${JSON.stringify(data.political_trajectory || [])}::jsonb, political_trajectory),
      assets_declaration = COALESCE(${JSON.stringify(data.assets || null)}::jsonb, assets_declaration),
      djhv_url = COALESCE(${data.djhv_url || null}, djhv_url),
      last_updated = NOW()
    WHERE id = ${candidateId}::uuid
  `

  // Update sentences - prefer enhanced data if available
  let penalSentences: Sentence[] = []
  let civilSentences: Sentence[] = []

  // Use enhanced detailed sentences if available
  if (data.penal_sentences_detail && data.penal_sentences_detail.length > 0) {
    penalSentences = convertPenalSentences(data.penal_sentences_detail)
  } else if (data.declared_sentences) {
    // Fallback to legacy simple format
    penalSentences = data.declared_sentences
      .filter((s) => s.type === 'penal')
      .map(s => ({
        type: 'penal_dolosa' as const,
        description: s.description,
        date: s.date,
        status: 'firme' as const,
        source: 'jne_declaracion'
      }))
  }

  if (data.civil_sentences_detail && data.civil_sentences_detail.length > 0) {
    civilSentences = convertCivilSentences(data.civil_sentences_detail)
  } else if (data.declared_sentences) {
    // Fallback to legacy simple format
    civilSentences = data.declared_sentences
      .filter((s) => s.type === 'civil')
      .map(s => ({
        type: 'contractual' as const,
        description: s.description,
        date: s.date,
        status: 'firme' as const,
        source: 'jne_declaracion'
      }))
  }

  // Update sentences and party resignations
  if (penalSentences.length > 0 || civilSentences.length > 0 || data.party_resignations_detail) {
    const resignationCount = data.party_resignations_detail?.length || 0

    await sql`
      UPDATE candidates
      SET
        penal_sentences = ${JSON.stringify(penalSentences)}::jsonb,
        civil_sentences = ${JSON.stringify(civilSentences)}::jsonb,
        party_resignations = GREATEST(party_resignations, ${resignationCount})
      WHERE id = ${candidateId}::uuid
    `
  }
}

/**
 * Creates a new candidate from JNE data
 */
async function createCandidate(
  data: JNECandidateData,
  partyId: string | null
): Promise<string> {
  const slug = createSlug(data.full_name)
  const cargo = mapCargo(data.cargo)

  // Use enhanced detailed sentences if available, otherwise fallback to legacy
  let penalSentences: Sentence[] = []
  let civilSentences: Sentence[] = []

  if (data.penal_sentences_detail && data.penal_sentences_detail.length > 0) {
    penalSentences = convertPenalSentences(data.penal_sentences_detail)
  } else if (data.declared_sentences) {
    penalSentences = data.declared_sentences
      .filter((s) => s.type === 'penal')
      .map(s => ({
        type: 'penal_dolosa' as const,
        description: s.description,
        date: s.date,
        status: 'firme' as const,
        source: 'jne_declaracion'
      }))
  }

  if (data.civil_sentences_detail && data.civil_sentences_detail.length > 0) {
    civilSentences = convertCivilSentences(data.civil_sentences_detail)
  } else if (data.declared_sentences) {
    civilSentences = data.declared_sentences
      .filter((s) => s.type === 'civil')
      .map(s => ({
        type: 'contractual' as const,
        description: s.description,
        date: s.date,
        status: 'firme' as const,
        source: 'jne_declaracion'
      }))
  }

  const resignationCount = data.party_resignations_detail?.length || 0

  const result = await sql`
    INSERT INTO candidates (
      full_name,
      slug,
      dni,
      birth_date,
      cargo,
      region,
      party_id,
      photo_url,
      education_details,
      experience_details,
      political_trajectory,
      assets_declaration,
      penal_sentences,
      civil_sentences,
      party_resignations,
      djhv_url,
      data_source,
      last_updated
    ) VALUES (
      ${data.full_name},
      ${slug},
      ${data.dni || null},
      ${data.birth_date || null}::date,
      ${cargo},
      ${data.region || null},
      ${partyId}::uuid,
      ${data.photo_url || null},
      ${JSON.stringify(data.education || [])}::jsonb,
      ${JSON.stringify(data.experience || [])}::jsonb,
      ${JSON.stringify(data.political_trajectory || [])}::jsonb,
      ${JSON.stringify(data.assets || null)}::jsonb,
      ${JSON.stringify(penalSentences)}::jsonb,
      ${JSON.stringify(civilSentences)}::jsonb,
      ${resignationCount},
      ${data.djhv_url || null},
      'jne_scraped',
      NOW()
    )
    ON CONFLICT (slug) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      penal_sentences = EXCLUDED.penal_sentences,
      civil_sentences = EXCLUDED.civil_sentences,
      party_resignations = EXCLUDED.party_resignations,
      data_source = EXCLUDED.data_source,
      last_updated = NOW()
    RETURNING id
  `

  return result[0].id
}

/**
 * Reconciles JNE candidate data with the database
 */
export async function reconcileJNECandidates(
  candidates: JNECandidateData[]
): Promise<ReconcileResult> {
  const result: ReconcileResult = {
    updated: 0,
    created: 0,
    skipped: 0,
  }

  // Get existing candidates for comparison
  const existingCandidates = (await sql`
    SELECT id, dni, full_name, cargo, party_id
    FROM candidates
  `) as ExistingCandidate[]

  console.log(
    `[JNE Reconciler] Processing ${candidates.length} candidates against ${existingCandidates.length} existing`
  )

  for (const candidate of candidates) {
    try {
      const dataHash = createDataHash(candidate)

      // Find matching existing candidate
      const existing = existingCandidates.find((e) =>
        isSameCandidate(candidate, { dni: e.dni || undefined, full_name: e.full_name })
      )

      // Find or create party
      const partyId = await findOrCreateParty(
        candidate.party_name,
        candidate.party_short_name
      )

      if (existing) {
        // Check if data has changed
        const hasChanged = await hasDataChanged(existing.id, dataHash)

        if (hasChanged) {
          await updateCandidate(existing.id, candidate, partyId)
          await updateDataHash(existing.id, dataHash)
          result.updated++
          console.log(`[JNE Reconciler] Updated: ${candidate.full_name}`)
        } else {
          result.skipped++
        }
      } else {
        // Create new candidate
        const newId = await createCandidate(candidate, partyId)
        await updateDataHash(newId, dataHash)
        result.created++
        console.log(`[JNE Reconciler] Created: ${candidate.full_name}`)
      }
    } catch (error) {
      console.error(
        `[JNE Reconciler] Error processing ${candidate.full_name}:`,
        error
      )
      result.skipped++
    }
  }

  console.log(`[JNE Reconciler] Results:`, result)
  return result
}
