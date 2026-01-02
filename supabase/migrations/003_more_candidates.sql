-- ============================================
-- MORE CANDIDATES - Vicepresidentes, Senadores, Diputados, Parlamento Andino
-- ============================================

-- ============================================
-- VICEPRESIDENTES (one per presidential candidate)
-- ============================================

-- Patricia Juárez (VP de Keiko)
INSERT INTO candidates (id, slug, full_name, cargo, party_id, education_level) VALUES
  ('44444444-4444-4444-4444-444444444401', 'patricia-juarez', 'Patricia Rosa Juárez Gallegos', 'vicepresidente', '11111111-1111-1111-1111-111111111101', 'Título profesional');

INSERT INTO scores (candidate_id, competence, integrity, transparency, confidence, score_balanced, score_merit, score_integrity) VALUES
  ('44444444-4444-4444-4444-444444444401', 68, 85, 75, 80, 76.0, 73.2, 78.8);

-- Carlos Anderson (VP de López Aliaga)
INSERT INTO candidates (id, slug, full_name, cargo, party_id, education_level) VALUES
  ('44444444-4444-4444-4444-444444444402', 'carlos-anderson', 'Carlos Alberto Anderson Ramírez', 'vicepresidente', '11111111-1111-1111-1111-111111111102', 'Doctorado');

INSERT INTO scores (candidate_id, competence, integrity, transparency, confidence, score_balanced, score_merit, score_integrity) VALUES
  ('44444444-4444-4444-4444-444444444402', 82, 90, 85, 88, 86.3, 85.0, 87.6);

-- Humberto Lay (VP de Acuña)
INSERT INTO candidates (id, slug, full_name, cargo, party_id, education_level) VALUES
  ('44444444-4444-4444-4444-444444444403', 'humberto-lay', 'Humberto Lay Sun', 'vicepresidente', '11111111-1111-1111-1111-111111111103', 'Maestría');

INSERT INTO scores (candidate_id, competence, integrity, transparency, confidence, score_balanced, score_merit, score_integrity) VALUES
  ('44444444-4444-4444-4444-444444444403', 70, 92, 80, 82, 80.8, 77.6, 84.0);

-- ============================================
-- SENADORES (sample from different regions)
-- ============================================

-- Lima
INSERT INTO candidates (id, slug, full_name, cargo, party_id, district_id, education_level) VALUES
  ('55555555-5555-5555-5555-555555555501', 'martha-chavez', 'Martha Gladys Chávez Cossío', 'senador', '11111111-1111-1111-1111-111111111101', '22222222-2222-2222-2222-222222222215', 'Título profesional');

INSERT INTO scores (candidate_id, competence, integrity, transparency, confidence, score_balanced, score_merit, score_integrity) VALUES
  ('55555555-5555-5555-5555-555555555501', 75, 55, 70, 85, 65.5, 69.5, 61.5);

INSERT INTO flags (candidate_id, type, severity, title, description, source) VALUES
  ('55555555-5555-5555-5555-555555555501', 'CIVIL_SENTENCE', 'AMBER', 'Proceso disciplinario', 'Sanción del Congreso por conducta', 'Congreso de la República');

-- Arequipa
INSERT INTO candidates (id, slug, full_name, cargo, party_id, district_id, education_level) VALUES
  ('55555555-5555-5555-5555-555555555502', 'rohel-sanchez', 'Rohel Sánchez Sánchez', 'senador', '11111111-1111-1111-1111-111111111102', '22222222-2222-2222-2222-222222222204', 'Doctorado');

INSERT INTO scores (candidate_id, competence, integrity, transparency, confidence, score_balanced, score_merit, score_integrity) VALUES
  ('55555555-5555-5555-5555-555555555502', 80, 88, 82, 85, 83.8, 83.0, 84.6);

-- Cusco
INSERT INTO candidates (id, slug, full_name, cargo, party_id, district_id, education_level) VALUES
  ('55555555-5555-5555-5555-555555555503', 'fernando-herrera', 'Fernando Herrera Mamani', 'senador', '11111111-1111-1111-1111-111111111105', '22222222-2222-2222-2222-222222222208', 'Universitario completo');

INSERT INTO scores (candidate_id, competence, integrity, transparency, confidence, score_balanced, score_merit, score_integrity) VALUES
  ('55555555-5555-5555-5555-555555555503', 58, 70, 65, 72, 64.1, 62.3, 65.9);

-- Piura
INSERT INTO candidates (id, slug, full_name, cargo, party_id, district_id, education_level) VALUES
  ('55555555-5555-5555-5555-555555555504', 'maria-cordero', 'María del Carmen Alva Prieto', 'senador', '11111111-1111-1111-1111-111111111108', '22222222-2222-2222-2222-222222222221', 'Maestría');

INSERT INTO scores (candidate_id, competence, integrity, transparency, confidence, score_balanced, score_merit, score_integrity) VALUES
  ('55555555-5555-5555-5555-555555555504', 72, 78, 75, 80, 75.0, 74.1, 75.9);

-- La Libertad
INSERT INTO candidates (id, slug, full_name, cargo, party_id, district_id, education_level) VALUES
  ('55555555-5555-5555-5555-555555555505', 'luis-valdez', 'Luis Alberto Valdez Farías', 'senador', '11111111-1111-1111-1111-111111111103', '22222222-2222-2222-2222-222222222213', 'Título profesional');

INSERT INTO scores (candidate_id, competence, integrity, transparency, confidence, score_balanced, score_merit, score_integrity) VALUES
  ('55555555-5555-5555-5555-555555555505', 65, 82, 70, 75, 73.2, 70.0, 76.4);

-- Lambayeque
INSERT INTO candidates (id, slug, full_name, cargo, party_id, district_id, education_level) VALUES
  ('55555555-5555-5555-5555-555555555506', 'jorge-perez', 'Jorge Luis Pérez Flores', 'senador', '11111111-1111-1111-1111-111111111104', '22222222-2222-2222-2222-222222222214', 'Universitario completo');

INSERT INTO scores (candidate_id, competence, integrity, transparency, confidence, score_balanced, score_merit, score_integrity) VALUES
  ('55555555-5555-5555-5555-555555555506', 60, 90, 78, 82, 74.7, 70.2, 79.2);

-- ============================================
-- DIPUTADOS (sample from different districts)
-- ============================================

-- Lima Metropolitana
INSERT INTO candidates (id, slug, full_name, cargo, party_id, district_id, education_level) VALUES
  ('66666666-6666-6666-6666-666666666601', 'adriana-tudela', 'Adriana María Tudela Gutiérrez', 'diputado', '11111111-1111-1111-1111-111111111106', '22222222-2222-2222-2222-222222222215', 'Título profesional');

INSERT INTO scores (candidate_id, competence, integrity, transparency, confidence, score_balanced, score_merit, score_integrity) VALUES
  ('66666666-6666-6666-6666-666666666601', 70, 95, 85, 88, 82.0, 78.5, 85.5);

INSERT INTO candidates (id, slug, full_name, cargo, party_id, district_id, education_level) VALUES
  ('66666666-6666-6666-6666-666666666602', 'sigrid-bazan', 'Sigrid Bazán Narro', 'diputado', '11111111-1111-1111-1111-111111111112', '22222222-2222-2222-2222-222222222215', 'Universitario completo');

INSERT INTO scores (candidate_id, competence, integrity, transparency, confidence, score_balanced, score_merit, score_integrity) VALUES
  ('66666666-6666-6666-6666-666666666602', 55, 88, 80, 82, 71.3, 65.3, 77.3);

INSERT INTO candidates (id, slug, full_name, cargo, party_id, district_id, education_level) VALUES
  ('66666666-6666-6666-6666-666666666603', 'flavio-cruz', 'Flavio Marco Cruz Mamani', 'diputado', '11111111-1111-1111-1111-111111111105', '22222222-2222-2222-2222-222222222215', 'Técnico completo');

INSERT INTO scores (candidate_id, competence, integrity, transparency, confidence, score_balanced, score_merit, score_integrity) VALUES
  ('66666666-6666-6666-6666-666666666603', 45, 35, 50, 70, 41.5, 42.5, 40.5);

INSERT INTO flags (candidate_id, type, severity, title, description, source) VALUES
  ('66666666-6666-6666-6666-666666666603', 'PENAL_SENTENCE', 'RED', 'Investigación fiscal', 'Caso por presunta corrupción', 'Ministerio Público');

-- Callao
INSERT INTO candidates (id, slug, full_name, cargo, party_id, district_id, education_level) VALUES
  ('66666666-6666-6666-6666-666666666604', 'jose-luna', 'José León Luna Morales', 'diputado', '11111111-1111-1111-1111-111111111110', '22222222-2222-2222-2222-222222222207', 'Maestría');

INSERT INTO scores (candidate_id, competence, integrity, transparency, confidence, score_balanced, score_merit, score_integrity) VALUES
  ('66666666-6666-6666-6666-666666666604', 68, 60, 72, 75, 65.2, 66.4, 64.0);

-- Arequipa
INSERT INTO candidates (id, slug, full_name, cargo, party_id, district_id, education_level) VALUES
  ('66666666-6666-6666-6666-666666666605', 'carmen-omonte', 'Carmen Rosa Omonte Durand', 'diputado', '11111111-1111-1111-1111-111111111103', '22222222-2222-2222-2222-222222222204', 'Título profesional');

INSERT INTO scores (candidate_id, competence, integrity, transparency, confidence, score_balanced, score_merit, score_integrity) VALUES
  ('66666666-6666-6666-6666-666666666605', 72, 85, 78, 80, 78.3, 76.2, 80.4);

-- Junín
INSERT INTO candidates (id, slug, full_name, cargo, party_id, district_id, education_level) VALUES
  ('66666666-6666-6666-6666-666666666606', 'edith-mendoza', 'Edith Mendoza Fernández', 'diputado', '11111111-1111-1111-1111-111111111105', '22222222-2222-2222-2222-222222222212', 'Universitario completo');

INSERT INTO scores (candidate_id, competence, integrity, transparency, confidence, score_balanced, score_merit, score_integrity) VALUES
  ('66666666-6666-6666-6666-666666666606', 52, 72, 65, 70, 62.3, 59.3, 65.3);

-- Puno
INSERT INTO candidates (id, slug, full_name, cargo, party_id, district_id, education_level) VALUES
  ('66666666-6666-6666-6666-666666666607', 'raul-machaca', 'Raúl Machaca Mamani', 'diputado', '11111111-1111-1111-1111-111111111109', '22222222-2222-2222-2222-222222222222', 'Técnico completo');

INSERT INTO scores (candidate_id, competence, integrity, transparency, confidence, score_balanced, score_merit, score_integrity) VALUES
  ('66666666-6666-6666-6666-666666666607', 48, 80, 60, 68, 63.6, 58.8, 68.4);

-- Cajamarca
INSERT INTO candidates (id, slug, full_name, cargo, party_id, district_id, education_level) VALUES
  ('66666666-6666-6666-6666-666666666608', 'mirtha-vasquez', 'Mirtha Esther Vásquez Chuquilin', 'diputado', '11111111-1111-1111-1111-111111111112', '22222222-2222-2222-2222-222222222206', 'Título profesional');

INSERT INTO scores (candidate_id, competence, integrity, transparency, confidence, score_balanced, score_merit, score_integrity) VALUES
  ('66666666-6666-6666-6666-666666666608', 75, 82, 80, 85, 78.6, 77.6, 79.6);

-- ============================================
-- PARLAMENTO ANDINO
-- ============================================

INSERT INTO candidates (id, slug, full_name, cargo, party_id, education_level) VALUES
  ('77777777-7777-7777-7777-777777777701', 'mario-zegarra', 'Mario Fidel Zegarra Valdivia', 'parlamento_andino', '11111111-1111-1111-1111-111111111102', 'Maestría');

INSERT INTO scores (candidate_id, competence, integrity, transparency, confidence, score_balanced, score_merit, score_integrity) VALUES
  ('77777777-7777-7777-7777-777777777701', 70, 85, 75, 78, 77.0, 74.5, 79.5);

INSERT INTO candidates (id, slug, full_name, cargo, party_id, education_level) VALUES
  ('77777777-7777-7777-7777-777777777702', 'leslye-lazo', 'Leslye Carol Lazo Villón', 'parlamento_andino', '11111111-1111-1111-1111-111111111106', 'Título profesional');

INSERT INTO scores (candidate_id, competence, integrity, transparency, confidence, score_balanced, score_merit, score_integrity) VALUES
  ('77777777-7777-7777-7777-777777777702', 62, 90, 80, 82, 75.4, 71.0, 79.8);

INSERT INTO candidates (id, slug, full_name, cargo, party_id, education_level) VALUES
  ('77777777-7777-7777-7777-777777777703', 'alan-fairlie', 'Alan Bernardo Fairlie Reinoso', 'parlamento_andino', '11111111-1111-1111-1111-111111111112', 'Doctorado');

INSERT INTO scores (candidate_id, competence, integrity, transparency, confidence, score_balanced, score_merit, score_integrity) VALUES
  ('77777777-7777-7777-7777-777777777703', 85, 88, 82, 90, 86.1, 85.6, 86.6);

INSERT INTO candidates (id, slug, full_name, cargo, party_id, education_level) VALUES
  ('77777777-7777-7777-7777-777777777704', 'gustavo-pacheco', 'Gustavo Eduardo Pacheco Villar', 'parlamento_andino', '11111111-1111-1111-1111-111111111101', 'Universitario completo');

INSERT INTO scores (candidate_id, competence, integrity, transparency, confidence, score_balanced, score_merit, score_integrity) VALUES
  ('77777777-7777-7777-7777-777777777704', 55, 75, 68, 72, 65.0, 62.0, 68.0);

