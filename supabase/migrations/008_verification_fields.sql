-- Migration: Verification Fields
-- Adds columns to track data source and verification status

-- Campos para rastrear verificación de datos
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS data_source TEXT DEFAULT 'unknown';
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS data_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS inscription_status TEXT;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS inscription_date TIMESTAMPTZ;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS verification_date TIMESTAMPTZ;

-- Índices para consultas de verificación
CREATE INDEX IF NOT EXISTS idx_candidates_verified ON candidates(data_verified);
CREATE INDEX IF NOT EXISTS idx_candidates_data_source ON candidates(data_source);
CREATE INDEX IF NOT EXISTS idx_candidates_jne_id ON candidates(jne_id);

-- Comentarios
COMMENT ON COLUMN candidates.data_source IS 'Origen de los datos: jne, onpe, manual, unknown';
COMMENT ON COLUMN candidates.data_verified IS 'Si los datos han sido verificados contra fuentes oficiales';
COMMENT ON COLUMN candidates.inscription_status IS 'Estado de inscripción: inscrito, tachado, excluido, pendiente';
COMMENT ON COLUMN candidates.inscription_date IS 'Fecha de inscripción en el proceso electoral';
COMMENT ON COLUMN candidates.verification_date IS 'Última fecha de verificación de datos';
