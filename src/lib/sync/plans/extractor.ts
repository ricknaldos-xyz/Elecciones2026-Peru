/**
 * Government Plan Extractor using Claude API
 *
 * Downloads PDFs from JNE platform, extracts text, and uses AI to
 * identify and categorize key proposals from government plans.
 */

import Anthropic from '@anthropic-ai/sdk'
import { sql } from '@/lib/db'
import { createSyncLogger } from '../logger'

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// Configuration - Use Sonnet for better quality analysis of complex documents
const MODEL = 'claude-3-5-sonnet-20241022'
const MAX_TOKENS = 4096
const MAX_PDF_SIZE = 10 * 1024 * 1024 // 10MB max

// Proposal categories
export const PROPOSAL_CATEGORIES = [
  'economia',
  'salud',
  'educacion',
  'seguridad',
  'corrupcion',
  'mineria_ambiente',
  'infraestructura',
  'social',
  'reforma_politica',
  'otros',
] as const

export type ProposalCategory = (typeof PROPOSAL_CATEGORIES)[number]

export interface ExtractedProposal {
  category: ProposalCategory
  title: string
  description: string
  sourceQuote?: string
  pageReference?: string
}

export interface ExtractionResult {
  success: boolean
  proposals: ExtractedProposal[]
  error?: string
  pagesProcessed?: number
}

/**
 * Extraction prompt for Claude
 */
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

/**
 * Fetch PDF from URL and convert to base64
 */
async function fetchPdf(url: string): Promise<{ data: Buffer; size: number } | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; VotoInformado/1.0)',
      },
    })

    if (!response.ok) {
      console.error(`Failed to fetch PDF: ${response.status} ${response.statusText}`)
      return null
    }

    const contentType = response.headers.get('content-type')
    if (!contentType?.includes('application/pdf')) {
      console.error(`Invalid content type: ${contentType}`)
      return null
    }

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    if (buffer.length > MAX_PDF_SIZE) {
      console.error(`PDF too large: ${buffer.length} bytes`)
      return null
    }

    return { data: buffer, size: buffer.length }
  } catch (error) {
    console.error('Error fetching PDF:', error)
    return null
  }
}

/**
 * Extract text from PDF using pdf-parse (lazy loaded)
 */
async function extractTextFromPdf(pdfBuffer: Buffer): Promise<string | null> {
  try {
    // Dynamic import to avoid issues if pdf-parse is not installed
    const { PDFParse } = await import('pdf-parse')
    // Convert Buffer to Uint8Array and pass as data parameter
    const data = new Uint8Array(pdfBuffer)
    const parser = new PDFParse({ data })
    const textResult = await parser.getText()
    return textResult.text
  } catch (error) {
    console.error('Error parsing PDF:', error)
    return null
  }
}

/**
 * Parse AI response to structured proposals
 */
function parseAIResponse(response: string): ExtractedProposal[] {
  try {
    let jsonStr = response.trim()

    // Remove markdown code blocks if present
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.slice(7)
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.slice(3)
    }
    if (jsonStr.endsWith('```')) {
      jsonStr = jsonStr.slice(0, -3)
    }

    const parsed = JSON.parse(jsonStr.trim())

    if (!Array.isArray(parsed)) {
      console.error('AI response is not an array')
      return []
    }

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
    console.error('Failed to parse AI response:', error, '\nResponse:', response.slice(0, 500))
    return []
  }
}

/**
 * Extract proposals from government plan text using Claude
 */
async function extractProposalsWithAI(text: string): Promise<ExtractedProposal[]> {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY not configured')
    return []
  }

  try {
    // Limit text to ~50k chars to stay within context limits
    const truncatedText = text.slice(0, 50000)

    const prompt = EXTRACTION_PROMPT.replace('{text}', truncatedText)

    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''
    return parseAIResponse(responseText)
  } catch (error) {
    console.error('AI extraction failed:', error)
    return []
  }
}

/**
 * Save proposals to database
 */
async function saveProposals(
  candidateId: string,
  proposals: ExtractedProposal[]
): Promise<number> {
  if (proposals.length === 0) return 0

  // Delete existing proposals for this candidate (full refresh)
  await sql`
    DELETE FROM candidate_proposals WHERE candidate_id = ${candidateId}
  `

  let saved = 0
  for (const proposal of proposals) {
    try {
      await sql`
        INSERT INTO candidate_proposals (
          candidate_id,
          category,
          title,
          description,
          source_quote,
          page_reference,
          ai_extracted,
          extraction_model
        ) VALUES (
          ${candidateId},
          ${proposal.category},
          ${proposal.title},
          ${proposal.description},
          ${proposal.sourceQuote || null},
          ${proposal.pageReference || null},
          true,
          ${MODEL}
        )
      `
      saved++
    } catch (error) {
      console.error(`Failed to save proposal: ${proposal.title}`, error)
    }
  }

  return saved
}

/**
 * Extract proposals from a candidate's government plan
 */
export async function extractCandidatePlan(candidateId: string): Promise<ExtractionResult> {
  // Get candidate info and plan URL
  const candidates = await sql`
    SELECT id, full_name, plan_gobierno_url
    FROM candidates
    WHERE id = ${candidateId}
  `

  if (candidates.length === 0) {
    return { success: false, proposals: [], error: 'Candidate not found' }
  }

  const candidate = candidates[0]
  const planUrl = candidate.plan_gobierno_url as string | null

  if (!planUrl) {
    return { success: false, proposals: [], error: 'No government plan URL configured' }
  }

  console.log(`Extracting plan for ${candidate.full_name} from ${planUrl}`)

  // Fetch PDF
  const pdf = await fetchPdf(planUrl)
  if (!pdf) {
    return { success: false, proposals: [], error: 'Failed to fetch PDF' }
  }

  // Extract text
  const text = await extractTextFromPdf(pdf.data)
  if (!text || text.length < 100) {
    return { success: false, proposals: [], error: 'Failed to extract text from PDF' }
  }

  console.log(`Extracted ${text.length} characters from PDF`)

  // Extract proposals with AI
  const proposals = await extractProposalsWithAI(text)
  if (proposals.length === 0) {
    return { success: false, proposals: [], error: 'No proposals extracted by AI' }
  }

  console.log(`Extracted ${proposals.length} proposals`)

  // Save to database
  const saved = await saveProposals(candidateId, proposals)

  return {
    success: true,
    proposals,
    pagesProcessed: Math.ceil(text.length / 3000), // Rough estimate
  }
}

/**
 * Process all candidates with government plans
 */
export async function processAllPlans(): Promise<{
  processed: number
  succeeded: number
  failed: number
  totalProposals: number
}> {
  const logger = createSyncLogger('government_plans')
  const stats = { processed: 0, succeeded: 0, failed: 0, totalProposals: 0 }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY not configured, skipping plan extraction')
    return stats
  }

  try {
    await logger.start()
    logger.markRunning()

    // Get all candidates with plan URLs (only presidents for now)
    const candidates = await sql`
      SELECT id, full_name, plan_gobierno_url
      FROM candidates
      WHERE plan_gobierno_url IS NOT NULL
      AND plan_gobierno_url != ''
      AND cargo = 'presidente'
      ORDER BY full_name
    `

    console.log(`Found ${candidates.length} candidates with government plans`)

    for (const candidate of candidates) {
      try {
        const result = await extractCandidatePlan(candidate.id as string)

        stats.processed++
        logger.incrementProcessed()

        if (result.success) {
          stats.succeeded++
          stats.totalProposals += result.proposals.length
          logger.incrementCreated()
          console.log(
            `✓ ${candidate.full_name}: ${result.proposals.length} proposals extracted`
          )
        } else {
          stats.failed++
          console.log(`✗ ${candidate.full_name}: ${result.error}`)
        }

        // Rate limiting - wait between API calls
        await new Promise((resolve) => setTimeout(resolve, 2000))
      } catch (error) {
        stats.processed++
        stats.failed++
        console.error(`Failed to process ${candidate.full_name}:`, error)
      }
    }

    logger.setMetadata('succeeded', stats.succeeded)
    logger.setMetadata('failed', stats.failed)
    logger.setMetadata('totalProposals', stats.totalProposals)
    await logger.complete()
  } catch (error) {
    await logger.fail(error instanceof Error ? error : new Error(String(error)))
  }

  return stats
}

/**
 * Get proposals for a candidate
 */
export async function getCandidateProposals(
  candidateId: string
): Promise<ExtractedProposal[]> {
  const result = await sql`
    SELECT category, title, description, source_quote, page_reference
    FROM candidate_proposals
    WHERE candidate_id = ${candidateId}
    ORDER BY category, created_at
  `

  return result.map((row) => ({
    category: row.category as ProposalCategory,
    title: row.title as string,
    description: row.description as string,
    sourceQuote: row.source_quote as string | undefined,
    pageReference: row.page_reference as string | undefined,
  }))
}

/**
 * Get proposals for multiple candidates (for comparison)
 */
export async function getProposalsForComparison(
  candidateIds: string[],
  category?: ProposalCategory
): Promise<Record<string, ExtractedProposal[]>> {
  let query = sql`
    SELECT
      cp.candidate_id,
      cp.category,
      cp.title,
      cp.description,
      cp.source_quote,
      cp.page_reference,
      c.full_name
    FROM candidate_proposals cp
    JOIN candidates c ON c.id = cp.candidate_id
    WHERE cp.candidate_id = ANY(${candidateIds})
  `

  if (category) {
    query = sql`
      SELECT
        cp.candidate_id,
        cp.category,
        cp.title,
        cp.description,
        cp.source_quote,
        cp.page_reference,
        c.full_name
      FROM candidate_proposals cp
      JOIN candidates c ON c.id = cp.candidate_id
      WHERE cp.candidate_id = ANY(${candidateIds})
      AND cp.category = ${category}
      ORDER BY c.full_name, cp.category
    `
  }

  const result = await query

  // Group by candidate
  const grouped: Record<string, ExtractedProposal[]> = {}

  for (const row of result) {
    const candidateId = row.candidate_id as string
    if (!grouped[candidateId]) {
      grouped[candidateId] = []
    }
    grouped[candidateId].push({
      category: row.category as ProposalCategory,
      title: row.title as string,
      description: row.description as string,
      sourceQuote: row.source_quote as string | undefined,
      pageReference: row.page_reference as string | undefined,
    })
  }

  return grouped
}
