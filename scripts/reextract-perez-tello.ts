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

async function main() {
  const pdfPath = path.join(process.cwd(), 'public/planes/primero-la-gente-comunidad-ecologia-libertad-y-progreso.pdf')
  const pdfBuffer = fs.readFileSync(pdfPath)
  const sizeKB = Math.round(pdfBuffer.length / 1024)
  console.log('PDF size: ' + sizeKB + 'KB')

  const model = genAI.getGenerativeModel({ model: MODEL })

  console.log('\n--- Checking PDF content ---')
  const checkResult = await model.generateContent([
    {
      inlineData: {
        mimeType: 'application/pdf',
        data: pdfBuffer.toString('base64'),
      },
    },
    { text: 'Describe brevemente de que trata este documento. Es un plan de gobierno presidencial o de otro tipo? De que partido/candidato es? Responde en 3-4 oraciones.' },
  ])
  console.log(checkResult.response.text())

  console.log('\n--- Extracting proposals ---')
  const extractResult = await model.generateContent([
    {
      inlineData: {
        mimeType: 'application/pdf',
        data: pdfBuffer.toString('base64'),
      },
    },
    { text: 'Eres un analista politico experto. Analiza el plan de gobierno adjunto (PDF) y extrae las propuestas principales.\n\nExtrae entre 10 y 20 propuestas principales, clasificandolas en estas categorias:\n- economia: Politica economica, empleo, impuestos, comercio\n- salud: Sistema de salud, hospitales, medicinas, pandemia\n- educacion: Escuelas, universidades, investigacion, becas\n- seguridad: Policia, crimen, narcotrafico, fuerzas armadas\n- corrupcion: Lucha anticorrupcion, transparencia, contraloria\n- mineria_ambiente: Mineria, medio ambiente, agua, cambio climatico\n- infraestructura: Obras publicas, transporte, conectividad\n- social: Programas sociales, pensiones, vivienda, pobreza\n- reforma_politica: Reforma del Estado, descentralizacion, electoral\n- otros: Propuestas que no encajan en las categorias anteriores\n\nResponde SOLO con un array JSON valido (sin markdown, sin explicaciones) con esta estructura:\n[\n  {\n    "category": "<categoria>",\n    "title": "<titulo corto y descriptivo, maximo 100 caracteres>",\n    "description": "<descripcion clara de la propuesta, maximo 300 caracteres>",\n    "sourceQuote": "<cita textual relevante del documento si la hay>",\n    "pageReference": "<numero de pagina si se puede identificar>"\n  }\n]\n\nREGLAS:\n- Incluye SOLO propuestas concretas, no declaraciones generales\n- El titulo debe ser especifico y descriptivo\n- La descripcion debe explicar QUE propone y COMO lo haria\n- Si no hay propuestas claras en una categoria, omitela\n- Prioriza propuestas con impacto medible\n- Se objetivo y basado en el texto, no inventes informacion' },
  ])

  const responseText = extractResult.response.text()
  let jsonStr = responseText.trim()
  if (jsonStr.startsWith('```json')) jsonStr = jsonStr.slice(7)
  else if (jsonStr.startsWith('```')) jsonStr = jsonStr.slice(3)
  if (jsonStr.endsWith('```')) jsonStr = jsonStr.slice(0, -3)

  const proposals = JSON.parse(jsonStr.trim())
  console.log('\nExtracted ' + proposals.length + ' proposals:')
  for (const p of proposals) {
    console.log('  [' + p.category + '] ' + p.title)
  }

  // Update database
  const candidateId = '86884584-daab-4b1b-91da-de9a1d748261'

  await sql`DELETE FROM candidate_proposals WHERE candidate_id = ${candidateId}`
  console.log('\nDeleted old proposals')

  let saved = 0
  for (const p of proposals) {
    await sql`
      INSERT INTO candidate_proposals (
        candidate_id, category, title, description,
        source_quote, page_reference, ai_extracted, extraction_model
      ) VALUES (
        ${candidateId}, ${p.category}, ${p.title}, ${p.description},
        ${p.sourceQuote || null}, ${p.pageReference || null}, true, ${MODEL}
      )
    `
    saved++
  }
  console.log('Saved ' + saved + ' new proposals')
}

main().catch(console.error)
