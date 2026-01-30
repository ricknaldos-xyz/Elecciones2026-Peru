/**
 * Retry extracting proposals for candidates that failed in the first run
 * Uses longer delays to avoid rate limiting
 */

import * as fs from 'fs'
import * as path from 'path'
import { neon } from '@neondatabase/serverless'
import { GoogleGenerativeAI } from '@google/generative-ai'

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

const CATEGORIES = [
  'economia', 'salud', 'educacion', 'seguridad', 'corrupcion',
  'mineria_ambiente', 'infraestructura', 'social', 'reforma_politica', 'otros',
] as const

const EXTRACTION_PROMPT = `Eres un analista político experto. Analiza el plan de gobierno adjunto (PDF) y extrae las propuestas principales.

Extrae entre 10 y 20 propuestas principales, clasificándolas en estas categorías:
- economia: Política económica, empleo, impuestos, comercio
- salud: Sistema de salud, hospitales, medicinas, pandemia
- educacion: Escuelas, universidades, investigación, becas
- seguridad: Policía, crimen, narcotráfico, fuerzas armadas
- corrupcion: Lucha anticorrupción, transparencia, contraloría
- mineria_ambiente: Minería, medio ambiente, agua, cambio climático
- infraestructura: Obras públicas, transporte, conectividad
- social: Programas sociales, pensiones, vivienda, pobreza
- reforma_politica: Reforma del Estado, descentralización, electoral
- otros: Propuestas que no encajan en las categorías anteriores

Responde SOLO con un array JSON válido (sin markdown, sin explicaciones) con esta estructura:
[
  {
    "category": "<categoria>",
    "title": "<título corto y descriptivo, máximo 100 caracteres>",
    "description": "<descripción clara de la propuesta, máximo 300 caracteres>",
    "sourceQuote": "<cita textual relevante del documento si la hay>",
    "pageReference": "<número de página si se puede identificar>"
  }
]

REGLAS:
- Incluye SOLO propuestas concretas, no declaraciones generales
- El título debe ser específico y descriptivo
- La descripción debe explicar QUÉ propone y CÓMO lo haría
- Si no hay propuestas claras en una categoría, omítela
- Prioriza propuestas con impacto medible
- Sé objetivo y basado en el texto, no inventes información`

function parseAIResponse(response: string): any[] {
  try {
    let jsonStr = response.trim()
    if (jsonStr.startsWith('```json')) jsonStr = jsonStr.slice(7)
    else if (jsonStr.startsWith('```')) jsonStr = jsonStr.slice(3)
    if (jsonStr.endsWith('```')) jsonStr = jsonStr.slice(0, -3)

    const parsed = JSON.parse(jsonStr.trim())
    if (!Array.isArray(parsed)) return []

    return parsed.filter((item: any) => {
      return item && typeof item === 'object' &&
        typeof item.category === 'string' &&
        typeof item.title === 'string' &&
        CATEGORIES.includes(item.category)
    }).map((item: any) => ({
      category: item.category,
      title: String(item.title).slice(0, 200),
      description: String(item.description || '').slice(0, 500),
      sourceQuote: item.sourceQuote ? String(item.sourceQuote).slice(0, 500) : null,
      pageReference: item.pageReference ? String(item.pageReference) : null,
    }))
  } catch (error) {
    console.error('  Parse error:', error)
    return []
  }
}

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function main() {
  console.log('Retrying failed proposal extractions...\n')

  // Find candidates with plans but no proposals
  const missing = await sql`
    SELECT c.id, c.full_name, c.plan_pdf_local
    FROM candidates c
    LEFT JOIN candidate_proposals cp ON c.id = cp.candidate_id
    WHERE c.cargo = 'presidente'
    AND c.is_active = true
    AND c.plan_pdf_local IS NOT NULL
    AND cp.id IS NULL
    ORDER BY c.full_name
  `

  console.log('Candidates missing proposals: ' + missing.length)
  missing.forEach(c => console.log('  - ' + c.full_name))

  const model = genAI.getGenerativeModel({ model: MODEL })
  let succeeded = 0

  for (let i = 0; i < missing.length; i++) {
    const c = missing[i]
    const pdfPath = path.join(process.cwd(), 'public', c.plan_pdf_local as string)

    if (!fs.existsSync(pdfPath)) {
      console.log('\n  [SKIP] ' + c.full_name + ' - PDF not found')
      continue
    }

    const pdfBuffer = fs.readFileSync(pdfPath)
    const sizeKB = Math.round(pdfBuffer.length / 1024)
    console.log('\n[' + (i + 1) + '/' + missing.length + '] ' + c.full_name + ' (' + sizeKB + 'KB)')

    // Wait longer between requests
    if (i > 0) {
      console.log('  Waiting 15s...')
      await delay(15000)
    }

    try {
      const result = await model.generateContent([
        {
          inlineData: {
            mimeType: 'application/pdf',
            data: pdfBuffer.toString('base64'),
          },
        },
        { text: EXTRACTION_PROMPT },
      ])

      const responseText = result.response.text()
      const proposals = parseAIResponse(responseText)

      if (proposals.length === 0) {
        console.log('  -> No proposals extracted')
        continue
      }

      // Delete any existing (shouldn't be any)
      await sql`DELETE FROM candidate_proposals WHERE candidate_id = ${c.id}`

      let saved = 0
      for (const p of proposals) {
        await sql`
          INSERT INTO candidate_proposals (
            candidate_id, category, title, description,
            source_quote, page_reference, ai_extracted, extraction_model
          ) VALUES (
            ${c.id}, ${p.category}, ${p.title}, ${p.description},
            ${p.sourceQuote}, ${p.pageReference}, true, ${MODEL}
          )
        `
        saved++
      }

      console.log('  -> ' + saved + ' propuestas guardadas')
      succeeded++
    } catch (error: any) {
      console.error('  -> Error: ' + (error.message || '').slice(0, 150))
    }
  }

  console.log('\n\nSucceeded: ' + succeeded + '/' + missing.length)

  const totalProps = await sql`SELECT COUNT(*) as count FROM candidate_proposals`
  const withProps = await sql`
    SELECT COUNT(DISTINCT candidate_id) as count
    FROM candidate_proposals cp
    JOIN candidates c ON cp.candidate_id = c.id
    WHERE c.cargo = 'presidente' AND c.is_active = true
  `
  console.log('Total proposals in DB: ' + totalProps[0].count)
  console.log('Candidates with proposals: ' + withProps[0].count + '/35')
}

main().catch(console.error)
