/**
 * Extrae propuestas de todos los planes de gobierno usando Claude AI
 * Lee los PDFs locales y extrae propuestas por categoría
 */

import * as fs from 'fs'
import * as path from 'path'
import { neon } from '@neondatabase/serverless'
import Anthropic from '@anthropic-ai/sdk'

// Load environment variables
function loadEnv(): { DATABASE_URL: string; ANTHROPIC_API_KEY: string } {
  const envPath = path.join(process.cwd(), '.env.local')
  const result = { DATABASE_URL: '', ANTHROPIC_API_KEY: '' }

  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8')

    const dbMatch = content.match(/DATABASE_URL=["']?([^"'\n]+)["']?/)
    if (dbMatch) result.DATABASE_URL = dbMatch[1]

    const apiMatch = content.match(/ANTHROPIC_API_KEY=["']?([^"'\n]+)["']?/)
    if (apiMatch) result.ANTHROPIC_API_KEY = apiMatch[1]
  }

  return result
}

const env = loadEnv()
const sql = neon(env.DATABASE_URL)
const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })

const MODEL = 'claude-sonnet-4-20250514'
const MAX_TOKENS = 4096
const DELAY_MS = 3000

const PROPOSAL_CATEGORIES = [
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

type ProposalCategory = (typeof PROPOSAL_CATEGORIES)[number]

interface ExtractedProposal {
  category: ProposalCategory
  title: string
  description: string
  sourceQuote?: string
  pageReference?: string
}

interface PlanGobierno {
  candidato: string
  partido: string
  cargo: string
  foto_url: string
  plan_url: string
}

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

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function extractTextFromPdf(pdfPath: string): Promise<string | null> {
  try {
    const { PDFParse } = await import('pdf-parse')
    const buffer = fs.readFileSync(pdfPath)
    const data = new Uint8Array(buffer)
    const parser = new PDFParse({ data })
    const result = await parser.getText()
    return result.text
  } catch (error) {
    console.error(`Error parsing PDF ${pdfPath}:`, error)
    return null
  }
}

function parseAIResponse(response: string): ExtractedProposal[] {
  try {
    let jsonStr = response.trim()

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
    console.error('Failed to parse AI response:', error)
    return []
  }
}

async function extractProposalsWithAI(text: string): Promise<ExtractedProposal[]> {
  try {
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

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function main() {
  console.log('╔' + '═'.repeat(68) + '╗')
  console.log('║' + ' EXTRACCIÓN DE PROPUESTAS CON CLAUDE AI '.padStart(50).padEnd(68) + '║')
  console.log('╚' + '═'.repeat(68) + '╝')

  if (!env.ANTHROPIC_API_KEY) {
    console.error('❌ ANTHROPIC_API_KEY no configurada')
    process.exit(1)
  }

  // Read planes-gobierno.json
  const planesPath = path.join(process.cwd(), 'planes-gobierno.json')
  const allPlanes: PlanGobierno[] = JSON.parse(fs.readFileSync(planesPath, 'utf-8'))
  const presidentes = allPlanes.filter(p => p.cargo === 'PRESIDENTE DE LA REPÚBLICA')

  console.log(`\n📋 Candidatos presidenciales: ${presidentes.length}`)

  // First, update plan_gobierno_url in database
  console.log('\n' + '═'.repeat(70))
  console.log('ACTUALIZANDO URLs EN BASE DE DATOS')
  console.log('═'.repeat(70))

  for (const plan of presidentes) {
    try {
      // Search by name parts
      const nameParts = plan.candidato.split(' ')
      const updated = await sql`
        UPDATE candidates c
        SET plan_gobierno_url = ${plan.plan_url}
        FROM parties p
        WHERE c.party_id = p.id
        AND c.cargo = 'presidente'
        AND (
          (LOWER(c.full_name) LIKE ${`%${nameParts[0].toLowerCase()}%`}
           AND LOWER(c.full_name) LIKE ${`%${nameParts[1]?.toLowerCase() || ''}%`})
          OR LOWER(p.name) LIKE ${`%${plan.partido.split(' ')[0].toLowerCase()}%`}
        )
        RETURNING c.id, c.full_name
      `

      if (updated.length > 0) {
        console.log(`✓ ${updated[0].full_name}`)
      }
    } catch (error) {
      // Silent
    }
  }

  // Get candidates with plan URLs
  const candidates = await sql`
    SELECT c.id, c.full_name, c.slug, p.name as party_name, c.plan_gobierno_url
    FROM candidates c
    LEFT JOIN parties p ON c.party_id = p.id
    WHERE c.cargo = 'presidente'
    AND c.plan_gobierno_url IS NOT NULL
    ORDER BY c.full_name
  `

  console.log(`\n📊 Candidatos con plan de gobierno en BD: ${candidates.length}`)

  const stats = {
    processed: 0,
    succeeded: 0,
    failed: 0,
    totalProposals: 0,
  }

  console.log('\n' + '═'.repeat(70))
  console.log('EXTRAYENDO PROPUESTAS')
  console.log('═'.repeat(70))

  // Load planes-gobierno.json to get the mapping of plan_url to partido
  const planUrlToPartido = new Map<string, string>()
  for (const plan of presidentes) {
    if (plan.plan_url) {
      planUrlToPartido.set(plan.plan_url, plan.partido)
    }
  }

  for (const candidate of candidates) {
    stats.processed++
    console.log(`\n[${stats.processed}/${candidates.length}] ${candidate.full_name}`)
    console.log(`  Partido: ${candidate.party_name}`)
    console.log(`  Plan URL: ${candidate.plan_gobierno_url}`)

    // Find local PDF using the plan URL mapping
    const jnePartido = planUrlToPartido.get(candidate.plan_gobierno_url as string)
    const partySlug = jnePartido ? slugify(jnePartido) : slugify(candidate.party_name || '')
    const pdfPath = path.join(process.cwd(), 'public', 'planes', `${partySlug}.pdf`)

    if (!fs.existsSync(pdfPath)) {
      console.log(`  ⚠ PDF local no encontrado: ${pdfPath}`)
      stats.failed++
      continue
    }

    console.log(`  📄 PDF: ${pdfPath}`)

    // Extract text from PDF
    const text = await extractTextFromPdf(pdfPath)
    if (!text || text.length < 100) {
      console.log(`  ✗ No se pudo extraer texto del PDF`)
      stats.failed++
      continue
    }

    console.log(`  📝 Texto extraído: ${text.length} caracteres`)

    // Extract proposals with AI
    console.log(`  🤖 Analizando con Claude AI...`)
    const proposals = await extractProposalsWithAI(text)

    if (proposals.length === 0) {
      console.log(`  ✗ No se extrajeron propuestas`)
      stats.failed++
      continue
    }

    console.log(`  ✓ ${proposals.length} propuestas extraídas`)

    // Delete existing proposals
    await sql`
      DELETE FROM candidate_proposals WHERE candidate_id = ${candidate.id}
    `

    // Save new proposals
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
            ${candidate.id},
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
        console.error(`  Error guardando propuesta: ${proposal.title}`)
      }
    }

    console.log(`  💾 ${saved} propuestas guardadas en BD`)

    stats.succeeded++
    stats.totalProposals += saved

    // Rate limiting
    await delay(DELAY_MS)
  }

  // Print summary
  console.log('\n' + '═'.repeat(70))
  console.log('RESUMEN FINAL')
  console.log('═'.repeat(70))
  console.log(`Candidatos procesados: ${stats.processed}`)
  console.log(`Exitosos: ${stats.succeeded}`)
  console.log(`Fallidos: ${stats.failed}`)
  console.log(`Total propuestas: ${stats.totalProposals}`)

  // Show proposals by category
  const byCategory = await sql`
    SELECT category, COUNT(*) as count
    FROM candidate_proposals
    GROUP BY category
    ORDER BY count DESC
  `

  console.log('\nPropuestas por categoría:')
  for (const row of byCategory) {
    console.log(`  ${row.category}: ${row.count}`)
  }
}

main().catch(console.error)
