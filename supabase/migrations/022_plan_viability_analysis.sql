-- ============================================
-- Plan Viability Analysis
-- Holistic AI analysis of presidential government plans
-- ============================================

CREATE TABLE IF NOT EXISTS plan_viability_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,

  -- Macro-Economic Viability (1-10)
  fiscal_viability_score INTEGER CHECK (fiscal_viability_score BETWEEN 1 AND 10),
  fiscal_viability_analysis TEXT,
  fiscal_viability_details JSONB DEFAULT '{}',

  -- Institutional & Legal Viability (1-10)
  legal_viability_score INTEGER CHECK (legal_viability_score BETWEEN 1 AND 10),
  legal_viability_analysis TEXT,
  legal_viability_details JSONB DEFAULT '{}',

  -- Coherence Analysis (1-10)
  coherence_score INTEGER CHECK (coherence_score BETWEEN 1 AND 10),
  coherence_analysis TEXT,
  coherence_details JSONB DEFAULT '{}',

  -- Historical Comparison (1-10)
  historical_score INTEGER CHECK (historical_score BETWEEN 1 AND 10),
  historical_analysis TEXT,
  historical_details JSONB DEFAULT '{}',

  -- Overall Score (calculated average)
  overall_viability_score DECIMAL(3,1) GENERATED ALWAYS AS (
    (COALESCE(fiscal_viability_score, 0) + COALESCE(legal_viability_score, 0) +
     COALESCE(coherence_score, 0) + COALESCE(historical_score, 0)) / 4.0
  ) STORED,

  -- Executive Summary
  executive_summary TEXT,
  key_strengths TEXT[] DEFAULT '{}',
  key_weaknesses TEXT[] DEFAULT '{}',
  key_risks TEXT[] DEFAULT '{}',

  -- Metadata
  analysis_model TEXT,
  analysis_version TEXT DEFAULT '1.0',
  proposals_analyzed INTEGER DEFAULT 0,
  analyzed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(candidate_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_plan_viability_candidate ON plan_viability_analysis(candidate_id);
CREATE INDEX IF NOT EXISTS idx_plan_viability_score ON plan_viability_analysis(overall_viability_score DESC);

-- Row Level Security
ALTER TABLE plan_viability_analysis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read plan viability" ON plan_viability_analysis FOR SELECT USING (true);
CREATE POLICY "Admin insert plan viability" ON plan_viability_analysis FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin update plan viability" ON plan_viability_analysis FOR UPDATE USING (true);
CREATE POLICY "Admin delete plan viability" ON plan_viability_analysis FOR DELETE USING (true);

-- Updated_at trigger
CREATE TRIGGER trigger_plan_viability_updated_at
  BEFORE UPDATE ON plan_viability_analysis
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
