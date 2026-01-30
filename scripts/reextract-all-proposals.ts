/**
 * Re-extract proposals for ALL candidates using the correct 2026 presidential plan PDFs
 * Uses Gemini 2.5 Pro for native PDF processing
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
      return (
        item && typeof item === 'object' &&
        typeof item.category === 'string' &&
        typeof item.title === 'string' &&
        CATEGORIES.includes(item.category)
      )
    }).map((item: any) => ({
      category: item.category,
      title: String(item.title).slice(0, 200),
      description: String(item.description || '').slice(0, 500),
      sourceQuote: item.sourceQuote ? String(item.sourceQuote).slice(0, 500) : null,
      pageReference: item.pageReference ? String(item.pageReference) : null,
    }))
  } catch (error) {
    console.error('  Failed to parse AI response:', error)
    return []
  }
}

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function main() {
  console.log('='.repeat(70))
  console.log(' RE-EXTRACCION DE PROPUESTAS CON PLANES PRESIDENCIALES 2026')
  console.log(' Modelo: Gemini 2.5 Pro (procesamiento nativo de PDF)')
  console.log('='.repeat(70))

  // Get all candidates with local PDFs
  const candidates = await sql`
    SELECT id, full_name, plan_pdf_local, plan_gobierno_url
    FROM candidates
    WHERE cargo = 'presidente'
    AND is_active = true
    AND plan_pdf_local IS NOT NULL
    ORDER BY full_name
  `

  console.log('\nCandidatos con plan: ' + candidates.length)

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

      // Also delete existing evaluations for these proposals
      await sql`
        DELETE FROM proposal_evaluations
        WHERE proposal_id NOT IN (SELECT id FROM candidate_proposals)
      `

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
      console.error(`  -> Error: ${error.message?.slice(0, 100)}`)
      stats.failed++
    }

    // Rate limit - Gemini 2.5 Pro has lower rate limits
    await delay(5000)
  }

  // Final summary
  console.log('\n' + '='.repeat(70))
  console.log(' RESUMEN FINAL')
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
