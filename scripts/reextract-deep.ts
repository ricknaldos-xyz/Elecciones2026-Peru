/**
 * DEEP RE-EXTRACTION: Extract ALL proposals from under-extracted candidates
 * Processes PDFs in page chunks (~20 pages) to ensure nothing is missed
 * Then deduplicates and merges with existing proposals
 * Uses gemini-2.0-flash with exponential backoff for rate limits
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
const CHUNK_SIZE = 20 // pages per chunk (smaller = less tokens = less rate limiting)
const BASE_DELAY_MS = 4000

const CATEGORIES = [
  'economia', 'salud', 'educacion', 'seguridad', 'corrupcion',
  'mineria_ambiente', 'infraestructura', 'social', 'reforma_politica', 'otros',
] as const

interface PdfPage { text: string; num: number }

interface Proposal {
  category: string
  title: string
  description: string
  sourceQuote: string | null
  pageReference: string | null
}

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

async function callWithRetry(
  model: any,
  prompt: string,
  maxRetries = 3
): Promise<string> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await model.generateContent(prompt)
      return result.response.text()
    } catch (err: any) {
      const msg = err.message || ''
      if ((msg.includes('429') || msg.includes('rate') || msg.includes('fetch') || msg.includes('Resource')) && attempt < maxRetries - 1) {
        const waitTime = Math.min(30000 * Math.pow(2, attempt), 120000) // 30s, 60s, 120s
        console.log(`    ⏳ Rate limit (attempt ${attempt + 1}/${maxRetries}), waiting ${waitTime / 1000}s...`)
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
    // Try recovery - find last complete object
    let lastGoodEnd = -1
    let braceDepth = 0
    let inString = false
    let escape = false

    for (let i = 1; i < jsonStr.length; i++) {
      const ch = jsonStr[i]
      if (escape) { escape = false; continue }
      if (ch === '\\') { escape = true; continue }
      if (ch === '"') { inString = !inString; continue }
      if (inString) continue
      if (ch === '{') braceDepth++
      if (ch === '}') {
        braceDepth--
        if (braceDepth === 0) lastGoodEnd = i
      }
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

function deduplicateProposals(proposals: Proposal[]): Proposal[] {
  const seen = new Map<string, Proposal>()

  for (const p of proposals) {
    const key = p.title.toLowerCase().replace(/[^a-záéíóúñ0-9]/g, '').slice(0, 60)

    if (seen.has(key)) {
      const existing = seen.get(key)!
      if (p.description.length > existing.description.length) {
        seen.set(key, p)
      }
    } else {
      seen.set(key, p)
    }
  }

  return [...seen.values()]
}

const EXTRACTION_PROMPT_CHUNK = `Eres un analista político experto. Te presento un fragmento de un Plan de Gobierno (páginas específicas). Extrae ABSOLUTAMENTE TODAS las propuestas concretas que encuentres en estas páginas.

IMPORTANTE:
- Extrae CADA propuesta concreta, cada actividad específica, cada meta cuantitativa, cada programa propuesto
- Incluye propuestas de TODAS las secciones: objetivos estratégicos, actividades a desarrollar, indicadores con metas, programas propuestos
- Las "actividades a desarrollar" son propuestas concretas — extráelas individualmente
- Las metas cuantitativas específicas (ej: "lograr X% de cobertura") son propuestas — extráelas
- NO agrupes múltiples propuestas en una sola entrada
- NO omitas propuestas por parecer "menores" — TODAS importan
- Si una página es solo índice, portada o texto introductorio sin propuestas, devuelve array vacío []

Categorías:
- economia: Política económica, empleo, impuestos, comercio, agricultura, pesca, turismo, industria
- salud: Sistema de salud, hospitales, medicinas, salud mental
- educacion: Escuelas, universidades, investigación, becas, cultura, deporte, ciencia y tecnología
- seguridad: Policía, crimen, narcotráfico, fuerzas armadas, defensa, fronteras
- corrupcion: Lucha anticorrupción, transparencia, contraloría, justicia, poder judicial
- mineria_ambiente: Minería, medio ambiente, agua, cambio climático, energía, recursos naturales
- infraestructura: Obras públicas, transporte, conectividad, telecomunicaciones, vivienda, saneamiento
- social: Programas sociales, pensiones, pobreza, inclusión, pueblos indígenas, género, discapacidad
- reforma_politica: Reforma del Estado, descentralización, electoral, gobierno digital, relaciones exteriores
- otros: Propuestas que no encajan en las categorías anteriores

Responde SOLO con JSON array (sin markdown):
[
  {
    "category": "<categoria>",
    "title": "<título descriptivo, máx 120 chars>",
    "description": "<descripción clara de la propuesta, máx 400 chars>",
    "sourceQuote": "<cita textual del documento>",
    "pageReference": "<número de página>"
  }
]`

// Candidates ordered by page count (smallest first for quick wins)
// Round 2: under-extracted candidates (<1 proposal/page ratio)
const CANDIDATES_TO_REEXTRACT = [
  'MASSE FERNANDEZ ARMANDO JOAQUIN',           // 32 págs, 19 propuestas
  'SANCHEZ PALOMINO ROBERTO HELBERT',          // 74 págs, 38 propuestas (Juntos por el Perú)
  'YONHY LESCANO ANCIETA',                     // 18 págs, 40 propuestas
  'DIEZ-CANSECO TÁVARA FRANCISCO ERNESTO',     // 25 págs, 43 propuestas
  'ESPA Y GARCES-ALVEAR ALFONSO CARLOS',       // 36 págs, 44 propuestas
  'PAZ DE LA BARRA FREIGEIRO ALVARO GONZALO',  // 33 págs, 46 propuestas
  'ACUÑA PERALTA CESAR',                       // 79 págs, 48 propuestas
  'CERRON ROJAS VLADIMIR ROY',                 // 66 págs, 50 propuestas
  'BELMONT CASSINELLI RICARDO PABLO',          // 27 págs, 54 propuestas
  'CHIRINOS PURIZAGA WALTER GILMER',           // 52 págs, 54 propuestas
  'OLIVERA VEGA LUIS FERNANDO',                // 52 págs, 57 propuestas
  'CALLER GUTIERREZ HERBERT',                  // 33 págs, 59 propuestas
  'BELAUNDE LLOSA RAFAEL JORGE',              // 87 págs, 60 propuestas
  'ALVAREZ LOAYZA CARLOS GONSALO',            // 53 págs, 62 propuestas
  'LOPEZ ALIAGA CAZORLA RAFAEL BERNARDO',     // 25 págs, 62 propuestas
  'ATENCIO SOTOMAYOR RONALD DARWIN',          // 53 págs, 64 propuestas
  'FERNANDEZ BAZAN ROSARIO DEL PILAR',        // 30 págs, 70 propuestas
  'JORGE NIETO MONTESINOS',                   // 98 págs, 77 propuestas
]

async function main() {
  console.log('='.repeat(80))
  console.log(' EXTRACCIÓN PROFUNDA: PROPUESTAS COMPLETAS')
  console.log(` Modelo: ${MODEL} | Chunk: ${CHUNK_SIZE} págs | Delay: ${BASE_DELAY_MS}ms`)
  console.log('='.repeat(80))

  const model = genAI.getGenerativeModel({ model: MODEL })
  let consecutiveErrors = 0

  for (const candidateName of CANDIDATES_TO_REEXTRACT) {
    console.log(`\n${'═'.repeat(70)}`)
    console.log(`📋 ${candidateName}`)

    // Get candidate info
    const candidates = await sql`
      SELECT c.id, c.full_name, c.plan_pdf_local, p.name as party_name
      FROM candidates c
      LEFT JOIN parties p ON c.party_id = p.id
      WHERE c.full_name = ${candidateName}
      AND c.cargo = 'presidente' AND c.is_active = true
    `

    if (candidates.length === 0) { console.log('  ❌ No encontrado'); continue }
    const c = candidates[0]

    if (!c.plan_pdf_local) { console.log('  ❌ Sin PDF'); continue }

    const pdfPath = path.join(process.cwd(), 'public', c.plan_pdf_local as string)
    if (!fs.existsSync(pdfPath)) { console.log('  ❌ PDF no existe'); continue }

    // Get current proposal count
    const currentCount = await sql`
      SELECT COUNT(*) as count FROM candidate_proposals WHERE candidate_id = ${c.id}
    `
    console.log(`  Partido: ${c.party_name}`)
    console.log(`  PDF: ${c.plan_pdf_local}`)
    console.log(`  Propuestas actuales: ${currentCount[0].count}`)

    // Extract text
    const pages = await extractPdfText(pdfPath)
    console.log(`  Páginas: ${pages.length}`)

    // Process in chunks
    const allProposals: Proposal[] = []
    const chunks: PdfPage[][] = []
    for (let i = 0; i < pages.length; i += CHUNK_SIZE) {
      chunks.push(pages.slice(i, i + CHUNK_SIZE))
    }

    console.log(`  Chunks: ${chunks.length} (${CHUNK_SIZE} págs/chunk)`)
    let chunkErrors = 0

    for (let ci = 0; ci < chunks.length; ci++) {
      const chunk = chunks[ci]
      const startPage = chunk[0].num
      const endPage = chunk[chunk.length - 1].num
      const chunkText = chunk.map(p => `[PÁGINA ${p.num}]\n${p.text}`).join('\n\n')

      // Skip very short chunks (likely covers, indices)
      if (chunkText.length < 200) {
        console.log(`  [${ci + 1}/${chunks.length}] Págs ${startPage}-${endPage}: (vacío, saltando)`)
        continue
      }

      // Cap chunk text at 80K chars
      const cappedText = chunkText.length > 80000
        ? chunkText.slice(0, 80000) + '\n[...TRUNCADO...]'
        : chunkText

      const prompt = `${EXTRACTION_PROMPT_CHUNK}

PÁGINAS ${startPage} A ${endPage} DEL PLAN DE GOBIERNO:
---
${cappedText}
---`

      try {
        const responseText = await callWithRetry(model, prompt, 3)
        const proposals = parseAIResponse(responseText)

        allProposals.push(...proposals)
        const icon = proposals.length > 0 ? '✅' : '⚪'
        console.log(`  [${ci + 1}/${chunks.length}] Págs ${startPage}-${endPage}: ${icon} ${proposals.length} propuestas`)
        consecutiveErrors = 0
      } catch (err: any) {
        const msg = err.message?.slice(0, 80) || 'Unknown'
        console.log(`  [${ci + 1}/${chunks.length}] Págs ${startPage}-${endPage}: ❌ ${msg}`)
        chunkErrors++
        consecutiveErrors++

        // If too many consecutive errors, take a long break
        if (consecutiveErrors >= 3) {
          console.log(`  🔴 ${consecutiveErrors} errores consecutivos. Pausa de 120s...`)
          await delay(120000)
          consecutiveErrors = 0
        }
      }

      // Dynamic delay: increase if we've had errors recently
      const dynamicDelay = chunkErrors > 2 ? BASE_DELAY_MS * 3 : BASE_DELAY_MS
      await delay(dynamicDelay)
    }

    // Deduplicate
    const dedupedProposals = deduplicateProposals(allProposals)
    console.log(`\n  Propuestas extraídas (raw): ${allProposals.length}`)
    console.log(`  Propuestas deduplicadas: ${dedupedProposals.length}`)
    console.log(`  Chunks con error: ${chunkErrors}/${chunks.length}`)

    if (dedupedProposals.length <= parseInt(currentCount[0].count as string)) {
      console.log(`  ⚠️ No se encontraron más propuestas que las actuales (${currentCount[0].count}). Manteniendo las existentes.`)
      continue
    }

    // Delete old and insert new
    console.log(`  🔄 Reemplazando ${currentCount[0].count} → ${dedupedProposals.length} propuestas`)

    await sql`DELETE FROM candidate_proposals WHERE candidate_id = ${c.id}`

    let saved = 0
    for (const p of dedupedProposals) {
      try {
        await sql`
          INSERT INTO candidate_proposals (
            candidate_id, category, title, description,
            source_quote, page_reference, ai_extracted, extraction_model
          ) VALUES (
            ${c.id}, ${p.category}, ${p.title}, ${p.description},
            ${p.sourceQuote}, ${p.pageReference}, true, ${MODEL + '-deep'}
          )
        `
        saved++
      } catch (err: any) {
        console.error(`  Error guardando: "${p.title.slice(0, 50)}" — ${err.message?.slice(0, 60)}`)
      }
    }

    console.log(`  ✅ ${saved} propuestas guardadas (antes: ${currentCount[0].count})`)

    // Category breakdown
    const cats: Record<string, number> = {}
    for (const p of dedupedProposals) {
      cats[p.category] = (cats[p.category] || 0) + 1
    }
    console.log(`  Categorías: ${Object.entries(cats).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}:${v}`).join(', ')}`)

    // Cool-down between candidates
    console.log(`  ⏳ Cooldown 10s entre candidatos...`)
    await delay(10000)
  }

  // Final count
  const total = await sql`
    SELECT COUNT(*) as count FROM candidate_proposals cp
    JOIN candidates c ON cp.candidate_id = c.id
    WHERE c.cargo = 'presidente' AND c.is_active = true
  `
  console.log('\n' + '='.repeat(80))
  console.log(` TOTAL PROPUESTAS EN BD: ${total[0].count}`)
  console.log('='.repeat(80))
}

main()
  .then(() => process.exit(0))
  .catch(err => { console.error('Fatal:', err); process.exit(1) })
