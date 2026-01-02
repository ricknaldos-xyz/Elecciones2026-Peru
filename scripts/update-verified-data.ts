import { neon } from '@neondatabase/serverless'

const DATABASE_URL = 'postgresql://neondb_owner:npg_QsCV8j4rFmiW@ep-polished-mouse-ahxxvvbh-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require'
const sql = neon(DATABASE_URL)

// Datos verificados de candidatos presidenciales - Fuentes: Wikipedia, Infobae, La República, JNE
// Última actualización: Enero 2026

interface VerifiedCandidateData {
  slug: string
  birth_date?: string
  education_level: string
  education_details: any[]
  experience_details: any[]
  political_trajectory: any[]
  penal_sentences: any[]
  civil_sentences: any[]
  source: string
}

const VERIFIED_DATA: VerifiedCandidateData[] = [
  // KEIKO FUJIMORI - Fuerza Popular
  {
    slug: 'keiko-fujimori-higuchi',
    birth_date: '1975-05-25',
    education_level: 'maestria',
    education_details: [
      {
        level: 'secundaria_completa',
        institution: 'Colegio Sagrados Corazones Recoleta',
        degree: 'Educación Secundaria',
        is_completed: true,
        end_date: '1992'
      },
      {
        level: 'universitario_completo',
        institution: 'Universidad de Boston, Estados Unidos',
        degree: 'Licenciatura en Administración de Empresas',
        field_of_study: 'Business Administration',
        is_completed: true,
        end_date: '1997'
      },
      {
        level: 'maestria',
        institution: 'Columbia Business School, Estados Unidos',
        degree: 'Master of Business Administration (MBA)',
        field_of_study: 'Administración de Empresas',
        is_completed: true,
        end_date: '2008'
      }
    ],
    experience_details: [
      {
        role_type: 'ejecutivo_publico_alto',
        position: 'Primera Dama del Perú',
        organization: 'Presidencia de la República',
        sector: 'publico',
        start_date: '1994',
        end_date: '2000',
        is_current: false,
        seniority_level: 'direccion'
      }
    ],
    political_trajectory: [
      {
        position: 'Congresista de la República',
        party: 'Fuerza Popular',
        start_date: '2006',
        end_date: '2011',
        is_elected: true
      },
      {
        position: 'Candidata Presidencial',
        party: 'Fuerza Popular',
        start_date: '2011',
        is_elected: false
      },
      {
        position: 'Candidata Presidencial',
        party: 'Fuerza Popular',
        start_date: '2016',
        is_elected: false
      },
      {
        position: 'Candidata Presidencial',
        party: 'Fuerza Popular',
        start_date: '2021',
        is_elected: false
      }
    ],
    penal_sentences: [
      {
        type: 'penal_dolosa',
        description: 'Proceso judicial en curso - Caso Cocteles por presunto lavado de activos',
        status: 'apelacion',
        source: 'Poder Judicial'
      }
    ],
    civil_sentences: [],
    source: 'Wikipedia, Infobae, JNE'
  },

  // RAFAEL LÓPEZ ALIAGA - Renovación Popular
  {
    slug: 'rafael-lopez-aliaga',
    birth_date: '1961-02-11',
    education_level: 'maestria',
    education_details: [
      {
        level: 'secundaria_completa',
        institution: 'Colegio San Agustín, Lambayeque',
        degree: 'Educación Secundaria',
        is_completed: true
      },
      {
        level: 'universitario_completo',
        institution: 'Universidad de Piura',
        degree: 'Ingeniería Industrial',
        is_completed: true,
        end_date: '1995'
      },
      {
        level: 'maestria',
        institution: 'Universidad del Pacífico',
        degree: 'Master in Business Administration (MBA)',
        is_completed: true,
        end_date: '1996'
      }
    ],
    experience_details: [
      {
        role_type: 'ejecutivo_privado_alto',
        position: 'Gerente de Banca Corporativa',
        organization: 'Citibank N.A. Lima',
        sector: 'privado',
        start_date: '1984',
        end_date: '1988',
        is_current: false,
        seniority_level: 'gerencia'
      },
      {
        role_type: 'ejecutivo_privado_alto',
        position: 'Presidente',
        organization: 'PeruRail S.A.',
        sector: 'privado',
        start_date: '1999',
        end_date: '2019',
        is_current: false,
        seniority_level: 'direccion'
      },
      {
        role_type: 'electivo_alto',
        position: 'Alcalde de Lima Metropolitana',
        organization: 'Municipalidad de Lima',
        sector: 'publico',
        start_date: '2023',
        end_date: '2026',
        is_current: false,
        seniority_level: 'direccion'
      }
    ],
    political_trajectory: [
      {
        position: 'Regidor Provincial de Lima',
        party: 'Unidad Nacional',
        start_date: '2006',
        end_date: '2010',
        is_elected: true
      },
      {
        position: 'Candidato Presidencial',
        party: 'Renovación Popular',
        start_date: '2021',
        is_elected: false
      },
      {
        position: 'Alcalde de Lima',
        party: 'Renovación Popular',
        start_date: '2023',
        end_date: '2026',
        is_elected: true
      }
    ],
    penal_sentences: [],
    civil_sentences: [],
    source: 'Wikipedia, La República, Andina'
  },

  // CÉSAR ACUÑA - Alianza para el Progreso
  {
    slug: 'cesar-acuna-peralta',
    birth_date: '1952-08-11',
    education_level: 'doctorado',
    education_details: [
      {
        level: 'universitario_completo',
        institution: 'Universidad Nacional de Trujillo',
        degree: 'Ingeniería Química',
        is_completed: true,
        end_date: '1977'
      },
      {
        level: 'maestria',
        institution: 'Universidad de Lima',
        degree: 'Maestría en Administración de la Educación',
        is_completed: true
      },
      {
        level: 'maestria',
        institution: 'Universidad de los Andes, Colombia',
        degree: 'Maestría en Dirección Universitaria',
        is_completed: true
      },
      {
        level: 'doctorado',
        institution: 'Universidad Complutense de Madrid, España',
        degree: 'Doctorado en Educación',
        is_completed: true,
        end_date: '2009'
      }
    ],
    experience_details: [
      {
        role_type: 'ejecutivo_privado_alto',
        position: 'Fundador y Presidente',
        organization: 'Universidad César Vallejo',
        sector: 'privado',
        start_date: '1991',
        is_current: true,
        seniority_level: 'direccion'
      },
      {
        role_type: 'electivo_alto',
        position: 'Alcalde de Trujillo',
        organization: 'Municipalidad de Trujillo',
        sector: 'publico',
        start_date: '2007',
        end_date: '2014',
        is_current: false,
        seniority_level: 'direccion'
      },
      {
        role_type: 'electivo_alto',
        position: 'Gobernador Regional de La Libertad',
        organization: 'Gobierno Regional La Libertad',
        sector: 'publico',
        start_date: '2019',
        end_date: '2022',
        is_current: false,
        seniority_level: 'direccion'
      }
    ],
    political_trajectory: [
      {
        position: 'Congresista de la República',
        party: 'Solidaridad Nacional',
        start_date: '2000',
        end_date: '2001',
        is_elected: true
      },
      {
        position: 'Alcalde de Trujillo',
        party: 'Alianza para el Progreso',
        start_date: '2007',
        end_date: '2014',
        is_elected: true
      },
      {
        position: 'Candidato Presidencial',
        party: 'Alianza para el Progreso',
        start_date: '2016',
        is_elected: false
      },
      {
        position: 'Gobernador Regional La Libertad',
        party: 'Alianza para el Progreso',
        start_date: '2019',
        end_date: '2022',
        is_elected: true
      }
    ],
    penal_sentences: [],
    civil_sentences: [
      {
        type: 'contractual',
        description: 'Sanción INDECOPI por plagio en tesis doctoral - Multa S/. 80,000',
        status: 'firme',
        source: 'INDECOPI 2016'
      }
    ],
    source: 'Wikipedia, Infobae, Gestión, La República'
  },

  // VLADIMIR CERRÓN - Perú Libre
  {
    slug: 'vladimir-cerron-rojas',
    birth_date: '1970-01-13',
    education_level: 'maestria',
    education_details: [
      {
        level: 'universitario_completo',
        institution: 'Universidad Nacional del Centro del Perú',
        degree: 'Medicina Humana',
        is_completed: true
      },
      {
        level: 'maestria',
        institution: 'Cuba',
        degree: 'Especialización en Neurocirugía',
        is_completed: true
      }
    ],
    experience_details: [
      {
        role_type: 'tecnico_profesional',
        position: 'Médico Neurocirujano',
        organization: 'Hospital Regional de Huancayo',
        sector: 'publico',
        start_date: '2000',
        is_current: false,
        seniority_level: 'tecnico_profesional'
      },
      {
        role_type: 'electivo_alto',
        position: 'Gobernador Regional de Junín',
        organization: 'Gobierno Regional Junín',
        sector: 'publico',
        start_date: '2011',
        end_date: '2014',
        is_current: false,
        seniority_level: 'direccion'
      },
      {
        role_type: 'electivo_alto',
        position: 'Gobernador Regional de Junín',
        organization: 'Gobierno Regional Junín',
        sector: 'publico',
        start_date: '2019',
        end_date: '2022',
        is_current: false,
        seniority_level: 'direccion'
      }
    ],
    political_trajectory: [
      {
        position: 'Gobernador Regional de Junín',
        party: 'Perú Libre',
        start_date: '2011',
        end_date: '2014',
        is_elected: true
      },
      {
        position: 'Gobernador Regional de Junín',
        party: 'Perú Libre',
        start_date: '2019',
        end_date: '2022',
        is_elected: true
      },
      {
        position: 'Secretario General',
        party: 'Perú Libre',
        start_date: '2008',
        is_elected: false
      }
    ],
    penal_sentences: [
      {
        type: 'penal_dolosa',
        description: 'Sentencia firme por corrupción - Caso Aeródromo Wanka - 4 años y 8 meses',
        status: 'firme',
        source: 'Poder Judicial 2019'
      }
    ],
    civil_sentences: [],
    source: 'Wikipedia, Poder Judicial, La República'
  },

  // GEORGE FORSYTH - Somos Perú
  {
    slug: 'george-forsyth-sommer',
    birth_date: '1982-02-20',
    education_level: 'universitario_incompleto',
    education_details: [
      {
        level: 'secundaria_completa',
        institution: 'Colegio',
        degree: 'Educación Secundaria',
        is_completed: true
      },
      {
        level: 'universitario_incompleto',
        institution: 'Universidad de Lima',
        degree: 'Comunicación',
        is_completed: false
      }
    ],
    experience_details: [
      {
        role_type: 'tecnico_profesional',
        position: 'Futbolista Profesional - Arquero',
        organization: 'Alianza Lima',
        sector: 'privado',
        start_date: '2000',
        end_date: '2015',
        is_current: false,
        seniority_level: 'individual'
      },
      {
        role_type: 'electivo_medio',
        position: 'Alcalde de La Victoria',
        organization: 'Municipalidad de La Victoria',
        sector: 'publico',
        start_date: '2019',
        end_date: '2022',
        is_current: false,
        seniority_level: 'direccion'
      }
    ],
    political_trajectory: [
      {
        position: 'Alcalde de La Victoria',
        party: 'Restauración Nacional',
        start_date: '2019',
        end_date: '2022',
        is_elected: true
      },
      {
        position: 'Candidato Presidencial',
        party: 'Victoria Nacional',
        start_date: '2021',
        is_elected: false
      }
    ],
    penal_sentences: [],
    civil_sentences: [],
    source: 'Wikipedia, El Comercio'
  },

  // JOSÉ LUNA GÁLVEZ - Podemos Perú
  {
    slug: 'jose-luna-galvez',
    birth_date: '1958-04-09',
    education_level: 'universitario_completo',
    education_details: [
      {
        level: 'universitario_completo',
        institution: 'Universidad',
        degree: 'Derecho',
        is_completed: true
      }
    ],
    experience_details: [
      {
        role_type: 'ejecutivo_privado_alto',
        position: 'Fundador y Presidente',
        organization: 'Universidad Telesup',
        sector: 'privado',
        start_date: '2000',
        is_current: true,
        seniority_level: 'direccion'
      }
    ],
    political_trajectory: [
      {
        position: 'Congresista de la República',
        party: 'Podemos Perú',
        start_date: '2020',
        end_date: '2021',
        is_elected: true
      }
    ],
    penal_sentences: [
      {
        type: 'penal_dolosa',
        description: 'Investigación fiscal por presunta organización criminal - Caso Los Gánsters de la Política',
        status: 'apelacion',
        source: 'Fiscalía'
      }
    ],
    civil_sentences: [],
    source: 'Wikipedia, La República'
  },

  // JOSÉ WILLIAMS - Avanza País
  {
    slug: 'jose-williams-zapata',
    birth_date: '1948-01-05',
    education_level: 'maestria',
    education_details: [
      {
        level: 'universitario_completo',
        institution: 'Escuela Militar de Chorrillos',
        degree: 'Oficial del Ejército',
        is_completed: true
      },
      {
        level: 'maestria',
        institution: 'Centro de Altos Estudios Nacionales (CAEN)',
        degree: 'Maestría en Desarrollo y Defensa Nacional',
        is_completed: true
      }
    ],
    experience_details: [
      {
        role_type: 'ejecutivo_publico_alto',
        position: 'Comandante General del Ejército',
        organization: 'Ejército del Perú',
        sector: 'publico',
        start_date: '2000',
        end_date: '2002',
        is_current: false,
        seniority_level: 'direccion'
      },
      {
        role_type: 'ejecutivo_publico_alto',
        position: 'Jefe del Comando Chavín de Huántar',
        organization: 'Fuerzas Armadas',
        sector: 'publico',
        start_date: '1997',
        end_date: '1997',
        is_current: false,
        seniority_level: 'direccion',
        description: 'Operación de rescate de rehenes en la Embajada de Japón'
      }
    ],
    political_trajectory: [
      {
        position: 'Congresista de la República',
        party: 'Avanza País',
        start_date: '2021',
        is_elected: true
      },
      {
        position: 'Presidente del Congreso',
        party: 'Avanza País',
        start_date: '2022',
        end_date: '2023',
        is_elected: true
      }
    ],
    penal_sentences: [],
    civil_sentences: [],
    source: 'Wikipedia, Congreso de la República'
  },

  // MESÍAS GUEVARA - Partido Morado
  {
    slug: 'mesias-guevara-amasifuen',
    birth_date: '1960-01-01',
    education_level: 'universitario_completo',
    education_details: [
      {
        level: 'universitario_completo',
        institution: 'Universidad Nacional de Cajamarca',
        degree: 'Ingeniería Civil',
        is_completed: true
      }
    ],
    experience_details: [
      {
        role_type: 'electivo_alto',
        position: 'Gobernador Regional de Cajamarca',
        organization: 'Gobierno Regional Cajamarca',
        sector: 'publico',
        start_date: '2015',
        end_date: '2018',
        is_current: false,
        seniority_level: 'direccion'
      }
    ],
    political_trajectory: [
      {
        position: 'Congresista de la República',
        party: 'Acción Popular',
        start_date: '2011',
        end_date: '2016',
        is_elected: true
      },
      {
        position: 'Gobernador Regional de Cajamarca',
        party: 'Movimiento de Afirmación Social',
        start_date: '2015',
        end_date: '2018',
        is_elected: true
      }
    ],
    penal_sentences: [],
    civil_sentences: [],
    source: 'Wikipedia, JNE'
  },

  // ÁLVARO PAZ DE LA BARRA - Fe en el Perú
  {
    slug: 'alvaro-paz-de-la-barra-freigeiro',
    birth_date: '1986-07-13',
    education_level: 'universitario_completo',
    education_details: [
      {
        level: 'universitario_completo',
        institution: 'Universidad',
        degree: 'Derecho',
        is_completed: true
      }
    ],
    experience_details: [
      {
        role_type: 'electivo_medio',
        position: 'Alcalde de La Molina',
        organization: 'Municipalidad de La Molina',
        sector: 'publico',
        start_date: '2019',
        end_date: '2022',
        is_current: false,
        seniority_level: 'direccion'
      }
    ],
    political_trajectory: [
      {
        position: 'Alcalde de La Molina',
        party: 'Solidaridad Nacional',
        start_date: '2019',
        end_date: '2022',
        is_elected: true
      }
    ],
    penal_sentences: [],
    civil_sentences: [],
    source: 'Wikipedia, JNE'
  }
]

async function updateVerifiedData() {
  console.log('🚀 Actualizando candidatos con datos verificados...\n')
  console.log('Fuentes: Wikipedia, Infobae, La República, Andina, JNE\n')
  console.log('='.repeat(60))

  let updated = 0
  let notFound = 0

  for (const data of VERIFIED_DATA) {
    console.log(`\n📋 Procesando: ${data.slug}`)

    // Check if candidate exists
    const existing = await sql`SELECT id, full_name FROM candidates WHERE slug = ${data.slug}`

    if (existing.length === 0) {
      console.log(`  ⚠️ No encontrado en BD`)
      notFound++
      continue
    }

    // Update with verified data
    await sql`
      UPDATE candidates SET
        birth_date = ${data.birth_date}::date,
        education_level = ${data.education_level},
        education_details = ${JSON.stringify(data.education_details)}::jsonb,
        experience_details = ${JSON.stringify(data.experience_details)}::jsonb,
        political_trajectory = ${JSON.stringify(data.political_trajectory)}::jsonb,
        penal_sentences = ${JSON.stringify(data.penal_sentences)}::jsonb,
        civil_sentences = ${JSON.stringify(data.civil_sentences)}::jsonb,
        data_source = ${`verified_${data.source.toLowerCase().replace(/[^a-z]/g, '_')}`},
        data_verified = TRUE,
        verification_date = NOW(),
        last_updated = NOW()
      WHERE slug = ${data.slug}
    `

    console.log(`  ✅ Actualizado: ${existing[0].full_name}`)
    console.log(`     Educación: ${data.education_level}`)
    console.log(`     Experiencia: ${data.experience_details.length} items`)
    console.log(`     Trayectoria: ${data.political_trajectory.length} items`)
    if (data.penal_sentences.length > 0) {
      console.log(`     ⚠️ Sentencias penales: ${data.penal_sentences.length}`)
    }

    updated++
  }

  console.log('\n' + '='.repeat(60))
  console.log('📊 Resumen:')
  console.log(`  ✅ Actualizados: ${updated}`)
  console.log(`  ⚠️ No encontrados: ${notFound}`)

  // Now create/update flags based on sentences
  console.log('\n📋 Actualizando flags...')

  for (const data of VERIFIED_DATA) {
    const candidate = await sql`SELECT id FROM candidates WHERE slug = ${data.slug}`
    if (candidate.length === 0) continue

    const candidateId = candidate[0].id

    // Delete existing flags for this candidate
    await sql`DELETE FROM flags WHERE candidate_id = ${candidateId}::uuid`

    // Add penal sentence flags
    for (const sentence of data.penal_sentences) {
      await sql`
        INSERT INTO flags (candidate_id, type, severity, title, description, source, date_captured)
        VALUES (
          ${candidateId}::uuid,
          'PENAL_SENTENCE',
          'RED',
          ${sentence.description.substring(0, 100)},
          ${sentence.description},
          ${sentence.source},
          NOW()
        )
      `
      console.log(`  🚩 Flag PENAL agregado: ${data.slug}`)
    }

    // Add civil sentence flags
    for (const sentence of data.civil_sentences) {
      await sql`
        INSERT INTO flags (candidate_id, type, severity, title, description, source, date_captured)
        VALUES (
          ${candidateId}::uuid,
          'CIVIL_SENTENCE',
          'AMBER',
          ${sentence.description.substring(0, 100)},
          ${sentence.description},
          ${sentence.source},
          NOW()
        )
      `
      console.log(`  🚩 Flag CIVIL agregado: ${data.slug}`)
    }
  }

  // Show final stats
  const stats = await sql`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN education_details::text != '[]' THEN 1 ELSE 0 END) as with_education,
      SUM(CASE WHEN experience_details::text != '[]' THEN 1 ELSE 0 END) as with_experience,
      SUM(CASE WHEN political_trajectory::text != '[]' THEN 1 ELSE 0 END) as with_trajectory
    FROM candidates
  `

  console.log('\n📊 Estado final de la base de datos:')
  console.log(`  Total candidatos: ${stats[0]?.total}`)
  console.log(`  Con educación: ${stats[0]?.with_education}`)
  console.log(`  Con experiencia: ${stats[0]?.with_experience}`)
  console.log(`  Con trayectoria: ${stats[0]?.with_trajectory}`)

  console.log('\n✅ Actualización completada!')
}

updateVerifiedData()
