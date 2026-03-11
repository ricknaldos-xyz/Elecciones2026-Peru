-- ============================================
-- MIGRACION 026: Auditoría integral de los 5 pilares de scoring
-- Corrige: Competencia, Transparencia, Confianza, y recalcula scores de 4 pilares
-- Basado en: verificación JEE/JNE, hojas de vida, fuentes periodísticas
-- Fecha: 2026-03-11
-- ============================================

BEGIN;

-- ============================================
-- PASO 1: Correcciones de COMPETENCIA (C)
-- Verificado contra hojas de vida JNE, Wikipedia, Infobae, RPP
-- ============================================

-- Jorge Nieto: C=82→75
-- Razón: Doctorado INCOMPLETO en El Colegio de México (ABD, sin tesis),
-- ministerios brevísimos (Cultura 5 meses, Defensa 13 meses),
-- NUNCA elegido a cargo alguno, sin gestión de organizaciones grandes.
-- Fuentes: RPP hoja de vida, Andina, La República perfil
UPDATE scores SET competence = 75
  WHERE candidate_id = '22222222-2222-2222-2222-222222220034';

-- Roberto Sánchez: C=70→58
-- Razón: Psicólogo UNMSM, roles municipales medios (gerente social Huaral,
-- RRHH San Borja, admin Huaura), director admin MINSA, ministro MINCETUR
-- sin background relevante. Perfil claramente inferior a otros con C=70.
-- Fuentes: RPP perfil, Wikipedia
UPDATE scores SET competence = 58
  WHERE candidate_id = '22222222-2222-2222-2222-222222220025';

-- Rosario Fernández: C=72→77
-- Razón: Primera de su promoción PUCP (1979), Primera Ministra (mar-jul 2011),
-- Ministra de Justicia (2007-2009, 2010-2011), VP Bolsa de Valores de Lima,
-- Tesorera Colegio de Abogados, profesora PUCP. Infravalorada vs Pérez Tello (80).
-- Fuentes: Wikipedia, PUCP alumni, FHS Abogados CV
UPDATE scores SET competence = 77
  WHERE candidate_id = '22222222-2222-2222-2222-222222220014';

-- ============================================
-- PASO 2: Correcciones de TRANSPARENCIA (T)
-- Verificado contra resoluciones JEE, anotaciones marginales,
-- reportes periodísticos de omisiones en hojas de vida
-- ============================================

-- Keiko Fujimori: T=60→52
-- Razón: JEE aprobó anotación marginal por omitir participación en
-- Summit Products SAC (3,500 acciones) y Kyara29 EIRL (empresa de su hija).
-- También omitió S/45,597 de ingresos de 3ra categoría (detectado por JEE).
-- Declaró cero inmuebles viviendo en Surco.
-- Fuentes: El Búho, La República JEE, Infobae hoja de vida
UPDATE scores SET transparency = 52
  WHERE candidate_id = '22222222-2222-2222-2222-222222220002';

-- Rafael López Aliaga: T=70→55
-- Razón: JEE encontró "posible falsedad" en declaración.
-- Omitió participación en Peru Desarrollos Inmobiliarios SA-Pedein SA.
-- Omitió Peruval Corp SA sucursal Lima (debe S/12.9M a SUNAT).
-- Liquidó 3 propiedades + vehículo (USD 4.6M) antes de inscripción.
-- Deuda total empresas con SUNAT: S/28.4M.
-- Fuentes: Infobae, La República, N60 JEE, La Lupa SUNAT
UPDATE scores SET transparency = 55
  WHERE candidate_id = '22222222-2222-2222-2222-222222220003';

-- Fernando Olivera: T=58→63
-- Razón: Declaración completa (3 instituciones educativas, 3 propiedades
-- Lima valoradas en ~S/2M, 1 vehículo). NO fue flaggeado por JEE entre
-- los 16 candidatos con omisiones. Único punto débil: declaró cero ingresos.
-- Fuentes: Infobae hoja de vida, La República lista JEE
UPDATE scores SET transparency = 63
  WHERE candidate_id = '22222222-2222-2222-2222-222222220027';

-- José Luna Gálvez: T=45→55
-- Razón: Declaración extremadamente detallada: S/11.4M ingresos,
-- 15 propiedades, 12 vehículos valorados en S/31M total.
-- NO fue flaggeado por JEE entre los 16 con omisiones.
-- T=45 penaliza excesivamente. Su problema es integridad (I=5), no transparencia.
-- Fuentes: La República ingresos candidatos, La República lista JEE
UPDATE scores SET transparency = 55
  WHERE candidate_id = '22222222-2222-2222-2222-222222220032';

-- ============================================
-- PASO 3: Corrección de CONFIANZA (D)
-- ============================================

-- Roberto Sánchez: D=72→65
-- Razón: Datos menos verificados tras revisión de competencia.
-- Perfil municipal medio con fuentes limitadas.
UPDATE scores SET confidence = 65
  WHERE candidate_id = '22222222-2222-2222-2222-222222220025';

-- ============================================
-- PASO 4: Recalcular scores ponderados de 3 PILARES
-- para los 7 candidatos modificados
-- Formula: balanced=0.45C+0.45I+0.10T, merit=0.60C+0.30I+0.10T, integrity=0.30C+0.60I+0.10T
-- ============================================

-- Jorge Nieto (C=75, I=65, T=80)
-- balanced = 33.75 + 29.25 + 8.0 = 71.0
-- merit = 45.0 + 19.5 + 8.0 = 72.5
-- integrity = 22.5 + 39.0 + 8.0 = 69.5
UPDATE scores SET
  score_balanced = 71.0, score_merit = 72.5, score_integrity = 69.5
  WHERE candidate_id = '22222222-2222-2222-2222-222222220034';

-- Roberto Sánchez (C=58, I=30, T=70)
-- balanced = 26.1 + 13.5 + 7.0 = 46.6
-- merit = 34.8 + 9.0 + 7.0 = 50.8
-- integrity = 17.4 + 18.0 + 7.0 = 42.4
UPDATE scores SET
  score_balanced = 46.6, score_merit = 50.8, score_integrity = 42.4
  WHERE candidate_id = '22222222-2222-2222-2222-222222220025';

-- Rosario Fernández (C=77, I=82, T=78)
-- balanced = 34.65 + 36.9 + 7.8 = 79.35 ≈ 79.3
-- merit = 46.2 + 24.6 + 7.8 = 78.6
-- integrity = 23.1 + 49.2 + 7.8 = 80.1
UPDATE scores SET
  score_balanced = 79.3, score_merit = 78.6, score_integrity = 80.1
  WHERE candidate_id = '22222222-2222-2222-2222-222222220014';

-- Keiko Fujimori (C=70, I=30, T=52)
-- balanced = 31.5 + 13.5 + 5.2 = 50.2
-- merit = 42.0 + 9.0 + 5.2 = 56.2
-- integrity = 21.0 + 18.0 + 5.2 = 44.2
UPDATE scores SET
  score_balanced = 50.2, score_merit = 56.2, score_integrity = 44.2
  WHERE candidate_id = '22222222-2222-2222-2222-222222220002';

-- Rafael López Aliaga (C=78, I=40, T=55)
-- balanced = 35.1 + 18.0 + 5.5 = 58.6
-- merit = 46.8 + 12.0 + 5.5 = 64.3
-- integrity = 23.4 + 24.0 + 5.5 = 52.9
UPDATE scores SET
  score_balanced = 58.6, score_merit = 64.3, score_integrity = 52.9
  WHERE candidate_id = '22222222-2222-2222-2222-222222220003';

-- Fernando Olivera (C=70, I=85, T=63)
-- balanced = 31.5 + 38.25 + 6.3 = 76.05 ≈ 76.0
-- merit = 42.0 + 25.5 + 6.3 = 73.8
-- integrity = 21.0 + 51.0 + 6.3 = 78.3
UPDATE scores SET
  score_balanced = 76.0, score_merit = 73.8, score_integrity = 78.3
  WHERE candidate_id = '22222222-2222-2222-2222-222222220027';

-- José Luna Gálvez (C=70, I=5, T=55)
-- balanced = 31.5 + 2.25 + 5.5 = 39.25 ≈ 39.2
-- merit = 42.0 + 1.5 + 5.5 = 49.0
-- integrity = 21.0 + 3.0 + 5.5 = 29.5
UPDATE scores SET
  score_balanced = 39.2, score_merit = 49.0, score_integrity = 29.5
  WHERE candidate_id = '22222222-2222-2222-2222-222222220032';

-- ============================================
-- PASO 5: Recalcular scores de 4 PILARES para TODOS los presidenciales
-- Usa plan_viability existente en la BD
-- Pesos presidente: balanced=0.30C+0.30I+0.10T+0.30P
--                   merit=0.40C+0.25I+0.10T+0.25P
--                   integrity=0.25C+0.40I+0.10T+0.25P
-- ============================================

UPDATE scores SET
  score_balanced_p = ROUND((0.30 * competence + 0.30 * integrity + 0.10 * transparency + 0.30 * plan_viability)::numeric, 1),
  score_merit_p = ROUND((0.40 * competence + 0.25 * integrity + 0.10 * transparency + 0.25 * plan_viability)::numeric, 1),
  score_integrity_p = ROUND((0.25 * competence + 0.40 * integrity + 0.10 * transparency + 0.25 * plan_viability)::numeric, 1)
WHERE candidate_id IN (
  SELECT id FROM candidates WHERE cargo = 'presidente' AND is_active = true
)
AND plan_viability IS NOT NULL;

COMMIT;

-- ============================================
-- FIN DE LA MIGRACION 026
-- ============================================
