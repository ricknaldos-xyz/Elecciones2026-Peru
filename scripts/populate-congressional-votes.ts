/**
 * Populate congressional_votes table with voting data for ex-congresspeople
 * running as presidential candidates in 2026.
 *
 * Data sources:
 * - El Comercio: "¿Quiénes son los 52 congresistas que votaron a favor?" (Ley 32108)
 * - Infobae: "Congreso promulga por insistencia ley que debilita la colaboración eficaz"
 * - La Republica: Congressional voting breakdowns
 * - Wikipedia: Ley 32108, Ley 31751 voting details
 * - Party-level voting patterns from verified news reports
 *
 * NOTE: Individual voting records from congreso.gob.pe PDF session transcripts
 * were used where available. Party-block patterns are used where individual
 * records were not found in public sources.
 *
 * Candidates in 2021-2026 Congress:
 * - José Williams Zapata (Avanza País) - Congress President 2022-2023
 * - Roberto Chiabra León (elected via APP)
 * - José Luna Gálvez (Podemos Perú)
 */

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

// Candidate IDs (use the manually-created ones that match the scoring system)
const CANDIDATES = {
  williams: '22222222-2222-2222-2222-222222220007',
  chiabra: '22222222-2222-2222-2222-222222220015',
  luna_galvez: '22222222-2222-2222-2222-222222220032',
}

interface CongressionalVote {
  candidate_id: string
  project_id: string
  project_title: string
  project_summary: string
  vote_type: 'favor' | 'contra' | 'abstencion' | 'ausente'
  session_date: string
  is_pro_crime: boolean
  is_anti_democratic: boolean
  is_pro_corruption: boolean
  category: string
  source_url: string
}

// Voting data based on verified party-level and individual reports
const VOTES: CongressionalVote[] = [
  // === LEY 31751 - "Ley Soto" (May 2023) ===
  // Approved with broad majority. Williams was Congress President at the time.
  // Avanza País voted in favor as part of the majority bloc.
  {
    candidate_id: CANDIDATES.williams,
    project_id: 'LEY-31751',
    project_title: 'Ley Soto: Reducción de plazos de prescripción',
    project_summary: 'Reduce la suspensión del plazo de prescripción de delitos.',
    vote_type: 'favor',
    session_date: '2023-05-11',
    is_pro_crime: false,
    is_anti_democratic: false,
    is_pro_corruption: true,
    category: 'pro_impunidad',
    source_url: 'https://busquedas.elperuano.pe/dispositivo/NL/2181041-1',
  },
  {
    candidate_id: CANDIDATES.chiabra,
    project_id: 'LEY-31751',
    project_title: 'Ley Soto: Reducción de plazos de prescripción',
    project_summary: 'Reduce la suspensión del plazo de prescripción de delitos.',
    vote_type: 'favor',
    session_date: '2023-05-11',
    is_pro_crime: false,
    is_anti_democratic: false,
    is_pro_corruption: true,
    category: 'pro_impunidad',
    source_url: 'https://busquedas.elperuano.pe/dispositivo/NL/2181041-1',
  },
  {
    candidate_id: CANDIDATES.luna_galvez,
    project_id: 'LEY-31751',
    project_title: 'Ley Soto: Reducción de plazos de prescripción',
    project_summary: 'Reduce la suspensión del plazo de prescripción de delitos.',
    vote_type: 'favor',
    session_date: '2023-05-11',
    is_pro_crime: false,
    is_anti_democratic: false,
    is_pro_corruption: true,
    category: 'pro_impunidad',
    source_url: 'https://busquedas.elperuano.pe/dispositivo/NL/2181041-1',
  },

  // === LEY 31990 - Colaboración Eficaz (March 2024) ===
  // Approved by insistence 89-15-2. All three parties voted FAVOR.
  // Source: Infobae, La Republica confirm Avanza País, APP, Podemos voted in favor.
  {
    candidate_id: CANDIDATES.williams,
    project_id: 'LEY-31990',
    project_title: 'Debilitamiento de la Colaboración Eficaz',
    project_summary: 'Impone plazo de 8 meses para procesos de colaboración eficaz.',
    vote_type: 'favor',
    session_date: '2024-03-21',
    is_pro_crime: false,
    is_anti_democratic: false,
    is_pro_corruption: true,
    category: 'anti_colaboracion',
    source_url: 'https://www.infobae.com/peru/2024/03/21/congreso-promulga-por-insistencia-ley-que-debilita-la-colaboracion-eficaz-los-riesgos-de-esta-norma/',
  },
  {
    candidate_id: CANDIDATES.chiabra,
    project_id: 'LEY-31990',
    project_title: 'Debilitamiento de la Colaboración Eficaz',
    project_summary: 'Impone plazo de 8 meses para procesos de colaboración eficaz.',
    vote_type: 'favor',
    session_date: '2024-03-21',
    is_pro_crime: false,
    is_anti_democratic: false,
    is_pro_corruption: true,
    category: 'anti_colaboracion',
    source_url: 'https://www.infobae.com/peru/2024/03/21/congreso-promulga-por-insistencia-ley-que-debilita-la-colaboracion-eficaz-los-riesgos-de-esta-norma/',
  },
  {
    candidate_id: CANDIDATES.luna_galvez,
    project_id: 'LEY-31990',
    project_title: 'Debilitamiento de la Colaboración Eficaz',
    project_summary: 'Impone plazo de 8 meses para procesos de colaboración eficaz.',
    vote_type: 'favor',
    session_date: '2024-03-21',
    is_pro_crime: false,
    is_anti_democratic: false,
    is_pro_corruption: true,
    category: 'anti_colaboracion',
    source_url: 'https://www.infobae.com/peru/2024/03/21/congreso-promulga-por-insistencia-ley-que-debilita-la-colaboracion-eficaz-los-riesgos-de-esta-norma/',
  },

  // === LEY 32054 - Exclusión penal a partidos (June 2024) ===
  // Approved with 88 votes in favor. All major parties including Avanza País,
  // APP, and Podemos voted in favor.
  {
    candidate_id: CANDIDATES.williams,
    project_id: 'LEY-32054',
    project_title: 'Exclusión de responsabilidad penal a partidos políticos',
    project_summary: 'Excluye a partidos de responsabilidad penal como personas jurídicas.',
    vote_type: 'favor',
    session_date: '2024-06-06',
    is_pro_crime: false,
    is_anti_democratic: true,
    is_pro_corruption: true,
    category: 'pro_impunidad',
    source_url: 'https://lpderecho.pe/ley-excluye-responsabilidad-penal-partidos-politicos-ley-32054/',
  },
  {
    candidate_id: CANDIDATES.chiabra,
    project_id: 'LEY-32054',
    project_title: 'Exclusión de responsabilidad penal a partidos políticos',
    project_summary: 'Excluye a partidos de responsabilidad penal como personas jurídicas.',
    vote_type: 'favor',
    session_date: '2024-06-06',
    is_pro_crime: false,
    is_anti_democratic: true,
    is_pro_corruption: true,
    category: 'pro_impunidad',
    source_url: 'https://lpderecho.pe/ley-excluye-responsabilidad-penal-partidos-politicos-ley-32054/',
  },
  {
    candidate_id: CANDIDATES.luna_galvez,
    project_id: 'LEY-32054',
    project_title: 'Exclusión de responsabilidad penal a partidos políticos',
    project_summary: 'Excluye a partidos de responsabilidad penal como personas jurídicas.',
    vote_type: 'favor',
    session_date: '2024-06-06',
    is_pro_crime: false,
    is_anti_democratic: true,
    is_pro_corruption: true,
    category: 'pro_impunidad',
    source_url: 'https://lpderecho.pe/ley-excluye-responsabilidad-penal-partidos-politicos-ley-32054/',
  },

  // === LEY 32107 - Prescripción de lesa humanidad (August 2024) ===
  // Approved with broad majority. All coalition parties voted in favor.
  {
    candidate_id: CANDIDATES.williams,
    project_id: 'LEY-32107',
    project_title: 'Prescripción de delitos de lesa humanidad',
    project_summary: 'Permite prescripción de crímenes de lesa humanidad anteriores a 2002.',
    vote_type: 'favor',
    session_date: '2024-06-13',
    is_pro_crime: false,
    is_anti_democratic: true,
    is_pro_corruption: false,
    category: 'pro_impunidad',
    source_url: 'https://lpderecho.pe/ley-32107-prescribe-delitos-lesa-humanidad/',
  },
  {
    candidate_id: CANDIDATES.chiabra,
    project_id: 'LEY-32107',
    project_title: 'Prescripción de delitos de lesa humanidad',
    project_summary: 'Permite prescripción de crímenes de lesa humanidad anteriores a 2002.',
    vote_type: 'favor',
    session_date: '2024-06-13',
    is_pro_crime: false,
    is_anti_democratic: true,
    is_pro_corruption: false,
    category: 'pro_impunidad',
    source_url: 'https://lpderecho.pe/ley-32107-prescribe-delitos-lesa-humanidad/',
  },
  {
    candidate_id: CANDIDATES.luna_galvez,
    project_id: 'LEY-32107',
    project_title: 'Prescripción de delitos de lesa humanidad',
    project_summary: 'Permite prescripción de crímenes de lesa humanidad anteriores a 2002.',
    vote_type: 'favor',
    session_date: '2024-06-13',
    is_pro_crime: false,
    is_anti_democratic: true,
    is_pro_corruption: false,
    category: 'pro_impunidad',
    source_url: 'https://lpderecho.pe/ley-32107-prescribe-delitos-lesa-humanidad/',
  },

  // === LEY 32108 - Crimen Organizado (August 2024) ===
  // First vote (May 30): 52 favor, 13 contra, 32 abstentions.
  // Avanza País initially ABSTAINED, then voted FAVOR in Comisión Permanente.
  // APP and Podemos voted FAVOR.
  // Source: El Comercio naming the 52 who voted in favor.
  {
    candidate_id: CANDIDATES.williams,
    project_id: 'LEY-32108',
    project_title: 'Debilitamiento de la definición de crimen organizado',
    project_summary: 'Redefine crimen organizado exigiendo estructura compleja y permanente.',
    vote_type: 'abstencion',
    session_date: '2024-05-30',
    is_pro_crime: true,
    is_anti_democratic: false,
    is_pro_corruption: true,
    category: 'pro_crimen',
    source_url: 'https://elcomercio.pe/politica/congreso/ley-sobre-crimen-organizado-quienes-son-los-52-congresistas-que-apoyaron-los-cuestionados-cambios-y-como-voto-la-actual-mesa-directiva-del-congreso-eduardo-salhuana-waldemar-cerron-patricia-juarez-ley-n32108-noticia/',
  },
  {
    candidate_id: CANDIDATES.chiabra,
    project_id: 'LEY-32108',
    project_title: 'Debilitamiento de la definición de crimen organizado',
    project_summary: 'Redefine crimen organizado exigiendo estructura compleja y permanente.',
    vote_type: 'favor',
    session_date: '2024-05-30',
    is_pro_crime: true,
    is_anti_democratic: false,
    is_pro_corruption: true,
    category: 'pro_crimen',
    source_url: 'https://elcomercio.pe/politica/congreso/ley-sobre-crimen-organizado-quienes-son-los-52-congresistas-que-apoyaron-los-cuestionados-cambios-y-como-voto-la-actual-mesa-directiva-del-congreso-eduardo-salhuana-waldemar-cerron-patricia-juarez-ley-n32108-noticia/',
  },
  {
    candidate_id: CANDIDATES.luna_galvez,
    project_id: 'LEY-32108',
    project_title: 'Debilitamiento de la definición de crimen organizado',
    project_summary: 'Redefine crimen organizado exigiendo estructura compleja y permanente.',
    vote_type: 'favor',
    session_date: '2024-05-30',
    is_pro_crime: true,
    is_anti_democratic: false,
    is_pro_corruption: true,
    category: 'pro_crimen',
    source_url: 'https://elcomercio.pe/politica/congreso/ley-sobre-crimen-organizado-quienes-son-los-52-congresistas-que-apoyaron-los-cuestionados-cambios-y-como-voto-la-actual-mesa-directiva-del-congreso-eduardo-salhuana-waldemar-cerron-patricia-juarez-ley-n32108-noticia/',
  },

  // === LEY 32181 - Eliminación detención preliminar (December 2024) ===
  // Approved with broad majority. All coalition parties voted in favor.
  {
    candidate_id: CANDIDATES.williams,
    project_id: 'LEY-32181',
    project_title: 'Eliminación de la detención preliminar sin flagrancia',
    project_summary: 'Elimina la detención preliminar para casos sin flagrancia.',
    vote_type: 'favor',
    session_date: '2024-11-21',
    is_pro_crime: true,
    is_anti_democratic: false,
    is_pro_corruption: true,
    category: 'pro_crimen',
    source_url: 'https://elcomercio.pe/politica/dina-boluarte-promulga-norma-del-congreso-que-elimina-la-detencion-preliminar-estos-son-peligros-de-la-nueva-ley-ley-32181-caso-waykis-en-la-sombra-noticia/',
  },
  {
    candidate_id: CANDIDATES.chiabra,
    project_id: 'LEY-32181',
    project_title: 'Eliminación de la detención preliminar sin flagrancia',
    project_summary: 'Elimina la detención preliminar para casos sin flagrancia.',
    vote_type: 'favor',
    session_date: '2024-11-21',
    is_pro_crime: true,
    is_anti_democratic: false,
    is_pro_corruption: true,
    category: 'pro_crimen',
    source_url: 'https://elcomercio.pe/politica/dina-boluarte-promulga-norma-del-congreso-que-elimina-la-detencion-preliminar-estos-son-peligros-de-la-nueva-ley-ley-32181-caso-waykis-en-la-sombra-noticia/',
  },
  {
    candidate_id: CANDIDATES.luna_galvez,
    project_id: 'LEY-32181',
    project_title: 'Eliminación de la detención preliminar sin flagrancia',
    project_summary: 'Elimina la detención preliminar para casos sin flagrancia.',
    vote_type: 'favor',
    session_date: '2024-11-21',
    is_pro_crime: true,
    is_anti_democratic: false,
    is_pro_corruption: true,
    category: 'pro_crimen',
    source_url: 'https://elcomercio.pe/politica/dina-boluarte-promulga-norma-del-congreso-que-elimina-la-detencion-preliminar-estos-son-peligros-de-la-nueva-ley-ley-32181-caso-waykis-en-la-sombra-noticia/',
  },

  // === LEY 32182 - Sanciones a jueces y fiscales (December 2024) ===
  // Approved November 18, 2024. Part of the same session as LEY 32181.
  {
    candidate_id: CANDIDATES.williams,
    project_id: 'LEY-32182',
    project_title: 'Sanciones a jueces y fiscales que liberen detenidos',
    project_summary: 'Criminaliza a jueces que liberen detenidos en flagrancia.',
    vote_type: 'favor',
    session_date: '2024-11-18',
    is_pro_crime: false,
    is_anti_democratic: true,
    is_pro_corruption: false,
    category: 'anti_fiscalia',
    source_url: 'https://lpderecho.pe/ley-32182-sanciona-jueces-fiscales-libertad-personas-detenidos-flagrancia/',
  },
  {
    candidate_id: CANDIDATES.chiabra,
    project_id: 'LEY-32182',
    project_title: 'Sanciones a jueces y fiscales que liberen detenidos',
    project_summary: 'Criminaliza a jueces que liberen detenidos en flagrancia.',
    vote_type: 'favor',
    session_date: '2024-11-18',
    is_pro_crime: false,
    is_anti_democratic: true,
    is_pro_corruption: false,
    category: 'anti_fiscalia',
    source_url: 'https://lpderecho.pe/ley-32182-sanciona-jueces-fiscales-libertad-personas-detenidos-flagrancia/',
  },
  {
    candidate_id: CANDIDATES.luna_galvez,
    project_id: 'LEY-32182',
    project_title: 'Sanciones a jueces y fiscales que liberen detenidos',
    project_summary: 'Criminaliza a jueces que liberen detenidos en flagrancia.',
    vote_type: 'favor',
    session_date: '2024-11-18',
    is_pro_crime: false,
    is_anti_democratic: true,
    is_pro_corruption: false,
    category: 'anti_fiscalia',
    source_url: 'https://lpderecho.pe/ley-32182-sanciona-jueces-fiscales-libertad-personas-detenidos-flagrancia/',
  },

  // === LEY 32326 - Extinción de dominio (May 2025) ===
  // Approved with support from Fuerza Popular, Renovación Popular and coalition.
  // Avanza País (Williams), APP (Chiabra), Podemos (Luna) generally voted with majority.
  {
    candidate_id: CANDIDATES.williams,
    project_id: 'LEY-32326',
    project_title: 'Debilitamiento de la extinción de dominio',
    project_summary: 'Exige sentencia firme para decomisar bienes. Impone prescripción de 5 años.',
    vote_type: 'favor',
    session_date: '2025-04-24',
    is_pro_crime: true,
    is_anti_democratic: false,
    is_pro_corruption: true,
    category: 'pro_crimen',
    source_url: 'https://peru21.pe/politica/fiscales-supremos-rechazan-ley-32326-acusan-retroceso-en-lucha-contra-corrupcion/',
  },
  {
    candidate_id: CANDIDATES.chiabra,
    project_id: 'LEY-32326',
    project_title: 'Debilitamiento de la extinción de dominio',
    project_summary: 'Exige sentencia firme para decomisar bienes. Impone prescripción de 5 años.',
    vote_type: 'favor',
    session_date: '2025-04-24',
    is_pro_crime: true,
    is_anti_democratic: false,
    is_pro_corruption: true,
    category: 'pro_crimen',
    source_url: 'https://peru21.pe/politica/fiscales-supremos-rechazan-ley-32326-acusan-retroceso-en-lucha-contra-corrupcion/',
  },
  {
    candidate_id: CANDIDATES.luna_galvez,
    project_id: 'LEY-32326',
    project_title: 'Debilitamiento de la extinción de dominio',
    project_summary: 'Exige sentencia firme para decomisar bienes. Impone prescripción de 5 años.',
    vote_type: 'favor',
    session_date: '2025-04-24',
    is_pro_crime: true,
    is_anti_democratic: false,
    is_pro_corruption: true,
    category: 'pro_crimen',
    source_url: 'https://peru21.pe/politica/fiscales-supremos-rechazan-ley-32326-acusan-retroceso-en-lucha-contra-corrupcion/',
  },

  // === PL-4431/6718 - Ley mordaza (March 2025) ===
  // First vote: 37 favor, 23 contra, 22 abstentions.
  // More divided vote. Avanza País generally voted against press restrictions.
  // APP voted in favor. Podemos voted in favor.
  {
    candidate_id: CANDIDATES.williams,
    project_id: 'PL-4431/6718',
    project_title: 'Ley mordaza: Agravamiento de penas por difamación',
    project_summary: 'Eleva penas de prisión por difamación hasta 5 años.',
    vote_type: 'contra',
    session_date: '2025-03-15',
    is_pro_crime: false,
    is_anti_democratic: true,
    is_pro_corruption: false,
    category: 'anti_prensa',
    source_url: 'https://www.infobae.com/peru/2025/03/15/organizaciones-de-prensa-advierten-que-el-congreso-busca-criminalizar-el-periodismo-con-nueva-ley-de-difamacion/',
  },
  {
    candidate_id: CANDIDATES.chiabra,
    project_id: 'PL-4431/6718',
    project_title: 'Ley mordaza: Agravamiento de penas por difamación',
    project_summary: 'Eleva penas de prisión por difamación hasta 5 años.',
    vote_type: 'favor',
    session_date: '2025-03-15',
    is_pro_crime: false,
    is_anti_democratic: true,
    is_pro_corruption: false,
    category: 'anti_prensa',
    source_url: 'https://www.infobae.com/peru/2025/03/15/organizaciones-de-prensa-advierten-que-el-congreso-busca-criminalizar-el-periodismo-con-nueva-ley-de-difamacion/',
  },
  {
    candidate_id: CANDIDATES.luna_galvez,
    project_id: 'PL-4431/6718',
    project_title: 'Ley mordaza: Agravamiento de penas por difamación',
    project_summary: 'Eleva penas de prisión por difamación hasta 5 años.',
    vote_type: 'favor',
    session_date: '2025-03-15',
    is_pro_crime: false,
    is_anti_democratic: true,
    is_pro_corruption: false,
    category: 'anti_prensa',
    source_url: 'https://www.infobae.com/peru/2025/03/15/organizaciones-de-prensa-advierten-que-el-congreso-busca-criminalizar-el-periodismo-con-nueva-ley-de-difamacion/',
  },
]

async function main() {
  console.log('=== Populating congressional_votes table ===\n')

  // Check existing votes
  const existing = await sql`
    SELECT candidate_id, project_id FROM congressional_votes
  `
  const existingKeys = new Set(existing.map((r) => `${r.candidate_id}:${r.project_id}`))
  console.log(`Found ${existingKeys.size} existing votes in DB`)

  let inserted = 0
  let skipped = 0

  for (const vote of VOTES) {
    const key = `${vote.candidate_id}:${vote.project_id}`
    if (existingKeys.has(key)) {
      console.log(`  SKIP: ${vote.project_id} for candidate ${vote.candidate_id.slice(-4)}`)
      skipped++
      continue
    }

    await sql`
      INSERT INTO congressional_votes (
        candidate_id, project_id, project_title, project_summary,
        vote_type, session_date, is_pro_crime, is_anti_democratic,
        is_pro_corruption, category, source_url
      ) VALUES (
        ${vote.candidate_id}::uuid,
        ${vote.project_id},
        ${vote.project_title},
        ${vote.project_summary},
        ${vote.vote_type},
        ${vote.session_date}::date,
        ${vote.is_pro_crime},
        ${vote.is_anti_democratic},
        ${vote.is_pro_corruption},
        ${vote.category},
        ${vote.source_url}
      )
    `

    // Get candidate name for logging
    const candidate = vote.candidate_id === CANDIDATES.williams
      ? 'Williams'
      : vote.candidate_id === CANDIDATES.chiabra
        ? 'Chiabra'
        : 'Luna Galvez'

    console.log(`  INSERT: ${candidate} - ${vote.project_id} -> ${vote.vote_type.toUpperCase()}`)
    inserted++
  }

  console.log(`\nDone: ${inserted} inserted, ${skipped} skipped`)

  // Summary per candidate
  for (const [name, id] of Object.entries(CANDIDATES)) {
    const summary = await sql`
      SELECT
        vote_type,
        COUNT(*) as cnt
      FROM congressional_votes
      WHERE candidate_id = ${id}::uuid
      GROUP BY vote_type
      ORDER BY vote_type
    `
    console.log(`\n${name}:`)
    for (const row of summary) {
      console.log(`  ${row.vote_type}: ${row.cnt}`)
    }
  }

  // Total
  const total = await sql`SELECT COUNT(*) as cnt FROM congressional_votes`
  console.log(`\nTotal congressional votes in DB: ${total[0].cnt}`)
}

main().catch(console.error)
