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

async function main() {
  // Get all presidential candidates with local PDFs
  const candidates = await sql`
    SELECT c.id, c.full_name, c.plan_pdf_local, p.name as party_name
    FROM candidates c
    LEFT JOIN parties p ON c.party_id = p.id
    WHERE c.cargo = 'presidente'
    AND c.plan_pdf_local IS NOT NULL
    ORDER BY c.full_name
  `

  console.log('Auditing ' + candidates.length + ' plan PDFs...\n')

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
  const issues: string[] = []

  for (const c of candidates) {
    const pdfPath = path.join(process.cwd(), 'public', c.plan_pdf_local as string)
    if (!fs.existsSync(pdfPath)) {
      console.log('MISSING: ' + c.full_name + ' - ' + pdfPath)
      continue
    }

    const pdfBuffer = fs.readFileSync(pdfPath)
    const sizeKB = Math.round(pdfBuffer.length / 1024)

    // Small PDFs (< 100KB) are suspicious
    if (sizeKB < 100) {
      console.log('SMALL (' + sizeKB + 'KB): ' + c.full_name + ' - checking...')
      
      try {
        const result = await model.generateContent([
          {
            inlineData: {
              mimeType: 'application/pdf',
              data: pdfBuffer.toString('base64'),
            },
          },
          { text: 'Responde SOLO con JSON: {"tipo": "presidencial|regional|local|otro", "ambito": "<descripcion breve del ambito>", "periodo": "<periodo mencionado>", "paginas_aprox": <numero>}' },
        ])
        const text = result.response.text().trim()
        let jsonStr = text
        if (jsonStr.startsWith('```json')) jsonStr = jsonStr.slice(7)
        if (jsonStr.startsWith('```')) jsonStr = jsonStr.slice(3)
        if (jsonStr.endsWith('```')) jsonStr = jsonStr.slice(0, -3)
        const info = JSON.parse(jsonStr.trim())
        
        if (info.tipo !== 'presidencial') {
          console.log('  -> WRONG: ' + info.tipo + ' - ' + info.ambito + ' (' + info.periodo + ')')
          issues.push(c.full_name + ': ' + info.tipo + ' - ' + info.ambito)
        } else {
          console.log('  -> OK: presidencial')
        }
      } catch (e: any) {
        console.log('  -> Error: ' + e.message)
      }
      
      // Rate limit
      await new Promise(r => setTimeout(r, 1500))
    } else {
      console.log('OK (' + sizeKB + 'KB): ' + c.full_name)
    }
  }

  console.log('\n=== ISSUES FOUND ===')
  if (issues.length === 0) {
    console.log('None')
  } else {
    for (const i of issues) {
      console.log('  - ' + i)
    }
  }
}

main().catch(console.error)
