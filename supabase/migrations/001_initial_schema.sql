-- ============================================
-- RANKING ELECTORAL PERU 2026 - DATABASE SCHEMA
-- Compatible with Neon (PostgreSQL)
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PARTIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS parties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  short_name TEXT,
  logo_url TEXT,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- DISTRICTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS districts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('departamento', 'lima_provincia', 'callao', 'extranjero')),
  senators_count INT DEFAULT 1,
  deputies_count INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CANDIDATES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS candidates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  photo_url TEXT,
  cargo TEXT NOT NULL CHECK (cargo IN ('presidente', 'vicepresidente', 'senador', 'diputado', 'parlamento_andino')),
  party_id UUID REFERENCES parties(id) ON DELETE SET NULL,
  district_id UUID REFERENCES districts(id) ON DELETE SET NULL,

  -- Datos personales
  birth_date DATE,
  dni TEXT,

  -- Educación (JSONB array)
  education_level TEXT,
  education_details JSONB DEFAULT '[]'::jsonb,

  -- Experiencia (JSONB array)
  experience_details JSONB DEFAULT '[]'::jsonb,

  -- Trayectoria política (JSONB array)
  political_trajectory JSONB DEFAULT '[]'::jsonb,

  -- Patrimonio
  assets_declaration JSONB,

  -- Sentencias y renuncias
  penal_sentences JSONB DEFAULT '[]'::jsonb,
  civil_sentences JSONB DEFAULT '[]'::jsonb,
  party_resignations INT DEFAULT 0,

  -- Metadata
  djhv_url TEXT,
  jne_id TEXT,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SCORES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,

  -- Sub-scores (0-100)
  competence DECIMAL(5,2) NOT NULL CHECK (competence >= 0 AND competence <= 100),
  integrity DECIMAL(5,2) NOT NULL CHECK (integrity >= 0 AND integrity <= 100),
  transparency DECIMAL(5,2) NOT NULL CHECK (transparency >= 0 AND transparency <= 100),
  confidence DECIMAL(5,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 100),

  -- Pre-calculated scores by preset
  score_balanced DECIMAL(5,2) NOT NULL,
  score_merit DECIMAL(5,2) NOT NULL,
  score_integrity DECIMAL(5,2) NOT NULL,

  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(candidate_id)
);

-- ============================================
-- SCORE BREAKDOWNS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS score_breakdowns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,

  -- Competence breakdown (total = 100)
  education_level_points DECIMAL(5,2) DEFAULT 0,
  education_depth_points DECIMAL(5,2) DEFAULT 0,
  experience_total_points DECIMAL(5,2) DEFAULT 0,
  experience_relevant_points DECIMAL(5,2) DEFAULT 0,
  leadership_seniority_points DECIMAL(5,2) DEFAULT 0,
  leadership_stability_points DECIMAL(5,2) DEFAULT 0,

  -- Integrity breakdown (starts at 100, deducts)
  integrity_base DECIMAL(5,2) DEFAULT 100,
  penal_penalty DECIMAL(5,2) DEFAULT 0,
  civil_penalties JSONB DEFAULT '[]'::jsonb,
  resignation_penalty DECIMAL(5,2) DEFAULT 0,

  -- Transparency breakdown
  completeness_points DECIMAL(5,2) DEFAULT 0,
  consistency_points DECIMAL(5,2) DEFAULT 0,
  assets_quality_points DECIMAL(5,2) DEFAULT 0,

  -- Confidence breakdown
  verification_points DECIMAL(5,2) DEFAULT 0,
  coverage_points DECIMAL(5,2) DEFAULT 0,

  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(candidate_id)
);

-- ============================================
-- FLAGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS flags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'PENAL_SENTENCE',
    'CIVIL_SENTENCE',
    'VIOLENCE',
    'ALIMENTOS',
    'LABORAL',
    'CONTRACTUAL',
    'MULTIPLE_RESIGNATIONS',
    'INCONSISTENCY',
    'OTHER'
  )),
  severity TEXT NOT NULL CHECK (severity IN ('RED', 'AMBER', 'GRAY')),
  title TEXT NOT NULL,
  description TEXT,
  source TEXT NOT NULL,
  evidence_url TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  date_captured TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Candidates indexes
CREATE INDEX IF NOT EXISTS idx_candidates_cargo ON candidates(cargo);
CREATE INDEX IF NOT EXISTS idx_candidates_party ON candidates(party_id);
CREATE INDEX IF NOT EXISTS idx_candidates_district ON candidates(district_id);
CREATE INDEX IF NOT EXISTS idx_candidates_active ON candidates(is_active);
CREATE INDEX IF NOT EXISTS idx_candidates_slug ON candidates(slug);

-- Scores indexes (for ranking queries)
CREATE INDEX IF NOT EXISTS idx_scores_balanced ON scores(score_balanced DESC);
CREATE INDEX IF NOT EXISTS idx_scores_merit ON scores(score_merit DESC);
CREATE INDEX IF NOT EXISTS idx_scores_integrity ON scores(score_integrity DESC);
CREATE INDEX IF NOT EXISTS idx_scores_confidence ON scores(confidence DESC);

-- Flags indexes
CREATE INDEX IF NOT EXISTS idx_flags_candidate ON flags(candidate_id);
CREATE INDEX IF NOT EXISTS idx_flags_severity ON flags(severity);
CREATE INDEX IF NOT EXISTS idx_flags_type ON flags(type);

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_candidates_updated_at ON candidates;
CREATE TRIGGER update_candidates_updated_at
  BEFORE UPDATE ON candidates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_scores_updated_at ON scores;
CREATE TRIGGER update_scores_updated_at
  BEFORE UPDATE ON scores
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_score_breakdowns_updated_at ON score_breakdowns;
CREATE TRIGGER update_score_breakdowns_updated_at
  BEFORE UPDATE ON score_breakdowns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_parties_updated_at ON parties;
CREATE TRIGGER update_parties_updated_at
  BEFORE UPDATE ON parties
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
