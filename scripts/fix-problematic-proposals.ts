/**
 * Fix 23 problematic proposals:
 * - DELETE 1 invented proposal
 * - CORRECT 22 distorted proposals using Gemini to re-extract accurate descriptions
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
  // Try page reference first
  const pageNums: number[] = []
  if (pageRef) {
    const matches = pageRef.match(/\d+/g)
    if (matches) matches.forEach(m => pageNums.push(parseInt(m)))
  }

  if (pageNums.length > 0) {
    const min = Math.max(1, Math.min(...pageNums) - 2)
    const max = Math.max(...pageNums) + 2
    const relevant = pages.filter(p => p.num >= min && p.num <= max)
    if (relevant.length > 0) {
      return relevant.map(p => `[PÁGINA ${p.num}]\n${p.text}`).join('\n\n')
    }
  }

  // Keyword search fallback
  const keywords = title.split(/\s+/).filter(w => w.length > 4).map(w => w.toLowerCase()).slice(0, 5)
  const scored = pages.map(p => {
    const t = p.text.toLowerCase()
    const hits = keywords.filter(kw => t.includes(kw)).length
    return { page: p, hits }
  }).filter(s => s.hits > 0).sort((a, b) => b.hits - a.hits).slice(0, 8)

  if (scored.length > 0) {
    return scored.map(s => `[PÁGINA ${s.page.num}]\n${s.page.text}`).join('\n\n')
  }

  // Last resort: first 15 pages
  return pages.slice(0, 15).map(p => `[PÁGINA ${p.num}]\n${p.text}`).join('\n\n')
}

// All 23 problematic proposals from both verification runs
const INVENTED = [
  { candidate: 'GROZO COSTA WOLFGANG MARIO', titleMatch: 'Sistema Nacional de Refugio y Atención Veterinaria' },
]

const DISTORTED = [
  { candidate: 'ACUÑA PERALTA CESAR', titleMatch: 'Reforma legal para transferir las Empresas Prestadoras de Saneamiento',
    issue: 'La propuesta existe pero la descripción puede ser imprecisa sobre EPS y municipios' },
  { candidate: 'ATENCIO SOTOMAYOR RONALD DARWIN', titleMatch: 'Aumento del presupuesto de educación al 6% del PBI',
    issue: 'Dice 6% del PBI pero el documento dice 6% del presupuesto público' },
  { candidate: 'CERRON ROJAS VLADIMIR ROY', titleMatch: 'Reducir el gasto de bolsillo en salud',
    issue: 'Imprecisión en la métrica del 10%' },
  { candidate: 'FERNANDEZ BAZAN ROSARIO DEL PILAR', titleMatch: 'Implementación de tecnologías limpias en operaciones mineras',
    issue: 'Usa "Exigir" pero el documento dice "Implementar"' },
  { candidate: 'FERNANDEZ BAZAN ROSARIO DEL PILAR', titleMatch: 'Fabricación de paneles solares en zonas vulnerables',
    issue: 'La propuesta es solo una nota breve, la descripción la exagera' },
  { candidate: 'FERNANDEZ BAZAN ROSARIO DEL PILAR', titleMatch: 'Cierre de operaciones mineras contaminantes',
    issue: 'Transforma "Minera que contamina se cierra" en política condicional' },
  { candidate: 'GROZO COSTA WOLFGANG MARIO', titleMatch: 'Reforma del sistema de AFP para mejorar pensiones',
    issue: 'Distorsiona la propuesta sobre AFP' },
  { candidate: 'JORGE NIETO MONTESINOS', titleMatch: 'Promoción de la producción nacional de medicamentos',
    issue: 'Simplifica la propuesta sobre medicamentos' },
  { candidate: 'KEIKO SOFÍA FUJIMORI HIGUCHI', titleMatch: 'Construcción de Nuevos Penales',
    issue: 'Omite que estarán bajo administración de FF.AA.' },
  { candidate: 'ORTIZ VILLANO ANTONIO', titleMatch: 'Reducir la anemia a menos del 30%',
    issue: 'La meta está en columna de indicadores, no como propuesta activa' },
  { candidate: 'ORTIZ VILLANO ANTONIO', titleMatch: 'Posicionar 5 universidades peruanas',
    issue: 'Confunde el ranking con número de universidades' },
  { candidate: 'ORTIZ VILLANO ANTONIO', titleMatch: 'Reducir en 40% la proporción de hogares pobres sin acceso a agua',
    issue: 'Dice reducir EN 40% pero el documento dice reducir AL 40%' },
  { candidate: 'PEREZ TELLO DE RODRIGUEZ MARIA SOLEDAD', titleMatch: 'Cerrar en 30% la brecha étnica',
    issue: 'Imprecisión sobre qué significa cerrar 30% de la brecha' },
  { candidate: 'PEREZ TELLO DE RODRIGUEZ MARIA SOLEDAD', titleMatch: 'Destrabar proyectos de inversión minera',
    issue: 'La meta es reducir HASTA US$10,000M, no destrabar esa cantidad' },
  { candidate: 'SANCHEZ PALOMINO ROBERTO HELBERT', titleMatch: 'Beca Segunda Oportunidad',
    issue: 'Distorsión en la descripción del programa' },
  { candidate: 'VIZCARRA CORNEJO MARIO ENRIQUE', titleMatch: 'internet gratuito en universidades',
    issue: 'Presentado como propuesta pero está en sección de diagnóstico' },
  { candidate: 'YONHY LESCANO ANCIETA', titleMatch: 'Descontaminación de fuentes de agua',
    issue: 'Imprecisión sobre el alcance de la propuesta' },
  // Run 2 issues (Molinelli + Olivera)
  { candidate: 'MOLINELLI ARISTONDO FIORELLA GIANNINA', titleMatch: 'Lucha frontal contra la corrupción',
    issue: 'Descripción y cita corresponden a otra propuesta (mitigación de riesgos)' },
  { candidate: 'MOLINELLI ARISTONDO FIORELLA GIANNINA', titleMatch: 'Paquete de Aeropuertos de Chimbote y Yurimaguas',
    issue: 'Inversión de US$315M es del conjunto de 3 paquetes, no de uno solo' },
  { candidate: 'MOLINELLI ARISTONDO FIORELLA GIANNINA', titleMatch: 'Paquete de Aeropuertos de Ilo y Huánuco',
    issue: 'Inversión de US$315M es del conjunto de 3 paquetes, no de uno solo' },
  { candidate: 'MOLINELLI ARISTONDO FIORELLA GIANNINA', titleMatch: 'LIMA SEGURA 360',
    issue: 'Combina dos proyectos separados (LIMA SEGURA 360 + Centro de Inteligencia)' },
  { candidate: 'OLIVERA VEGA LUIS FERNANDO', titleMatch: 'Droguería y Laboratorio Farmacéutico Nacional',
    issue: 'Son dos propuestas separadas combinadas en una' },
]

async function main() {
  console.log('='.repeat(80))
  console.log(' CORRECCIÓN DE 23 PROPUESTAS PROBLEMÁTICAS')
  console.log('='.repeat(80))

  const model = genAI.getGenerativeModel({ model: MODEL })

  // PDF text cache
  const pdfCache = new Map<string, PdfPage[]>()

  // 1. DELETE invented proposal
  console.log('\n📛 ELIMINANDO PROPUESTA INVENTADA:')
  for (const inv of INVENTED) {
    const rows = await sql`
      SELECT cp.id, cp.title, cp.description
      FROM candidate_proposals cp
      JOIN candidates c ON cp.candidate_id = c.id
      WHERE c.full_name = ${inv.candidate}
      AND c.cargo = 'presidente' AND c.is_active = true
      AND cp.title ILIKE ${'%' + inv.titleMatch + '%'}
    `
    if (rows.length === 0) {
      console.log(`  ❌ No encontrada: ${inv.candidate} — "${inv.titleMatch}"`)
      continue
    }
    for (const r of rows) {
      console.log(`  🗑️  Eliminando: "${(r.title as string).slice(0, 70)}"`)
      console.log(`     ID: ${r.id}`)
      await sql`DELETE FROM candidate_proposals WHERE id = ${r.id}`
      console.log(`     ✅ Eliminada`)
    }
  }

  // 2. CORRECT distorted proposals
  console.log(`\n📝 CORRIGIENDO ${DISTORTED.length} PROPUESTAS DISTORSIONADAS:`)

  let fixed = 0
  let errors = 0

  for (let i = 0; i < DISTORTED.length; i++) {
    const d = DISTORTED[i]
    console.log(`\n[${i + 1}/${DISTORTED.length}] ${d.candidate}`)
    console.log(`  Buscando: "${d.titleMatch}"`)

    // Find proposal
    const rows = await sql`
      SELECT cp.id, cp.title, cp.description, cp.source_quote, cp.page_reference,
             c.plan_pdf_local, c.full_name
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
    console.log(`  Problema: ${d.issue}`)

    // Get PDF pages
    const pdfLocal = prop.plan_pdf_local as string
    if (!pdfCache.has(pdfLocal)) {
      const pdfPath = path.join(process.cwd(), 'public', pdfLocal)
      if (!fs.existsSync(pdfPath)) {
        console.log(`  ❌ PDF no existe: ${pdfLocal}`)
        errors++
        continue
      }
      pdfCache.set(pdfLocal, await extractPdfText(pdfPath))
    }
    const pages = pdfCache.get(pdfLocal)!
    const relevantText = getRelevantPages(pages, prop.page_reference as string, prop.title as string)

    // Ask Gemini to provide the CORRECT description
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

Tu tarea: Proporcionar la descripción CORREGIDA que sea 100% fiel al texto del documento.
- Mantén el mismo estilo y formato de la descripción original
- Solo corrige lo que sea incorrecto/distorsionado
- Usa las palabras exactas del documento cuando sea posible
- Si la cita fuente también es incorrecta, corrígela
- El título puede ajustarse ligeramente si es necesario

Responde SOLO con JSON válido (sin markdown):
{
  "correctedTitle": "título corregido o el mismo si está bien",
  "correctedDescription": "descripción corregida fiel al documento",
  "correctedSourceQuote": "cita textual correcta del documento o null si no aplica",
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
      console.log(`  Título: "${(correction.correctedTitle as string).slice(0, 60)}..."`)

      // Update in database
      await sql`
        UPDATE candidate_proposals
        SET title = ${correction.correctedTitle},
            description = ${correction.correctedDescription},
            source_quote = ${correction.correctedSourceQuote}
        WHERE id = ${prop.id}
      `

      console.log(`  ✅ Actualizada en BD`)
      fixed++
    } catch (err: any) {
      console.log(`  ❌ Error: ${err.message?.slice(0, 100)}`)
      errors++
    }

    await delay(4000)
  }

  // Report
  console.log('\n' + '='.repeat(80))
  console.log(' REPORTE DE CORRECCIONES')
  console.log('='.repeat(80))
  console.log(`  Inventadas eliminadas: ${INVENTED.length}`)
  console.log(`  Distorsionadas corregidas: ${fixed}`)
  console.log(`  Errores: ${errors}`)
  console.log(`  Total propuestas en BD ahora: (ejecutar COUNT para verificar)`)

  const count = await sql`
    SELECT COUNT(*) as count FROM candidate_proposals cp
    JOIN candidates c ON cp.candidate_id = c.id
    WHERE c.cargo = 'presidente' AND c.is_active = true
  `
  console.log(`  Total propuestas: ${count[0].count}`)
}

main()
  .then(() => process.exit(0))
  .catch(err => { console.error('Fatal:', err); process.exit(1) })
