-- ============================================
-- Migration 009: Social Media Monitoring System
-- ============================================
-- Adds infrastructure for monitoring social media platforms
-- (TikTok, Twitter, YouTube) and expanded news sources

-- ============================================
-- 1. SOCIAL MENTIONS TABLE
-- ============================================
-- Stores mentions from social media platforms

CREATE TABLE IF NOT EXISTS social_mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relations
  candidate_id UUID REFERENCES candidates(id) ON DELETE SET NULL,
  party_id UUID REFERENCES parties(id) ON DELETE SET NULL,

  -- Platform info
  platform TEXT NOT NULL CHECK (platform IN ('tiktok', 'twitter', 'youtube', 'facebook', 'instagram')),
  post_id TEXT NOT NULL,

  -- Author info
  author_handle TEXT,
  author_name TEXT,
  author_followers INTEGER,
  author_verified BOOLEAN DEFAULT FALSE,

  -- Content
  content TEXT,
  content_type TEXT CHECK (content_type IN ('video', 'tweet', 'post', 'comment', 'reply', 'retweet')),
  url TEXT,
  media_url TEXT,
  thumbnail_url TEXT,

  -- Engagement metrics
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  engagement_total INTEGER GENERATED ALWAYS AS (like_count + comment_count + share_count) STORED,

  -- Dates
  published_at TIMESTAMP WITH TIME ZONE,
  captured_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Analysis
  sentiment TEXT CHECK (sentiment IN ('positive', 'negative', 'neutral', 'mixed')),
  relevance_score DECIMAL(3,2) DEFAULT 0.00 CHECK (relevance_score >= 0 AND relevance_score <= 1),

  -- AI Analysis
  ai_analyzed BOOLEAN DEFAULT FALSE,
  ai_summary TEXT,
  ai_sentiment TEXT,
  ai_topics TEXT[],
  ai_entities JSONB DEFAULT '{}',
  ai_flags JSONB DEFAULT '[]',
  ai_analyzed_at TIMESTAMP WITH TIME ZONE,

  -- Raw data for debugging
  raw_data JSONB DEFAULT '{}',

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Unique constraint to prevent duplicates
  CONSTRAINT unique_social_mention UNIQUE (platform, post_id)
);

-- ============================================
-- 2. INDEXES FOR SOCIAL MENTIONS
-- ============================================

-- Query by candidate
CREATE INDEX idx_social_mentions_candidate ON social_mentions(candidate_id) WHERE candidate_id IS NOT NULL;

-- Query by party
CREATE INDEX idx_social_mentions_party ON social_mentions(party_id) WHERE party_id IS NOT NULL;

-- Query by platform
CREATE INDEX idx_social_mentions_platform ON social_mentions(platform);

-- Query by date
CREATE INDEX idx_social_mentions_published ON social_mentions(published_at DESC);
CREATE INDEX idx_social_mentions_captured ON social_mentions(captured_at DESC);

-- Query by sentiment
CREATE INDEX idx_social_mentions_sentiment ON social_mentions(sentiment) WHERE sentiment IS NOT NULL;

-- Query by relevance (for AI processing queue)
CREATE INDEX idx_social_mentions_relevance ON social_mentions(relevance_score DESC) WHERE NOT ai_analyzed;

-- Full-text search on content
CREATE INDEX idx_social_mentions_content_search ON social_mentions USING gin(to_tsvector('spanish', coalesce(content, '')));

-- ============================================
-- 3. AI ANALYSIS QUEUE TABLE
-- ============================================
-- Queue for items pending AI analysis

CREATE TABLE IF NOT EXISTS ai_analysis_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Source reference
  source_type TEXT NOT NULL CHECK (source_type IN ('social_mention', 'news_mention')),
  source_id UUID NOT NULL,

  -- Queue management
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'skipped')),
  priority INTEGER DEFAULT 0,
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,

  -- Error tracking
  last_error TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,

  -- Unique constraint
  CONSTRAINT unique_queue_item UNIQUE (source_type, source_id)
);

CREATE INDEX idx_ai_queue_status ON ai_analysis_queue(status, priority DESC, created_at ASC);
CREATE INDEX idx_ai_queue_source ON ai_analysis_queue(source_type, source_id);

-- ============================================
-- 4. CANDIDATE SOCIAL PROFILES TABLE
-- ============================================
-- Stores social media handles for candidates

CREATE TABLE IF NOT EXISTS candidate_social_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,

  -- Social handles
  twitter_handle TEXT,
  tiktok_handle TEXT,
  youtube_channel_id TEXT,
  facebook_page_id TEXT,
  instagram_handle TEXT,

  -- Verification
  twitter_verified BOOLEAN DEFAULT FALSE,
  tiktok_verified BOOLEAN DEFAULT FALSE,
  youtube_verified BOOLEAN DEFAULT FALSE,

  -- Follower counts (for trending)
  twitter_followers INTEGER,
  tiktok_followers INTEGER,
  youtube_subscribers INTEGER,

  -- Last updated
  last_synced_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT unique_candidate_social UNIQUE (candidate_id)
);

CREATE INDEX idx_candidate_social_twitter ON candidate_social_profiles(twitter_handle) WHERE twitter_handle IS NOT NULL;
CREATE INDEX idx_candidate_social_tiktok ON candidate_social_profiles(tiktok_handle) WHERE tiktok_handle IS NOT NULL;
CREATE INDEX idx_candidate_social_youtube ON candidate_social_profiles(youtube_channel_id) WHERE youtube_channel_id IS NOT NULL;

-- ============================================
-- 5. MONITORING HASHTAGS TABLE
-- ============================================
-- Hashtags to monitor across platforms

CREATE TABLE IF NOT EXISTS monitoring_hashtags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  platform TEXT NOT NULL CHECK (platform IN ('tiktok', 'twitter', 'youtube', 'all')),
  hashtag TEXT NOT NULL,

  -- Configuration
  is_active BOOLEAN DEFAULT TRUE,
  priority INTEGER DEFAULT 0,

  -- Stats
  last_checked_at TIMESTAMP WITH TIME ZONE,
  total_mentions INTEGER DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT unique_platform_hashtag UNIQUE (platform, hashtag)
);

-- Insert default hashtags for Peru 2026 elections
INSERT INTO monitoring_hashtags (platform, hashtag, priority) VALUES
  ('all', '#Elecciones2026', 10),
  ('all', '#EleccionesPeru', 10),
  ('all', '#Peru2026', 9),
  ('all', '#VotaPeru', 8),
  ('tiktok', '#PolíticaPeruana', 7),
  ('twitter', '#DebatePresidencial', 8),
  ('youtube', 'elecciones peru 2026', 9),
  ('youtube', 'debate presidencial peru', 8)
ON CONFLICT (platform, hashtag) DO NOTHING;

-- ============================================
-- 6. UPDATE sync_logs SOURCE ENUM
-- ============================================
-- Add new sources to sync_logs

-- First, let's check if we need to update the check constraint
DO $$
BEGIN
  -- Drop existing constraint if exists
  ALTER TABLE sync_logs DROP CONSTRAINT IF EXISTS sync_logs_source_check;

  -- Add new constraint with expanded sources
  ALTER TABLE sync_logs ADD CONSTRAINT sync_logs_source_check
    CHECK (source IN (
      'jne', 'onpe', 'poder_judicial', 'news',
      'youtube', 'google_news', 'tiktok', 'twitter',
      'expanded_rss', 'ai_analysis'
    ));
EXCEPTION
  WHEN others THEN NULL;
END $$;

-- ============================================
-- 7. TRIGGERS
-- ============================================

-- Auto-update updated_at for social_mentions
CREATE OR REPLACE TRIGGER update_social_mentions_updated_at
  BEFORE UPDATE ON social_mentions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-update updated_at for candidate_social_profiles
CREATE OR REPLACE TRIGGER update_candidate_social_profiles_updated_at
  BEFORE UPDATE ON candidate_social_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-queue high relevance items for AI analysis
CREATE OR REPLACE FUNCTION queue_for_ai_analysis()
RETURNS TRIGGER AS $$
BEGIN
  -- Only queue if relevance is above threshold and not already analyzed
  IF NEW.relevance_score >= 0.3 AND NOT NEW.ai_analyzed THEN
    INSERT INTO ai_analysis_queue (source_type, source_id, priority)
    VALUES ('social_mention', NEW.id, FLOOR(NEW.relevance_score * 10)::INTEGER)
    ON CONFLICT (source_type, source_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_queue_social_for_ai
  AFTER INSERT OR UPDATE OF relevance_score ON social_mentions
  FOR EACH ROW
  EXECUTE FUNCTION queue_for_ai_analysis();

-- ============================================
-- 8. VIEWS
-- ============================================

-- Latest social mentions with candidate/party info
CREATE OR REPLACE VIEW social_mentions_enriched AS
SELECT
  sm.*,
  c.full_name as candidate_name,
  c.slug as candidate_slug,
  c.photo_url as candidate_photo,
  p.name as party_name,
  p.abbreviation as party_abbreviation
FROM social_mentions sm
LEFT JOIN candidates c ON sm.candidate_id = c.id
LEFT JOIN parties p ON sm.party_id = p.id
ORDER BY sm.published_at DESC;

-- Social media stats per candidate
CREATE OR REPLACE VIEW candidate_social_stats AS
SELECT
  c.id as candidate_id,
  c.full_name,
  c.slug,
  COUNT(sm.id) as total_mentions,
  COUNT(sm.id) FILTER (WHERE sm.platform = 'twitter') as twitter_mentions,
  COUNT(sm.id) FILTER (WHERE sm.platform = 'tiktok') as tiktok_mentions,
  COUNT(sm.id) FILTER (WHERE sm.platform = 'youtube') as youtube_mentions,
  COUNT(sm.id) FILTER (WHERE sm.sentiment = 'positive') as positive_mentions,
  COUNT(sm.id) FILTER (WHERE sm.sentiment = 'negative') as negative_mentions,
  COUNT(sm.id) FILTER (WHERE sm.sentiment = 'neutral') as neutral_mentions,
  COALESCE(SUM(sm.engagement_total), 0) as total_engagement,
  COALESCE(SUM(sm.view_count), 0) as total_views,
  MAX(sm.published_at) as latest_mention
FROM candidates c
LEFT JOIN social_mentions sm ON c.id = sm.candidate_id
WHERE c.is_active = TRUE
GROUP BY c.id, c.full_name, c.slug;

-- AI analysis queue status
CREATE OR REPLACE VIEW ai_queue_status AS
SELECT
  source_type,
  status,
  COUNT(*) as count,
  AVG(attempts) as avg_attempts
FROM ai_analysis_queue
GROUP BY source_type, status;

-- ============================================
-- 9. HELPER FUNCTIONS
-- ============================================

-- Function to get or create social profile for candidate
CREATE OR REPLACE FUNCTION get_or_create_social_profile(p_candidate_id UUID)
RETURNS UUID AS $$
DECLARE
  v_profile_id UUID;
BEGIN
  SELECT id INTO v_profile_id FROM candidate_social_profiles WHERE candidate_id = p_candidate_id;

  IF v_profile_id IS NULL THEN
    INSERT INTO candidate_social_profiles (candidate_id)
    VALUES (p_candidate_id)
    RETURNING id INTO v_profile_id;
  END IF;

  RETURN v_profile_id;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate relevance score based on engagement
CREATE OR REPLACE FUNCTION calculate_social_relevance(
  p_view_count INTEGER,
  p_engagement INTEGER,
  p_author_followers INTEGER,
  p_has_candidate_match BOOLEAN
)
RETURNS DECIMAL(3,2) AS $$
DECLARE
  v_score DECIMAL(3,2) := 0.0;
BEGIN
  -- Base score if candidate mentioned
  IF p_has_candidate_match THEN
    v_score := 0.3;
  END IF;

  -- Add points for views (log scale)
  IF p_view_count > 0 THEN
    v_score := v_score + LEAST(0.2, LOG(p_view_count) / 20);
  END IF;

  -- Add points for engagement
  IF p_engagement > 0 THEN
    v_score := v_score + LEAST(0.2, LOG(p_engagement) / 15);
  END IF;

  -- Add points for author influence
  IF p_author_followers > 0 THEN
    v_score := v_score + LEAST(0.2, LOG(p_author_followers) / 25);
  END IF;

  -- Cap at 1.0
  RETURN LEAST(1.0, v_score);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 10. CLEANUP OLD DATA (optional cron)
-- ============================================

-- Function to clean old social mentions (keep last 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_social_mentions()
RETURNS INTEGER AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM social_mentions
  WHERE captured_at < NOW() - INTERVAL '90 days'
  AND relevance_score < 0.5;

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$ LANGUAGE plpgsql;

-- Function to clean completed AI queue items
CREATE OR REPLACE FUNCTION cleanup_ai_queue()
RETURNS INTEGER AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM ai_analysis_queue
  WHERE status IN ('completed', 'skipped')
  AND completed_at < NOW() - INTERVAL '7 days';

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
