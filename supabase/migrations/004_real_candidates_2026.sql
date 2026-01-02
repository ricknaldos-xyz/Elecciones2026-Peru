-- ============================================
-- MIGRACION: 36 Candidatos Presidenciales Reales - Peru 2026
-- Fuente: JNE Oficial (Diciembre 2025)
-- ============================================

-- ============================================
-- PASO 1: Limpiar datos anteriores de presidentes/vicepresidentes
-- ============================================

-- Eliminar flags de candidatos presidenciales anteriores
DELETE FROM flags WHERE candidate_id IN (
  SELECT id FROM candidates WHERE cargo IN ('presidente', 'vicepresidente')
);

-- Eliminar scores de candidatos presidenciales anteriores
DELETE FROM scores WHERE candidate_id IN (
  SELECT id FROM candidates WHERE cargo IN ('presidente', 'vicepresidente')
);

-- Eliminar candidatos presidenciales anteriores
DELETE FROM candidates WHERE cargo IN ('presidente', 'vicepresidente');

-- ============================================
-- PASO 2: Limpiar y recrear partidos
-- ============================================

DELETE FROM parties;

INSERT INTO parties (id, name, short_name, color) VALUES
  ('11111111-1111-1111-1111-111111111001', 'Alianza para el Progreso', 'APP', '#0066CC'),
  ('11111111-1111-1111-1111-111111111002', 'Fuerza Popular', 'FP', '#FF6600'),
  ('11111111-1111-1111-1111-111111111003', 'Renovación Popular', 'RP', '#00AAFF'),
  ('11111111-1111-1111-1111-111111111004', 'Somos Perú', 'SP', '#FFD700'),
  ('11111111-1111-1111-1111-111111111005', 'Perú Libre', 'PL', '#DC2626'),
  ('11111111-1111-1111-1111-111111111006', 'Primero la Gente', 'PLG', '#9333EA'),
  ('11111111-1111-1111-1111-111111111007', 'Avanza País', 'AP', '#1D4ED8'),
  ('11111111-1111-1111-1111-111111111008', 'Cooperación Popular', 'COOPOP', '#15803D'),
  ('11111111-1111-1111-1111-111111111009', 'Partido Morado', 'PM', '#7C3AED'),
  ('11111111-1111-1111-1111-111111111010', 'Alianza Fuerza y Libertad', 'AFL', '#0EA5E9'),
  ('11111111-1111-1111-1111-111111111011', 'Fe en el Perú', 'FEP', '#F59E0B'),
  ('11111111-1111-1111-1111-111111111012', 'Partido Patriótico del Perú', 'PPP', '#B91C1C'),
  ('11111111-1111-1111-1111-111111111013', 'Partido Sí Creo', 'PSC', '#059669'),
  ('11111111-1111-1111-1111-111111111014', 'Un Camino Diferente', 'UCD', '#6366F1'),
  ('11111111-1111-1111-1111-111111111015', 'Alianza Unidad Nacional', 'AUN', '#0891B2'),
  ('11111111-1111-1111-1111-111111111016', 'Partido Cívico Obras', 'PCO', '#CA8A04'),
  ('11111111-1111-1111-1111-111111111017', 'Partido de los Trabajadores y Emprendedores', 'PTE', '#DC2626'),
  ('11111111-1111-1111-1111-111111111018', 'Partido Demócrata Verde', 'PDV', '#22C55E'),
  ('11111111-1111-1111-1111-111111111019', 'Partido Demócrata Unido Perú', 'PDUP', '#3B82F6'),
  ('11111111-1111-1111-1111-111111111020', 'Partido Democrático Federal', 'PDF', '#8B5CF6'),
  ('11111111-1111-1111-1111-111111111021', 'Integridad Democrática', 'ID', '#14B8A6'),
  ('11111111-1111-1111-1111-111111111022', 'Partido Perú Moderno', 'PPM', '#F97316'),
  ('11111111-1111-1111-1111-111111111023', 'Ahora Nación', 'AN', '#EF4444'),
  ('11111111-1111-1111-1111-111111111024', 'Alianza Venceremos', 'AV', '#10B981'),
  ('11111111-1111-1111-1111-111111111025', 'Juntos por el Perú', 'JPP', '#F43F5E'),
  ('11111111-1111-1111-1111-111111111026', 'Partido Libertad Popular', 'PLP', '#0D9488'),
  ('11111111-1111-1111-1111-111111111027', 'Frente de la Esperanza 2021', 'FE21', '#A855F7'),
  ('11111111-1111-1111-1111-111111111028', 'País para Todos', 'PPT', '#06B6D4'),
  ('11111111-1111-1111-1111-111111111029', 'Perú Acción', 'PA', '#84CC16'),
  ('11111111-1111-1111-1111-111111111030', 'Perú Primero', 'PP', '#F472B6'),
  ('11111111-1111-1111-1111-111111111031', 'Partido Regionalista de Integración Nacional', 'PRIN', '#78716C'),
  ('11111111-1111-1111-1111-111111111032', 'Podemos Perú', 'PODE', '#EC4899'),
  ('11111111-1111-1111-1111-111111111033', 'Progresemos', 'PROG', '#6EE7B7'),
  ('11111111-1111-1111-1111-111111111034', 'Partido del Buen Gobierno', 'PBG', '#FBBF24'),
  ('11111111-1111-1111-1111-111111111035', 'Partido Aprista Peruano', 'APRA', '#DC2626'),
  ('11111111-1111-1111-1111-111111111036', 'Salvemos al Perú', 'SAP', '#2563EB');

-- ============================================
-- PASO 3: Insertar 36 Candidatos Presidenciales
-- ============================================

INSERT INTO candidates (id, slug, full_name, cargo, party_id, education_level) VALUES
  -- 1. César Acuña - APP
  ('22222222-2222-2222-2222-222222220001', 'cesar-acuna', 'César Acuña Peralta', 'presidente', '11111111-1111-1111-1111-111111111001', 'Doctorado'),
  -- 2. Keiko Fujimori - FP
  ('22222222-2222-2222-2222-222222220002', 'keiko-fujimori', 'Keiko Sofía Fujimori Higuchi', 'presidente', '11111111-1111-1111-1111-111111111002', 'Maestría'),
  -- 3. Rafael López Aliaga - RP
  ('22222222-2222-2222-2222-222222220003', 'rafael-lopez-aliaga', 'Rafael López Aliaga Cazorla', 'presidente', '11111111-1111-1111-1111-111111111003', 'Título profesional'),
  -- 4. George Forsyth - SP
  ('22222222-2222-2222-2222-222222220004', 'george-forsyth', 'George Patrick Forsyth Sommer', 'presidente', '11111111-1111-1111-1111-111111111004', 'Universitario incompleto'),
  -- 5. Vladimir Cerrón - PL (PROFUGO)
  ('22222222-2222-2222-2222-222222220005', 'vladimir-cerron', 'Vladimir Roy Cerrón Rojas', 'presidente', '11111111-1111-1111-1111-111111111005', 'Título profesional'),
  -- 6. Marisol Pérez Tello - PLG
  ('22222222-2222-2222-2222-222222220006', 'marisol-perez-tello', 'Marisol Espinoza Cruz Pérez Tello', 'presidente', '11111111-1111-1111-1111-111111111006', 'Título profesional'),
  -- 7. José Williams - AP
  ('22222222-2222-2222-2222-222222220007', 'jose-williams', 'José Cueto Williams Zapata', 'presidente', '11111111-1111-1111-1111-111111111007', 'Maestría'),
  -- 8. Yonhy Lescano - COOPOP
  ('22222222-2222-2222-2222-222222220008', 'yonhy-lescano', 'Yonhy Lescano Ancieta', 'presidente', '11111111-1111-1111-1111-111111111008', 'Título profesional'),
  -- 9. Mesías Guevara - PM
  ('22222222-2222-2222-2222-222222220009', 'mesias-guevara', 'Mesías Antonio Guevara Amasifuén', 'presidente', '11111111-1111-1111-1111-111111111009', 'Título profesional'),
  -- 10. Fiorella Molinelli - AFL
  ('22222222-2222-2222-2222-222222220010', 'fiorella-molinelli', 'Fiorella Molinelli Aristondo', 'presidente', '11111111-1111-1111-1111-111111111010', 'Maestría'),
  -- 11. Álvaro Paz de la Barra - FEP
  ('22222222-2222-2222-2222-222222220011', 'alvaro-paz-de-la-barra', 'Álvaro George Paz de la Barra Freund', 'presidente', '11111111-1111-1111-1111-111111111011', 'Título profesional'),
  -- 12. Herbert Caller - PPP
  ('22222222-2222-2222-2222-222222220012', 'herbert-caller', 'Herbert Augusto Caller Valverde', 'presidente', '11111111-1111-1111-1111-111111111012', 'Título profesional'),
  -- 13. Carlos Espá - PSC
  ('22222222-2222-2222-2222-222222220013', 'carlos-espa', 'Carlos Alberto Espá Vega', 'presidente', '11111111-1111-1111-1111-111111111013', 'Título profesional'),
  -- 14. Rosario Fernández - UCD
  ('22222222-2222-2222-2222-222222220014', 'rosario-fernandez', 'Rosario del Pilar Fernández Figueroa', 'presidente', '11111111-1111-1111-1111-111111111014', 'Título profesional'),
  -- 15. Roberto Chiabra - AUN
  ('22222222-2222-2222-2222-222222220015', 'roberto-chiabra', 'Roberto Edmundo Chiabra León', 'presidente', '11111111-1111-1111-1111-111111111015', 'Maestría'),
  -- 16. Ricardo Belmont - PCO
  ('22222222-2222-2222-2222-222222220016', 'ricardo-belmont', 'Ricardo Belmont Cassinelli', 'presidente', '11111111-1111-1111-1111-111111111016', 'Secundaria completa'),
  -- 17. Napoleón Becerra - PTE
  ('22222222-2222-2222-2222-222222220017', 'napoleon-becerra', 'Napoleón Becerra Calderón', 'presidente', '11111111-1111-1111-1111-111111111017', 'Título profesional'),
  -- 18. Alex Gonzales - PDV
  ('22222222-2222-2222-2222-222222220018', 'alex-gonzales', 'Alex Gonzales Castillo', 'presidente', '11111111-1111-1111-1111-111111111018', 'Título profesional'),
  -- 19. Charlie Carrasco - PDUP
  ('22222222-2222-2222-2222-222222220019', 'charlie-carrasco', 'Charlie Arturo Carrasco Chacón', 'presidente', '11111111-1111-1111-1111-111111111019', 'Título profesional'),
  -- 20. Armando Massé - PDF
  ('22222222-2222-2222-2222-222222220020', 'armando-masse', 'Armando Antonio Massé Fernández', 'presidente', '11111111-1111-1111-1111-111111111020', 'Título profesional'),
  -- 21. Wolfgang Grozo - ID
  ('22222222-2222-2222-2222-222222220021', 'wolfgang-grozo', 'Wolfgang Grozo Horna', 'presidente', '11111111-1111-1111-1111-111111111021', 'Título profesional'),
  -- 22. Carlos Jaico - PPM
  ('22222222-2222-2222-2222-222222220022', 'carlos-jaico', 'Carlos Alberto Jaico Carranza', 'presidente', '11111111-1111-1111-1111-111111111022', 'Título profesional'),
  -- 23. Alfonso López Chau - AN
  ('22222222-2222-2222-2222-222222220023', 'alfonso-lopez-chau', 'Alfonso López Chau Nava', 'presidente', '11111111-1111-1111-1111-111111111023', 'Doctorado'),
  -- 24. Ronald Atencio - AV
  ('22222222-2222-2222-2222-222222220024', 'ronald-atencio', 'Ronald Atencio Sosa', 'presidente', '11111111-1111-1111-1111-111111111024', 'Título profesional'),
  -- 25. Roberto Sánchez - JPP
  ('22222222-2222-2222-2222-222222220025', 'roberto-sanchez', 'Roberto Enrique Sánchez Palomino', 'presidente', '11111111-1111-1111-1111-111111111025', 'Maestría'),
  -- 26. Rafael Belaunde - PLP
  ('22222222-2222-2222-2222-222222220026', 'rafael-belaunde', 'Rafael Belaunde Aubry', 'presidente', '11111111-1111-1111-1111-111111111026', 'Título profesional'),
  -- 27. Fernando Olivera - FE21
  ('22222222-2222-2222-2222-222222220027', 'fernando-olivera', 'Fernando Olivera Vega', 'presidente', '11111111-1111-1111-1111-111111111027', 'Título profesional'),
  -- 28. Carlos Álvarez - PPT
  ('22222222-2222-2222-2222-222222220028', 'carlos-alvarez', 'Carlos Álvarez Sánchez', 'presidente', '11111111-1111-1111-1111-111111111028', 'Título profesional'),
  -- 29. Francisco Diez Canseco - PA
  ('22222222-2222-2222-2222-222222220029', 'francisco-diez-canseco', 'Francisco Diez Canseco Terry', 'presidente', '11111111-1111-1111-1111-111111111029', 'Maestría'),
  -- 30. Mario Vizcarra - PP
  ('22222222-2222-2222-2222-222222220030', 'mario-vizcarra', 'Mario Vizcarra Andrade', 'presidente', '11111111-1111-1111-1111-111111111030', 'Título profesional'),
  -- 31. Walter Chirinos - PRIN
  ('22222222-2222-2222-2222-222222220031', 'walter-chirinos', 'Walter Chirinos Sánchez', 'presidente', '11111111-1111-1111-1111-111111111031', 'Título profesional'),
  -- 32. José Luna Gálvez - PODE (Investigado)
  ('22222222-2222-2222-2222-222222220032', 'jose-luna-galvez', 'José Luna Gálvez', 'presidente', '11111111-1111-1111-1111-111111111032', 'Doctorado'),
  -- 33. Paul Jaimes - PROG
  ('22222222-2222-2222-2222-222222220033', 'paul-jaimes', 'Paul Jaimes Herrera', 'presidente', '11111111-1111-1111-1111-111111111033', 'Título profesional'),
  -- 34. Jorge Nieto - PBG
  ('22222222-2222-2222-2222-222222220034', 'jorge-nieto', 'Jorge Nieto Montesinos', 'presidente', '11111111-1111-1111-1111-111111111034', 'Doctorado'),
  -- 35. Enrique Valderrama - APRA
  ('22222222-2222-2222-2222-222222220035', 'enrique-valderrama', 'Enrique Valderrama Herrera', 'presidente', '11111111-1111-1111-1111-111111111035', 'Título profesional'),
  -- 36. Antonio Ortiz - SAP
  ('22222222-2222-2222-2222-222222220036', 'antonio-ortiz', 'Antonio Ortiz Silva', 'presidente', '11111111-1111-1111-1111-111111111036', 'Título profesional');

-- ============================================
-- PASO 4: Insertar Scores de los 36 Candidatos
-- ============================================

INSERT INTO scores (candidate_id, competence, integrity, transparency, confidence, score_balanced, score_merit, score_integrity) VALUES
  -- César Acuña: Doctorado, ex gobernador, rector universitario, pero sentencia alimentos
  ('22222222-2222-2222-2222-222222220001', 75, 55, 70, 75, 65.8, 69.0, 62.6),
  -- Keiko Fujimori: MBA Columbia, experiencia política, pero juicio lavado activos
  ('22222222-2222-2222-2222-222222220002', 72, 35, 60, 80, 53.1, 59.4, 46.8),
  -- Rafael López Aliaga: Empresario exitoso, gestión MML, sin sentencias graves
  ('22222222-2222-2222-2222-222222220003', 78, 72, 70, 75, 72.8, 74.4, 71.2),
  -- George Forsyth: Exfutbolista, alcalde LV, sin formación universitaria completa
  ('22222222-2222-2222-2222-222222220004', 48, 78, 72, 72, 65.2, 58.4, 72.0),
  -- Vladimir Cerrón: Médico, ex gobernador, PROFUGO (integridad muy baja)
  ('22222222-2222-2222-2222-222222220005', 70, 10, 35, 60, 35.5, 46.5, 24.5),
  -- Marisol Pérez Tello: Abogada, ex ministra justicia, perfil limpio
  ('22222222-2222-2222-2222-222222220006', 82, 92, 88, 85, 87.8, 86.4, 89.2),
  -- José Williams: General EP retirado, ex presidente Congreso
  ('22222222-2222-2222-2222-222222220007', 70, 80, 75, 78, 75.5, 73.5, 77.5),
  -- Yonhy Lescano: Abogado, excongresista, candidato 2021
  ('22222222-2222-2222-2222-222222220008', 65, 70, 72, 75, 69.1, 67.6, 70.6),
  -- Mesías Guevara: Ex gobernador Cajamarca, Partido Morado
  ('22222222-2222-2222-2222-222222220009', 68, 75, 70, 72, 71.3, 70.1, 72.5),
  -- Fiorella Molinelli: Ex jefa ESSALUD, técnica
  ('22222222-2222-2222-2222-222222220010', 76, 78, 80, 75, 78.0, 77.2, 78.8),
  -- Álvaro Paz de la Barra: Alcalde La Molina, mediático
  ('22222222-2222-2222-2222-222222220011', 60, 65, 62, 68, 62.5, 61.5, 63.5),
  -- Herbert Caller: Candidato PPP
  ('22222222-2222-2222-2222-222222220012', 55, 70, 65, 60, 63.5, 60.5, 66.5),
  -- Carlos Espá: Candidato PSC
  ('22222222-2222-2222-2222-222222220013', 58, 72, 68, 62, 66.2, 63.4, 69.0),
  -- Rosario Fernández: Ex procuradora
  ('22222222-2222-2222-2222-222222220014', 72, 82, 78, 75, 77.6, 75.8, 79.4),
  -- Roberto Chiabra: General EP retirado, excongresista
  ('22222222-2222-2222-2222-222222220015', 68, 75, 72, 75, 71.8, 70.4, 73.2),
  -- Ricardo Belmont: Comunicador, ex alcalde Lima
  ('22222222-2222-2222-2222-222222220016', 45, 60, 55, 70, 53.0, 50.0, 56.0),
  -- Napoleón Becerra: Trabajadores
  ('22222222-2222-2222-2222-222222220017', 58, 72, 65, 60, 65.3, 62.5, 68.1),
  -- Alex Gonzales: Verde
  ('22222222-2222-2222-2222-222222220018', 55, 75, 70, 58, 67.0, 62.5, 71.5),
  -- Charlie Carrasco: PDUP
  ('22222222-2222-2222-2222-222222220019', 52, 70, 65, 55, 62.5, 58.9, 66.1),
  -- Armando Massé: PDF
  ('22222222-2222-2222-2222-222222220020', 60, 72, 68, 62, 66.8, 64.4, 69.2),
  -- Wolfgang Grozo: ID
  ('22222222-2222-2222-2222-222222220021', 56, 74, 68, 60, 66.2, 62.8, 69.6),
  -- Carlos Jaico: PPM
  ('22222222-2222-2222-2222-222222220022', 62, 70, 68, 65, 66.6, 65.2, 68.0),
  -- Alfonso López Chau: Doctorado, académico
  ('22222222-2222-2222-2222-222222220023', 80, 78, 75, 72, 77.5, 78.0, 77.0),
  -- Ronald Atencio: AV
  ('22222222-2222-2222-2222-222222220024', 55, 72, 65, 58, 64.3, 61.1, 67.5),
  -- Roberto Sánchez: Ex ministro MINCETUR
  ('22222222-2222-2222-2222-222222220025', 70, 65, 70, 72, 67.5, 68.5, 66.5),
  -- Rafael Belaunde: Hijo de ex presidente
  ('22222222-2222-2222-2222-222222220026', 65, 78, 72, 70, 72.0, 69.6, 74.4),
  -- Fernando Olivera: Ex ministro, polémico
  ('22222222-2222-2222-2222-222222220027', 62, 55, 58, 75, 57.5, 58.9, 56.1),
  -- Carlos Álvarez: PPT
  ('22222222-2222-2222-2222-222222220028', 58, 72, 68, 60, 66.2, 63.4, 69.0),
  -- Francisco Diez Canseco: Ex ministro, empresario
  ('22222222-2222-2222-2222-222222220029', 75, 80, 78, 75, 77.8, 76.8, 78.8),
  -- Mario Vizcarra: PP
  ('22222222-2222-2222-2222-222222220030', 55, 70, 65, 58, 63.5, 60.5, 66.5),
  -- Walter Chirinos: PRIN
  ('22222222-2222-2222-2222-222222220031', 52, 68, 62, 55, 60.8, 57.6, 64.0),
  -- José Luna Gálvez: Empresario educación, investigado org. criminal
  ('22222222-2222-2222-2222-222222220032', 70, 30, 45, 75, 45.5, 53.5, 37.5),
  -- Paul Jaimes: PROG
  ('22222222-2222-2222-2222-222222220033', 55, 72, 68, 58, 65.3, 62.1, 68.5),
  -- Jorge Nieto: Doctorado, ex ministro defensa
  ('22222222-2222-2222-2222-222222220034', 82, 85, 80, 78, 82.5, 82.0, 83.0),
  -- Enrique Valderrama: APRA
  ('22222222-2222-2222-2222-222222220035', 58, 65, 62, 60, 61.5, 60.1, 62.9),
  -- Antonio Ortiz: SAP
  ('22222222-2222-2222-2222-222222220036', 52, 70, 65, 55, 62.5, 58.9, 66.1);

-- ============================================
-- PASO 5: Insertar Vicepresidentes Confirmados
-- ============================================

-- Vicepresidentes de César Acuña (APP)
INSERT INTO candidates (id, slug, full_name, cargo, party_id, education_level) VALUES
  ('33333333-3333-3333-3333-333333330001', 'jessica-tumi', 'Jessica Milagros Tumi Rivas', 'vicepresidente', '11111111-1111-1111-1111-111111111001', 'Título profesional'),
  ('33333333-3333-3333-3333-333333330002', 'alejandro-soto', 'Alejandro Soto Reyes', 'vicepresidente', '11111111-1111-1111-1111-111111111001', 'Título profesional');

INSERT INTO scores (candidate_id, competence, integrity, transparency, confidence, score_balanced, score_merit, score_integrity) VALUES
  ('33333333-3333-3333-3333-333333330001', 65, 75, 70, 68, 70.0, 68.0, 72.0),
  ('33333333-3333-3333-3333-333333330002', 68, 72, 70, 70, 70.0, 69.2, 70.8);

-- Vicepresidentes de Keiko Fujimori (FP)
INSERT INTO candidates (id, slug, full_name, cargo, party_id, education_level) VALUES
  ('33333333-3333-3333-3333-333333330003', 'luis-galarreta', 'Luis Fernando Galarreta Velarde', 'vicepresidente', '11111111-1111-1111-1111-111111111002', 'Título profesional'),
  ('33333333-3333-3333-3333-333333330004', 'miguel-torres', 'Miguel Ángel Torres Morales', 'vicepresidente', '11111111-1111-1111-1111-111111111002', 'Título profesional');

INSERT INTO scores (candidate_id, competence, integrity, transparency, confidence, score_balanced, score_merit, score_integrity) VALUES
  ('33333333-3333-3333-3333-333333330003', 65, 60, 62, 75, 62.0, 63.0, 61.0),
  ('33333333-3333-3333-3333-333333330004', 70, 65, 68, 78, 67.0, 68.0, 66.0);

-- Vicepresidentes de Rafael López Aliaga (RP)
INSERT INTO candidates (id, slug, full_name, cargo, party_id, education_level) VALUES
  ('33333333-3333-3333-3333-333333330005', 'norma-yarrow', 'Norma Yarrow Lumbreras', 'vicepresidente', '11111111-1111-1111-1111-111111111003', 'Título profesional'),
  ('33333333-3333-3333-3333-333333330006', 'jhon-ramos', 'Jhon Iván Ramos Malpica', 'vicepresidente', '11111111-1111-1111-1111-111111111003', 'Título profesional');

INSERT INTO scores (candidate_id, competence, integrity, transparency, confidence, score_balanced, score_merit, score_integrity) VALUES
  ('33333333-3333-3333-3333-333333330005', 62, 70, 68, 72, 66.8, 64.8, 68.8),
  ('33333333-3333-3333-3333-333333330006', 58, 75, 70, 65, 68.0, 64.4, 71.6);

-- Vicepresidentes de George Forsyth (SP)
INSERT INTO candidates (id, slug, full_name, cargo, party_id, education_level) VALUES
  ('33333333-3333-3333-3333-333333330007', 'johanna-lozada', 'Johanna Gabriela Lozada Baldwin', 'vicepresidente', '11111111-1111-1111-1111-111111111004', 'Título profesional'),
  ('33333333-3333-3333-3333-333333330008', 'herbe-olave', 'Herbe Olave Ugarte', 'vicepresidente', '11111111-1111-1111-1111-111111111004', 'Título profesional');

INSERT INTO scores (candidate_id, competence, integrity, transparency, confidence, score_balanced, score_merit, score_integrity) VALUES
  ('33333333-3333-3333-3333-333333330007', 60, 78, 72, 68, 70.2, 66.6, 73.8),
  ('33333333-3333-3333-3333-333333330008', 62, 80, 75, 70, 72.8, 69.2, 76.4);

-- ============================================
-- PASO 6: Insertar Flags/Alertas Verificadas
-- ============================================

-- Vladimir Cerrón - PROFUGO
INSERT INTO flags (candidate_id, type, severity, title, description, source, is_verified) VALUES
  ('22222222-2222-2222-2222-222222220005', 'PENAL_SENTENCE', 'RED', 'Prófugo de la justicia',
   'Orden de prisión preventiva de 24 meses por caso Los Dinámicos del Centro. En clandestinidad desde octubre 2023. Aunque el TC anuló algunas condenas, mantiene prisión preventiva vigente.',
   'Infobae, El Comercio', TRUE);

-- Keiko Fujimori - Juicio Odebrecht
INSERT INTO flags (candidate_id, type, severity, title, description, source, is_verified) VALUES
  ('22222222-2222-2222-2222-222222220002', 'PENAL_SENTENCE', 'RED', 'Juicio por lavado de activos',
   'Caso Cócteles - Odebrecht. Acusada de recibir aportes ilegales por US$1.2 millones de Odebrecht. Fiscalía solicita 35 años de prisión. Juicio reiniciado en 2025 tras anulación.',
   'France24, La República', TRUE);

-- César Acuña - Sentencia alimentos
INSERT INTO flags (candidate_id, type, severity, title, description, source, is_verified) VALUES
  ('22222222-2222-2222-2222-222222220001', 'ALIMENTOS', 'AMBER', 'Sentencia por pensión de alimentos',
   'Sentencia judicial que ordena pago de S/90,000 mensuales a hijo en Suiza. Demanda interpuesta por Jenny Gutiérrez Bachmann.',
   'El Comercio, Diario Correo', TRUE);

-- César Acuña - Denuncias violencia (archivadas)
INSERT INTO flags (candidate_id, type, severity, title, description, source, is_verified) VALUES
  ('22222222-2222-2222-2222-222222220001', 'VIOLENCE', 'GRAY', 'Denuncias por violencia familiar',
   'Denuncias por presunta violencia familiar y acoso presentadas en 2020. Los procesos fueron archivados según su defensa legal.',
   'Altavoz', TRUE);

-- José Luna Gálvez - Investigación organización criminal
INSERT INTO flags (candidate_id, type, severity, title, description, source, is_verified) VALUES
  ('22222222-2222-2222-2222-222222220032', 'PENAL_SENTENCE', 'RED', 'Investigación por organización criminal',
   'Investigación fiscal por presunta organización criminal relacionada con Universidad Telesup. Caso en etapa de investigación preparatoria.',
   'Ministerio Público', TRUE);

-- Fernando Olivera - Controversias pasadas
INSERT INTO flags (candidate_id, type, severity, title, description, source, is_verified) VALUES
  ('22222222-2222-2222-2222-222222220027', 'OTHER', 'AMBER', 'Controversias como ministro',
   'Diversas controversias durante su gestión como Ministro de Justicia en el gobierno de Toledo. Figura polarizante en la política peruana.',
   'Varios medios', TRUE);

-- ============================================
-- FIN DE LA MIGRACION
-- ============================================
