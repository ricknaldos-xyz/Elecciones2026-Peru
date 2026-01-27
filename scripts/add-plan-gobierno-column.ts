/**
 * Adds plan_gobierno_url column to candidates table
 */

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
  console.log('Adding plan_gobierno_url column...')

  // Add column if not exists
  await sql`
    ALTER TABLE candidates
    ADD COLUMN IF NOT EXISTS plan_gobierno_url TEXT
  `
  console.log('✓ Column added')

  // Create candidate_proposals table if not exists
  await sql`
    CREATE TABLE IF NOT EXISTS candidate_proposals (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
      category TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      source_quote TEXT,
      page_reference TEXT,
      ai_extracted BOOLEAN DEFAULT true,
      extraction_model TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `
  console.log('✓ candidate_proposals table created')

  // Create index
  await sql`
    CREATE INDEX IF NOT EXISTS idx_candidate_proposals_candidate
    ON candidate_proposals(candidate_id)
  `
  console.log('✓ Index created')

  console.log('\nDone!')
}

main().catch(console.error)
