-- Add REINFO flag type for candidates linked to informal mining registry (REINFO)
-- Source: Territorio Tomado / GEOCATMIN / MINEM

-- Drop and recreate the CHECK constraint to include REINFO
ALTER TABLE flags DROP CONSTRAINT IF EXISTS flags_type_check;
ALTER TABLE flags ADD CONSTRAINT flags_type_check CHECK (type IN (
  'PENAL_SENTENCE',
  'CIVIL_SENTENCE',
  'VIOLENCE',
  'ALIMENTOS',
  'LABORAL',
  'CONTRACTUAL',
  'MULTIPLE_RESIGNATIONS',
  'INCONSISTENCY',
  'REINFO',
  'OTHER'
));
