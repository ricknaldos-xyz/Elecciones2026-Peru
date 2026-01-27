import * as fs from 'fs'
import * as path from 'path'
import { neon } from '@neondatabase/serverless'

function loadEnv(): string {
  const envPath = path.join(process.cwd(), '.env.local')
  const content = fs.readFileSync(envPath, 'utf-8')
  const match = content.match(/DATABASE_URL=["']?([^"'\n]+)["']?/)
  return match ? match[1] : ''
}

const sql = neon(loadEnv())

async function main() {
  console.log('Agregando columnas faltantes a candidate_proposals...')
  
  // Add missing columns
  await sql`ALTER TABLE candidate_proposals ADD COLUMN IF NOT EXISTS source_quote TEXT`
  console.log('✓ source_quote')
  
  await sql`ALTER TABLE candidate_proposals ADD COLUMN IF NOT EXISTS page_reference TEXT`
  console.log('✓ page_reference')
  
  await sql`ALTER TABLE candidate_proposals ADD COLUMN IF NOT EXISTS ai_extracted BOOLEAN DEFAULT true`
  console.log('✓ ai_extracted')
  
  await sql`ALTER TABLE candidate_proposals ADD COLUMN IF NOT EXISTS extraction_model TEXT`
  console.log('✓ extraction_model')
  
  console.log('\n¡Columnas agregadas!')
  
  // Verify
  const columns = await sql`
    SELECT column_name FROM information_schema.columns 
    WHERE table_name = 'candidate_proposals'
    ORDER BY ordinal_position
  `
  console.log('\nColumnas actuales:', columns.map(c => c.column_name).join(', '))
}

main().catch(console.error)
