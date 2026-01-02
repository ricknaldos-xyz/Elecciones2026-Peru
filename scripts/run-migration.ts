import postgres from 'postgres'
import fs from 'fs'
import path from 'path'

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_QsCV8j4rFmiW@ep-polished-mouse-ahxxvvbh-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require'

async function runMigration() {
  const sql = postgres(DATABASE_URL)
  const migrationFile = process.argv[2]

  if (!migrationFile) {
    console.error('Usage: npx tsx scripts/run-migration.ts <migration-file>')
    process.exit(1)
  }

  try {
    console.log(`Running migration: ${migrationFile}`)
    const migrationPath = path.join(process.cwd(), migrationFile)
    const migrationSql = fs.readFileSync(migrationPath, 'utf8')
    await sql.unsafe(migrationSql)
    console.log('Migration completed successfully!')

    // Verify counts
    const candidates = await sql`SELECT cargo, COUNT(*) as count FROM candidates GROUP BY cargo`
    console.log('\nCandidates by cargo:')
    candidates.forEach((c) => {
      console.log(`  ${c.cargo}: ${c.count}`)
    })

  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  } finally {
    await sql.end()
  }
}

runMigration()
