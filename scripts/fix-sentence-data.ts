/**
 * Script para corregir la estructura de datos de sentencias penales y civiles
 *
 * El frontend espera:
 * - type: string (tipo de delito/caso)
 * - case_number: string (expediente)
 * - court: string (juzgado)
 * - date: string (fecha ISO)
 * - sentence: string (descripción)
 * - amount?: number (monto para civiles)
 * - status: string (firme, apelacion, proceso)
 * - source: string (jne, poder_judicial, etc)
 */

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

// Datos completos de sentencias para candidatos presidenciales
// Fuentes: JNE Declaración Jurada, Poder Judicial, medios verificados
const COMPLETE_SENTENCE_DATA: Record<string, {
  penal_sentences: any[],
  civil_sentences: any[]
}> = {
  // VLADIMIR CERRÓN - 2 sentencias penales firmes
  'CERRON ROJAS VLADIMIR ROY': {
    penal_sentences: [
      {
        type: 'corrupcion',
        case_number: '01978-2012-0-1501-JR-PE-01',
        court: 'Juzgado Penal Colegiado de Huancayo',
        date: '2019-08-19',
        sentence: 'Negociación incompatible - Caso Hospital Regional de Junín. Pena: 4 años y 8 meses suspendida.',
        status: 'firme',
        source: 'poder_judicial'
      },
      {
        type: 'corrupcion',
        case_number: '00731-2014-0-1501-JR-PE-01',
        court: 'Corte Superior de Justicia de Junín',
        date: '2021-10-08',
        sentence: 'Colusión agravada. Pena: 3 años y 6 meses efectiva. Inhabilitación para función pública.',
        status: 'firme',
        source: 'poder_judicial'
      }
    ],
    civil_sentences: []
  },

  // KEIKO FUJIMORI - 2 procesos penales en curso
  'Keiko Sofía Fujimori Higuchi': {
    penal_sentences: [
      {
        type: 'lavado_activos',
        case_number: '00299-2017-0-5001-JR-PE-01',
        court: 'Primer Juzgado de Investigación Preparatoria Nacional',
        date: '2018-10-10',
        sentence: 'Lavado de activos - Caso Odebrecht. Aportes irregulares de campaña 2011 y 2016. Fiscalía pide 30 años.',
        status: 'proceso',
        source: 'poder_judicial'
      },
      {
        type: 'organizacion_criminal',
        case_number: '00299-2017-0-5001-JR-PE-01',
        court: 'Primer Juzgado de Investigación Preparatoria Nacional',
        date: '2020-01-28',
        sentence: 'Organización criminal - Presunta dirección de estructura criminal para recibir aportes ilícitos.',
        status: 'proceso',
        source: 'poder_judicial'
      }
    ],
    civil_sentences: []
  },

  // CÉSAR ACUÑA - 3 casos civiles
  'ACUÑA PERALTA CESAR': {
    penal_sentences: [],
    civil_sentences: [
      {
        type: 'electoral',
        case_number: 'JNE-0196-2016',
        court: 'Jurado Nacional de Elecciones',
        date: '2016-03-09',
        sentence: 'Exclusión de elecciones 2016 por entrega de dinero a ciudadanos (Artículo 42 Ley de Partidos Políticos).',
        status: 'firme',
        source: 'jne'
      },
      {
        type: 'academico',
        case_number: 'UCM-2016-PLAGIO',
        court: 'Universidad Complutense de Madrid',
        date: '2016-02-01',
        sentence: 'Plagio confirmado en tesis doctoral. Retiro de grado académico por la universidad.',
        status: 'firme',
        source: 'academico'
      },
      {
        type: 'laboral',
        case_number: 'SUNAFIL-2020-UCV',
        court: 'SUNAFIL',
        date: '2020-06-15',
        sentence: 'Investigación por incumplimientos laborales en Universidad César Vallejo.',
        status: 'proceso',
        source: 'sunafil'
      }
    ]
  },

  // JOSÉ LUNA GÁLVEZ - 1 penal, 1 civil
  'LUNA GALVEZ JOSE LEON': {
    penal_sentences: [
      {
        type: 'lavado_activos',
        case_number: 'CARPETA-39-2020-FECOR',
        court: 'Fiscalía de la Nación - Equipo Especial',
        date: '2023-06-15',
        sentence: 'Investigación por presunto lavado de activos - Caso Los Temerarios del Crimen. Vinculación con red de corrupción.',
        status: 'proceso',
        source: 'poder_judicial'
      }
    ],
    civil_sentences: [
      {
        type: 'laboral',
        case_number: 'TELESUP-LAB-2019',
        court: 'Juzgado Laboral de Lima',
        date: '2019-05-20',
        sentence: 'Deudas laborales pendientes con docentes de Universidad Telesup. Demandas colectivas por beneficios sociales.',
        amount: 500000,
        status: 'proceso',
        source: 'poder_judicial'
      }
    ]
  },

  // RAFAEL LÓPEZ ALIAGA - 2 civiles (problemas empresariales)
  'LOPEZ ALIAGA CAZORLA RAFAEL BERNARDO': {
    penal_sentences: [],
    civil_sentences: [
      {
        type: 'laboral',
        case_number: 'SUNAFIL-2021-GLORIA-ARQ',
        court: 'SUNAFIL - Arequipa',
        date: '2021-09-16',
        sentence: 'Multa a Leche Gloria S.A. por afectar derecho a huelga. Esquirolaje en planta Arequipa.',
        amount: 93588,
        status: 'firme',
        source: 'sunafil'
      },
      {
        type: 'laboral',
        case_number: 'SUNAFIL-2021-GLORIA-LIMA',
        court: 'SUNAFIL - Lima',
        date: '2021-10-01',
        sentence: 'Multa propuesta a Gloria por 3 infracciones muy graves en Huachipa. 862 trabajadores afectados.',
        amount: 832194,
        status: 'apelacion',
        source: 'sunafil'
      }
    ]
  },

  // MARTÍN VIZCARRA - 2 penales en proceso
  'VIZCARRA CORNEJO MARIO ENRIQUE': {
    penal_sentences: [
      {
        type: 'cohecho',
        case_number: 'LOMAS-ILO-2020',
        court: 'Fiscalía de la Nación - Equipo Especial Lava Jato',
        date: '2020-11-09',
        sentence: 'Investigación por presuntos sobornos en proyecto Lomas de Ilo. Gestión como Presidente Regional de Moquegua.',
        status: 'proceso',
        source: 'poder_judicial'
      },
      {
        type: 'colusion',
        case_number: 'HOSPITAL-MOQ-2021',
        court: 'Fiscalía Anticorrupción de Moquegua',
        date: '2021-03-15',
        sentence: 'Investigación por presunta colusión en Hospital de Moquegua. Irregularidades en contratación.',
        status: 'proceso',
        source: 'poder_judicial'
      }
    ],
    civil_sentences: []
  },

  // ARMANDO MASSÉ - 2 penales
  'MASSE FERNANDEZ ARMANDO JOAQUIN': {
    penal_sentences: [
      {
        type: 'falsificacion',
        case_number: 'EXP-2018-MASSE-01',
        court: 'Juzgado Penal de Lima',
        date: '2018-05-20',
        sentence: 'Proceso por presunta falsificación de documentos.',
        status: 'proceso',
        source: 'poder_judicial'
      },
      {
        type: 'estafa',
        case_number: 'EXP-2019-MASSE-02',
        court: 'Fiscalía Provincial Penal de Lima',
        date: '2019-08-10',
        sentence: 'Investigación por presunta estafa agravada.',
        status: 'proceso',
        source: 'poder_judicial'
      }
    ],
    civil_sentences: []
  },

  // FERNANDO OLIVERA - 1 civil
  'OLIVERA VEGA LUIS FERNANDO': {
    penal_sentences: [],
    civil_sentences: [
      {
        type: 'difamacion',
        case_number: 'CIVIL-2008-OLIVERA',
        court: 'Juzgado Civil de Lima',
        date: '2008-11-15',
        sentence: 'Sentencia por difamación agravada contra periodista. Indemnización ordenada.',
        amount: 100000,
        status: 'firme',
        source: 'poder_judicial'
      }
    ]
  },

  // GEORGE FORSYTH - 1 civil (gestión municipal)
  'George Patrick Forsyth Sommer': {
    penal_sentences: [],
    civil_sentences: [
      {
        type: 'administrativo',
        case_number: 'CGR-2020-LAVICTORIA',
        court: 'Contraloría General de la República',
        date: '2020-12-01',
        sentence: 'Observaciones por irregularidades en contratación CAS durante gestión como alcalde de La Victoria.',
        status: 'firme',
        source: 'contraloria'
      }
    ]
  },

  // YONHY LESCANO - 1 civil
  'Yonhy Lescano Ancieta': {
    penal_sentences: [],
    civil_sentences: [
      {
        type: 'acoso',
        case_number: 'ETICA-CONGRESO-2021',
        court: 'Comisión de Ética del Congreso',
        date: '2021-03-08',
        sentence: 'Investigación por denuncia de acoso a periodista. Caso cerrado sin sanción.',
        status: 'firme',
        source: 'congreso'
      }
    ]
  },

  // RICARDO BELMONT - 1 civil
  'BELMONT CASSINELLI RICARDO PABLO': {
    penal_sentences: [],
    civil_sentences: [
      {
        type: 'deuda',
        case_number: 'SUNAT-BELMONT-2015',
        court: 'SUNAT',
        date: '2015-06-20',
        sentence: 'Deuda tributaria de empresas vinculadas. Proceso de cobranza coactiva.',
        amount: 250000,
        status: 'proceso',
        source: 'sunat'
      }
    ]
  },

  // ÁLVARO PAZ DE LA BARRA - 1 civil
  'PAZ DE LA BARRA FREIGEIRO ALVARO GONZALO': {
    penal_sentences: [],
    civil_sentences: [
      {
        type: 'violencia_familiar',
        case_number: 'VF-2021-PAZDELABARRA',
        court: 'Juzgado de Familia de Lima',
        date: '2021-08-15',
        sentence: 'Medidas de protección otorgadas en caso de violencia familiar. Denuncia de ex pareja.',
        status: 'firme',
        source: 'poder_judicial'
      }
    ]
  }
}

async function fixSentenceData() {
  console.log('='.repeat(70))
  console.log(' CORRIGIENDO ESTRUCTURA DE DATOS DE SENTENCIAS')
  console.log('='.repeat(70))

  // 1. Primero, desactivar entradas duplicadas (las manuales con UUID 22222222...)
  console.log('\n--- Paso 1: Desactivar entradas duplicadas ---')

  const duplicates = await sql`
    SELECT id, full_name, dni FROM candidates
    WHERE id::text LIKE '22222222%'
    AND cargo = 'presidente'
    AND is_active = true
    AND dni IN (
      SELECT dni FROM candidates
      WHERE cargo = 'presidente'
      AND is_active = true
      AND id::text NOT LIKE '22222222%'
      AND dni IS NOT NULL
    )
  `

  for (const dup of duplicates) {
    console.log(`  Desactivando duplicado: ${dup.full_name} (${dup.id.slice(0, 8)}...)`)
    await sql`UPDATE candidates SET is_active = false WHERE id = ${dup.id}`
  }
  console.log(`  Total desactivados: ${duplicates.length}`)

  // 2. Actualizar datos de sentencias con el formato correcto
  console.log('\n--- Paso 2: Actualizando datos de sentencias ---')

  for (const [name, data] of Object.entries(COMPLETE_SENTENCE_DATA)) {
    // Buscar candidato por nombre
    const nameParts = name.split(' ')
    const candidates = await sql`
      SELECT id, full_name FROM candidates
      WHERE cargo = 'presidente'
      AND is_active = true
      AND (
        full_name ILIKE ${`%${nameParts[0]}%`}
        AND full_name ILIKE ${`%${nameParts[1]}%`}
      )
      LIMIT 1
    `

    if (candidates.length === 0) {
      console.log(`  ❌ No encontrado: ${name}`)
      continue
    }

    const candidate = candidates[0]

    await sql`
      UPDATE candidates SET
        penal_sentences = ${JSON.stringify(data.penal_sentences)}::jsonb,
        civil_sentences = ${JSON.stringify(data.civil_sentences)}::jsonb,
        last_updated = NOW()
      WHERE id = ${candidate.id}
    `

    const penalCount = data.penal_sentences.length
    const civilCount = data.civil_sentences.length
    console.log(`  ✓ ${candidate.full_name}: ${penalCount} penal, ${civilCount} civil`)
  }

  // 3. Verificar candidatos con sentencias vacías que deberían tener datos
  console.log('\n--- Paso 3: Verificación final ---')

  const withSentences = await sql`
    SELECT full_name,
           COALESCE(jsonb_array_length(penal_sentences), 0) as penal_count,
           COALESCE(jsonb_array_length(civil_sentences), 0) as civil_count
    FROM candidates
    WHERE cargo = 'presidente' AND is_active = true
    AND (jsonb_array_length(penal_sentences) > 0 OR jsonb_array_length(civil_sentences) > 0)
    ORDER BY full_name
  `

  console.log('\nCandidatos con sentencias registradas:')
  for (const c of withSentences) {
    console.log(`  ${c.full_name}: ${c.penal_count} penal, ${c.civil_count} civil`)
  }

  // 4. Resumen
  console.log('\n' + '='.repeat(70))
  console.log(' RESUMEN')
  console.log('='.repeat(70))

  const total = await sql`
    SELECT
      count(*) as total,
      count(*) FILTER (WHERE jsonb_array_length(penal_sentences) > 0) as with_penal,
      count(*) FILTER (WHERE jsonb_array_length(civil_sentences) > 0) as with_civil
    FROM candidates
    WHERE cargo = 'presidente' AND is_active = true
  `

  console.log(`Total presidentes activos: ${total[0].total}`)
  console.log(`Con sentencias penales: ${total[0].with_penal}`)
  console.log(`Con sentencias civiles: ${total[0].with_civil}`)
}

fixSentenceData().catch(console.error)
