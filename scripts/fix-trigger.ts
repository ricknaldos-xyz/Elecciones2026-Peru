import { neon } from '@neondatabase/serverless'

const DATABASE_URL = process.env.DATABASE_URL || ''

const sql = neon(DATABASE_URL)

async function fixTrigger() {
  try {
    // Drop the problematic trigger
    await sql`DROP TRIGGER IF EXISTS update_candidates_updated_at ON candidates`
    console.log('✅ Trigger eliminado exitosamente')
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

fixTrigger()
