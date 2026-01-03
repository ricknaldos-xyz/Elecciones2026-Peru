/**
 * AI Content Analyzer using Claude API
 *
 * Analyzes news and social media content to:
 * - Determine sentiment
 * - Extract mentioned entities (candidates, parties, topics)
 * - Detect potential flags (scandals, legal issues)
 * - Generate summaries
 */

import Anthropic from '@anthropic-ai/sdk'
import { sql } from '@/lib/db'
import { createSyncLogger } from '../logger'

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// Configuration
const MODEL = 'claude-3-haiku-20240307' // Use Haiku for cost efficiency
const MAX_TOKENS = 1024
const BATCH_SIZE = 10
const DELAY_BETWEEN_BATCHES = 1000

export interface AIAnalysisResult {
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed'
  sentimentScore: number // -1 to 1
  relevance: number // 0 to 1
  summary: string
  entities: {
    candidates: string[]
    parties: string[]
    topics: string[]
    locations: string[]
  }
  flags: Array<{
    type: string
    severity: 'RED' | 'AMBER' | 'GRAY'
    reason: string
  }>
  keyPhrases: string[]
  isElectionRelated: boolean
}

export interface ContentToAnalyze {
  id: string
  sourceType: 'social_mention' | 'news_mention'
  text: string
  title?: string
  source: string
  url: string
  publishedAt?: string
}

/**
 * Analysis prompt for Claude
 */
const ANALYSIS_PROMPT = `Eres un analista político experto en las elecciones de Perú 2026. Analiza el siguiente contenido y proporciona un análisis estructurado en JSON.

CONTENIDO:
Título: {title}
Texto: {text}
Fuente: {source}
Fecha: {date}

Responde SOLO con un objeto JSON válido (sin markdown, sin explicaciones) con esta estructura exacta:
{
  "sentiment": "positive" | "negative" | "neutral" | "mixed",
  "sentimentScore": <número de -1 a 1>,
  "relevance": <número de 0 a 1, qué tan relevante es para las elecciones>,
  "summary": "<resumen de 1-2 oraciones>",
  "entities": {
    "candidates": ["<nombres de candidatos mencionados>"],
    "parties": ["<partidos políticos mencionados>"],
    "topics": ["<temas principales: corrupción, propuestas, encuestas, etc>"],
    "locations": ["<lugares de Perú mencionados>"]
  },
  "flags": [
    {
      "type": "<tipo: CORRUPTION, LEGAL_ISSUE, VIOLENCE, INCONSISTENCY, SCANDAL, FALSE_CLAIM>",
      "severity": "RED" | "AMBER" | "GRAY",
      "reason": "<explicación breve>"
    }
  ],
  "keyPhrases": ["<frases clave importantes>"],
  "isElectionRelated": true | false
}

REGLAS:
- Si no hay información suficiente, usa valores por defecto (neutral, 0.5, arrays vacíos)
- Solo crea flags si hay evidencia clara de problemas
- RED = muy grave (sentencias, corrupción comprobada)
- AMBER = moderado (investigaciones, denuncias)
- GRAY = leve (inconsistencias, rumores)
- Sé objetivo y basado en el texto, no inventes información`

/**
 * Parse AI response to structured result
 */
function parseAIResponse(response: string): AIAnalysisResult {
  try {
    // Try to extract JSON from response
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

    return {
      sentiment: parsed.sentiment || 'neutral',
      sentimentScore: typeof parsed.sentimentScore === 'number' ? parsed.sentimentScore : 0,
      relevance: typeof parsed.relevance === 'number' ? parsed.relevance : 0.5,
      summary: parsed.summary || '',
      entities: {
        candidates: Array.isArray(parsed.entities?.candidates)
          ? parsed.entities.candidates
          : [],
        parties: Array.isArray(parsed.entities?.parties) ? parsed.entities.parties : [],
        topics: Array.isArray(parsed.entities?.topics) ? parsed.entities.topics : [],
        locations: Array.isArray(parsed.entities?.locations)
          ? parsed.entities.locations
          : [],
      },
      flags: Array.isArray(parsed.flags) ? parsed.flags : [],
      keyPhrases: Array.isArray(parsed.keyPhrases) ? parsed.keyPhrases : [],
      isElectionRelated:
        typeof parsed.isElectionRelated === 'boolean' ? parsed.isElectionRelated : true,
    }
  } catch (error) {
    console.error('Failed to parse AI response:', error, '\nResponse:', response)
    return getDefaultResult()
  }
}

/**
 * Get default result for failed analysis
 */
function getDefaultResult(): AIAnalysisResult {
  return {
    sentiment: 'neutral',
    sentimentScore: 0,
    relevance: 0.5,
    summary: '',
    entities: {
      candidates: [],
      parties: [],
      topics: [],
      locations: [],
    },
    flags: [],
    keyPhrases: [],
    isElectionRelated: true,
  }
}

/**
 * Analyze single content item
 */
export async function analyzeContent(
  content: ContentToAnalyze
): Promise<AIAnalysisResult> {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY not configured')
    return getDefaultResult()
  }

  try {
    const prompt = ANALYSIS_PROMPT.replace('{title}', content.title || 'Sin título')
      .replace('{text}', content.text.slice(0, 3000)) // Limit text length
      .replace('{source}', content.source)
      .replace('{date}', content.publishedAt || 'No especificada')

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

    const responseText =
      message.content[0].type === 'text' ? message.content[0].text : ''
    return parseAIResponse(responseText)
  } catch (error) {
    console.error('AI analysis failed:', error)
    return getDefaultResult()
  }
}

/**
 * Get items pending AI analysis from queue
 */
async function getPendingItems(limit: number): Promise<ContentToAnalyze[]> {
  const result = await sql`
    WITH social AS (
      SELECT
        q.id as queue_id,
        q.source_id,
        'social_mention' as source_type,
        sm.content as text,
        NULL as title,
        sm.platform as source,
        sm.url,
        sm.published_at
      FROM ai_analysis_queue q
      JOIN social_mentions sm ON q.source_id = sm.id
      WHERE q.source_type = 'social_mention'
      AND q.status = 'pending'
      AND q.attempts < q.max_attempts
    ),
    news AS (
      SELECT
        q.id as queue_id,
        q.source_id,
        'news_mention' as source_type,
        nm.excerpt as text,
        nm.title,
        nm.source,
        nm.url,
        nm.published_at
      FROM ai_analysis_queue q
      JOIN news_mentions nm ON q.source_id = nm.id
      WHERE q.source_type = 'news_mention'
      AND q.status = 'pending'
      AND q.attempts < q.max_attempts
    )
    SELECT * FROM (
      SELECT * FROM social
      UNION ALL
      SELECT * FROM news
    ) combined
    ORDER BY queue_id
    LIMIT ${limit}
  `

  return result.map((row) => ({
    id: row.source_id as string,
    sourceType: row.source_type as 'social_mention' | 'news_mention',
    text: (row.text as string) || '',
    title: row.title as string | undefined,
    source: (row.source as string) || 'unknown',
    url: (row.url as string) || '',
    publishedAt: row.published_at
      ? new Date(row.published_at as string).toISOString()
      : undefined,
  }))
}

/**
 * Mark queue item as processing
 */
async function markProcessing(sourceType: string, sourceId: string): Promise<void> {
  await sql`
    UPDATE ai_analysis_queue
    SET status = 'processing', started_at = NOW(), attempts = attempts + 1
    WHERE source_type = ${sourceType} AND source_id = ${sourceId}
  `
}

/**
 * Update item with analysis results
 */
async function updateWithAnalysis(
  item: ContentToAnalyze,
  analysis: AIAnalysisResult
): Promise<void> {
  if (item.sourceType === 'social_mention') {
    await sql`
      UPDATE social_mentions SET
        ai_analyzed = TRUE,
        ai_summary = ${analysis.summary},
        ai_sentiment = ${analysis.sentiment},
        ai_topics = ${analysis.entities.topics},
        ai_entities = ${JSON.stringify(analysis.entities)},
        ai_flags = ${JSON.stringify(analysis.flags)},
        ai_analyzed_at = NOW(),
        sentiment = ${analysis.sentiment},
        relevance_score = ${analysis.relevance}
      WHERE id = ${item.id}
    `
  } else {
    await sql`
      UPDATE news_mentions SET
        sentiment = ${analysis.sentiment},
        relevance_score = ${analysis.relevance},
        keywords = ${analysis.keyPhrases}
      WHERE id = ${item.id}
    `
  }

  // Mark queue item as completed
  await sql`
    UPDATE ai_analysis_queue
    SET status = 'completed', completed_at = NOW()
    WHERE source_type = ${item.sourceType} AND source_id = ${item.id}
  `

  // Create flags if detected
  if (analysis.flags.length > 0) {
    await createFlagsFromAnalysis(item, analysis)
  }
}

/**
 * Create flags in database from AI analysis
 */
async function createFlagsFromAnalysis(
  item: ContentToAnalyze,
  analysis: AIAnalysisResult
): Promise<void> {
  // Only create flags for social mentions with candidate association
  if (item.sourceType !== 'social_mention') return

  // Get candidate_id from social mention
  const result = await sql`
    SELECT candidate_id FROM social_mentions WHERE id = ${item.id}
  `

  if (!result.length || !result[0].candidate_id) return

  const candidateId = result[0].candidate_id

  for (const flag of analysis.flags) {
    // Map AI flag types to database flag types
    const flagTypeMap: Record<string, string> = {
      CORRUPTION: 'OTHER',
      LEGAL_ISSUE: 'PENAL_SENTENCE',
      VIOLENCE: 'VIOLENCE',
      INCONSISTENCY: 'INCONSISTENCY',
      SCANDAL: 'OTHER',
      FALSE_CLAIM: 'INCONSISTENCY',
    }

    const dbFlagType = flagTypeMap[flag.type] || 'OTHER'

    await sql`
      INSERT INTO flags (
        candidate_id,
        type,
        severity,
        title,
        description,
        source,
        evidence_url,
        is_verified
      ) VALUES (
        ${candidateId},
        ${dbFlagType},
        ${flag.severity},
        ${`AI Detected: ${flag.type}`},
        ${flag.reason},
        ${'ai_analysis'},
        ${item.url},
        FALSE
      )
      ON CONFLICT DO NOTHING
    `
  }
}

/**
 * Mark queue item as failed
 */
async function markFailed(
  sourceType: string,
  sourceId: string,
  error: string
): Promise<void> {
  await sql`
    UPDATE ai_analysis_queue
    SET
      status = CASE WHEN attempts >= max_attempts THEN 'failed' ELSE 'pending' END,
      last_error = ${error}
    WHERE source_type = ${sourceType} AND source_id = ${sourceId}
  `
}

/**
 * Delay helper
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Process AI analysis queue
 */
export async function processAIQueue(): Promise<{
  processed: number
  succeeded: number
  failed: number
}> {
  const logger = createSyncLogger('ai_analysis')
  const stats = { processed: 0, succeeded: 0, failed: 0 }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY not configured, skipping AI analysis')
    return stats
  }

  try {
    await logger.start()
    logger.markRunning()

    // Process in batches
    let hasMore = true

    while (hasMore) {
      const items = await getPendingItems(BATCH_SIZE)

      if (items.length === 0) {
        hasMore = false
        continue
      }

      for (const item of items) {
        try {
          await markProcessing(item.sourceType, item.id)

          const analysis = await analyzeContent(item)
          await updateWithAnalysis(item, analysis)

          stats.processed++
          stats.succeeded++
          logger.incrementProcessed()
          logger.incrementUpdated()
        } catch (error) {
          stats.processed++
          stats.failed++
          await markFailed(
            item.sourceType,
            item.id,
            error instanceof Error ? error.message : String(error)
          )
          console.error(`Failed to analyze item ${item.id}:`, error)
        }
      }

      await delay(DELAY_BETWEEN_BATCHES)

      // Limit to 100 items per run to avoid timeout
      if (stats.processed >= 100) {
        hasMore = false
      }
    }

    logger.setMetadata('succeeded', stats.succeeded)
    logger.setMetadata('failed', stats.failed)
    await logger.complete()
  } catch (error) {
    await logger.fail(error instanceof Error ? error : new Error(String(error)))
  }

  return stats
}

/**
 * Queue content for AI analysis
 */
export async function queueForAnalysis(
  sourceType: 'social_mention' | 'news_mention',
  sourceId: string,
  priority: number = 5
): Promise<void> {
  await sql`
    INSERT INTO ai_analysis_queue (source_type, source_id, priority)
    VALUES (${sourceType}, ${sourceId}, ${priority})
    ON CONFLICT (source_type, source_id) DO NOTHING
  `
}
