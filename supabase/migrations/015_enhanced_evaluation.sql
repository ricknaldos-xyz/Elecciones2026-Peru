-- ============================================
-- ENHANCED CANDIDATE EVALUATION TABLES
-- Migration 015: Congressional votes, tax status, company records, performance
-- ============================================

-- 1. CONGRESSIONAL VOTES
-- Tracks how congresspeople voted on specific laws
CREATE TABLE IF NOT EXISTS congressional_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL,                    -- Proyecto de Ley number (e.g., "PL-1234")
  project_title TEXT NOT NULL,
  project_summary TEXT,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('favor', 'contra', 'abstencion', 'ausente', 'licencia')),
  session_date DATE NOT NULL,
  session_number TEXT,                         -- Session identifier
  is_pro_crime BOOLEAN DEFAULT FALSE,          -- Marked if law benefits criminals
  is_anti_democratic BOOLEAN DEFAULT FALSE,    -- Marked if law weakens democracy
  is_pro_corruption BOOLEAN DEFAULT FALSE,     -- Marked if law enables corruption
  category TEXT,                               -- economia, seguridad, justicia, etc.
  source_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(candidate_id, project_id)
);

-- 2. PRO-CRIME LAWS REGISTRY
-- Curated list of laws that are considered harmful
CREATE TABLE IF NOT EXISTS controversial_laws (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN (
    'pro_crimen',           -- Weakens criminal penalties
    'anti_colaboracion',    -- Weakens witness protection
    'pro_impunidad',        -- Enables prescription/impunity
    'anti_fiscalia',        -- Weakens prosecution
    'anti_prensa',          -- Restricts press freedom
    'pro_evasion',          -- Enables tax evasion
    'anti_transparencia',   -- Reduces transparency
    'clientelismo'          -- Enables political clientelism
  )),
  penalty_points INTEGER DEFAULT 30,           -- Points to deduct if voted favor
  bonus_points INTEGER DEFAULT 5,              -- Points to add if voted contra
  approval_date DATE,
  is_approved BOOLEAN DEFAULT FALSE,
  source_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CONGRESSIONAL ATTENDANCE
-- Tracks session attendance
CREATE TABLE IF NOT EXISTS congressional_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  period TEXT NOT NULL,                        -- e.g., "2021-2026"
  total_sessions INTEGER DEFAULT 0,
  attended_sessions INTEGER DEFAULT 0,
  justified_absences INTEGER DEFAULT 0,
  unjustified_absences INTEGER DEFAULT 0,
  attendance_pct DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE WHEN total_sessions > 0
    THEN (attended_sessions::DECIMAL / total_sessions * 100)
    ELSE 0 END
  ) STORED,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(candidate_id, period)
);

-- 4. CANDIDATE TAX STATUS (SUNAT)
CREATE TABLE IF NOT EXISTS candidate_tax_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  ruc TEXT,
  ruc_type TEXT CHECK (ruc_type IN ('persona_natural', 'empresa')),
  status TEXT CHECK (status IN ('activo', 'suspendido', 'baja_definitiva', 'baja_provisional')),
  condition TEXT CHECK (condition IN ('habido', 'no_habido', 'pendiente', 'no_hallado')),
  has_coactive_debts BOOLEAN DEFAULT FALSE,
  coactive_debt_count INTEGER DEFAULT 0,
  activity_description TEXT,
  last_checked TIMESTAMPTZ DEFAULT NOW(),
  source_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(candidate_id, ruc)
);

-- 5. CANDIDATE COMPANIES
-- Links candidates to companies they own/direct
CREATE TABLE IF NOT EXISTS candidate_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  company_ruc TEXT NOT NULL,
  company_name TEXT NOT NULL,
  role TEXT CHECK (role IN ('accionista', 'director', 'gerente_general', 'representante_legal', 'fundador')),
  ownership_pct DECIMAL(5,2),                  -- Percentage of ownership if known
  is_active BOOLEAN DEFAULT TRUE,
  start_date DATE,
  end_date DATE,
  source TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(candidate_id, company_ruc, role)
);

-- 6. COMPANY LEGAL ISSUES
-- Tracks legal problems of candidate-linked companies
CREATE TABLE IF NOT EXISTS company_legal_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES candidate_companies(id) ON DELETE CASCADE,
  issue_type TEXT CHECK (issue_type IN (
    'penal',                -- Criminal case
    'civil',                -- Civil lawsuit
    'laboral',              -- Labor dispute (SUNAFIL)
    'tributario',           -- Tax issue (SUNAT)
    'ambiental',            -- Environmental (OEFA)
    'consumidor',           -- Consumer complaint (INDECOPI)
    'administrativo'        -- Administrative sanction
  )),
  description TEXT NOT NULL,
  case_number TEXT,
  institution TEXT,                            -- SUNAFIL, OEFA, INDECOPI, etc.
  status TEXT CHECK (status IN ('en_proceso', 'resuelto', 'archivado', 'apelacion')),
  resolution TEXT,                             -- Favorable, desfavorable, multado
  fine_amount DECIMAL(12,2),
  issue_date DATE,
  resolution_date DATE,
  source_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. INCUMBENT PERFORMANCE
-- Tracks performance of candidates currently in office
CREATE TABLE IF NOT EXISTS incumbent_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  cargo_actual TEXT NOT NULL,                  -- alcalde, gobernador, congresista
  entidad TEXT NOT NULL,                       -- Municipalidad de Lima, Gobierno Regional, etc.
  period TEXT NOT NULL,                        -- 2023-2026

  -- Budget execution (from MEF)
  budget_allocated DECIMAL(15,2),
  budget_executed DECIMAL(15,2),
  budget_execution_pct DECIMAL(5,2),

  -- Audit issues (from Contraloria)
  contraloria_reports INTEGER DEFAULT 0,
  contraloria_findings INTEGER DEFAULT 0,
  contraloria_recommendations INTEGER DEFAULT 0,
  has_criminal_referral BOOLEAN DEFAULT FALSE,

  -- Works and projects
  total_works_promised INTEGER DEFAULT 0,
  works_completed INTEGER DEFAULT 0,
  works_in_progress INTEGER DEFAULT 0,
  works_paralyzed INTEGER DEFAULT 0,

  -- Calculated performance score
  performance_score DECIMAL(5,2),

  -- Metadata
  data_sources JSONB DEFAULT '[]',
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,

  UNIQUE(candidate_id, cargo_actual, period)
);

-- 8. PROPOSAL EVALUATIONS
-- AI-scored evaluation of each proposal
CREATE TABLE IF NOT EXISTS proposal_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES candidate_proposals(id) ON DELETE CASCADE,

  -- Individual scores (1-10)
  specificity_score INTEGER CHECK (specificity_score BETWEEN 1 AND 10),
  viability_score INTEGER CHECK (viability_score BETWEEN 1 AND 10),
  impact_score INTEGER CHECK (impact_score BETWEEN 1 AND 10),
  evidence_score INTEGER CHECK (evidence_score BETWEEN 1 AND 10),

  -- Calculated overall
  overall_score DECIMAL(3,1) GENERATED ALWAYS AS (
    (COALESCE(specificity_score, 0) + COALESCE(viability_score, 0) +
     COALESCE(impact_score, 0) + COALESCE(evidence_score, 0)) / 4.0
  ) STORED,

  -- AI analysis
  ai_evaluation TEXT,                          -- Detailed AI commentary
  ai_concerns TEXT[],                          -- Array of concerns identified
  ai_strengths TEXT[],                         -- Array of strengths identified

  -- Metadata
  evaluation_model TEXT,                       -- claude-3-5-sonnet, etc.
  evaluated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(proposal_id)
);

-- 9. JUDICIAL VERIFICATION
-- Cross-reference between JNE declarations and actual PJ records
CREATE TABLE IF NOT EXISTS judicial_verification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,

  -- Declared in JNE
  declared_penal_count INTEGER DEFAULT 0,
  declared_civil_count INTEGER DEFAULT 0,

  -- Found in Poder Judicial
  found_penal_count INTEGER DEFAULT 0,
  found_civil_count INTEGER DEFAULT 0,
  found_cases JSONB DEFAULT '[]',             -- [{case_number, type, status, court, description}]

  -- Discrepancies
  has_discrepancy BOOLEAN DEFAULT FALSE,
  undeclared_cases JSONB DEFAULT '[]',        -- Cases found but not declared
  discrepancy_severity TEXT CHECK (discrepancy_severity IN ('none', 'minor', 'major', 'critical')),

  -- Metadata
  last_verified TIMESTAMPTZ DEFAULT NOW(),
  verification_source TEXT DEFAULT 'cej.pj.gob.pe',
  notes TEXT
);

-- 10. JUDICIAL DISCREPANCIES (detailed tracking)
-- Records detailed discrepancy information for penalty calculation
CREATE TABLE IF NOT EXISTS judicial_discrepancies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE UNIQUE,

  -- Records comparison
  found_records JSONB DEFAULT '[]',           -- Records found in Poder Judicial
  declared_records JSONB DEFAULT '[]',        -- Records declared in JNE

  -- Discrepancy details
  undeclared_count INTEGER DEFAULT 0,
  severity TEXT CHECK (severity IN ('none', 'minor', 'major', 'critical')) DEFAULT 'none',
  details JSONB DEFAULT '[]',                 -- Array of discrepancy descriptions

  -- Metadata
  checked_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add discrepancy tracking columns to candidates table
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS has_judicial_discrepancy BOOLEAN DEFAULT FALSE;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS judicial_discrepancy_severity TEXT DEFAULT 'none';
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS undeclared_cases_count INTEGER DEFAULT 0;

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_congressional_votes_candidate ON congressional_votes(candidate_id);
CREATE INDEX IF NOT EXISTS idx_congressional_votes_project ON congressional_votes(project_id);
CREATE INDEX IF NOT EXISTS idx_congressional_votes_session ON congressional_votes(session_date);
CREATE INDEX IF NOT EXISTS idx_congressional_votes_pro_crime ON congressional_votes(is_pro_crime) WHERE is_pro_crime = TRUE;

CREATE INDEX IF NOT EXISTS idx_candidate_tax_status_candidate ON candidate_tax_status(candidate_id);
CREATE INDEX IF NOT EXISTS idx_candidate_tax_status_condition ON candidate_tax_status(condition);

CREATE INDEX IF NOT EXISTS idx_candidate_companies_candidate ON candidate_companies(candidate_id);
CREATE INDEX IF NOT EXISTS idx_candidate_companies_ruc ON candidate_companies(company_ruc);

CREATE INDEX IF NOT EXISTS idx_company_legal_issues_company ON company_legal_issues(company_id);
CREATE INDEX IF NOT EXISTS idx_company_legal_issues_type ON company_legal_issues(issue_type);

CREATE INDEX IF NOT EXISTS idx_incumbent_performance_candidate ON incumbent_performance(candidate_id);

CREATE INDEX IF NOT EXISTS idx_proposal_evaluations_proposal ON proposal_evaluations(proposal_id);
CREATE INDEX IF NOT EXISTS idx_proposal_evaluations_score ON proposal_evaluations(overall_score DESC);

CREATE INDEX IF NOT EXISTS idx_judicial_verification_candidate ON judicial_verification(candidate_id);
CREATE INDEX IF NOT EXISTS idx_judicial_verification_discrepancy ON judicial_verification(has_discrepancy) WHERE has_discrepancy = TRUE;

CREATE INDEX IF NOT EXISTS idx_judicial_discrepancies_candidate ON judicial_discrepancies(candidate_id);
CREATE INDEX IF NOT EXISTS idx_judicial_discrepancies_severity ON judicial_discrepancies(severity) WHERE severity != 'none';

CREATE INDEX IF NOT EXISTS idx_candidates_judicial_discrepancy ON candidates(has_judicial_discrepancy) WHERE has_judicial_discrepancy = TRUE;

-- ============================================
-- INSERT SOME KNOWN PRO-CRIME LAWS
-- ============================================

INSERT INTO controversial_laws (project_id, title, category, penalty_points, bonus_points, description) VALUES
-- Weakening of collaboration efficacy
('PL-6951', 'Ley que modifica colaboración eficaz', 'anti_colaboracion', 40, 10, 'Reduce beneficios a colaboradores eficaces, debilitando la lucha anticorrupción'),

-- Prescription and impunity
('PL-3599', 'Ley de prescripción de delitos de lesa humanidad', 'pro_impunidad', 50, 15, 'Permite prescripción de crímenes de lesa humanidad'),

-- Weakening of prosecution
('PL-5093', 'Ley que modifica atribuciones de la JNJ', 'anti_fiscalia', 35, 10, 'Debilita independencia de la Junta Nacional de Justicia'),

-- Anti-press laws
('PL-1125', 'Ley mordaza contra medios', 'anti_prensa', 30, 8, 'Restringe libertad de prensa so pretexto de protección de datos'),

-- Weakening criminal penalties
('PL-6912', 'Ley que reduce penas por corrupción menor', 'pro_crimen', 35, 10, 'Reduce penas para delitos de corrupción considerados menores'),

-- Electoral clientelism
('PL-5796', 'Ley de adelanto de elecciones con beneficios', 'clientelismo', 25, 5, 'Incluye beneficios electorales cuestionables')

ON CONFLICT (project_id) DO NOTHING;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE congressional_votes IS 'Historial de votaciones de congresistas en proyectos de ley';
COMMENT ON TABLE controversial_laws IS 'Registro curado de leyes controversiales pro-crimen o anti-democráticas';
COMMENT ON TABLE congressional_attendance IS 'Asistencia de congresistas a sesiones del pleno';
COMMENT ON TABLE candidate_tax_status IS 'Estado tributario del candidato en SUNAT';
COMMENT ON TABLE candidate_companies IS 'Empresas vinculadas al candidato';
COMMENT ON TABLE company_legal_issues IS 'Problemas legales de empresas vinculadas';
COMMENT ON TABLE incumbent_performance IS 'Desempeño de funcionarios actuales';
COMMENT ON TABLE proposal_evaluations IS 'Evaluación AI de propuestas de gobierno';
COMMENT ON TABLE judicial_verification IS 'Verificación cruzada de declaraciones judiciales';
