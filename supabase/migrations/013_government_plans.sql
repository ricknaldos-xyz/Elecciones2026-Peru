-- Migration: Government Plans and Proposals
-- Adds support for candidate government plans and extracted proposals

-- Add plan_gobierno_url to candidates table
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS plan_gobierno_url TEXT;

-- Create candidate_proposals table for AI-extracted proposals
CREATE TABLE IF NOT EXISTS candidate_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  source_quote TEXT,
  page_reference TEXT,
  ai_extracted BOOLEAN DEFAULT true,
  extraction_model TEXT, -- e.g., 'claude-3-opus', 'claude-3-sonnet'
  extraction_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_proposals_candidate ON candidate_proposals(candidate_id);
CREATE INDEX IF NOT EXISTS idx_proposals_category ON candidate_proposals(category);
CREATE INDEX IF NOT EXISTS idx_proposals_candidate_category ON candidate_proposals(candidate_id, category);

-- Add constraint for valid categories
ALTER TABLE candidate_proposals ADD CONSTRAINT valid_category CHECK (
  category IN (
    'economia',
    'salud',
    'educacion',
    'seguridad',
    'corrupcion',
    'mineria_ambiente',
    'infraestructura',
    'social',
    'reforma_politica',
    'otros'
  )
);

-- Enable RLS
ALTER TABLE candidate_proposals ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Public read access for proposals" ON candidate_proposals
  FOR SELECT USING (true);

-- Allow authenticated insert/update (for admin operations)
CREATE POLICY "Admin insert proposals" ON candidate_proposals
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin update proposals" ON candidate_proposals
  FOR UPDATE USING (true);

CREATE POLICY "Admin delete proposals" ON candidate_proposals
  FOR DELETE USING (true);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_proposals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_proposals_updated_at
  BEFORE UPDATE ON candidate_proposals
  FOR EACH ROW
  EXECUTE FUNCTION update_proposals_updated_at();

-- Comment on table
COMMENT ON TABLE candidate_proposals IS 'AI-extracted proposals from candidate government plans';
COMMENT ON COLUMN candidate_proposals.category IS 'Proposal category: economia, salud, educacion, seguridad, corrupcion, mineria_ambiente, infraestructura, social, reforma_politica, otros';
COMMENT ON COLUMN candidate_proposals.source_quote IS 'Direct quote from the government plan PDF';
COMMENT ON COLUMN candidate_proposals.page_reference IS 'Page number reference in the original PDF';
