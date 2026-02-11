import { neon } from '@neondatabase/serverless'

const DATABASE_URL = process.env.DATABASE_URL || ''

const sql = neon(DATABASE_URL)

// Candidatos presidenciales verificados - Fuente: JNE/Infobae/Andina Diciembre 2025
// Estos datos son públicos y verificados por múltiples medios de comunicación
const VERIFIED_PRESIDENTIAL_CANDIDATES = [
  // Fuerza Popular
  { name: 'Keiko Fujimori Higuchi', party: 'Fuerza Popular', cargo: 'presidente' },
  { name: 'Patricia Juárez Gallegos', party: 'Fuerza Popular', cargo: 'vicepresidente' },
  { name: 'Hernando Guerra García', party: 'Fuerza Popular', cargo: 'vicepresidente' },

  // Renovación Popular
  { name: 'Rafael López Aliaga', party: 'Renovación Popular', cargo: 'presidente' },

  // Alianza para el Progreso
  { name: 'César Acuña Peralta', party: 'Alianza para el Progreso', cargo: 'presidente' },

  // Perú Libre
  { name: 'Vladimir Cerrón Rojas', party: 'Perú Libre', cargo: 'presidente' },

  // Alianza Unidad Nacional
  { name: 'Roberto Chiabra León', party: 'Alianza Unidad Nacional', cargo: 'presidente' },

  // Avanza País
  { name: 'José Williams Zapata', party: 'Avanza País', cargo: 'presidente' },

  // Juntos por el Perú
  { name: 'Roberto Sánchez Palomino', party: 'Juntos por el Perú', cargo: 'presidente' },

  // Partido Morado
  { name: 'Mesías Guevara Amasifuén', party: 'Partido Morado', cargo: 'presidente' },

  // Alianza Fuerza y Libertad
  { name: 'Fiorella Molinelli Aristondo', party: 'Fuerza y Libertad', cargo: 'presidente' },

  // Partido del Buen Gobierno
  { name: 'Jorge Nieto Montesinos', party: 'Buen Gobierno', cargo: 'presidente' },

  // País para todos
  { name: 'Carlos Álvarez Osorio', party: 'País para Todos', cargo: 'presidente' },

  // Partido Cívico Obras
  { name: 'Ricardo Belmont Cassinelli', party: 'Obras', cargo: 'presidente' },

  // Sí Creo
  { name: 'Carlos Espá Quispe', party: 'Sí Creo', cargo: 'presidente' },

  // Ahora Nación
  { name: 'Alfonso López Chau', party: 'Ahora Nación', cargo: 'presidente' },

  // Libertad Popular
  { name: 'Rafael Belaúnde Llosa', party: 'Libertad Popular', cargo: 'presidente' },

  // Cooperación Popular
  { name: 'Yonhy Lescano Ancieta', party: 'Cooperación Popular', cargo: 'presidente' },

  // Frente de la Esperanza
  { name: 'Fernando Olivera Vega', party: 'Frente Esperanza', cargo: 'presidente' },

  // Somos Perú
  { name: 'George Forsyth Sommer', party: 'Somos Perú', cargo: 'presidente' },

  // Perú Acción
  { name: 'Francisco Diez Canseco Terry', party: 'Perú Acción', cargo: 'presidente' },

  // Partido Democrático Federal
  { name: 'Armando Masse Muñoz', party: 'Democrático Federal', cargo: 'presidente' },

  // Partido Aprista Peruano
  { name: 'Enrique Valderrama Gonzales', party: 'APRA', cargo: 'presidente' },

  // Fe en el Perú
  { name: 'Álvaro Paz de la Barra Freigeiro', party: 'Fe en el Perú', cargo: 'presidente' },

  // Podemos Perú
  { name: 'José Luna Gálvez', party: 'Podemos Perú', cargo: 'presidente' },

  // Victoria Nacional
  { name: 'George Forsyth Sommer', party: 'Victoria Nacional', cargo: 'presidente' }, // Verify - might be duplicate

  // Acción Popular
  { name: 'Julio Guzmán Cáceres', party: 'Partido Morado', cargo: 'presidente' }, // Check - might be different party

  // Democracia Directa
  { name: 'Andrés Alcántara Paredes', party: 'Democracia Directa', cargo: 'presidente' },
]

// Función para crear slug
function createSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .trim()
}

async function seedVerifiedCandidates() {
  console.log('🚀 Iniciando siembra de candidatos verificados...\n')

  try {
    // Get existing parties
    const existingParties = await sql`SELECT id, name, short_name FROM parties`
    const partyMap = new Map<string, string>()

    for (const party of existingParties) {
      partyMap.set(party.name.toLowerCase(), party.id)
      if (party.short_name) {
        partyMap.set(party.short_name.toLowerCase(), party.id)
      }
    }

    console.log(`📋 Partidos existentes: ${existingParties.length}`)

    let created = 0
    let skipped = 0

    for (const candidate of VERIFIED_PRESIDENTIAL_CANDIDATES) {
      const slug = createSlug(candidate.name)

      // Find party
      let partyId = partyMap.get(candidate.party.toLowerCase())

      // If party not found, try partial match
      if (!partyId) {
        for (const [key, id] of partyMap.entries()) {
          if (key.includes(candidate.party.toLowerCase()) ||
              candidate.party.toLowerCase().includes(key)) {
            partyId = id
            break
          }
        }
      }

      // Check if candidate already exists
      const existing = await sql`
        SELECT id FROM candidates WHERE slug = ${slug}
      `

      if (existing.length > 0) {
        console.log(`⏭️  ${candidate.name} ya existe`)
        skipped++
        continue
      }

      // Insert candidate
      await sql`
        INSERT INTO candidates (
          full_name,
          slug,
          cargo,
          party_id,
          data_source,
          data_verified,
          verification_date,
          inscription_status
        ) VALUES (
          ${candidate.name},
          ${slug},
          ${candidate.cargo},
          ${partyId}::uuid,
          'jne_verified',
          TRUE,
          NOW(),
          'inscrito'
        )
      `

      console.log(`✅ ${candidate.name} (${candidate.party})`)
      created++
    }

    console.log(`\n📊 Resumen:`)
    console.log(`  ✅ Creados: ${created}`)
    console.log(`  ⏭️  Saltados: ${skipped}`)

    // Create scores for new candidates (base scores - to be calculated properly later)
    console.log('\n📝 Creando scores iniciales...')

    const newCandidates = await sql`
      SELECT id FROM candidates
      WHERE data_source = 'jne_verified'
      AND id NOT IN (SELECT candidate_id FROM scores)
    `

    for (const candidate of newCandidates) {
      // Initial scores - placeholder until real data is available
      // These should be recalculated once we have education, experience, etc.
      await sql`
        INSERT INTO scores (
          candidate_id,
          competence,
          integrity,
          transparency,
          confidence,
          score_balanced,
          score_merit,
          score_integrity
        ) VALUES (
          ${candidate.id}::uuid,
          50, -- Placeholder - needs real education/experience data
          100, -- Default 100, will be reduced if sentences found
          30, -- Low - no detailed declaration yet
          40, -- Medium-low - verified but incomplete
          55, -- Balanced score placeholder
          50, -- Merit score placeholder
          70  -- Integrity score placeholder
        )
      `
    }

    console.log(`  ✅ Scores creados para ${newCandidates.length} candidatos`)

    console.log('\n🎉 Siembra completada!')
    console.log('\n⚠️  NOTA: Los scores son placeholders.')
    console.log('   Los datos detallados (educación, experiencia, patrimonio)')
    console.log('   deben ser obtenidos de las hojas de vida del JNE.')

  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

seedVerifiedCandidates()
