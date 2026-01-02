import { neon } from '@neondatabase/serverless'

const DATABASE_URL = 'postgresql://neondb_owner:npg_QsCV8j4rFmiW@ep-polished-mouse-ahxxvvbh-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require'

const sql = neon(DATABASE_URL)

async function runMigration() {
  console.log('🚀 Ejecutando migración 008_verification_fields.sql...')

  try {
    // Add verification columns
    console.log('📝 Agregando columnas de verificación...')

    await sql`ALTER TABLE candidates ADD COLUMN IF NOT EXISTS data_source TEXT DEFAULT 'unknown'`
    console.log('✅ data_source agregada')

    await sql`ALTER TABLE candidates ADD COLUMN IF NOT EXISTS data_verified BOOLEAN DEFAULT FALSE`
    console.log('✅ data_verified agregada')

    await sql`ALTER TABLE candidates ADD COLUMN IF NOT EXISTS inscription_status TEXT`
    console.log('✅ inscription_status agregada')

    await sql`ALTER TABLE candidates ADD COLUMN IF NOT EXISTS inscription_date TIMESTAMPTZ`
    console.log('✅ inscription_date agregada')

    await sql`ALTER TABLE candidates ADD COLUMN IF NOT EXISTS verification_date TIMESTAMPTZ`
    console.log('✅ verification_date agregada')

    // Create indexes
    console.log('📝 Creando índices...')
    await sql`CREATE INDEX IF NOT EXISTS idx_candidates_verified ON candidates(data_verified)`
    await sql`CREATE INDEX IF NOT EXISTS idx_candidates_data_source ON candidates(data_source)`
    await sql`CREATE INDEX IF NOT EXISTS idx_candidates_jne_id ON candidates(jne_id)`
    console.log('✅ Índices creados')

    // Mark all current candidates as fake/legacy
    console.log('📝 Marcando candidatos actuales como legacy...')
    const result = await sql`
      UPDATE candidates
      SET data_source = 'legacy_fake', data_verified = FALSE
      WHERE data_source = 'unknown' OR data_source IS NULL
    `
    console.log(`✅ ${result.count || 'Todos los'} candidatos marcados como legacy_fake`)

    console.log('\n🎉 Migración completada exitosamente!')
  } catch (error) {
    console.error('❌ Error en migración:', error)
    process.exit(1)
  }
}

runMigration()
