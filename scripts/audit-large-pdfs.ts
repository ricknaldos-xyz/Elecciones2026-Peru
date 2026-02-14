/**
 * Re-verify candidates whose PDFs were too large for Gemini's native PDF processing
 * Uses pdf-parse to extract text, then verifies proposals via Gemini with text input
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

// Candidates that hit rate limits during full verification - need re-run
const CANDIDATES_TO_VERIFY = [
  'MASSE FERNANDEZ ARMANDO JOAQUIN',
  'MOLINELLI ARISTONDO FIORELLA GIANNINA',
  'OLIVERA VEGA LUIS FERNANDO',
]

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function main() {
  console.log('='.repeat(80))
  console.log(' VERIFICACIÓN DE CANDIDATOS CON PDFs GRANDES')
  console.log(' Método: text extraction + Gemini 2.5 Pro')
  console.log('='.repeat(80))

  const model = genAI.getGenerativeModel({ model: MODEL })
  let totalPassed = 0
  let totalFailed = 0
  const issues: string[] = []

  for (const candidateName of CANDIDATES_TO_VERIFY) {
    console.log(`\n${'─'.repeat(70)}`)
    console.log(`📋 ${candidateName}`)

    // Get candidate + proposals
    const candidates = await sql`
      SELECT c.id, c.full_name, c.plan_pdf_local, p.name as party_name
      FROM candidates c
      LEFT JOIN parties p ON c.party_id = p.id
      WHERE c.full_name = ${candidateName}
      AND c.cargo = 'presidente' AND c.is_active = true
    `

    if (candidates.length === 0) {
      console.log('  ❌ Candidato no encontrado')
      continue
    }

    const c = candidates[0]
    console.log(`  Partido: ${c.party_name}`)
    console.log(`  PDF: ${c.plan_pdf_local}`)

    if (!c.plan_pdf_local) {
      console.log('  ❌ Sin PDF')
      continue
    }

    const pdfPath = path.join(process.cwd(), 'public', c.plan_pdf_local as string)
    if (!fs.existsSync(pdfPath)) {
      console.log('  ❌ PDF no existe en disco')
      continue
    }

    // Get proposals
    const proposals = await sql`
      SELECT id, category, title, description, source_quote, page_reference
      FROM candidate_proposals
      WHERE candidate_id = ${c.id}
      ORDER BY category
    `
    console.log(`  Propuestas en BD: ${proposals.length}`)

    // Extract text from PDF
    const pdfBuffer = fs.readFileSync(pdfPath)
    const sizeKB = Math.round(pdfBuffer.length / 1024)
    console.log(`  PDF tamaño: ${sizeKB}KB`)

    let pdfPages: Array<{ text: string; num: number }>
    try {
      const parser = new PDFParseClass({ verbosity: 0, data: new Uint8Array(pdfBuffer) })
      await parser.load()
      const result = await parser.getText()
      pdfPages = result.pages as Array<{ text: string; num: number }>
      const totalChars = pdfPages.reduce((sum: number, p: { text: string }) => sum + p.text.length, 0)
      console.log(`  Texto extraído: ${totalChars} chars, ${pdfPages.length} páginas`)
      parser.destroy()
    } catch (err: any) {
      console.log(`  ❌ Error extrayendo texto: ${err.message}`)
      issues.push(`❌ ${candidateName}: No se pudo extraer texto del PDF`)
      continue
    }

    // Select 3 proposals to verify (first, middle, last)
    const indicesToCheck = [
      0,
      Math.floor(proposals.length / 2),
      proposals.length - 1
    ].filter((v, i, a) => a.indexOf(v) === i)

    const proposalsToVerify = indicesToCheck.map(idx => proposals[idx])

    // For each proposal, verify individually using only relevant pages
    for (const prop of proposalsToVerify) {
      // Parse page reference to find relevant pages
      const pageRef = (prop.page_reference as string) || ''
      const pageNums: number[] = []
      const matches = pageRef.match(/\d+/g)
      if (matches) {
        for (const m of matches) pageNums.push(parseInt(m))
      }

      // Extract text from relevant pages (± 2 pages for context)
      let relevantText = ''
      if (pageNums.length > 0) {
        const minPage = Math.max(1, Math.min(...pageNums) - 2)
        const maxPage = Math.max(...pageNums) + 2
        const relevantPages = pdfPages.filter(p => p.num >= minPage && p.num <= maxPage)
        relevantText = relevantPages.map(p => `[PÁGINA ${p.num}]\n${p.text}`).join('\n\n')
      }

      // If no page ref or text too short, use first + last 20 pages + keyword search
      if (relevantText.length < 200) {
        const keywords = (prop.title as string).split(' ').filter((w: string) => w.length > 4).slice(0, 3)
        const matchingPages = pdfPages.filter(p =>
          keywords.some((kw: string) => p.text.toLowerCase().includes(kw.toLowerCase()))
        ).slice(0, 10)
        if (matchingPages.length > 0) {
          relevantText = matchingPages.map(p => `[PÁGINA ${p.num}]\n${p.text}`).join('\n\n')
        } else {
          // Fallback: first 20 + last 20 pages
          const firstPages = pdfPages.slice(0, 20)
          const lastPages = pdfPages.slice(-20)
          const combined = [...firstPages, ...lastPages.filter(p => p.num > 20)]
          relevantText = combined.map(p => `[PÁGINA ${p.num}]\n${p.text}`).join('\n\n')
        }
      }

      // Cap at 120K chars per verification
      if (relevantText.length > 120000) {
        relevantText = relevantText.slice(0, 120000) + '\n[...TRUNCADO...]'
      }

      const verificationPrompt = `Eres un auditor de datos. Te doy páginas extraídas de un Plan de Gobierno y UNA propuesta que supuestamente fue extraída de este documento.

PÁGINAS DEL PLAN DE GOBIERNO:
---
${relevantText}
---

Verifica esta propuesta:
TÍTULO: ${prop.title}
DESCRIPCIÓN: ${prop.description}
CITA FUENTE: ${prop.source_quote || 'N/A'}
PÁGINA REF: ${prop.page_reference || 'N/A'}

Preguntas:
1. ¿Existe esta propuesta realmente en las páginas proporcionadas? (SÍ/NO)
2. ¿La descripción es fiel al contenido? (SÍ/PARCIAL/NO)

Responde SOLO con JSON válido (sin markdown):
{
  "existsInDocument": true/false,
  "descriptionFidelity": "SÍ" | "PARCIAL" | "NO",
  "actualContent": "<qué dice realmente el documento, breve>",
  "verdict": "CORRECTO" | "PARCIALMENTE_CORRECTO" | "INVENTADO" | "DISTORSIONADO"
}`

      try {
        const result = await model.generateContent(verificationPrompt)
        const responseText = result.response.text()

        let jsonStr = responseText.trim()
        if (jsonStr.startsWith('```json')) jsonStr = jsonStr.slice(7)
        else if (jsonStr.startsWith('```')) jsonStr = jsonStr.slice(3)
        if (jsonStr.endsWith('```')) jsonStr = jsonStr.slice(0, -3)
        jsonStr = jsonStr.trim()

        const v = JSON.parse(jsonStr)

        const icon = v.verdict === 'CORRECTO' ? '✅' :
                     v.verdict === 'PARCIALMENTE_CORRECTO' ? '🟡' :
                     '🔴'

        console.log(`  ${icon} "${(prop.title as string).slice(0, 60)}..." → ${v.verdict}`)
        if (v.actualContent && v.verdict !== 'CORRECTO') {
          console.log(`     Contenido real: ${v.actualContent.slice(0, 120)}`)
        }

        if (v.verdict === 'CORRECTO' || v.verdict === 'PARCIALMENTE_CORRECTO') {
          totalPassed++
        } else {
          totalFailed++
          issues.push(`🔴 ${candidateName}: "${prop.title}" → ${v.verdict}: ${v.actualContent}`)
        }
      } catch (error: any) {
        console.log(`  ⚠️ Error verificando "${(prop.title as string).slice(0, 40)}": ${error.message?.slice(0, 100)}`)
        issues.push(`⚠️ ${candidateName}: Error "${prop.title}": ${error.message?.slice(0, 80)}`)
      }

      await delay(3000)
    }
  }

  // Report
  console.log('\n' + '='.repeat(80))
  console.log(' REPORTE VERIFICACIÓN PDFs GRANDES')
  console.log('='.repeat(80))
  console.log(`  Spot-checks pasados: ${totalPassed}`)
  console.log(`  Spot-checks fallados: ${totalFailed}`)

  if (issues.length > 0) {
    console.log(`\n🚨 PROBLEMAS (${issues.length}):`)
    for (const issue of issues) {
      console.log(`  ${issue}`)
    }
  } else {
    console.log('\n✅ TODOS LOS CANDIDATOS VERIFICADOS CORRECTAMENTE')
  }
}

main()
  .then(() => process.exit(0))
  .catch(err => { console.error('Fatal:', err); process.exit(1) })
