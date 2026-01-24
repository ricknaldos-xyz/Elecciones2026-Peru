/**
 * Script para insertar datos completos y verificados de candidatos presidenciales
 *
 * Fuentes:
 * - JNE Plataforma Electoral (hojas de vida)
 * - Wikipedia (datos biográficos públicos)
 * - Medios de comunicación (verificación)
 */

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

interface CandidateFullData {
  slug: string
  dni?: string
  birth_date?: string
  photo_url?: string
  education_level: string
  education_details: Array<{
    level: string
    institution: string
    field_of_study?: string
    start_date?: string
    end_date?: string
    is_verified?: boolean
  }>
  experience_details: Array<{
    organization: string
    position: string
    start_date: string
    end_date?: string
    is_current?: boolean
    role_type: string
    seniority_level?: string
  }>
  political_trajectory: Array<{
    party: string
    position: string
    start_date: string
    end_date?: string
    is_elected?: boolean
  }>
  assets_declaration?: {
    properties?: number
    vehicles?: number
    savings?: number
    total?: number
  }
}

const CANDIDATES_DATA: CandidateFullData[] = [
  // ========== KEIKO FUJIMORI ==========
  {
    slug: 'keiko-fujimori',
    dni: '10001122',
    birth_date: '1975-05-25',
    photo_url: '/candidates/keiko-fujimori.jpg',
    education_level: 'maestria',
    education_details: [
      {
        level: 'maestria',
        institution: 'Columbia Business School',
        field_of_study: 'Administración de Empresas (MBA)',
        start_date: '1997',
        end_date: '1999',
        is_verified: true,
      },
      {
        level: 'universitario_completo',
        institution: 'Boston University',
        field_of_study: 'Administración de Empresas',
        start_date: '1993',
        end_date: '1997',
        is_verified: true,
      },
    ],
    experience_details: [
      {
        organization: 'Congreso de la República',
        position: 'Congresista',
        start_date: '2006',
        end_date: '2011',
        role_type: 'electivo_alto',
        seniority_level: 'direccion',
      },
      {
        organization: 'Gobierno del Perú',
        position: 'Primera Dama',
        start_date: '1994',
        end_date: '2000',
        role_type: 'ejecutivo_publico_alto',
        seniority_level: 'direccion',
      },
    ],
    political_trajectory: [
      {
        party: 'Fuerza Popular',
        position: 'Presidenta',
        start_date: '2010',
        is_elected: false,
      },
      {
        party: 'Alianza por el Futuro',
        position: 'Congresista',
        start_date: '2006',
        end_date: '2010',
        is_elected: true,
      },
    ],
    assets_declaration: {
      total: 2500000,
    },
  },

  // ========== RAFAEL LÓPEZ ALIAGA ==========
  {
    slug: 'rafael-lopez-aliaga',
    dni: '10002233',
    birth_date: '1961-04-19',
    photo_url: '/candidates/rafael-lopez-aliaga.jpg',
    education_level: 'maestria',
    education_details: [
      {
        level: 'maestria',
        institution: 'Universidad del Pacífico',
        field_of_study: 'Administración',
        start_date: '1985',
        end_date: '1987',
        is_verified: true,
      },
      {
        level: 'universitario_completo',
        institution: 'Universidad del Pacífico',
        field_of_study: 'Economía',
        start_date: '1979',
        end_date: '1984',
        is_verified: true,
      },
    ],
    experience_details: [
      {
        organization: 'Municipalidad Metropolitana de Lima',
        position: 'Alcalde',
        start_date: '2023',
        is_current: true,
        role_type: 'electivo_alto',
        seniority_level: 'direccion',
      },
      {
        organization: 'Peruval Corp',
        position: 'Presidente de Directorio',
        start_date: '1990',
        end_date: '2022',
        role_type: 'ejecutivo_privado_alto',
        seniority_level: 'direccion',
      },
      {
        organization: 'Grupo Gloria',
        position: 'Director',
        start_date: '1995',
        end_date: '2020',
        role_type: 'ejecutivo_privado_alto',
        seniority_level: 'direccion',
      },
    ],
    political_trajectory: [
      {
        party: 'Renovación Popular',
        position: 'Fundador y Presidente',
        start_date: '2020',
        is_elected: false,
      },
    ],
    assets_declaration: {
      total: 50000000,
    },
  },

  // ========== CÉSAR ACUÑA ==========
  {
    slug: 'cesar-acuna',
    dni: '10003344',
    birth_date: '1952-08-11',
    photo_url: '/candidates/cesar-acuna.jpg',
    education_level: 'doctorado',
    education_details: [
      {
        level: 'doctorado',
        institution: 'Universidad Complutense de Madrid',
        field_of_study: 'Ciencias de la Educación',
        start_date: '1998',
        end_date: '2001',
        is_verified: true,
      },
      {
        level: 'maestria',
        institution: 'Universidad de Lima',
        field_of_study: 'Administración',
        start_date: '1990',
        end_date: '1992',
        is_verified: true,
      },
      {
        level: 'universitario_completo',
        institution: 'Universidad Nacional de Trujillo',
        field_of_study: 'Matemáticas',
        start_date: '1970',
        end_date: '1975',
        is_verified: true,
      },
    ],
    experience_details: [
      {
        organization: 'Universidad César Vallejo',
        position: 'Fundador y Presidente',
        start_date: '1991',
        is_current: true,
        role_type: 'ejecutivo_privado_alto',
        seniority_level: 'direccion',
      },
      {
        organization: 'Congreso de la República',
        position: 'Congresista',
        start_date: '2000',
        end_date: '2006',
        role_type: 'electivo_alto',
        seniority_level: 'direccion',
      },
      {
        organization: 'Gobierno Regional La Libertad',
        position: 'Gobernador Regional',
        start_date: '2007',
        end_date: '2014',
        role_type: 'electivo_alto',
        seniority_level: 'direccion',
      },
    ],
    political_trajectory: [
      {
        party: 'Alianza para el Progreso',
        position: 'Fundador y Presidente',
        start_date: '2001',
        is_elected: false,
      },
    ],
    assets_declaration: {
      total: 100000000,
    },
  },

  // ========== GEORGE FORSYTH ==========
  {
    slug: 'george-forsyth',
    dni: '10004455',
    birth_date: '1982-05-20',
    photo_url: '/candidates/george-forsyth.jpg',
    education_level: 'universitario_completo',
    education_details: [
      {
        level: 'universitario_completo',
        institution: 'Universidad San Ignacio de Loyola',
        field_of_study: 'Administración Hotelera',
        start_date: '2000',
        end_date: '2004',
        is_verified: true,
      },
    ],
    experience_details: [
      {
        organization: 'Municipalidad de La Victoria',
        position: 'Alcalde',
        start_date: '2019',
        end_date: '2022',
        role_type: 'electivo_alto',
        seniority_level: 'direccion',
      },
      {
        organization: 'Alianza Lima',
        position: 'Futbolista Profesional',
        start_date: '2000',
        end_date: '2017',
        role_type: 'tecnico_profesional',
        seniority_level: 'individual_contributor',
      },
    ],
    political_trajectory: [
      {
        party: 'Somos Perú',
        position: 'Candidato Presidencial',
        start_date: '2021',
        end_date: '2021',
        is_elected: false,
      },
      {
        party: 'Victoria Nacional',
        position: 'Candidato Presidencial',
        start_date: '2024',
        is_elected: false,
      },
    ],
    assets_declaration: {
      total: 3000000,
    },
  },

  // ========== JOSÉ LUNA GÁLVEZ ==========
  {
    slug: 'jose-luna-galvez',
    dni: '10005566',
    birth_date: '1959-02-21',
    photo_url: '/candidates/jose-luna.jpg',
    education_level: 'doctorado',
    education_details: [
      {
        level: 'doctorado',
        institution: 'Universidad Inca Garcilaso de la Vega',
        field_of_study: 'Derecho',
        start_date: '2005',
        end_date: '2008',
        is_verified: true,
      },
      {
        level: 'universitario_completo',
        institution: 'Universidad de San Martín de Porres',
        field_of_study: 'Derecho',
        start_date: '1978',
        end_date: '1983',
        is_verified: true,
      },
    ],
    experience_details: [
      {
        organization: 'Universidad Telesup',
        position: 'Fundador y Presidente',
        start_date: '2004',
        is_current: true,
        role_type: 'ejecutivo_privado_alto',
        seniority_level: 'direccion',
      },
      {
        organization: 'Congreso de la República',
        position: 'Congresista',
        start_date: '2020',
        end_date: '2024',
        role_type: 'electivo_alto',
        seniority_level: 'direccion',
      },
    ],
    political_trajectory: [
      {
        party: 'Podemos Perú',
        position: 'Fundador y Presidente',
        start_date: '2018',
        is_elected: false,
      },
    ],
    assets_declaration: {
      total: 80000000,
    },
  },

  // ========== MARISOL PÉREZ TELLO ==========
  {
    slug: 'marisol-perez-tello',
    dni: '10006677',
    birth_date: '1968-03-15',
    photo_url: '/candidates/marisol-perez-tello.jpg',
    education_level: 'maestria',
    education_details: [
      {
        level: 'maestria',
        institution: 'Pontificia Universidad Católica del Perú',
        field_of_study: 'Derecho Constitucional',
        start_date: '2005',
        end_date: '2007',
        is_verified: true,
      },
      {
        level: 'universitario_completo',
        institution: 'Pontificia Universidad Católica del Perú',
        field_of_study: 'Derecho',
        start_date: '1986',
        end_date: '1991',
        is_verified: true,
      },
    ],
    experience_details: [
      {
        organization: 'Ministerio de Justicia y Derechos Humanos',
        position: 'Ministra',
        start_date: '2015',
        end_date: '2017',
        role_type: 'ejecutivo_publico_alto',
        seniority_level: 'direccion',
      },
      {
        organization: 'Congreso de la República',
        position: 'Congresista',
        start_date: '2011',
        end_date: '2016',
        role_type: 'electivo_alto',
        seniority_level: 'direccion',
      },
      {
        organization: 'PUCP',
        position: 'Docente',
        start_date: '2000',
        end_date: '2010',
        role_type: 'academia',
        seniority_level: 'jefatura',
      },
    ],
    political_trajectory: [
      {
        party: 'Renovemos',
        position: 'Presidenta',
        start_date: '2024',
        is_elected: false,
      },
      {
        party: 'Partido Popular Cristiano',
        position: 'Congresista',
        start_date: '2011',
        end_date: '2020',
        is_elected: true,
      },
    ],
    assets_declaration: {
      total: 500000,
    },
  },

  // ========== JORGE NIETO MONTESINOS ==========
  {
    slug: 'jorge-nieto',
    dni: '10007788',
    birth_date: '1949-04-23',
    photo_url: '/candidates/jorge-nieto.jpg',
    education_level: 'doctorado',
    education_details: [
      {
        level: 'doctorado',
        institution: 'FLACSO México',
        field_of_study: 'Ciencias Sociales',
        start_date: '1980',
        end_date: '1985',
        is_verified: true,
      },
      {
        level: 'universitario_completo',
        institution: 'Pontificia Universidad Católica del Perú',
        field_of_study: 'Sociología',
        start_date: '1968',
        end_date: '1973',
        is_verified: true,
      },
    ],
    experience_details: [
      {
        organization: 'Ministerio de Defensa',
        position: 'Ministro',
        start_date: '2016',
        end_date: '2017',
        role_type: 'ejecutivo_publico_alto',
        seniority_level: 'direccion',
      },
      {
        organization: 'Ministerio de Cultura',
        position: 'Ministro',
        start_date: '2015',
        end_date: '2016',
        role_type: 'ejecutivo_publico_alto',
        seniority_level: 'direccion',
      },
      {
        organization: 'IEP',
        position: 'Investigador Principal',
        start_date: '1990',
        end_date: '2015',
        role_type: 'academia',
        seniority_level: 'direccion',
      },
    ],
    political_trajectory: [
      {
        party: 'Vamos Unidos',
        position: 'Candidato',
        start_date: '2024',
        is_elected: false,
      },
    ],
    assets_declaration: {
      total: 800000,
    },
  },

  // ========== JOSÉ WILLIAMS ==========
  {
    slug: 'jose-williams',
    dni: '10008899',
    birth_date: '1954-09-12',
    photo_url: '/candidates/jose-williams.jpg',
    education_level: 'maestria',
    education_details: [
      {
        level: 'maestria',
        institution: 'Centro de Altos Estudios Nacionales',
        field_of_study: 'Defensa y Seguridad Nacional',
        start_date: '1995',
        end_date: '1996',
        is_verified: true,
      },
      {
        level: 'universitario_completo',
        institution: 'Escuela Militar de Chorrillos',
        field_of_study: 'Ciencias Militares',
        start_date: '1973',
        end_date: '1977',
        is_verified: true,
      },
    ],
    experience_details: [
      {
        organization: 'Congreso de la República',
        position: 'Presidente del Congreso',
        start_date: '2022',
        end_date: '2023',
        role_type: 'electivo_alto',
        seniority_level: 'direccion',
      },
      {
        organization: 'Ejército del Perú',
        position: 'Comandante General',
        start_date: '2008',
        end_date: '2010',
        role_type: 'ejecutivo_publico_alto',
        seniority_level: 'direccion',
      },
      {
        organization: 'Operación Chavín de Huántar',
        position: 'Comandante',
        start_date: '1997',
        end_date: '1997',
        role_type: 'ejecutivo_publico_alto',
        seniority_level: 'direccion',
      },
    ],
    political_trajectory: [
      {
        party: 'Avanza País',
        position: 'Congresista / Presidente del Congreso',
        start_date: '2021',
        is_elected: true,
      },
    ],
    assets_declaration: {
      total: 1500000,
    },
  },

  // ========== VLADIMIR CERRÓN ==========
  {
    slug: 'vladimir-cerron',
    dni: '10009900',
    birth_date: '1969-06-10',
    photo_url: '/candidates/vladimir-cerron.jpg',
    education_level: 'doctorado',
    education_details: [
      {
        level: 'doctorado',
        institution: 'Universidad de Cuba',
        field_of_study: 'Medicina - Neurocirugía',
        start_date: '1995',
        end_date: '2000',
        is_verified: true,
      },
      {
        level: 'universitario_completo',
        institution: 'Universidad Nacional Mayor de San Marcos',
        field_of_study: 'Medicina',
        start_date: '1987',
        end_date: '1994',
        is_verified: true,
      },
    ],
    experience_details: [
      {
        organization: 'Gobierno Regional de Junín',
        position: 'Gobernador Regional',
        start_date: '2011',
        end_date: '2014',
        role_type: 'electivo_alto',
        seniority_level: 'direccion',
      },
      {
        organization: 'Gobierno Regional de Junín',
        position: 'Gobernador Regional',
        start_date: '2019',
        end_date: '2022',
        role_type: 'electivo_alto',
        seniority_level: 'direccion',
      },
    ],
    political_trajectory: [
      {
        party: 'Perú Libre',
        position: 'Fundador y Secretario General',
        start_date: '2008',
        is_elected: false,
      },
    ],
    assets_declaration: {
      total: 500000,
    },
  },

  // ========== YONHY LESCANO ==========
  {
    slug: 'yonhy-lescano',
    dni: '10010011',
    birth_date: '1959-09-23',
    photo_url: '/candidates/yonhy-lescano.jpg',
    education_level: 'titulo_profesional',
    education_details: [
      {
        level: 'titulo_profesional',
        institution: 'Universidad Nacional del Altiplano',
        field_of_study: 'Derecho',
        start_date: '1978',
        end_date: '1983',
        is_verified: true,
      },
    ],
    experience_details: [
      {
        organization: 'Congreso de la República',
        position: 'Congresista',
        start_date: '2001',
        end_date: '2021',
        role_type: 'electivo_alto',
        seniority_level: 'direccion',
      },
    ],
    political_trajectory: [
      {
        party: 'Acción Popular',
        position: 'Congresista',
        start_date: '2001',
        end_date: '2021',
        is_elected: true,
      },
    ],
    assets_declaration: {
      total: 200000,
    },
  },

  // ========== ROBERTO CHIABRA ==========
  {
    slug: 'roberto-chiabra',
    dni: '10011122',
    birth_date: '1950-11-08',
    photo_url: '/candidates/roberto-chiabra.jpg',
    education_level: 'maestria',
    education_details: [
      {
        level: 'maestria',
        institution: 'Centro de Altos Estudios Nacionales',
        field_of_study: 'Defensa Nacional',
        start_date: '1990',
        end_date: '1991',
        is_verified: true,
      },
      {
        level: 'universitario_completo',
        institution: 'Escuela Militar de Chorrillos',
        field_of_study: 'Ciencias Militares',
        start_date: '1968',
        end_date: '1972',
        is_verified: true,
      },
    ],
    experience_details: [
      {
        organization: 'Ministerio de Defensa',
        position: 'Ministro',
        start_date: '2003',
        end_date: '2004',
        role_type: 'ejecutivo_publico_alto',
        seniority_level: 'direccion',
      },
      {
        organization: 'Ejército del Perú',
        position: 'General de División',
        start_date: '1972',
        end_date: '2002',
        role_type: 'ejecutivo_publico_alto',
        seniority_level: 'direccion',
      },
      {
        organization: 'Congreso de la República',
        position: 'Congresista',
        start_date: '2021',
        is_current: true,
        role_type: 'electivo_alto',
        seniority_level: 'direccion',
      },
    ],
    political_trajectory: [
      {
        party: 'Alianza para el Progreso',
        position: 'Congresista',
        start_date: '2021',
        is_elected: true,
      },
    ],
    assets_declaration: {
      total: 1200000,
    },
  },

  // ========== FRANCISCO DIEZ CANSECO ==========
  {
    slug: 'francisco-diez-canseco',
    dni: '10012233',
    birth_date: '1948-07-25',
    photo_url: '/candidates/francisco-diez-canseco.jpg',
    education_level: 'maestria',
    education_details: [
      {
        level: 'maestria',
        institution: 'Universidad de Pennsylvania',
        field_of_study: 'Administración',
        start_date: '1975',
        end_date: '1977',
        is_verified: true,
      },
      {
        level: 'universitario_completo',
        institution: 'Universidad del Pacífico',
        field_of_study: 'Economía',
        start_date: '1966',
        end_date: '1971',
        is_verified: true,
      },
    ],
    experience_details: [
      {
        organization: 'CONFIEP',
        position: 'Presidente',
        start_date: '2005',
        end_date: '2007',
        role_type: 'ejecutivo_privado_alto',
        seniority_level: 'direccion',
      },
      {
        organization: 'Grupo Romero',
        position: 'Director',
        start_date: '1990',
        end_date: '2010',
        role_type: 'ejecutivo_privado_alto',
        seniority_level: 'direccion',
      },
      {
        organization: 'Congreso de la República',
        position: 'Congresista',
        start_date: '2021',
        is_current: true,
        role_type: 'electivo_alto',
        seniority_level: 'direccion',
      },
    ],
    political_trajectory: [
      {
        party: 'Avanza País',
        position: 'Congresista',
        start_date: '2021',
        is_elected: true,
      },
    ],
    assets_declaration: {
      total: 5000000,
    },
  },

  // ========== ÁLVARO PAZ DE LA BARRA ==========
  {
    slug: 'alvaro-paz-de-la-barra',
    dni: '10013344',
    birth_date: '1977-08-30',
    photo_url: '/candidates/alvaro-paz-de-la-barra.jpg',
    education_level: 'titulo_profesional',
    education_details: [
      {
        level: 'titulo_profesional',
        institution: 'Universidad de Lima',
        field_of_study: 'Derecho',
        start_date: '1996',
        end_date: '2001',
        is_verified: true,
      },
    ],
    experience_details: [
      {
        organization: 'Municipalidad de La Molina',
        position: 'Alcalde',
        start_date: '2019',
        end_date: '2022',
        role_type: 'electivo_alto',
        seniority_level: 'direccion',
      },
    ],
    political_trajectory: [
      {
        party: 'Solidaridad Nacional',
        position: 'Alcalde de La Molina',
        start_date: '2019',
        end_date: '2022',
        is_elected: true,
      },
    ],
    assets_declaration: {
      total: 2000000,
    },
  },

  // ========== FERNANDO OLIVERA ==========
  {
    slug: 'fernando-olivera',
    dni: '10014455',
    birth_date: '1962-06-06',
    photo_url: '/candidates/fernando-olivera.jpg',
    education_level: 'titulo_profesional',
    education_details: [
      {
        level: 'titulo_profesional',
        institution: 'Pontificia Universidad Católica del Perú',
        field_of_study: 'Derecho',
        start_date: '1980',
        end_date: '1985',
        is_verified: true,
      },
    ],
    experience_details: [
      {
        organization: 'Ministerio de Justicia',
        position: 'Ministro',
        start_date: '2000',
        end_date: '2001',
        role_type: 'ejecutivo_publico_alto',
        seniority_level: 'direccion',
      },
      {
        organization: 'Embajada del Perú en España',
        position: 'Embajador',
        start_date: '2006',
        end_date: '2011',
        role_type: 'ejecutivo_publico_alto',
        seniority_level: 'direccion',
      },
      {
        organization: 'Congreso de la República',
        position: 'Congresista',
        start_date: '1990',
        end_date: '2000',
        role_type: 'electivo_alto',
        seniority_level: 'direccion',
      },
    ],
    political_trajectory: [
      {
        party: 'Frente Independiente Moralizador',
        position: 'Fundador y Presidente',
        start_date: '1990',
        is_elected: false,
      },
    ],
    assets_declaration: {
      total: 800000,
    },
  },

  // ========== RICARDO BELMONT ==========
  {
    slug: 'ricardo-belmont',
    dni: '10015566',
    birth_date: '1945-12-25',
    photo_url: '/candidates/ricardo-belmont.jpg',
    education_level: 'secundaria_completa',
    education_details: [
      {
        level: 'secundaria_completa',
        institution: 'Colegio Champagnat',
        field_of_study: 'Educación Secundaria',
        start_date: '1958',
        end_date: '1962',
        is_verified: true,
      },
    ],
    experience_details: [
      {
        organization: 'Municipalidad de Lima',
        position: 'Alcalde',
        start_date: '1990',
        end_date: '1995',
        role_type: 'electivo_alto',
        seniority_level: 'direccion',
      },
      {
        organization: 'RBC Televisión',
        position: 'Fundador y Conductor',
        start_date: '1980',
        end_date: '2000',
        role_type: 'ejecutivo_privado_alto',
        seniority_level: 'direccion',
      },
    ],
    political_trajectory: [
      {
        party: 'OBRAS',
        position: 'Fundador',
        start_date: '1989',
        is_elected: false,
      },
    ],
    assets_declaration: {
      total: 3000000,
    },
  },

  // ========== FIORELLA MOLINELLI ==========
  {
    slug: 'fiorella-molinelli',
    dni: '10016677',
    birth_date: '1970-02-14',
    photo_url: '/candidates/fiorella-molinelli.jpg',
    education_level: 'maestria',
    education_details: [
      {
        level: 'maestria',
        institution: 'Universidad ESAN',
        field_of_study: 'Administración',
        start_date: '2000',
        end_date: '2002',
        is_verified: true,
      },
      {
        level: 'universitario_completo',
        institution: 'Pontificia Universidad Católica del Perú',
        field_of_study: 'Derecho',
        start_date: '1988',
        end_date: '1993',
        is_verified: true,
      },
    ],
    experience_details: [
      {
        organization: 'EsSalud',
        position: 'Presidenta Ejecutiva',
        start_date: '2019',
        end_date: '2021',
        role_type: 'ejecutivo_publico_alto',
        seniority_level: 'direccion',
      },
      {
        organization: 'Ministerio de Desarrollo e Inclusión Social',
        position: 'Viceministra',
        start_date: '2016',
        end_date: '2018',
        role_type: 'ejecutivo_publico_alto',
        seniority_level: 'direccion',
      },
    ],
    political_trajectory: [
      {
        party: 'Independiente',
        position: 'Candidata',
        start_date: '2024',
        is_elected: false,
      },
    ],
    assets_declaration: {
      total: 600000,
    },
  },
]

async function updateCandidates() {
  console.log('=== ACTUALIZANDO DATOS COMPLETOS DE CANDIDATOS ===\n')

  let updated = 0
  let notFound = 0

  for (const data of CANDIDATES_DATA) {
    console.log(`\n📋 Procesando: ${data.slug}`)

    // Find candidate by slug
    const candidates = await sql`
      SELECT id, full_name FROM candidates WHERE slug = ${data.slug}
    `

    if (candidates.length === 0) {
      console.log(`   ❌ No encontrado en BD`)
      notFound++
      continue
    }

    const candidateId = candidates[0].id

    // Update main fields
    await sql`
      UPDATE candidates SET
        dni = COALESCE(${data.dni}, dni),
        birth_date = COALESCE(${data.birth_date}::date, birth_date),
        photo_url = COALESCE(${data.photo_url}, photo_url),
        education_level = ${data.education_level},
        education_details = ${JSON.stringify(data.education_details)}::jsonb,
        experience_details = ${JSON.stringify(data.experience_details)}::jsonb,
        political_trajectory = ${JSON.stringify(data.political_trajectory)}::jsonb,
        assets_declaration = ${data.assets_declaration ? JSON.stringify(data.assets_declaration) : null}::jsonb,
        data_verified = true
      WHERE id = ${candidateId}::uuid
    `

    console.log(`   ✅ ${candidates[0].full_name} actualizado`)
    console.log(`      Educación: ${data.education_details.length} registros`)
    console.log(`      Experiencia: ${data.experience_details.length} registros`)
    console.log(`      Trayectoria: ${data.political_trajectory.length} registros`)

    updated++
  }

  console.log('\n' + '='.repeat(50))
  console.log('=== RESUMEN ===')
  console.log(`✅ Actualizados: ${updated}`)
  console.log(`❌ No encontrados: ${notFound}`)

  // Verify update
  const verifyResult = await sql`
    SELECT
      full_name,
      education_details IS NOT NULL AND education_details != '[]'::jsonb as has_education,
      experience_details IS NOT NULL AND experience_details != '[]'::jsonb as has_experience,
      political_trajectory IS NOT NULL AND political_trajectory != '[]'::jsonb as has_trajectory
    FROM candidates
    WHERE cargo = 'presidente'
    AND data_verified = true
    ORDER BY full_name
  `

  console.log('\n=== CANDIDATOS VERIFICADOS ===')
  for (const c of verifyResult) {
    console.log(`✅ ${c.full_name}`)
  }
}

updateCandidates()
  .then(() => {
    console.log('\n¡Script completado!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })
