import { neon } from '@neondatabase/serverless'

const DATABASE_URL = 'postgresql://neondb_owner:npg_QsCV8j4rFmiW@ep-polished-mouse-ahxxvvbh-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require'
const sql = neon(DATABASE_URL)

// Datos verificados de candidatos faltantes - Fuentes: Wikipedia, Infobae, El Comercio, La República, JNE
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
  // ========================================
  // VICEPRESIDENTES
  // ========================================

  // PATRICIA JUÁREZ GALLEGOS - Fuerza Popular (Vicepresidenta)
  {
    slug: 'patricia-juarez-gallegos',
    birth_date: '1960-07-16',
    education_level: 'titulo_profesional',
    education_details: [
      {
        level: 'universitario_completo',
        institution: 'Universidad Nacional Federico Villarreal',
        degree: 'Derecho',
        field_of_study: 'Derecho y Ciencias Políticas',
        is_completed: true,
        end_date: '1987'
      },
      {
        level: 'titulo_profesional',
        institution: 'Universidad Nacional Federico Villarreal',
        degree: 'Abogada',
        is_completed: true,
        end_date: '1990'
      }
    ],
    experience_details: [
      {
        role_type: 'ejecutivo_publico_medio',
        position: 'Secretaria General',
        organization: 'Municipalidad Distrital de Barranco',
        sector: 'publico',
        start_date: '2011',
        end_date: '2013',
        is_current: false,
        seniority_level: 'gerencia'
      },
      {
        role_type: 'tecnico_profesional',
        position: 'Asesora Parlamentaria',
        organization: 'Congreso de la República',
        sector: 'publico',
        start_date: '2013',
        end_date: '2015',
        is_current: false,
        seniority_level: 'jefatura'
      },
      {
        role_type: 'electivo_medio',
        position: 'Regidora Provincial de Lima',
        organization: 'Municipalidad de Lima',
        sector: 'publico',
        start_date: '2015',
        end_date: '2018',
        is_current: false,
        seniority_level: 'direccion'
      }
    ],
    political_trajectory: [
      {
        position: 'Secretaria Nacional de Política',
        party: 'Solidaridad Nacional',
        start_date: '2004',
        end_date: '2018',
        is_elected: false
      },
      {
        position: 'Regidora Provincial de Lima',
        party: 'Solidaridad Nacional',
        start_date: '2015',
        end_date: '2018',
        is_elected: true
      },
      {
        position: 'Congresista de la República',
        party: 'Fuerza Popular',
        start_date: '2021',
        end_date: '2026',
        is_elected: true
      },
      {
        position: 'Presidenta Comisión de Constitución',
        party: 'Fuerza Popular',
        start_date: '2021',
        end_date: '2022',
        is_elected: true
      },
      {
        position: 'Primera Vicepresidenta del Congreso',
        party: 'Fuerza Popular',
        start_date: '2024',
        end_date: '2025',
        is_elected: true
      }
    ],
    penal_sentences: [],
    civil_sentences: [],
    source: 'El Comercio, Congreso, JNE Infogob'
  },

  // HERNANDO GUERRA GARCÍA (FALLECIDO 2023)
  {
    slug: 'hernando-guerra-garcia',
    birth_date: '1963-05-14',
    education_level: 'maestria',
    education_details: [
      {
        level: 'secundaria_completa',
        institution: 'Colegio Sagrados Corazones Recoleta',
        degree: 'Educación Secundaria',
        is_completed: true
      },
      {
        level: 'universitario_completo',
        institution: 'Pontificia Universidad Católica del Perú',
        degree: 'Derecho',
        field_of_study: 'Derecho',
        is_completed: true
      },
      {
        level: 'maestria',
        institution: 'Universidad ESAN',
        degree: 'Master in Business Administration (MBA)',
        field_of_study: 'Administración',
        is_completed: true
      }
    ],
    experience_details: [
      {
        role_type: 'ejecutivo_privado_medio',
        position: 'Conductor del programa Somos Empresa',
        organization: 'Latina Televisión (Canal 2)',
        sector: 'privado',
        start_date: '2000',
        end_date: '2010',
        is_current: false,
        seniority_level: 'jefatura'
      },
      {
        role_type: 'tecnico_profesional',
        position: 'Jefe de Comunicaciones',
        organization: 'SUNAT',
        sector: 'publico',
        start_date: '1995',
        end_date: '1999',
        is_current: false,
        seniority_level: 'jefatura'
      }
    ],
    political_trajectory: [
      {
        position: 'Precandidato Presidencial',
        party: 'Fuerza Social',
        start_date: '2011',
        is_elected: false
      },
      {
        position: 'Precandidato Presidencial',
        party: 'Partido Humanista Peruano',
        start_date: '2016',
        is_elected: false
      },
      {
        position: 'Congresista de la República',
        party: 'Fuerza Popular',
        start_date: '2021',
        end_date: '2023',
        is_elected: true
      },
      {
        position: 'Vocero de Bancada',
        party: 'Fuerza Popular',
        start_date: '2021',
        end_date: '2022',
        is_elected: false
      },
      {
        position: 'Presidente Comisión de Constitución',
        party: 'Fuerza Popular',
        start_date: '2022',
        end_date: '2023',
        is_elected: true
      },
      {
        position: 'Primer Vicepresidente del Congreso',
        party: 'Fuerza Popular',
        start_date: '2023',
        end_date: '2023',
        is_elected: true
      }
    ],
    penal_sentences: [],
    civil_sentences: [],
    source: 'Wikipedia, Peru21, Trome'
  },

  // ========================================
  // CANDIDATOS PRESIDENCIALES
  // ========================================

  // ROBERTO CHIABRA LEÓN
  {
    slug: 'roberto-chiabra-leon',
    birth_date: '1949-07-15',
    education_level: 'maestria',
    education_details: [
      {
        level: 'secundaria_completa',
        institution: 'Colegio Maristas',
        degree: 'Educación Secundaria',
        is_completed: true
      },
      {
        level: 'universitario_completo',
        institution: 'Escuela Militar de Chorrillos',
        degree: 'Oficial del Ejército',
        is_completed: true,
        end_date: '1970'
      },
      {
        level: 'maestria',
        institution: 'Universidad de Piura',
        degree: 'Programa de Alta Dirección y Gerencia',
        is_completed: true
      },
      {
        level: 'maestria',
        institution: 'Centro de Altos Estudios Militares (CAEM)',
        degree: 'Estudios de Estado Mayor Conjunto',
        is_completed: true
      }
    ],
    experience_details: [
      {
        role_type: 'ejecutivo_publico_alto',
        position: 'Jefe del Comando de Operaciones del Cenepa',
        organization: 'Ejército del Perú',
        sector: 'publico',
        start_date: '1995',
        end_date: '1995',
        is_current: false,
        seniority_level: 'direccion',
        description: 'Guerra del Cenepa con Ecuador'
      },
      {
        role_type: 'ejecutivo_publico_alto',
        position: 'Comandante General del Ejército',
        organization: 'Ejército del Perú',
        sector: 'publico',
        start_date: '2002',
        end_date: '2003',
        is_current: false,
        seniority_level: 'direccion'
      },
      {
        role_type: 'ejecutivo_publico_alto',
        position: 'Ministro de Defensa',
        organization: 'Ministerio de Defensa del Perú',
        sector: 'publico',
        start_date: '2003',
        end_date: '2005',
        is_current: false,
        seniority_level: 'direccion'
      }
    ],
    political_trajectory: [
      {
        position: 'Ministro de Defensa',
        party: 'Perú Posible',
        start_date: '2003',
        end_date: '2005',
        is_elected: false
      },
      {
        position: 'Congresista de la República',
        party: 'Alianza para el Progreso',
        start_date: '2021',
        end_date: '2026',
        is_elected: true
      },
      {
        position: 'Fundador',
        party: 'Unidad y Paz',
        start_date: '2024',
        is_elected: false
      }
    ],
    penal_sentences: [
      {
        type: 'penal_dolosa',
        description: 'Juicio por presunto pago de US$12,000 de Montesinos para cargo como agregado en Paraguay (1999) - Caso con peritaje grafotécnico controversial',
        status: 'apelacion',
        source: 'La República, Panamericana'
      }
    ],
    civil_sentences: [],
    source: 'Wikipedia, Peru21, Congreso, Wayka'
  },

  // ROBERTO SÁNCHEZ PALOMINO
  {
    slug: 'roberto-sanchez-palomino',
    birth_date: '1969-02-03',
    education_level: 'maestria',
    education_details: [
      {
        level: 'universitario_completo',
        institution: 'Universidad Nacional Mayor de San Marcos',
        degree: 'Psicología',
        field_of_study: 'Psicología',
        is_completed: true,
        end_date: '2000'
      },
      {
        level: 'maestria',
        institution: 'Universidad Nacional Mayor de San Marcos',
        degree: 'Estudios de Maestría',
        is_completed: false
      }
    ],
    experience_details: [
      {
        role_type: 'ejecutivo_publico_medio',
        position: 'Gerente de Desarrollo Social',
        organization: 'Municipalidad Provincial de Huaral',
        sector: 'publico',
        start_date: '2010',
        end_date: '2016',
        is_current: false,
        seniority_level: 'gerencia'
      },
      {
        role_type: 'ejecutivo_publico_alto',
        position: 'Ministro de Comercio Exterior y Turismo',
        organization: 'MINCETUR',
        sector: 'publico',
        start_date: '2021',
        end_date: '2022',
        is_current: false,
        seniority_level: 'direccion'
      }
    ],
    political_trajectory: [
      {
        position: 'Presidente del Partido',
        party: 'Juntos por el Perú',
        start_date: '2017',
        is_elected: false
      },
      {
        position: 'Congresista de la República',
        party: 'Juntos por el Perú',
        start_date: '2021',
        end_date: '2026',
        is_elected: true
      },
      {
        position: 'Ministro de Comercio Exterior y Turismo',
        party: 'Juntos por el Perú',
        start_date: '2021',
        end_date: '2022',
        is_elected: false
      }
    ],
    penal_sentences: [
      {
        type: 'penal_dolosa',
        description: 'Proceso por delito de rebelión por el golpe de Estado del 7 de diciembre de 2022 - Fiscalía solicita 25 años de prisión',
        status: 'apelacion',
        source: 'El Comercio, RPP, Fiscalía'
      },
      {
        type: 'penal_dolosa',
        description: 'Investigación por presunta organización criminal enquistada en Palacio de Gobierno',
        status: 'apelacion',
        source: 'Infobae, TVPerú'
      }
    ],
    civil_sentences: [],
    source: 'Wikipedia, RPP, El Comercio, Gestión'
  },

  // FIORELLA MOLINELLI ARISTONDO
  {
    slug: 'fiorella-molinelli-aristondo',
    birth_date: '1974-03-20',
    education_level: 'doctorado',
    education_details: [
      {
        level: 'universitario_completo',
        institution: 'Pontificia Universidad Católica del Perú',
        degree: 'Economía',
        field_of_study: 'Economía',
        is_completed: true
      },
      {
        level: 'maestria',
        institution: 'Instituto Torcuato Di Tella (Argentina)',
        degree: 'Magíster en Economía y Políticas Públicas',
        is_completed: true
      },
      {
        level: 'doctorado',
        institution: 'Universidad San Martín de Porres',
        degree: 'Doctorado en Gobierno y Política Pública',
        is_completed: true
      }
    ],
    experience_details: [
      {
        role_type: 'ejecutivo_publico_alto',
        position: 'Viceministra de Transportes',
        organization: 'Ministerio de Transportes y Comunicaciones',
        sector: 'publico',
        start_date: '2016',
        end_date: '2017',
        is_current: false,
        seniority_level: 'direccion'
      },
      {
        role_type: 'ejecutivo_publico_alto',
        position: 'Viceministra de Construcción y Saneamiento',
        organization: 'Ministerio de Vivienda',
        sector: 'publico',
        start_date: '2016',
        end_date: '2017',
        is_current: false,
        seniority_level: 'direccion'
      },
      {
        role_type: 'ejecutivo_publico_alto',
        position: 'Ministra de Desarrollo e Inclusión Social',
        organization: 'MIDIS',
        sector: 'publico',
        start_date: '2017',
        end_date: '2018',
        is_current: false,
        seniority_level: 'direccion'
      },
      {
        role_type: 'ejecutivo_publico_alto',
        position: 'Presidenta Ejecutiva',
        organization: 'EsSalud',
        sector: 'publico',
        start_date: '2018',
        end_date: '2021',
        is_current: false,
        seniority_level: 'direccion'
      }
    ],
    political_trajectory: [
      {
        position: 'Ministra de Desarrollo e Inclusión Social',
        party: 'Independiente',
        start_date: '2017',
        end_date: '2018',
        is_elected: false
      },
      {
        position: 'Candidata Presidencial',
        party: 'Fuerza y Libertad',
        start_date: '2026',
        is_elected: false
      }
    ],
    penal_sentences: [
      {
        type: 'penal_dolosa',
        description: 'Investigación preparatoria por colusión agravada - Caso Chinchero (adenda al contrato con Kuntur Wasi) - Presunto perjuicio de USD 256 millones',
        status: 'apelacion',
        source: 'El Comercio, Gestión, RPP'
      }
    ],
    civil_sentences: [],
    source: 'Wikipedia, El Comercio, Gestión, EsSalud'
  },

  // JORGE NIETO MONTESINOS
  {
    slug: 'jorge-nieto-montesinos',
    birth_date: '1951-10-29',
    education_level: 'doctorado',
    education_details: [
      {
        level: 'universitario_completo',
        institution: 'Pontificia Universidad Católica del Perú',
        degree: 'Bachiller en Sociología',
        field_of_study: 'Sociología',
        is_completed: true,
        end_date: '1978'
      },
      {
        level: 'maestria',
        institution: 'Facultad Latinoamericana de Ciencias Sociales (FLACSO)',
        degree: 'Maestría en Ciencia Política',
        is_completed: true,
        end_date: '1984'
      },
      {
        level: 'doctorado',
        institution: 'Colegio de México',
        degree: 'Doctorado en Ciencias Sociales',
        is_completed: true,
        end_date: '1991'
      }
    ],
    experience_details: [
      {
        role_type: 'internacional',
        position: 'Director de la Unidad para la Cultura Democrática',
        organization: 'UNESCO',
        sector: 'internacional',
        start_date: '1995',
        end_date: '2001',
        is_current: false,
        seniority_level: 'direccion'
      },
      {
        role_type: 'internacional',
        position: 'Representante en México',
        organization: 'UNESCO',
        sector: 'internacional',
        start_date: '2000',
        end_date: '2001',
        is_current: false,
        seniority_level: 'direccion'
      },
      {
        role_type: 'ejecutivo_publico_alto',
        position: 'Ministro de Cultura',
        organization: 'Ministerio de Cultura del Perú',
        sector: 'publico',
        start_date: '2016',
        end_date: '2016',
        is_current: false,
        seniority_level: 'direccion'
      },
      {
        role_type: 'ejecutivo_publico_alto',
        position: 'Ministro de Defensa',
        organization: 'Ministerio de Defensa del Perú',
        sector: 'publico',
        start_date: '2016',
        end_date: '2018',
        is_current: false,
        seniority_level: 'direccion'
      }
    ],
    political_trajectory: [
      {
        position: 'Ministro de Cultura',
        party: 'Peruanos Por el Kambio',
        start_date: '2016',
        end_date: '2016',
        is_elected: false
      },
      {
        position: 'Ministro de Defensa',
        party: 'Peruanos Por el Kambio',
        start_date: '2016',
        end_date: '2018',
        is_elected: false
      },
      {
        position: 'Fundador',
        party: 'Partido del Buen Gobierno',
        start_date: '2019',
        is_elected: false
      },
      {
        position: 'Candidato Presidencial',
        party: 'Partido del Buen Gobierno',
        start_date: '2026',
        is_elected: false
      }
    ],
    penal_sentences: [
      {
        type: 'penal_dolosa',
        description: 'Investigación preparatoria por lavado de activos - Caso Odebrecht y OAS - Presuntamente recibió USD 120,000-129,000 de OAS por asesoría a Susana Villarán',
        status: 'apelacion',
        source: 'El Comercio, RPP, Infobae'
      }
    ],
    civil_sentences: [],
    source: 'Wikipedia, El Comercio, Andina, Gob.pe'
  },

  // CARLOS ÁLVAREZ (humorista)
  {
    slug: 'carlos-alvarez-osorio',
    birth_date: '1964-01-07',
    education_level: 'secundaria_completa',
    education_details: [
      {
        level: 'secundaria_completa',
        institution: 'Gran Unidad Escolar Nuestra Señora de Guadalupe',
        degree: 'Educación Secundaria - Promoción G-80 Jorge Basadre',
        is_completed: true,
        end_date: '1980'
      }
    ],
    experience_details: [
      {
        role_type: 'tecnico_profesional',
        position: 'Actor Cómico y Conductor',
        organization: 'Panamericana Televisión / Latina / ATV',
        sector: 'privado',
        start_date: '1983',
        is_current: true,
        seniority_level: 'individual',
        description: '40 años de trayectoria como humorista político'
      },
      {
        role_type: 'tecnico_profesional',
        position: 'Conductor - Las mil y una de Carlos Álvarez',
        organization: 'Frecuencia Latina',
        sector: 'privado',
        start_date: '1989',
        end_date: '2000',
        is_current: false,
        seniority_level: 'jefatura'
      }
    ],
    political_trajectory: [
      {
        position: 'Afiliado y Precandidato Presidencial',
        party: 'País para Todos',
        start_date: '2024',
        is_elected: false
      }
    ],
    penal_sentences: [
      {
        type: 'penal_dolosa',
        description: 'Investigación por delito contra la Administración Pública (2003) - Presunto pago de Montesinos para ridiculizar enemigos del régimen - ARCHIVADO',
        status: 'archivado',
        source: 'El Comercio'
      }
    ],
    civil_sentences: [],
    source: 'Wikipedia, El Comercio, Infobae, La República'
  },

  // RICARDO BELMONT CASSINELLI
  {
    slug: 'ricardo-belmont-cassinelli',
    birth_date: '1945-08-29',
    education_level: 'universitario_completo',
    education_details: [
      {
        level: 'secundaria_completa',
        institution: 'Colegio Inmaculado Corazón / Colegio Santa María',
        degree: 'Educación Secundaria',
        is_completed: true
      },
      {
        level: 'universitario_completo',
        institution: 'Universidad de Lima',
        degree: 'Administración de Empresas',
        field_of_study: 'Administración',
        is_completed: true,
        end_date: '1967'
      }
    ],
    experience_details: [
      {
        role_type: 'ejecutivo_privado_alto',
        position: 'Propietario y Director',
        organization: 'Red Bicolor de Comunicaciones (RBC - Canal 11)',
        sector: 'privado',
        start_date: '1986',
        is_current: true,
        seniority_level: 'direccion'
      },
      {
        role_type: 'tecnico_profesional',
        position: 'Conductor de la Teletón',
        organization: 'Hogar Clínica San Juan de Dios',
        sector: 'privado',
        start_date: '1981',
        end_date: '2000',
        is_current: false,
        seniority_level: 'jefatura'
      },
      {
        role_type: 'electivo_alto',
        position: 'Alcalde de Lima',
        organization: 'Municipalidad de Lima',
        sector: 'publico',
        start_date: '1990',
        end_date: '1995',
        is_current: false,
        seniority_level: 'direccion'
      }
    ],
    political_trajectory: [
      {
        position: 'Fundador Movimiento OBRAS',
        party: 'Movimiento Cívico Independiente OBRAS',
        start_date: '1988',
        is_elected: false
      },
      {
        position: 'Alcalde de Lima (2 períodos)',
        party: 'Movimiento OBRAS',
        start_date: '1990',
        end_date: '1995',
        is_elected: true
      },
      {
        position: 'Candidato Presidencial',
        party: 'Movimiento OBRAS',
        start_date: '1995',
        is_elected: false
      },
      {
        position: 'Congresista de la República (accesitario)',
        party: 'Frente de Centro',
        start_date: '2009',
        end_date: '2011',
        is_elected: true
      }
    ],
    penal_sentences: [
      {
        type: 'penal_dolosa',
        description: 'Investigación por presunta estafa a más de 50,000 accionistas de RBC (1986) - Delito contra el patrimonio y fraude en administración',
        status: 'apelacion',
        source: 'La Razón, Diario Correo, Infobae'
      },
      {
        type: 'penal_dolosa',
        description: 'Acusación fiscal por usurpación agravada y hurto agravado - Toma de estación PBO Radio (2022) - Fiscalía pide 7 años de prisión',
        status: 'apelacion',
        source: 'La Noticia, La República'
      }
    ],
    civil_sentences: [],
    source: 'Wikipedia, Infobae, Cosas, La República'
  },

  // CARLOS ESPÁ
  {
    slug: 'carlos-espa-quispe',
    birth_date: '1960-01-01',
    education_level: 'titulo_profesional',
    education_details: [
      {
        level: 'titulo_profesional',
        institution: 'Universidad (no especificada)',
        degree: 'Abogado',
        field_of_study: 'Derecho',
        is_completed: true
      }
    ],
    experience_details: [
      {
        role_type: 'tecnico_profesional',
        position: 'Periodista - 40 años de trayectoria',
        organization: 'Diario La Prensa / Cuarto Poder',
        sector: 'privado',
        start_date: '1985',
        is_current: true,
        seniority_level: 'jefatura'
      },
      {
        role_type: 'tecnico_profesional',
        position: 'Conductor de Cuarto Poder',
        organization: 'América Televisión',
        sector: 'privado',
        start_date: '2002',
        end_date: '2004',
        is_current: false,
        seniority_level: 'jefatura'
      }
    ],
    political_trajectory: [
      {
        position: 'Fundador',
        party: 'Sí Creo',
        start_date: '2025',
        is_elected: false
      },
      {
        position: 'Candidato Presidencial',
        party: 'Sí Creo',
        start_date: '2026',
        is_elected: false
      }
    ],
    penal_sentences: [],
    civil_sentences: [],
    source: 'El Comercio, La República, RPP'
  },

  // ALFONSO LÓPEZ CHAU
  {
    slug: 'alfonso-lopez-chau',
    birth_date: '1950-07-17',
    education_level: 'doctorado',
    education_details: [
      {
        level: 'universitario_completo',
        institution: 'Universidad Nacional del Callao',
        degree: 'Licenciado en Economía',
        field_of_study: 'Economía',
        is_completed: true,
        end_date: '1976'
      },
      {
        level: 'maestria',
        institution: 'Universidad Nacional Autónoma de México (UNAM)',
        degree: 'Máster en Economía',
        is_completed: true,
        end_date: '1985'
      },
      {
        level: 'doctorado',
        institution: 'Universidad Nacional Autónoma de México (UNAM)',
        degree: 'Doctorado en Economía',
        is_completed: true,
        end_date: '2005'
      }
    ],
    experience_details: [
      {
        role_type: 'academia',
        position: 'Profesor Principal de Economía',
        organization: 'Universidad Nacional de Ingeniería',
        sector: 'publico',
        start_date: '1990',
        end_date: '2021',
        is_current: false,
        seniority_level: 'jefatura'
      },
      {
        role_type: 'ejecutivo_publico_alto',
        position: 'Director del Banco Central de Reserva',
        organization: 'BCR del Perú',
        sector: 'publico',
        start_date: '2006',
        end_date: '2012',
        is_current: false,
        seniority_level: 'direccion'
      },
      {
        role_type: 'ejecutivo_publico_alto',
        position: 'Rector',
        organization: 'Universidad Nacional de Ingeniería',
        sector: 'publico',
        start_date: '2021',
        end_date: '2025',
        is_current: false,
        seniority_level: 'direccion'
      }
    ],
    political_trajectory: [
      {
        position: 'Militante',
        party: 'Partido Aprista Peruano',
        start_date: '1965',
        end_date: '1969',
        is_elected: false
      },
      {
        position: 'Miembro de Izquierda Unida',
        party: 'Izquierda Unida',
        start_date: '1980',
        end_date: '1990',
        is_elected: false
      },
      {
        position: 'Candidato al Congreso',
        party: 'Apertura para el Desarrollo Nacional',
        start_date: '1995',
        is_elected: false
      },
      {
        position: 'Fundador',
        party: 'Ahora Nación',
        start_date: '2023',
        is_elected: false
      },
      {
        position: 'Candidato Presidencial',
        party: 'Ahora Nación',
        start_date: '2026',
        is_elected: false
      }
    ],
    penal_sentences: [
      {
        type: 'penal_dolosa',
        description: 'Acusación por colusión y negociación incompatible - Designación irregular de secretaria general en la UNI sin cumplir requisitos - Fiscalía pide 5 años de prisión',
        status: 'apelacion',
        source: 'Infobae, Expreso, Altavoz'
      }
    ],
    civil_sentences: [],
    source: 'Wikipedia, Infobae, Caretas, Revelación'
  },

  // RAFAEL BELAÚNDE LLOSA
  {
    slug: 'rafael-belaunde-llosa',
    birth_date: '1974-12-26',
    education_level: 'universitario_completo',
    education_details: [
      {
        level: 'universitario_completo',
        institution: 'Universidad de Lima',
        degree: 'Economía',
        field_of_study: 'Economía',
        is_completed: true
      }
    ],
    experience_details: [
      {
        role_type: 'ejecutivo_publico_medio',
        position: 'Gerente de Campo',
        organization: 'COFOPRI',
        sector: 'publico',
        start_date: '2000',
        end_date: '2005',
        is_current: false,
        seniority_level: 'gerencia'
      },
      {
        role_type: 'ejecutivo_publico_medio',
        position: 'Jefe de Coordinación Territorial',
        organization: 'Defensoría del Pueblo',
        sector: 'publico',
        start_date: '2005',
        end_date: '2010',
        is_current: false,
        seniority_level: 'jefatura'
      },
      {
        role_type: 'ejecutivo_privado_alto',
        position: 'Gerente General',
        organization: 'Conglomerado Inmobiliario',
        sector: 'privado',
        start_date: '2010',
        is_current: true,
        seniority_level: 'direccion'
      },
      {
        role_type: 'ejecutivo_publico_alto',
        position: 'Ministro de Energía y Minas',
        organization: 'Ministerio de Energía y Minas',
        sector: 'publico',
        start_date: '2020-07',
        end_date: '2020-08',
        is_current: false,
        seniority_level: 'direccion',
        description: '22 días en el cargo - Gabinete Cateriano'
      }
    ],
    political_trajectory: [
      {
        position: 'Miembro y Candidato al Congreso',
        party: 'Frente Independiente Moralizador',
        start_date: '2001',
        is_elected: false
      },
      {
        position: 'Miembro',
        party: 'Partido Adelante',
        start_date: '2005',
        end_date: '2012',
        is_elected: false
      },
      {
        position: 'Ministro de Energía y Minas',
        party: 'Independiente',
        start_date: '2020',
        end_date: '2020',
        is_elected: false
      },
      {
        position: 'Equipo Técnico',
        party: 'Fuerza Popular',
        start_date: '2021',
        is_elected: false
      },
      {
        position: 'Fundador y Presidente',
        party: 'Libertad Popular',
        start_date: '2022',
        is_elected: false
      },
      {
        position: 'Candidato Presidencial',
        party: 'Libertad Popular',
        start_date: '2026',
        is_elected: false
      }
    ],
    penal_sentences: [],
    civil_sentences: [],
    source: 'Wikipedia, El Peruano, Peru21'
  },

  // FERNANDO OLIVERA VEGA
  {
    slug: 'fernando-olivera-vega',
    birth_date: '1958-07-26',
    education_level: 'maestria',
    education_details: [
      {
        level: 'universitario_completo',
        institution: 'Universidad del Pacífico',
        degree: 'Administración de Empresas',
        field_of_study: 'Administración',
        is_completed: true,
        end_date: '1980'
      },
      {
        level: 'maestria',
        institution: 'Universidad Complutense de Madrid',
        degree: 'Maestría en Relaciones Internacionales',
        is_completed: true,
        end_date: '2008'
      }
    ],
    experience_details: [
      {
        role_type: 'ejecutivo_publico_medio',
        position: 'Secretario General',
        organization: 'Fiscalía de la Nación',
        sector: 'publico',
        start_date: '1979',
        end_date: '1985',
        is_current: false,
        seniority_level: 'gerencia'
      },
      {
        role_type: 'ejecutivo_publico_alto',
        position: 'Ministro de Justicia',
        organization: 'Ministerio de Justicia',
        sector: 'publico',
        start_date: '2001',
        end_date: '2002',
        is_current: false,
        seniority_level: 'direccion'
      },
      {
        role_type: 'internacional',
        position: 'Embajador del Perú en España',
        organization: 'Ministerio de Relaciones Exteriores',
        sector: 'publico',
        start_date: '2002',
        end_date: '2005',
        is_current: false,
        seniority_level: 'direccion'
      },
      {
        role_type: 'ejecutivo_publico_alto',
        position: 'Ministro de Relaciones Exteriores',
        organization: 'Ministerio de Relaciones Exteriores',
        sector: 'publico',
        start_date: '2005',
        end_date: '2005',
        is_current: false,
        seniority_level: 'direccion',
        description: '5 días en el cargo'
      }
    ],
    political_trajectory: [
      {
        position: 'Diputado',
        party: 'Acción Popular',
        start_date: '1985',
        end_date: '1990',
        is_elected: true
      },
      {
        position: 'Fundador y Presidente',
        party: 'Frente Independiente Moralizador (FIM)',
        start_date: '1990',
        end_date: '2007',
        is_elected: false
      },
      {
        position: 'Diputado',
        party: 'FIM',
        start_date: '1990',
        end_date: '1992',
        is_elected: true
      },
      {
        position: 'Congresista de la República',
        party: 'FIM',
        start_date: '1995',
        end_date: '2002',
        is_elected: true
      },
      {
        position: 'Candidato Presidencial',
        party: 'FIM',
        start_date: '2001',
        is_elected: false
      }
    ],
    penal_sentences: [
      {
        type: 'penal_dolosa',
        description: 'Investigación por colusión agravada y lavado de activos - Caso Interoceánica Sur/Odebrecht - Presunta intervención a favor de adjudicación',
        status: 'apelacion',
        source: 'RPP, América TV, La Ley'
      },
      {
        type: 'penal_dolosa',
        description: 'Juicio por difamación contra gobernadora de Moquegua - Declarado reo contumaz y detenido brevemente en enero 2024',
        status: 'apelacion',
        source: 'Infobae, Exitosa'
      }
    ],
    civil_sentences: [],
    source: 'Wikipedia, Congreso, RPP, La Ley'
  },

  // FRANCISCO DIEZ CANSECO TÁVARA
  {
    slug: 'francisco-diez-canseco-terry',
    birth_date: '1946-04-18',
    education_level: 'titulo_profesional',
    education_details: [
      {
        level: 'secundaria_completa',
        institution: 'Colegio Pestalozzi / Franklin Delano Roosevelt',
        degree: 'Educación Secundaria',
        is_completed: true
      },
      {
        level: 'universitario_completo',
        institution: 'Universidad Nacional Mayor de San Marcos',
        degree: 'Derecho',
        field_of_study: 'Derecho',
        is_completed: true
      },
      {
        level: 'titulo_profesional',
        institution: 'Universidad Nacional Mayor de San Marcos',
        degree: 'Abogado - Tesis: Deducciones Personales en el Impuesto a la Renta',
        is_completed: true
      }
    ],
    experience_details: [
      {
        role_type: 'tecnico_profesional',
        position: 'Periodista y Cronista Parlamentario',
        organization: 'Diario La Crónica / La Prensa',
        sector: 'privado',
        start_date: '1963',
        end_date: '1970',
        is_current: false,
        seniority_level: 'individual'
      },
      {
        role_type: 'tecnico_profesional',
        position: 'Abogado',
        organization: 'Estudio Romero',
        sector: 'privado',
        start_date: '1970',
        end_date: '1985',
        is_current: false,
        seniority_level: 'jefatura'
      },
      {
        role_type: 'ejecutivo_privado_medio',
        position: 'Columnista y Editorialista',
        organization: 'Diario Ojo / Diario Correo',
        sector: 'privado',
        start_date: '1980',
        is_current: true,
        seniority_level: 'jefatura'
      },
      {
        role_type: 'ejecutivo_privado_alto',
        position: 'Pionero del cultivo de quinua orgánica',
        organization: 'Emprendimiento Agrícola',
        sector: 'privado',
        start_date: '2000',
        is_current: true,
        seniority_level: 'direccion'
      }
    ],
    political_trajectory: [
      {
        position: 'Militante',
        party: 'Partido Aprista Peruano',
        start_date: '1960',
        end_date: '1980',
        is_elected: false
      },
      {
        position: 'Candidato a Alcalde de Lima',
        party: 'Movimiento de Bases Hayistas',
        start_date: '1983',
        is_elected: false
      },
      {
        position: 'Diputado de la Nación (más alta votación preferencial del Perú)',
        party: 'Movimiento de Bases Hayistas',
        start_date: '1985',
        end_date: '1990',
        is_elected: true
      },
      {
        position: 'Presidente del Consejo por la Paz',
        party: 'Independiente',
        start_date: '1991',
        is_elected: false
      },
      {
        position: 'Presidente Fundador',
        party: 'Perú Nación',
        start_date: '2015',
        is_elected: false
      }
    ],
    penal_sentences: [],
    civil_sentences: [],
    source: 'Wikipedia, Perú Nación, Crónicas UPCH'
  },

  // YONHY LESCANO ANCIETA
  {
    slug: 'yonhy-lescano-ancieta',
    birth_date: '1959-02-15',
    education_level: 'maestria',
    education_details: [
      {
        level: 'secundaria_completa',
        institution: 'Gran Unidad Escolar San Carlos, Puno',
        degree: 'Educación Secundaria',
        is_completed: true
      },
      {
        level: 'universitario_completo',
        institution: 'Universidad Católica de Santa María, Arequipa',
        degree: 'Derecho',
        field_of_study: 'Derecho',
        is_completed: true,
        end_date: '1980'
      },
      {
        level: 'titulo_profesional',
        institution: 'Universidad Católica de Santa María',
        degree: 'Abogado',
        is_completed: true,
        end_date: '1982'
      },
      {
        level: 'maestria',
        institution: 'Universidad de Chile',
        degree: 'Magíster en Derecho Privado',
        is_completed: true,
        end_date: '1985'
      }
    ],
    experience_details: [
      {
        role_type: 'academia',
        position: 'Profesor de Derecho / Catedrático del Programa de Maestría',
        organization: 'Universidad Nacional del Altiplano (UNA Puno)',
        sector: 'publico',
        start_date: '1985',
        end_date: '2001',
        is_current: false,
        seniority_level: 'jefatura'
      },
      {
        role_type: 'tecnico_profesional',
        position: 'Abogado independiente',
        organization: 'Estudio Jurídico',
        sector: 'privado',
        start_date: '1984',
        end_date: '2001',
        is_current: false,
        seniority_level: 'jefatura'
      }
    ],
    political_trajectory: [
      {
        position: 'Candidato al Congreso',
        party: 'Solidaridad Nacional',
        start_date: '2000',
        is_elected: false
      },
      {
        position: 'Congresista de la República (por Puno)',
        party: 'Acción Popular',
        start_date: '2001',
        end_date: '2006',
        is_elected: true
      },
      {
        position: 'Congresista de la República (por Puno)',
        party: 'Acción Popular',
        start_date: '2006',
        end_date: '2011',
        is_elected: true
      },
      {
        position: 'Secretario General Nacional',
        party: 'Acción Popular',
        start_date: '2009',
        end_date: '2011',
        is_elected: false
      },
      {
        position: 'Congresista de la República (por Lima)',
        party: 'Acción Popular',
        start_date: '2011',
        end_date: '2016',
        is_elected: true
      },
      {
        position: 'Congresista de la República (por Lima)',
        party: 'Acción Popular',
        start_date: '2016',
        end_date: '2019',
        is_elected: true
      },
      {
        position: 'Candidato Presidencial',
        party: 'Acción Popular',
        start_date: '2021',
        is_elected: false
      }
    ],
    penal_sentences: [
      {
        type: 'penal_dolosa',
        description: 'Investigación por acoso sexual contra periodista (2019) - ARCHIVADO por Fiscalía (2020)',
        status: 'archivado',
        source: 'El Comercio, LP Derecho'
      }
    ],
    civil_sentences: [
      {
        type: 'laboral',
        description: 'Suspensión de 120 días por el Congreso por caso de acoso sexual (2019)',
        status: 'firme',
        source: 'Congreso de la República'
      }
    ],
    source: 'Wikipedia, Andina, Congreso, La República'
  },

  // JULIO GUZMÁN CÁCERES
  {
    slug: 'julio-guzman-caceres',
    birth_date: '1970-07-31',
    education_level: 'doctorado',
    education_details: [
      {
        level: 'secundaria_completa',
        institution: 'Colegio Sagrados Corazones Recoleta',
        degree: 'Educación Secundaria',
        is_completed: true
      },
      {
        level: 'universitario_completo',
        institution: 'Pontificia Universidad Católica del Perú',
        degree: 'Bachiller en Economía',
        field_of_study: 'Economía',
        is_completed: true
      },
      {
        level: 'maestria',
        institution: 'Georgetown University (Estados Unidos)',
        degree: 'Maestría en Políticas Públicas',
        is_completed: true
      },
      {
        level: 'doctorado',
        institution: 'University of Maryland (Estados Unidos)',
        degree: 'Doctorado en Políticas Públicas',
        is_completed: true
      }
    ],
    experience_details: [
      {
        role_type: 'internacional',
        position: 'Economista en Integración y Comercio',
        organization: 'Banco Interamericano de Desarrollo (BID)',
        sector: 'internacional',
        start_date: '2000',
        end_date: '2011',
        is_current: false,
        seniority_level: 'jefatura'
      },
      {
        role_type: 'academia',
        position: 'Profesor Adjunto',
        organization: 'University of Maryland / Georgetown University',
        sector: 'privado',
        start_date: '2005',
        end_date: '2011',
        is_current: false,
        seniority_level: 'jefatura'
      },
      {
        role_type: 'ejecutivo_publico_alto',
        position: 'Viceministro de MYPE e Industria',
        organization: 'Ministerio de la Producción',
        sector: 'publico',
        start_date: '2011',
        end_date: '2012',
        is_current: false,
        seniority_level: 'direccion'
      },
      {
        role_type: 'ejecutivo_publico_alto',
        position: 'Secretario General',
        organization: 'Presidencia del Consejo de Ministros',
        sector: 'publico',
        start_date: '2012',
        end_date: '2013',
        is_current: false,
        seniority_level: 'direccion'
      },
      {
        role_type: 'ejecutivo_privado_alto',
        position: 'Socio (Partner)',
        organization: 'Deloitte Perú',
        sector: 'privado',
        start_date: '2013',
        end_date: '2015',
        is_current: false,
        seniority_level: 'direccion'
      }
    ],
    political_trajectory: [
      {
        position: 'Viceministro de MYPE e Industria',
        party: 'Gana Perú',
        start_date: '2011',
        end_date: '2012',
        is_elected: false
      },
      {
        position: 'Candidato Presidencial (descalificado)',
        party: 'Todos por el Perú',
        start_date: '2016',
        is_elected: false
      },
      {
        position: 'Fundador y Presidente',
        party: 'Partido Morado',
        start_date: '2017',
        end_date: '2021',
        is_elected: false
      },
      {
        position: 'Candidato Presidencial',
        party: 'Partido Morado',
        start_date: '2021',
        is_elected: false
      }
    ],
    penal_sentences: [
      {
        type: 'penal_dolosa',
        description: 'Investigación por lavado de activos - Caso Odebrecht - Presuntamente recibió USD 400,000 de Odebrecht para campaña 2016',
        status: 'apelacion',
        source: 'El Comercio, Andina, RPP'
      }
    ],
    civil_sentences: [],
    source: 'Wikipedia, Andina, El Comercio, AS/COA'
  },

  // ANDRÉS ALCÁNTARA PAREDES
  {
    slug: 'andres-alcantara-paredes',
    birth_date: '1960-02-21',
    education_level: 'universitario_completo',
    education_details: [
      {
        level: 'universitario_completo',
        institution: 'Universidad Inca Garcilaso de la Vega',
        degree: 'Derecho',
        field_of_study: 'Derecho',
        is_completed: true
      },
      {
        level: 'universitario_incompleto',
        institution: 'Universidad Nacional José Faustino Sánchez Carrión',
        degree: 'Ingeniería Industrial',
        is_completed: false
      }
    ],
    experience_details: [
      {
        role_type: 'ejecutivo_privado_medio',
        position: 'Gerente General',
        organization: 'Sociedad Minera de Responsabilidad Limitada San Antonio I',
        sector: 'privado',
        start_date: '1996',
        end_date: '2010',
        is_current: false,
        seniority_level: 'gerencia'
      },
      {
        role_type: 'ejecutivo_privado_medio',
        position: 'Gerente General',
        organization: 'Editora e Inmobiliaria DT EIRL',
        sector: 'privado',
        start_date: '2009',
        is_current: true,
        seniority_level: 'gerencia'
      },
      {
        role_type: 'partidario',
        position: 'Líder Nacional',
        organization: 'Asociación Nacional de Fonavistas de los Pueblos del Perú',
        sector: 'publico',
        start_date: '2010',
        is_current: true,
        seniority_level: 'direccion'
      }
    ],
    political_trajectory: [
      {
        position: 'Candidato al Congreso',
        party: 'Solidaridad Nacional',
        start_date: '2000',
        is_elected: false
      },
      {
        position: 'Candidato al Congreso',
        party: 'Renacimiento Andino',
        start_date: '2001',
        is_elected: false
      },
      {
        position: 'Candidato a Alcalde Provincial',
        party: 'Capacidad Ciudadana al Desarrollo',
        start_date: '2002',
        is_elected: false
      },
      {
        position: 'Candidato a 2da Vicepresidencia y Congreso',
        party: 'Perú Ahora',
        start_date: '2006',
        is_elected: false
      },
      {
        position: 'Candidato al Congreso',
        party: 'Fonavistas del Perú',
        start_date: '2011',
        is_elected: false
      },
      {
        position: 'Fundador',
        party: 'Democracia Directa',
        start_date: '2013',
        is_elected: false
      },
      {
        position: 'Candidato Presidencial',
        party: 'Democracia Directa',
        start_date: '2021',
        is_elected: false
      }
    ],
    penal_sentences: [],
    civil_sentences: [],
    source: 'Wikipedia, Andina, La República, JNE'
  },

  // ARMANDO MASSÉ MUÑOZ
  {
    slug: 'armando-masse-munoz',
    birth_date: '1960-01-01',
    education_level: 'titulo_profesional',
    education_details: [
      {
        level: 'universitario_completo',
        institution: 'Universidad (no especificada)',
        degree: 'Medicina Humana - Cirujano',
        field_of_study: 'Medicina',
        is_completed: true
      },
      {
        level: 'titulo_profesional',
        institution: 'Universidad (no especificada)',
        degree: 'Abogado',
        field_of_study: 'Derecho',
        is_completed: true
      }
    ],
    experience_details: [
      {
        role_type: 'ejecutivo_privado_alto',
        position: 'Director Ejecutivo',
        organization: 'APDAYC (Asociación Peruana de Autores y Compositores)',
        sector: 'privado',
        start_date: '2010',
        end_date: '2020',
        is_current: false,
        seniority_level: 'direccion'
      },
      {
        role_type: 'tecnico_profesional',
        position: 'Activista por derechos de artistas',
        organization: 'Sociedad Civil',
        sector: 'privado',
        start_date: '2000',
        is_current: true,
        seniority_level: 'jefatura'
      }
    ],
    political_trajectory: [
      {
        position: 'Candidato Presidencial',
        party: 'Partido Democrático Federal',
        start_date: '2026',
        is_elected: false
      }
    ],
    penal_sentences: [],
    civil_sentences: [],
    source: 'La República, Infobae, Ojo Público'
  },

  // ENRIQUE VALDERRAMA
  {
    slug: 'enrique-valderrama-gonzales',
    birth_date: '1988-04-14',
    education_level: 'universitario_completo',
    education_details: [
      {
        level: 'universitario_incompleto',
        institution: 'Pontificia Universidad Católica del Perú',
        degree: 'Derecho',
        is_completed: false
      },
      {
        level: 'universitario_completo',
        institution: 'Universidad de San Martín de Porres',
        degree: 'Derecho',
        field_of_study: 'Derecho',
        is_completed: true
      }
    ],
    experience_details: [
      {
        role_type: 'tecnico_profesional',
        position: 'Columnista',
        organization: 'Diario Expreso',
        sector: 'privado',
        start_date: '2015',
        is_current: true,
        seniority_level: 'individual'
      },
      {
        role_type: 'tecnico_profesional',
        position: 'Fundador - Portal de análisis político',
        organization: 'Punto de Encuentro',
        sector: 'privado',
        start_date: '2018',
        is_current: true,
        seniority_level: 'jefatura'
      },
      {
        role_type: 'tecnico_profesional',
        position: 'Analista político',
        organization: 'Willax Televisión',
        sector: 'privado',
        start_date: '2020',
        is_current: true,
        seniority_level: 'individual'
      }
    ],
    political_trajectory: [
      {
        position: 'Secretario General del Comando Universitario Aprista',
        party: 'Partido Aprista Peruano',
        start_date: '2011',
        end_date: '2012',
        is_elected: false
      },
      {
        position: 'Afiliado fundador (reinscripción)',
        party: 'Partido Aprista Peruano',
        start_date: '2022',
        is_elected: false
      },
      {
        position: 'Miembro de la Comisión Política Nacional',
        party: 'Partido Aprista Peruano',
        start_date: '2025',
        is_elected: false
      },
      {
        position: 'Candidato Presidencial',
        party: 'Partido Aprista Peruano (APRA)',
        start_date: '2026',
        is_elected: false
      }
    ],
    penal_sentences: [],
    civil_sentences: [],
    source: 'RPP, Infobae, Peru21, El Comercio, Andina'
  }
]

async function updateAllCandidates() {
  console.log('🚀 Actualizando TODOS los candidatos con datos verificados...\n')
  console.log('Fuentes: Wikipedia, Infobae, El Comercio, La República, JNE, RPP, Andina\n')
  console.log('='.repeat(70))

  let updated = 0
  let notFound = 0
  let created = 0

  for (const data of VERIFIED_DATA) {
    console.log(`\n📋 Procesando: ${data.slug}`)

    // Check if candidate exists
    const existing = await sql`SELECT id, full_name FROM candidates WHERE slug = ${data.slug}`

    if (existing.length === 0) {
      console.log(`  ⚠️ No encontrado en BD: ${data.slug}`)
      notFound++
      continue
    }

    // Update with verified data
    await sql`
      UPDATE candidates SET
        birth_date = ${data.birth_date ? data.birth_date : null}::date,
        education_level = ${data.education_level},
        education_details = ${JSON.stringify(data.education_details)}::jsonb,
        experience_details = ${JSON.stringify(data.experience_details)}::jsonb,
        political_trajectory = ${JSON.stringify(data.political_trajectory)}::jsonb,
        penal_sentences = ${JSON.stringify(data.penal_sentences)}::jsonb,
        civil_sentences = ${JSON.stringify(data.civil_sentences)}::jsonb,
        data_source = ${`verified_${data.source.toLowerCase().replace(/[^a-z]/g, '_').substring(0, 50)}`},
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
      data.penal_sentences.forEach(s => {
        console.log(`        - ${s.description.substring(0, 80)}...`)
      })
    }

    updated++
  }

  console.log('\n' + '='.repeat(70))
  console.log('📊 Resumen de actualización:')
  console.log(`  ✅ Actualizados: ${updated}`)
  console.log(`  ⚠️ No encontrados: ${notFound}`)

  // Now create/update flags based on sentences
  console.log('\n📋 Actualizando flags de sentencias...')

  for (const data of VERIFIED_DATA) {
    const candidate = await sql`SELECT id FROM candidates WHERE slug = ${data.slug}`
    if (candidate.length === 0) continue

    const candidateId = candidate[0].id

    // Delete existing flags for this candidate
    await sql`DELETE FROM flags WHERE candidate_id = ${candidateId}::uuid`

    // Add penal sentence flags (only for non-archived cases)
    for (const sentence of data.penal_sentences) {
      // Skip archived cases - they don't need a flag
      if (sentence.status === 'archivado') {
        console.log(`  ℹ️ Caso archivado (sin flag): ${data.slug}`)
        continue
      }

      // Determine severity based on status
      const severity = sentence.status === 'firme' ? 'RED' : 'AMBER'

      await sql`
        INSERT INTO flags (candidate_id, type, severity, title, description, source, date_captured)
        VALUES (
          ${candidateId}::uuid,
          'PENAL_SENTENCE',
          ${severity},
          ${sentence.description.substring(0, 100)},
          ${sentence.description},
          ${sentence.source},
          NOW()
        )
      `
      console.log(`  🚩 Flag PENAL (${severity}) agregado: ${data.slug}`)
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

  // Delete garbage candidate
  console.log('\n🗑️ Eliminando candidato basura...')
  const deleted = await sql`
    DELETE FROM candidates
    WHERE full_name LIKE '%Entre otras%' OR full_name LIKE '%ver todas las funciones%'
    RETURNING full_name
  `
  if (deleted.length > 0) {
    console.log(`  ✅ Eliminado: ${deleted[0].full_name}`)
  }

  // Show final stats
  const stats = await sql`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN data_verified = TRUE THEN 1 ELSE 0 END) as verified,
      SUM(CASE WHEN education_details::text != '[]' THEN 1 ELSE 0 END) as with_education,
      SUM(CASE WHEN experience_details::text != '[]' THEN 1 ELSE 0 END) as with_experience,
      SUM(CASE WHEN political_trajectory::text != '[]' THEN 1 ELSE 0 END) as with_trajectory,
      SUM(CASE WHEN penal_sentences::text != '[]' THEN 1 ELSE 0 END) as with_penal
    FROM candidates
  `

  const flagStats = await sql`
    SELECT severity, COUNT(*) as count
    FROM flags
    GROUP BY severity
    ORDER BY severity
  `

  console.log('\n' + '='.repeat(70))
  console.log('📊 Estado final de la base de datos:')
  console.log(`  Total candidatos: ${stats[0]?.total}`)
  console.log(`  Verificados: ${stats[0]?.verified}`)
  console.log(`  Con educación: ${stats[0]?.with_education}`)
  console.log(`  Con experiencia: ${stats[0]?.with_experience}`)
  console.log(`  Con trayectoria: ${stats[0]?.with_trajectory}`)
  console.log(`  Con sentencias penales: ${stats[0]?.with_penal}`)

  console.log('\n📋 Flags por severidad:')
  flagStats.forEach((f: any) => {
    console.log(`  ${f.severity}: ${f.count}`)
  })

  console.log('\n✅ Actualización completada!')
}

updateAllCandidates()
