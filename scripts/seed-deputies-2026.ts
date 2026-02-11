import { neon } from '@neondatabase/serverless'

const DATABASE_URL = process.env.DATABASE_URL || ''

const sql = neon(DATABASE_URL)

// Nombres peruanos realistas
const firstNames = [
  'Carlos', 'María', 'José', 'Ana', 'Luis', 'Rosa', 'Juan', 'Patricia', 'Pedro', 'Carmen',
  'Miguel', 'Teresa', 'Jorge', 'Gladys', 'Ricardo', 'Lucía', 'Fernando', 'Elena', 'Roberto', 'Silvia',
  'Julio', 'Mónica', 'Alberto', 'Rocío', 'Eduardo', 'Adriana', 'César', 'Diana', 'Víctor', 'Claudia',
  'Manuel', 'Sandra', 'Raúl', 'Gabriela', 'Hugo', 'Verónica', 'Oscar', 'Pilar', 'Alfredo', 'Isabel',
  'Sergio', 'Beatriz', 'Alejandro', 'Liliana', 'Enrique', 'Marisol', 'Gustavo', 'Lorena', 'Walter', 'Yolanda',
  'Diego', 'Natalia', 'Andrés', 'Carla', 'Martín', 'Susana', 'Antonio', 'Paola', 'Francisco', 'Cecilia',
  'Javier', 'Ivonne', 'Rubén', 'Milagros', 'Marcos', 'Jessica', 'Rafael', 'Karina', 'Pablo', 'Daniela'
]

const lastNames = [
  'García', 'Rodríguez', 'Martínez', 'López', 'Gonzales', 'Hernández', 'Pérez', 'Sánchez', 'Ramírez', 'Torres',
  'Flores', 'Rivera', 'Gómez', 'Díaz', 'Reyes', 'Cruz', 'Morales', 'Ortiz', 'Gutiérrez', 'Chávez',
  'Ramos', 'Vargas', 'Castillo', 'Jiménez', 'Rojas', 'Aguilar', 'Medina', 'Herrera', 'Castro', 'Ruiz',
  'Mendoza', 'Vásquez', 'Espinoza', 'Fernández', 'Salazar', 'Delgado', 'Quispe', 'Huamán', 'Ccama', 'Mamani',
  'Condori', 'Apaza', 'Choque', 'Vilca', 'Puma', 'Nina', 'Ticona', 'Cáceres', 'Valdivia', 'Paredes',
  'Benites', 'Alvarado', 'Campos', 'Carrasco', 'Vega', 'Núñez', 'Silva', 'Córdova', 'Palacios', 'Urbina'
]

const educationLevels = [
  'Doctorado', 'Maestría', 'Licenciatura', 'Bachiller', 'Técnico Superior', 'Secundaria Completa'
]

const educationWeights = [0.10, 0.20, 0.35, 0.20, 0.10, 0.05]

function getRandomEducation(): string {
  const rand = Math.random()
  let cumulative = 0
  for (let i = 0; i < educationLevels.length; i++) {
    cumulative += educationWeights[i]
    if (rand <= cumulative) return educationLevels[i]
  }
  return educationLevels[2]
}

function generateSlug(name: string, district: string): string {
  const base = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  const districtSlug = district
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .substring(0, 10)

  return `${base}-diputado-${districtSlug}`
}

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function generateUniqueName(usedNames: Set<string>): string {
  let name: string
  let attempts = 0
  do {
    const firstName = getRandomElement(firstNames)
    const lastName1 = getRandomElement(lastNames)
    const lastName2 = getRandomElement(lastNames)
    name = `${firstName} ${lastName1} ${lastName2}`
    attempts++
  } while (usedNames.has(name) && attempts < 100)
  usedNames.add(name)
  return name
}

async function seedDeputies() {
  console.log('🚀 Agregando candidatos a diputado...\n')

  try {
    // Obtener distritos
    const districts = await sql`
      SELECT id, name, slug, deputies_count
      FROM districts
      ORDER BY deputies_count DESC
    `
    console.log(`📍 ${districts.length} distritos encontrados`)

    // Obtener partidos
    const parties = await sql`SELECT id, name, short_name FROM parties ORDER BY name`
    console.log(`📊 ${parties.length} partidos encontrados\n`)

    // Eliminar diputados existentes
    await sql`DELETE FROM scores WHERE candidate_id IN (SELECT id FROM candidates WHERE cargo = 'diputado')`
    await sql`DELETE FROM candidates WHERE cargo = 'diputado'`
    console.log('🗑️ Diputados anteriores eliminados\n')

    const usedNames = new Set<string>()
    let totalInserted = 0

    // Para cada distrito
    for (const district of districts) {
      const seatsInDistrict = district.deputies_count

      // Candidatos por partido depende del tamaño del distrito
      // Distritos grandes: más candidatos por partido
      // Distritos pequeños: menos partidos compiten

      let partiesInDistrict: typeof parties
      let candidatesPerParty: number

      if (seatsInDistrict >= 5) {
        // Distritos grandes: todos los partidos, 2-3 candidatos
        partiesInDistrict = parties
        candidatesPerParty = 2 + Math.floor(Math.random() * 2)
      } else if (seatsInDistrict >= 3) {
        // Distritos medianos: 20-25 partidos, 1-2 candidatos
        partiesInDistrict = parties.slice(0, 20 + Math.floor(Math.random() * 10))
        candidatesPerParty = 1 + Math.floor(Math.random() * 2)
      } else {
        // Distritos pequeños: 15-20 partidos, 1 candidato
        partiesInDistrict = parties.slice(0, 15 + Math.floor(Math.random() * 8))
        candidatesPerParty = 1
      }

      let districtCount = 0

      for (const party of partiesInDistrict) {
        for (let i = 0; i < candidatesPerParty; i++) {
          const fullName = generateUniqueName(usedNames)
          const slug = generateSlug(fullName, district.slug)
          const educationLevel = getRandomEducation()

          await sql`
            INSERT INTO candidates (
              slug, full_name, cargo, party_id, district_id, education_level
            ) VALUES (
              ${slug}, ${fullName}, 'diputado', ${party.id}::uuid, ${district.id}::uuid, ${educationLevel}
            )
            ON CONFLICT (slug) DO NOTHING
          `
          totalInserted++
          districtCount++
        }
      }

      console.log(`  📍 ${district.name}: ${districtCount} candidatos (${seatsInDistrict} escaños)`)
    }

    // Insertar scores
    console.log('\n📊 Calculando scores para diputados...')

    const newDeputies = await sql`
      SELECT id FROM candidates
      WHERE cargo = 'diputado'
      AND id NOT IN (SELECT candidate_id FROM scores)
    `

    let scoresInserted = 0
    for (const deputy of newDeputies) {
      const competence = 25 + Math.random() * 65 // 25-90
      const integrity = 35 + Math.random() * 55 // 35-90
      const transparency = 30 + Math.random() * 55 // 30-85
      const confidence = 45 + Math.random() * 45 // 45-90

      const scoreBalanced = competence * 0.45 + integrity * 0.45 + transparency * 0.10
      const scoreMerit = competence * 0.60 + integrity * 0.30 + transparency * 0.10
      const scoreIntegrity = competence * 0.30 + integrity * 0.60 + transparency * 0.10

      await sql`
        INSERT INTO scores (
          candidate_id, competence, integrity, transparency, confidence,
          score_balanced, score_merit, score_integrity
        ) VALUES (
          ${deputy.id}::uuid, ${competence}, ${integrity}, ${transparency}, ${confidence},
          ${scoreBalanced}, ${scoreMerit}, ${scoreIntegrity}
        )
        ON CONFLICT (candidate_id) DO UPDATE SET
          competence = EXCLUDED.competence,
          integrity = EXCLUDED.integrity,
          transparency = EXCLUDED.transparency,
          confidence = EXCLUDED.confidence,
          score_balanced = EXCLUDED.score_balanced,
          score_merit = EXCLUDED.score_merit,
          score_integrity = EXCLUDED.score_integrity
      `
      scoresInserted++
    }

    // Verificar resultados
    const count = await sql`SELECT COUNT(*) as total FROM candidates WHERE cargo = 'diputado'`
    const byDistrict = await sql`
      SELECT d.name, COUNT(*) as total
      FROM candidates c
      JOIN districts d ON c.district_id = d.id
      WHERE c.cargo = 'diputado'
      GROUP BY d.name
      ORDER BY total DESC
      LIMIT 10
    `

    console.log(`\n✅ ${count[0].total} diputados insertados`)
    console.log(`✅ ${scoresInserted} scores calculados`)
    console.log('\n📊 Top 10 distritos por candidatos:')
    byDistrict.forEach(d => console.log(`  - ${d.name}: ${d.total}`))

    console.log('\n✅ Diputados agregados exitosamente!')

  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

seedDeputies()
