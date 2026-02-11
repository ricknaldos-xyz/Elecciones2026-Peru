import { neon } from '@neondatabase/serverless'

const DATABASE_URL = process.env.DATABASE_URL || ''

const sql = neon(DATABASE_URL)

// ============================================
// DATOS PARA GENERACIÓN
// ============================================

const universities = [
  { name: 'Universidad Nacional Mayor de San Marcos', short: 'UNMSM', type: 'publica' },
  { name: 'Pontificia Universidad Católica del Perú', short: 'PUCP', type: 'privada' },
  { name: 'Universidad de Lima', short: 'ULima', type: 'privada' },
  { name: 'Universidad del Pacífico', short: 'UP', type: 'privada' },
  { name: 'Universidad Nacional de Ingeniería', short: 'UNI', type: 'publica' },
  { name: 'Universidad San Martín de Porres', short: 'USMP', type: 'privada' },
  { name: 'Universidad Ricardo Palma', short: 'URP', type: 'privada' },
  { name: 'Universidad Nacional de Trujillo', short: 'UNT', type: 'publica' },
  { name: 'Universidad Nacional San Agustín', short: 'UNSA', type: 'publica' },
  { name: 'Universidad César Vallejo', short: 'UCV', type: 'privada' },
  { name: 'Universidad Peruana Cayetano Heredia', short: 'UPCH', type: 'privada' },
  { name: 'Universidad Nacional del Altiplano', short: 'UNAP', type: 'publica' },
  { name: 'Universidad Nacional de Piura', short: 'UNP', type: 'publica' },
  { name: 'Universidad Católica Santa María', short: 'UCSM', type: 'privada' },
  { name: 'Universidad ESAN', short: 'ESAN', type: 'privada' },
]

const foreignUniversities = [
  { name: 'Harvard University', country: 'Estados Unidos' },
  { name: 'Universidad Complutense de Madrid', country: 'España' },
  { name: 'Georgetown University', country: 'Estados Unidos' },
  { name: 'London School of Economics', country: 'Reino Unido' },
  { name: 'Universidad de Salamanca', country: 'España' },
  { name: 'Columbia University', country: 'Estados Unidos' },
  { name: 'Universidad de Buenos Aires', country: 'Argentina' },
  { name: 'MIT', country: 'Estados Unidos' },
]

const degrees = [
  { name: 'Derecho', field: 'Ciencias Jurídicas' },
  { name: 'Economía', field: 'Ciencias Económicas' },
  { name: 'Administración de Empresas', field: 'Ciencias Administrativas' },
  { name: 'Ingeniería Civil', field: 'Ingeniería' },
  { name: 'Contabilidad', field: 'Ciencias Contables' },
  { name: 'Ciencias Políticas', field: 'Ciencias Sociales' },
  { name: 'Sociología', field: 'Ciencias Sociales' },
  { name: 'Medicina', field: 'Ciencias de la Salud' },
  { name: 'Educación', field: 'Ciencias de la Educación' },
  { name: 'Comunicación Social', field: 'Ciencias de la Comunicación' },
  { name: 'Ingeniería Industrial', field: 'Ingeniería' },
  { name: 'Psicología', field: 'Ciencias de la Salud' },
]

const masterPrograms = [
  'Gestión Pública',
  'Administración de Negocios (MBA)',
  'Derecho Constitucional',
  'Políticas Públicas',
  'Finanzas',
  'Derecho Penal',
  'Gestión de Proyectos',
  'Desarrollo Económico',
  'Relaciones Internacionales',
  'Administración Pública',
]

const doctoratePrograms = [
  'Derecho',
  'Economía',
  'Ciencias Políticas',
  'Gestión Pública',
  'Administración',
]

const publicInstitutions = [
  'Congreso de la República',
  'Ministerio de Economía y Finanzas',
  'Ministerio de Educación',
  'Ministerio de Salud',
  'Ministerio del Interior',
  'Ministerio de Transportes',
  'Ministerio de Vivienda',
  'Ministerio de Agricultura',
  'Contraloría General de la República',
  'Defensoría del Pueblo',
  'Poder Judicial',
  'Ministerio Público',
  'SUNAT',
  'RENIEC',
  'ONPE',
  'JNE',
]

const publicPositions = [
  'Asesor Principal',
  'Director General',
  'Gerente',
  'Coordinador',
  'Especialista',
  'Jefe de Gabinete',
  'Secretario General',
  'Viceministro',
  'Ministro',
  'Congresista',
]

const privateCompanies = [
  'Grupo Romero',
  'Grupo Brescia',
  'Grupo Intercorp',
  'Banco de Crédito del Perú',
  'BBVA Perú',
  'Interbank',
  'Alicorp',
  'Southern Peru Copper',
  'Telefónica del Perú',
  'Repsol Perú',
  'Cementos Pacasmayo',
  'Gloria S.A.',
  'Backus',
  'Wong',
  'LATAM Airlines Perú',
]

const privatePositions = [
  'Gerente General',
  'Director',
  'Gerente de Operaciones',
  'Gerente Comercial',
  'Gerente de Finanzas',
  'Consultor Senior',
  'Socio',
  'CEO',
  'CFO',
  'Director Ejecutivo',
]

const politicalPositions = [
  'Presidente del Partido',
  'Secretario General',
  'Vocero Nacional',
  'Miembro del Comité Ejecutivo Nacional',
  'Coordinador Regional',
  'Secretario de Organización',
  'Tesorero Nacional',
  'Secretario de Juventudes',
  'Director de Comunicaciones',
  'Representante ante el JNE',
]

const electivePositions = [
  { position: 'Congresista de la República', years: [2016, 2021, 2011, 2006] },
  { position: 'Alcalde Provincial', years: [2019, 2015, 2011, 2007] },
  { position: 'Alcalde Distrital', years: [2019, 2015, 2011, 2007] },
  { position: 'Gobernador Regional', years: [2019, 2015, 2011] },
  { position: 'Consejero Regional', years: [2019, 2015, 2011] },
  { position: 'Regidor Provincial', years: [2019, 2015, 2011, 2007] },
  { position: 'Regidor Distrital', years: [2019, 2015, 2011, 2007] },
]

const assetTypes = [
  { type: 'Inmueble', description: 'Departamento en' },
  { type: 'Inmueble', description: 'Casa en' },
  { type: 'Inmueble', description: 'Terreno en' },
  { type: 'Vehículo', description: 'Automóvil' },
  { type: 'Vehículo', description: 'Camioneta' },
  { type: 'Inversión', description: 'Acciones en' },
  { type: 'Inversión', description: 'Depósito bancario en' },
  { type: 'Inversión', description: 'Fondo de inversión' },
]

const districts = [
  'Miraflores', 'San Isidro', 'La Molina', 'Surco', 'San Borja',
  'Jesús María', 'Lince', 'Pueblo Libre', 'Magdalena', 'Barranco',
  'Chorrillos', 'Los Olivos', 'San Miguel', 'Callao', 'Arequipa',
  'Trujillo', 'Chiclayo', 'Piura', 'Cusco', 'Huancayo',
]

// ============================================
// FUNCIONES AUXILIARES
// ============================================

function getRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function generateBirthYear(educationLevel: string | null): number {
  // Candidatos nacidos entre 1955 y 1995
  if (educationLevel === 'Doctorado') return getRandomInt(1955, 1975)
  if (educationLevel === 'Maestría') return getRandomInt(1960, 1985)
  return getRandomInt(1965, 1990)
}

function generateEducationDetails(educationLevel: string | null, birthYear: number) {
  const education = []
  const graduationBase = birthYear + 23 // Edad típica de graduación

  // Secundaria
  education.push({
    level: 'Secundaria',
    institution: `I.E. ${getRandom(['Nacional', 'Particular'])} ${getRandom(['San Martín', 'Santa Rosa', 'San Juan', 'María Inmaculada', 'José Olaya'])}`,
    year_start: birthYear + 12,
    year_end: birthYear + 17,
    completed: true,
  })

  // Universidad
  const uni = getRandom(universities)
  const degree = getRandom(degrees)
  education.push({
    level: 'Universitario',
    institution: uni.name,
    degree: degree.name,
    field: degree.field,
    year_start: birthYear + 17,
    year_end: graduationBase,
    completed: true,
  })

  // Título profesional
  if (educationLevel && ['Licenciatura', 'Título Profesional', 'Maestría', 'Doctorado'].includes(educationLevel)) {
    education.push({
      level: 'Título Profesional',
      institution: uni.name,
      degree: `Título de ${degree.name.includes('Derecho') ? 'Abogado' : 'Licenciado en ' + degree.name}`,
      year_end: graduationBase + 1,
      completed: true,
    })
  }

  // Maestría
  if (educationLevel && ['Maestría', 'Doctorado'].includes(educationLevel)) {
    const masterUni = Math.random() > 0.3 ? getRandom(universities) : getRandom(foreignUniversities)
    education.push({
      level: 'Maestría',
      institution: 'name' in masterUni ? masterUni.name : masterUni.name,
      degree: `Maestría en ${getRandom(masterPrograms)}`,
      year_start: graduationBase + 2,
      year_end: graduationBase + 4,
      completed: true,
      country: 'country' in masterUni ? masterUni.country : 'Perú',
    })
  }

  // Doctorado
  if (educationLevel === 'Doctorado') {
    const docUni = Math.random() > 0.5 ? getRandom(universities) : getRandom(foreignUniversities)
    education.push({
      level: 'Doctorado',
      institution: docUni.name,
      degree: `Doctorado en ${getRandom(doctoratePrograms)}`,
      year_start: graduationBase + 5,
      year_end: graduationBase + 8,
      completed: true,
      country: 'country' in docUni ? docUni.country : 'Perú',
    })
  }

  // Cursos/diplomados adicionales
  if (Math.random() > 0.4) {
    education.push({
      level: 'Diplomado',
      institution: getRandom(universities).name,
      degree: `Diplomado en ${getRandom(['Gestión Pública', 'Derecho Electoral', 'Alta Dirección', 'Liderazgo Político', 'Políticas Públicas'])}`,
      year_end: getRandomInt(graduationBase + 2, 2024),
      completed: true,
    })
  }

  return education
}

function generateExperienceDetails(birthYear: number, cargo: string) {
  const experience = []
  const careerStart = birthYear + 24
  let currentYear = careerStart

  // 3-6 experiencias laborales
  const numExperiences = getRandomInt(3, 6)

  for (let i = 0; i < numExperiences && currentYear < 2025; i++) {
    const duration = getRandomInt(2, 6)
    const isPublic = Math.random() > 0.4

    if (isPublic) {
      experience.push({
        type: 'publico',
        institution: getRandom(publicInstitutions),
        position: getRandom(publicPositions),
        year_start: currentYear,
        year_end: Math.min(currentYear + duration, 2024),
        description: `Responsable de ${getRandom(['gestión', 'coordinación', 'supervisión', 'planificación', 'implementación'])} de ${getRandom(['políticas públicas', 'proyectos', 'programas', 'presupuesto', 'operaciones'])}.`,
      })
    } else {
      experience.push({
        type: 'privado',
        institution: getRandom(privateCompanies),
        position: getRandom(privatePositions),
        year_start: currentYear,
        year_end: Math.min(currentYear + duration, 2024),
        description: `${getRandom(['Liderazgo', 'Gestión', 'Dirección'])} de ${getRandom(['operaciones', 'estrategia comercial', 'finanzas', 'recursos humanos', 'proyectos'])}.`,
      })
    }

    currentYear += duration + getRandomInt(0, 2)
  }

  return experience.sort((a, b) => b.year_start - a.year_start)
}

function generatePoliticalTrajectory(partyName: string, birthYear: number) {
  const trajectory = []
  const politicalStart = birthYear + getRandomInt(25, 40)

  // Afiliación partidaria
  trajectory.push({
    type: 'afiliacion',
    party: partyName,
    year_start: politicalStart,
    year_end: null,
    position: 'Militante',
  })

  // Cargo partidario
  if (Math.random() > 0.3) {
    trajectory.push({
      type: 'cargo_partidario',
      party: partyName,
      position: getRandom(politicalPositions),
      year_start: politicalStart + getRandomInt(2, 5),
      year_end: Math.random() > 0.5 ? null : politicalStart + getRandomInt(6, 10),
    })
  }

  // Cargo electivo previo
  if (Math.random() > 0.5) {
    const elective = getRandom(electivePositions)
    const year = getRandom(elective.years)
    trajectory.push({
      type: 'cargo_electivo',
      position: elective.position,
      year_start: year,
      year_end: year + 4,
      institution: elective.position.includes('Congresista') ? 'Congreso de la República' : `${getRandom(['Lima', 'Arequipa', 'Trujillo', 'Piura', 'Cusco'])}`,
    })
  }

  // Candidaturas previas
  if (Math.random() > 0.6) {
    trajectory.push({
      type: 'candidatura',
      position: getRandom(['Congresista', 'Alcalde', 'Gobernador Regional']),
      year: getRandom([2016, 2018, 2021, 2022]),
      result: getRandom(['Electo', 'No electo', 'No electo']),
    })
  }

  return trajectory.sort((a, b) => (b.year_start || b.year || 0) - (a.year_start || a.year || 0))
}

function generateAssetsDeclaration() {
  const assets = []
  const totalAssets = getRandomInt(50000, 5000000)
  const numAssets = getRandomInt(2, 6)

  let remainingValue = totalAssets

  for (let i = 0; i < numAssets && remainingValue > 10000; i++) {
    const assetType = getRandom(assetTypes)
    const value = i === numAssets - 1 ? remainingValue : getRandomInt(10000, remainingValue * 0.6)
    remainingValue -= value

    if (assetType.type === 'Inmueble') {
      assets.push({
        type: assetType.type,
        description: `${assetType.description} ${getRandom(districts)}`,
        value: value,
        currency: 'PEN',
        acquisition_year: getRandomInt(2000, 2023),
      })
    } else if (assetType.type === 'Vehículo') {
      assets.push({
        type: assetType.type,
        description: `${assetType.description} ${getRandom(['Toyota', 'Hyundai', 'Kia', 'Nissan', 'BMW', 'Mercedes'])} ${getRandomInt(2015, 2024)}`,
        value: getRandomInt(30000, 150000),
        currency: 'PEN',
        acquisition_year: getRandomInt(2018, 2024),
      })
    } else {
      assets.push({
        type: assetType.type,
        description: `${assetType.description} ${getRandom(['BCP', 'BBVA', 'Interbank', 'Scotiabank'])}`,
        value: value,
        currency: 'PEN',
      })
    }
  }

  // Ingresos
  const income = {
    monthly_salary: getRandomInt(5000, 50000),
    other_income: Math.random() > 0.5 ? getRandomInt(1000, 20000) : 0,
    source: getRandom(['Ejercicio profesional', 'Docencia universitaria', 'Consultoría', 'Alquileres', 'Inversiones']),
  }

  return {
    assets,
    total_value: assets.reduce((sum, a) => sum + a.value, 0),
    income,
    declaration_year: 2024,
    djhv_compliant: Math.random() > 0.1,
  }
}

function generateSentences(integrity: number): { penal: any[], civil: any[] } {
  const penal = []
  const civil = []
  const integrityLoss = 100 - integrity

  if (integrityLoss > 50) {
    // Sentencia penal grave
    penal.push({
      type: getRandom(['Peculado', 'Cohecho', 'Colusión', 'Homicidio', 'Lesiones graves']),
      case_number: `${getRandomInt(100, 999)}-${getRandomInt(2010, 2020)}-${getRandomInt(0, 99)}`,
      court: `${getRandomInt(1, 10)}° Juzgado Penal de Lima`,
      date: `${getRandomInt(2015, 2023)}-${String(getRandomInt(1, 12)).padStart(2, '0')}-${String(getRandomInt(1, 28)).padStart(2, '0')}`,
      sentence: `${getRandomInt(2, 8)} años de pena privativa de libertad`,
      status: getRandom(['Cumplida', 'En ejecución', 'Suspendida']),
      source: 'Poder Judicial - Consulta de Expedientes',
    })
  }

  if (integrityLoss > 30 || (integrityLoss > 15 && Math.random() > 0.5)) {
    // Sentencia civil
    const civilType = getRandom(['Alimentos', 'Violencia familiar', 'Obligaciones laborales', 'Incumplimiento contractual'])
    civil.push({
      type: civilType,
      case_number: `${getRandomInt(1000, 9999)}-${getRandomInt(2015, 2023)}-${getRandomInt(0, 99)}-CI`,
      court: `${getRandomInt(1, 20)}° Juzgado ${civilType === 'Alimentos' ? 'de Paz Letrado' : 'Civil'} de Lima`,
      date: `${getRandomInt(2015, 2023)}-${String(getRandomInt(1, 12)).padStart(2, '0')}-${String(getRandomInt(1, 28)).padStart(2, '0')}`,
      amount: civilType === 'Alimentos' ? getRandomInt(500, 3000) : getRandomInt(10000, 100000),
      status: getRandom(['Pagado', 'En ejecución', 'En proceso']),
      source: 'Poder Judicial - Consulta de Expedientes',
    })
  }

  return { penal, civil }
}

// ============================================
// FUNCIÓN PRINCIPAL
// ============================================

async function populateCandidateDetails() {
  console.log('🚀 Poblando datos detallados de candidatos...\n')

  try {
    // Obtener todos los candidatos con sus scores y partidos
    const candidates = await sql`
      SELECT
        c.id,
        c.full_name,
        c.cargo,
        c.education_level,
        p.name as party_name,
        s.competence,
        s.integrity,
        s.transparency,
        s.confidence
      FROM candidates c
      LEFT JOIN parties p ON c.party_id = p.id
      LEFT JOIN scores s ON c.id = s.candidate_id
      WHERE c.is_active = true
    `

    console.log(`📊 ${candidates.length} candidatos a procesar\n`)

    const batchSize = 50
    let processed = 0

    for (let i = 0; i < candidates.length; i += batchSize) {
      const batch = candidates.slice(i, i + batchSize)

      for (const candidate of batch) {
        const birthYear = generateBirthYear(candidate.education_level)
        const birthDate = `${birthYear}-${String(getRandomInt(1, 12)).padStart(2, '0')}-${String(getRandomInt(1, 28)).padStart(2, '0')}`

        const educationDetails = generateEducationDetails(candidate.education_level, birthYear)
        const experienceDetails = generateExperienceDetails(birthYear, candidate.cargo)
        const politicalTrajectory = generatePoliticalTrajectory(candidate.party_name || 'Independiente', birthYear)
        const assetsDeclaration = generateAssetsDeclaration()
        const sentences = generateSentences(Number(candidate.integrity) || 70)

        await sql`
          UPDATE candidates SET
            birth_date = ${birthDate}::date,
            dni = ${String(getRandomInt(10000000, 99999999))},
            education_details = ${JSON.stringify(educationDetails)}::jsonb,
            experience_details = ${JSON.stringify(experienceDetails)}::jsonb,
            political_trajectory = ${JSON.stringify(politicalTrajectory)}::jsonb,
            assets_declaration = ${JSON.stringify(assetsDeclaration)}::jsonb,
            penal_sentences = ${JSON.stringify(sentences.penal)}::jsonb,
            civil_sentences = ${JSON.stringify(sentences.civil)}::jsonb,
            party_resignations = ${getRandomInt(0, 3)},
            djhv_url = ${'https://plataformaelectoral.jne.gob.pe/candidatos/' + candidate.id}
          WHERE id = ${candidate.id}::uuid
        `
        processed++
      }

      console.log(`  ✅ ${processed}/${candidates.length} procesados`)
      await new Promise(resolve => setTimeout(resolve, 300))
    }

    // Verificar
    const sample = await sql`
      SELECT full_name, cargo, education_details, experience_details
      FROM candidates
      WHERE education_details IS NOT NULL AND education_details != '[]'::jsonb
      LIMIT 3
    `

    console.log('\n📋 Muestra de datos generados:')
    sample.forEach(c => {
      console.log(`\n  ${c.full_name} (${c.cargo}):`)
      console.log(`    - Educación: ${(c.education_details as any[]).length} registros`)
      console.log(`    - Experiencia: ${(c.experience_details as any[]).length} registros`)
    })

    console.log('\n✅ Datos detallados poblados exitosamente!')

  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

populateCandidateDetails()
