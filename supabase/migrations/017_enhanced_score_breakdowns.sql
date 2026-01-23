-- Migration: Enhanced Score Breakdowns
-- Adds new penalty columns for company issues, voting record, tax status, etc.

-- Add new integrity penalty columns to score_breakdowns
ALTER TABLE score_breakdowns
ADD COLUMN IF NOT EXISTS company_penalty DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS voting_penalty DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS voting_bonus DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS tax_penalty DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS omission_penalty DECIMAL(5,2) DEFAULT 0;

-- Add consolidated columns for education and leadership
ALTER TABLE score_breakdowns
ADD COLUMN IF NOT EXISTS education_points DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS leadership_points DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS leadership_seniority DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS leadership_stability DECIMAL(5,2) DEFAULT 0;

-- Add comments for the new columns
COMMENT ON COLUMN score_breakdowns.company_penalty IS 'Penalty from company legal issues (INDECOPI, SUNAFIL, OEFA)';
COMMENT ON COLUMN score_breakdowns.voting_penalty IS 'Penalty from voting for pro-crime laws in Congress';
COMMENT ON COLUMN score_breakdowns.voting_bonus IS 'Bonus from voting against pro-crime laws in Congress';
COMMENT ON COLUMN score_breakdowns.tax_penalty IS 'Penalty from SUNAT tax irregularities (NO HABIDO, debts)';
COMMENT ON COLUMN score_breakdowns.omission_penalty IS 'Penalty from undeclared judicial cases';
