-- Migration: Sync Infrastructure
-- Creates tables for automatic data synchronization logging and news mentions

-- Sync Logs table - tracks all synchronization jobs
CREATE TABLE IF NOT EXISTS sync_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source TEXT NOT NULL CHECK (source IN ('jne', 'onpe', 'poder_judicial', 'news')),
  status TEXT NOT NULL CHECK (status IN ('started', 'running', 'completed', 'failed')),
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
);

-- Indexes for sync_logs
CREATE INDEX idx_sync_logs_source ON sync_logs(source);
CREATE INDEX idx_sync_logs_status ON sync_logs(status);
CREATE INDEX idx_sync_logs_started_at ON sync_logs(started_at DESC);

-- News Mentions table - stores news articles mentioning candidates/parties
CREATE TABLE IF NOT EXISTS news_mentions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
  party_id UUID REFERENCES parties(id) ON DELETE CASCADE,
  source TEXT NOT NULL CHECK (source IN (
    'elcomercio', 'larepublica', 'rpp', 'gestion',
    'convoca', 'ojo_publico', 'idl_reporteros',
    'peru21', 'correo', 'expreso', 'other'
  )),
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  excerpt TEXT,
  published_at TIMESTAMPTZ,
  sentiment TEXT CHECK (sentiment IN ('positive', 'negative', 'neutral', 'mixed')),
  relevance_score FLOAT DEFAULT 0.5,
  keywords TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_news_url UNIQUE (url)
);

-- Indexes for news_mentions
CREATE INDEX idx_news_mentions_candidate ON news_mentions(candidate_id);
CREATE INDEX idx_news_mentions_party ON news_mentions(party_id);
CREATE INDEX idx_news_mentions_published ON news_mentions(published_at DESC);
CREATE INDEX idx_news_mentions_source ON news_mentions(source);
CREATE INDEX idx_news_mentions_sentiment ON news_mentions(sentiment);

-- Data hash table - for change detection
CREATE TABLE IF NOT EXISTS data_hashes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('candidate', 'party', 'finance')),
  entity_id UUID NOT NULL,
  source TEXT NOT NULL,
  data_hash TEXT NOT NULL,
  last_checked_at TIMESTAMPTZ DEFAULT NOW(),
  last_changed_at TIMESTAMPTZ,
  CONSTRAINT unique_entity_source UNIQUE (entity_type, entity_id, source)
);

CREATE INDEX idx_data_hashes_entity ON data_hashes(entity_type, entity_id);

-- Sync queue table - for managing batch operations
CREATE TABLE IF NOT EXISTS sync_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  priority INT DEFAULT 5,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  attempts INT DEFAULT 0,
  max_attempts INT DEFAULT 3,
  last_error TEXT,
  scheduled_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_sync_queue_status ON sync_queue(status, scheduled_at);
CREATE INDEX idx_sync_queue_source ON sync_queue(source);

-- View for latest sync status per source
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
ORDER BY source, started_at DESC;

-- View for news mentions with candidate/party details
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
LEFT JOIN parties p ON nm.party_id = p.id;

-- Function to calculate sync duration
CREATE OR REPLACE FUNCTION calculate_sync_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.completed_at IS NOT NULL AND NEW.started_at IS NOT NULL THEN
    NEW.duration_ms := EXTRACT(EPOCH FROM (NEW.completed_at - NEW.started_at)) * 1000;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-calculate duration
DROP TRIGGER IF EXISTS sync_logs_duration_trigger ON sync_logs;
CREATE TRIGGER sync_logs_duration_trigger
  BEFORE UPDATE ON sync_logs
  FOR EACH ROW
  EXECUTE FUNCTION calculate_sync_duration();

-- Function to clean old sync logs (keep last 30 days)
CREATE OR REPLACE FUNCTION clean_old_sync_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM sync_logs WHERE started_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;
