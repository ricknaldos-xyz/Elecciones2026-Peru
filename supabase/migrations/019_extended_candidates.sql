-- ============================================
-- Extended candidate fields for full JNE scraping
-- ============================================

ALTER TABLE candidates ADD COLUMN IF NOT EXISTS list_position INT;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS jne_org_id INT;

CREATE INDEX IF NOT EXISTS idx_candidates_jne_org_id ON candidates(jne_org_id);
CREATE INDEX IF NOT EXISTS idx_candidates_dni ON candidates(dni);
