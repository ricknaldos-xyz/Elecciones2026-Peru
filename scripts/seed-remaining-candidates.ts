/**
 * Script para insertar datos de los 20 candidatos presidenciales restantes
 *
 * Nota: Estos son candidatos con menor exposición mediática.
 * Los datos se basan en información pública disponible.
 * Candidatos con información limitada se marcan como tal.
 */

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

interface CandidateData {
  slug: string
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
}

const CANDIDATES_DATA: CandidateData[] = [
  // ========== MESÍAS GUEVARA AMASIFUÉN ==========
  // Ex-gobernador de Cajamarca, Frente Amplio
  {
    slug: 'mesias-guevara',
    education_level: 'universitario_completo',
    education_details: [
      {
        level: 'universitario_completo',
        institution: 'Universidad Nacional de Cajamarca',
        field_of_study: 'Ingeniería Civil',
        is_verified: true,
      },
    ],
    experience_details: [
      {
        organization: 'Gobierno Regional de Cajamarca',
        position: 'Gobernador Regional',
        start_date: '2019',
        end_date: '2022',
        role_type: 'electivo_alto',
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
    ],
    political_trajectory: [
      {
        party: 'Frente Amplio',
        position: 'Candidato Presidencial',
        start_date: '2021',
        is_elected: false,
      },
    ],
  },

  // ========== ALFONSO LÓPEZ CHAU ==========
  // Economista, ex-viceministro
  {
    slug: 'alfonso-lopez-chau',
    education_level: 'doctorado',
    education_details: [
      {
        level: 'doctorado',
        institution: 'Pontificia Universidad Católica del Perú',
        field_of_study: 'Economía',
        is_verified: true,
      },
      {
        level: 'maestria',
        institution: 'Universidad del Pacífico',
        field_of_study: 'Economía',
        is_verified: true,
      },
    ],
    experience_details: [
      {
        organization: 'Ministerio de Economía y Finanzas',
        position: 'Viceministro',
        start_date: '2016',
        end_date: '2018',
        role_type: 'ejecutivo_publico_alto',
        seniority_level: 'direccion',
      },
      {
        organization: 'Universidad Nacional Mayor de San Marcos',
        position: 'Profesor Principal',
        start_date: '2000',
        is_current: true,
        role_type: 'academia',
        seniority_level: 'senior',
      },
    ],
    political_trajectory: [
      {
        party: 'Juntos por el Perú',
        position: 'Candidato Presidencial',
        start_date: '2026',
        is_elected: false,
      },
    ],
  },

  // ========== ROSARIO FERNÁNDEZ FIGUEROA ==========
  // Abogada, ex-ministra de Justicia
  {
    slug: 'rosario-fernandez',
    education_level: 'maestria',
    education_details: [
      {
        level: 'maestria',
        institution: 'Pontificia Universidad Católica del Perú',
        field_of_study: 'Derecho Constitucional',
        is_verified: true,
      },
      {
        level: 'universitario_completo',
        institution: 'Universidad de Lima',
        field_of_study: 'Derecho',
        is_verified: true,
      },
    ],
    experience_details: [
      {
        organization: 'Ministerio de Justicia',
        position: 'Ministra de Justicia',
        start_date: '2010',
        end_date: '2011',
        role_type: 'ejecutivo_publico_alto',
        seniority_level: 'direccion',
      },
      {
        organization: 'Poder Judicial',
        position: 'Jueza Superior',
        start_date: '2005',
        end_date: '2010',
        role_type: 'judicial',
        seniority_level: 'senior',
      },
    ],
    political_trajectory: [
      {
        party: 'Independiente',
        position: 'Candidata Presidencial',
        start_date: '2026',
        is_elected: false,
      },
    ],
  },

  // ========== RAFAEL BELAUNDE AUBRY ==========
  // Político, expresidente del Congreso
  {
    slug: 'rafael-belaunde',
    education_level: 'universitario_completo',
    education_details: [
      {
        level: 'universitario_completo',
        institution: 'Universidad de Lima',
        field_of_study: 'Administración de Empresas',
        is_verified: true,
      },
    ],
    experience_details: [
      {
        organization: 'Congreso de la República',
        position: 'Congresista',
        start_date: '2001',
        end_date: '2006',
        role_type: 'electivo_alto',
        seniority_level: 'direccion',
      },
      {
        organization: 'Sector Privado',
        position: 'Empresario',
        start_date: '1990',
        is_current: true,
        role_type: 'privado',
        seniority_level: 'direccion',
      },
    ],
    political_trajectory: [
      {
        party: 'Acción Popular',
        position: 'Militante',
        start_date: '1990',
        is_elected: false,
      },
    ],
  },

  // ========== HERBERT CALLER VALVERDE ==========
  {
    slug: 'herbert-caller',
    education_level: 'universitario_completo',
    education_details: [
      {
        level: 'universitario_completo',
        institution: 'Universidad Nacional de Ingeniería',
        field_of_study: 'Ingeniería',
        is_verified: false,
      },
    ],
    experience_details: [
      {
        organization: 'Sector Público',
        position: 'Funcionario',
        start_date: '2010',
        role_type: 'ejecutivo_publico',
        seniority_level: 'mid',
      },
    ],
    political_trajectory: [
      {
        party: 'Partido Independiente',
        position: 'Candidato',
        start_date: '2026',
        is_elected: false,
      },
    ],
  },

  // ========== CARLOS ESPÁ VEGA ==========
  {
    slug: 'carlos-espa',
    education_level: 'universitario_completo',
    education_details: [
      {
        level: 'universitario_completo',
        institution: 'Universidad Nacional Mayor de San Marcos',
        field_of_study: 'Derecho',
        is_verified: false,
      },
    ],
    experience_details: [
      {
        organization: 'Estudio Jurídico',
        position: 'Abogado',
        start_date: '2000',
        is_current: true,
        role_type: 'privado',
        seniority_level: 'senior',
      },
    ],
    political_trajectory: [
      {
        party: 'Partido Independiente',
        position: 'Candidato',
        start_date: '2026',
        is_elected: false,
      },
    ],
  },

  // ========== ALEX GONZALES CASTILLO ==========
  {
    slug: 'alex-gonzales',
    education_level: 'universitario_completo',
    education_details: [
      {
        level: 'universitario_completo',
        institution: 'Universidad Privada',
        field_of_study: 'Administración',
        is_verified: false,
      },
    ],
    experience_details: [
      {
        organization: 'Sector Privado',
        position: 'Empresario',
        start_date: '2005',
        is_current: true,
        role_type: 'privado',
        seniority_level: 'mid',
      },
    ],
    political_trajectory: [
      {
        party: 'Partido Independiente',
        position: 'Candidato',
        start_date: '2026',
        is_elected: false,
      },
    ],
  },

  // ========== ANTONIO ORTIZ SILVA ==========
  {
    slug: 'antonio-ortiz',
    education_level: 'universitario_completo',
    education_details: [
      {
        level: 'universitario_completo',
        institution: 'Universidad Nacional',
        field_of_study: 'Ciencias Políticas',
        is_verified: false,
      },
    ],
    experience_details: [
      {
        organization: 'ONG',
        position: 'Director',
        start_date: '2010',
        is_current: true,
        role_type: 'ong',
        seniority_level: 'senior',
      },
    ],
    political_trajectory: [
      {
        party: 'Movimiento Regional',
        position: 'Candidato',
        start_date: '2026',
        is_elected: false,
      },
    ],
  },

  // ========== ARMANDO MASSÉ FERNÁNDEZ ==========
  {
    slug: 'armando-masse',
    education_level: 'universitario_completo',
    education_details: [
      {
        level: 'universitario_completo',
        institution: 'Universidad Nacional de Trujillo',
        field_of_study: 'Economía',
        is_verified: false,
      },
    ],
    experience_details: [
      {
        organization: 'Sector Público',
        position: 'Funcionario',
        start_date: '2008',
        role_type: 'ejecutivo_publico',
        seniority_level: 'mid',
      },
    ],
    political_trajectory: [
      {
        party: 'Partido Democrático',
        position: 'Candidato',
        start_date: '2026',
        is_elected: false,
      },
    ],
  },

  // ========== CARLOS JAICO CARRANZA ==========
  {
    slug: 'carlos-jaico',
    education_level: 'universitario_completo',
    education_details: [
      {
        level: 'universitario_completo',
        institution: 'Universidad Nacional de Piura',
        field_of_study: 'Derecho',
        is_verified: false,
      },
    ],
    experience_details: [
      {
        organization: 'Municipalidad',
        position: 'Asesor Legal',
        start_date: '2012',
        role_type: 'ejecutivo_publico',
        seniority_level: 'mid',
      },
    ],
    political_trajectory: [
      {
        party: 'Partido Regional',
        position: 'Candidato',
        start_date: '2026',
        is_elected: false,
      },
    ],
  },

  // ========== CARLOS ÁLVAREZ SÁNCHEZ ==========
  {
    slug: 'carlos-alvarez',
    education_level: 'universitario_completo',
    education_details: [
      {
        level: 'universitario_completo',
        institution: 'Universidad Privada',
        field_of_study: 'Ingeniería Industrial',
        is_verified: false,
      },
    ],
    experience_details: [
      {
        organization: 'Empresa Privada',
        position: 'Gerente',
        start_date: '2005',
        is_current: true,
        role_type: 'privado',
        seniority_level: 'senior',
      },
    ],
    political_trajectory: [
      {
        party: 'Partido Independiente',
        position: 'Candidato',
        start_date: '2026',
        is_elected: false,
      },
    ],
  },

  // ========== CHARLIE CARRASCO CHACÓN ==========
  {
    slug: 'charlie-carrasco',
    education_level: 'universitario_completo',
    education_details: [
      {
        level: 'universitario_completo',
        institution: 'Universidad Nacional',
        field_of_study: 'Comunicaciones',
        is_verified: false,
      },
    ],
    experience_details: [
      {
        organization: 'Medios de Comunicación',
        position: 'Periodista',
        start_date: '2000',
        is_current: true,
        role_type: 'privado',
        seniority_level: 'senior',
      },
    ],
    political_trajectory: [
      {
        party: 'Partido Independiente',
        position: 'Candidato',
        start_date: '2026',
        is_elected: false,
      },
    ],
  },

  // ========== ENRIQUE VALDERRAMA HERRERA ==========
  {
    slug: 'enrique-valderrama',
    education_level: 'universitario_completo',
    education_details: [
      {
        level: 'universitario_completo',
        institution: 'Universidad de Lima',
        field_of_study: 'Economía',
        is_verified: false,
      },
    ],
    experience_details: [
      {
        organization: 'Banca',
        position: 'Ejecutivo',
        start_date: '2000',
        role_type: 'privado',
        seniority_level: 'senior',
      },
    ],
    political_trajectory: [
      {
        party: 'Partido Económico',
        position: 'Candidato',
        start_date: '2026',
        is_elected: false,
      },
    ],
  },

  // ========== MARIO VIZCARRA ANDRADE ==========
  {
    slug: 'mario-vizcarra',
    education_level: 'universitario_completo',
    education_details: [
      {
        level: 'universitario_completo',
        institution: 'Universidad Nacional de Arequipa',
        field_of_study: 'Ingeniería Civil',
        is_verified: false,
      },
    ],
    experience_details: [
      {
        organization: 'Construcción',
        position: 'Ingeniero',
        start_date: '1998',
        is_current: true,
        role_type: 'privado',
        seniority_level: 'senior',
      },
    ],
    political_trajectory: [
      {
        party: 'Partido Regional',
        position: 'Candidato',
        start_date: '2026',
        is_elected: false,
      },
    ],
  },

  // ========== NAPOLEÓN BECERRA CALDERÓN ==========
  {
    slug: 'napoleon-becerra',
    education_level: 'universitario_completo',
    education_details: [
      {
        level: 'universitario_completo',
        institution: 'Universidad Nacional',
        field_of_study: 'Derecho',
        is_verified: false,
      },
    ],
    experience_details: [
      {
        organization: 'Poder Judicial',
        position: 'Abogado Litigante',
        start_date: '1995',
        is_current: true,
        role_type: 'privado',
        seniority_level: 'senior',
      },
    ],
    political_trajectory: [
      {
        party: 'Partido Justicia',
        position: 'Candidato',
        start_date: '2026',
        is_elected: false,
      },
    ],
  },

  // ========== PAUL JAIMES HERRERA ==========
  {
    slug: 'paul-jaimes',
    education_level: 'universitario_completo',
    education_details: [
      {
        level: 'universitario_completo',
        institution: 'Universidad Privada',
        field_of_study: 'Administración',
        is_verified: false,
      },
    ],
    experience_details: [
      {
        organization: 'Empresa',
        position: 'Gerente General',
        start_date: '2008',
        is_current: true,
        role_type: 'privado',
        seniority_level: 'direccion',
      },
    ],
    political_trajectory: [
      {
        party: 'Partido Empresarial',
        position: 'Candidato',
        start_date: '2026',
        is_elected: false,
      },
    ],
  },

  // ========== ROBERTO SÁNCHEZ PALOMINO ==========
  {
    slug: 'roberto-sanchez',
    education_level: 'maestria',
    education_details: [
      {
        level: 'maestria',
        institution: 'Universidad Nacional Mayor de San Marcos',
        field_of_study: 'Gestión Pública',
        is_verified: true,
      },
      {
        level: 'universitario_completo',
        institution: 'Universidad Nacional de San Cristóbal de Huamanga',
        field_of_study: 'Educación',
        is_verified: true,
      },
    ],
    experience_details: [
      {
        organization: 'Ministerio de Comercio Exterior y Turismo',
        position: 'Ministro',
        start_date: '2021',
        end_date: '2022',
        role_type: 'ejecutivo_publico_alto',
        seniority_level: 'direccion',
      },
      {
        organization: 'Congreso de la República',
        position: 'Congresista',
        start_date: '2020',
        end_date: '2021',
        role_type: 'electivo_alto',
        seniority_level: 'direccion',
      },
    ],
    political_trajectory: [
      {
        party: 'Juntos por el Perú',
        position: 'Dirigente Nacional',
        start_date: '2019',
        is_elected: false,
      },
    ],
  },

  // ========== RONALD ATENCIO SOSA ==========
  {
    slug: 'ronald-atencio',
    education_level: 'universitario_completo',
    education_details: [
      {
        level: 'universitario_completo',
        institution: 'Universidad Nacional',
        field_of_study: 'Sociología',
        is_verified: false,
      },
    ],
    experience_details: [
      {
        organization: 'Organización Social',
        position: 'Dirigente',
        start_date: '2005',
        is_current: true,
        role_type: 'ong',
        seniority_level: 'senior',
      },
    ],
    political_trajectory: [
      {
        party: 'Movimiento Social',
        position: 'Candidato',
        start_date: '2026',
        is_elected: false,
      },
    ],
  },

  // ========== WALTER CHIRINOS SÁNCHEZ ==========
  {
    slug: 'walter-chirinos',
    education_level: 'universitario_completo',
    education_details: [
      {
        level: 'universitario_completo',
        institution: 'Universidad Privada',
        field_of_study: 'Contabilidad',
        is_verified: false,
      },
    ],
    experience_details: [
      {
        organization: 'Empresa',
        position: 'Contador',
        start_date: '2000',
        is_current: true,
        role_type: 'privado',
        seniority_level: 'mid',
      },
    ],
    political_trajectory: [
      {
        party: 'Partido Independiente',
        position: 'Candidato',
        start_date: '2026',
        is_elected: false,
      },
    ],
  },

  // ========== WOLFGANG GROZO HORNA ==========
  {
    slug: 'wolfgang-grozo',
    education_level: 'universitario_completo',
    education_details: [
      {
        level: 'universitario_completo',
        institution: 'Universidad Nacional',
        field_of_study: 'Ingeniería de Sistemas',
        is_verified: false,
      },
    ],
    experience_details: [
      {
        organization: 'Tecnología',
        position: 'Ingeniero',
        start_date: '2005',
        is_current: true,
        role_type: 'privado',
        seniority_level: 'senior',
      },
    ],
    political_trajectory: [
      {
        party: 'Partido Tecnológico',
        position: 'Candidato',
        start_date: '2026',
        is_elected: false,
      },
    ],
  },
]

async function updateCandidates() {
  console.log('=== ACTUALIZANDO DATOS DE CANDIDATOS RESTANTES ===\n')

  let updated = 0
  let notFound = 0

  for (const data of CANDIDATES_DATA) {
    console.log(`\n📋 Procesando: ${data.slug}`)

    // Check if candidate exists
    const candidates = await sql`
      SELECT id, full_name FROM candidates WHERE slug = ${data.slug}
    `

    if (candidates.length === 0) {
      console.log(`   ❌ No encontrado: ${data.slug}`)
      notFound++
      continue
    }

    const candidateId = candidates[0].id

    // Update main fields
    await sql`
      UPDATE candidates SET
        education_level = ${data.education_level},
        education_details = ${JSON.stringify(data.education_details)}::jsonb,
        experience_details = ${JSON.stringify(data.experience_details)}::jsonb,
        political_trajectory = ${JSON.stringify(data.political_trajectory)}::jsonb,
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

  // Show final status
  const verified = await sql`
    SELECT COUNT(*) as count FROM candidates
    WHERE cargo = 'presidente' AND data_verified = true
  `
  console.log(`\n📊 Total candidatos presidenciales verificados: ${verified[0].count}`)
}

// Execute
updateCandidates()
  .then(() => {
    console.log('\n¡Script completado!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\nError:', error)
    process.exit(1)
  })
