#!/usr/bin/env npx tsx
/**
 * Audit all candidates with civil sentences for incomplete data,
 * then fetch complete data from JNE API and update DB.
 */
import { neon } from '@neondatabase/serverless'

const DATABASE_URL = process.env.DATABASE_URL!
const sql = neon(DATABASE_URL)

const JNE_API = 'https://web.jne.gob.pe/serviciovotoinformado/api/votoinf/hojavida'

interface SentenciaObliga {
  idHvSentenciaObliga: number
  tengoSentenciaObliga: string
  nuItemSentenciaObliga: number
  idParamMateriaSentencia: number
  txMateriaSentencia: string
  txExpedienteObliga: string
  txOrganoJuridicialObliga: string
  txFalloObliga: string
  idEstado: number
  idHojaVida: number
  txComentario: string | null
}

function mapMateria(materia: string): string {
  const m = materia.toLowerCase()
  if (m.includes('violencia')) return 'violencia_familiar'
  if (m.includes('alimento')) return 'alimentos'
  if (m.includes('laboral') || m.includes('trabajo')) return 'laboral'
  return 'contractual'
}

function formatExpediente(raw: string): string {
  // Convert "00849201300301" to "00849-2013-0-0301-JR-FC-01" style if possible
  // The JNE stores it without dashes, but comments often have the full format
  if (raw.includes('-')) return raw
  // Try to parse: NNNNN-YYYY-S-DDDD format (5 digits, 4 year, 1 sala, 4 distrito)
  if (raw.length >= 13) {
    const num = raw.substring(0, 5)
    const year = raw.substring(5, 9)
    const sala = raw.substring(9, 10)
    const dist = raw.substring(10, 14)
    return `${num}-${year}-${sala}-${dist}`
  }
  return raw
}

async function fetchJNESentences(jneId: string): Promise<SentenciaObliga[]> {
  try {
    const res = await fetch(`${JNE_API}?idHojaVida=${jneId}`, {
      headers: {
        'Accept': 'application/json',
        'Origin': 'https://votoinformado.jne.gob.pe',
        'Referer': 'https://votoinformado.jne.gob.pe/',
      },
    })
    if (!res.ok) return []
    const data = await res.json()
    return data.sentenciaObliga || []
  } catch {
    return []
  }
}

async function main() {
  const dryRun = process.argv.includes('--dry-run')

  console.log('=== Auditing ALL candidates with civil sentences ===\n')

  // Get all candidates with civil_sentences
  const candidates = await sql`
    SELECT id, full_name, slug, jne_id, dni, civil_sentences, penal_sentences, cargo
    FROM candidates
    WHERE civil_sentences IS NOT NULL
      AND civil_sentences != '[]'::jsonb
      AND jsonb_array_length(civil_sentences) > 0
    ORDER BY full_name
  `

  console.log(`Found ${candidates.length} candidates with civil sentences\n`)

  let incompleteCount = 0
  let updatedCount = 0

  for (const c of candidates) {
    const sentences = c.civil_sentences as any[]

    // Check if any sentence is incomplete
    const hasIncomplete = sentences.some(s => {
      const noType = !s.type || s.type === ''
      const noCourt = (!s.court || s.court === '') && (!s.juzgado || s.juzgado === '')
      const noDesc = (!s.description || s.description === '') && (!s.sentence || s.sentence === '') && (!s.delito || s.delito === '')
      return noType || noCourt || noDesc
    })

    if (!hasIncomplete) {
      continue
    }

    incompleteCount++
    console.log(`\n--- INCOMPLETE: ${c.full_name} (${c.cargo}, jne_id: ${c.jne_id}) ---`)
    console.log('  Current data:', JSON.stringify(sentences))

    if (!c.jne_id) {
      console.log('  ⚠️  No JNE ID - cannot fetch from API')
      continue
    }

    // Fetch from JNE API
    await new Promise(r => setTimeout(r, 500)) // Rate limit
    const jneSentences = await fetchJNESentences(c.jne_id)

    if (jneSentences.length === 0) {
      console.log('  ⚠️  JNE API returned no sentenciaObliga')
      continue
    }

    console.log(`  ✅ JNE API returned ${jneSentences.length} sentences:`)

    const newSentences = jneSentences.map(s => {
      const expediente = formatExpediente(s.txExpedienteObliga)
      const fullExpediente = s.txComentario?.match(/\d{5}-\d{4}-\d-\d{4}-[A-Z]+-[A-Z]+-\d+/)?.[0] || expediente

      console.log(`    - ${s.txMateriaSentencia}: ${fullExpediente} @ ${s.txOrganoJuridicialObliga} → ${s.txFalloObliga}`)

      return {
        type: mapMateria(s.txMateriaSentencia),
        case_number: fullExpediente,
        court: s.txOrganoJuridicialObliga,
        sentence: s.txFalloObliga,
        date: expediente.split('-')[1] || '2013', // Extract year from expediente
        status: 'firme',
        source: 'jne_declaracion',
        description: `${s.txMateriaSentencia}: ${s.txFalloObliga}${s.txComentario ? '. ' + s.txComentario : ''}`
      }
    })

    if (!dryRun) {
      await sql`
        UPDATE candidates
        SET civil_sentences = ${JSON.stringify(newSentences)}::jsonb
        WHERE id = ${c.id}::uuid
      `
      console.log(`  ✅ Updated in DB`)
      updatedCount++
    } else {
      console.log(`  [DRY RUN] Would update`)
    }
  }

  // Also check candidates who SHOULD have civil sentences but don't
  // (JNE API shows sentenciaObliga but DB has empty array)
  console.log('\n\n=== Checking for MISSING civil sentences (empty in DB but declared in JNE) ===\n')

  const allCandidates = await sql`
    SELECT id, full_name, slug, jne_id, dni, civil_sentences, cargo
    FROM candidates
    WHERE jne_id IS NOT NULL
      AND (civil_sentences IS NULL OR civil_sentences = '[]'::jsonb)
    ORDER BY full_name
  `

  console.log(`Checking ${allCandidates.length} candidates with no civil sentences...\n`)

  let missingCount = 0

  for (const c of allCandidates) {
    if (!c.jne_id) continue

    await new Promise(r => setTimeout(r, 300)) // Rate limit
    const jneSentences = await fetchJNESentences(c.jne_id)

    if (jneSentences.length === 0) continue

    missingCount++
    console.log(`\n--- MISSING: ${c.full_name} (${c.cargo}, jne_id: ${c.jne_id}) ---`)
    console.log(`  JNE API has ${jneSentences.length} civil sentences NOT in DB:`)

    const newSentences = jneSentences.map(s => {
      const expediente = formatExpediente(s.txExpedienteObliga)
      const fullExpediente = s.txComentario?.match(/\d{5}-\d{4}-\d-\d{4}-[A-Z]+-[A-Z]+-\d+/)?.[0] || expediente

      console.log(`    - ${s.txMateriaSentencia}: ${fullExpediente} @ ${s.txOrganoJuridicialObliga} → ${s.txFalloObliga}`)

      return {
        type: mapMateria(s.txMateriaSentencia),
        case_number: fullExpediente,
        court: s.txOrganoJuridicialObliga,
        sentence: s.txFalloObliga,
        date: expediente.split('-')[1] || '',
        status: 'firme',
        source: 'jne_declaracion',
        description: `${s.txMateriaSentencia}: ${s.txFalloObliga}${s.txComentario ? '. ' + s.txComentario : ''}`
      }
    })

    if (!dryRun) {
      await sql`
        UPDATE candidates
        SET civil_sentences = ${JSON.stringify(newSentences)}::jsonb
        WHERE id = ${c.id}::uuid
      `
      console.log(`  ✅ Updated in DB`)
      updatedCount++
    } else {
      console.log(`  [DRY RUN] Would update`)
    }
  }

  console.log('\n\n=== SUMMARY ===')
  console.log(`Candidates with civil sentences: ${candidates.length}`)
  console.log(`Incomplete sentences found: ${incompleteCount}`)
  console.log(`Missing sentences found: ${missingCount}`)
  console.log(`Updated in DB: ${dryRun ? '0 (dry run)' : updatedCount}`)
}

main().catch(console.error)
