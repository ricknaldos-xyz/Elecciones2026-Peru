/**
 * Extract proposals for all non-presidential candidates
 *
 * Strategy:
 * 1. For parties WITH a presidential candidate that already has proposals:
 *    → Copy those proposals to all senators/deputies/parlamento_andino
 * 2. For parties WITHOUT a presidential candidate:
 *    → Fetch plan PDF, extract with Gemini, assign to all candidates
 * 3. Candidates without plan_gobierno_url → skip (no plan exists)
 */
import { neon } from '@neondatabase/serverless'
import { GoogleGenerativeAI } from '@google/generative-ai'
import * as fs from 'fs'
import * as path from 'path'

const envPath = path.join(process.cwd(), '.env.local')
const envContent = fs.readFileSync(envPath, 'utf-8')
const dbMatch = envContent.match(/DATABASE_URL=["']?([^"'\n]+)["']?/)
const DATABASE_URL = dbMatch ? dbMatch[1] : ''
const sql = neon(DATABASE_URL)

const aiKeyMatch = envContent.match(/GOOGLE_AI_API_KEY=["']?([^"'\n]+)["']?/)
const GOOGLE_AI_API_KEY = aiKeyMatch ? aiKeyMatch[1] : ''
const genAI = new GoogleGenerativeAI(GOOGLE_AI_API_KEY)
const MODEL = 'gemini-2.5-pro'

const PROPOSAL_CATEGORIES = [
  'economia', 'salud', 'educacion', 'seguridad', 'corrupcion',
  'mineria_ambiente', 'infraestructura', 'social', 'reforma_politica', 'otros',
]

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

let totalCopied = 0
let totalExtracted = 0
let totalErrors = 0

async function copyPresidentialProposals() {
  console.log('=== Phase 1: Copy presidential proposals to party members ===\n')

  // Get all parties that have a presidential candidate with proposals
  const partiesWithPres = await sql`
    SELECT DISTINCT c.party_id, p.name,
      (SELECT c2.id FROM candidates c2
       JOIN candidate_proposals cp ON cp.candidate_id = c2.id
       WHERE c2.party_id = c.party_id AND c2.cargo = 'presidente' AND c2.is_active = true
       LIMIT 1) as pres_id
    FROM candidates c
    JOIN parties p ON p.id = c.party_id
    WHERE c.is_active = true
    AND c.cargo IN ('senador', 'diputado', 'parlamento_andino')
    AND EXISTS (
      SELECT 1 FROM candidates c2
      JOIN candidate_proposals cp ON cp.candidate_id = c2.id
      WHERE c2.party_id = c.party_id AND c2.cargo = 'presidente'
    )
    ORDER BY p.name
  `

  console.log(`Found ${partiesWithPres.length} parties with presidential proposals\n`)

  for (const party of partiesWithPres) {
    if (!party.pres_id) continue

    // Use INSERT ... SELECT to copy all proposals in a single query per party
    // This is ~1000x faster than individual inserts
    const result = await sql`
      INSERT INTO candidate_proposals (
        candidate_id, category, title, description,
        source_quote, page_reference, ai_extracted, extraction_model
      )
      SELECT
        c.id,
        cp.category,
        cp.title,
        cp.description,
        cp.source_quote,
        cp.page_reference,
        cp.ai_extracted,
        cp.extraction_model
      FROM candidates c
      CROSS JOIN candidate_proposals cp
      WHERE cp.candidate_id = ${party.pres_id}::uuid
      AND c.party_id = ${party.party_id}::uuid
      AND c.is_active = true
      AND c.cargo IN ('senador', 'diputado', 'parlamento_andino')
      AND NOT EXISTS (
        SELECT 1 FROM candidate_proposals cp2 WHERE cp2.candidate_id = c.id
      )
    `

    const candidateCount = await sql`
      SELECT COUNT(*) as count FROM candidates
      WHERE party_id = ${party.party_id}::uuid
      AND is_active = true
      AND cargo IN ('senador', 'diputado', 'parlamento_andino')
      AND EXISTS (SELECT 1 FROM candidate_proposals cp WHERE cp.candidate_id = candidates.id)
    `

    const count = parseInt(candidateCount[0].count)
    totalCopied += count
    console.log(`  ${party.name}: ${count} candidates updated`)
  }

  console.log(`\nPhase 1 complete: ${totalCopied} candidates updated\n`)
}

async function extractForPartiesWithoutPres() {
  console.log('=== Phase 2: Extract proposals for parties without presidential candidate ===\n')

  // Get parties that have non-presidential candidates but NO presidential proposals
  const partiesNeedExtraction = await sql`
    SELECT DISTINCT c.party_id, p.name,
      (SELECT c2.plan_gobierno_url FROM candidates c2
       WHERE c2.party_id = c.party_id AND c2.plan_gobierno_url IS NOT NULL AND c2.plan_gobierno_url != ''
       LIMIT 1) as plan_url
    FROM candidates c
    JOIN parties p ON p.id = c.party_id
    WHERE c.is_active = true
    AND c.cargo IN ('senador', 'diputado', 'parlamento_andino')
    AND NOT EXISTS (
      SELECT 1 FROM candidates c2
      JOIN candidate_proposals cp ON cp.candidate_id = c2.id
      WHERE c2.party_id = c.party_id AND c2.cargo = 'presidente'
    )
    AND c.plan_gobierno_url IS NOT NULL AND c.plan_gobierno_url != ''
    ORDER BY p.name
  `

  console.log(`Found ${partiesNeedExtraction.length} parties needing Gemini extraction\n`)

  for (const party of partiesNeedExtraction) {
    if (!party.plan_url) {
      console.log(`  ${party.name}: No plan URL, skipping`)
      continue
    }

    console.log(`  ${party.name}: Fetching PDF from ${party.plan_url.substring(0, 60)}...`)

    try {
      // Fetch PDF
      const response = await fetch(party.plan_url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; VotoInformado/1.0)' },
      })

      if (!response.ok) {
        console.log(`    Failed to fetch PDF: ${response.status}`)
        totalErrors++
        continue
      }

      const arrayBuffer = await response.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      console.log(`    PDF size: ${Math.round(buffer.length / 1024)}KB`)

      if (buffer.length > 10 * 1024 * 1024) {
        console.log(`    PDF too large, skipping`)
        continue
      }

      // Extract with Gemini
      const model = genAI.getGenerativeModel({ model: MODEL })
      const result = await model.generateContent([
        { inlineData: { mimeType: 'application/pdf', data: buffer.toString('base64') } },
        { text: EXTRACTION_PROMPT },
      ])

      const responseText = result.response.text()
      let jsonStr = responseText.trim()
      if (jsonStr.startsWith('```json')) jsonStr = jsonStr.slice(7)
      else if (jsonStr.startsWith('```')) jsonStr = jsonStr.slice(3)
      if (jsonStr.endsWith('```')) jsonStr = jsonStr.slice(0, -3)

      const proposals = JSON.parse(jsonStr.trim())
        .filter((item: any) =>
          item && typeof item === 'object' &&
          typeof item.category === 'string' &&
          PROPOSAL_CATEGORIES.includes(item.category)
        )
        .map((item: any) => ({
          category: item.category,
          title: String(item.title).slice(0, 200),
          description: String(item.description || '').slice(0, 500),
          sourceQuote: item.sourceQuote ? String(item.sourceQuote).slice(0, 500) : null,
          pageReference: item.pageReference ? String(item.pageReference) : null,
        }))

      console.log(`    Extracted ${proposals.length} proposals`)

      if (proposals.length === 0) continue

      // First, insert proposals for a "reference" candidate (first one found)
      const refCandidate = await sql`
        SELECT id FROM candidates
        WHERE party_id = ${party.party_id}::uuid
        AND is_active = true
        AND cargo IN ('senador', 'diputado', 'parlamento_andino')
        AND NOT EXISTS (SELECT 1 FROM candidate_proposals cp WHERE cp.candidate_id = candidates.id)
        LIMIT 1
      `

      if (refCandidate.length === 0) continue

      const refId = refCandidate[0].id
      for (const prop of proposals) {
        await sql`
          INSERT INTO candidate_proposals (
            candidate_id, category, title, description,
            source_quote, page_reference, ai_extracted, extraction_model
          ) VALUES (
            ${refId}::uuid, ${prop.category}, ${prop.title}, ${prop.description},
            ${prop.sourceQuote}, ${prop.pageReference},
            true, ${MODEL}
          )
        `
      }

      // Now copy from reference candidate to all others using INSERT ... SELECT
      await sql`
        INSERT INTO candidate_proposals (
          candidate_id, category, title, description,
          source_quote, page_reference, ai_extracted, extraction_model
        )
        SELECT
          c.id, cp.category, cp.title, cp.description,
          cp.source_quote, cp.page_reference, cp.ai_extracted, cp.extraction_model
        FROM candidates c
        CROSS JOIN candidate_proposals cp
        WHERE cp.candidate_id = ${refId}::uuid
        AND c.party_id = ${party.party_id}::uuid
        AND c.is_active = true
        AND c.cargo IN ('senador', 'diputado', 'parlamento_andino')
        AND c.id != ${refId}::uuid
        AND NOT EXISTS (SELECT 1 FROM candidate_proposals cp2 WHERE cp2.candidate_id = c.id)
      `

      const updatedCount = await sql`
        SELECT COUNT(DISTINCT c.id) as count FROM candidates c
        JOIN candidate_proposals cp ON cp.candidate_id = c.id
        WHERE c.party_id = ${party.party_id}::uuid
        AND c.is_active = true
        AND c.cargo IN ('senador', 'diputado', 'parlamento_andino')
      `
      const count = parseInt(updatedCount[0].count)
      totalExtracted += count
      console.log(`    Assigned to ${count} candidates`)

      // Rate limit between Gemini calls
      await new Promise(resolve => setTimeout(resolve, 3000))
    } catch (err) {
      console.error(`    Error: ${(err as Error).message}`)
      totalErrors++
    }
  }

  console.log(`\nPhase 2 complete: ${totalExtracted} candidates updated\n`)
}

async function main() {
  console.log('=== Party Proposal Extraction for All Non-Presidential Candidates ===\n')

  // Phase 1: Copy from presidential candidates
  await copyPresidentialProposals()

  // Phase 2: Extract for parties without presidential candidates
  await extractForPartiesWithoutPres()

  // Final coverage
  const coverage = await sql`
    SELECT c.cargo,
      COUNT(*) as total,
      COUNT(DISTINCT CASE WHEN EXISTS (SELECT 1 FROM candidate_proposals cp WHERE cp.candidate_id = c.id) THEN c.id END) as with_proposals
    FROM candidates c
    WHERE c.is_active = true
    AND c.cargo IN ('senador', 'diputado', 'parlamento_andino')
    GROUP BY c.cargo
    ORDER BY c.cargo
  `

  console.log('=== FINAL PROPOSAL COVERAGE ===')
  for (const row of coverage) {
    const pct = ((Number(row.with_proposals) / Number(row.total)) * 100).toFixed(1)
    console.log(`  ${row.cargo}: ${row.with_proposals}/${row.total} (${pct}%)`)
  }

  console.log(`\n=== SUMMARY ===`)
  console.log(`  Copied from presidential: ${totalCopied} candidates`)
  console.log(`  Extracted with Gemini: ${totalExtracted} candidates`)
  console.log(`  Errors: ${totalErrors}`)
}

main()
  .then(() => process.exit(0))
  .catch(err => { console.error('Fatal error:', err); process.exit(1) })
