-- ============================================
-- Migration 024: Meta Ad Library Spending Data
-- ============================================
-- Stores ad spending from Meta Ad Library Report CSV
-- Source: https://www.facebook.com/ads/library/report/?country=PE

-- 1. PAGE MAPPING TABLE
CREATE TABLE IF NOT EXISTS meta_ad_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id TEXT NOT NULL UNIQUE,
  page_name TEXT NOT NULL,
  candidate_id UUID REFERENCES candidates(id) ON DELETE SET NULL,
  party_id UUID REFERENCES parties(id) ON DELETE SET NULL,
  is_candidate_page BOOLEAN DEFAULT TRUE,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_meta_ad_pages_candidate ON meta_ad_pages(candidate_id) WHERE candidate_id IS NOT NULL;
CREATE INDEX idx_meta_ad_pages_party ON meta_ad_pages(party_id) WHERE party_id IS NOT NULL;

-- 2. AD SPENDING SNAPSHOTS TABLE
CREATE TABLE IF NOT EXISTS meta_ad_spending (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id TEXT NOT NULL REFERENCES meta_ad_pages(page_id) ON DELETE CASCADE,
  disclaimer TEXT,
  amount_spent_lower DECIMAL(12,2) DEFAULT 0,
  amount_spent_upper DECIMAL(12,2) DEFAULT 0,
  amount_spent_mid DECIMAL(12,2) GENERATED ALWAYS AS (
    (amount_spent_lower + amount_spent_upper) / 2
  ) STORED,
  currency TEXT DEFAULT 'PEN',
  number_of_ads INTEGER DEFAULT 0,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  csv_filename TEXT,
  imported_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_page_period UNIQUE (page_id, period_start, period_end, disclaimer)
);

CREATE INDEX idx_meta_ad_spending_page ON meta_ad_spending(page_id);
CREATE INDEX idx_meta_ad_spending_period ON meta_ad_spending(period_start, period_end);
CREATE INDEX idx_meta_ad_spending_amount ON meta_ad_spending(amount_spent_mid DESC);

-- 3. AGGREGATE VIEW: spending per candidate
CREATE OR REPLACE VIEW candidate_meta_ad_summary AS
SELECT
  c.id AS candidate_id,
  c.full_name AS candidate_name,
  c.slug AS candidate_slug,
  p.name AS party_name,
  COUNT(DISTINCT map.page_id)::int AS pages_count,
  COALESCE(SUM(mas.number_of_ads), 0)::int AS total_ads,
  COALESCE(SUM(mas.amount_spent_lower), 0) AS total_spent_lower,
  COALESCE(SUM(mas.amount_spent_upper), 0) AS total_spent_upper,
  COALESCE(SUM(mas.amount_spent_mid), 0) AS total_spent_mid,
  MIN(mas.period_start) AS earliest_period,
  MAX(mas.period_end) AS latest_period,
  array_agg(DISTINCT mas.disclaimer) FILTER (WHERE mas.disclaimer IS NOT NULL) AS disclaimers,
  MAX(mas.imported_at) AS last_updated
FROM candidates c
JOIN meta_ad_pages map ON c.id = map.candidate_id
JOIN meta_ad_spending mas ON map.page_id = mas.page_id
LEFT JOIN parties p ON c.party_id = p.id
GROUP BY c.id, c.full_name, c.slug, p.name;

-- 4. AGGREGATE VIEW: spending per party
CREATE OR REPLACE VIEW party_meta_ad_summary AS
SELECT
  p.id AS party_id,
  p.name AS party_name,
  p.short_name,
  COUNT(DISTINCT map.page_id)::int AS pages_count,
  COALESCE(SUM(mas.number_of_ads), 0)::int AS total_ads,
  COALESCE(SUM(mas.amount_spent_lower), 0) AS total_spent_lower,
  COALESCE(SUM(mas.amount_spent_upper), 0) AS total_spent_upper,
  COALESCE(SUM(mas.amount_spent_mid), 0) AS total_spent_mid,
  MAX(mas.imported_at) AS last_updated
FROM parties p
JOIN meta_ad_pages map ON p.id = map.party_id
JOIN meta_ad_spending mas ON map.page_id = mas.page_id
GROUP BY p.id, p.name, p.short_name;

-- 5. Trigger for updated_at
CREATE OR REPLACE TRIGGER update_meta_ad_pages_updated_at
  BEFORE UPDATE ON meta_ad_pages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE meta_ad_pages IS 'Mapping between Meta Ad Library pages and candidates/parties';
COMMENT ON TABLE meta_ad_spending IS 'Ad spending snapshots from Meta Ad Library Report CSV downloads';
COMMENT ON VIEW candidate_meta_ad_summary IS 'Aggregate Meta ad spending per candidate across all their pages';
COMMENT ON VIEW party_meta_ad_summary IS 'Aggregate Meta ad spending per party across all pages';
