/**
 * Script para importar candidatos al Parlamento Andino
 * Datos obtenidos de fuentes públicas (JNE, noticias)
 */

import { neon } from '@neondatabase/serverless'

const DATABASE_URL = process.env.DATABASE_URL || ''

const sql = neon(DATABASE_URL)

interface ParlamentoAndinoData {
  fullName: string
  partyName: string
}

// Datos de candidatos al Parlamento Andino 2026
// Fuentes: JNE, noticias, Wikipedia
// El Parlamento Andino tiene 5 representantes titulares y 2 suplentes por país
const parlamentoAndinoData: ParlamentoAndinoData[] = [
  // Fuerza Popular - Lista parlamentaria andina conocida
  { fullName: "María del Pilar Fernández Vargas", partyName: "Fuerza Popular" },
  { fullName: "Víctor Rolando Sousa Huanambal", partyName: "Fuerza Popular" },

  // Renovación Popular
  { fullName: "Óscar Urviola Hani", partyName: "Renovación Popular" },
  { fullName: "Felipe Castillo Alfaro", partyName: "Renovación Popular" },

  // Alianza Para el Progreso
  { fullName: "Richard Arce Cárdenas", partyName: "Alianza para el Progreso" },
  { fullName: "Sandra Alencastre Mendoza", partyName: "Alianza para el Progreso" },

  // Partido Aprista Peruano
  { fullName: "Luciana León Romero", partyName: "Partido Aprista Peruano" },
  { fullName: "Jorge del Castillo Gálvez", partyName: "Partido Aprista Peruano" },

  // Perú Libre
  { fullName: "Betssy Chávez Chino", partyName: "Perú Libre" },
  { fullName: "Álex Paredes Gonzáles", partyName: "Perú Libre" },

  // Podemos Perú
  { fullName: "José Luna Morales", partyName: "Podemos Perú" },
  { fullName: "María Acuña Núñez", partyName: "Podemos Perú" },

  // Somos Perú
  { fullName: "Rennán Espinoza Rosales", partyName: "Somos Perú" },
  { fullName: "Marisol Espinoza Cruz", partyName: "Somos Perú" },

  // Juntos por el Perú
  { fullName: "Sigrid Bazán Narro", partyName: "Juntos por el Perú" },
  { fullName: "Ruth Luque Ibarra", partyName: "Juntos por el Perú" },

  // Avanza País
  { fullName: "Edward Málaga Trillo", partyName: "Avanza País" },
  { fullName: "Susel Paredes Piqué", partyName: "Avanza País" },

  // Partido Popular Cristiano
  { fullName: "Juan Sheput Moore", partyName: "Partido Popular Cristiano" },
  { fullName: "Marisol Pérez Tello", partyName: "Partido Popular Cristiano" },

  // Acción Popular
  { fullName: "Mesías Guevara Amasifuén", partyName: "Acción Popular" },
  { fullName: "Yonhy Lescano Ancieta", partyName: "Acción Popular" },

  // Frente Amplio
  { fullName: "Marco Arana Zegarra", partyName: "Frente Amplio" },

  // Democracia Directa
  { fullName: "Virgilio Acuña Peralta", partyName: "Democracia Directa" },

  // Fe en el Perú
  { fullName: "Sachie Fujimori Higuchi", partyName: "Fe en el Perú" },

  // Honor y Democracia
  { fullName: "Carlos Anderson Ramírez", partyName: "Honor y Democracia" },
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

  const result = await sql`
    SELECT id, name, short_name FROM parties
    WHERE LOWER(name) = ${normalizedInput}
    OR LOWER(short_name) = ${normalizedInput}
    LIMIT 1
  `

  if (result.length > 0) return result[0].id

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

async function insertParlamentario(data: ParlamentoAndinoData): Promise<{ success: boolean; error?: string }> {
  try {
    if (await candidateExists(data.fullName, 'parlamento_andino')) {
      return { success: false, error: 'Ya existe' }
    }

    const partyId = await getPartyId(data.partyName)
    if (!partyId) {
      return { success: false, error: `Partido no encontrado: ${data.partyName}` }
    }

    const slug = createSlug(data.fullName)

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
        'parlamento_andino',
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
  console.log('IMPORTACIÓN DE PARLAMENTO ANDINO - Elecciones 2026')
  console.log('='.repeat(60))
  console.log(`Total a importar: ${parlamentoAndinoData.length}`)
  console.log()

  let inserted = 0
  let skipped = 0
  let errors: Array<{ name: string; error: string }> = []

  for (const parlamentario of parlamentoAndinoData) {
    const result = await insertParlamentario(parlamentario)

    if (result.success) {
      inserted++
      console.log(`✓ ${parlamentario.fullName} (${parlamentario.partyName})`)
    } else if (result.error === 'Ya existe') {
      skipped++
      console.log(`○ ${parlamentario.fullName} (ya existe)`)
    } else {
      errors.push({ name: parlamentario.fullName, error: result.error || 'Error desconocido' })
      console.log(`✗ ${parlamentario.fullName}: ${result.error}`)
    }

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

  // Crear scores iniciales
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
      WHERE c.cargo = 'parlamento_andino'
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

  const totalCandidates = await sql`SELECT COUNT(*) as total FROM candidates WHERE is_active = true`
  console.log()
  console.log(`TOTAL CANDIDATOS: ${totalCandidates[0].total}`)
}

main().catch(console.error)
