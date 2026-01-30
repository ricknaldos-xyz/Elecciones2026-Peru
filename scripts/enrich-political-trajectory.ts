/**
 * Enrich political_trajectory JSONB data for presidential candidates
 * with verified career information from public sources.
 *
 * This script adds cargo_electivo and cargo_publico entries to
 * candidates' political_trajectory arrays.
 */

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

interface TrajectoryEntry {
  type: 'cargo_electivo' | 'cargo_publico' | 'partidario' | 'eleccion'
  position: string
  institution?: string
  party?: string
  start_year?: string
  end_year?: string
  is_elected?: boolean
  result?: string
  notes?: string
  source: string
}

interface CandidateTrajectory {
  candidateNames: string[] // Match by ILIKE any of these
  entries: TrajectoryEntry[]
}

const ENRICHMENTS: CandidateTrajectory[] = [
  {
    candidateNames: ['%williams zapata%'],
    entries: [
      {
        type: 'cargo_publico',
        position: 'Comandante General del Comando Conjunto de las FFAA',
        institution: 'Fuerzas Armadas del Perú',
        start_year: '2005',
        end_year: '2006',
        source: 'congreso.gob.pe',
      },
      {
        type: 'cargo_electivo',
        position: 'Congresista por Lima',
        institution: 'Congreso de la República',
        party: 'Avanza País',
        start_year: '2021',
        end_year: '2026',
        is_elected: true,
        source: 'congreso.gob.pe',
      },
      {
        type: 'cargo_electivo',
        position: 'Presidente del Congreso',
        institution: 'Congreso de la República',
        party: 'Avanza País',
        start_year: '2022',
        end_year: '2023',
        is_elected: true,
        notes: 'Presidió la vacancia de Pedro Castillo el 7 de diciembre de 2022',
        source: 'congreso.gob.pe',
      },
    ],
  },
  {
    candidateNames: ['%chiabra%roberto%', '%roberto%chiabra%'],
    entries: [
      {
        type: 'cargo_publico',
        position: 'Comandante General del Ejército',
        institution: 'Ejército del Perú',
        start_year: '2002',
        end_year: '2003',
        source: 'wikipedia',
      },
      {
        type: 'cargo_publico',
        position: 'Ministro de Defensa',
        institution: 'Ministerio de Defensa',
        start_year: '2003',
        end_year: '2005',
        notes: 'Gobierno de Alejandro Toledo',
        source: 'wikipedia',
      },
      {
        type: 'cargo_electivo',
        position: 'Congresista por Lima',
        institution: 'Congreso de la República',
        party: 'Alianza para el Progreso',
        start_year: '2021',
        end_year: '2026',
        is_elected: true,
        source: 'congreso.gob.pe',
      },
    ],
  },
  {
    candidateNames: ['%luna%galvez%', '%luna galvez%'],
    entries: [
      {
        type: 'cargo_electivo',
        position: 'Congresista',
        institution: 'Congreso de la República',
        party: 'Solidaridad Nacional',
        start_year: '2000',
        end_year: '2001',
        is_elected: true,
        source: 'congreso.gob.pe',
      },
      {
        type: 'cargo_electivo',
        position: 'Congresista',
        institution: 'Congreso de la República',
        party: 'Unidad Nacional',
        start_year: '2001',
        end_year: '2006',
        is_elected: true,
        source: 'congreso.gob.pe',
      },
      {
        type: 'cargo_electivo',
        position: 'Congresista',
        institution: 'Congreso de la República',
        start_year: '2006',
        end_year: '2011',
        is_elected: true,
        source: 'congreso.gob.pe',
      },
      {
        type: 'cargo_electivo',
        position: 'Congresista',
        institution: 'Congreso de la República',
        start_year: '2011',
        end_year: '2016',
        is_elected: true,
        source: 'congreso.gob.pe',
      },
      {
        type: 'cargo_electivo',
        position: 'Congresista por Lima',
        institution: 'Congreso de la República',
        party: 'Podemos Perú',
        start_year: '2021',
        end_year: '2026',
        is_elected: true,
        notes: '5to periodo. Investigado por "Los Gangsters de la Política"',
        source: 'congreso.gob.pe',
      },
    ],
  },
  {
    candidateNames: ['%keiko%fujimori%'],
    entries: [
      {
        type: 'cargo_electivo',
        position: 'Congresista por Lima',
        institution: 'Congreso de la República',
        party: 'Alianza por el Futuro',
        start_year: '2006',
        end_year: '2011',
        is_elected: true,
        notes: 'Votación más alta del país con 602,869 votos. 500 inasistencias registradas.',
        source: 'congreso.gob.pe',
      },
      {
        type: 'eleccion',
        position: 'Candidata presidencial',
        party: 'Fuerza Popular',
        start_year: '2011',
        is_elected: false,
        result: 'Segunda vuelta - Derrotada por Ollanta Humala',
        source: 'jne',
      },
      {
        type: 'eleccion',
        position: 'Candidata presidencial',
        party: 'Fuerza Popular',
        start_year: '2016',
        is_elected: false,
        result: 'Segunda vuelta - Derrotada por PPK',
        source: 'jne',
      },
      {
        type: 'eleccion',
        position: 'Candidata presidencial',
        party: 'Fuerza Popular',
        start_year: '2021',
        is_elected: false,
        result: 'Segunda vuelta - Derrotada por Pedro Castillo',
        source: 'jne',
      },
    ],
  },
  {
    candidateNames: ['%lescano%ancieta%', '%yonhy%lescano%'],
    entries: [
      {
        type: 'cargo_electivo',
        position: 'Congresista por Puno',
        institution: 'Congreso de la República',
        party: 'Acción Popular',
        start_year: '2001',
        end_year: '2006',
        is_elected: true,
        source: 'congreso.gob.pe',
      },
      {
        type: 'cargo_electivo',
        position: 'Congresista por Puno',
        institution: 'Congreso de la República',
        party: 'Frente de Centro',
        start_year: '2006',
        end_year: '2011',
        is_elected: true,
        source: 'congreso.gob.pe',
      },
      {
        type: 'cargo_electivo',
        position: 'Congresista por Lima',
        institution: 'Congreso de la República',
        party: 'Perú Posible',
        start_year: '2011',
        end_year: '2016',
        is_elected: true,
        source: 'congreso.gob.pe',
      },
      {
        type: 'cargo_electivo',
        position: 'Congresista por Lima',
        institution: 'Congreso de la República',
        party: 'Acción Popular',
        start_year: '2016',
        end_year: '2019',
        is_elected: true,
        notes: 'Periodo cortado por disolución del Congreso. 676 proyectos presentados, 121 aprobados en 18 años.',
        source: 'congreso.gob.pe',
      },
    ],
  },
  {
    candidateNames: ['%vizcarra%cornejo%'],
    entries: [
      {
        type: 'cargo_electivo',
        position: 'Gobernador Regional de Moquegua',
        institution: 'Gobierno Regional de Moquegua',
        start_year: '2011',
        end_year: '2014',
        is_elected: true,
        notes: 'Moquegua fue 1er lugar en evaluación educativa 3 años consecutivos',
        source: 'wikipedia',
      },
      {
        type: 'cargo_publico',
        position: 'Primer Vicepresidente de la República',
        institution: 'Presidencia de la República',
        start_year: '2016',
        end_year: '2018',
        source: 'wikipedia',
      },
      {
        type: 'cargo_publico',
        position: 'Ministro de Transportes y Comunicaciones',
        institution: 'MTC',
        start_year: '2016',
        end_year: '2017',
        source: 'wikipedia',
      },
      {
        type: 'cargo_electivo',
        position: 'Presidente de la República',
        institution: 'Presidencia de la República',
        start_year: '2018',
        end_year: '2020',
        is_elected: false,
        notes: 'Asumió tras renuncia de PPK. Removido por "incapacidad moral". Condenado a 14 años de prisión por corrupción en 2025.',
        source: 'wikipedia',
      },
    ],
  },
  {
    candidateNames: ['%cerron%rojas%vladimir%'],
    entries: [
      {
        type: 'cargo_electivo',
        position: 'Gobernador Regional de Junín',
        institution: 'Gobierno Regional de Junín',
        party: 'Perú Libre',
        start_year: '2011',
        end_year: '2014',
        is_elected: true,
        notes: 'Condenado por negociación incompatible por favorecer consorcio en obras de saneamiento en La Oroya',
        source: 'wikipedia',
      },
      {
        type: 'cargo_electivo',
        position: 'Gobernador Regional de Junín (2do periodo)',
        institution: 'Gobierno Regional de Junín',
        party: 'Perú Libre',
        start_year: '2019',
        end_year: '2019',
        is_elected: true,
        notes: 'Suspendido a los 7 meses por sentencia penal. Prófugo desde octubre 2023.',
        source: 'wikipedia',
      },
    ],
  },
  {
    candidateNames: ['%acuña%peralta%', '%acuna%peralta%', '%cesar%acuña%', '%cesar%acuna%'],
    entries: [
      {
        type: 'cargo_electivo',
        position: 'Congresista',
        institution: 'Congreso de la República',
        party: 'Solidaridad Nacional',
        start_year: '2000',
        end_year: '2001',
        is_elected: true,
        source: 'congreso.gob.pe',
      },
      {
        type: 'cargo_electivo',
        position: 'Congresista',
        institution: 'Congreso de la República',
        party: 'Unidad Nacional / APP',
        start_year: '2001',
        end_year: '2006',
        is_elected: true,
        notes: 'Presentó la primera acusación constitucional contra Alberto Fujimori',
        source: 'congreso.gob.pe',
      },
      {
        type: 'cargo_electivo',
        position: 'Alcalde de Trujillo',
        institution: 'Municipalidad Provincial de Trujillo',
        party: 'Alianza para el Progreso',
        start_year: '2007',
        end_year: '2014',
        is_elected: true,
        notes: '2 periodos. Terminó con 44 años de dominio del APRA en Trujillo.',
        source: 'wikipedia',
      },
      {
        type: 'cargo_electivo',
        position: 'Gobernador Regional de La Libertad',
        institution: 'Gobierno Regional de La Libertad',
        party: 'Alianza para el Progreso',
        start_year: '2023',
        end_year: '2025',
        is_elected: true,
        notes: 'Renunció en octubre 2025 para postular a la presidencia. La Libertad se convirtió en epicentro de inseguridad.',
        source: 'wikipedia',
      },
    ],
  },
  {
    candidateNames: ['%lopez aliaga%'],
    entries: [
      {
        type: 'cargo_electivo',
        position: 'Regidor Provincial de Lima',
        institution: 'Municipalidad de Lima',
        party: 'Unidad Nacional',
        start_year: '2007',
        end_year: '2010',
        is_elected: true,
        source: 'wikipedia',
      },
      {
        type: 'eleccion',
        position: 'Candidato presidencial',
        party: 'Renovación Popular',
        start_year: '2021',
        is_elected: false,
        result: '11.75% - No pasó a segunda vuelta',
        source: 'jne',
      },
      {
        type: 'cargo_electivo',
        position: 'Alcalde de Lima Metropolitana',
        institution: 'Municipalidad de Lima',
        party: 'Renovación Popular',
        start_year: '2023',
        end_year: '2026',
        is_elected: true,
        notes: 'Elegido con 26.35%, el menor porcentaje para un alcalde de Lima desde 1963. Aprobación: 31%.',
        source: 'wikipedia',
      },
    ],
  },
  {
    candidateNames: ['%forsyth%'],
    entries: [
      {
        type: 'cargo_electivo',
        position: 'Regidor de La Victoria',
        institution: 'Municipalidad de La Victoria',
        party: 'Unidad Nacional',
        start_year: '2011',
        end_year: '2014',
        is_elected: true,
        source: 'wikipedia',
      },
      {
        type: 'cargo_electivo',
        position: 'Alcalde de La Victoria',
        institution: 'Municipalidad de La Victoria',
        party: 'Somos Perú',
        start_year: '2019',
        end_year: '2020',
        is_elected: true,
        notes: 'Renunció en octubre 2020 para postular a la presidencia',
        source: 'wikipedia',
      },
      {
        type: 'eleccion',
        position: 'Candidato presidencial',
        party: 'Victoria Nacional',
        start_year: '2021',
        is_elected: false,
        result: '5.6% - 8vo lugar',
        source: 'jne',
      },
    ],
  },
  {
    candidateNames: ['%nieto%montesinos%', '%jorge%nieto%'],
    entries: [
      {
        type: 'cargo_publico',
        position: 'Ministro de Cultura',
        institution: 'Ministerio de Cultura',
        start_year: '2016',
        end_year: '2016',
        notes: 'Gobierno de PPK',
        source: 'wikipedia',
      },
      {
        type: 'cargo_publico',
        position: 'Ministro de Defensa',
        institution: 'Ministerio de Defensa',
        start_year: '2016',
        end_year: '2017',
        notes: 'Renunció en protesta por el indulto a Alberto Fujimori. Investigado por presuntos aportes ilegales de OAS/Odebrecht.',
        source: 'wikipedia',
      },
    ],
  },
  {
    candidateNames: ['%perez tello%'],
    entries: [
      {
        type: 'cargo_electivo',
        position: 'Congresista por Lima',
        institution: 'Congreso de la República',
        party: 'Alianza por el Gran Cambio',
        start_year: '2011',
        end_year: '2016',
        is_elected: true,
        source: 'congreso.gob.pe',
      },
      {
        type: 'cargo_publico',
        position: 'Ministra de Justicia y Derechos Humanos',
        institution: 'MINJUSDH',
        start_year: '2016',
        end_year: '2017',
        notes: 'Gobierno de PPK. Impulsó reformas en el INPE y el Acuerdo Nacional por la Justicia.',
        source: 'wikipedia',
      },
    ],
  },
  {
    candidateNames: ['%belmont%cassinelli%'],
    entries: [
      {
        type: 'cargo_electivo',
        position: 'Alcalde de Lima Metropolitana',
        institution: 'Municipalidad de Lima',
        party: 'Movimiento Cívico OBRAS',
        start_year: '1990',
        end_year: '1995',
        is_elected: true,
        notes: '2 periodos. Primer outsider político. Av. Universitaria, bypass Alfonso Ugarte. Lima Patrimonio UNESCO 1991.',
        source: 'wikipedia',
      },
      {
        type: 'eleccion',
        position: 'Candidato presidencial',
        start_year: '1995',
        is_elected: false,
        result: '2.04% de votos',
        source: 'jne',
      },
      {
        type: 'cargo_electivo',
        position: 'Congresista',
        institution: 'Congreso de la República',
        party: 'Centro Front',
        start_year: '2009',
        end_year: '2011',
        is_elected: false,
        notes: 'Reemplazó al fallecido Alberto Andrade',
        source: 'congreso.gob.pe',
      },
    ],
  },
  {
    candidateNames: ['%molinelli%aristondo%', '%fiorella%molinelli%'],
    entries: [
      {
        type: 'cargo_publico',
        position: 'Viceministra de Transportes',
        institution: 'MTC',
        start_year: '2016',
        end_year: '2017',
        source: 'wikipedia',
      },
      {
        type: 'cargo_publico',
        position: 'Ministra de Desarrollo e Inclusión Social',
        institution: 'MIDIS',
        start_year: '2017',
        end_year: '2018',
        source: 'wikipedia',
      },
      {
        type: 'cargo_publico',
        position: 'Presidenta Ejecutiva de EsSalud',
        institution: 'EsSalud',
        start_year: '2018',
        end_year: '2021',
        notes: 'Expandió capacidad de 392 a 11,500 camas durante COVID-19. Renunció denunciando campaña en su contra.',
        source: 'wikipedia',
      },
    ],
  },
  {
    candidateNames: ['%olivera%vega%', '%fernando%olivera%'],
    entries: [
      {
        type: 'cargo_electivo',
        position: 'Diputado',
        institution: 'Cámara de Diputados',
        party: 'Convergencia Democrática',
        start_year: '1985',
        end_year: '1990',
        is_elected: true,
        notes: 'Diputado más joven elegido a los 26 años',
        source: 'wikipedia',
      },
      {
        type: 'cargo_electivo',
        position: 'Diputado',
        institution: 'Cámara de Diputados',
        party: 'Frente Independiente Moralizador',
        start_year: '1990',
        end_year: '1992',
        is_elected: true,
        notes: 'Diputado más votado con 225,550 votos. Disuelto por autogolpe de Fujimori.',
        source: 'wikipedia',
      },
      {
        type: 'cargo_electivo',
        position: 'Congresista Constituyente',
        institution: 'Congreso Constituyente Democrático',
        party: 'FIM',
        start_year: '1992',
        end_year: '1995',
        is_elected: true,
        source: 'wikipedia',
      },
      {
        type: 'cargo_electivo',
        position: 'Congresista',
        institution: 'Congreso de la República',
        party: 'FIM',
        start_year: '1995',
        end_year: '2001',
        is_elected: true,
        source: 'congreso.gob.pe',
      },
      {
        type: 'cargo_publico',
        position: 'Ministro de Justicia',
        institution: 'Ministerio de Justicia',
        start_year: '2001',
        end_year: '2001',
        notes: 'Gobierno de Alejandro Toledo',
        source: 'wikipedia',
      },
      {
        type: 'cargo_publico',
        position: 'Embajador del Perú en España',
        institution: 'Cancillería',
        start_year: '2002',
        end_year: '2005',
        source: 'wikipedia',
      },
    ],
  },
]

async function main() {
  console.log('=== Enriching political trajectory data ===\n')

  let updated = 0

  for (const enrichment of ENRICHMENTS) {
    // Find matching candidates
    const conditions = enrichment.candidateNames
      .map((name) => `full_name ILIKE '${name}'`)
      .join(' OR ')

    const candidates = await sql`
      SELECT id, full_name, political_trajectory
      FROM candidates
      WHERE cargo = 'presidente'
      AND (${sql.unsafe(conditions)})
    `

    if (candidates.length === 0) {
      console.log(`  WARNING: No match for ${enrichment.candidateNames[0]}`)
      continue
    }

    for (const candidate of candidates) {
      const existingTrajectory = (candidate.political_trajectory as TrajectoryEntry[]) || []

      // Merge: keep existing partidario/eleccion entries, add new cargo entries
      const existingTypes = new Set(
        existingTrajectory.map(
          (e: TrajectoryEntry) => `${e.type}:${e.position}:${e.start_year || ''}`
        )
      )

      const newEntries = enrichment.entries.filter(
        (e) => !existingTypes.has(`${e.type}:${e.position}:${e.start_year || ''}`)
      )

      if (newEntries.length === 0) {
        console.log(`  SKIP: ${candidate.full_name} (all entries already exist)`)
        continue
      }

      const mergedTrajectory = [...existingTrajectory, ...newEntries]

      await sql`
        UPDATE candidates
        SET political_trajectory = ${JSON.stringify(mergedTrajectory)}::jsonb
        WHERE id = ${candidate.id}::uuid
      `

      console.log(
        `  UPDATE: ${candidate.full_name} (+${newEntries.length} entries, total: ${mergedTrajectory.length})`
      )
      updated++
    }
  }

  console.log(`\nDone: ${updated} candidates updated`)
}

main().catch(console.error)
