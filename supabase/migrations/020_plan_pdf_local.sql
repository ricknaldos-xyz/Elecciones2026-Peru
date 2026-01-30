-- ============================================
-- Add local PDF path for government plans
-- Previously created ad-hoc via scripts; now formalized
-- ============================================

ALTER TABLE candidates ADD COLUMN IF NOT EXISTS plan_pdf_local TEXT;
