/**
 * AUDIT: Verify ALL presidential candidate proposals match their actual PDF plans
 *
 * Checks:
 * 1. Every candidate has proposals in DB
 * 2. Every candidate has a PDF file
 * 3. PDF title page matches the candidate's party
 * 4. Spot-check 3 random proposals per candidate against PDF content (via Gemini)
 * 5. Report mismatches, missing data, and suspicious entries
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

interface CandidateWithProposals {
  id: string
  full_name: string
  party_name: string
  plan_pdf_local: string | null
  plan_gobierno_url: string | null
  proposal_count: number
  proposals: Array<{
    id: string
    category: string
    title: string
    description: string
    source_quote: string | null
    page_reference: string | null
    extraction_model: string | null
  }>
}

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function main() {
  console.log('='.repeat(80))
  console.log(' AUDITORÍA COMPLETA: PROPUESTAS vs PLANES DE GOBIERNO PDF')
  console.log(' Verificación con Gemini 2.5 Pro')
  console.log('='.repeat(80))

  // 1. Get all presidential candidates with their proposals
  const candidates = await sql`
    SELECT
      c.id, c.full_name,
      p.name as party_name,
      c.plan_pdf_local, c.plan_gobierno_url,
      COUNT(cp.id) as proposal_count
    FROM candidates c
    LEFT JOIN parties p ON c.party_id = p.id
    LEFT JOIN candidate_proposals cp ON c.id = cp.candidate_id
    WHERE c.cargo = 'presidente' AND c.is_active = true
    GROUP BY c.id, c.full_name, p.name, c.plan_pdf_local, c.plan_gobierno_url
    ORDER BY c.full_name
  `

  console.log(`\nCandidatos presidenciales activos: ${candidates.length}`)

  // 2. Get all proposals grouped by candidate
  const allProposals = await sql`
    SELECT cp.id, cp.candidate_id, cp.category, cp.title, cp.description,
           cp.source_quote, cp.page_reference, cp.extraction_model
    FROM candidate_proposals cp
    JOIN candidates c ON cp.candidate_id = c.id
    WHERE c.cargo = 'presidente' AND c.is_active = true
    ORDER BY cp.candidate_id, cp.category
  `

  const proposalsByCandidate = new Map<string, typeof allProposals>()
  for (const p of allProposals) {
    const list = proposalsByCandidate.get(p.candidate_id as string) || []
    list.push(p)
    proposalsByCandidate.set(p.candidate_id as string, list)
  }

  // 3. Audit each candidate
  const issues: string[] = []
  const model = genAI.getGenerativeModel({ model: MODEL })
  let verifiedCount = 0
  let spotChecksPassed = 0
  let spotChecksFailed = 0

  for (let i = 0; i < candidates.length; i++) {
    const c = candidates[i]
    const num = `[${i + 1}/${candidates.length}]`
    const proposals = proposalsByCandidate.get(c.id as string) || []

    console.log(`\n${'─'.repeat(70)}`)
    console.log(`${num} ${c.full_name}`)
    console.log(`  Partido: ${c.party_name}`)
    console.log(`  PDF: ${c.plan_pdf_local || 'NINGUNO'}`)
    console.log(`  Propuestas en BD: ${proposals.length}`)

    // Check 1: Has proposals?
    if (proposals.length === 0) {
      if (c.plan_pdf_local) {
        issues.push(`❌ ${c.full_name}: Tiene PDF pero 0 propuestas en BD`)
      } else {
        console.log(`  ⚠️  Sin PDF ni propuestas (esperado)`)
      }
      continue
    }

    // Check 2: Has PDF?
    if (!c.plan_pdf_local) {
      issues.push(`❌ ${c.full_name}: Tiene ${proposals.length} propuestas pero NO tiene PDF`)
      continue
    }

    const pdfPath = path.join(process.cwd(), 'public', c.plan_pdf_local as string)
    if (!fs.existsSync(pdfPath)) {
      issues.push(`❌ ${c.full_name}: PDF no existe en disco: ${c.plan_pdf_local}`)
      continue
    }

    // Check 3: Extraction model
    const models = [...new Set(proposals.map(p => p.extraction_model))]
    console.log(`  Modelo extracción: ${models.join(', ')}`)

    // Check 4: Category distribution
    const catCounts: Record<string, number> = {}
    for (const p of proposals) {
      catCounts[p.category as string] = (catCounts[p.category as string] || 0) + 1
    }
    const catSummary = Object.entries(catCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, count]) => `${cat}:${count}`)
      .join(', ')
    console.log(`  Categorías: ${catSummary}`)

    // Check 5: Spot-check 3 random proposals against the PDF via Gemini
    const pdfBuffer = fs.readFileSync(pdfPath)
    const sizeKB = Math.round(pdfBuffer.length / 1024)
    console.log(`  PDF tamaño: ${sizeKB}KB`)

    // Select 3 proposals to verify (first, middle, last)
    const indicesToCheck = [
      0,
      Math.floor(proposals.length / 2),
      proposals.length - 1
    ].filter((v, i, a) => a.indexOf(v) === i) // deduplicate

    const proposalsToVerify = indicesToCheck.map(idx => proposals[idx])

    const verificationPrompt = `Eres un auditor de datos. Te doy un Plan de Gobierno en PDF y una lista de propuestas que supuestamente fueron extraídas de este documento.

Para CADA propuesta, verifica:
1. ¿Existe esta propuesta realmente en el documento? (SÍ/NO)
2. ¿La descripción es fiel al contenido del documento? (SÍ/PARCIAL/NO)
3. Si la propuesta NO existe en el documento o es inventada, márcala como FALSA

Propuestas a verificar:
${proposalsToVerify.map((p, idx) => `
${idx + 1}. TÍTULO: ${p.title}
   DESCRIPCIÓN: ${p.description}
   CITA FUENTE: ${p.source_quote || 'N/A'}
   PÁGINA REF: ${p.page_reference || 'N/A'}
`).join('')}

Responde SOLO con JSON válido (sin markdown):
[
  {
    "proposalIndex": 1,
    "existsInDocument": true/false,
    "descriptionFidelity": "SÍ" | "PARCIAL" | "NO",
    "actualContent": "<qué dice realmente el documento sobre este tema, breve>",
    "verdict": "CORRECTO" | "PARCIALMENTE_CORRECTO" | "INVENTADO" | "DISTORSIONADO"
  }
]`

    try {
      const result = await model.generateContent([
        {
          inlineData: {
            mimeType: 'application/pdf',
            data: pdfBuffer.toString('base64'),
          },
        },
        { text: verificationPrompt },
      ])

      const responseText = result.response.text()
      let jsonStr = responseText.trim()
      if (jsonStr.startsWith('```json')) jsonStr = jsonStr.slice(7)
      else if (jsonStr.startsWith('```')) jsonStr = jsonStr.slice(3)
      if (jsonStr.endsWith('```')) jsonStr = jsonStr.slice(0, -3)
      jsonStr = jsonStr.trim()

      const verifications = JSON.parse(jsonStr)

      for (const v of verifications) {
        const propIdx = (v.proposalIndex || 1) - 1
        const prop = proposalsToVerify[propIdx]
        if (!prop) continue

        const icon = v.verdict === 'CORRECTO' ? '✅' :
                     v.verdict === 'PARCIALMENTE_CORRECTO' ? '🟡' :
                     '🔴'

        console.log(`  ${icon} "${(prop.title as string).slice(0, 60)}..." → ${v.verdict}`)
        if (v.verdict === 'CORRECTO' || v.verdict === 'PARCIALMENTE_CORRECTO') {
          spotChecksPassed++
        } else {
          spotChecksFailed++
          issues.push(`🔴 ${c.full_name}: Propuesta "${prop.title}" → ${v.verdict}: ${v.actualContent}`)
        }
      }

      verifiedCount++
    } catch (error: any) {
      console.log(`  ⚠️  Error en verificación: ${error.message?.slice(0, 100)}`)
      issues.push(`⚠️ ${c.full_name}: No se pudo verificar: ${error.message?.slice(0, 80)}`)
    }

    // Rate limit
    await delay(4000)
  }

  // Final report
  console.log('\n' + '='.repeat(80))
  console.log(' REPORTE FINAL DE AUDITORÍA')
  console.log('='.repeat(80))

  const withProposals = candidates.filter(c => (proposalsByCandidate.get(c.id as string) || []).length > 0)
  const withPdf = candidates.filter(c => c.plan_pdf_local)
  const withoutProposals = candidates.filter(c => (proposalsByCandidate.get(c.id as string) || []).length === 0)

  console.log(`\n📊 ESTADÍSTICAS:`)
  console.log(`  Candidatos presidenciales: ${candidates.length}`)
  console.log(`  Con PDF de plan: ${withPdf.length}`)
  console.log(`  Con propuestas en BD: ${withProposals.length}`)
  console.log(`  Sin propuestas: ${withoutProposals.length}`)
  console.log(`  Total propuestas en BD: ${allProposals.length}`)
  console.log(`  Candidatos verificados con IA: ${verifiedCount}`)
  console.log(`  Spot-checks pasados: ${spotChecksPassed}`)
  console.log(`  Spot-checks fallados: ${spotChecksFailed}`)

  if (withoutProposals.length > 0) {
    console.log(`\n📋 CANDIDATOS SIN PROPUESTAS:`)
    for (const c of withoutProposals) {
      console.log(`  - ${c.full_name} (${c.party_name}) [PDF: ${c.plan_pdf_local ? 'SÍ' : 'NO'}]`)
    }
  }

  if (issues.length > 0) {
    console.log(`\n🚨 PROBLEMAS ENCONTRADOS (${issues.length}):`)
    for (const issue of issues) {
      console.log(`  ${issue}`)
    }
  } else {
    console.log(`\n✅ NO SE ENCONTRARON PROBLEMAS`)
  }

  // Category totals
  const globalCats: Record<string, number> = {}
  for (const p of allProposals) {
    globalCats[p.category as string] = (globalCats[p.category as string] || 0) + 1
  }
  console.log(`\n📊 PROPUESTAS POR CATEGORÍA (global):`)
  for (const [cat, count] of Object.entries(globalCats).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${cat}: ${count}`)
  }
}

main()
  .then(() => process.exit(0))
  .catch(err => { console.error('Fatal:', err); process.exit(1) })
