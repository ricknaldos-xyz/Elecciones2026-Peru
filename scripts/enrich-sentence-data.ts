/**
 * Enrich sentence data for presidential candidates
 * - Updates raw JNE expedientes with full details from public sources
 * - Adds missing denuncias from verified public records
 * - Updates Cerrón's sentences with 2025 absolution/annulment
 */

import * as fs from 'fs'
import * as path from 'path'
import { neon } from '@neondatabase/serverless'

function loadEnv(): string {
  const envPath = path.join(process.cwd(), '.env.local')
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8')
    const match = content.match(/DATABASE_URL=["']?([^"'\n]+)["']?/)
    if (match) return match[1]
  }
  throw new Error('DATABASE_URL not found')
}

const sql = neon(loadEnv())

// Complete sentence data updates
// Sources: Poder Judicial, JNE, Fiscalía, verified news (LP Derecho, El Comercio, Infobae)
const SENTENCE_UPDATES: Record<string, {
  penal_sentences: any[]
  civil_sentences: any[]
}> = {
  // ACUÑA - Add the family court case (alimentos) to existing civil data
  'ACUÑA PERALTA': {
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
      },
      {
        type: 'alimentos',
        case_number: '02974-2023-0-1801-JR-FC-17',
        court: '17mo Juzgado de Familia Civil de Lima',
        date: '2023-01-01',
        sentence: 'Demanda de pensión alimenticia por madre de su hijo menor. Sentencia: S/30,000 mensuales, confirmada en apelación. Inicialmente fijada en S/90,000, anulada por Corte Suprema por falta de debida motivación.',
        status: 'firme',
        source: 'poder_judicial'
      }
    ]
  },

  // CERRÓN - Update with 2025 absolutions/annulments + add existing cases
  'CERRON ROJAS': {
    penal_sentences: [
      {
        type: 'negociacion_incompatible',
        case_number: '01122-2018-27-1501-JR-PE-05',
        court: '5to Juzgado Penal Unipersonal Supraprovincial Anticorrupción de Huancayo',
        date: '2019-08-05',
        sentence: 'Negociación incompatible - Caso La Oroya. Desembolso irregular de S/850,000 del convenio OEI para proyecto de saneamiento. Condena: 4 años y 8 meses (reducida a 4 años suspendida en apelación). ANULADA por Tribunal Constitucional el 28/03/2025 por falta de debida motivación.',
        status: 'proceso',
        source: 'poder_judicial'
      },
      {
        type: 'colusion',
        case_number: '01978-2016-63-1501-JR-PE-01',
        court: '6to Juzgado Penal Unipersonal Anticorrupción de Huancayo',
        date: '2023-02-07',
        sentence: 'Colusión - Caso Aeródromo Wanka. Concertación ilícita para beneficiar al Consorcio Wanka. Condena: 3 años y 6 meses efectiva + S/800,000 reparación civil. ABSUELTO por Corte Suprema el 26/03/2025 por insuficiencia probatoria. Reparación civil reducida a S/250,000.',
        status: 'firme',
        source: 'poder_judicial'
      },
      {
        type: 'organizacion_criminal',
        case_number: 'CASO-DINAMICOS-DEL-CENTRO',
        court: 'Poder Judicial - Sala Penal Nacional',
        date: '2021-11-01',
        sentence: 'Organización criminal y lavado de activos - Caso Los Dinámicos del Centro. Presunta red criminal en la Dirección Regional de Transportes de Junín. Prisión preventiva de 24 meses. Cerrón permanece prófugo con recompensa de S/100,000.',
        status: 'proceso',
        source: 'poder_judicial'
      }
    ],
    civil_sentences: []
  },

  // VIZCARRA CORNEJO MARIO (hermano de Martín) - Add the peculado conviction
  'VIZCARRA CORNEJO MARIO': {
    penal_sentences: [
      {
        type: 'peculado',
        case_number: '015-05',
        court: 'Sala Mixta de la Corte Superior de Justicia de Moquegua',
        date: '2005-10-01',
        sentence: 'Peculado, falsedad genérica y falsa declaración en procedimiento administrativo. Como presidente del CTAR Moquegua (2001), cobró doble remuneración: sueldo estatal y honorarios del PNUD. Cobro irregular de S/6,114.54 en remuneraciones + S/6,033.24 incentivo laboral + S/300 bonificación escolar. Condena: 3 años de prisión suspendida y S/3,000 reparación civil.',
        status: 'firme',
        source: 'poder_judicial'
      },
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

  // MASSÉ - Update with APDAYC context for existing expedientes
  'MASSE FERNANDEZ': {
    penal_sentences: [
      {
        type: 'administracion_fraudulenta',
        case_number: '610-2003',
        court: 'Juzgado Penal de Lima',
        date: '2003-01-01',
        sentence: 'Proceso penal declarado en hoja de vida JNE. Vinculado a gestión de APDAYC (Asociación Peruana de Autores y Compositores).',
        status: 'proceso',
        source: 'jne'
      },
      {
        type: 'lavado_activos',
        case_number: '12424-2015',
        court: '29a Fiscalía Provincial Penal de Lima',
        date: '2015-01-01',
        sentence: 'Investigación por presunto lavado de activos, estafa y administración fraudulenta relacionada con gestión de APDAYC. Denunciado por cobros irregulares y transferencias sospechosas desde empresas radiales (Exitosa SAC, Karibena SAC).',
        status: 'proceso',
        source: 'poder_judicial'
      }
    ],
    civil_sentences: []
  },

  // MOLINELLI - Add active fiscal investigations (not sentencias but relevant)
  'MOLINELLI ARISTONDO': {
    penal_sentences: [
      {
        type: 'colusion_agravada',
        case_number: 'CASO-ESSALUD-COVID',
        court: 'Fiscalía de la Nación',
        date: '2021-01-01',
        sentence: 'Investigación por colusión agravada y organización criminal en gestión de EsSalud durante COVID-19. Impedimento de salida del país por 12 meses y allanamiento domiciliario.',
        status: 'proceso',
        source: 'poder_judicial'
      }
    ],
    civil_sentences: []
  },

  // NIETO MONTESINOS - Active lavado de activos investigation
  'NIETO MONTESINOS': {
    penal_sentences: [
      {
        type: 'lavado_activos',
        case_number: 'CASO-ODEBRECHT-VILLARAN',
        court: 'Fiscalía de la Nación - Equipo Especial Lava Jato',
        date: '2020-01-01',
        sentence: 'Investigación preparatoria formalizada por lavado de activos en Caso Odebrecht. Presuntamente recibió dinero ilegal de OAS y Odebrecht por consultorías vinculadas a gestión de Susana Villarán.',
        status: 'proceso',
        source: 'poder_judicial'
      }
    ],
    civil_sentences: []
  },
}

async function main() {
  console.log('='.repeat(70))
  console.log(' ENRIQUECIENDO DATOS DE SENTENCIAS Y DENUNCIAS')
  console.log('='.repeat(70))

  let updated = 0

  for (const [searchName, data] of Object.entries(SENTENCE_UPDATES)) {
    const parts = searchName.split(' ')
    const candidates = await sql`
      SELECT id, full_name FROM candidates
      WHERE cargo = 'presidente' AND is_active = true
      AND full_name ILIKE ${`%${parts[0]}%`}
      AND full_name ILIKE ${`%${parts[1]}%`}
      LIMIT 1
    `

    if (candidates.length === 0) {
      console.log(`\n  No encontrado: ${searchName}`)
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
    console.log(`\n  ${candidate.full_name}: ${penalCount} penal, ${civilCount} civil`)
    updated++
  }

  // Final summary
  console.log('\n' + '='.repeat(70))
  console.log(' RESUMEN FINAL')
  console.log('='.repeat(70))

  const summary = await sql`
    SELECT
      count(*) as total,
      count(*) FILTER (WHERE jsonb_array_length(penal_sentences) > 0) as with_penal,
      count(*) FILTER (WHERE jsonb_array_length(civil_sentences) > 0) as with_civil,
      count(*) FILTER (WHERE jsonb_array_length(penal_sentences) > 0 OR jsonb_array_length(civil_sentences) > 0) as with_any
    FROM candidates
    WHERE cargo = 'presidente' AND is_active = true
  `

  const s = summary[0]
  console.log(`  Total presidentes activos: ${s.total}`)
  console.log(`  Con sentencias penales: ${s.with_penal}`)
  console.log(`  Con sentencias civiles: ${s.with_civil}`)
  console.log(`  Con algún registro judicial: ${s.with_any}`)
  console.log(`  Sin registros: ${Number(s.total) - Number(s.with_any)}`)
  console.log(`  Actualizados ahora: ${updated}`)
}

main().catch(console.error)
