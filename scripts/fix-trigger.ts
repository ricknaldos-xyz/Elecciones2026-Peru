import { neon } from '@neondatabase/serverless'

const DATABASE_URL = 'postgresql://neondb_owner:npg_QsCV8j4rFmiW@ep-polished-mouse-ahxxvvbh-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require'

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
