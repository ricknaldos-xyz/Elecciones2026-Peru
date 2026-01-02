-- ============================================
-- SEED DATA - PARTIDOS POLITICOS
-- ============================================

INSERT INTO parties (id, name, short_name, color) VALUES
  ('11111111-1111-1111-1111-111111111101', 'Fuerza Popular', 'FP', '#FF6B00'),
  ('11111111-1111-1111-1111-111111111102', 'Renovación Popular', 'RP', '#0066CC'),
  ('11111111-1111-1111-1111-111111111103', 'Alianza para el Progreso', 'APP', '#00AA55'),
  ('11111111-1111-1111-1111-111111111104', 'Somos Perú', 'SP', '#FFD700'),
  ('11111111-1111-1111-1111-111111111105', 'Perú Libre', 'PL', '#CC0000'),
  ('11111111-1111-1111-1111-111111111106', 'Avanza País', 'AP', '#4169E1'),
  ('11111111-1111-1111-1111-111111111107', 'Partido Morado', 'PM', '#8B008B'),
  ('11111111-1111-1111-1111-111111111108', 'Acción Popular', 'AP', '#DC143C'),
  ('11111111-1111-1111-1111-111111111109', 'Fe en el Perú', 'FEP', '#228B22'),
  ('11111111-1111-1111-1111-111111111110', 'Podemos Perú', 'PP', '#FF69B4'),
  ('11111111-1111-1111-1111-111111111111', 'Primero la Gente', 'PLG', '#9932CC'),
  ('11111111-1111-1111-1111-111111111112', 'Juntos por el Perú', 'JP', '#FF4500'),
  ('11111111-1111-1111-1111-111111111113', 'Victoria Nacional', 'VN', '#006400');

-- ============================================
-- SEED DATA - DISTRITOS ELECTORALES
-- ============================================

INSERT INTO districts (id, name, slug, type, senators_count, deputies_count) VALUES
  ('22222222-2222-2222-2222-222222222201', 'Amazonas', 'amazonas', 'departamento', 2, 2),
  ('22222222-2222-2222-2222-222222222202', 'Áncash', 'ancash', 'departamento', 2, 5),
  ('22222222-2222-2222-2222-222222222203', 'Apurímac', 'apurimac', 'departamento', 2, 2),
  ('22222222-2222-2222-2222-222222222204', 'Arequipa', 'arequipa', 'departamento', 2, 6),
  ('22222222-2222-2222-2222-222222222205', 'Ayacucho', 'ayacucho', 'departamento', 2, 3),
  ('22222222-2222-2222-2222-222222222206', 'Cajamarca', 'cajamarca', 'departamento', 2, 6),
  ('22222222-2222-2222-2222-222222222207', 'Callao', 'callao', 'callao', 2, 4),
  ('22222222-2222-2222-2222-222222222208', 'Cusco', 'cusco', 'departamento', 2, 5),
  ('22222222-2222-2222-2222-222222222209', 'Huancavelica', 'huancavelica', 'departamento', 2, 2),
  ('22222222-2222-2222-2222-222222222210', 'Huánuco', 'huanuco', 'departamento', 2, 3),
  ('22222222-2222-2222-2222-222222222211', 'Ica', 'ica', 'departamento', 2, 4),
  ('22222222-2222-2222-2222-222222222212', 'Junín', 'junin', 'departamento', 2, 5),
  ('22222222-2222-2222-2222-222222222213', 'La Libertad', 'la-libertad', 'departamento', 2, 7),
  ('22222222-2222-2222-2222-222222222214', 'Lambayeque', 'lambayeque', 'departamento', 2, 5),
  ('22222222-2222-2222-2222-222222222215', 'Lima Metropolitana', 'lima-metropolitana', 'lima_provincia', 2, 36),
  ('22222222-2222-2222-2222-222222222216', 'Lima Provincias', 'lima-provincias', 'departamento', 2, 4),
  ('22222222-2222-2222-2222-222222222217', 'Loreto', 'loreto', 'departamento', 2, 4),
  ('22222222-2222-2222-2222-222222222218', 'Madre de Dios', 'madre-de-dios', 'departamento', 2, 1),
  ('22222222-2222-2222-2222-222222222219', 'Moquegua', 'moquegua', 'departamento', 2, 1),
  ('22222222-2222-2222-2222-222222222220', 'Pasco', 'pasco', 'departamento', 2, 1),
  ('22222222-2222-2222-2222-222222222221', 'Piura', 'piura', 'departamento', 2, 7),
  ('22222222-2222-2222-2222-222222222222', 'Puno', 'puno', 'departamento', 2, 5),
  ('22222222-2222-2222-2222-222222222223', 'San Martín', 'san-martin', 'departamento', 2, 4),
  ('22222222-2222-2222-2222-222222222224', 'Tacna', 'tacna', 'departamento', 2, 2),
  ('22222222-2222-2222-2222-222222222225', 'Tumbes', 'tumbes', 'departamento', 2, 1),
  ('22222222-2222-2222-2222-222222222226', 'Ucayali', 'ucayali', 'departamento', 2, 2),
  ('22222222-2222-2222-2222-222222222227', 'Peruanos en el Extranjero', 'extranjero', 'extranjero', 0, 2);

-- ============================================
-- SEED DATA - CANDIDATOS PRESIDENCIALES
-- ============================================

-- Keiko Fujimori
INSERT INTO candidates (id, slug, full_name, cargo, party_id, education_level) VALUES
  ('33333333-3333-3333-3333-333333333301', 'keiko-fujimori', 'Keiko Sofía Fujimori Higuchi', 'presidente', '11111111-1111-1111-1111-111111111101', 'Maestría');

INSERT INTO scores (candidate_id, competence, integrity, transparency, confidence, score_balanced, score_merit, score_integrity) VALUES
  ('33333333-3333-3333-3333-333333333301', 72, 45, 78, 85, 58.3, 62.1, 54.5);

INSERT INTO flags (candidate_id, type, severity, title, description, source) VALUES
  ('33333333-3333-3333-3333-333333333301', 'PENAL_SENTENCE', 'RED', 'Proceso judicial en curso', 'Caso Cocteles - Lavado de activos', 'Poder Judicial');

-- Rafael López Aliaga
INSERT INTO candidates (id, slug, full_name, cargo, party_id, education_level) VALUES
  ('33333333-3333-3333-3333-333333333302', 'rafael-lopez-aliaga', 'Rafael Bernardo López Aliaga Cazorla', 'presidente', '11111111-1111-1111-1111-111111111102', 'Universitario completo');

INSERT INTO scores (candidate_id, competence, integrity, transparency, confidence, score_balanced, score_merit, score_integrity) VALUES
  ('33333333-3333-3333-3333-333333333302', 68, 82, 71, 78, 74.6, 71.8, 77.4);

-- César Acuña
INSERT INTO candidates (id, slug, full_name, cargo, party_id, education_level) VALUES
  ('33333333-3333-3333-3333-333333333303', 'cesar-acuna', 'César Acuña Peralta', 'presidente', '11111111-1111-1111-1111-111111111103', 'Doctorado');

INSERT INTO scores (candidate_id, competence, integrity, transparency, confidence, score_balanced, score_merit, score_integrity) VALUES
  ('33333333-3333-3333-3333-333333333303', 75, 58, 65, 82, 66.3, 69.9, 62.7);

INSERT INTO flags (candidate_id, type, severity, title, description, source) VALUES
  ('33333333-3333-3333-3333-333333333303', 'CIVIL_SENTENCE', 'AMBER', 'Sanción por plagio', 'Plagio de tesis doctoral comprobado', 'SUNEDU');

-- George Forsyth
INSERT INTO candidates (id, slug, full_name, cargo, party_id, education_level) VALUES
  ('33333333-3333-3333-3333-333333333304', 'george-forsyth', 'George Patrick Forsyth Sommer', 'presidente', '11111111-1111-1111-1111-111111111104', 'Universitario incompleto');

INSERT INTO scores (candidate_id, competence, integrity, transparency, confidence, score_balanced, score_merit, score_integrity) VALUES
  ('33333333-3333-3333-3333-333333333304', 52, 88, 72, 75, 70.2, 62.4, 78.0);

-- Vladimir Cerrón
INSERT INTO candidates (id, slug, full_name, cargo, party_id, education_level) VALUES
  ('33333333-3333-3333-3333-333333333305', 'vladimir-cerron', 'Vladimir Roy Cerrón Rojas', 'presidente', '11111111-1111-1111-1111-111111111105', 'Doctorado');

INSERT INTO scores (candidate_id, competence, integrity, transparency, confidence, score_balanced, score_merit, score_integrity) VALUES
  ('33333333-3333-3333-3333-333333333305', 65, 15, 55, 80, 41.5, 49.5, 33.5);

INSERT INTO flags (candidate_id, type, severity, title, description, source) VALUES
  ('33333333-3333-3333-3333-333333333305', 'PENAL_SENTENCE', 'RED', 'Sentencia penal firme', 'Delito de corrupción - Caso Aeródromo Wanka', 'Poder Judicial');

-- José Williams
INSERT INTO candidates (id, slug, full_name, cargo, party_id, education_level) VALUES
  ('33333333-3333-3333-3333-333333333306', 'jose-williams', 'José Williams Zapata', 'presidente', '11111111-1111-1111-1111-111111111106', 'Maestría');

INSERT INTO scores (candidate_id, competence, integrity, transparency, confidence, score_balanced, score_merit, score_integrity) VALUES
  ('33333333-3333-3333-3333-333333333306', 70, 75, 68, 72, 72.1, 71.3, 72.9);

-- Mesías Guevara
INSERT INTO candidates (id, slug, full_name, cargo, party_id, education_level) VALUES
  ('33333333-3333-3333-3333-333333333307', 'mesias-guevara', 'Mesías Antonio Guevara Amasifuen', 'presidente', '11111111-1111-1111-1111-111111111107', 'Maestría');

INSERT INTO scores (candidate_id, competence, integrity, transparency, confidence, score_balanced, score_merit, score_integrity) VALUES
  ('33333333-3333-3333-3333-333333333307', 78, 92, 85, 88, 84.8, 82.2, 87.4);

-- Marisol Pérez Tello
INSERT INTO candidates (id, slug, full_name, cargo, party_id, education_level) VALUES
  ('33333333-3333-3333-3333-333333333308', 'marisol-perez-tello', 'Marisol Pérez Tello', 'presidente', '11111111-1111-1111-1111-111111111111', 'Maestría');

INSERT INTO scores (candidate_id, competence, integrity, transparency, confidence, score_balanced, score_merit, score_integrity) VALUES
  ('33333333-3333-3333-3333-333333333308', 82, 95, 88, 90, 88.5, 85.9, 91.1);

-- Álvaro Paz de la Barra
INSERT INTO candidates (id, slug, full_name, cargo, party_id, education_level) VALUES
  ('33333333-3333-3333-3333-333333333309', 'alvaro-paz-de-la-barra', 'Álvaro Gonzalo Paz de la Barra Freigeiro', 'presidente', '11111111-1111-1111-1111-111111111109', 'Título profesional');

INSERT INTO scores (candidate_id, competence, integrity, transparency, confidence, score_balanced, score_merit, score_integrity) VALUES
  ('33333333-3333-3333-3333-333333333309', 58, 72, 62, 68, 64.7, 62.6, 66.8);

INSERT INTO flags (candidate_id, type, severity, title, description, source) VALUES
  ('33333333-3333-3333-3333-333333333309', 'MULTIPLE_RESIGNATIONS', 'AMBER', 'Múltiples renuncias a partidos', 'Ha renunciado a 3 organizaciones políticas', 'JNE - Infogob');

-- José Luna Gálvez
INSERT INTO candidates (id, slug, full_name, cargo, party_id, education_level) VALUES
  ('33333333-3333-3333-3333-333333333310', 'jose-luna-galvez', 'José Luna Gálvez', 'presidente', '11111111-1111-1111-1111-111111111110', 'Universitario completo');

INSERT INTO scores (candidate_id, competence, integrity, transparency, confidence, score_balanced, score_merit, score_integrity) VALUES
  ('33333333-3333-3333-3333-333333333310', 62, 48, 55, 70, 55.0, 57.4, 52.6);

INSERT INTO flags (candidate_id, type, severity, title, description, source) VALUES
  ('33333333-3333-3333-3333-333333333310', 'CIVIL_SENTENCE', 'AMBER', 'Investigación fiscal', 'Caso Telesup - Irregularidades administrativas', 'Fiscalía de la Nación');

-- Daniel Urresti
INSERT INTO candidates (id, slug, full_name, cargo, party_id, education_level) VALUES
  ('33333333-3333-3333-3333-333333333311', 'daniel-urresti', 'Daniel Belizario Urresti Elera', 'presidente', '11111111-1111-1111-1111-111111111113', 'Maestría');

INSERT INTO scores (candidate_id, competence, integrity, transparency, confidence, score_balanced, score_merit, score_integrity) VALUES
  ('33333333-3333-3333-3333-333333333311', 71, 55, 66, 75, 63.1, 66.0, 60.2);

INSERT INTO flags (candidate_id, type, severity, title, description, source) VALUES
  ('33333333-3333-3333-3333-333333333311', 'PENAL_SENTENCE', 'AMBER', 'Proceso penal concluido', 'Caso Hugo Bustíos - Absuelto en última instancia', 'Poder Judicial');

-- Hernando de Soto
INSERT INTO candidates (id, slug, full_name, cargo, party_id, education_level) VALUES
  ('33333333-3333-3333-3333-333333333312', 'hernando-de-soto', 'Hernando de Soto Polar', 'presidente', '11111111-1111-1111-1111-111111111106', 'Doctorado');

INSERT INTO scores (candidate_id, competence, integrity, transparency, confidence, score_balanced, score_merit, score_integrity) VALUES
  ('33333333-3333-3333-3333-333333333312', 88, 85, 80, 82, 85.4, 86.5, 84.3);
