/**
 * AI Proposal Evaluator
 *
 * Uses Google Gemini to evaluate the quality of each candidate proposal:
 * - Specificity: How concrete and detailed is the proposal?
 * - Viability: Is it realistically achievable in the term?
 * - Impact: What's the potential positive impact?
 * - Evidence: Is it based on data or studies?
 */

import { GoogleGenerativeAI } from '@google/generative-ai'
import { sql } from '@/lib/db'
import { createSyncLogger } from '../logger'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '')
const MODEL = 'gemini-2.5-flash'

interface ProposalToEvaluate {
  id: string
  candidateId: string
  candidateName: string
  category: string
  title: string
  description: string
  sourceQuote?: string
}

interface ProposalEvaluation {
  specificityScore: number // 1-10
  viabilityScore: number // 1-10
  impactScore: number // 1-10
  evidenceScore: number // 1-10
  aiEvaluation: string
  concerns: string[]
  strengths: string[]
}

const EVALUATION_PROMPT = `Eres un experto en políticas públicas peruanas. Evalúa la siguiente propuesta de gobierno de un candidato presidencial para las elecciones 2026.

PROPUESTA:
Categoría: {category}
Título: {title}
Descripción: {description}
Cita textual del plan: {sourceQuote}

Evalúa en una escala del 1 al 10 según estos criterios:

1. ESPECIFICIDAD (1-10):
   - 1-3: Vago, solo declara intención sin detalles
   - 4-6: Menciona acciones pero sin métricas o plazos
   - 7-10: Concreto con métricas, plazos y responsables

2. VIABILIDAD (1-10):
   - 1-3: Imposible o requiere cambios constitucionales mayores
   - 4-6: Difícil pero posible con condiciones
   - 7-10: Realizable en un período de gobierno

3. IMPACTO (1-10):
   - 1-3: Beneficia a pocos o efecto marginal
   - 4-6: Impacto moderado en segmento poblacional
   - 7-10: Impacto significativo en problema crítico del Perú

4. EVIDENCIA (1-10):
   - 1-3: Sin fundamento, solo opinión
   - 4-6: Menciona estudios pero sin especificar
   - 7-10: Cita datos, estudios o experiencias exitosas

Responde SOLO en formato JSON:
{
  "specificity_score": <number 1-10>,
  "viability_score": <number 1-10>,
  "impact_score": <number 1-10>,
  "evidence_score": <number 1-10>,
  "evaluation": "<breve análisis de 2-3 oraciones>",
  "concerns": ["<problema 1>", "<problema 2>"],
  "strengths": ["<fortaleza 1>", "<fortaleza 2>"]
}

Sé objetivo y crítico. No des puntajes altos solo por ser propuestas populistas. Evalúa la calidad técnica real.`

/**
 * Gets proposals that haven't been evaluated yet
 */
async function getUnevaluatedProposals(): Promise<ProposalToEvaluate[]> {
  const result = await sql`
    SELECT
      cp.id,
      cp.candidate_id,
      c.full_name as candidate_name,
      cp.category,
      cp.title,
      cp.description,
      cp.source_quote
    FROM candidate_proposals cp
    JOIN candidates c ON cp.candidate_id = c.id
    LEFT JOIN proposal_evaluations pe ON cp.id = pe.proposal_id
    WHERE pe.id IS NULL
      AND cp.ai_extracted = true
    ORDER BY c.cargo = 'presidente' DESC, cp.created_at ASC
    LIMIT 50
  `

  return result.map((r) => ({
    id: r.id as string,
    candidateId: r.candidate_id as string,
    candidateName: r.candidate_name as string,
    category: r.category as string,
    title: r.title as string,
    description: r.description as string,
    sourceQuote: r.source_quote as string | undefined,
  }))
}

/**
 * Evaluates a single proposal using Gemini
 */
async function evaluateProposal(proposal: ProposalToEvaluate): Promise<ProposalEvaluation | null> {
  try {
    const prompt = EVALUATION_PROMPT.replace('{category}', proposal.category)
      .replace('{title}', proposal.title)
      .replace('{description}', proposal.description || 'No hay descripción')
      .replace('{sourceQuote}', proposal.sourceQuote || 'No hay cita textual')

    const model = genAI.getGenerativeModel({ model: MODEL })
    const result = await model.generateContent(prompt)
    const content = result.response.text()

    // Parse JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('[ProposalEval] No JSON found in response')
      return null
    }

    const parsed = JSON.parse(jsonMatch[0])

    return {
      specificityScore: Math.min(10, Math.max(1, parseInt(parsed.specificity_score) || 5)),
      viabilityScore: Math.min(10, Math.max(1, parseInt(parsed.viability_score) || 5)),
      impactScore: Math.min(10, Math.max(1, parseInt(parsed.impact_score) || 5)),
      evidenceScore: Math.min(10, Math.max(1, parseInt(parsed.evidence_score) || 5)),
      aiEvaluation: parsed.evaluation || '',
      concerns: Array.isArray(parsed.concerns) ? parsed.concerns : [],
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
    }
  } catch (error) {
    console.error(`[ProposalEval] Error evaluating proposal ${proposal.id}:`, error)
    return null
  }
}

/**
 * Saves evaluation to database
 */
async function saveEvaluation(proposalId: string, evaluation: ProposalEvaluation): Promise<void> {
  await sql`
    INSERT INTO proposal_evaluations (
      proposal_id,
      specificity_score,
      viability_score,
      impact_score,
      evidence_score,
      ai_evaluation,
      ai_concerns,
      ai_strengths,
      evaluation_model,
      evaluated_at
    ) VALUES (
      ${proposalId}::uuid,
      ${evaluation.specificityScore},
      ${evaluation.viabilityScore},
      ${evaluation.impactScore},
      ${evaluation.evidenceScore},
      ${evaluation.aiEvaluation},
      ${JSON.stringify(evaluation.concerns)}::jsonb,
      ${JSON.stringify(evaluation.strengths)}::jsonb,
      ${MODEL},
      NOW()
    )
    ON CONFLICT (proposal_id) DO UPDATE SET
      specificity_score = EXCLUDED.specificity_score,
      viability_score = EXCLUDED.viability_score,
      impact_score = EXCLUDED.impact_score,
      evidence_score = EXCLUDED.evidence_score,
      ai_evaluation = EXCLUDED.ai_evaluation,
      ai_concerns = EXCLUDED.ai_concerns,
      ai_strengths = EXCLUDED.ai_strengths,
      evaluated_at = NOW()
  `
}

/**
 * Main sync function for proposal evaluations
 */
export async function syncProposalEvaluations(): Promise<{
  records_processed: number
  records_updated: number
  records_created: number
  records_skipped: number
}> {
  const logger = createSyncLogger('proposal_evaluation')
  await logger.start()

  const result = {
    records_processed: 0,
    records_updated: 0,
    records_created: 0,
    records_skipped: 0,
  }

  let totalScore = 0
  let evaluatedCount = 0

  try {
    await logger.markRunning()

    const proposals = await getUnevaluatedProposals()
    console.log(`[ProposalEval] Found ${proposals.length} proposals to evaluate`)

    for (const proposal of proposals) {
      result.records_processed++
      logger.incrementProcessed()

      // Rate limit: 1 request per second
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const evaluation = await evaluateProposal(proposal)

      if (evaluation) {
        await saveEvaluation(proposal.id, evaluation)
        result.records_updated++
        evaluatedCount++
        logger.incrementUpdated()

        const avgScore =
          (evaluation.specificityScore +
            evaluation.viabilityScore +
            evaluation.impactScore +
            evaluation.evidenceScore) /
          4
        totalScore += avgScore

        console.log(
          `[ProposalEval] ${proposal.candidateName} - "${proposal.title.slice(0, 50)}...": ${avgScore.toFixed(1)}/10`
        )
      } else {
        result.records_skipped++
        logger.incrementSkipped()
      }
    }

    const averageScore = evaluatedCount > 0 ? totalScore / evaluatedCount : 0
    logger.setMetadata('average_score', averageScore.toFixed(2))
    logger.setMetadata('evaluated_count', evaluatedCount)
    return await logger.complete()
  } catch (error) {
    await logger.fail(error instanceof Error ? error : new Error(String(error)))
    throw error
  }
}

/**
 * Gets proposal quality summary for a candidate
 */
export async function getCandidateProposalQuality(candidateId: string): Promise<{
  totalProposals: number
  evaluatedProposals: number
  averageSpecificity: number
  averageViability: number
  averageImpact: number
  averageEvidence: number
  overallQuality: number
  topConcerns: string[]
  topStrengths: string[]
}> {
  const result = await sql`
    SELECT
      COUNT(DISTINCT cp.id) as total_proposals,
      COUNT(DISTINCT pe.id) as evaluated_proposals,
      AVG(pe.specificity_score) as avg_specificity,
      AVG(pe.viability_score) as avg_viability,
      AVG(pe.impact_score) as avg_impact,
      AVG(pe.evidence_score) as avg_evidence,
      AVG(pe.overall_score) as overall_quality
    FROM candidate_proposals cp
    LEFT JOIN proposal_evaluations pe ON cp.id = pe.proposal_id
    WHERE cp.candidate_id = ${candidateId}::uuid
  `

  const row = result[0] || {}

  // Get common concerns and strengths
  const concernsResult = await sql`
    SELECT unnest(pe.ai_concerns) as concern, COUNT(*) as cnt
    FROM proposal_evaluations pe
    JOIN candidate_proposals cp ON pe.proposal_id = cp.id
    WHERE cp.candidate_id = ${candidateId}::uuid
    GROUP BY concern
    ORDER BY cnt DESC
    LIMIT 5
  `

  const strengthsResult = await sql`
    SELECT unnest(pe.ai_strengths) as strength, COUNT(*) as cnt
    FROM proposal_evaluations pe
    JOIN candidate_proposals cp ON pe.proposal_id = cp.id
    WHERE cp.candidate_id = ${candidateId}::uuid
    GROUP BY strength
    ORDER BY cnt DESC
    LIMIT 5
  `

  return {
    totalProposals: Number(row.total_proposals) || 0,
    evaluatedProposals: Number(row.evaluated_proposals) || 0,
    averageSpecificity: Number(row.avg_specificity) || 0,
    averageViability: Number(row.avg_viability) || 0,
    averageImpact: Number(row.avg_impact) || 0,
    averageEvidence: Number(row.avg_evidence) || 0,
    overallQuality: Number(row.overall_quality) || 0,
    topConcerns: concernsResult.map((r) => r.concern as string),
    topStrengths: strengthsResult.map((r) => r.strength as string),
  }
}

export { getUnevaluatedProposals, evaluateProposal }
