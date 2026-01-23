-- Migration: Update sync_logs source constraint with new data sources
-- Adds support for: congreso_votaciones, sunat, proposal_evaluation, contraloria, mef, indecopi, sunafil, oefa

-- Drop and recreate sync_logs source constraint with all supported sources
ALTER TABLE sync_logs DROP CONSTRAINT IF EXISTS sync_logs_source_check;
ALTER TABLE sync_logs ADD CONSTRAINT sync_logs_source_check
  CHECK (source IN (
    -- Original sources
    'jne', 'onpe', 'poder_judicial', 'news',
    'youtube', 'google_news', 'tiktok', 'twitter',
    'expanded_rss', 'ai_analysis', 'government_plans',
    'jne_enrich', 'congress', 'judicial', 'plans',
    -- New enhanced evaluation sources
    'congreso_votaciones',  -- Congressional voting records
    'sunat',                -- Tax status verification
    'proposal_evaluation',  -- AI proposal evaluation
    'contraloria',          -- Audit reports from Comptroller
    'mef',                  -- Budget execution from MEF
    'indecopi',             -- Consumer complaints
    'sunafil',              -- Labor violations
    'oefa'                  -- Environmental violations
  ));

-- Comment on constraint update
COMMENT ON CONSTRAINT sync_logs_source_check ON sync_logs IS
  'Valid sync sources including enhanced evaluation data: contraloria, mef, indecopi, sunafil, oefa, etc.';
