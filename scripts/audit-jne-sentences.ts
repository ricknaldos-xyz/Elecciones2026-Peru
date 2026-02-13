/**
 * Audit script: Cross-reference JNE API sentencias vs our DB for a sample of candidates.
 *
 * For each candidate with a jne_id, fetches the JNE Voto Informado API and compares
 * sentenciaPenal / sentenciaObliga with our penal_sentences / civil_sentences JSONB.
 *
 * Reports:
 *   - MISSING in DB  : JNE API reports sentences we don't have
 *   - PHANTOM in DB   : DB has JNE-sourced sentences the API doesn't show
 *   - COUNT MISMATCH  : Total counts differ
 */

import { neon } from '@neondatabase/serverless'
import * as fs from 'fs'

// ── DB connection ──────────────────────────────────────────────────
const envContent = fs.readFileSync('.env.local', 'utf-8')
const dbMatch = envContent.match(/DATABASE_URL=["']?([^"'\n]+)["']?/)
const sql = neon(dbMatch![1])

// ── Config ─────────────────────────────────────────────────────────
const JNE_API_URL = 'https://web.jne.gob.pe/serviciovotoinformado/api/votoinf/hojavida'
const DELAY_MS = 500
const SAMPLE_SIZE = 200

// ── Types ──────────────────────────────────────────────────────────
interface Discrepancy {
  candidateId: string
  fullName: string
  cargo: string
  jneId: string
  type: 'MISSING_IN_DB' | 'PHANTOM_IN_DB' | 'COUNT_MISMATCH'
  category: 'penal' | 'civil'
  apiCount: number
  dbCount: number
  apiItems: any[]
  dbItems: any[]
  details: string
}

interface CandidateRow {
  id: string
  full_name: string
  cargo: string
  jne_id: string
  penal_sentences: any
  civil_sentences: any
}

// ── Helpers ────────────────────────────────────────────────────────
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function safeArray(val: any): any[] {
  if (Array.isArray(val)) return val
  if (val === null || val === undefined || val === 0) return []
  if (typeof val === 'number') return []
  if (typeof val === 'string') {
    try { const parsed = JSON.parse(val); return Array.isArray(parsed) ? parsed : [] }
    catch { return [] }
  }
  return []
}

function summariseItem(item: any): string {
  // Return a short human-readable description of a sentence item
  const parts: string[] = []
  if (item.strExpedientePenal || item.strExpedienteObliga || item.expediente) {
    parts.push(`exp=${item.strExpedientePenal || item.strExpedienteObliga || item.expediente}`)
  }
  if (item.strDelito || item.strMateria || item.delito) {
    parts.push(`delito/materia="${(item.strDelito || item.strMateria || item.delito || '').substring(0, 60)}"`)
  }
  if (item.strJuzgado || item.strJuzgadoObliga || item.juzgado) {
    parts.push(`juzgado="${(item.strJuzgado || item.strJuzgadoObliga || item.juzgado || '').substring(0, 50)}"`)
  }
  if (item.strPena || item.pena) {
    parts.push(`pena="${(item.strPena || item.pena || '').substring(0, 40)}"`)
  }
  if (item.decMontoObliga || item.monto) {
    parts.push(`monto=${item.decMontoObliga || item.monto}`)
  }
  return parts.join(' | ') || JSON.stringify(item).substring(0, 120)
}

async function fetchJneHojaVida(jneId: string): Promise<any | null> {
  const url = `${JNE_API_URL}?idHojaVida=${jneId}`
  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      }
    })
    if (!response.ok) {
      return { _error: `HTTP ${response.status}`, _status: response.status }
    }
    const data = await response.json()
    return data
  } catch (err: any) {
    return { _error: err.message }
  }
}

// ── Main ───────────────────────────────────────────────────────────
async function main() {
  console.log('='.repeat(80))
  console.log('  AUDIT: JNE API sentencias vs DB  (sample of ' + SAMPLE_SIZE + ' candidates)')
  console.log('='.repeat(80))
  console.log()

  // 1. Get sample of candidates with jne_id -- ensure a mix of cargos
  //    Strategy: take ALL candidates who already have sentences (to maximize
  //    discrepancy detection), then fill the rest with a random mix of
  //    senadores and diputados.

  const withSentences: CandidateRow[] = await sql`
    SELECT id, full_name, cargo, jne_id, penal_sentences, civil_sentences
    FROM candidates
    WHERE is_active = true
      AND jne_id IS NOT NULL AND jne_id <> ''
      AND (
        (penal_sentences IS NOT NULL AND penal_sentences::text NOT IN ('null', '[]', '0'))
        OR (civil_sentences IS NOT NULL AND civil_sentences::text NOT IN ('null', '[]', '0'))
      )
  ` as any

  console.log(`Candidates with jne_id AND sentences in DB: ${withSentences.length}`)

  const senadores: CandidateRow[] = await sql`
    SELECT id, full_name, cargo, jne_id, penal_sentences, civil_sentences
    FROM candidates
    WHERE is_active = true
      AND jne_id IS NOT NULL AND jne_id <> ''
      AND cargo = 'senador'
    ORDER BY random()
    LIMIT 100
  ` as any

  const diputados: CandidateRow[] = await sql`
    SELECT id, full_name, cargo, jne_id, penal_sentences, civil_sentences
    FROM candidates
    WHERE is_active = true
      AND jne_id IS NOT NULL AND jne_id <> ''
      AND cargo = 'diputado'
    ORDER BY random()
    LIMIT 100
  ` as any

  // Merge, dedup by id, cap at SAMPLE_SIZE
  const seen = new Set<string>()
  const candidates: CandidateRow[] = []

  // Priority 1: candidates already known to have sentences
  for (const c of withSentences) {
    if (!seen.has(c.id)) { seen.add(c.id); candidates.push(c) }
  }
  // Priority 2: random senadores
  for (const c of senadores) {
    if (!seen.has(c.id)) { seen.add(c.id); candidates.push(c) }
    if (candidates.length >= SAMPLE_SIZE) break
  }
  // Priority 3: random diputados
  for (const c of diputados) {
    if (!seen.has(c.id)) { seen.add(c.id); candidates.push(c) }
    if (candidates.length >= SAMPLE_SIZE) break
  }

  console.log(`\nFinal sample: ${candidates.length} candidates`)
  const byCargo: Record<string, number> = {}
  for (const c of candidates) {
    byCargo[c.cargo] = (byCargo[c.cargo] || 0) + 1
  }
  for (const [cargo, count] of Object.entries(byCargo)) {
    console.log(`  ${cargo}: ${count}`)
  }
  console.log()

  // 2. Fetch JNE API for each and compare
  const discrepancies: Discrepancy[] = []
  let processed = 0
  let apiErrors = 0
  let matches = 0
  let apiHasSentencesCount = 0
  let dbHasSentencesCount = 0

  // Try one test call first to validate the API endpoint
  console.log('Testing API endpoint with first candidate...')
  const testCandidate = candidates[0]
  const testData = await fetchJneHojaVida(testCandidate.jne_id)
  if (testData?._error) {
    console.log(`  API returned error: ${testData._error}`)
    console.log(`  URL tested: ${JNE_API_URL}?idHojaVida=${testCandidate.jne_id}`)
    console.log('  Trying alternative API structures...')

    // Try alternate endpoint patterns
    const alternatives = [
      `https://web.jne.gob.pe/serviciovotoinformado/api/votoinf/hojavida/${testCandidate.jne_id}`,
      `https://web.jne.gob.pe/serviciovotoinformado/api/HojaVida/GetHVConsolidado?idHojaVida=${testCandidate.jne_id}`,
    ]
    for (const alt of alternatives) {
      try {
        const resp = await fetch(alt, {
          headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' }
        })
        console.log(`  ${alt.substring(0, 80)}... => ${resp.status}`)
        if (resp.ok) {
          const body = await resp.text()
          console.log(`  Response preview: ${body.substring(0, 200)}`)
        }
      } catch (e: any) {
        console.log(`  ${alt.substring(0, 80)}... => ${e.message}`)
      }
    }
  } else {
    // Log structure of a successful response to understand it
    const keys = testData ? Object.keys(testData) : []
    console.log(`  API response keys: ${keys.join(', ')}`)
    if (testData?.data) {
      const dataKeys = Object.keys(testData.data)
      console.log(`  data sub-keys: ${dataKeys.join(', ')}`)
    }
    // Look for sentence-related fields
    const sentenceKeys = keys.filter(k =>
      k.toLowerCase().includes('sentencia') ||
      k.toLowerCase().includes('penal') ||
      k.toLowerCase().includes('obliga')
    )
    if (sentenceKeys.length > 0) {
      console.log(`  Sentence-related keys at top level: ${sentenceKeys.join(', ')}`)
    }
    if (testData?.data) {
      const dataSentenceKeys = Object.keys(testData.data).filter(k =>
        k.toLowerCase().includes('sentencia') ||
        k.toLowerCase().includes('penal') ||
        k.toLowerCase().includes('obliga')
      )
      if (dataSentenceKeys.length > 0) {
        console.log(`  Sentence-related keys in .data: ${dataSentenceKeys.join(', ')}`)
        for (const sk of dataSentenceKeys) {
          console.log(`    ${sk}: ${JSON.stringify(testData.data[sk]).substring(0, 200)}`)
        }
      }
    }
  }
  console.log()

  // Helper to extract sentence arrays from the API response
  function extractSentences(apiData: any): { penal: any[]; civil: any[] } {
    if (!apiData || apiData._error) return { penal: [], civil: [] }

    // Try multiple known response structures
    const root = apiData.data || apiData

    // Structure 1: lSentenciaPenal / lSentenciaObliga (GetHVConsolidado style)
    let penal = safeArray(root.lSentenciaPenal || root.sentenciaPenal || root.SentenciaPenal)
    let civil = safeArray(root.lSentenciaObliga || root.sentenciaObliga || root.SentenciaObliga)

    // Structure 2: nested arrays in root
    if (penal.length === 0 && root.sentenciaPenal) {
      penal = safeArray(root.sentenciaPenal)
    }
    if (civil.length === 0 && root.sentenciaObliga) {
      civil = safeArray(root.sentenciaObliga)
    }

    // Structure 3: data.data nesting
    if (penal.length === 0 && civil.length === 0 && root.data) {
      const inner = root.data
      penal = safeArray(inner.lSentenciaPenal || inner.sentenciaPenal || inner.SentenciaPenal)
      civil = safeArray(inner.lSentenciaObliga || inner.sentenciaObliga || inner.SentenciaObliga)
    }

    return { penal, civil }
  }

  // Process all candidates
  console.log('Processing candidates...\n')
  for (const candidate of candidates) {
    processed++
    if (processed % 25 === 0) {
      console.log(`  Progress: ${processed}/${candidates.length} | discrepancies: ${discrepancies.length} | errors: ${apiErrors}`)
    }

    const apiData = await fetchJneHojaVida(candidate.jne_id)

    if (apiData?._error) {
      apiErrors++
      if (processed <= 5) {
        console.log(`  [${processed}] API error for ${candidate.full_name} (jne_id=${candidate.jne_id}): ${apiData._error}`)
      }
      await delay(DELAY_MS)
      continue
    }

    const apiSentences = extractSentences(apiData)
    const dbPenal = safeArray(candidate.penal_sentences)
    const dbCivil = safeArray(candidate.civil_sentences)

    const apiPenalCount = apiSentences.penal.length
    const apiCivilCount = apiSentences.civil.length
    const dbPenalCount = dbPenal.length
    const dbCivilCount = dbCivil.length

    if (apiPenalCount > 0 || apiCivilCount > 0) apiHasSentencesCount++
    if (dbPenalCount > 0 || dbCivilCount > 0) dbHasSentencesCount++

    let hasIssue = false

    // Check PENAL sentences
    if (apiPenalCount > 0 && dbPenalCount === 0) {
      discrepancies.push({
        candidateId: candidate.id,
        fullName: candidate.full_name,
        cargo: candidate.cargo,
        jneId: candidate.jne_id,
        type: 'MISSING_IN_DB',
        category: 'penal',
        apiCount: apiPenalCount,
        dbCount: dbPenalCount,
        apiItems: apiSentences.penal,
        dbItems: [],
        details: `JNE API has ${apiPenalCount} penal sentence(s) but DB has 0`
      })
      hasIssue = true
    } else if (apiPenalCount === 0 && dbPenalCount > 0) {
      // Check if DB entries are JNE-sourced
      const jneSourcing = dbPenal.filter((s: any) => s.source === 'jne')
      if (jneSourcing.length > 0) {
        discrepancies.push({
          candidateId: candidate.id,
          fullName: candidate.full_name,
          cargo: candidate.cargo,
          jneId: candidate.jne_id,
          type: 'PHANTOM_IN_DB',
          category: 'penal',
          apiCount: 0,
          dbCount: jneSourcing.length,
          apiItems: [],
          dbItems: jneSourcing,
          details: `DB has ${jneSourcing.length} JNE-sourced penal sentence(s) but API shows 0`
        })
        hasIssue = true
      }
    } else if (apiPenalCount !== dbPenalCount && (apiPenalCount > 0 || dbPenalCount > 0)) {
      discrepancies.push({
        candidateId: candidate.id,
        fullName: candidate.full_name,
        cargo: candidate.cargo,
        jneId: candidate.jne_id,
        type: 'COUNT_MISMATCH',
        category: 'penal',
        apiCount: apiPenalCount,
        dbCount: dbPenalCount,
        apiItems: apiSentences.penal,
        dbItems: dbPenal,
        details: `Penal count mismatch: API=${apiPenalCount}, DB=${dbPenalCount}`
      })
      hasIssue = true
    }

    // Check CIVIL sentences
    if (apiCivilCount > 0 && dbCivilCount === 0) {
      discrepancies.push({
        candidateId: candidate.id,
        fullName: candidate.full_name,
        cargo: candidate.cargo,
        jneId: candidate.jne_id,
        type: 'MISSING_IN_DB',
        category: 'civil',
        apiCount: apiCivilCount,
        dbCount: dbCivilCount,
        apiItems: apiSentences.civil,
        dbItems: [],
        details: `JNE API has ${apiCivilCount} civil sentence(s) but DB has 0`
      })
      hasIssue = true
    } else if (apiCivilCount === 0 && dbCivilCount > 0) {
      const jneSourcing = dbCivil.filter((s: any) => s.source === 'jne')
      if (jneSourcing.length > 0) {
        discrepancies.push({
          candidateId: candidate.id,
          fullName: candidate.full_name,
          cargo: candidate.cargo,
          jneId: candidate.jne_id,
          type: 'PHANTOM_IN_DB',
          category: 'civil',
          apiCount: 0,
          dbCount: jneSourcing.length,
          apiItems: [],
          dbItems: jneSourcing,
          details: `DB has ${jneSourcing.length} JNE-sourced civil sentence(s) but API shows 0`
        })
        hasIssue = true
      }
    } else if (apiCivilCount !== dbCivilCount && (apiCivilCount > 0 || dbCivilCount > 0)) {
      discrepancies.push({
        candidateId: candidate.id,
        fullName: candidate.full_name,
        cargo: candidate.cargo,
        jneId: candidate.jne_id,
        type: 'COUNT_MISMATCH',
        category: 'civil',
        apiCount: apiCivilCount,
        dbCount: dbCivilCount,
        apiItems: apiSentences.civil,
        dbItems: dbCivil,
        details: `Civil count mismatch: API=${apiCivilCount}, DB=${dbCivilCount}`
      })
      hasIssue = true
    }

    if (!hasIssue && (apiPenalCount > 0 || apiCivilCount > 0 || dbPenalCount > 0 || dbCivilCount > 0)) {
      matches++
    }

    await delay(DELAY_MS)
  }

  // ── Report ─────────────────────────────────────────────────────
  console.log('\n' + '='.repeat(80))
  console.log('  AUDIT RESULTS')
  console.log('='.repeat(80))

  console.log(`\n--- Summary ---`)
  console.log(`  Candidates processed   : ${processed}`)
  console.log(`  API errors (skipped)   : ${apiErrors}`)
  console.log(`  Successfully compared  : ${processed - apiErrors}`)
  console.log(`  API reports sentences  : ${apiHasSentencesCount}`)
  console.log(`  DB has sentences       : ${dbHasSentencesCount}`)
  console.log(`  Perfect matches        : ${matches}`)
  console.log(`  Total discrepancies    : ${discrepancies.length}`)

  // Categorise
  const missing = discrepancies.filter(d => d.type === 'MISSING_IN_DB')
  const phantom = discrepancies.filter(d => d.type === 'PHANTOM_IN_DB')
  const mismatch = discrepancies.filter(d => d.type === 'COUNT_MISMATCH')

  console.log(`\n  MISSING in DB (JNE has, we don't) : ${missing.length}`)
  console.log(`  PHANTOM in DB (we have, JNE doesn't) : ${phantom.length}`)
  console.log(`  COUNT MISMATCH                     : ${mismatch.length}`)

  // ── MISSING in DB (most important) ─────────────────────────────
  if (missing.length > 0) {
    console.log('\n' + '='.repeat(80))
    console.log('  MISSING IN DB - Sentences from JNE API not in our database')
    console.log('='.repeat(80))
    for (const d of missing) {
      console.log(`\n  ** ${d.fullName} (${d.cargo}) [jne_id=${d.jneId}]`)
      console.log(`     Category: ${d.category.toUpperCase()} | API count: ${d.apiCount} | DB count: ${d.dbCount}`)
      console.log(`     ${d.details}`)
      console.log(`     API items:`)
      for (const item of d.apiItems) {
        console.log(`       - ${summariseItem(item)}`)
      }
    }
  }

  // ── PHANTOM in DB ──────────────────────────────────────────────
  if (phantom.length > 0) {
    console.log('\n' + '='.repeat(80))
    console.log('  PHANTOM IN DB - JNE-sourced sentences in DB but NOT in API')
    console.log('='.repeat(80))
    for (const d of phantom) {
      console.log(`\n  ** ${d.fullName} (${d.cargo}) [jne_id=${d.jneId}]`)
      console.log(`     Category: ${d.category.toUpperCase()} | API count: ${d.apiCount} | DB count: ${d.dbCount}`)
      console.log(`     ${d.details}`)
      console.log(`     DB items:`)
      for (const item of d.dbItems) {
        console.log(`       - ${summariseItem(item)}`)
      }
    }
  }

  // ── COUNT MISMATCH ─────────────────────────────────────────────
  if (mismatch.length > 0) {
    console.log('\n' + '='.repeat(80))
    console.log('  COUNT MISMATCH - Both have sentences but counts differ')
    console.log('='.repeat(80))
    for (const d of mismatch) {
      console.log(`\n  ** ${d.fullName} (${d.cargo}) [jne_id=${d.jneId}]`)
      console.log(`     Category: ${d.category.toUpperCase()} | API count: ${d.apiCount} | DB count: ${d.dbCount}`)
      console.log(`     ${d.details}`)
      if (d.apiItems.length > 0) {
        console.log(`     API items:`)
        for (const item of d.apiItems) {
          console.log(`       - ${summariseItem(item)}`)
        }
      }
      if (d.dbItems.length > 0) {
        console.log(`     DB items:`)
        for (const item of d.dbItems) {
          console.log(`       - ${summariseItem(item)}`)
        }
      }
    }
  }

  if (discrepancies.length === 0 && apiErrors === 0) {
    console.log('\n  All sentences match between JNE API and our DB. No discrepancies found.')
  }

  // Save full report as JSON for further analysis
  const reportPath = 'scripts/audit-jne-sentences-report.json'
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    summary: {
      processed,
      apiErrors,
      apiHasSentences: apiHasSentencesCount,
      dbHasSentences: dbHasSentencesCount,
      perfectMatches: matches,
      totalDiscrepancies: discrepancies.length,
      missingInDb: missing.length,
      phantomInDb: phantom.length,
      countMismatch: mismatch.length,
    },
    discrepancies: discrepancies.map(d => ({
      ...d,
      apiItems: d.apiItems,
      dbItems: d.dbItems,
    })),
  }, null, 2))
  console.log(`\nFull report saved to: ${reportPath}`)
}

main()
  .then(() => process.exit(0))
  .catch(err => { console.error('Fatal error:', err); process.exit(1) })
