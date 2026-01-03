-- ============================================
-- Migration 010: Congressional Candidates Indexes
-- ============================================
-- Additional indexes for efficient queries on congressional candidates

-- Index for filtering by cargo and district (senadores/diputados por distrito)
CREATE INDEX IF NOT EXISTS idx_candidates_cargo_district
  ON candidates(cargo, district_id)
  WHERE is_active = true;

-- Index for filtering by party and cargo
CREATE INDEX IF NOT EXISTS idx_candidates_party_cargo
  ON candidates(party_id, cargo)
  WHERE is_active = true;

-- Index for list position within party/district
CREATE INDEX IF NOT EXISTS idx_candidates_list_order
  ON candidates(party_id, district_id, cargo)
  WHERE is_active = true;

-- Partial index for each cargo type (faster queries per type)
CREATE INDEX IF NOT EXISTS idx_candidates_senadores
  ON candidates(district_id, party_id)
  WHERE cargo = 'senador' AND is_active = true;

CREATE INDEX IF NOT EXISTS idx_candidates_diputados
  ON candidates(district_id, party_id)
  WHERE cargo = 'diputado' AND is_active = true;

CREATE INDEX IF NOT EXISTS idx_candidates_parlamento_andino
  ON candidates(party_id)
  WHERE cargo = 'parlamento_andino' AND is_active = true;

-- View for congressional candidates summary
CREATE OR REPLACE VIEW congressional_candidates_summary AS
SELECT
  c.cargo,
  d.name as district_name,
  d.slug as district_slug,
  p.name as party_name,
  p.short_name as party_short_name,
  COUNT(*) as candidate_count
FROM candidates c
LEFT JOIN districts d ON c.district_id = d.id
LEFT JOIN parties p ON c.party_id = p.id
WHERE c.is_active = true
AND c.cargo IN ('senador', 'diputado', 'parlamento_andino')
GROUP BY c.cargo, d.name, d.slug, p.name, p.short_name
ORDER BY c.cargo, d.name, p.name;

-- View for candidates by district
CREATE OR REPLACE VIEW candidates_by_district AS
SELECT
  d.name as district_name,
  d.slug as district_slug,
  d.type as district_type,
  d.senators_count,
  d.deputies_count,
  COUNT(*) FILTER (WHERE c.cargo = 'senador') as actual_senators,
  COUNT(*) FILTER (WHERE c.cargo = 'diputado') as actual_deputies
FROM districts d
LEFT JOIN candidates c ON d.id = c.district_id AND c.is_active = true
GROUP BY d.id, d.name, d.slug, d.type, d.senators_count, d.deputies_count
ORDER BY d.name;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
