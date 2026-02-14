/**
 * FULL VERIFICATION: Verify ALL 2,423 proposals against their actual PDF plans
 * Uses pdf-parse for text extraction + Gemini 2.5 Pro for verification
 * Processes proposals in batches of ~8, grouped by page reference proximity
 */

import * as fs from 'fs'
import * as path from 'path'
import { neon } from '@neondatabase/serverless'
import { GoogleGenerativeAI } from '@google/generative-ai'

// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParseModule = require('pdf-parse')
const PDFParseClass = pdfParseModule.PDFParse

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
const BATCH_SIZE = 8
const DELAY_MS = 4000

// If set, only verify these candidates (for re-running rate-limited ones)
const ONLY_CANDIDATES: string[] | null = [
  'MASSE FERNANDEZ ARMANDO JOAQUIN',
  'MOLINELLI ARISTONDO FIORELLA GIANNINA',
  'OLIVERA VEGA LUIS FERNANDO',
]

interface Proposal {
  id: string
  category: string
  title: string
  description: string
  source_quote: string | null
  page_reference: string | null
}

interface PdfPage {
  text: string
  num: number
}

interface VerificationResult {
  proposalId: string
  candidateName: string
  title: string
  verdict: 'CORRECTO' | 'PARCIALMENTE_CORRECTO' | 'INVENTADO' | 'DISTORSIONADO'
  actualContent: string
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function parsePageRefs(pageRef: string | null): number[] {
  if (!pageRef) return []
  const matches = pageRef.match(/\d+/g)
  return matches ? matches.map(m => parseInt(m)) : []
}

function extractRelevantPages(pages: PdfPage[], pageNums: number[], contextPages = 2): string {
  if (pageNums.length === 0) return ''
  const minPage = Math.max(1, Math.min(...pageNums) - contextPages)
  const maxPage = Math.max(...pageNums) + contextPages
  const relevant = pages.filter(p => p.num >= minPage && p.num <= maxPage)
  return relevant.map(p => `[PÁGINA ${p.num}]\n${p.text}`).join('\n\n')
}

function searchPagesByKeywords(pages: PdfPage[], title: string, maxPages = 8): string {
  const keywords = title
    .split(/\s+/)
    .filter(w => w.length > 4)
    .map(w => w.toLowerCase())
    .slice(0, 4)

  if (keywords.length === 0) return ''

  const scored = pages.map(p => {
    const textLower = p.text.toLowerCase()
    const hits = keywords.filter(kw => textLower.includes(kw)).length
    return { page: p, hits }
  }).filter(s => s.hits > 0)
    .sort((a, b) => b.hits - a.hits)
    .slice(0, maxPages)

  return scored.map(s => `[PÁGINA ${s.page.num}]\n${s.page.text}`).join('\n\n')
}

async function extractPdfText(pdfPath: string): Promise<PdfPage[]> {
  const pdfBuffer = fs.readFileSync(pdfPath)
  const parser = new PDFParseClass({ verbosity: 0, data: new Uint8Array(pdfBuffer) })
  await parser.load()
  const result = await parser.getText()
  const pages = result.pages as PdfPage[]
  parser.destroy()
  return pages
}

function groupProposalsByPages(proposals: Proposal[]): Proposal[][] {
  // Sort by page reference
  const sorted = [...proposals].sort((a, b) => {
    const aPages = parsePageRefs(a.page_reference)
    const bPages = parsePageRefs(b.page_reference)
    const aMin = aPages.length > 0 ? Math.min(...aPages) : 9999
    const bMin = bPages.length > 0 ? Math.min(...bPages) : 9999
    return aMin - bMin
  })

  // Group into batches of BATCH_SIZE
  const batches: Proposal[][] = []
  for (let i = 0; i < sorted.length; i += BATCH_SIZE) {
    batches.push(sorted.slice(i, i + BATCH_SIZE))
  }
  return batches
}

function getRelevantTextForBatch(batch: Proposal[], pages: PdfPage[]): string {
  const allPageNums: Set<number> = new Set()

  for (const prop of batch) {
    const refs = parsePageRefs(prop.page_reference)
    if (refs.length > 0) {
      // Add referenced pages ± 1 context
      for (const ref of refs) {
        for (let p = Math.max(1, ref - 1); p <= ref + 1; p++) {
          allPageNums.add(p)
        }
      }
    }
  }

  // For proposals without page refs, do keyword search
  const propsWithoutRefs = batch.filter(p => parsePageRefs(p.page_reference).length === 0)
  let keywordText = ''
  for (const prop of propsWithoutRefs) {
    const found = searchPagesByKeywords(pages, prop.title as string, 3)
    if (found) keywordText += '\n\n' + found
  }

  // If no page refs at all, use keyword search for all
  if (allPageNums.size === 0) {
    for (const prop of batch) {
      const found = searchPagesByKeywords(pages, prop.title as string, 3)
      if (found) keywordText += '\n\n' + found
    }
    // If still nothing, use first + middle + last sections
    if (keywordText.length < 500) {
      const first = pages.slice(0, 10)
      const mid = pages.slice(Math.floor(pages.length / 2) - 5, Math.floor(pages.length / 2) + 5)
      const last = pages.slice(-10)
      const combined = [...first, ...mid, ...last]
      keywordText = combined.map(p => `[PÁGINA ${p.num}]\n${p.text}`).join('\n\n')
    }
  }

  // Build text from page numbers
  let pageText = ''
  if (allPageNums.size > 0) {
    const sortedNums = [...allPageNums].sort((a, b) => a - b)
    const relevant = pages.filter(p => sortedNums.includes(p.num))
    pageText = relevant.map(p => `[PÁGINA ${p.num}]\n${p.text}`).join('\n\n')
  }

  const fullText = (pageText + '\n\n' + keywordText).trim()

  // Cap at 120K chars
  if (fullText.length > 120000) {
    return fullText.slice(0, 120000) + '\n[...TRUNCADO...]'
  }
  return fullText
}

async function verifyBatch(
  model: any,
  batch: Proposal[],
  relevantText: string,
  candidateName: string
): Promise<VerificationResult[]> {
  const prompt = `Eres un auditor de datos. Te doy páginas extraídas de un Plan de Gobierno y una lista de propuestas que supuestamente fueron extraídas de este documento.

PÁGINAS DEL PLAN DE GOBIERNO:
---
${relevantText}
---

Para CADA propuesta, verifica:
1. ¿Existe esta propuesta realmente en el documento? (SÍ/NO)
2. ¿La descripción es fiel al contenido del documento? (SÍ/PARCIAL/NO)
3. Si la propuesta NO existe en el documento, márcala como INVENTADO

Propuestas a verificar:
${batch.map((p, idx) => `
${idx + 1}. TÍTULO: ${p.title}
   DESCRIPCIÓN: ${(p.description as string).slice(0, 200)}
   CITA FUENTE: ${(p.source_quote as string || 'N/A').slice(0, 150)}
   PÁGINA REF: ${p.page_reference || 'N/A'}
`).join('')}

Responde SOLO con JSON válido (sin markdown ni backticks):
[
  {
    "proposalIndex": 1,
    "existsInDocument": true,
    "descriptionFidelity": "SÍ",
    "actualContent": "breve resumen de lo que dice el documento",
    "verdict": "CORRECTO"
  }
]

Los verdicts posibles: "CORRECTO", "PARCIALMENTE_CORRECTO", "INVENTADO", "DISTORSIONADO"`

  const result = await model.generateContent(prompt)
  const responseText = result.response.text()

  let jsonStr = responseText.trim()
  if (jsonStr.startsWith('```json')) jsonStr = jsonStr.slice(7)
  else if (jsonStr.startsWith('```')) jsonStr = jsonStr.slice(3)
  if (jsonStr.endsWith('```')) jsonStr = jsonStr.slice(0, -3)
  jsonStr = jsonStr.trim()

  const verifications = JSON.parse(jsonStr)
  const results: VerificationResult[] = []

  for (const v of verifications) {
    const propIdx = (v.proposalIndex || 1) - 1
    const prop = batch[propIdx]
    if (!prop) continue

    results.push({
      proposalId: prop.id as string,
      candidateName,
      title: prop.title as string,
      verdict: v.verdict,
      actualContent: v.actualContent || '',
    })
  }

  return results
}

async function main() {
  console.log('='.repeat(80))
  console.log(' VERIFICACIÓN COMPLETA: TODAS LAS 2,423 PROPUESTAS')
  console.log(' Método: pdf-parse text extraction + Gemini 2.5 Pro')
  console.log('='.repeat(80))

  const model = genAI.getGenerativeModel({ model: MODEL })

  // Get all candidates
  const candidates = await sql`
    SELECT c.id, c.full_name, p.name as party_name, c.plan_pdf_local
    FROM candidates c
    LEFT JOIN parties p ON c.party_id = p.id
    WHERE c.cargo = 'presidente' AND c.is_active = true
    ORDER BY c.full_name
  `

  // Get all proposals
  const allProposals = await sql`
    SELECT cp.id, cp.candidate_id, cp.category, cp.title, cp.description,
           cp.source_quote, cp.page_reference
    FROM candidate_proposals cp
    JOIN candidates c ON cp.candidate_id = c.id
    WHERE c.cargo = 'presidente' AND c.is_active = true
    ORDER BY cp.candidate_id, cp.category
  `

  const proposalsByCandidate = new Map<string, Proposal[]>()
  for (const p of allProposals) {
    const list = proposalsByCandidate.get(p.candidate_id as string) || []
    list.push(p as unknown as Proposal)
    proposalsByCandidate.set(p.candidate_id as string, list)
  }

  console.log(`\nCandidatos: ${candidates.length}`)
  console.log(`Propuestas totales: ${allProposals.length}`)

  // Estimate batches
  let totalBatches = 0
  for (const c of candidates) {
    const props = proposalsByCandidate.get(c.id as string) || []
    totalBatches += Math.ceil(props.length / BATCH_SIZE)
  }
  console.log(`Lotes estimados: ${totalBatches} (${BATCH_SIZE} propuestas/lote)`)
  console.log(`Tiempo estimado: ~${Math.round(totalBatches * (DELAY_MS + 3000) / 60000)} minutos\n`)

  // Results tracking
  let totalVerified = 0
  let correcto = 0
  let parcial = 0
  let inventado = 0
  let distorsionado = 0
  let errors = 0
  let batchNum = 0
  const allIssues: VerificationResult[] = []

  // Process each candidate
  for (let ci = 0; ci < candidates.length; ci++) {
    const c = candidates[ci]
    const proposals = proposalsByCandidate.get(c.id as string) || []

    if (proposals.length === 0) continue

    // Skip if not in the target list
    if (ONLY_CANDIDATES && !ONLY_CANDIDATES.includes(c.full_name as string)) continue

    console.log(`\n${'─'.repeat(70)}`)
    console.log(`[${ci + 1}/${candidates.length}] ${c.full_name} (${c.party_name})`)
    console.log(`  Propuestas: ${proposals.length} | PDF: ${c.plan_pdf_local}`)

    if (!c.plan_pdf_local) {
      console.log(`  ❌ Sin PDF — saltando`)
      continue
    }

    const pdfPath = path.join(process.cwd(), 'public', c.plan_pdf_local as string)
    if (!fs.existsSync(pdfPath)) {
      console.log(`  ❌ PDF no existe en disco — saltando`)
      continue
    }

    // Extract text
    let pages: PdfPage[]
    try {
      pages = await extractPdfText(pdfPath)
      console.log(`  Páginas extraídas: ${pages.length}`)
    } catch (err: any) {
      console.log(`  ❌ Error extrayendo texto: ${err.message}`)
      continue
    }

    // Group proposals into batches
    const batches = groupProposalsByPages(proposals)
    console.log(`  Lotes: ${batches.length}`)

    let candidatePassed = 0
    let candidateFailed = 0

    for (let bi = 0; bi < batches.length; bi++) {
      const batch = batches[bi]
      batchNum++

      const relevantText = getRelevantTextForBatch(batch, pages)

      try {
        const results = await verifyBatch(model, batch, relevantText, c.full_name as string)

        for (const r of results) {
          totalVerified++
          switch (r.verdict) {
            case 'CORRECTO': correcto++; candidatePassed++; break
            case 'PARCIALMENTE_CORRECTO': parcial++; candidatePassed++; break
            case 'INVENTADO': inventado++; candidateFailed++; allIssues.push(r); break
            case 'DISTORSIONADO': distorsionado++; candidateFailed++; allIssues.push(r); break
            default: candidatePassed++; break
          }
        }

        const batchResults = results.map(r => {
          const icon = r.verdict === 'CORRECTO' ? '✅' :
                       r.verdict === 'PARCIALMENTE_CORRECTO' ? '🟡' : '🔴'
          return icon
        }).join('')
        process.stdout.write(`  [${bi + 1}/${batches.length}] ${batchResults} (${batchNum}/${totalBatches})\n`)

      } catch (error: any) {
        errors++
        const errMsg = error.message?.slice(0, 80) || 'Unknown error'
        console.log(`  [${bi + 1}/${batches.length}] ⚠️ Error: ${errMsg}`)

        // On rate limit, wait longer and retry once
        if (errMsg.includes('429') || errMsg.includes('rate') || errMsg.includes('quota')) {
          console.log(`  ⏳ Rate limited — esperando 30s...`)
          await delay(30000)
          try {
            const results = await verifyBatch(model, batch, relevantText, c.full_name as string)
            for (const r of results) {
              totalVerified++
              switch (r.verdict) {
                case 'CORRECTO': correcto++; candidatePassed++; break
                case 'PARCIALMENTE_CORRECTO': parcial++; candidatePassed++; break
                case 'INVENTADO': inventado++; candidateFailed++; allIssues.push(r); break
                case 'DISTORSIONADO': distorsionado++; candidateFailed++; allIssues.push(r); break
              }
            }
            const retryResults = results.map(r => {
              const icon = r.verdict === 'CORRECTO' ? '✅' : r.verdict === 'PARCIALMENTE_CORRECTO' ? '🟡' : '🔴'
              return icon
            }).join('')
            process.stdout.write(`  [${bi + 1}/${batches.length}] RETRY ${retryResults}\n`)
          } catch {
            console.log(`  [${bi + 1}/${batches.length}] ❌ Retry failed`)
            errors++
          }
        }
      }

      await delay(DELAY_MS)
    }

    console.log(`  Resultado: ${candidatePassed} OK, ${candidateFailed} problemas`)
  }

  // Final report
  console.log('\n' + '='.repeat(80))
  console.log(' REPORTE FINAL — VERIFICACIÓN COMPLETA')
  console.log('='.repeat(80))
  console.log(`\n📊 ESTADÍSTICAS:`)
  console.log(`  Total propuestas verificadas: ${totalVerified} / ${allProposals.length}`)
  console.log(`  ✅ CORRECTO: ${correcto}`)
  console.log(`  🟡 PARCIALMENTE_CORRECTO: ${parcial}`)
  console.log(`  🔴 INVENTADO: ${inventado}`)
  console.log(`  🔴 DISTORSIONADO: ${distorsionado}`)
  console.log(`  ⚠️ Errores de API: ${errors}`)
  console.log(`  Tasa de verificación: ${((correcto + parcial) / totalVerified * 100).toFixed(1)}%`)

  if (allIssues.length > 0) {
    console.log(`\n🚨 PROPUESTAS PROBLEMÁTICAS (${allIssues.length}):`)
    for (const issue of allIssues) {
      console.log(`  🔴 ${issue.candidateName}: "${issue.title.slice(0, 70)}" → ${issue.verdict}`)
      if (issue.actualContent) {
        console.log(`     ${issue.actualContent.slice(0, 150)}`)
      }
    }
  } else {
    console.log('\n✅ TODAS LAS PROPUESTAS VERIFICADAS CORRECTAMENTE')
  }

  // Save report to file
  const report = {
    timestamp: new Date().toISOString(),
    totalProposals: allProposals.length,
    totalVerified,
    correcto,
    parcialmenteCorrecto: parcial,
    inventado,
    distorsionado,
    apiErrors: errors,
    issues: allIssues,
  }
  const reportPath = path.join(process.cwd(), 'scripts', 'verification-report.json')
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
  console.log(`\n📄 Reporte guardado en: ${reportPath}`)
}

main()
  .then(() => process.exit(0))
  .catch(err => { console.error('Fatal:', err); process.exit(1) })
