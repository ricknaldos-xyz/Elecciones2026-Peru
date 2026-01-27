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
  // Check table structure
  const columns = await sql`
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns 
    WHERE table_name = 'candidate_proposals'
    ORDER BY ordinal_position
  `
  console.log('Columns in candidate_proposals:')
  for (const c of columns) {
    console.log(`  ${c.column_name}: ${c.data_type} (nullable: ${c.is_nullable})`)
  }
  
  // Try a test insert
  const candidates = await sql`
    SELECT id, full_name FROM candidates WHERE cargo = 'presidente' LIMIT 1
  `
  
  if (candidates.length > 0) {
    console.log('\nTest candidate:', candidates[0].full_name)
    console.log('Candidate ID:', candidates[0].id)
    
    try {
      await sql`
        INSERT INTO candidate_proposals (
          candidate_id, category, title, description, ai_extracted, extraction_model
        ) VALUES (
          ${candidates[0].id}::uuid, 'economia', 'Test proposal', 'Test description', true, 'test'
        )
      `
      console.log('✓ Test insert successful!')
      
      // Delete the test
      await sql`DELETE FROM candidate_proposals WHERE title = 'Test proposal'`
    } catch (error) {
      console.log('✗ Test insert failed:', error)
    }
  }
}

main().catch(console.error)
