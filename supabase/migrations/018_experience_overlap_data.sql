-- Add experience overlap tracking columns to score_breakdowns
-- This allows the UI to show when experience periods were deduplicated

ALTER TABLE score_breakdowns
ADD COLUMN IF NOT EXISTS experience_raw_years DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS experience_unique_years DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS experience_has_overlap BOOLEAN DEFAULT FALSE;

-- Add comment for documentation
COMMENT ON COLUMN score_breakdowns.experience_raw_years IS 'Total experience years before deduplication (may include overlapping periods)';
COMMENT ON COLUMN score_breakdowns.experience_unique_years IS 'Experience years after merging overlapping periods';
COMMENT ON COLUMN score_breakdowns.experience_has_overlap IS 'True if overlapping experience periods were detected and deduplicated';
