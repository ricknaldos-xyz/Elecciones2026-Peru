#!/usr/bin/env npx tsx
/**
 * Audit all candidates with penal sentences for incomplete data,
 * then fetch complete data from JNE API and update DB.
 */
import { neon } from '@neondatabase/serverless'

const DATABASE_URL = process.env.DATABASE_URL!
const sql = neon(DATABASE_URL)

const JNE_API = 'https://web.jne.gob.pe/serviciovotoinformado/api/votoinf/hojavida'

interface SentenciaPenal {
  idHvSentenciaPenal: number
  tengoSentenciaPenal: string
  nuItemSentenciaPenal: number
  txExpedientePenal: string
  feSentenciaPenal: string
  txOrganoJudiPenal: string
  txDelitoPenal: string
  txFalloPenal: string
  idParamModalidad: number
  txModalidad: string
  txOtraModalidad: string | null
  idParamCumpleFallo: number
  txCumpleFallo: string
  idEstado: number
  idHojaVida: number
  txComentario: string | null
}

async function fetchJNEPenalSentences(jneId: string): Promise<SentenciaPenal[]> {
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
    return data.sentenciaPenal || []
  } catch {
    return []
  }
}

async function main() {
  const dryRun = process.argv.includes('--dry-run')

  console.log('=== Auditing ALL candidates with PENAL sentences ===\n')

  // Get all candidates with penal_sentences
  const candidates = await sql`
    SELECT id, full_name, slug, jne_id, dni, penal_sentences, cargo
    FROM candidates
    WHERE penal_sentences IS NOT NULL
      AND penal_sentences != '[]'::jsonb
      AND jsonb_array_length(penal_sentences) > 0
    ORDER BY full_name
  `

  console.log(`Found ${candidates.length} candidates with penal sentences\n`)

  let incompleteCount = 0
  let updatedCount = 0

  for (const c of candidates) {
    const sentences = c.penal_sentences as any[]

    const hasIncomplete = sentences.some(s => {
      const noType = !s.type || s.type === ''
      const noCourt = (!s.court || s.court === '') && (!s.juzgado || s.juzgado === '')
      const noDesc = (!s.description || s.description === '') && (!s.sentence || s.sentence === '') && (!s.delito || s.delito === '')
      return noType || noCourt || noDesc
    })

    if (!hasIncomplete) continue

    incompleteCount++
    console.log(`\n--- INCOMPLETE: ${c.full_name} (${c.cargo}, jne_id: ${c.jne_id}) ---`)
    console.log('  Current:', JSON.stringify(sentences))

    if (!c.jne_id) {
      console.log('  ⚠️  No JNE ID')
      continue
    }

    await new Promise(r => setTimeout(r, 500))
    const jneSentences = await fetchJNEPenalSentences(c.jne_id)

    if (jneSentences.length === 0) {
      console.log('  ⚠️  JNE API returned no sentenciaPenal')
      continue
    }

    console.log(`  ✅ JNE API returned ${jneSentences.length} penal sentences:`)

    const newSentences = jneSentences.map(s => {
      console.log(`    - ${s.txDelitoPenal}: ${s.txExpedientePenal} @ ${s.txOrganoJudiPenal} → ${s.txFalloPenal} (${s.txModalidad})`)

      return {
        type: s.txDelitoPenal || 'penal',
        case_number: s.txExpedientePenal,
        court: s.txOrganoJudiPenal,
        sentence: s.txFalloPenal,
        date: s.feSentenciaPenal || '',
        modalidad: s.txModalidad || '',
        status: s.txCumpleFallo?.toLowerCase().includes('cumplid') ? 'cumplida' : 'firme',
        source: 'jne_declaracion',
        description: `${s.txDelitoPenal}: ${s.txFalloPenal}. ${s.txModalidad ? 'Modalidad: ' + s.txModalidad + '.' : ''} ${s.txComentario || ''}`.trim()
      }
    })

    if (!dryRun) {
      await sql`
        UPDATE candidates
        SET penal_sentences = ${JSON.stringify(newSentences)}::jsonb
        WHERE id = ${c.id}::uuid
      `
      console.log(`  ✅ Updated in DB`)
      updatedCount++
    } else {
      console.log(`  [DRY RUN] Would update`)
    }
  }

  // Check for MISSING penal sentences
  console.log('\n\n=== Checking for MISSING penal sentences ===\n')

  const allCandidates = await sql`
    SELECT id, full_name, slug, jne_id, dni, penal_sentences, cargo
    FROM candidates
    WHERE jne_id IS NOT NULL
      AND (penal_sentences IS NULL OR penal_sentences = '[]'::jsonb)
    ORDER BY full_name
  `

  console.log(`Checking ${allCandidates.length} candidates with no penal sentences...\n`)

  let missingCount = 0

  for (const c of allCandidates) {
    if (!c.jne_id) continue

    await new Promise(r => setTimeout(r, 300))
    const jneSentences = await fetchJNEPenalSentences(c.jne_id)

    if (jneSentences.length === 0) continue

    missingCount++
    console.log(`\n--- MISSING PENAL: ${c.full_name} (${c.cargo}, jne_id: ${c.jne_id}) ---`)

    const newSentences = jneSentences.map(s => {
      console.log(`    - ${s.txDelitoPenal}: ${s.txExpedientePenal} @ ${s.txOrganoJudiPenal} → ${s.txFalloPenal}`)

      return {
        type: s.txDelitoPenal || 'penal',
        case_number: s.txExpedientePenal,
        court: s.txOrganoJudiPenal,
        sentence: s.txFalloPenal,
        date: s.feSentenciaPenal || '',
        modalidad: s.txModalidad || '',
        status: s.txCumpleFallo?.toLowerCase().includes('cumplid') ? 'cumplida' : 'firme',
        source: 'jne_declaracion',
        description: `${s.txDelitoPenal}: ${s.txFalloPenal}. ${s.txModalidad ? 'Modalidad: ' + s.txModalidad + '.' : ''} ${s.txComentario || ''}`.trim()
      }
    })

    if (!dryRun) {
      await sql`
        UPDATE candidates
        SET penal_sentences = ${JSON.stringify(newSentences)}::jsonb
        WHERE id = ${c.id}::uuid
      `
      console.log(`  ✅ Updated in DB`)
      updatedCount++
    } else {
      console.log(`  [DRY RUN] Would update`)
    }
  }

  console.log('\n\n=== SUMMARY ===')
  console.log(`Candidates with penal sentences: ${candidates.length}`)
  console.log(`Incomplete: ${incompleteCount}`)
  console.log(`Missing: ${missingCount}`)
  console.log(`Updated: ${dryRun ? '0 (dry run)' : updatedCount}`)
}

main().catch(console.error)
