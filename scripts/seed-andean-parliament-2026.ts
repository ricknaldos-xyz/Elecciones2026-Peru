import { neon } from '@neondatabase/serverless'

const DATABASE_URL = process.env.DATABASE_URL || ''

const sql = neon(DATABASE_URL)

// Nombres peruanos realistas
const firstNames = [
  'Carlos', 'María', 'José', 'Ana', 'Luis', 'Rosa', 'Juan', 'Patricia', 'Pedro', 'Carmen',
  'Miguel', 'Teresa', 'Jorge', 'Gladys', 'Ricardo', 'Lucía', 'Fernando', 'Elena', 'Roberto', 'Silvia',
  'Julio', 'Mónica', 'Alberto', 'Rocío', 'Eduardo', 'Adriana', 'César', 'Diana', 'Víctor', 'Claudia',
  'Manuel', 'Sandra', 'Raúl', 'Gabriela', 'Hugo', 'Verónica', 'Oscar', 'Pilar', 'Alfredo', 'Isabel',
  'Sergio', 'Beatriz', 'Alejandro', 'Liliana', 'Enrique', 'Marisol', 'Gustavo', 'Lorena', 'Walter', 'Yolanda'
]

const lastNames = [
  'García', 'Rodríguez', 'Martínez', 'López', 'Gonzales', 'Hernández', 'Pérez', 'Sánchez', 'Ramírez', 'Torres',
  'Flores', 'Rivera', 'Gómez', 'Díaz', 'Reyes', 'Cruz', 'Morales', 'Ortiz', 'Gutiérrez', 'Chávez',
  'Ramos', 'Vargas', 'Castillo', 'Jiménez', 'Rojas', 'Aguilar', 'Medina', 'Herrera', 'Castro', 'Ruiz',
  'Mendoza', 'Vásquez', 'Espinoza', 'Fernández', 'Salazar', 'Delgado', 'Quispe', 'Huamán', 'Ccama', 'Mamani',
  'Condori', 'Apaza', 'Choque', 'Vilca', 'Puma', 'Nina', 'Ticona', 'Cáceres', 'Valdivia', 'Paredes'
]

const educationLevels = [
  'Doctorado', 'Maestría', 'Licenciatura', 'Bachiller', 'Técnico Superior'
]

const educationWeights = [0.20, 0.30, 0.35, 0.10, 0.05]

function getRandomEducation(): string {
  const rand = Math.random()
  let cumulative = 0
  for (let i = 0; i < educationLevels.length; i++) {
    cumulative += educationWeights[i]
    if (rand <= cumulative) return educationLevels[i]
  }
  return educationLevels[2]
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
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

async function seedAndeanParliament() {
  console.log('🚀 Agregando candidatos al Parlamento Andino...\n')

  try {
    // Obtener todos los partidos
    const parties = await sql`SELECT id, name, short_name FROM parties ORDER BY name`
    console.log(`📊 ${parties.length} partidos encontrados\n`)

    // Eliminar candidatos existentes del Parlamento Andino
    await sql`DELETE FROM scores WHERE candidate_id IN (SELECT id FROM candidates WHERE cargo = 'parlamento_andino')`
    await sql`DELETE FROM candidates WHERE cargo = 'parlamento_andino'`
    console.log('🗑️ Candidatos anteriores del Parlamento Andino eliminados\n')

    const usedNames = new Set<string>()
    let totalInserted = 0

    // 2-3 candidatos por partido para Parlamento Andino
    for (const party of parties) {
      const numCandidates = 2 + Math.floor(Math.random() * 2) // 2-3 candidatos
      console.log(`  📝 ${party.short_name || party.name}: ${numCandidates} candidatos`)

      for (let i = 0; i < numCandidates; i++) {
        const fullName = generateUniqueName(usedNames)
        const slug = generateSlug(fullName) + '-parlamento-andino'
        const educationLevel = getRandomEducation()

        await sql`
          INSERT INTO candidates (
            slug, full_name, cargo, party_id, education_level
          ) VALUES (
            ${slug}, ${fullName}, 'parlamento_andino', ${party.id}::uuid, ${educationLevel}
          )
          ON CONFLICT (slug) DO NOTHING
        `
        totalInserted++
      }
    }

    // Insertar scores para los nuevos candidatos
    console.log('\n📊 Calculando scores para Parlamento Andino...')

    const newCandidates = await sql`
      SELECT id FROM candidates
      WHERE cargo = 'parlamento_andino'
      AND id NOT IN (SELECT candidate_id FROM scores)
    `

    let scoresInserted = 0
    for (const candidate of newCandidates) {
      const competence = 35 + Math.random() * 55 // 35-90
      const integrity = 40 + Math.random() * 50 // 40-90
      const transparency = 35 + Math.random() * 50 // 35-85
      const confidence = 50 + Math.random() * 40 // 50-90

      const scoreBalanced = competence * 0.45 + integrity * 0.45 + transparency * 0.10
      const scoreMerit = competence * 0.60 + integrity * 0.30 + transparency * 0.10
      const scoreIntegrity = competence * 0.30 + integrity * 0.60 + transparency * 0.10

      await sql`
        INSERT INTO scores (
          candidate_id, competence, integrity, transparency, confidence,
          score_balanced, score_merit, score_integrity
        ) VALUES (
          ${candidate.id}::uuid, ${competence}, ${integrity}, ${transparency}, ${confidence},
          ${scoreBalanced}, ${scoreMerit}, ${scoreIntegrity}
        )
        ON CONFLICT (candidate_id) DO UPDATE SET
          competence = EXCLUDED.competence,
          integrity = EXCLUDED.integrity,
          transparency = EXCLUDED.transparency,
          confidence = EXCLUDED.confidence,
          score_balanced = EXCLUDED.score_balanced,
          score_merit = EXCLUDED.score_merit,
          score_integrity = EXCLUDED.score_integrity,
          updated_at = NOW()
      `
      scoresInserted++
    }

    // Verificar resultados
    const count = await sql`SELECT COUNT(*) as total FROM candidates WHERE cargo = 'parlamento_andino'`
    const byParty = await sql`
      SELECT p.short_name, COUNT(*) as total
      FROM candidates c
      JOIN parties p ON c.party_id = p.id
      WHERE c.cargo = 'parlamento_andino'
      GROUP BY p.short_name
      ORDER BY total DESC
      LIMIT 10
    `

    console.log(`\n✅ ${count[0].total} candidatos al Parlamento Andino insertados`)
    console.log(`✅ ${scoresInserted} scores calculados`)
    console.log('\n📊 Top 10 partidos por candidatos:')
    byParty.forEach(p => console.log(`  - ${p.short_name}: ${p.total}`))

    // Resumen final de todos los candidatos
    const allCandidates = await sql`
      SELECT cargo, COUNT(*) as total
      FROM candidates
      GROUP BY cargo
      ORDER BY total DESC
    `
    console.log('\n📊 Resumen total de candidatos:')
    allCandidates.forEach(c => console.log(`  - ${c.cargo}: ${c.total}`))

    console.log('\n✅ Parlamento Andino agregado exitosamente!')

  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

seedAndeanParliament()
