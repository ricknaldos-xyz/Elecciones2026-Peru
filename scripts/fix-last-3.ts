/**
 * Fix last 3 distorted proposals
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

function delay(ms: number) { return new Promise(r => setTimeout(r, ms)) }

interface PdfPage { text: string; num: number }

async function extractPdfText(pdfPath: string): Promise<PdfPage[]> {
  const buf = fs.readFileSync(pdfPath)
  const parser = new PDFParseClass({ verbosity: 0, data: new Uint8Array(buf) })
  await parser.load()
  const result = await parser.getText()
  const pages = result.pages as PdfPage[]
  parser.destroy()
  return pages
}

function getRelevantPages(pages: PdfPage[], pageRef: string | null, title: string): string {
  const pageNums: number[] = []
  if (pageRef) {
    const matches = pageRef.match(/\d+/g)
    if (matches) matches.forEach(m => pageNums.push(parseInt(m)))
  }
  if (pageNums.length > 0) {
    const min = Math.max(1, Math.min(...pageNums) - 2)
    const max = Math.max(...pageNums) + 2
    const relevant = pages.filter(p => p.num >= min && p.num <= max)
    if (relevant.length > 0) return relevant.map(p => `[PÁGINA ${p.num}]\n${p.text}`).join('\n\n')
  }
  const keywords = title.split(/\s+/).filter(w => w.length > 4).map(w => w.toLowerCase()).slice(0, 5)
  const scored = pages.map(p => {
    const t = p.text.toLowerCase()
    const hits = keywords.filter(kw => t.includes(kw)).length
    return { page: p, hits }
  }).filter(s => s.hits > 0).sort((a, b) => b.hits - a.hits).slice(0, 8)
  if (scored.length > 0) return scored.map(s => `[PÁGINA ${s.page.num}]\n${s.page.text}`).join('\n\n')
  return pages.slice(0, 15).map(p => `[PÁGINA ${p.num}]\n${p.text}`).join('\n\n')
}

const LAST_3 = [
  { candidate: 'JORGE NIETO MONTESINOS', titleMatch: 'Promoción de la producción nacional de medicamentos',
    issue: 'Simplifica: omite "insumos estratégicos" y mecanismo de "compras corporativas"' },
  { candidate: 'KEIKO SOFÍA FUJIMORI HIGUCHI', titleMatch: 'Construcción de Nuevos Penales',
    issue: 'Omite detalle clave: bajo administración temporal y exclusiva de FF.AA.' },
  { candidate: 'ORTIZ VILLANO ANTONIO', titleMatch: 'Reducir la anemia a menos del 30%',
    issue: 'Frase en columna de indicadores/meta, presentada como propuesta activa' },
]

async function main() {
  console.log('Esperando 90s para cooldown...')
  await delay(90000)

  // Use gemini-2.0-flash as fallback since 2.5-pro is rate limited
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
  const pdfCache = new Map<string, PdfPage[]>()
  let fixed = 0

  for (let i = 0; i < LAST_3.length; i++) {
    const d = LAST_3[i]
    console.log(`\n[${i + 1}/3] ${d.candidate}`)

    const rows = await sql`
      SELECT cp.id, cp.title, cp.description, cp.source_quote, cp.page_reference,
             c.plan_pdf_local
      FROM candidate_proposals cp
      JOIN candidates c ON cp.candidate_id = c.id
      WHERE c.full_name = ${d.candidate}
      AND c.cargo = 'presidente' AND c.is_active = true
      AND cp.title ILIKE ${'%' + d.titleMatch + '%'}
    `

    if (rows.length === 0) { console.log(`  ❌ No encontrada`); continue }

    const prop = rows[0]
    console.log(`  Encontrada: "${(prop.title as string).slice(0, 60)}..."`)

    const pdfLocal = prop.plan_pdf_local as string
    if (!pdfCache.has(pdfLocal)) {
      const pdfPath = path.join(process.cwd(), 'public', pdfLocal)
      pdfCache.set(pdfLocal, await extractPdfText(pdfPath))
    }
    const pages = pdfCache.get(pdfLocal)!
    const relevantText = getRelevantPages(pages, prop.page_reference as string, prop.title as string)

    const prompt = `Eres un corrector de datos. Corrige esta propuesta de Plan de Gobierno.

PÁGINAS DEL PLAN:
---
${relevantText.slice(0, 60000)}
---

PROPUESTA CON ERROR:
- TÍTULO: ${prop.title}
- DESCRIPCIÓN (INCORRECTA): ${prop.description}
- CITA: ${prop.source_quote || 'N/A'}
- PÁG: ${prop.page_reference || 'N/A'}

PROBLEMA: ${d.issue}

JSON válido sin markdown:
{
  "correctedTitle": "título corregido",
  "correctedDescription": "descripción fiel al documento",
  "correctedSourceQuote": "cita correcta o null",
  "changesSummary": "cambios realizados"
}`

    try {
      const result = await model.generateContent(prompt)
      const responseText = result.response.text()
      let jsonStr = responseText.trim()
      if (jsonStr.startsWith('```json')) jsonStr = jsonStr.slice(7)
      else if (jsonStr.startsWith('```')) jsonStr = jsonStr.slice(3)
      if (jsonStr.endsWith('```')) jsonStr = jsonStr.slice(0, -3)
      jsonStr = jsonStr.trim()

      const c = JSON.parse(jsonStr)
      console.log(`  📝 ${c.changesSummary}`)

      await sql`
        UPDATE candidate_proposals
        SET title = ${c.correctedTitle},
            description = ${c.correctedDescription},
            source_quote = ${c.correctedSourceQuote}
        WHERE id = ${prop.id}
      `
      console.log(`  ✅ Actualizada`)
      fixed++
    } catch (err: any) {
      console.log(`  ❌ ${err.message?.slice(0, 120)}`)
    }

    await delay(5000)
  }

  console.log(`\nCorregidas: ${fixed}/3`)
  const count = await sql`
    SELECT COUNT(*) as count FROM candidate_proposals cp
    JOIN candidates c ON cp.candidate_id = c.id WHERE c.cargo = 'presidente' AND c.is_active = true
  `
  console.log(`Total propuestas: ${count[0].count}`)
}

main().then(() => process.exit(0)).catch(err => { console.error('Fatal:', err); process.exit(1) })
