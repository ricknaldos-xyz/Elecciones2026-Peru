/**
 * Script para importar candidatos al Senado
 * Datos obtenidos de fuentes públicas (JNE, noticias)
 */

import { neon } from '@neondatabase/serverless'

const DATABASE_URL = process.env.DATABASE_URL || ''

const sql = neon(DATABASE_URL)

interface SenadorData {
  fullName: string
  partyName: string
  districtName?: string
}

// Datos de candidatos al Senado 2026
// Fuentes: RPP, El Comercio, JNE Voto Informado
const senadoresData: SenadorData[] = [
  // RENOVACIÓN POPULAR
  { fullName: "Absalón Vásquez Villanueva", partyName: "Renovación Popular" },
  { fullName: "Gladys Margot Echaíz Ramos", partyName: "Renovación Popular" },
  { fullName: "Jorge Luis Solís Espinoza", partyName: "Renovación Popular" },
  { fullName: "Paolo Maldonado Farje", partyName: "Renovación Popular" },
  { fullName: "Luis Alberto Valdez Farías", partyName: "Renovación Popular" },

  // PODEMOS PERÚ
  { fullName: "Herminia Rosa Chino Chirinos", partyName: "Podemos Perú" },
  { fullName: "Guido César Bellido Ugarte", partyName: "Podemos Perú" },
  { fullName: "Edgar Tello Montes", partyName: "Podemos Perú" },
  { fullName: "Digna Calle Lobatón", partyName: "Podemos Perú" },

  // FUERZA POPULAR
  { fullName: "César Eduardo Astudillo Salcedo", partyName: "Fuerza Popular" },
  { fullName: "Carlos Mesía Ramírez", partyName: "Fuerza Popular" },
  { fullName: "Martha Chávez Cossío", partyName: "Fuerza Popular" },
  { fullName: "Úrsula Letona Pereyra", partyName: "Fuerza Popular" },
  { fullName: "Alejandro Aguinaga Recuenco", partyName: "Fuerza Popular" },

  // ALIANZA PARA EL PROGRESO
  { fullName: "Juan José Santiváñez Antúnez", partyName: "Alianza para el Progreso" },
  { fullName: "Roberto Vieira Portugal", partyName: "Alianza para el Progreso" },
  { fullName: "Luis Iberico Núñez", partyName: "Alianza para el Progreso" },
  { fullName: "César Acuña Peralta", partyName: "Alianza para el Progreso" },

  // ACCIÓN POPULAR
  { fullName: "Víctor Andrés García Belaunde", partyName: "Acción Popular" },
  { fullName: "Edmundo del Águila Morote", partyName: "Acción Popular" },
  { fullName: "Raúl Diez Canseco Terry", partyName: "Acción Popular" },
  { fullName: "Johnny Lescano Ancieta", partyName: "Acción Popular" },

  // PARTIDO MORADO
  { fullName: "Julio Guzmán Cáceres", partyName: "Partido Morado" },
  { fullName: "Carolina Lizárraga Houghton", partyName: "Partido Morado" },
  { fullName: "Alberto de Belaunde de Cárdenas", partyName: "Partido Morado" },
  { fullName: "Francisco Sagasti Hochhausler", partyName: "Partido Morado" },

  // AVANZA PAÍS
  { fullName: "Patricia Chirinos Venegas", partyName: "Avanza País" },
  { fullName: "Hernando de Soto Polar", partyName: "Avanza País" },
  { fullName: "José Williams Zapata", partyName: "Avanza País" },

  // SOMOS PERÚ
  { fullName: "José León Luna Gálvez", partyName: "Somos Perú" },
  { fullName: "Susel Paredes Piqué", partyName: "Somos Perú" },
  { fullName: "Martín Vizcarra Cornejo", partyName: "Somos Perú" },

  // PERÚ LIBRE
  { fullName: "Vladimir Cerrón Rojas", partyName: "Perú Libre" },
  { fullName: "Guillermo Bermejo Rojas", partyName: "Perú Libre" },
  { fullName: "Waldemar Cerrón Rojas", partyName: "Perú Libre" },

  // JUNTOS POR EL PERÚ
  { fullName: "Verónika Mendoza Frisch", partyName: "Juntos por el Perú" },
  { fullName: "Marco Arana Zegarra", partyName: "Juntos por el Perú" },
  { fullName: "Indira Huilca Flores", partyName: "Juntos por el Perú" },

  // PARTIDO POPULAR CRISTIANO
  { fullName: "Alberto Beingolea Delgado", partyName: "Partido Popular Cristiano" },
  { fullName: "Lourdes Flores Nano", partyName: "Partido Popular Cristiano" },
  { fullName: "Raúl Castro Stagnaro", partyName: "Partido Popular Cristiano" },

  // FRENTE AMPLIO
  { fullName: "Isabel Cortez Aguirre", partyName: "Frente Amplio" },
  { fullName: "Ruth Luque Ibarra", partyName: "Frente Amplio" },

  // DEMOCRACIA DIRECTA
  { fullName: "Andrés Alcántara Paredes", partyName: "Democracia Directa" },
  { fullName: "Sigrid Bazán Narro", partyName: "Democracia Directa" },

  // UNIÓN POR EL PERÚ
  { fullName: "José Vega Antonio", partyName: "Unión por el Perú" },
  { fullName: "Antauro Humala Tasso", partyName: "Unión por el Perú" },

  // PERÚ PATRIA SEGURA
  { fullName: "Rafael López Aliaga Cazorla", partyName: "Perú Patria Segura" },

  // HONOR Y DEMOCRACIA
  { fullName: "Carlos Anderson Ramírez", partyName: "Honor y Democracia" },
  { fullName: "Adriana Tudela Gutiérrez", partyName: "Honor y Democracia" },

  // FE EN EL PERÚ
  { fullName: "Kenji Fujimori Higuchi", partyName: "Fe en el Perú" },
]

function createSlug(fullName: string): string {
  return fullName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

async function getPartyId(partyName: string): Promise<string | null> {
  const normalizedInput = partyName.toLowerCase().trim()

  // Buscar por nombre exacto o short_name
  const result = await sql`
    SELECT id, name, short_name FROM parties
    WHERE LOWER(name) = ${normalizedInput}
    OR LOWER(short_name) = ${normalizedInput}
    LIMIT 1
  `

  if (result.length > 0) return result[0].id

  // Buscar por coincidencia parcial
  const partialResult = await sql`
    SELECT id, name FROM parties
    WHERE LOWER(name) LIKE ${'%' + normalizedInput + '%'}
    OR ${normalizedInput} LIKE '%' || LOWER(name) || '%'
    LIMIT 1
  `

  if (partialResult.length > 0) return partialResult[0].id

  return null
}

async function candidateExists(fullName: string, cargo: string): Promise<boolean> {
  const result = await sql`
    SELECT 1 FROM candidates
    WHERE LOWER(full_name) = LOWER(${fullName})
    AND cargo = ${cargo}
    LIMIT 1
  `
  return result.length > 0
}

async function insertSenador(data: SenadorData): Promise<{ success: boolean; error?: string }> {
  try {
    // Verificar si ya existe
    if (await candidateExists(data.fullName, 'senador')) {
      return { success: false, error: 'Ya existe' }
    }

    // Obtener party_id
    const partyId = await getPartyId(data.partyName)
    if (!partyId) {
      return { success: false, error: `Partido no encontrado: ${data.partyName}` }
    }

    const slug = createSlug(data.fullName)

    // Insertar
    await sql`
      INSERT INTO candidates (
        slug,
        full_name,
        cargo,
        party_id,
        is_active,
        data_source,
        data_verified,
        education_level
      ) VALUES (
        ${slug},
        ${data.fullName},
        'senador',
        ${partyId},
        true,
        'news_import',
        false,
        'Por verificar'
      )
    `

    return { success: true }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

async function main() {
  console.log('='.repeat(60))
  console.log('IMPORTACIÓN DE SENADORES - Elecciones 2026')
  console.log('='.repeat(60))
  console.log(`Total a importar: ${senadoresData.length}`)
  console.log()

  let inserted = 0
  let skipped = 0
  let errors: Array<{ name: string; error: string }> = []

  for (const senador of senadoresData) {
    const result = await insertSenador(senador)

    if (result.success) {
      inserted++
      console.log(`✓ ${senador.fullName}`)
    } else if (result.error === 'Ya existe') {
      skipped++
      console.log(`○ ${senador.fullName} (ya existe)`)
    } else {
      errors.push({ name: senador.fullName, error: result.error || 'Error desconocido' })
      console.log(`✗ ${senador.fullName}: ${result.error}`)
    }

    // Rate limit
    await new Promise(resolve => setTimeout(resolve, 50))
  }

  console.log()
  console.log('='.repeat(60))
  console.log('RESUMEN')
  console.log('='.repeat(60))
  console.log(`Insertados: ${inserted}`)
  console.log(`Omitidos (duplicados): ${skipped}`)
  console.log(`Errores: ${errors.length}`)

  if (errors.length > 0) {
    console.log()
    console.log('Errores detallados:')
    errors.forEach(e => console.log(`  - ${e.name}: ${e.error}`))
  }

  // Crear scores iniciales para los nuevos candidatos
  if (inserted > 0) {
    console.log()
    console.log('Creando scores iniciales...')
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
      )
      SELECT
        c.id,
        50, 50, 50, 30, 50, 50, 50
      FROM candidates c
      LEFT JOIN scores s ON c.id = s.candidate_id
      WHERE c.cargo = 'senador'
      AND c.is_active = true
      AND s.id IS NULL
      ON CONFLICT (candidate_id) DO NOTHING
    `
    console.log('✓ Scores creados')
  }

  // Mostrar conteo final
  const countResult = await sql`
    SELECT cargo, COUNT(*) as count
    FROM candidates
    WHERE is_active = true
    GROUP BY cargo
    ORDER BY cargo
  `

  console.log()
  console.log('Estado actual de la base de datos:')
  countResult.forEach(row => {
    console.log(`  ${row.cargo}: ${row.count}`)
  })
}

main().catch(console.error)
