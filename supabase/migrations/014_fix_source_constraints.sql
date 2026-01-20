-- Migration: Fix source constraints for sync_logs and news_mentions
-- Allows new data sources added to the application

-- 1. Drop and recreate sync_logs source constraint with all supported sources
ALTER TABLE sync_logs DROP CONSTRAINT IF EXISTS sync_logs_source_check;
ALTER TABLE sync_logs ADD CONSTRAINT sync_logs_source_check
  CHECK (source IN (
    'jne', 'onpe', 'poder_judicial', 'news',
    'youtube', 'google_news', 'tiktok', 'twitter',
    'expanded_rss', 'ai_analysis', 'government_plans',
    'jne_enrich', 'congress', 'judicial', 'plans'
  ));

-- 2. Remove news_mentions source constraint entirely
-- Sources are too dynamic (Google News adds many different source names)
ALTER TABLE news_mentions DROP CONSTRAINT IF EXISTS news_mentions_source_check;
-- No new constraint - allow any source
