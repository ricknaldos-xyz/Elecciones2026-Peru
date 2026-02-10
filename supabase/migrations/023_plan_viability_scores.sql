-- Migration 023: Add plan viability to scoring system
-- Adds 4th pillar "Plan de Gobierno" for presidential candidates only

-- New columns in scores table
ALTER TABLE scores ADD COLUMN IF NOT EXISTS plan_viability INTEGER
  CHECK (plan_viability BETWEEN 0 AND 100);
ALTER TABLE scores ADD COLUMN IF NOT EXISTS score_balanced_p DECIMAL(5,2);
ALTER TABLE scores ADD COLUMN IF NOT EXISTS score_merit_p DECIMAL(5,2);
ALTER TABLE scores ADD COLUMN IF NOT EXISTS score_integrity_p DECIMAL(5,2);

-- New columns in score_breakdowns table
ALTER TABLE score_breakdowns ADD COLUMN IF NOT EXISTS plan_viability_overall DECIMAL(5,2);
ALTER TABLE score_breakdowns ADD COLUMN IF NOT EXISTS plan_viability_fiscal DECIMAL(5,2);
ALTER TABLE score_breakdowns ADD COLUMN IF NOT EXISTS plan_viability_legal DECIMAL(5,2);
ALTER TABLE score_breakdowns ADD COLUMN IF NOT EXISTS plan_viability_coherence DECIMAL(5,2);
ALTER TABLE score_breakdowns ADD COLUMN IF NOT EXISTS plan_viability_historical DECIMAL(5,2);
