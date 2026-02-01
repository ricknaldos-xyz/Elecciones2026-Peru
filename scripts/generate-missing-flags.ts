/**
 * Generate missing flags for ALL candidates who have penal_sentences or civil_sentences
 * in their JSONB data but no corresponding flags in the flags table.
 *
 * This fixes the major data integrity issue where only 1 flag (Keiko's) existed
 * despite 29+ FP candidates having sentences, and many candidates across all parties
 * having sentence data without corresponding flags.
 */

import { neon } from '@neondatabase/serverless'
import * as fs from 'fs'
import * as path from 'path'

// Load DATABASE_URL from .env.local
const envPath = path.join(process.cwd(), '.env.local')
const envContent = fs.readFileSync(envPath, 'utf-8')
const dbMatch = envContent.match(/DATABASE_URL=["']?([^"'\n]+)["']?/)
const DATABASE_URL = dbMatch ? dbMatch[1] : process.env.DATABASE_URL!
const sql = neon(DATABASE_URL)

interface FlagInsert {
  candidate_id: string
  type: string
  severity: string
  title: string
  description: string
  source: string
  evidence_url: string | null
  is_verified: boolean
}

/**
 * Determine severity for penal sentence
 */
function getPenalSeverity(sentence: any): 'RED' | 'AMBER' {
  const status = (sentence.status || '').toLowerCase()
  // Firm/final sentences = RED, pending = AMBER
  if (status.includes('firme') || status.includes('consentida') || status.includes('ejecutoriada')) {
    return 'RED'
  }
  return 'AMBER'
}

/**
 * Determine severity for civil sentence
 */
function getCivilSeverity(sentence: any): 'RED' | 'AMBER' {
  const type = (sentence.type || sentence.description || '').toLowerCase()
  // Violence and alimentos = RED, others = AMBER
  if (type.includes('violencia') || type.includes('alimento') || type.includes('familia')) {
    return 'RED'
  }
  return 'AMBER'
}

/**
 * Determine flag type for civil sentence
 */
function getCivilFlagType(sentence: any): string {
  const type = (sentence.type || sentence.description || '').toLowerCase()
  if (type.includes('violencia')) return 'VIOLENCE'
  if (type.includes('alimento')) return 'ALIMENTOS'
  if (type.includes('laboral')) return 'LABORAL'
  return 'CONTRACTUAL'
}

async function main() {
  console.log('=== Generating missing flags from sentence data ===\n')

  // Get all candidates with sentence data
  const candidates = await sql`
    SELECT
      c.id,
      c.full_name,
      c.cargo,
      c.penal_sentences,
      c.civil_sentences,
      p.short_name as party_short_name
    FROM candidates c
    LEFT JOIN parties p ON c.party_id = p.id
    WHERE c.is_active = true
      AND (
        (c.penal_sentences IS NOT NULL AND c.penal_sentences != '[]'::jsonb AND c.penal_sentences != 'null'::jsonb)
        OR (c.civil_sentences IS NOT NULL AND c.civil_sentences != '[]'::jsonb AND c.civil_sentences != 'null'::jsonb)
      )
    ORDER BY p.short_name, c.full_name
  `

  console.log(`Found ${candidates.length} candidates with sentence data\n`)

  // Get existing flags to avoid duplicates
  const existingFlags = await sql`
    SELECT candidate_id, type, title FROM flags
  `
  const existingFlagKeys = new Set(
    existingFlags.map((f) => `${f.candidate_id}:${f.type}:${f.title}`)
  )
  console.log(`Found ${existingFlags.length} existing flags in DB\n`)

  const flagsToInsert: FlagInsert[] = []
  let candidatesWithNewFlags = 0

  for (const candidate of candidates) {
    const penalSentences = Array.isArray(candidate.penal_sentences) ? candidate.penal_sentences : []
    const civilSentences = Array.isArray(candidate.civil_sentences) ? candidate.civil_sentences : []
    let hasNewFlag = false

    // Process penal sentences
    for (const sentence of penalSentences) {
      const title = `Sentencia penal: ${sentence.type || sentence.case_number || 'Sin detalle'}`
      const key = `${candidate.id}:PENAL_SENTENCE:${title}`

      if (existingFlagKeys.has(key)) continue

      const severity = getPenalSeverity(sentence)
      const description = [
        sentence.description || sentence.sentence || '',
        sentence.court ? `Juzgado: ${sentence.court}` : '',
        sentence.case_number ? `Exp: ${sentence.case_number}` : '',
        sentence.date ? `Fecha: ${sentence.date}` : '',
        sentence.status ? `Estado: ${sentence.status}` : '',
      ].filter(Boolean).join('. ')

      flagsToInsert.push({
        candidate_id: candidate.id,
        type: 'PENAL_SENTENCE',
        severity,
        title,
        description: description || 'Sentencia penal declarada en Hoja de Vida',
        source: 'JNE - Hoja de Vida',
        evidence_url: null,
        is_verified: true,
      })
      existingFlagKeys.add(key)
      hasNewFlag = true
    }

    // Process civil sentences
    for (const sentence of civilSentences) {
      const flagType = getCivilFlagType(sentence)
      const title = `Sentencia civil: ${sentence.type || sentence.case_number || 'Sin detalle'}`
      const key = `${candidate.id}:${flagType}:${title}`

      if (existingFlagKeys.has(key)) continue

      const severity = getCivilSeverity(sentence)
      const description = [
        sentence.description || sentence.sentence || '',
        sentence.court ? `Juzgado: ${sentence.court}` : '',
        sentence.case_number ? `Exp: ${sentence.case_number}` : '',
        sentence.date ? `Fecha: ${sentence.date}` : '',
        sentence.status ? `Estado: ${sentence.status}` : '',
      ].filter(Boolean).join('. ')

      flagsToInsert.push({
        candidate_id: candidate.id,
        type: flagType,
        severity,
        title,
        description: description || 'Sentencia civil declarada en Hoja de Vida',
        source: 'JNE - Hoja de Vida',
        evidence_url: null,
        is_verified: true,
      })
      existingFlagKeys.add(key)
      hasNewFlag = true
    }

    if (hasNewFlag) {
      candidatesWithNewFlags++
      const penalCount = penalSentences.length
      const civilCount = civilSentences.length
      console.log(`  ${candidate.party_short_name || 'N/A'} | ${candidate.full_name} (${candidate.cargo}): ${penalCount} penal, ${civilCount} civil`)
    }
  }

  console.log(`\n${candidatesWithNewFlags} candidates need new flags`)
  console.log(`${flagsToInsert.length} total flags to insert\n`)

  if (flagsToInsert.length === 0) {
    console.log('No new flags needed. All sentences already have corresponding flags.')
    return
  }

  // Insert flags in batches
  const BATCH_SIZE = 50
  let inserted = 0

  for (let i = 0; i < flagsToInsert.length; i += BATCH_SIZE) {
    const batch = flagsToInsert.slice(i, i + BATCH_SIZE)

    for (const flag of batch) {
      await sql`
        INSERT INTO flags (
          candidate_id, type, severity, title, description, source, evidence_url, is_verified
        ) VALUES (
          ${flag.candidate_id}::uuid,
          ${flag.type},
          ${flag.severity},
          ${flag.title},
          ${flag.description},
          ${flag.source},
          ${flag.evidence_url},
          ${flag.is_verified}
        )
      `
      inserted++
    }

    console.log(`  Inserted ${Math.min(i + BATCH_SIZE, flagsToInsert.length)} / ${flagsToInsert.length}`)
  }

  // Summary by party
  console.log('\n=== Summary by party ===')
  const summary = await sql`
    SELECT
      COALESCE(p.short_name, 'SIN PARTIDO') as party,
      f.severity,
      COUNT(*) as cnt
    FROM flags f
    JOIN candidates c ON f.candidate_id = c.id
    LEFT JOIN parties p ON c.party_id = p.id
    GROUP BY p.short_name, f.severity
    ORDER BY p.short_name, f.severity
  `

  let currentParty = ''
  for (const row of summary) {
    if (row.party !== currentParty) {
      currentParty = row.party
      console.log(`\n  ${currentParty}:`)
    }
    console.log(`    ${row.severity}: ${row.cnt}`)
  }

  // FP specific summary
  console.log('\n=== Fuerza Popular specific ===')
  const fpFlags = await sql`
    SELECT
      f.type,
      f.severity,
      COUNT(*) as cnt
    FROM flags f
    JOIN candidates c ON f.candidate_id = c.id
    JOIN parties p ON c.party_id = p.id
    WHERE p.short_name = 'FUERZA POPULAR'
    GROUP BY f.type, f.severity
    ORDER BY f.severity, f.type
  `
  for (const row of fpFlags) {
    console.log(`  ${row.severity} | ${row.type}: ${row.cnt}`)
  }

  const totalFlags = await sql`SELECT COUNT(*) as cnt FROM flags`
  console.log(`\nTotal flags in DB: ${totalFlags[0].cnt}`)
  console.log(`\nDone! Inserted ${inserted} new flags.`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })
