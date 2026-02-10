/**
 * Retry failed proposal extractions using Gemini 2.5 Flash (handles larger PDFs)
 * Targets candidates that failed in the main extraction run
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
const MODEL = 'gemini-2.5-flash'

const CATEGORIES = [
  'economia', 'salud', 'educacion', 'seguridad', 'corrupcion',
  'mineria_ambiente', 'infraestructura', 'social', 'reforma_politica', 'otros',
] as const

const EXTRACTION_PROMPT = `Eres un analista político experto. Analiza el plan de gobierno adjunto (PDF) y extrae TODAS las propuestas concretas.

Extrae TODAS las propuestas que encuentres en el documento (típicamente entre 25 y 60 propuestas por plan de gobierno). NO te limites a un número fijo — tu objetivo es ser exhaustivo y capturar cada propuesta concreta mencionada en el plan.

Clasifícalas en estas categorías:
- economia: Política económica, empleo, impuestos, comercio, agricultura, pesca, turismo, industria
- salud: Sistema de salud, hospitales, medicinas, pandemia, salud mental
- educacion: Escuelas, universidades, investigación, becas, cultura, deporte, ciencia y tecnología
- seguridad: Policía, crimen, narcotráfico, fuerzas armadas, defensa, fronteras
- corrupcion: Lucha anticorrupción, transparencia, contraloría, justicia, poder judicial
- mineria_ambiente: Minería, medio ambiente, agua, cambio climático, energía, recursos naturales
- infraestructura: Obras públicas, transporte, conectividad, telecomunicaciones, vivienda
- social: Programas sociales, pensiones, pobreza, inclusión, pueblos indígenas, género, discapacidad
- reforma_politica: Reforma del Estado, descentralización, electoral, gobierno digital, relaciones exteriores
- otros: Propuestas que no encajan en las categorías anteriores

Responde SOLO con un array JSON válido (sin markdown, sin explicaciones) con esta estructura:
[
  {
    "category": "<categoria>",
    "title": "<título corto y descriptivo, máximo 120 caracteres>",
    "description": "<descripción clara de la propuesta, máximo 400 caracteres>",
    "sourceQuote": "<cita textual relevante del documento si la hay>",
    "pageReference": "<número de página si se puede identificar>"
  }
]

REGLAS:
- Extrae TODAS las propuestas concretas, no solo las principales
- Incluye SOLO propuestas concretas con acciones específicas, no declaraciones generales ni diagnósticos
- El título debe ser específico y descriptivo
- La descripción debe explicar QUÉ propone y CÓMO lo haría
- Si no hay propuestas claras en una categoría, omítela
- Revisa TODAS las secciones del documento, incluyendo anexos
- Sé objetivo y basado en el texto, no inventes información
- Si una propuesta toca múltiples categorías, clasifícala en la más relevante
- IMPORTANTE: Responde SOLO con JSON válido, sin texto adicional`

function parseAIResponse(response: string): any[] {
  let jsonStr = response.trim()
  if (jsonStr.startsWith('```json')) jsonStr = jsonStr.slice(7)
  else if (jsonStr.startsWith('```')) jsonStr = jsonStr.slice(3)
  if (jsonStr.endsWith('```')) jsonStr = jsonStr.slice(0, -3)
  jsonStr = jsonStr.trim()

  // Try to find JSON array start
  const arrayStart = jsonStr.indexOf('[')
  if (arrayStart === -1) return []
  jsonStr = jsonStr.substring(arrayStart)

  // Try direct parse first
  try {
    const parsed = JSON.parse(jsonStr)
    if (Array.isArray(parsed)) return filterProposals(parsed)
  } catch {
    // JSON is truncated - try to salvage by finding last complete object
    console.log('  JSON truncated, attempting partial recovery...')
  }

  // Find last complete JSON object by looking for "},\n  {" or "}\n]" patterns
  // Work backwards to find the last complete "}" that closes an object
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
      if (braceDepth === 0) {
        lastGoodEnd = i
      }
    }
  }

  if (lastGoodEnd > 0) {
    const truncated = jsonStr.substring(0, lastGoodEnd + 1) + ']'
    try {
      const parsed = JSON.parse(truncated)
      if (Array.isArray(parsed)) {
        console.log(`  Recovered ${parsed.length} proposals from truncated JSON`)
        return filterProposals(parsed)
      }
    } catch (e) {
      console.error('  Recovery also failed:', (e as Error).message?.slice(0, 80))
    }
  }

  return []
}

function filterProposals(parsed: any[]): any[] {
  return parsed.filter((item: any) => {
    return (
      item && typeof item === 'object' &&
      typeof item.category === 'string' &&
      typeof item.title === 'string' &&
      CATEGORIES.includes(item.category)
    )
  }).map((item: any) => ({
    category: item.category,
    title: String(item.title).slice(0, 250),
    description: String(item.description || '').slice(0, 600),
    sourceQuote: item.sourceQuote ? String(item.sourceQuote).slice(0, 600) : null,
    pageReference: item.pageReference ? String(item.pageReference) : null,
  }))
}

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Candidates still failing (JSON truncation from output token limits)
const FAILED_NAMES = [
  'ALEX GONZALES CASTILLO',
  'CHIABRA LEON ROBERTO ENRIQUE',
  'GUEVARA AMASIFUEN MESIAS ANTONIO',
  'JAIMES BLANCO PAUL DAVIS',
  'KEIKO SOFÍA FUJIMORI HIGUCHI',
  'VALDERRAMA PEÑA PITTER ENRIQUE',
  'VIZCARRA CORNEJO MARIO ENRIQUE',
]

async function main() {
  console.log('='.repeat(70))
  console.log(' RETRY: PROPUESTAS FALLIDAS CON GEMINI 2.5 FLASH')
  console.log('='.repeat(70))

  const candidates = await sql`
    SELECT id, full_name, plan_pdf_local
    FROM candidates
    WHERE cargo = 'presidente'
    AND is_active = true
    AND plan_pdf_local IS NOT NULL
    AND full_name = ANY(${FAILED_NAMES})
    ORDER BY full_name
  `

  console.log('\nCandidatos a reintentar: ' + candidates.length)

  const model = genAI.getGenerativeModel({ model: MODEL })
  const stats = { processed: 0, succeeded: 0, failed: 0, totalProposals: 0 }

  for (let i = 0; i < candidates.length; i++) {
    const c = candidates[i]
    const num = `[${i + 1}/${candidates.length}]`
    const pdfPath = path.join(process.cwd(), 'public', c.plan_pdf_local as string)

    if (!fs.existsSync(pdfPath)) {
      console.log(`\n${num} ${c.full_name} - PDF no encontrado`)
      stats.failed++
      continue
    }

    const pdfBuffer = fs.readFileSync(pdfPath)
    const sizeKB = Math.round(pdfBuffer.length / 1024)
    console.log(`\n${num} ${c.full_name} (${sizeKB}KB)`)

    stats.processed++

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
        stats.failed++
        continue
      }

      // Delete existing proposals
      await sql`DELETE FROM candidate_proposals WHERE candidate_id = ${c.id}`

      // Insert new proposals
      let saved = 0
      for (const p of proposals) {
        try {
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
        } catch (err) {
          console.error('  Error saving:', p.title)
        }
      }

      console.log(`  -> ${saved} propuestas guardadas`)
      stats.succeeded++
      stats.totalProposals += saved

    } catch (error: any) {
      console.error(`  -> Error: ${error.message?.slice(0, 150)}`)
      stats.failed++
    }

    await delay(3000)
  }

  console.log('\n' + '='.repeat(70))
  console.log(' RESUMEN RETRY')
  console.log('='.repeat(70))
  console.log(`  Procesados: ${stats.processed}`)
  console.log(`  Exitosos: ${stats.succeeded}`)
  console.log(`  Fallidos: ${stats.failed}`)
  console.log(`  Total propuestas: ${stats.totalProposals}`)

  // Verify totals
  const totalProps = await sql`SELECT COUNT(*) as count FROM candidate_proposals`
  const withProps = await sql`
    SELECT COUNT(DISTINCT candidate_id) as count
    FROM candidate_proposals cp
    JOIN candidates c ON cp.candidate_id = c.id
    WHERE c.cargo = 'presidente'
  `
  console.log(`\n  Total en BD: ${totalProps[0].count}`)
  console.log(`  Candidatos con propuestas: ${withProps[0].count}/36`)
}

main().catch(console.error)
