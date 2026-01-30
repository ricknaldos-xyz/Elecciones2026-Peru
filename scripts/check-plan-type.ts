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
    AND c.is_active = true
    ORDER BY c.full_name
  `

  console.log('Checking ' + candidates.length + ' plan PDFs for correct scope...\n')

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
  const issues: any[] = []

  for (let i = 0; i < candidates.length; i++) {
    const c = candidates[i]
    const pdfPath = path.join(process.cwd(), 'public', c.plan_pdf_local as string)
    if (!fs.existsSync(pdfPath)) continue

    const pdfBuffer = fs.readFileSync(pdfPath)
    const sizeKB = Math.round(pdfBuffer.length / 1024)
    const num = (i + 1) + '/' + candidates.length
    
    try {
      const result = await model.generateContent([
        {
          inlineData: {
            mimeType: 'application/pdf',
            data: pdfBuffer.toString('base64'),
          },
        },
        { text: 'Este PDF deberia ser un plan de gobierno PRESIDENCIAL para las elecciones generales del Peru 2026. Responde SOLO con JSON: {"es_presidencial": true/false, "tipo_real": "presidencial|regional|local|municipal|distrital|otro", "ambito": "<pais/region/provincia/distrito mencionado>", "periodo": "<periodo>", "candidato_mencionado": "<nombre si aparece>"}' },
      ])
      const text = result.response.text().trim()
      let jsonStr = text
      if (jsonStr.startsWith('```json')) jsonStr = jsonStr.slice(7)
      if (jsonStr.startsWith('```')) jsonStr = jsonStr.slice(3)
      if (jsonStr.endsWith('```')) jsonStr = jsonStr.slice(0, -3)
      const info = JSON.parse(jsonStr.trim())
      
      if (!info.es_presidencial) {
        console.log('[' + num + '] WRONG: ' + c.full_name + ' (' + sizeKB + 'KB)')
        console.log('         tipo=' + info.tipo_real + ' ambito=' + info.ambito + ' periodo=' + info.periodo)
        issues.push({ name: c.full_name, id: c.id, party: c.party_name, ...info })
      } else {
        console.log('[' + num + '] OK: ' + c.full_name)
      }
    } catch (e: any) {
      console.log('[' + num + '] ERR: ' + c.full_name + ' - ' + e.message?.slice(0, 80))
    }
    
    await new Promise(r => setTimeout(r, 1200))
  }

  console.log('\n========================================')
  console.log('PLANS WITH WRONG SCOPE: ' + issues.length)
  console.log('========================================')
  for (const i of issues) {
    console.log('  ' + i.name)
    console.log('    Party: ' + i.party)
    console.log('    Type: ' + i.tipo_real + ' | Scope: ' + i.ambito + ' | Period: ' + i.periodo)
  }
}

main().catch(console.error)
