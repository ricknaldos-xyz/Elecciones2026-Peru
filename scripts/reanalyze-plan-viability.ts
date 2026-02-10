/**
 * Re-analyze Plan Viability for ALL presidential candidates
 *
 * Uses Gemini 2.5 Pro to perform holistic viability analysis on the
 * expanded proposal sets (after re-extraction increased from ~550 to ~2400 proposals).
 *
 * Features:
 * - Retry with exponential backoff (handles 503 errors)
 * - Only processes candidates where proposals_analyzed < current proposal count
 * - Truncated JSON recovery
 *
 * After running this, run: npx tsx scripts/recalculate-enhanced-scores.ts
 * to update score_balanced_p with the new plan_viability scores.
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

const MAX_RETRIES = 3
const BASE_DELAY_MS = 15000

interface CandidateProposalData {
  id: string
  category: string
  title: string
  description: string
  overall_score: number | null
}

interface CandidateAnalysisInput {
  candidateId: string
  candidateName: string
  partyName: string
  proposals: CandidateProposalData[]
}

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
      overall_score: p.overall_score != null ? Number(p.overall_score) : null,
    })),
  }
}

function buildViabilityPrompt(data: CandidateAnalysisInput): string {
  const proposalsSummary = data.proposals
    .map(
      (p, i) =>
        `${i + 1}. [${p.category.toUpperCase()}] ${p.title}\n   ${p.description}${
          p.overall_score != null ? `\n   Calidad individual: ${Number(p.overall_score).toFixed(1)}/10` : ''
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
 * Parse JSON from AI response, with truncated JSON recovery
 */
function parseJSON(content: string): any | null {
  const jsonMatch = content.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return null

  // Try direct parse first
  try {
    return JSON.parse(jsonMatch[0])
  } catch {
    console.log('    JSON truncated, attempting recovery...')
  }

  // Recovery: find last complete top-level object by tracking brace depth
  const jsonStr = jsonMatch[0]
  let lastGoodEnd = -1
  let braceDepth = 0
  let inString = false
  let escape = false

  for (let i = 0; i < jsonStr.length; i++) {
    const ch = jsonStr[i]
    if (escape) { escape = false; continue }
    if (ch === '\\') { escape = true; continue }
    if (ch === '"') { inString = !inString; continue }
    if (inString) continue
    if (ch === '{') braceDepth++
    if (ch === '}') {
      braceDepth--
      if (braceDepth === 0) lastGoodEnd = i
    }
  }

  if (lastGoodEnd > 0) {
    try {
      const recovered = JSON.parse(jsonStr.substring(0, lastGoodEnd + 1))
      console.log('    JSON recovered successfully')
      return recovered
    } catch (e) {
      console.error('    Recovery failed:', (e as Error).message?.slice(0, 80))
    }
  }

  return null
}

function clamp(val: unknown, min: number, max: number): number {
  return Math.min(max, Math.max(min, parseInt(String(val)) || 5))
}

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Call Gemini with retry + exponential backoff
 */
async function callGeminiWithRetry(prompt: string): Promise<string> {
  const model = genAI.getGenerativeModel({ model: MODEL })

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await model.generateContent(prompt)
      return result.response.text()
    } catch (error: any) {
      const isRetryable = error.message?.includes('503') ||
                          error.message?.includes('429') ||
                          error.message?.includes('overloaded') ||
                          error.message?.includes('RESOURCE_EXHAUSTED')

      if (!isRetryable || attempt === MAX_RETRIES) {
        throw error
      }

      const backoffMs = BASE_DELAY_MS * Math.pow(2, attempt) // 15s, 30s, 60s
      console.log(`    Retry ${attempt + 1}/${MAX_RETRIES} after ${backoffMs / 1000}s (503 error)...`)
      await delay(backoffMs)
    }
  }

  throw new Error('Max retries exceeded')
}

async function analyzeCandidate(candidateId: string): Promise<{ success: boolean; error?: string; name?: string; proposals?: number }> {
  const data = await gatherCandidateData(candidateId)
  if (!data) return { success: false, error: 'No data/proposals found' }

  console.log(`  Analyzing ${data.candidateName} (${data.proposals.length} proposals)...`)

  try {
    const prompt = buildViabilityPrompt(data)
    const content = await callGeminiWithRetry(prompt)

    const parsed = parseJSON(content)
    if (!parsed) {
      return { success: false, error: 'No valid JSON in response', name: data.candidateName }
    }

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

    return { success: true, name: data.candidateName, proposals: data.proposals.length }
  } catch (error: any) {
    return { success: false, error: error.message?.slice(0, 150), name: data.candidateName }
  }
}

async function main() {
  console.log('='.repeat(70))
  console.log(' RE-ANÁLISIS DE VIABILIDAD DE PLANES DE GOBIERNO')
  console.log(' Modelo: Gemini 2.5 Pro (con retry + backoff exponencial)')
  console.log('='.repeat(70))

  // Get all presidential candidates with proposals, filtering only those needing re-analysis
  const candidates = await sql`
    SELECT c.id, c.full_name,
           COUNT(cp.id)::int as proposal_count,
           COALESCE(pva.proposals_analyzed, 0)::int as old_analyzed
    FROM candidates c
    JOIN candidate_proposals cp ON c.id = cp.candidate_id
    LEFT JOIN plan_viability_analysis pva ON c.id = pva.candidate_id
    WHERE c.cargo = 'presidente'
    GROUP BY c.id, c.full_name, pva.proposals_analyzed
    HAVING COUNT(cp.id) > COALESCE(pva.proposals_analyzed, 0) + 5
    ORDER BY c.full_name
  `

  console.log(`\nCandidatos que necesitan re-análisis: ${candidates.length}`)

  for (const c of candidates) {
    console.log(`  ${c.full_name}: ${c.old_analyzed} -> ${c.proposal_count} (+${Number(c.proposal_count) - Number(c.old_analyzed)})`)
  }

  console.log(`\nIniciando re-análisis...\n`)

  const stats = { processed: 0, succeeded: 0, failed: 0, failedNames: [] as string[] }

  for (let i = 0; i < candidates.length; i++) {
    const c = candidates[i]
    const num = `[${i + 1}/${candidates.length}]`
    console.log(`${num} ${c.full_name}`)

    // Rate limit: 15 seconds between calls
    if (i > 0) {
      await delay(BASE_DELAY_MS)
    }

    stats.processed++
    const result = await analyzeCandidate(c.id as string)

    if (result.success) {
      stats.succeeded++
      console.log(`  -> OK (${result.proposals} propuestas analizadas)`)
    } else {
      stats.failed++
      stats.failedNames.push(c.full_name as string)
      console.log(`  -> FAILED: ${result.error}`)
    }
  }

  // Summary
  console.log('\n' + '='.repeat(70))
  console.log(' RESUMEN')
  console.log('='.repeat(70))
  console.log(`  Procesados: ${stats.processed}`)
  console.log(`  Exitosos: ${stats.succeeded}`)
  console.log(`  Fallidos: ${stats.failed}`)

  if (stats.failedNames.length > 0) {
    console.log(`\n  Candidatos fallidos:`)
    stats.failedNames.forEach(n => console.log(`    - ${n}`))
  }

  // Verify all results
  const verification = await sql`
    SELECT c.full_name, pva.proposals_analyzed,
           pva.fiscal_viability_score, pva.legal_viability_score,
           pva.coherence_score, pva.historical_score,
           COUNT(cp.id)::int as current_proposals
    FROM plan_viability_analysis pva
    JOIN candidates c ON pva.candidate_id = c.id
    JOIN candidate_proposals cp ON c.id = cp.candidate_id
    GROUP BY c.full_name, pva.proposals_analyzed,
             pva.fiscal_viability_score, pva.legal_viability_score,
             pva.coherence_score, pva.historical_score
    ORDER BY c.full_name
  `

  console.log(`\n  Resultados en BD: ${verification.length} análisis`)
  let upToDate = 0
  let stale = 0
  for (const v of verification) {
    const f = Number(v.fiscal_viability_score)
    const l = Number(v.legal_viability_score)
    const co = Number(v.coherence_score)
    const h = Number(v.historical_score)
    const avg = ((f + l + co + h) / 4).toFixed(1)
    const analyzed = Number(v.proposals_analyzed)
    const current = Number(v.current_proposals)
    const status = analyzed >= current - 5 ? 'UP-TO-DATE' : 'STALE'
    if (status === 'UP-TO-DATE') upToDate++
    else stale++
    console.log(`  ${v.full_name}: F=${f} L=${l} C=${co} H=${h} Avg=${avg} (${analyzed}/${current} props) [${status}]`)
  }

  console.log(`\n  Up-to-date: ${upToDate}/${verification.length}`)
  console.log(`  Stale: ${stale}/${verification.length}`)

  if (stale > 0) {
    console.log('\n  Ejecute el script de nuevo para reintentar los fallidos.')
  }

  console.log('\n  Siguiente paso: npx tsx scripts/recalculate-enhanced-scores.ts')
}

main().catch(console.error)
