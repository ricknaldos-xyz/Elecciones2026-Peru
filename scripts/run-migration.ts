import { neon } from '@neondatabase/serverless'

const DATABASE_URL = 'postgresql://neondb_owner:npg_QsCV8j4rFmiW@ep-polished-mouse-ahxxvvbh-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require'

async function runMigration() {
  const sql = neon(DATABASE_URL)

  console.log('Starting migration: 36 Real Presidential Candidates 2026\n')

  // Step 1: Clean ALL data properly
  console.log('Step 1: Cleaning ALL existing data...')
  try {
    await sql`DELETE FROM flags`
    await sql`DELETE FROM score_breakdowns`
    await sql`DELETE FROM scores`
    await sql`DELETE FROM candidates`
    await sql`DELETE FROM parties`
    console.log('  All data cleaned')
  } catch (e: any) {
    console.log('  Warning:', e.message)
  }

  // Step 2: Insert parties
  console.log('\nStep 2: Inserting 36 parties...')
  try {
    await sql`INSERT INTO parties (id, name, short_name, color) VALUES
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
      ('11111111-1111-1111-1111-111111111017', 'Partido de los Trabajadores', 'PTE', '#DC2626'),
      ('11111111-1111-1111-1111-111111111018', 'Partido Demócrata Verde', 'PDV', '#22C55E')`

    await sql`INSERT INTO parties (id, name, short_name, color) VALUES
      ('11111111-1111-1111-1111-111111111019', 'Partido Demócrata Unido', 'PDUP', '#3B82F6'),
      ('11111111-1111-1111-1111-111111111020', 'Partido Democrático Federal', 'PDF', '#8B5CF6'),
      ('11111111-1111-1111-1111-111111111021', 'Integridad Democrática', 'ID', '#14B8A6'),
      ('11111111-1111-1111-1111-111111111022', 'Partido Perú Moderno', 'PPM', '#F97316'),
      ('11111111-1111-1111-1111-111111111023', 'Ahora Nación', 'AN', '#EF4444'),
      ('11111111-1111-1111-1111-111111111024', 'Alianza Venceremos', 'AV', '#10B981'),
      ('11111111-1111-1111-1111-111111111025', 'Juntos por el Perú', 'JPP', '#F43F5E'),
      ('11111111-1111-1111-1111-111111111026', 'Partido Libertad Popular', 'PLP', '#0D9488'),
      ('11111111-1111-1111-1111-111111111027', 'Frente de la Esperanza', 'FE21', '#A855F7'),
      ('11111111-1111-1111-1111-111111111028', 'País para Todos', 'PPT', '#06B6D4'),
      ('11111111-1111-1111-1111-111111111029', 'Perú Acción', 'PA', '#84CC16'),
      ('11111111-1111-1111-1111-111111111030', 'Perú Primero', 'PP', '#F472B6'),
      ('11111111-1111-1111-1111-111111111031', 'PRIN', 'PRIN', '#78716C'),
      ('11111111-1111-1111-1111-111111111032', 'Podemos Perú', 'PODE', '#EC4899'),
      ('11111111-1111-1111-1111-111111111033', 'Progresemos', 'PROG', '#6EE7B7'),
      ('11111111-1111-1111-1111-111111111034', 'Partido del Buen Gobierno', 'PBG', '#FBBF24'),
      ('11111111-1111-1111-1111-111111111035', 'Partido Aprista Peruano', 'APRA', '#DC2626'),
      ('11111111-1111-1111-1111-111111111036', 'Salvemos al Perú', 'SAP', '#2563EB')`

    const partyCount = await sql`SELECT COUNT(*) as total FROM parties`
    console.log('  Inserted', partyCount[0].total, 'parties')
  } catch (e: any) {
    console.error('  Error:', e.message)
  }

  // Step 3: Insert 36 presidential candidates
  console.log('\nStep 3: Inserting 36 presidential candidates...')
  try {
    await sql`INSERT INTO candidates (id, slug, full_name, cargo, party_id, education_level) VALUES
      ('22222222-2222-2222-2222-222222220001', 'cesar-acuna', 'César Acuña Peralta', 'presidente', '11111111-1111-1111-1111-111111111001', 'Doctorado'),
      ('22222222-2222-2222-2222-222222220002', 'keiko-fujimori', 'Keiko Sofía Fujimori Higuchi', 'presidente', '11111111-1111-1111-1111-111111111002', 'Maestría'),
      ('22222222-2222-2222-2222-222222220003', 'rafael-lopez-aliaga', 'Rafael López Aliaga Cazorla', 'presidente', '11111111-1111-1111-1111-111111111003', 'Título profesional'),
      ('22222222-2222-2222-2222-222222220004', 'george-forsyth', 'George Patrick Forsyth Sommer', 'presidente', '11111111-1111-1111-1111-111111111004', 'Universitario incompleto'),
      ('22222222-2222-2222-2222-222222220005', 'vladimir-cerron', 'Vladimir Roy Cerrón Rojas', 'presidente', '11111111-1111-1111-1111-111111111005', 'Título profesional'),
      ('22222222-2222-2222-2222-222222220006', 'marisol-perez-tello', 'Marisol Pérez Tello', 'presidente', '11111111-1111-1111-1111-111111111006', 'Título profesional'),
      ('22222222-2222-2222-2222-222222220007', 'jose-williams', 'José Williams Zapata', 'presidente', '11111111-1111-1111-1111-111111111007', 'Maestría'),
      ('22222222-2222-2222-2222-222222220008', 'yonhy-lescano', 'Yonhy Lescano Ancieta', 'presidente', '11111111-1111-1111-1111-111111111008', 'Título profesional'),
      ('22222222-2222-2222-2222-222222220009', 'mesias-guevara', 'Mesías Guevara Amasifuén', 'presidente', '11111111-1111-1111-1111-111111111009', 'Título profesional'),
      ('22222222-2222-2222-2222-222222220010', 'fiorella-molinelli', 'Fiorella Molinelli Aristondo', 'presidente', '11111111-1111-1111-1111-111111111010', 'Maestría'),
      ('22222222-2222-2222-2222-222222220011', 'alvaro-paz-de-la-barra', 'Álvaro Paz de la Barra', 'presidente', '11111111-1111-1111-1111-111111111011', 'Título profesional'),
      ('22222222-2222-2222-2222-222222220012', 'herbert-caller', 'Herbert Caller Valverde', 'presidente', '11111111-1111-1111-1111-111111111012', 'Título profesional'),
      ('22222222-2222-2222-2222-222222220013', 'carlos-espa', 'Carlos Espá Vega', 'presidente', '11111111-1111-1111-1111-111111111013', 'Título profesional'),
      ('22222222-2222-2222-2222-222222220014', 'rosario-fernandez', 'Rosario Fernández Figueroa', 'presidente', '11111111-1111-1111-1111-111111111014', 'Título profesional'),
      ('22222222-2222-2222-2222-222222220015', 'roberto-chiabra', 'Roberto Chiabra León', 'presidente', '11111111-1111-1111-1111-111111111015', 'Maestría'),
      ('22222222-2222-2222-2222-222222220016', 'ricardo-belmont', 'Ricardo Belmont Cassinelli', 'presidente', '11111111-1111-1111-1111-111111111016', 'Secundaria completa'),
      ('22222222-2222-2222-2222-222222220017', 'napoleon-becerra', 'Napoleón Becerra Calderón', 'presidente', '11111111-1111-1111-1111-111111111017', 'Título profesional'),
      ('22222222-2222-2222-2222-222222220018', 'alex-gonzales', 'Alex Gonzales Castillo', 'presidente', '11111111-1111-1111-1111-111111111018', 'Título profesional')`

    await sql`INSERT INTO candidates (id, slug, full_name, cargo, party_id, education_level) VALUES
      ('22222222-2222-2222-2222-222222220019', 'charlie-carrasco', 'Charlie Carrasco Chacón', 'presidente', '11111111-1111-1111-1111-111111111019', 'Título profesional'),
      ('22222222-2222-2222-2222-222222220020', 'armando-masse', 'Armando Massé Fernández', 'presidente', '11111111-1111-1111-1111-111111111020', 'Título profesional'),
      ('22222222-2222-2222-2222-222222220021', 'wolfgang-grozo', 'Wolfgang Grozo Horna', 'presidente', '11111111-1111-1111-1111-111111111021', 'Título profesional'),
      ('22222222-2222-2222-2222-222222220022', 'carlos-jaico', 'Carlos Jaico Carranza', 'presidente', '11111111-1111-1111-1111-111111111022', 'Título profesional'),
      ('22222222-2222-2222-2222-222222220023', 'alfonso-lopez-chau', 'Alfonso López Chau Nava', 'presidente', '11111111-1111-1111-1111-111111111023', 'Doctorado'),
      ('22222222-2222-2222-2222-222222220024', 'ronald-atencio', 'Ronald Atencio Sosa', 'presidente', '11111111-1111-1111-1111-111111111024', 'Título profesional'),
      ('22222222-2222-2222-2222-222222220025', 'roberto-sanchez', 'Roberto Sánchez Palomino', 'presidente', '11111111-1111-1111-1111-111111111025', 'Maestría'),
      ('22222222-2222-2222-2222-222222220026', 'rafael-belaunde', 'Rafael Belaunde Aubry', 'presidente', '11111111-1111-1111-1111-111111111026', 'Título profesional'),
      ('22222222-2222-2222-2222-222222220027', 'fernando-olivera', 'Fernando Olivera Vega', 'presidente', '11111111-1111-1111-1111-111111111027', 'Título profesional'),
      ('22222222-2222-2222-2222-222222220028', 'carlos-alvarez', 'Carlos Álvarez Sánchez', 'presidente', '11111111-1111-1111-1111-111111111028', 'Título profesional'),
      ('22222222-2222-2222-2222-222222220029', 'francisco-diez-canseco', 'Francisco Diez Canseco Terry', 'presidente', '11111111-1111-1111-1111-111111111029', 'Maestría'),
      ('22222222-2222-2222-2222-222222220030', 'mario-vizcarra', 'Mario Vizcarra Andrade', 'presidente', '11111111-1111-1111-1111-111111111030', 'Título profesional'),
      ('22222222-2222-2222-2222-222222220031', 'walter-chirinos', 'Walter Chirinos Sánchez', 'presidente', '11111111-1111-1111-1111-111111111031', 'Título profesional'),
      ('22222222-2222-2222-2222-222222220032', 'jose-luna-galvez', 'José Luna Gálvez', 'presidente', '11111111-1111-1111-1111-111111111032', 'Doctorado'),
      ('22222222-2222-2222-2222-222222220033', 'paul-jaimes', 'Paul Jaimes Herrera', 'presidente', '11111111-1111-1111-1111-111111111033', 'Título profesional'),
      ('22222222-2222-2222-2222-222222220034', 'jorge-nieto', 'Jorge Nieto Montesinos', 'presidente', '11111111-1111-1111-1111-111111111034', 'Doctorado'),
      ('22222222-2222-2222-2222-222222220035', 'enrique-valderrama', 'Enrique Valderrama Herrera', 'presidente', '11111111-1111-1111-1111-111111111035', 'Título profesional'),
      ('22222222-2222-2222-2222-222222220036', 'antonio-ortiz', 'Antonio Ortiz Silva', 'presidente', '11111111-1111-1111-1111-111111111036', 'Título profesional')`

    const presCount = await sql`SELECT COUNT(*) as total FROM candidates WHERE cargo = 'presidente'`
    console.log('  Inserted', presCount[0].total, 'presidential candidates')
  } catch (e: any) {
    console.error('  Error:', e.message)
  }

  // Step 4: Insert scores
  console.log('\nStep 4: Inserting scores...')
  try {
    await sql`INSERT INTO scores (candidate_id, competence, integrity, transparency, confidence, score_balanced, score_merit, score_integrity) VALUES
      ('22222222-2222-2222-2222-222222220001', 75, 55, 70, 75, 65.8, 69.0, 62.6),
      ('22222222-2222-2222-2222-222222220002', 72, 35, 60, 80, 53.1, 59.4, 46.8),
      ('22222222-2222-2222-2222-222222220003', 78, 72, 70, 75, 72.8, 74.4, 71.2),
      ('22222222-2222-2222-2222-222222220004', 48, 78, 72, 72, 65.2, 58.4, 72.0),
      ('22222222-2222-2222-2222-222222220005', 70, 10, 35, 60, 35.5, 46.5, 24.5),
      ('22222222-2222-2222-2222-222222220006', 82, 92, 88, 85, 87.8, 86.4, 89.2),
      ('22222222-2222-2222-2222-222222220007', 70, 80, 75, 78, 75.5, 73.5, 77.5),
      ('22222222-2222-2222-2222-222222220008', 65, 70, 72, 75, 69.1, 67.6, 70.6),
      ('22222222-2222-2222-2222-222222220009', 68, 75, 70, 72, 71.3, 70.1, 72.5),
      ('22222222-2222-2222-2222-222222220010', 76, 78, 80, 75, 78.0, 77.2, 78.8),
      ('22222222-2222-2222-2222-222222220011', 60, 65, 62, 68, 62.5, 61.5, 63.5),
      ('22222222-2222-2222-2222-222222220012', 55, 70, 65, 60, 63.5, 60.5, 66.5),
      ('22222222-2222-2222-2222-222222220013', 58, 72, 68, 62, 66.2, 63.4, 69.0),
      ('22222222-2222-2222-2222-222222220014', 72, 82, 78, 75, 77.6, 75.8, 79.4),
      ('22222222-2222-2222-2222-222222220015', 68, 75, 72, 75, 71.8, 70.4, 73.2),
      ('22222222-2222-2222-2222-222222220016', 45, 60, 55, 70, 53.0, 50.0, 56.0),
      ('22222222-2222-2222-2222-222222220017', 58, 72, 65, 60, 65.3, 62.5, 68.1),
      ('22222222-2222-2222-2222-222222220018', 55, 75, 70, 58, 67.0, 62.5, 71.5)`

    await sql`INSERT INTO scores (candidate_id, competence, integrity, transparency, confidence, score_balanced, score_merit, score_integrity) VALUES
      ('22222222-2222-2222-2222-222222220019', 52, 70, 65, 55, 62.5, 58.9, 66.1),
      ('22222222-2222-2222-2222-222222220020', 60, 72, 68, 62, 66.8, 64.4, 69.2),
      ('22222222-2222-2222-2222-222222220021', 56, 74, 68, 60, 66.2, 62.8, 69.6),
      ('22222222-2222-2222-2222-222222220022', 62, 70, 68, 65, 66.6, 65.2, 68.0),
      ('22222222-2222-2222-2222-222222220023', 80, 78, 75, 72, 77.5, 78.0, 77.0),
      ('22222222-2222-2222-2222-222222220024', 55, 72, 65, 58, 64.3, 61.1, 67.5),
      ('22222222-2222-2222-2222-222222220025', 70, 65, 70, 72, 67.5, 68.5, 66.5),
      ('22222222-2222-2222-2222-222222220026', 65, 78, 72, 70, 72.0, 69.6, 74.4),
      ('22222222-2222-2222-2222-222222220027', 62, 55, 58, 75, 57.5, 58.9, 56.1),
      ('22222222-2222-2222-2222-222222220028', 58, 72, 68, 60, 66.2, 63.4, 69.0),
      ('22222222-2222-2222-2222-222222220029', 75, 80, 78, 75, 77.8, 76.8, 78.8),
      ('22222222-2222-2222-2222-222222220030', 55, 70, 65, 58, 63.5, 60.5, 66.5),
      ('22222222-2222-2222-2222-222222220031', 52, 68, 62, 55, 60.8, 57.6, 64.0),
      ('22222222-2222-2222-2222-222222220032', 70, 30, 45, 75, 45.5, 53.5, 37.5),
      ('22222222-2222-2222-2222-222222220033', 55, 72, 68, 58, 65.3, 62.1, 68.5),
      ('22222222-2222-2222-2222-222222220034', 82, 85, 80, 78, 82.5, 82.0, 83.0),
      ('22222222-2222-2222-2222-222222220035', 58, 65, 62, 60, 61.5, 60.1, 62.9),
      ('22222222-2222-2222-2222-222222220036', 52, 70, 65, 55, 62.5, 58.9, 66.1)`
    console.log('  Inserted scores')
  } catch (e: any) {
    console.error('  Error:', e.message)
  }

  // Step 5: Insert vicepresidents
  console.log('\nStep 5: Inserting 8 vicepresidents...')
  try {
    await sql`INSERT INTO candidates (id, slug, full_name, cargo, party_id, education_level) VALUES
      ('33333333-3333-3333-3333-333333330001', 'jessica-tumi', 'Jessica Tumi Rivas', 'vicepresidente', '11111111-1111-1111-1111-111111111001', 'Título profesional'),
      ('33333333-3333-3333-3333-333333330002', 'alejandro-soto', 'Alejandro Soto Reyes', 'vicepresidente', '11111111-1111-1111-1111-111111111001', 'Título profesional'),
      ('33333333-3333-3333-3333-333333330003', 'luis-galarreta', 'Luis Galarreta Velarde', 'vicepresidente', '11111111-1111-1111-1111-111111111002', 'Título profesional'),
      ('33333333-3333-3333-3333-333333330004', 'miguel-torres', 'Miguel Torres Morales', 'vicepresidente', '11111111-1111-1111-1111-111111111002', 'Título profesional'),
      ('33333333-3333-3333-3333-333333330005', 'norma-yarrow', 'Norma Yarrow Lumbreras', 'vicepresidente', '11111111-1111-1111-1111-111111111003', 'Título profesional'),
      ('33333333-3333-3333-3333-333333330006', 'jhon-ramos', 'Jhon Ramos Malpica', 'vicepresidente', '11111111-1111-1111-1111-111111111003', 'Título profesional'),
      ('33333333-3333-3333-3333-333333330007', 'johanna-lozada', 'Johanna Lozada Baldwin', 'vicepresidente', '11111111-1111-1111-1111-111111111004', 'Título profesional'),
      ('33333333-3333-3333-3333-333333330008', 'herbe-olave', 'Herbe Olave Ugarte', 'vicepresidente', '11111111-1111-1111-1111-111111111004', 'Título profesional')`

    await sql`INSERT INTO scores (candidate_id, competence, integrity, transparency, confidence, score_balanced, score_merit, score_integrity) VALUES
      ('33333333-3333-3333-3333-333333330001', 65, 75, 70, 68, 70.0, 68.0, 72.0),
      ('33333333-3333-3333-3333-333333330002', 68, 72, 70, 70, 70.0, 69.2, 70.8),
      ('33333333-3333-3333-3333-333333330003', 65, 60, 62, 75, 62.0, 63.0, 61.0),
      ('33333333-3333-3333-3333-333333330004', 70, 65, 68, 78, 67.0, 68.0, 66.0),
      ('33333333-3333-3333-3333-333333330005', 62, 70, 68, 72, 66.8, 64.8, 68.8),
      ('33333333-3333-3333-3333-333333330006', 58, 75, 70, 65, 68.0, 64.4, 71.6),
      ('33333333-3333-3333-3333-333333330007', 60, 78, 72, 68, 70.2, 66.6, 73.8),
      ('33333333-3333-3333-3333-333333330008', 62, 80, 75, 70, 72.8, 69.2, 76.4)`

    const vpCount = await sql`SELECT COUNT(*) as total FROM candidates WHERE cargo = 'vicepresidente'`
    console.log('  Inserted', vpCount[0].total, 'vicepresidents')
  } catch (e: any) {
    console.error('  Error:', e.message)
  }

  // Step 6: Insert flags
  console.log('\nStep 6: Inserting verified flags...')
  try {
    await sql`INSERT INTO flags (candidate_id, type, severity, title, description, source, is_verified) VALUES
      ('22222222-2222-2222-2222-222222220005', 'PENAL_SENTENCE', 'RED', 'Prófugo de la justicia',
       'Prisión preventiva 24 meses por caso Los Dinámicos del Centro. Clandestino desde octubre 2023.',
       'Infobae', TRUE)`

    await sql`INSERT INTO flags (candidate_id, type, severity, title, description, source, is_verified) VALUES
      ('22222222-2222-2222-2222-222222220002', 'PENAL_SENTENCE', 'RED', 'Juicio por lavado de activos',
       'Caso Cócteles - Odebrecht. Fiscalía solicita 35 años de prisión.',
       'France24', TRUE)`

    await sql`INSERT INTO flags (candidate_id, type, severity, title, description, source, is_verified) VALUES
      ('22222222-2222-2222-2222-222222220001', 'ALIMENTOS', 'AMBER', 'Sentencia pensión alimentos',
       'Sentencia ordena pago S/90,000 mensuales a hijo en Suiza.',
       'El Comercio', TRUE)`

    await sql`INSERT INTO flags (candidate_id, type, severity, title, description, source, is_verified) VALUES
      ('22222222-2222-2222-2222-222222220032', 'PENAL_SENTENCE', 'RED', 'Investigación org. criminal',
       'Investigación por presunta org. criminal - Universidad Telesup.',
       'Min. Público', TRUE)`

    await sql`INSERT INTO flags (candidate_id, type, severity, title, description, source, is_verified) VALUES
      ('22222222-2222-2222-2222-222222220027', 'OTHER', 'AMBER', 'Controversias como ministro',
       'Controversias durante gestión como Ministro de Justicia.',
       'Varios', TRUE)`

    const flagCount = await sql`SELECT COUNT(*) as total FROM flags`
    console.log('  Inserted', flagCount[0].total, 'flags')
  } catch (e: any) {
    console.error('  Error:', e.message)
  }

  // Final verification
  console.log('\n========== VERIFICATION ==========')

  const totalCandidates = await sql`SELECT COUNT(*) as total FROM candidates`
  console.log('Total candidates:', totalCandidates[0].total)

  const byCargoResult = await sql`SELECT cargo, COUNT(*) as total FROM candidates GROUP BY cargo ORDER BY total DESC`
  console.log('\nBy cargo:')
  for (const row of byCargoResult) {
    console.log(' ', row.cargo + ':', row.total)
  }

  const partyCount = await sql`SELECT COUNT(*) as total FROM parties`
  console.log('\nTotal parties:', partyCount[0].total)

  const flagCount = await sql`SELECT COUNT(*) as total FROM flags`
  console.log('Total flags:', flagCount[0].total)

  const topCandidates = await sql`
    SELECT c.full_name, s.score_balanced
    FROM candidates c
    JOIN scores s ON c.id = s.candidate_id
    WHERE c.cargo = 'presidente'
    ORDER BY s.score_balanced DESC
    LIMIT 5`
  console.log('\nTop 5 presidential candidates by score:')
  for (const row of topCandidates) {
    console.log(' ', row.full_name + ':', row.score_balanced)
  }

  console.log('\n========== MIGRATION COMPLETE ==========')
}

runMigration().catch(console.error)
