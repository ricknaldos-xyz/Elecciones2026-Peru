/**
 * Re-extract proposals for candidates that got the wrong PDF
 * Deletes existing wrong proposals and re-extracts from the correct PDF
 */

import * as fs from 'fs'
import * as path from 'path'
import { neon } from '@neondatabase/serverless'
import Anthropic from '@anthropic-ai/sdk'

function loadEnv(): { DATABASE_URL: string; ANTHROPIC_API_KEY: string } {
  const envPath = path.join(process.cwd(), '.env.local')
  const result = { DATABASE_URL: '', ANTHROPIC_API_KEY: '' }

  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8')
    const dbMatch = content.match(/DATABASE_URL=["']?([^"'\n]+)["']?/)
    if (dbMatch) result.DATABASE_URL = dbMatch[1]
    const apiMatch = content.match(/ANTHROPIC_API_KEY=["']?([^"'\n]+)["']?/)
    if (apiMatch) result.ANTHROPIC_API_KEY = apiMatch[1]
  }

  return result
}

const env = loadEnv()
const sql = neon(env.DATABASE_URL)
const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })

const MODEL = 'claude-sonnet-4-20250514'
const MAX_TOKENS = 4096
const DELAY_MS = 3000

const PROPOSAL_CATEGORIES = [
  'economia', 'salud', 'educacion', 'seguridad', 'corrupcion',
  'mineria_ambiente', 'infraestructura', 'social', 'reforma_politica', 'otros',
] as const

type ProposalCategory = (typeof PROPOSAL_CATEGORIES)[number]

interface ExtractedProposal {
  category: ProposalCategory
  title: string
  description: string
  sourceQuote?: string
  pageReference?: string
}

const EXTRACTION_PROMPT = `Eres un analista político experto. Analiza el siguiente plan de gobierno y extrae las propuestas principales.

TEXTO DEL PLAN DE GOBIERNO:
{text}

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

async function extractTextFromPdf(pdfPath: string): Promise<string | null> {
  try {
    const { PDFParse } = await import('pdf-parse')
    const buffer = fs.readFileSync(pdfPath)
    const data = new Uint8Array(buffer)
    const parser = new PDFParse({ data })
    const result = await parser.getText()
    return result.text
  } catch (error) {
    console.error(`Error parsing PDF ${pdfPath}:`, error)
    return null
  }
}

function parseAIResponse(response: string): ExtractedProposal[] {
  try {
    let jsonStr = response.trim()
    if (jsonStr.startsWith('```json')) jsonStr = jsonStr.slice(7)
    else if (jsonStr.startsWith('```')) jsonStr = jsonStr.slice(3)
    if (jsonStr.endsWith('```')) jsonStr = jsonStr.slice(0, -3)

    const parsed = JSON.parse(jsonStr.trim())
    if (!Array.isArray(parsed)) return []

    return parsed
      .filter((item: unknown) => {
        if (!item || typeof item !== 'object') return false
        const obj = item as Record<string, unknown>
        return (
          typeof obj.category === 'string' &&
          typeof obj.title === 'string' &&
          PROPOSAL_CATEGORIES.includes(obj.category as ProposalCategory)
        )
      })
      .map((item: Record<string, unknown>) => ({
        category: item.category as ProposalCategory,
        title: String(item.title).slice(0, 200),
        description: String(item.description || '').slice(0, 500),
        sourceQuote: item.sourceQuote ? String(item.sourceQuote).slice(0, 500) : undefined,
        pageReference: item.pageReference ? String(item.pageReference) : undefined,
      }))
  } catch (error) {
    console.error('Failed to parse AI response:', error)
    return []
  }
}

async function extractProposalsWithAI(text: string): Promise<ExtractedProposal[]> {
  try {
    const truncatedText = text.slice(0, 50000)
    const prompt = EXTRACTION_PROMPT.replace('{text}', truncatedText)

    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      messages: [{ role: 'user', content: prompt }],
    })

    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''
    return parseAIResponse(responseText)
  } catch (error) {
    console.error('AI extraction failed:', error)
    return []
  }
}

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Candidates that got the wrong PDF during extraction
const CANDIDATES_TO_FIX = [
  'MASSE FERNANDEZ',
  'JAICO CARRANZA',
  'CARRASCO',       // Charlie Carrasco
  'CALLER',         // Herbert Caller
  'GUEVARA AMASIFUEN',
  'BECERRA',        // Napoleón Becerra
  'BELMONT CASSINELLI',
  'MOLINELLI',      // Fiorella Molinelli
]

async function main() {
  console.log('='.repeat(70))
  console.log(' RE-EXTRACTING PROPOSALS FROM CORRECT PDFs')
  console.log('='.repeat(70))

  const stats = { processed: 0, succeeded: 0, failed: 0, totalProposals: 0 }

  for (const searchName of CANDIDATES_TO_FIX) {
    const parts = searchName.split(' ')
    const candidates = await sql`
      SELECT c.id, c.full_name, c.plan_gobierno_url, c.plan_pdf_local, p.name as party_name
      FROM candidates c
      LEFT JOIN parties p ON c.party_id = p.id
      WHERE c.cargo = 'presidente'
      AND c.is_active = true
      AND c.full_name ILIKE ${`%${parts[0]}%`}
      AND (${parts.length < 2} OR c.full_name ILIKE ${`%${parts[1] || ''}%`})
      LIMIT 1
    `

    if (candidates.length === 0) {
      console.log(`\n  No encontrado: ${searchName}`)
      continue
    }

    const candidate = candidates[0]
    stats.processed++
    console.log(`\n[${stats.processed}/${CANDIDATES_TO_FIX.length}] ${candidate.full_name}`)
    console.log(`  Partido: ${candidate.party_name}`)

    // Use plan_pdf_local or plan_gobierno_url directly (these are the correct paths)
    const planUrl = (candidate.plan_pdf_local || candidate.plan_gobierno_url) as string
    if (!planUrl || !planUrl.startsWith('/planes/')) {
      console.log(`  No plan URL: ${planUrl}`)
      stats.failed++
      continue
    }

    const pdfPath = path.join(process.cwd(), 'public', planUrl)
    if (!fs.existsSync(pdfPath)) {
      console.log(`  PDF no existe: ${pdfPath}`)
      stats.failed++
      continue
    }

    console.log(`  PDF correcto: ${path.basename(pdfPath)}`)

    // Delete existing wrong proposals
    const deleted = await sql`
      DELETE FROM candidate_proposals WHERE candidate_id = ${candidate.id}
      RETURNING id
    `
    console.log(`  Eliminadas ${deleted.length} propuestas incorrectas`)

    // Extract text from correct PDF
    const text = await extractTextFromPdf(pdfPath)
    if (!text || text.length < 100) {
      console.log(`  No se pudo extraer texto del PDF`)
      stats.failed++
      continue
    }

    console.log(`  ${text.length} caracteres extraidos`)
    console.log(`  Analizando con Claude AI...`)

    const proposals = await extractProposalsWithAI(text)

    if (proposals.length === 0) {
      console.log(`  No se extrajeron propuestas`)
      stats.failed++
      continue
    }

    // Save proposals
    let saved = 0
    for (const proposal of proposals) {
      try {
        await sql`
          INSERT INTO candidate_proposals (
            candidate_id, category, title, description,
            source_quote, page_reference, ai_extracted, extraction_model
          ) VALUES (
            ${candidate.id}, ${proposal.category}, ${proposal.title}, ${proposal.description},
            ${proposal.sourceQuote || null}, ${proposal.pageReference || null}, true, ${MODEL}
          )
        `
        saved++
      } catch (error) {
        console.error(`  Error guardando: ${proposal.title}`)
      }
    }

    console.log(`  ${saved} propuestas correctas guardadas`)
    stats.succeeded++
    stats.totalProposals += saved

    await delay(DELAY_MS)
  }

  console.log('\n' + '='.repeat(70))
  console.log('RESUMEN')
  console.log('='.repeat(70))
  console.log(`Procesados: ${stats.processed}`)
  console.log(`Exitosos: ${stats.succeeded}`)
  console.log(`Fallidos: ${stats.failed}`)
  console.log(`Propuestas nuevas: ${stats.totalProposals}`)

  // Final count
  const total = await sql`SELECT COUNT(*) as count FROM candidate_proposals`
  const withProposals = await sql`
    SELECT COUNT(DISTINCT candidate_id) as count
    FROM candidate_proposals cp
    JOIN candidates c ON cp.candidate_id = c.id
    WHERE c.cargo = 'presidente' AND c.is_active = true
  `
  console.log(`\nTotal propuestas en BD: ${total[0].count}`)
  console.log(`Candidatos con propuestas: ${withProposals[0].count}/36`)
}

main().catch(console.error)
