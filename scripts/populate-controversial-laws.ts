/**
 * Populate controversial_laws table with real data from the 2021-2026 Congress.
 *
 * Sources:
 * - HRW Report "Legislar para la impunidad" (July 2025)
 * - Infobae, El Comercio, La Republica, RPP
 * - Ojo Publico investigations
 * - LP Derecho legal analysis
 */

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

interface ControversialLaw {
  project_id: string
  title: string
  description: string
  category: string
  penalty_points: number
  bonus_points: number
  approval_date: string | null
  is_approved: boolean
  source_url: string
}

const CONTROVERSIAL_LAWS: ControversialLaw[] = [
  {
    project_id: 'LEY-31751',
    title: 'Ley Soto: Reducción de plazos de prescripción',
    description:
      'Reduce la suspensión del plazo de prescripción de delitos a un máximo de 1 año. Beneficia directamente a congresistas investigados, expresidentes y prófugos como Vladimir Cerrón. La Corte Suprema la declaró inconstitucional pero el Congreso impuso la Ley 32104 para anular el fallo.',
    category: 'pro_impunidad',
    penalty_points: 40,
    bonus_points: 8,
    approval_date: '2023-05-25',
    is_approved: true,
    source_url: 'https://busquedas.elperuano.pe/dispositivo/NL/2181041-1',
  },
  {
    project_id: 'LEY-31990',
    title: 'Debilitamiento de la Colaboración Eficaz',
    description:
      'Impone un plazo estricto de 8 meses para todo el proceso de colaboración eficaz, antes sin límite fijo. Afecta 54 procesos en curso incluyendo el caso Lava Jato. Amenaza el proceso de acceso del Perú a la OCDE. Promulgada por insistencia tras veto del Ejecutivo.',
    category: 'anti_colaboracion',
    penalty_points: 40,
    bonus_points: 8,
    approval_date: '2024-03-21',
    is_approved: true,
    source_url: 'https://busquedas.elperuano.pe/dispositivo/NL/2272588-1',
  },
  {
    project_id: 'LEY-32054',
    title: 'Exclusión de responsabilidad penal a partidos políticos',
    description:
      'Excluye a los partidos políticos de TODA responsabilidad penal aplicable a personas jurídicas. Ya no pueden ser disueltos ni suspendidos por actividad criminal. Beneficia directamente a Fuerza Popular, Perú Libre, Renovación Popular y Podemos Perú, todos bajo investigación.',
    category: 'pro_impunidad',
    penalty_points: 35,
    bonus_points: 7,
    approval_date: '2024-06-10',
    is_approved: true,
    source_url: 'https://busquedas.elperuano.pe/dispositivo/NL/2296582-1',
  },
  {
    project_id: 'LEY-32107',
    title: 'Prescripción de delitos de lesa humanidad',
    description:
      'Establece que los crímenes de lesa humanidad anteriores al 1 de julio de 2002 pueden prescribir. Podría anular ~600 casos del conflicto armado interno (1980-2000), incluyendo masacres del Grupo Colina. Rechazada por la Corte IDH, Conferencia Episcopal y Ministerio Público. Inaplicada 47 veces por jueces.',
    category: 'pro_impunidad',
    penalty_points: 45,
    bonus_points: 10,
    approval_date: '2024-08-09',
    is_approved: true,
    source_url: 'https://lpderecho.pe/ley-32107-prescribe-delitos-lesa-humanidad/',
  },
  {
    project_id: 'LEY-32108',
    title: 'Debilitamiento de la definición de crimen organizado',
    description:
      'Redefine "organización criminal" exigiendo una "estructura compleja y permanente" que controle la "cadena de valor de un mercado ilegal". Excluye 59 delitos de la persecución por crimen organizado. Conocida como "ley con nombre propio" porque su autor (Waldemar Cerrón) la invocó en su propio caso. Culpada del aumento de extorsiones.',
    category: 'pro_crimen',
    penalty_points: 45,
    bonus_points: 10,
    approval_date: '2024-08-09',
    is_approved: true,
    source_url: 'https://busquedas.elperuano.pe/dispositivo/NL/2313835-2',
  },
  {
    project_id: 'LEY-32181',
    title: 'Eliminación de la detención preliminar sin flagrancia',
    description:
      'Elimina la facultad de los jueces de ordenar detención preliminar en casos sin flagrancia. Podría beneficiar a procesados como Alejandro Toledo y Aníbal Torres. El Congreso aprobó su restitución (PL 9733) pero el Ejecutivo la vetó, sugiriendo excluir delitos de corrupción.',
    category: 'pro_crimen',
    penalty_points: 40,
    bonus_points: 8,
    approval_date: '2024-12-11',
    is_approved: true,
    source_url:
      'https://elcomercio.pe/politica/dina-boluarte-promulga-norma-del-congreso-que-elimina-la-detencion-preliminar-estos-son-peligros-de-la-nueva-ley-ley-32181-caso-waykis-en-la-sombra-noticia/',
  },
  {
    project_id: 'LEY-32182',
    title: 'Sanciones a jueces y fiscales que liberen detenidos',
    description:
      'Criminaliza a jueces y fiscales que liberen personas detenidas en flagrancia con penas de 8-12 años de prisión. Impide a fiscales solicitar detención de policías que causen muerte o lesiones en servicio. Rechazada por el Colegio de Abogados de Lima por amenazar la autonomía judicial.',
    category: 'anti_fiscalia',
    penalty_points: 35,
    bonus_points: 7,
    approval_date: '2024-12-05',
    is_approved: true,
    source_url: 'https://lpderecho.pe/ley-32182-sanciona-jueces-fiscales-libertad-personas-detenidos-flagrancia/',
  },
  {
    project_id: 'LEY-32326',
    title: 'Debilitamiento de la extinción de dominio',
    description:
      'Exige sentencia firme para decomisar bienes, antes bastaban indicios razonables. Impone prescripción de 5 años a procesos de extinción de dominio, antes sin plazo. Más de 5,000 procesos en trámite podrían archivarse. Desde 2019, el PJ había recuperado más de US$172 millones. Viola la Convención de la ONU contra la Corrupción.',
    category: 'pro_crimen',
    penalty_points: 40,
    bonus_points: 8,
    approval_date: '2025-05-10',
    is_approved: true,
    source_url: 'https://peru21.pe/politica/fiscales-supremos-rechazan-ley-32326-acusan-retroceso-en-lucha-contra-corrupcion/',
  },
  {
    project_id: 'PL-4431/6718',
    title: 'Ley mordaza: Agravamiento de penas por difamación',
    description:
      'Eleva penas de prisión por difamación a hasta 5 años y multas a 365 días-multa. Reduce el plazo de rectificación de 7 días a 1 día. Ambos autores están bajo investigación penal. Condenada por la SIP, CPJ, Reporteros Sin Fronteras. Perú cayó 33 posiciones en el ranking de libertad de prensa.',
    category: 'anti_prensa',
    penalty_points: 35,
    bonus_points: 7,
    approval_date: null,
    is_approved: false,
    source_url:
      'https://www.infobae.com/peru/2025/03/15/organizaciones-de-prensa-advierten-que-el-congreso-busca-criminalizar-el-periodismo-con-nueva-ley-de-difamacion/',
  },
]

async function main() {
  console.log('=== Populating controversial_laws table ===\n')

  // Check existing data
  const existing = await sql`SELECT project_id FROM controversial_laws`
  const existingIds = new Set(existing.map((r) => r.project_id))
  console.log(`Found ${existingIds.size} existing laws in DB`)

  let inserted = 0
  let skipped = 0

  for (const law of CONTROVERSIAL_LAWS) {
    if (existingIds.has(law.project_id)) {
      console.log(`  SKIP: ${law.project_id} - ${law.title} (already exists)`)
      skipped++
      continue
    }

    await sql`
      INSERT INTO controversial_laws (
        project_id, title, description, category,
        penalty_points, bonus_points, approval_date,
        is_approved, source_url
      ) VALUES (
        ${law.project_id},
        ${law.title},
        ${law.description},
        ${law.category},
        ${law.penalty_points},
        ${law.bonus_points},
        ${law.approval_date}::date,
        ${law.is_approved},
        ${law.source_url}
      )
    `
    console.log(`  INSERT: ${law.project_id} - ${law.title}`)
    inserted++
  }

  console.log(`\nDone: ${inserted} inserted, ${skipped} skipped`)

  // Verify
  const total = await sql`SELECT COUNT(*) as cnt FROM controversial_laws`
  console.log(`Total controversial laws in DB: ${total[0].cnt}`)
}

main().catch(console.error)
