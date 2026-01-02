-- =============================================
-- SCORE BREAKDOWNS DATA
-- Agregar desglose detallado de puntajes
-- =============================================

-- Primero limpiar tabla si existe data
DELETE FROM score_breakdowns;

-- Insert breakdowns para cada candidato con scores
INSERT INTO score_breakdowns (
  candidate_id,
  education_level_points,
  education_depth_points,
  experience_total_points,
  experience_relevant_points,
  leadership_seniority_points,
  leadership_stability_points,
  integrity_base,
  penal_penalty,
  civil_penalties,
  resignation_penalty,
  completeness_points,
  consistency_points,
  assets_quality_points,
  verification_points,
  coverage_points
)
SELECT
  s.candidate_id,
  -- Education
  ROUND((s.competence * 0.22)::numeric, 2) as education_level_points,
  ROUND((s.competence * 0.08)::numeric, 2) as education_depth_points,
  -- Experience
  ROUND((s.competence * 0.25)::numeric, 2) as experience_total_points,
  ROUND((s.competence * 0.25)::numeric, 2) as experience_relevant_points,
  -- Leadership
  ROUND((s.competence * 0.14)::numeric, 2) as leadership_seniority_points,
  ROUND((s.competence * 0.06)::numeric, 2) as leadership_stability_points,
  -- Integrity
  100 as integrity_base,
  ROUND((100 - s.integrity)::numeric, 2) as penal_penalty,
  '[]'::jsonb as civil_penalties,
  0 as resignation_penalty,
  -- Transparency
  ROUND((s.transparency * 0.35)::numeric, 2) as completeness_points,
  ROUND((s.transparency * 0.35)::numeric, 2) as consistency_points,
  ROUND((s.transparency * 0.30)::numeric, 2) as assets_quality_points,
  -- Confidence
  ROUND((s.confidence * 0.50)::numeric, 2) as verification_points,
  ROUND((s.confidence * 0.50)::numeric, 2) as coverage_points
FROM scores s;

-- Actualizar algunos candidatos con datos más realistas

-- Marisol Pérez-Tello (alta competencia, alta integridad)
UPDATE score_breakdowns SET
  education_level_points = 18,
  education_depth_points = 10,
  experience_total_points = 22,
  experience_relevant_points = 20,
  leadership_seniority_points = 12,
  leadership_stability_points = 6,
  integrity_base = 100,
  penal_penalty = 0,
  resignation_penalty = 0,
  completeness_points = 32,
  consistency_points = 33,
  assets_quality_points = 28
WHERE candidate_id = (SELECT id FROM candidates WHERE slug = 'marisol-perez-tello');

-- Rafael López Aliaga (sentencia civil por alimentos)
UPDATE score_breakdowns SET
  education_level_points = 16,
  education_depth_points = 6,
  experience_total_points = 20,
  experience_relevant_points = 15,
  leadership_seniority_points = 10,
  leadership_stability_points = 6,
  integrity_base = 100,
  penal_penalty = 0,
  civil_penalties = '[{"type": "alimentos", "penalty": 35}]'::jsonb,
  resignation_penalty = 10,
  completeness_points = 28,
  consistency_points = 25,
  assets_quality_points = 24
WHERE candidate_id = (SELECT id FROM candidates WHERE slug = 'rafael-lopez-aliaga');

-- César Acuña (sentencia, renuncias)
UPDATE score_breakdowns SET
  education_level_points = 14,
  education_depth_points = 6,
  experience_total_points = 18,
  experience_relevant_points = 14,
  leadership_seniority_points = 10,
  leadership_stability_points = 4,
  integrity_base = 100,
  penal_penalty = 25,
  civil_penalties = '[]'::jsonb,
  resignation_penalty = 15,
  completeness_points = 25,
  consistency_points = 22,
  assets_quality_points = 20
WHERE candidate_id = (SELECT id FROM candidates WHERE slug = 'cesar-acuna');

-- Antauro Humala (sentencia penal grave)
UPDATE score_breakdowns SET
  education_level_points = 10,
  education_depth_points = 5,
  experience_total_points = 12,
  experience_relevant_points = 8,
  leadership_seniority_points = 6,
  leadership_stability_points = 4,
  integrity_base = 100,
  penal_penalty = 70,
  civil_penalties = '[]'::jsonb,
  resignation_penalty = 5,
  completeness_points = 20,
  consistency_points = 18,
  assets_quality_points = 15
WHERE candidate_id = (SELECT id FROM candidates WHERE slug = 'antauro-humala');

-- Keiko Fujimori
UPDATE score_breakdowns SET
  education_level_points = 16,
  education_depth_points = 9,
  experience_total_points = 20,
  experience_relevant_points = 18,
  leadership_seniority_points = 10,
  leadership_stability_points = 6,
  integrity_base = 100,
  penal_penalty = 0,
  civil_penalties = '[]'::jsonb,
  resignation_penalty = 5,
  completeness_points = 28,
  consistency_points = 26,
  assets_quality_points = 24
WHERE candidate_id = (SELECT id FROM candidates WHERE slug = 'keiko-fujimori');

-- Verificar resultados
SELECT
  c.full_name,
  sb.education_level_points,
  sb.experience_total_points,
  sb.leadership_seniority_points,
  sb.integrity_base,
  sb.penal_penalty
FROM score_breakdowns sb
JOIN candidates c ON sb.candidate_id = c.id
ORDER BY c.full_name;
