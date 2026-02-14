/**
 * Final attempt at remaining missed chunks
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
const CATEGORIES = ['economia','salud','educacion','seguridad','corrupcion','mineria_ambiente','infraestructura','social','reforma_politica','otros'] as const

interface PdfPage { text: string; num: number }
interface Proposal { category: string; title: string; description: string; sourceQuote: string|null; pageReference: string|null }
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
    if (Array.isArray(parsed)) return parsed.filter(item =>
      item && typeof item === 'object' && typeof item.category === 'string' &&
      typeof item.title === 'string' && CATEGORIES.includes(item.category)
    ).map(item => ({
      category: item.category,
      title: String(item.title).slice(0, 250),
      description: String(item.description || '').slice(0, 600),
      sourceQuote: item.sourceQuote ? String(item.sourceQuote).slice(0, 600) : null,
      pageReference: item.pageReference ? String(item.pageReference) : null,
    }))
  } catch { /* ignore */ }
  return []
}

const PROMPT = `Eres un analista político experto. Extrae ABSOLUTAMENTE TODAS las propuestas concretas de estas páginas.
Categorías: economia, salud, educacion, seguridad, corrupcion, mineria_ambiente, infraestructura, social, reforma_politica, otros
Responde SOLO con JSON array (sin markdown):
[{"category":"<cat>","title":"<título>","description":"<descripción>","sourceQuote":"<cita>","pageReference":"<página>"}]`

const MISSED: { candidate: string; pageRanges: [number, number][] }[] = [
  { candidate: 'JOSÉ WILLIAMS ZAPATA', pageRanges: [[81, 100]] },
  { candidate: 'CHIABRA LEON ROBERTO ENRIQUE', pageRanges: [[1, 20], [101, 120]] },
  { candidate: 'VIZCARRA CORNEJO MARIO ENRIQUE', pageRanges: [[81, 100], [161, 179]] },
  { candidate: 'GROZO COSTA WOLFGANG MARIO', pageRanges: [[181, 200]] },
  { candidate: 'ALEX GONZALES CASTILLO', pageRanges: [[161, 180], [281, 300]] },
]

async function main() {
  console.log('Waiting 5 min cooldown...')
  await delay(300000)
  console.log('Starting...')

  const model = genAI.getGenerativeModel({ model: MODEL })
  const pdfCache = new Map<string, PdfPage[]>()
  let totalNew = 0

  for (const entry of MISSED) {
    console.log(`\n📋 ${entry.candidate}`)
    const candidates = await sql`
      SELECT c.id, c.plan_pdf_local FROM candidates c
      WHERE c.full_name = ${entry.candidate} AND c.cargo = 'presidente' AND c.is_active = true
    `
    if (candidates.length === 0) { console.log('  ❌ Not found'); continue }
    const c = candidates[0]
    const pdfLocal = c.plan_pdf_local as string
    if (!pdfCache.has(pdfLocal)) {
      pdfCache.set(pdfLocal, await extractPdfText(path.join(process.cwd(), 'public', pdfLocal)))
    }
    const allPages = pdfCache.get(pdfLocal)!

    const existing = await sql`SELECT title FROM candidate_proposals WHERE candidate_id = ${c.id}`
    const existingTitles = new Set(existing.map((r: any) => (r.title as string).toLowerCase().replace(/[^a-záéíóúñ0-9]/g, '').slice(0, 60)))

    for (const [startPage, endPage] of entry.pageRanges) {
      const chunk = allPages.filter(p => p.num >= startPage && p.num <= endPage)
      if (chunk.length === 0) { continue }
      const chunkText = chunk.map(p => `[PÁGINA ${p.num}]\n${p.text}`).join('\n\n')
      if (chunkText.length < 200) { console.log(`  [${startPage}-${endPage}] (vacío)`); continue }

      const cappedText = chunkText.slice(0, 80000)
      const prompt = `${PROMPT}\n\nPÁGINAS ${startPage}-${endPage}:\n---\n${cappedText}\n---`

      for (let attempt = 0; attempt < 5; attempt++) {
        try {
          const result = await model.generateContent(prompt)
          const proposals = parseAIResponse(result.response.text())
          const newOnes = proposals.filter(p => {
            const key = p.title.toLowerCase().replace(/[^a-záéíóúñ0-9]/g, '').slice(0, 60)
            return !existingTitles.has(key)
          })
          let saved = 0
          for (const p of newOnes) {
            try {
              await sql`INSERT INTO candidate_proposals (candidate_id, category, title, description, source_quote, page_reference, ai_extracted, extraction_model)
                VALUES (${c.id}, ${p.category}, ${p.title}, ${p.description}, ${p.sourceQuote}, ${p.pageReference}, true, ${MODEL + '-deep-final'})`
              saved++
              existingTitles.add(p.title.toLowerCase().replace(/[^a-záéíóúñ0-9]/g, '').slice(0, 60))
            } catch { /* skip */ }
          }
          console.log(`  [${startPage}-${endPage}] ✅ ${proposals.length} extracted, ${saved} new`)
          totalNew += saved
          break
        } catch {
          const waitTime = Math.min(60000 * Math.pow(2, attempt), 300000)
          console.log(`  [${startPage}-${endPage}] ⏳ attempt ${attempt + 1}, waiting ${waitTime / 1000}s...`)
          await delay(waitTime)
        }
      }
      await delay(10000)
    }
  }

  const total = await sql`SELECT COUNT(*) as count FROM candidate_proposals cp JOIN candidates c ON cp.candidate_id = c.id WHERE c.cargo = 'presidente' AND c.is_active = true`
  console.log(`\nNew: ${totalNew} | Total: ${total[0].count}`)
}

main().then(() => process.exit(0)).catch(err => { console.error('Fatal:', err); process.exit(1) })
