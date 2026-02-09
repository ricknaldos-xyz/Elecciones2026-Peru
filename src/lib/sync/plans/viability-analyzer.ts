/**
 * Government Plan Viability Analyzer
 *
 * Performs holistic AI analysis of presidential candidates' government plans:
 * - Fiscal viability: compatibility with Peru's fiscal reality
 * - Legal viability: institutional and juridical feasibility
 * - Coherence: internal consistency between proposals
 * - Historical comparison: precedents and international experience
 */

import { GoogleGenerativeAI } from '@google/generative-ai'
import { sql } from '@/lib/db'
import { createSyncLogger } from '../logger'
import type { PlanViabilityAnalysis } from '@/types/database'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '')
const MODEL = 'gemini-2.5-pro'

interface CandidateProposalData {
  id: string
  category: string
  title: string
  description: string
  specificity_score: number | null
  viability_score: number | null
  impact_score: number | null
  evidence_score: number | null
  overall_score: number | null
}

interface CandidateAnalysisInput {
  candidateId: string
  candidateName: string
  partyName: string
  proposals: CandidateProposalData[]
}

/**
 * Gathers all proposals and their evaluations for a candidate
 */
async function gatherCandidateData(candidateId: string): Promise<CandidateAnalysisInput | null> {
  const candidateResult = await sql`
    SELECT c.id, c.full_name, p.name as party_name
    FROM candidates c
    LEFT JOIN parties p ON c.party_id = p.id
    WHERE c.id = ${candidateId}::uuid
      AND c.cargo = 'presidente'
  `

  if (candidateResult.length === 0) return null

  const candidate = candidateResult[0]

  const proposals = await sql`
    SELECT
      cp.id,
      cp.category,
      cp.title,
      cp.description,
      pe.specificity_score,
      pe.viability_score,
      pe.impact_score,
      pe.evidence_score,
      CASE WHEN pe.id IS NOT NULL THEN
        (COALESCE(pe.specificity_score, 0) + COALESCE(pe.viability_score, 0) +
         COALESCE(pe.impact_score, 0) + COALESCE(pe.evidence_score, 0)) / 4.0
      ELSE NULL END as overall_score
    FROM candidate_proposals cp
    LEFT JOIN proposal_evaluations pe ON cp.id = pe.proposal_id
    WHERE cp.candidate_id = ${candidateId}::uuid
    ORDER BY cp.category, cp.created_at
  `

  if (proposals.length === 0) return null

  return {
    candidateId: candidate.id as string,
    candidateName: candidate.full_name as string,
    partyName: (candidate.party_name as string) || 'Independiente',
    proposals: proposals.map((p) => ({
      id: p.id as string,
      category: p.category as string,
      title: p.title as string,
      description: p.description as string,
      specificity_score: p.specificity_score as number | null,
      viability_score: p.viability_score as number | null,
      impact_score: p.impact_score as number | null,
      evidence_score: p.evidence_score as number | null,
      overall_score: p.overall_score as number | null,
    })),
  }
}

/**
 * Builds the viability analysis prompt with Peru-specific fiscal context
 */
function buildViabilityPrompt(data: CandidateAnalysisInput): string {
  const proposalsSummary = data.proposals
    .map(
      (p, i) =>
        `${i + 1}. [${p.category.toUpperCase()}] ${p.title}\n   ${p.description}${
          p.overall_score ? `\n   Calidad individual: ${p.overall_score.toFixed(1)}/10` : ''
        }`
    )
    .join('\n\n')

  return `Eres un experto en políticas públicas, economía fiscal y derecho constitucional peruano. Realiza un ANÁLISIS HOLÍSTICO DE VIABILIDAD del plan de gobierno completo del siguiente candidato presidencial para las elecciones 2026.

CANDIDATO: ${data.candidateName}
PARTIDO: ${data.partyName}
TOTAL DE PROPUESTAS: ${data.proposals.length}

PROPUESTAS DEL PLAN DE GOBIERNO:
${proposalsSummary}

CONTEXTO FISCAL Y LEGAL DEL PERÚ (datos de referencia):
- Presupuesto nacional 2025: ~S/. 240,000 millones
- Techo de déficit fiscal: 2.4% del PIB (regla fiscal del MEF)
- PIB nominal: ~US$ 270,000 millones
- Presión tributaria: ~15% del PIB (una de las más bajas de LATAM)
- Capacidad de recaudación SUNAT limitada; evasión estimada 35-40%
- Enmienda constitucional requiere 2/3 del Congreso (87 de 130 congresistas)
- Ley ordinaria requiere mayoría simple (66 votos)
- Decreto supremo/ejecutivo no requiere aprobación del Congreso
- Período presidencial: 5 años (julio 2026 - julio 2031)
- Prioridades vigentes: recuperación post-COVID, seguridad ciudadana, crisis hídrica El Niño
- Descentralización: 25 regiones con gobiernos regionales autónomos
- Tratados internacionales vigentes (TLC con EE.UU., China, UE)

EVALÚA EL PLAN COMPLETO en 4 dimensiones (puntaje 1-10 cada una):

1. VIABILIDAD FISCAL: ¿El costo total estimado del plan es compatible con la realidad presupuestal? ¿Las propuestas de ingresos/financiamiento son realistas? ¿Cuál sería el impacto en déficit, deuda, inflación?

2. VIABILIDAD LEGAL E INSTITUCIONAL: ¿Cuántas propuestas requieren reforma constitucional vs ley ordinaria vs decreto ejecutivo? ¿El cronograma es realista para 5 años? ¿Se necesita mayoría parlamentaria que probablemente no tendrán?

3. COHERENCIA INTERNA: ¿Las propuestas se contradicen entre sí? (ej: reducir impuestos y aumentar gasto). ¿Las prioridades de gasto coinciden con las prioridades declaradas? ¿Hay temas críticos del Perú que NO se abordan?

4. COMPARACIÓN HISTÓRICA: ¿Propuestas similares se han intentado antes en Perú? ¿Con qué resultado? ¿Hay experiencias internacionales relevantes? ¿El plan se alinea con el consenso de expertos en desarrollo?

Responde SOLO en formato JSON válido:
{
  "fiscal_viability": {
    "score": <1-10>,
    "analysis": "<análisis de 3-4 oraciones>",
    "details": {
      "estimated_cost_soles": <número estimado o null si no es calculable>,
      "budget_gap_pct": <porcentaje de brecha presupuestal estimada o null>,
      "revenue_proposals_realistic": <true/false>,
      "gdp_impact_assessment": "<breve evaluación del impacto en PIB>",
      "inflation_risk": "<low/medium/high>",
      "key_findings": ["<hallazgo 1>", "<hallazgo 2>", "<hallazgo 3>"]
    }
  },
  "legal_viability": {
    "score": <1-10>,
    "analysis": "<análisis de 3-4 oraciones>",
    "details": {
      "constitutional_amendments_needed": <número>,
      "simple_legislation_needed": <número>,
      "executive_decree_possible": <número>,
      "timeline_realistic": <true/false>,
      "proposals_by_mechanism": [
        {"proposal": "<título corto>", "mechanism": "<constitutional/legislation/decree>", "difficulty": "<descripción breve>"}
      ],
      "key_findings": ["<hallazgo 1>", "<hallazgo 2>"]
    }
  },
  "coherence": {
    "score": <1-10>,
    "analysis": "<análisis de 3-4 oraciones>",
    "details": {
      "contradictions": [
        {"proposal_a": "<título>", "proposal_b": "<título>", "explanation": "<por qué se contradicen>"}
      ],
      "priority_alignment_score": <1-10>,
      "coverage_gaps": ["<tema no abordado 1>", "<tema no abordado 2>"],
      "key_findings": ["<hallazgo 1>", "<hallazgo 2>"]
    }
  },
  "historical_comparison": {
    "score": <1-10>,
    "analysis": "<análisis de 3-4 oraciones>",
    "details": {
      "similar_past_proposals": [
        {"proposal": "<propuesta similar>", "past_government": "<gobierno>", "outcome": "<resultado>"}
      ],
      "international_comparisons": [
        {"proposal": "<propuesta>", "country": "<país>", "result": "<resultado>"}
      ],
      "expert_consensus_alignment": "<aligned/mixed/divergent>",
      "key_findings": ["<hallazgo 1>", "<hallazgo 2>"]
    }
  },
  "executive_summary": "<resumen ejecutivo de 3-5 oraciones sobre la viabilidad general del plan>",
  "key_strengths": ["<fortaleza 1>", "<fortaleza 2>", "<fortaleza 3>"],
  "key_weaknesses": ["<debilidad 1>", "<debilidad 2>", "<debilidad 3>"],
  "key_risks": ["<riesgo 1>", "<riesgo 2>", "<riesgo 3>"]
}

IMPORTANTE:
- Sé objetivo y riguroso. No infles puntajes por propuestas populistas.
- Usa datos reales del Perú como referencia.
- Si no puedes estimar un costo, pon null en estimated_cost_soles.
- Evalúa el plan COMO UN TODO, no propuesta por propuesta.
- Los key_findings deben ser concisos (máximo 15 palabras cada uno).
- Las fortalezas, debilidades y riesgos deben ser concisos (máximo 10 palabras cada uno).`
}

/**
 * Analyzes the government plan for a single candidate
 */
async function analyzeGovernmentPlan(
  candidateId: string
): Promise<{ success: boolean; error?: string }> {
  const data = await gatherCandidateData(candidateId)

  if (!data) {
    return { success: false, error: 'Candidate not found or has no proposals' }
  }

  console.log(
    `[PlanViability] Analyzing ${data.candidateName} (${data.proposals.length} proposals)...`
  )

  try {
    const prompt = buildViabilityPrompt(data)
    const model = genAI.getGenerativeModel({ model: MODEL })
    const result = await model.generateContent(prompt)
    const content = result.response.text()

    // Parse JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return { success: false, error: 'No JSON found in AI response' }
    }

    const parsed = JSON.parse(jsonMatch[0])

    // Validate and clamp scores
    const clamp = (val: unknown, min: number, max: number): number =>
      Math.min(max, Math.max(min, parseInt(String(val)) || 5))

    // Save to database
    await sql`
      INSERT INTO plan_viability_analysis (
        candidate_id,
        fiscal_viability_score,
        fiscal_viability_analysis,
        fiscal_viability_details,
        legal_viability_score,
        legal_viability_analysis,
        legal_viability_details,
        coherence_score,
        coherence_analysis,
        coherence_details,
        historical_score,
        historical_analysis,
        historical_details,
        executive_summary,
        key_strengths,
        key_weaknesses,
        key_risks,
        analysis_model,
        proposals_analyzed,
        analyzed_at
      ) VALUES (
        ${candidateId}::uuid,
        ${clamp(parsed.fiscal_viability?.score, 1, 10)},
        ${parsed.fiscal_viability?.analysis || ''},
        ${JSON.stringify(parsed.fiscal_viability?.details || {})}::jsonb,
        ${clamp(parsed.legal_viability?.score, 1, 10)},
        ${parsed.legal_viability?.analysis || ''},
        ${JSON.stringify(parsed.legal_viability?.details || {})}::jsonb,
        ${clamp(parsed.coherence?.score, 1, 10)},
        ${parsed.coherence?.analysis || ''},
        ${JSON.stringify(parsed.coherence?.details || {})}::jsonb,
        ${clamp(parsed.historical_comparison?.score, 1, 10)},
        ${parsed.historical_comparison?.analysis || ''},
        ${JSON.stringify(parsed.historical_comparison?.details || {})}::jsonb,
        ${parsed.executive_summary || ''},
        ${parsed.key_strengths || []},
        ${parsed.key_weaknesses || []},
        ${parsed.key_risks || []},
        ${MODEL},
        ${data.proposals.length},
        NOW()
      )
      ON CONFLICT (candidate_id) DO UPDATE SET
        fiscal_viability_score = EXCLUDED.fiscal_viability_score,
        fiscal_viability_analysis = EXCLUDED.fiscal_viability_analysis,
        fiscal_viability_details = EXCLUDED.fiscal_viability_details,
        legal_viability_score = EXCLUDED.legal_viability_score,
        legal_viability_analysis = EXCLUDED.legal_viability_analysis,
        legal_viability_details = EXCLUDED.legal_viability_details,
        coherence_score = EXCLUDED.coherence_score,
        coherence_analysis = EXCLUDED.coherence_analysis,
        coherence_details = EXCLUDED.coherence_details,
        historical_score = EXCLUDED.historical_score,
        historical_analysis = EXCLUDED.historical_analysis,
        historical_details = EXCLUDED.historical_details,
        executive_summary = EXCLUDED.executive_summary,
        key_strengths = EXCLUDED.key_strengths,
        key_weaknesses = EXCLUDED.key_weaknesses,
        key_risks = EXCLUDED.key_risks,
        analysis_model = EXCLUDED.analysis_model,
        proposals_analyzed = EXCLUDED.proposals_analyzed,
        analyzed_at = NOW(),
        updated_at = NOW()
    `

    console.log(`[PlanViability] ${data.candidateName}: Analysis saved successfully`)
    return { success: true }
  } catch (error) {
    console.error(`[PlanViability] Error analyzing ${data.candidateName}:`, error)
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}

/**
 * Gets the viability analysis for a candidate (public read)
 */
export async function getCandidateViabilityAnalysis(
  candidateId: string
): Promise<PlanViabilityAnalysis | null> {
  const result = await sql`
    SELECT *
    FROM plan_viability_analysis
    WHERE candidate_id = ${candidateId}::uuid
  `

  if (result.length === 0) return null

  const row = result[0]
  return {
    id: row.id as string,
    candidate_id: row.candidate_id as string,
    fiscal_viability_score: Number(row.fiscal_viability_score),
    fiscal_viability_analysis: row.fiscal_viability_analysis as string,
    fiscal_viability_details: row.fiscal_viability_details as PlanViabilityAnalysis['fiscal_viability_details'],
    legal_viability_score: Number(row.legal_viability_score),
    legal_viability_analysis: row.legal_viability_analysis as string,
    legal_viability_details: row.legal_viability_details as PlanViabilityAnalysis['legal_viability_details'],
    coherence_score: Number(row.coherence_score),
    coherence_analysis: row.coherence_analysis as string,
    coherence_details: row.coherence_details as PlanViabilityAnalysis['coherence_details'],
    historical_score: Number(row.historical_score),
    historical_analysis: row.historical_analysis as string,
    historical_details: row.historical_details as PlanViabilityAnalysis['historical_details'],
    overall_viability_score: Number(row.overall_viability_score),
    executive_summary: row.executive_summary as string,
    key_strengths: (row.key_strengths as string[]) || [],
    key_weaknesses: (row.key_weaknesses as string[]) || [],
    key_risks: (row.key_risks as string[]) || [],
    analysis_model: row.analysis_model as string,
    analysis_version: row.analysis_version as string,
    proposals_analyzed: Number(row.proposals_analyzed),
    analyzed_at: row.analyzed_at as string,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  }
}

/**
 * Main sync function - processes all presidential candidates or a single one
 */
export async function syncPlanViability(candidateId?: string): Promise<{
  records_processed: number
  records_updated: number
  records_created: number
  records_skipped: number
}> {
  const logger = createSyncLogger('plan_viability')
  await logger.start()

  const result = {
    records_processed: 0,
    records_updated: 0,
    records_created: 0,
    records_skipped: 0,
  }

  try {
    await logger.markRunning()

    let candidates: { id: string; full_name: string }[]

    if (candidateId) {
      const rows = await sql`
        SELECT c.id, c.full_name
        FROM candidates c
        WHERE c.id = ${candidateId}::uuid AND c.cargo = 'presidente'
      `
      candidates = rows.map((r) => ({ id: r.id as string, full_name: r.full_name as string }))
    } else {
      // Get all presidential candidates that have proposals
      const rows = await sql`
        SELECT DISTINCT c.id, c.full_name
        FROM candidates c
        JOIN candidate_proposals cp ON c.id = cp.candidate_id
        WHERE c.cargo = 'presidente'
        ORDER BY c.full_name
      `
      candidates = rows.map((r) => ({ id: r.id as string, full_name: r.full_name as string }))
    }

    console.log(`[PlanViability] Processing ${candidates.length} presidential candidates`)

    for (const candidate of candidates) {
      result.records_processed++
      logger.incrementProcessed()

      // Rate limit: 5 seconds between calls (Pro model)
      if (result.records_processed > 1) {
        await new Promise((resolve) => setTimeout(resolve, 5000))
      }

      const analysis = await analyzeGovernmentPlan(candidate.id)

      if (analysis.success) {
        result.records_updated++
        logger.incrementUpdated()
        console.log(`[PlanViability] ${candidate.full_name}: OK`)
      } else {
        result.records_skipped++
        logger.incrementSkipped()
        console.log(`[PlanViability] ${candidate.full_name}: Skipped - ${analysis.error}`)
      }
    }

    logger.setMetadata('candidates_analyzed', result.records_updated)
    return await logger.complete()
  } catch (error) {
    await logger.fail(error instanceof Error ? error : new Error(String(error)))
    throw error
  }
}

export { analyzeGovernmentPlan }
