import postgres from 'postgres'
import fs from 'fs'
import path from 'path'

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_QsCV8j4rFmiW@ep-polished-mouse-ahxxvvbh-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require'

async function migrate() {
  const sql = postgres(DATABASE_URL)

  try {
    console.log('Connected to database')

    // Run schema migration
    console.log('\n📦 Running 001_initial_schema.sql...')
    const schemaPath = path.join(process.cwd(), 'supabase/migrations/001_initial_schema.sql')
    const schemaSql = fs.readFileSync(schemaPath, 'utf8')
    await sql.unsafe(schemaSql)
    console.log('✅ Schema created successfully')

    // Run seed data
    console.log('\n🌱 Running 002_seed_data.sql...')
    const seedPath = path.join(process.cwd(), 'supabase/migrations/002_seed_data.sql')
    const seedSql = fs.readFileSync(seedPath, 'utf8')
    await sql.unsafe(seedSql)
    console.log('✅ Seed data inserted successfully')

    // Verify
    console.log('\n📊 Verifying data...')
    const candidates = await sql`SELECT COUNT(*) as count FROM candidates`
    const parties = await sql`SELECT COUNT(*) as count FROM parties`
    const scores = await sql`SELECT COUNT(*) as count FROM scores`
    const flags = await sql`SELECT COUNT(*) as count FROM flags`
    const districts = await sql`SELECT COUNT(*) as count FROM districts`

    console.log(`   Candidates: ${candidates[0].count}`)
    console.log(`   Parties: ${parties[0].count}`)
    console.log(`   Districts: ${districts[0].count}`)
    console.log(`   Scores: ${scores[0].count}`)
    console.log(`   Flags: ${flags[0].count}`)

    // List some candidates
    console.log('\n👥 Sample candidates:')
    const sampleCandidates = await sql`
      SELECT c.full_name, c.cargo, p.short_name as party
      FROM candidates c
      LEFT JOIN parties p ON c.party_id = p.id
      LIMIT 5
    `
    sampleCandidates.forEach((c) => {
      console.log(`   - ${c.full_name} (${c.cargo}) - ${c.party}`)
    })

    console.log('\n✅ Migration completed successfully!')

  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  } finally {
    await sql.end()
  }
}

migrate()
