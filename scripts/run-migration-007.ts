import { neon } from '@neondatabase/serverless'

const DATABASE_URL = process.env.DATABASE_URL || ''

const sql = neon(DATABASE_URL)

async function runMigration() {
  console.log('🚀 Ejecutando migración 007_sync_infrastructure.sql...')

  try {
    // Create sync_logs table
    console.log('📝 Creando tabla sync_logs...')
    await sql`
      CREATE TABLE IF NOT EXISTS sync_logs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        source TEXT NOT NULL,
        status TEXT NOT NULL,
        records_processed INT DEFAULT 0,
        records_updated INT DEFAULT 0,
        records_created INT DEFAULT 0,
        records_skipped INT DEFAULT 0,
        error_message TEXT,
        started_at TIMESTAMPTZ DEFAULT NOW(),
        completed_at TIMESTAMPTZ,
        duration_ms INT,
        metadata JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `
    console.log('✅ sync_logs creada')

    // Create indexes for sync_logs
    console.log('📝 Creando índices para sync_logs...')
    await sql`CREATE INDEX IF NOT EXISTS idx_sync_logs_source ON sync_logs(source)`
    await sql`CREATE INDEX IF NOT EXISTS idx_sync_logs_status ON sync_logs(status)`
    await sql`CREATE INDEX IF NOT EXISTS idx_sync_logs_started_at ON sync_logs(started_at DESC)`
    console.log('✅ Índices de sync_logs creados')

    // Create news_mentions table
    console.log('📝 Creando tabla news_mentions...')
    await sql`
      CREATE TABLE IF NOT EXISTS news_mentions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
        party_id UUID REFERENCES parties(id) ON DELETE CASCADE,
        source TEXT NOT NULL,
        title TEXT NOT NULL,
        url TEXT NOT NULL,
        excerpt TEXT,
        published_at TIMESTAMPTZ,
        sentiment TEXT,
        relevance_score FLOAT DEFAULT 0.5,
        keywords TEXT[],
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `
    console.log('✅ news_mentions creada')

    // Create unique constraint on url
    try {
      await sql`ALTER TABLE news_mentions ADD CONSTRAINT unique_news_url UNIQUE (url)`
      console.log('✅ Constraint unique_news_url creado')
    } catch (e: any) {
      if (e.message?.includes('already exists')) {
        console.log('⏭️  unique_news_url ya existe')
      } else {
        throw e
      }
    }

    // Create indexes for news_mentions
    console.log('📝 Creando índices para news_mentions...')
    await sql`CREATE INDEX IF NOT EXISTS idx_news_mentions_candidate ON news_mentions(candidate_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_news_mentions_party ON news_mentions(party_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_news_mentions_published ON news_mentions(published_at DESC)`
    await sql`CREATE INDEX IF NOT EXISTS idx_news_mentions_source ON news_mentions(source)`
    await sql`CREATE INDEX IF NOT EXISTS idx_news_mentions_sentiment ON news_mentions(sentiment)`
    console.log('✅ Índices de news_mentions creados')

    // Create data_hashes table
    console.log('📝 Creando tabla data_hashes...')
    await sql`
      CREATE TABLE IF NOT EXISTS data_hashes (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        entity_type TEXT NOT NULL,
        entity_id UUID NOT NULL,
        source TEXT NOT NULL,
        data_hash TEXT NOT NULL,
        last_checked_at TIMESTAMPTZ DEFAULT NOW(),
        last_changed_at TIMESTAMPTZ
      )
    `
    console.log('✅ data_hashes creada')

    try {
      await sql`ALTER TABLE data_hashes ADD CONSTRAINT unique_entity_source UNIQUE (entity_type, entity_id, source)`
      console.log('✅ Constraint unique_entity_source creado')
    } catch (e: any) {
      if (e.message?.includes('already exists')) {
        console.log('⏭️  unique_entity_source ya existe')
      } else {
        throw e
      }
    }

    await sql`CREATE INDEX IF NOT EXISTS idx_data_hashes_entity ON data_hashes(entity_type, entity_id)`
    console.log('✅ Índice de data_hashes creado')

    // Create sync_queue table
    console.log('📝 Creando tabla sync_queue...')
    await sql`
      CREATE TABLE IF NOT EXISTS sync_queue (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        source TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id UUID,
        priority INT DEFAULT 5,
        status TEXT NOT NULL DEFAULT 'pending',
        attempts INT DEFAULT 0,
        max_attempts INT DEFAULT 3,
        last_error TEXT,
        scheduled_at TIMESTAMPTZ DEFAULT NOW(),
        started_at TIMESTAMPTZ,
        completed_at TIMESTAMPTZ,
        metadata JSONB DEFAULT '{}'::jsonb
      )
    `
    console.log('✅ sync_queue creada')

    await sql`CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status, scheduled_at)`
    await sql`CREATE INDEX IF NOT EXISTS idx_sync_queue_source ON sync_queue(source)`
    console.log('✅ Índices de sync_queue creados')

    // Create views
    console.log('📝 Creando vista latest_sync_status...')
    await sql`
      CREATE OR REPLACE VIEW latest_sync_status AS
      SELECT DISTINCT ON (source)
        id,
        source,
        status,
        records_processed,
        records_updated,
        records_created,
        records_skipped,
        error_message,
        started_at,
        completed_at,
        duration_ms,
        metadata
      FROM sync_logs
      ORDER BY source, started_at DESC
    `
    console.log('✅ Vista latest_sync_status creada')

    console.log('📝 Creando vista news_mentions_enriched...')
    await sql`
      CREATE OR REPLACE VIEW news_mentions_enriched AS
      SELECT
        nm.id,
        nm.title,
        nm.url,
        nm.excerpt,
        nm.source,
        nm.published_at,
        nm.sentiment,
        nm.relevance_score,
        nm.keywords,
        nm.created_at,
        c.full_name as candidate_name,
        c.slug as candidate_slug,
        c.cargo as candidate_cargo,
        p.name as party_name,
        p.short_name as party_short_name
      FROM news_mentions nm
      LEFT JOIN candidates c ON nm.candidate_id = c.id
      LEFT JOIN parties p ON nm.party_id = p.id
    `
    console.log('✅ Vista news_mentions_enriched creada')

    console.log('\n🎉 Migración completada exitosamente!')
  } catch (error) {
    console.error('❌ Error en migración:', error)
    process.exit(1)
  }
}

runMigration()
