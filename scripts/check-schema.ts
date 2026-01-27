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
  const result = await sql`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'candidates' 
    ORDER BY ordinal_position
  `
  console.log('Columns in candidates table:')
  result.forEach(r => console.log(`  - ${r.column_name}`))
}

main().catch(console.error)
