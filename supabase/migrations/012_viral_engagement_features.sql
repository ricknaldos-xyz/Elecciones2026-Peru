-- Migration: 012_viral_engagement_features.sql
-- Features virales y de engagement para Ranking Electoral Peru 2026

-- ============================================
-- 1. USERS AND AUTH
-- ============================================

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  google_id TEXT UNIQUE,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  district_id UUID REFERENCES districts(id),
  points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  streak_days INTEGER DEFAULT 0,
  last_visit_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ,
  is_verified BOOLEAN DEFAULT false,
  is_admin BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  user_agent TEXT,
  ip_address TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. QUIZ SYSTEM
-- ============================================

CREATE TABLE IF NOT EXISTS candidate_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  position INTEGER NOT NULL CHECK (position BETWEEN 1 AND 5),
  source_url TEXT,
  source_quote TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(candidate_id, topic)
);

-- Temas del quiz
COMMENT ON TABLE candidate_positions IS 'Posiciones de candidatos en temas clave (1=izquierda/no, 5=derecha/si)';

CREATE TABLE IF NOT EXISTS quiz_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES users(id),
  answers JSONB NOT NULL, -- {topic: position}
  top_matches JSONB NOT NULL, -- [{candidate_id, match_percentage, candidate_name}]
  completion_time_seconds INTEGER,
  shared BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. DAILY FACTS
-- ============================================

CREATE TABLE IF NOT EXISTS daily_facts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE UNIQUE NOT NULL,
  fact_text TEXT NOT NULL,
  fact_type TEXT NOT NULL CHECK (fact_type IN ('candidate', 'party', 'statistic', 'history', 'comparison')),
  related_candidate_id UUID REFERENCES candidates(id),
  related_party_id UUID REFERENCES parties(id),
  source_url TEXT,
  views INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. FAVORITES AND ALERTS
-- ============================================

CREATE TABLE IF NOT EXISTS user_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
  alert_enabled BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, candidate_id)
);

CREATE TABLE IF NOT EXISTS user_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  candidate_id UUID REFERENCES candidates(id),
  alert_type TEXT NOT NULL CHECK (alert_type IN ('flag_added', 'score_changed', 'news_mention', 'position_changed')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_url TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. GAMIFICATION
-- ============================================

CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  badge_key TEXT NOT NULL,
  badge_name TEXT NOT NULL,
  badge_icon TEXT NOT NULL,
  points_awarded INTEGER NOT NULL,
  awarded_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_key)
);

CREATE TABLE IF NOT EXISTS user_points_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  reason TEXT NOT NULL,
  reference_type TEXT, -- 'quiz', 'share', 'visit', 'favorite', 'comment'
  reference_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leaderboard (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  total_points INTEGER DEFAULT 0,
  weekly_points INTEGER DEFAULT 0,
  monthly_points INTEGER DEFAULT 0,
  quizzes_completed INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  favorites_count INTEGER DEFAULT 0,
  rank_all_time INTEGER,
  rank_weekly INTEGER,
  rank_monthly INTEGER,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. PREDICTIONS
-- ============================================

CREATE TABLE IF NOT EXISTS predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  prediction_type TEXT NOT NULL CHECK (prediction_type IN ('president_winner', 'first_round_top3', 'first_round_top5', 'second_round', 'party_seats')),
  predictions JSONB NOT NULL, -- Array de candidatos con % predicho
  points_earned INTEGER DEFAULT 0,
  accuracy_score DECIMAL(5,2),
  is_resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- ============================================
-- 7. COMMENTS
-- ============================================

CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (length(content) <= 500),
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  is_hidden BOOLEAN DEFAULT false,
  hidden_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS comment_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('up', 'down')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, comment_id)
);

-- ============================================
-- 8. ANALYTICS & TRACKING
-- ============================================

CREATE TABLE IF NOT EXISTS page_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES users(id),
  page_type TEXT NOT NULL, -- 'home', 'candidate', 'ranking', 'quiz', 'compare'
  page_slug TEXT,
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS share_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES users(id),
  share_type TEXT NOT NULL, -- 'candidate', 'quiz_result', 'comparison', 'ranking'
  share_platform TEXT NOT NULL, -- 'whatsapp', 'twitter', 'facebook', 'copy', 'native'
  content_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);

CREATE INDEX IF NOT EXISTS idx_candidate_positions_candidate ON candidate_positions(candidate_id);
CREATE INDEX IF NOT EXISTS idx_candidate_positions_topic ON candidate_positions(topic);
CREATE INDEX IF NOT EXISTS idx_quiz_responses_session ON quiz_responses(session_id);
CREATE INDEX IF NOT EXISTS idx_quiz_responses_user ON quiz_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_responses_created ON quiz_responses(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_daily_facts_date ON daily_facts(date);
CREATE INDEX IF NOT EXISTS idx_user_favorites_user ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_candidate ON user_favorites(candidate_id);
CREATE INDEX IF NOT EXISTS idx_user_alerts_user_unread ON user_alerts(user_id) WHERE is_read = false;

CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_points_log_user ON user_points_log(user_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_total ON leaderboard(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_weekly ON leaderboard(weekly_points DESC);

CREATE INDEX IF NOT EXISTS idx_comments_candidate ON comments(candidate_id) WHERE is_hidden = false;
CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id);

CREATE INDEX IF NOT EXISTS idx_page_views_session ON page_views(session_id);
CREATE INDEX IF NOT EXISTS idx_page_views_created ON page_views(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_share_events_created ON share_events(created_at DESC);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Función para actualizar puntos del usuario
CREATE OR REPLACE FUNCTION update_user_points()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users
  SET points = points + NEW.points
  WHERE id = NEW.user_id;

  -- Actualizar leaderboard
  INSERT INTO leaderboard (user_id, total_points, weekly_points, monthly_points)
  VALUES (NEW.user_id, NEW.points, NEW.points, NEW.points)
  ON CONFLICT (user_id) DO UPDATE
  SET
    total_points = leaderboard.total_points + NEW.points,
    weekly_points = leaderboard.weekly_points + NEW.points,
    monthly_points = leaderboard.monthly_points + NEW.points,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar puntos
DROP TRIGGER IF EXISTS trigger_update_user_points ON user_points_log;
CREATE TRIGGER trigger_update_user_points
  AFTER INSERT ON user_points_log
  FOR EACH ROW
  EXECUTE FUNCTION update_user_points();

-- Función para actualizar nivel del usuario
CREATE OR REPLACE FUNCTION update_user_level()
RETURNS TRIGGER AS $$
DECLARE
  new_level INTEGER;
BEGIN
  -- Calcular nivel basado en puntos (cada 100 puntos = 1 nivel, max 50)
  new_level := LEAST(50, GREATEST(1, NEW.points / 100 + 1));

  IF new_level != OLD.level THEN
    NEW.level := new_level;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar nivel
DROP TRIGGER IF EXISTS trigger_update_user_level ON users;
CREATE TRIGGER trigger_update_user_level
  BEFORE UPDATE OF points ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_user_level();

-- ============================================
-- SEED DATA: Daily Facts para los próximos días
-- ============================================

INSERT INTO daily_facts (date, fact_text, fact_type) VALUES
  (CURRENT_DATE, 'El Perú elegirá 200 representantes: 1 Presidente, 60 Senadores, 130 Diputados y 7 al Parlamento Andino.', 'statistic'),
  (CURRENT_DATE + 1, '36 candidatos presidenciales compiten por llegar a Palacio de Gobierno.', 'statistic'),
  (CURRENT_DATE + 2, 'El distrito de Lima elige más diputados: 35 de los 130 totales.', 'statistic'),
  (CURRENT_DATE + 3, 'Esta es la primera elección con Senado desde 1992, cuando Fujimori lo cerró.', 'history'),
  (CURRENT_DATE + 4, 'El candidato con mayor experiencia política tiene más de 40 años en cargos públicos.', 'candidate'),
  (CURRENT_DATE + 5, '8 candidatos presidenciales tienen sentencias o procesos judiciales pendientes.', 'statistic'),
  (CURRENT_DATE + 6, 'Los peruanos en el extranjero también eligen: 2 diputados los representan.', 'statistic')
ON CONFLICT (date) DO NOTHING;
