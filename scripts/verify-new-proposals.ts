/**
 * VERIFICATION: Verify ALL new proposals from deep extraction
 * Only verifies proposals with extraction_model containing 'deep'
 * Uses pdf-parse + Gemini 2.0 Flash for verification
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
const MODEL = 'gemini-2.0-flash'
const BATCH_SIZE = 10
const DELAY_MS = 4000

// If set, only verify these candidates (for re-running rate-limited ones)
const ONLY_CANDIDATES: string[] | null = null

interface Proposal {
  id: string
  category: string
  title: string
  description: string
  source_quote: string | null
  page_reference: string | null
}

interface PdfPage { text: string; num: number }

interface VerificationResult {
  proposalId: string
  candidateName: string
  title: string
  verdict: 'CORRECTO' | 'PARCIALMENTE_CORRECTO' | 'INVENTADO' | 'DISTORSIONADO'
  actualContent: string
}

function delay(ms: number) { return new Promise(r => setTimeout(r, ms)) }

function parsePageRefs(pageRef: string | null): number[] {
  if (!pageRef) return []
  const matches = pageRef.match(/\d+/g)
  return matches ? matches.map(m => parseInt(m)) : []
}

async function extractPdfText(pdfPath: string): Promise<PdfPage[]> {
  const buf = fs.readFileSync(pdfPath)
  const parser = new PDFParseClass({ verbosity: 0, data: new Uint8Array(buf) })
  await parser.load()
  const result = await parser.getText()
  const pages = result.pages as PdfPage[]
  parser.destroy()
  return pages
}

function getRelevantTextForBatch(batch: Proposal[], pages: PdfPage[]): string {
  const allPageNums: Set<number> = new Set()

  for (const prop of batch) {
    const refs = parsePageRefs(prop.page_reference)
    for (const ref of refs) {
      for (let p = Math.max(1, ref - 1); p <= ref + 1; p++) {
        allPageNums.add(p)
      }
    }
  }

  // For proposals without page refs, do keyword search
  const propsWithoutRefs = batch.filter(p => parsePageRefs(p.page_reference).length === 0)
  let keywordText = ''
  for (const prop of propsWithoutRefs) {
    const keywords = (prop.title as string).split(/\s+/).filter(w => w.length > 4).map(w => w.toLowerCase()).slice(0, 4)
    if (keywords.length > 0) {
      const scored = pages.map(p => {
        const t = p.text.toLowerCase()
        return { page: p, hits: keywords.filter(kw => t.includes(kw)).length }
      }).filter(s => s.hits > 0).sort((a, b) => b.hits - a.hits).slice(0, 3)
      keywordText += scored.map(s => `[PÁGINA ${s.page.num}]\n${s.page.text}`).join('\n\n') + '\n\n'
    }
  }

  if (allPageNums.size === 0 && keywordText.length < 500) {
    // Fallback: first, middle, last
    const first = pages.slice(0, 10)
    const mid = pages.slice(Math.floor(pages.length / 2) - 5, Math.floor(pages.length / 2) + 5)
    const last = pages.slice(-10)
    keywordText = [...first, ...mid, ...last].map(p => `[PÁGINA ${p.num}]\n${p.text}`).join('\n\n')
  }

  let pageText = ''
  if (allPageNums.size > 0) {
    const sorted = [...allPageNums].sort((a, b) => a - b)
    pageText = pages.filter(p => sorted.includes(p.num)).map(p => `[PÁGINA ${p.num}]\n${p.text}`).join('\n\n')
  }

  const fullText = (pageText + '\n\n' + keywordText).trim()
  return fullText.length > 100000 ? fullText.slice(0, 100000) + '\n[...TRUNCADO...]' : fullText
}

async function callWithRetry(model: any, prompt: string, maxRetries = 3): Promise<string> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await model.generateContent(prompt)
      return result.response.text()
    } catch (err: any) {
      const msg = err.message || ''
      if (attempt < maxRetries - 1) {
        const waitTime = Math.min(30000 * Math.pow(2, attempt), 120000)
        console.log(`    ⏳ Rate limit (attempt ${attempt + 1}/${maxRetries}), waiting ${waitTime / 1000}s...`)
        await delay(waitTime)
        continue
      }
      throw err
    }
  }
  throw new Error('Max retries exceeded')
}

async function verifyBatch(
  model: any, batch: Proposal[], relevantText: string, candidateName: string
): Promise<VerificationResult[]> {
  const prompt = `Eres un auditor de datos. Verificas propuestas extraídas de un Plan de Gobierno contra el texto original.

PÁGINAS DEL PLAN DE GOBIERNO:
---
${relevantText}
---

Para CADA propuesta, verifica si existe realmente en el documento y si la descripción es fiel.

Propuestas a verificar:
${batch.map((p, idx) => `
${idx + 1}. TÍTULO: ${p.title}
   DESCRIPCIÓN: ${(p.description as string).slice(0, 200)}
   CITA: ${(p.source_quote as string || 'N/A').slice(0, 150)}
   PÁG: ${p.page_reference || 'N/A'}
`).join('')}

Responde SOLO con JSON array (sin markdown):
[{"proposalIndex":1,"verdict":"CORRECTO","actualContent":"breve resumen"}]

Verdicts: "CORRECTO", "PARCIALMENTE_CORRECTO", "INVENTADO", "DISTORSIONADO"`

  const responseText = await callWithRetry(model, prompt, 3)

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
  console.log(' VERIFICACIÓN: PROPUESTAS DE EXTRACCIÓN PROFUNDA')
  console.log(` Modelo: ${MODEL} | Batch: ${BATCH_SIZE}`)
  console.log('='.repeat(80))

  const model = genAI.getGenerativeModel({ model: MODEL })

  // Get candidates
  const candidates = await sql`
    SELECT c.id, c.full_name, p.name as party_name, c.plan_pdf_local
    FROM candidates c
    LEFT JOIN parties p ON c.party_id = p.id
    WHERE c.cargo = 'presidente' AND c.is_active = true
    ORDER BY c.full_name
  `

  // Get ONLY new proposals (from deep extraction)
  const allProposals = await sql`
    SELECT cp.id, cp.candidate_id, cp.category, cp.title, cp.description,
           cp.source_quote, cp.page_reference
    FROM candidate_proposals cp
    JOIN candidates c ON cp.candidate_id = c.id
    WHERE c.cargo = 'presidente' AND c.is_active = true
    AND cp.extraction_model LIKE '%deep%'
    ORDER BY cp.candidate_id, cp.category
  `

  const proposalsByCandidate = new Map<string, Proposal[]>()
  for (const p of allProposals) {
    const list = proposalsByCandidate.get(p.candidate_id as string) || []
    list.push(p as unknown as Proposal)
    proposalsByCandidate.set(p.candidate_id as string, list)
  }

  console.log(`\nCandidatos: ${candidates.length}`)
  console.log(`Propuestas nuevas a verificar: ${allProposals.length}`)

  let totalBatches = 0
  for (const c of candidates) {
    const props = proposalsByCandidate.get(c.id as string) || []
    totalBatches += Math.ceil(props.length / BATCH_SIZE)
  }
  console.log(`Lotes estimados: ${totalBatches}`)

  // PDF cache
  const pdfCache = new Map<string, PdfPage[]>()

  // Results tracking
  let totalVerified = 0, correcto = 0, parcial = 0, inventado = 0, distorsionado = 0, errors = 0, batchNum = 0
  const allIssues: VerificationResult[] = []

  for (let ci = 0; ci < candidates.length; ci++) {
    const c = candidates[ci]
    const proposals = proposalsByCandidate.get(c.id as string) || []
    if (proposals.length === 0) continue
    if (ONLY_CANDIDATES && !ONLY_CANDIDATES.includes(c.full_name as string)) continue

    console.log(`\n${'─'.repeat(70)}`)
    console.log(`[${ci + 1}/${candidates.length}] ${c.full_name} (${proposals.length} propuestas)`)

    if (!c.plan_pdf_local) { console.log(`  ❌ Sin PDF`); continue }
    const pdfPath = path.join(process.cwd(), 'public', c.plan_pdf_local as string)
    if (!fs.existsSync(pdfPath)) { console.log(`  ❌ PDF no existe`); continue }

    // Extract or use cached PDF text
    if (!pdfCache.has(c.plan_pdf_local as string)) {
      try {
        pdfCache.set(c.plan_pdf_local as string, await extractPdfText(pdfPath))
      } catch (err: any) {
        console.log(`  ❌ Error PDF: ${err.message?.slice(0, 80)}`); continue
      }
    }
    const pages = pdfCache.get(c.plan_pdf_local as string)!

    // Group into batches sorted by page reference
    const sorted = [...proposals].sort((a, b) => {
      const aP = parsePageRefs(a.page_reference), bP = parsePageRefs(b.page_reference)
      return (aP.length > 0 ? Math.min(...aP) : 9999) - (bP.length > 0 ? Math.min(...bP) : 9999)
    })
    const batches: Proposal[][] = []
    for (let i = 0; i < sorted.length; i += BATCH_SIZE) batches.push(sorted.slice(i, i + BATCH_SIZE))

    let candidateOK = 0, candidateBad = 0

    for (let bi = 0; bi < batches.length; bi++) {
      batchNum++
      const batch = batches[bi]
      const relevantText = getRelevantTextForBatch(batch, pages)

      try {
        const results = await verifyBatch(model, batch, relevantText, c.full_name as string)

        for (const r of results) {
          totalVerified++
          switch (r.verdict) {
            case 'CORRECTO': correcto++; candidateOK++; break
            case 'PARCIALMENTE_CORRECTO': parcial++; candidateOK++; break
            case 'INVENTADO': inventado++; candidateBad++; allIssues.push(r); break
            case 'DISTORSIONADO': distorsionado++; candidateBad++; allIssues.push(r); break
            default: candidateOK++
          }
        }

        const icons = results.map(r =>
          r.verdict === 'CORRECTO' ? '✅' : r.verdict === 'PARCIALMENTE_CORRECTO' ? '🟡' : '🔴'
        ).join('')
        process.stdout.write(`  [${bi + 1}/${batches.length}] ${icons} (${batchNum}/${totalBatches})\n`)
      } catch (err: any) {
        errors++
        console.log(`  [${bi + 1}/${batches.length}] ❌ ${err.message?.slice(0, 80)}`)
      }

      await delay(DELAY_MS)
    }

    console.log(`  → ${candidateOK} OK, ${candidateBad} problemas`)

    // Free memory for large PDFs
    if (proposals.length > 200) pdfCache.delete(c.plan_pdf_local as string)
  }

  // Final report
  console.log('\n' + '='.repeat(80))
  console.log(' REPORTE — VERIFICACIÓN DE PROPUESTAS NUEVAS')
  console.log('='.repeat(80))
  console.log(`  Total verificadas: ${totalVerified} / ${allProposals.length}`)
  console.log(`  ✅ CORRECTO: ${correcto}`)
  console.log(`  🟡 PARCIALMENTE_CORRECTO: ${parcial}`)
  console.log(`  🔴 INVENTADO: ${inventado}`)
  console.log(`  🔴 DISTORSIONADO: ${distorsionado}`)
  console.log(`  ⚠️ Errores API: ${errors}`)
  if (totalVerified > 0) {
    console.log(`  Tasa OK: ${((correcto + parcial) / totalVerified * 100).toFixed(1)}%`)
  }

  if (allIssues.length > 0) {
    console.log(`\n🚨 PROPUESTAS PROBLEMÁTICAS (${allIssues.length}):`)
    for (const issue of allIssues) {
      console.log(`  🔴 [${issue.verdict}] ${issue.candidateName}: "${issue.title.slice(0, 60)}"`)
      if (issue.actualContent) console.log(`     ${issue.actualContent.slice(0, 150)}`)
    }
  }

  // Save report
  const report = {
    timestamp: new Date().toISOString(),
    totalNewProposals: allProposals.length,
    totalVerified, correcto, parcialmenteCorrecto: parcial,
    inventado, distorsionado, apiErrors: errors,
    issues: allIssues,
  }
  const reportPath = path.join(process.cwd(), 'scripts', 'verification-report-deep.json')
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
  console.log(`\n📄 Reporte: ${reportPath}`)
}

main()
  .then(() => process.exit(0))
  .catch(err => { console.error('Fatal:', err); process.exit(1) })
