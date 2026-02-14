/**
 * RE-EXTRACT missed chunks from first deep run
 * Only processes the specific page ranges that failed due to rate limits
 * Merges results with existing proposals (does NOT replace)
 */

import * as fs from 'fs'
import * as path from 'path'
import { neon } from '@neondatabase/serverless'
import { GoogleGenerativeAI } from '@google/generative-ai'

// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParseModule = require('pdf-parse')
const PDFParseClass = pdfParseModule.PDFParse

function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local')
  const content = fs.readFileSync(envPath, 'utf-8')
  const dbMatch = content.match(/DATABASE_URL=["']?([^"'\n]+)["']?/)
  const aiMatch = content.match(/GOOGLE_AI_API_KEY=["']?([^"'\n]+)["']?/)
  return { db: dbMatch![1], ai: aiMatch![1] }
}

const env = loadEnv()
const sql = neon(env.db)
const genAI = new GoogleGenerativeAI(env.ai)
const MODEL = 'gemini-2.0-flash'

const CATEGORIES = [
  'economia', 'salud', 'educacion', 'seguridad', 'corrupcion',
  'mineria_ambiente', 'infraestructura', 'social', 'reforma_politica', 'otros',
] as const

interface PdfPage { text: string; num: number }
interface Proposal { category: string; title: string; description: string; sourceQuote: string | null; pageReference: string | null }

function delay(ms: number) { return new Promise(r => setTimeout(r, ms)) }

async function extractPdfText(pdfPath: string): Promise<PdfPage[]> {
  const buf = fs.readFileSync(pdfPath)
  const parser = new PDFParseClass({ verbosity: 0, data: new Uint8Array(buf) })
  await parser.load()
  const result = await parser.getText()
  const pages = result.pages as PdfPage[]
  parser.destroy()
  return pages
}

async function callWithRetry(model: any, prompt: string, maxRetries = 4): Promise<string> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await model.generateContent(prompt)
      return result.response.text()
    } catch (err: any) {
      const msg = err.message || ''
      if (attempt < maxRetries - 1) {
        const waitTime = Math.min(45000 * Math.pow(2, attempt), 180000)
        console.log(`    ⏳ Retry ${attempt + 1}/${maxRetries}, waiting ${waitTime / 1000}s...`)
        await delay(waitTime)
        continue
      }
      throw err
    }
  }
  throw new Error('Max retries exceeded')
}

function parseAIResponse(response: string): Proposal[] {
  let jsonStr = response.trim()
  if (jsonStr.startsWith('```json')) jsonStr = jsonStr.slice(7)
  else if (jsonStr.startsWith('```')) jsonStr = jsonStr.slice(3)
  if (jsonStr.endsWith('```')) jsonStr = jsonStr.slice(0, -3)
  jsonStr = jsonStr.trim()
  const arrayStart = jsonStr.indexOf('[')
  if (arrayStart === -1) return []
  jsonStr = jsonStr.substring(arrayStart)
  try {
    const parsed = JSON.parse(jsonStr)
    if (Array.isArray(parsed)) return filterProposals(parsed)
  } catch {
    let lastGoodEnd = -1, braceDepth = 0, inString = false, escape = false
    for (let i = 1; i < jsonStr.length; i++) {
      const ch = jsonStr[i]
      if (escape) { escape = false; continue }
      if (ch === '\\') { escape = true; continue }
      if (ch === '"') { inString = !inString; continue }
      if (inString) continue
      if (ch === '{') braceDepth++
      if (ch === '}') { braceDepth--; if (braceDepth === 0) lastGoodEnd = i }
    }
    if (lastGoodEnd > 0) {
      try {
        const parsed = JSON.parse(jsonStr.substring(0, lastGoodEnd + 1) + ']')
        if (Array.isArray(parsed)) return filterProposals(parsed)
      } catch { /* ignore */ }
    }
  }
  return []
}

function filterProposals(parsed: any[]): Proposal[] {
  return parsed.filter(item =>
    item && typeof item === 'object' &&
    typeof item.category === 'string' &&
    typeof item.title === 'string' &&
    CATEGORIES.includes(item.category)
  ).map(item => ({
    category: item.category,
    title: String(item.title).slice(0, 250),
    description: String(item.description || '').slice(0, 600),
    sourceQuote: item.sourceQuote ? String(item.sourceQuote).slice(0, 600) : null,
    pageReference: item.pageReference ? String(item.pageReference) : null,
  }))
}

const EXTRACTION_PROMPT = `Eres un analista político experto. Extrae ABSOLUTAMENTE TODAS las propuestas concretas de estas páginas de Plan de Gobierno.

IMPORTANTE: Extrae CADA propuesta, actividad, meta cuantitativa y programa propuesto. NO omitas nada.

Categorías: economia, salud, educacion, seguridad, corrupcion, mineria_ambiente, infraestructura, social, reforma_politica, otros

Responde SOLO con JSON array (sin markdown):
[{"category":"<cat>","title":"<título, max 120 chars>","description":"<descripción, max 400 chars>","sourceQuote":"<cita>","pageReference":"<página>"}]`

// Failed chunks from first run (candidate name → page ranges that failed)
const MISSED_CHUNKS: { candidate: string; pageRanges: [number, number][] }[] = [
  { candidate: 'VALDERRAMA PEÑA PITTER ENRIQUE', pageRanges: [[81, 100]] },
  { candidate: 'LOPEZ CHAU NAVA PABLO ALFONSO', pageRanges: [[1, 20], [21, 40], [121, 140]] },
  { candidate: 'JOSÉ WILLIAMS ZAPATA', pageRanges: [[41, 60], [81, 100]] },
  { candidate: 'CHIABRA LEON ROBERTO ENRIQUE', pageRanges: [[1, 20], [61, 80], [81, 100], [101, 120]] },
  { candidate: 'VIZCARRA CORNEJO MARIO ENRIQUE', pageRanges: [[21, 40], [81, 100], [141, 160], [161, 179]] },
  { candidate: 'GROZO COSTA WOLFGANG MARIO', pageRanges: [[101, 120], [181, 200], [201, 220], [241, 260]] },
  { candidate: 'MOLINELLI ARISTONDO FIORELLA GIANNINA', pageRanges: [[41, 60], [81, 100], [141, 160], [181, 200], [221, 240], [261, 280], [301, 320]] },
  { candidate: 'GUEVARA AMASIFUEN MESIAS ANTONIO', pageRanges: [[101, 120], [141, 160], [161, 180], [301, 320]] },
  { candidate: 'ALEX GONZALES CASTILLO', pageRanges: [[41, 60], [61, 80], [121, 140], [161, 180], [281, 300], [301, 320], [361, 380], [441, 457]] },
]

async function main() {
  console.log('='.repeat(80))
  console.log(' RE-EXTRACTING MISSED CHUNKS')
  console.log(` ${MISSED_CHUNKS.reduce((sum, c) => sum + c.pageRanges.length, 0)} chunks to process`)
  console.log(' Waiting 5 minutes for rate limit cooldown...')
  console.log('='.repeat(80))
  await delay(300000) // 5 min cooldown

  const model = genAI.getGenerativeModel({ model: MODEL })
  const pdfCache = new Map<string, PdfPage[]>()
  let totalNew = 0

  for (const entry of MISSED_CHUNKS) {
    console.log(`\n${'═'.repeat(60)}`)
    console.log(`📋 ${entry.candidate} (${entry.pageRanges.length} chunks)`)

    const candidates = await sql`
      SELECT c.id, c.plan_pdf_local
      FROM candidates c
      WHERE c.full_name = ${entry.candidate}
      AND c.cargo = 'presidente' AND c.is_active = true
    `
    if (candidates.length === 0) { console.log('  ❌ No encontrado'); continue }
    const c = candidates[0]
    if (!c.plan_pdf_local) { console.log('  ❌ Sin PDF'); continue }

    const pdfLocal = c.plan_pdf_local as string
    if (!pdfCache.has(pdfLocal)) {
      const pdfPath = path.join(process.cwd(), 'public', pdfLocal)
      pdfCache.set(pdfLocal, await extractPdfText(pdfPath))
    }
    const allPages = pdfCache.get(pdfLocal)!

    // Get existing titles to avoid duplicates
    const existing = await sql`
      SELECT title FROM candidate_proposals WHERE candidate_id = ${c.id}
    `
    const existingTitles = new Set(
      existing.map((r: any) => (r.title as string).toLowerCase().replace(/[^a-záéíóúñ0-9]/g, '').slice(0, 60))
    )

    let addedForCandidate = 0

    for (const [startPage, endPage] of entry.pageRanges) {
      const chunk = allPages.filter(p => p.num >= startPage && p.num <= endPage)
      if (chunk.length === 0) { console.log(`  [${startPage}-${endPage}] No pages found`); continue }

      const chunkText = chunk.map(p => `[PÁGINA ${p.num}]\n${p.text}`).join('\n\n')
      if (chunkText.length < 200) { console.log(`  [${startPage}-${endPage}] (vacío)`); continue }

      const cappedText = chunkText.length > 80000 ? chunkText.slice(0, 80000) + '\n[...TRUNCADO...]' : chunkText
      const prompt = `${EXTRACTION_PROMPT}\n\nPÁGINAS ${startPage} A ${endPage}:\n---\n${cappedText}\n---`

      try {
        const responseText = await callWithRetry(model, prompt, 4)
        const proposals = parseAIResponse(responseText)

        // Filter out duplicates
        const newProposals = proposals.filter(p => {
          const key = p.title.toLowerCase().replace(/[^a-záéíóúñ0-9]/g, '').slice(0, 60)
          return !existingTitles.has(key)
        })

        // Insert new ones
        let saved = 0
        for (const p of newProposals) {
          try {
            await sql`
              INSERT INTO candidate_proposals (
                candidate_id, category, title, description,
                source_quote, page_reference, ai_extracted, extraction_model
              ) VALUES (
                ${c.id}, ${p.category}, ${p.title}, ${p.description},
                ${p.sourceQuote}, ${p.pageReference}, true, ${MODEL + '-deep-retry'}
              )
            `
            saved++
            existingTitles.add(p.title.toLowerCase().replace(/[^a-záéíóúñ0-9]/g, '').slice(0, 60))
          } catch { /* skip duplicates */ }
        }

        console.log(`  [${startPage}-${endPage}] ✅ ${proposals.length} extracted, ${saved} new added`)
        addedForCandidate += saved
      } catch (err: any) {
        console.log(`  [${startPage}-${endPage}] ❌ ${err.message?.slice(0, 80)}`)
      }

      await delay(8000)
    }

    totalNew += addedForCandidate
    console.log(`  → +${addedForCandidate} nuevas propuestas para ${entry.candidate}`)
  }

  const total = await sql`
    SELECT COUNT(*) as count FROM candidate_proposals cp
    JOIN candidates c ON cp.candidate_id = c.id
    WHERE c.cargo = 'presidente' AND c.is_active = true
  `
  console.log('\n' + '='.repeat(80))
  console.log(` NUEVAS AGREGADAS: ${totalNew}`)
  console.log(` TOTAL PROPUESTAS EN BD: ${total[0].count}`)
  console.log('='.repeat(80))
}

main()
  .then(() => process.exit(0))
  .catch(err => { console.error('Fatal:', err); process.exit(1) })
