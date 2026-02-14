/**
 * Fix remaining 10 distorted proposals that hit rate limits in the first run
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
const MODEL = 'gemini-2.5-pro'

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

const REMAINING = [
  { candidate: 'ATENCIO SOTOMAYOR RONALD DARWIN', titleMatch: 'Aumento del presupuesto de educación al 6% del PBI',
    issue: 'Dice 6% del PBI pero el documento dice 6% del presupuesto público' },
  { candidate: 'CERRON ROJAS VLADIMIR ROY', titleMatch: 'Reducir el gasto de bolsillo en salud',
    issue: 'Imprecisión en la métrica del 10%' },
  { candidate: 'FERNANDEZ BAZAN ROSARIO DEL PILAR', titleMatch: 'Implementación de tecnologías limpias en operaciones mineras',
    issue: 'Usa "Exigir" pero el documento dice "Implementar"' },
  { candidate: 'JORGE NIETO MONTESINOS', titleMatch: 'Promoción de la producción nacional de medicamentos',
    issue: 'Simplifica la propuesta sobre medicamentos e insumos estratégicos' },
  { candidate: 'KEIKO SOFÍA FUJIMORI HIGUCHI', titleMatch: 'Construcción de Nuevos Penales',
    issue: 'Omite que estarán bajo administración temporal y exclusiva de FF.AA.' },
  { candidate: 'ORTIZ VILLANO ANTONIO', titleMatch: 'Reducir la anemia a menos del 30%',
    issue: 'Frase está en columna de indicadores, no como propuesta activa' },
  { candidate: 'PEREZ TELLO DE RODRIGUEZ MARIA SOLEDAD', titleMatch: 'Destrabar proyectos de inversión minera',
    issue: 'La meta es reducir HASTA US$10,000M, no destrabar esa cantidad' },
  { candidate: 'SANCHEZ PALOMINO ROBERTO HELBERT', titleMatch: 'Beca Segunda Oportunidad',
    issue: 'Distorsión en descripción del programa: edad objetivo y condiciones' },
  { candidate: 'MOLINELLI ARISTONDO FIORELLA GIANNINA', titleMatch: 'Lucha frontal contra la corrupción',
    issue: 'Descripción y cita corresponden a mitigación de riesgos, no a corrupción' },
  { candidate: 'OLIVERA VEGA LUIS FERNANDO', titleMatch: 'Droguería y Laboratorio Farmacéutico Nacional',
    issue: 'Son dos propuestas separadas combinadas incorrectamente en una' },
]

async function main() {
  console.log('='.repeat(80))
  console.log(' CORRECCIÓN DE 10 PROPUESTAS RESTANTES')
  console.log('='.repeat(80))

  const model = genAI.getGenerativeModel({ model: MODEL })
  const pdfCache = new Map<string, PdfPage[]>()
  let fixed = 0, errors = 0

  for (let i = 0; i < REMAINING.length; i++) {
    const d = REMAINING[i]
    console.log(`\n[${i + 1}/${REMAINING.length}] ${d.candidate}`)
    console.log(`  Buscando: "${d.titleMatch}"`)

    const rows = await sql`
      SELECT cp.id, cp.title, cp.description, cp.source_quote, cp.page_reference,
             c.plan_pdf_local
      FROM candidate_proposals cp
      JOIN candidates c ON cp.candidate_id = c.id
      WHERE c.full_name = ${d.candidate}
      AND c.cargo = 'presidente' AND c.is_active = true
      AND cp.title ILIKE ${'%' + d.titleMatch + '%'}
    `

    if (rows.length === 0) {
      console.log(`  ❌ No encontrada`)
      errors++
      continue
    }

    const prop = rows[0]
    console.log(`  Encontrada: "${(prop.title as string).slice(0, 60)}..."`)

    const pdfLocal = prop.plan_pdf_local as string
    if (!pdfCache.has(pdfLocal)) {
      const pdfPath = path.join(process.cwd(), 'public', pdfLocal)
      if (!fs.existsSync(pdfPath)) { console.log(`  ❌ PDF no existe`); errors++; continue }
      pdfCache.set(pdfLocal, await extractPdfText(pdfPath))
    }
    const pages = pdfCache.get(pdfLocal)!
    const relevantText = getRelevantPages(pages, prop.page_reference as string, prop.title as string)

    const prompt = `Eres un corrector de datos. Tienes una propuesta de un Plan de Gobierno que fue extraída con una descripción INCORRECTA o DISTORSIONADA.

PÁGINAS RELEVANTES DEL PLAN DE GOBIERNO:
---
${relevantText.slice(0, 80000)}
---

PROPUESTA ACTUAL (con error):
- TÍTULO: ${prop.title}
- DESCRIPCIÓN ACTUAL (INCORRECTA): ${prop.description}
- CITA FUENTE: ${prop.source_quote || 'N/A'}
- PÁGINA REF: ${prop.page_reference || 'N/A'}

PROBLEMA DETECTADO: ${d.issue}

Proporciona la descripción CORREGIDA que sea 100% fiel al texto del documento.
- Mantén el mismo estilo y formato
- Solo corrige lo incorrecto/distorsionado
- Usa las palabras exactas del documento cuando sea posible

Responde SOLO con JSON válido (sin markdown):
{
  "correctedTitle": "título corregido o el mismo si está bien",
  "correctedDescription": "descripción corregida fiel al documento",
  "correctedSourceQuote": "cita textual correcta del documento o null",
  "changesSummary": "breve resumen de lo que se cambió"
}`

    try {
      const result = await model.generateContent(prompt)
      const responseText = result.response.text()
      let jsonStr = responseText.trim()
      if (jsonStr.startsWith('```json')) jsonStr = jsonStr.slice(7)
      else if (jsonStr.startsWith('```')) jsonStr = jsonStr.slice(3)
      if (jsonStr.endsWith('```')) jsonStr = jsonStr.slice(0, -3)
      jsonStr = jsonStr.trim()

      const correction = JSON.parse(jsonStr)
      console.log(`  📝 Cambios: ${correction.changesSummary}`)

      await sql`
        UPDATE candidate_proposals
        SET title = ${correction.correctedTitle},
            description = ${correction.correctedDescription},
            source_quote = ${correction.correctedSourceQuote}
        WHERE id = ${prop.id}
      `
      console.log(`  ✅ Actualizada`)
      fixed++
    } catch (err: any) {
      console.log(`  ❌ Error: ${err.message?.slice(0, 100)}`)
      errors++
    }

    await delay(5000)
  }

  console.log('\n' + '='.repeat(80))
  console.log(` Corregidas: ${fixed} | Errores: ${errors}`)
  console.log('='.repeat(80))

  const count = await sql`
    SELECT COUNT(*) as count FROM candidate_proposals cp
    JOIN candidates c ON cp.candidate_id = c.id
    WHERE c.cargo = 'presidente' AND c.is_active = true
  `
  console.log(`Total propuestas en BD: ${count[0].count}`)
}

main()
  .then(() => process.exit(0))
  .catch(err => { console.error('Fatal:', err); process.exit(1) })
