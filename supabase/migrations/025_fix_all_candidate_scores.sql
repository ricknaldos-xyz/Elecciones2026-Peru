-- ============================================
-- MIGRACION 025: Corrección de scores y education_level de todos los candidatos
-- Basado en auditoría integral de integridad, competencia y transparencia
-- Fecha: 2026-03-11
-- ============================================

BEGIN;

-- ============================================
-- PASO 1: Correcciones de education_level
-- ============================================

-- Vladimir Cerrón: neurocirujano con doctorado en Cuba
UPDATE candidates SET education_level = 'Doctorado'
  WHERE id = '22222222-2222-2222-2222-222222220005';

-- Rafael López Aliaga: MBA Universidad del Pacífico
UPDATE candidates SET education_level = 'Maestría'
  WHERE id = '22222222-2222-2222-2222-222222220003';

-- Marisol Pérez Tello: tiene maestría
UPDATE candidates SET education_level = 'Maestría'
  WHERE id = '22222222-2222-2222-2222-222222220006';

-- Fiorella Molinelli: Doctorado en Gobierno USMP
UPDATE candidates SET education_level = 'Doctorado'
  WHERE id = '22222222-2222-2222-2222-222222220010';

-- Carlos Álvarez: humorista, secundaria completa, sin universidad
UPDATE candidates SET education_level = 'Secundaria completa'
  WHERE id = '22222222-2222-2222-2222-222222220028';

-- Yonhy Lescano: tiene maestría
UPDATE candidates SET education_level = 'Maestría'
  WHERE id = '22222222-2222-2222-2222-222222220008';

-- Fernando Olivera: tiene maestría
UPDATE candidates SET education_level = 'Maestría'
  WHERE id = '22222222-2222-2222-2222-222222220027';

-- Enrique Valderrama: universitario completo (no título profesional)
UPDATE candidates SET education_level = 'Universitario completo'
  WHERE id = '22222222-2222-2222-2222-222222220035';

-- George Forsyth: universitario completo (no incompleto)
UPDATE candidates SET education_level = 'Universitario completo'
  WHERE id = '22222222-2222-2222-2222-222222220004';

-- Ricardo Belmont: mantener secundaria completa (datos conflictivos, conservador)
-- No change needed, already 'Secundaria completa'

-- ============================================
-- PASO 2: Actualizar scores de TODOS los 36 candidatos
-- Formula:
--   balanced  = ROUND(0.45 * C + 0.45 * I + 0.10 * T, 1)
--   merit     = ROUND(0.60 * C + 0.30 * I + 0.10 * T, 1)
--   integrity = ROUND(0.30 * C + 0.60 * I + 0.10 * T, 1)
-- ============================================

-- 1. César Acuña (C=75, I=50, T=70)
UPDATE scores SET
  competence = 75, integrity = 50, transparency = 70,
  score_balanced = 63.2, score_merit = 67.0, score_integrity = 59.5
  WHERE candidate_id = '22222222-2222-2222-2222-222222220001';

-- 2. Keiko Fujimori (C=70, I=30, T=60)
-- Caso Cócteles lavado/org criminal: sobreseído ene 2026 (no penaliza)
-- Falsedad genérica ante ONPE: en proceso (-35)
-- Lavado activos campaña 2021 "Lavamoto": investigación formalizada sep 2025 (-35)
-- Total penal: 2 pendientes = -70. Integrity = 100 - 70 = 30
UPDATE scores SET
  competence = 70, integrity = 30, transparency = 60,
  score_balanced = 51.0, score_merit = 57.0, score_integrity = 45.0
  WHERE candidate_id = '22222222-2222-2222-2222-222222220002';

-- 3. Rafael López Aliaga (C=78, I=40, T=70) - Panama Papers + SUNAFIL
UPDATE scores SET
  competence = 78, integrity = 40, transparency = 70,
  score_balanced = 60.1, score_merit = 65.8, score_integrity = 54.4
  WHERE candidate_id = '22222222-2222-2222-2222-222222220003';

-- 4. George Forsyth (C=52, I=55, T=72) - Colusión agravada investigation + resignations
UPDATE scores SET
  competence = 52, integrity = 55, transparency = 72,
  score_balanced = 55.4, score_merit = 54.9, score_integrity = 55.8
  WHERE candidate_id = '22222222-2222-2222-2222-222222220004';

-- 5. Vladimir Cerrón (C=72, I=10, T=35) - Prófugo, múltiples casos
UPDATE scores SET
  competence = 72, integrity = 10, transparency = 35,
  score_balanced = 40.4, score_merit = 49.7, score_integrity = 31.1
  WHERE candidate_id = '22222222-2222-2222-2222-222222220005';

-- 6. Marisol Pérez Tello (C=80, I=90, T=88) - Perfil limpio
UPDATE scores SET
  competence = 80, integrity = 90, transparency = 88,
  score_balanced = 85.3, score_merit = 83.8, score_integrity = 86.8
  WHERE candidate_id = '22222222-2222-2222-2222-222222220006';

-- 7. José Williams (C=70, I=80, T=75)
UPDATE scores SET
  competence = 70, integrity = 80, transparency = 75,
  score_balanced = 75.0, score_merit = 73.5, score_integrity = 76.5
  WHERE candidate_id = '22222222-2222-2222-2222-222222220007';

-- 8. Yonhy Lescano (C=68, I=70, T=72)
UPDATE scores SET
  competence = 68, integrity = 70, transparency = 72,
  score_balanced = 69.3, score_merit = 69.0, score_integrity = 69.6
  WHERE candidate_id = '22222222-2222-2222-2222-222222220008';

-- 9. Mesías Guevara (C=68, I=75, T=70)
UPDATE scores SET
  competence = 68, integrity = 75, transparency = 70,
  score_balanced = 71.3, score_merit = 70.3, score_integrity = 72.4
  WHERE candidate_id = '22222222-2222-2222-2222-222222220009';

-- 10. Fiorella Molinelli (C=78, I=65, T=80) - Pending penal colusión EsSalud
UPDATE scores SET
  competence = 78, integrity = 65, transparency = 80,
  score_balanced = 72.3, score_merit = 74.3, score_integrity = 70.4
  WHERE candidate_id = '22222222-2222-2222-2222-222222220010';

-- 11. Álvaro Paz de la Barra (C=60, I=50, T=62) - Violence complaint
UPDATE scores SET
  competence = 60, integrity = 50, transparency = 62,
  score_balanced = 55.7, score_merit = 57.2, score_integrity = 54.2
  WHERE candidate_id = '22222222-2222-2222-2222-222222220011';

-- 12. Herbert Caller (C=63, I=70, T=65) - Maestría (Carlos III Madrid), 21 años Armada, empresario
UPDATE scores SET
  competence = 63, integrity = 70, transparency = 65,
  score_balanced = 66.3, score_merit = 65.3, score_integrity = 67.4
  WHERE candidate_id = '22222222-2222-2222-2222-222222220012';

-- 13. Carlos Espá (C=58, I=72, T=68)
UPDATE scores SET
  competence = 58, integrity = 72, transparency = 68,
  score_balanced = 65.3, score_merit = 63.2, score_integrity = 67.4
  WHERE candidate_id = '22222222-2222-2222-2222-222222220013';

-- 14. Rosario Fernández (C=72, I=82, T=78)
UPDATE scores SET
  competence = 72, integrity = 82, transparency = 78,
  score_balanced = 77.1, score_merit = 75.6, score_integrity = 78.6
  WHERE candidate_id = '22222222-2222-2222-2222-222222220014';

-- 15. Roberto Chiabra (C=68, I=75, T=72)
UPDATE scores SET
  competence = 68, integrity = 75, transparency = 72,
  score_balanced = 71.5, score_merit = 70.5, score_integrity = 72.6
  WHERE candidate_id = '22222222-2222-2222-2222-222222220015';

-- 16. Ricardo Belmont (C=50, I=5, T=55) - 2 pending penal + civil + resignations
UPDATE scores SET
  competence = 50, integrity = 5, transparency = 55,
  score_balanced = 30.2, score_merit = 37.0, score_integrity = 23.5
  WHERE candidate_id = '22222222-2222-2222-2222-222222220016';

-- 17. Napoleón Becerra (C=49, I=72, T=65) - Sin título confirmado, dirigente sindical, sin cargo público
UPDATE scores SET
  competence = 49, integrity = 72, transparency = 65,
  score_balanced = 61.0, score_merit = 57.5, score_integrity = 64.4
  WHERE candidate_id = '22222222-2222-2222-2222-222222220017';

-- 18. Alex Gonzales (C=59, I=75, T=70) - Univ incompleta pero ex alcalde SJL (distrito más poblado)
UPDATE scores SET
  competence = 59, integrity = 75, transparency = 70,
  score_balanced = 67.3, score_merit = 64.9, score_integrity = 69.7
  WHERE candidate_id = '22222222-2222-2222-2222-222222220018';

-- 19. Charlie Carrasco (C=57, I=70, T=65) - Doctorado (F. Villarreal), profesor universitario titular
UPDATE scores SET
  competence = 57, integrity = 70, transparency = 65,
  score_balanced = 63.7, score_merit = 61.7, score_integrity = 65.6
  WHERE candidate_id = '22222222-2222-2222-2222-222222220019';

-- 20. Armando Massé (C=60, I=30, T=68) - 2 pending penal
UPDATE scores SET
  competence = 60, integrity = 30, transparency = 68,
  score_balanced = 47.3, score_merit = 51.8, score_integrity = 42.8
  WHERE candidate_id = '22222222-2222-2222-2222-222222220020';

-- 21. Wolfgang Grozo (C=66, I=74, T=68) - Gral Mayor FAP retirado, postgrados CAEN/CESEDEN, prof U. Lima
UPDATE scores SET
  competence = 66, integrity = 74, transparency = 68,
  score_balanced = 69.8, score_merit = 68.6, score_integrity = 71.0
  WHERE candidate_id = '22222222-2222-2222-2222-222222220021';

-- 22. Carlos Jaico (C=66, I=70, T=68) - Maestría + MBA (Suiza), Sec Gral Palacio, Cámara Comercio Suiza-Perú
UPDATE scores SET
  competence = 66, integrity = 70, transparency = 68,
  score_balanced = 68.0, score_merit = 67.4, score_integrity = 68.6
  WHERE candidate_id = '22222222-2222-2222-2222-222222220022';

-- 23. Alfonso López Chau (C=80, I=65, T=75) - Pending penal colusión UNI
UPDATE scores SET
  competence = 80, integrity = 65, transparency = 75,
  score_balanced = 72.8, score_merit = 75.0, score_integrity = 70.5
  WHERE candidate_id = '22222222-2222-2222-2222-222222220023';

-- 24. Ronald Atencio (C=55, I=72, T=65)
UPDATE scores SET
  competence = 55, integrity = 72, transparency = 65,
  score_balanced = 63.6, score_merit = 61.1, score_integrity = 66.2
  WHERE candidate_id = '22222222-2222-2222-2222-222222220024';

-- 25. Roberto Sánchez (C=70, I=30, T=70) - 2 pending penal (rebelión + org criminal)
UPDATE scores SET
  competence = 70, integrity = 30, transparency = 70,
  score_balanced = 52.0, score_merit = 58.0, score_integrity = 46.0
  WHERE candidate_id = '22222222-2222-2222-2222-222222220025';

-- 26. Rafael Belaúnde (C=65, I=78, T=72)
UPDATE scores SET
  competence = 65, integrity = 78, transparency = 72,
  score_balanced = 71.5, score_merit = 69.6, score_integrity = 73.5
  WHERE candidate_id = '22222222-2222-2222-2222-222222220026';

-- 27. Fernando Olivera (C=70, I=85, T=58) - Only 1 civil contractual
UPDATE scores SET
  competence = 70, integrity = 85, transparency = 58,
  score_balanced = 75.5, score_merit = 73.3, score_integrity = 77.8
  WHERE candidate_id = '22222222-2222-2222-2222-222222220027';

-- 28. Carlos Álvarez (C=38, I=72, T=68) - Secundaria completa
UPDATE scores SET
  competence = 38, integrity = 72, transparency = 68,
  score_balanced = 56.3, score_merit = 51.2, score_integrity = 61.4
  WHERE candidate_id = '22222222-2222-2222-2222-222222220028';

-- 29. Francisco Diez Canseco (C=75, I=80, T=78)
UPDATE scores SET
  competence = 75, integrity = 80, transparency = 78,
  score_balanced = 77.5, score_merit = 76.8, score_integrity = 78.3
  WHERE candidate_id = '22222222-2222-2222-2222-222222220029';

-- 30. Mario Vizcarra (C=43, I=15, T=65) - Ing Industrial UNI, pero condenado por peculado S/2.3M
UPDATE scores SET
  competence = 43, integrity = 15, transparency = 65,
  score_balanced = 32.6, score_merit = 36.8, score_integrity = 28.4
  WHERE candidate_id = '22222222-2222-2222-2222-222222220030';

-- 31. Walter Chirinos (C=49, I=68, T=62) - Contador (U. Telesup), cargo breve en MININTER, candidaturas fallidas
UPDATE scores SET
  competence = 49, integrity = 68, transparency = 62,
  score_balanced = 58.9, score_merit = 56.0, score_integrity = 61.7
  WHERE candidate_id = '22222222-2222-2222-2222-222222220031';

-- 32. José Luna Gálvez (C=70, I=5, T=45) - 3 pending penal + civil + resignations
UPDATE scores SET
  competence = 70, integrity = 5, transparency = 45,
  score_balanced = 38.2, score_merit = 48.0, score_integrity = 28.5
  WHERE candidate_id = '22222222-2222-2222-2222-222222220032';

-- 33. Paul Jaimes (C=55, I=72, T=68)
UPDATE scores SET
  competence = 55, integrity = 72, transparency = 68,
  score_balanced = 64.0, score_merit = 61.4, score_integrity = 66.5
  WHERE candidate_id = '22222222-2222-2222-2222-222222220033';

-- 34. Jorge Nieto (C=82, I=65, T=80) - Pending penal lavado Odebrecht juicio oral
UPDATE scores SET
  competence = 82, integrity = 65, transparency = 80,
  score_balanced = 74.2, score_merit = 76.7, score_integrity = 71.6
  WHERE candidate_id = '22222222-2222-2222-2222-222222220034';

-- 35. Enrique Valderrama (C=46, I=65, T=62) - Bachiller Derecho reciente (2022), cargos privados medios, 39 años
UPDATE scores SET
  competence = 46, integrity = 65, transparency = 62,
  score_balanced = 56.2, score_merit = 53.3, score_integrity = 59.0
  WHERE candidate_id = '22222222-2222-2222-2222-222222220035';

-- 36. Antonio Ortiz (C=43, I=70, T=65) - Sin educación verificada, empresario, ganó candidatura por sorteo
UPDATE scores SET
  competence = 43, integrity = 70, transparency = 65,
  score_balanced = 57.4, score_merit = 53.3, score_integrity = 61.4
  WHERE candidate_id = '22222222-2222-2222-2222-222222220036';

COMMIT;

-- ============================================
-- FIN DE LA MIGRACION 025
-- ============================================
