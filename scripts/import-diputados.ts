/**
 * Script para importar candidatos a la Cámara de Diputados
 * Datos obtenidos de fuentes públicas (JNE, noticias, ONPE)
 */

import { neon } from '@neondatabase/serverless'

const DATABASE_URL = process.env.DATABASE_URL || ''

const sql = neon(DATABASE_URL)

interface DiputadoData {
  fullName: string
  partyName: string
  districtName: string
}

// Datos de candidatos a Diputados 2026
// Fuentes: Infobae, El Comercio, Correo, RPP
const diputadosData: DiputadoData[] = [
  // === LIMA METROPOLITANA ===
  // APRA
  { fullName: "Mauricio Mulder Bedoya", partyName: "Partido Aprista Peruano", districtName: "Lima" },
  { fullName: "Valeria Mezarina Avia", partyName: "Partido Aprista Peruano", districtName: "Lima" },
  { fullName: "Julio Loayza Cavero", partyName: "Partido Aprista Peruano", districtName: "Lima" },
  { fullName: "Nidia Vílchez Yucra", partyName: "Partido Aprista Peruano", districtName: "Lima" },
  { fullName: "Renán Núñez Pérez", partyName: "Partido Aprista Peruano", districtName: "Lima" },
  { fullName: "Enrique Valderrama Peña", partyName: "Partido Aprista Peruano", districtName: "Lima" },
  { fullName: "Werner Quezada Martínez", partyName: "Partido Aprista Peruano", districtName: "Lima" },

  // Fuerza Popular - Lima
  { fullName: "Rosselli Amuruz Dulanto", partyName: "Fuerza Popular", districtName: "Lima" },
  { fullName: "Patricia Juárez Gallegos", partyName: "Fuerza Popular", districtName: "Lima" },
  { fullName: "Alejandro Soto Reyes", partyName: "Fuerza Popular", districtName: "Lima" },

  // Renovación Popular - Lima
  { fullName: "Jorge Montoya Manrique", partyName: "Renovación Popular", districtName: "Lima" },
  { fullName: "Adriana Tudela Gutiérrez", partyName: "Renovación Popular", districtName: "Lima" },
  { fullName: "Norma Yarrow Lumbreras", partyName: "Renovación Popular", districtName: "Lima" },

  // Alianza Para el Progreso - Lima
  { fullName: "Héctor Acuña Peralta", partyName: "Alianza para el Progreso", districtName: "Lima" },
  { fullName: "Lady Camones Soriano", partyName: "Alianza para el Progreso", districtName: "Lima" },

  // Avanza País - Lima
  { fullName: "Diego Bazán Calderón", partyName: "Avanza País", districtName: "Lima" },
  { fullName: "Alejandro Cavero Alva", partyName: "Avanza País", districtName: "Lima" },

  // === AREQUIPA ===
  // Fuerza Popular
  { fullName: "Carlos Raúl Paredes Paredes", partyName: "Fuerza Popular", districtName: "Arequipa" },

  // Renovación Popular
  { fullName: "Esdras Ricardo Medina Minaya", partyName: "Renovación Popular", districtName: "Arequipa" },

  // Alianza Para el Progreso
  { fullName: "José Antonio Supo Condori", partyName: "Alianza para el Progreso", districtName: "Arequipa" },
  { fullName: "Adolfo Donayre Pinedo", partyName: "Alianza para el Progreso", districtName: "Arequipa" },

  // Partido Aprista Peruano
  { fullName: "Daniel Ernesto Vera Ballón", partyName: "Partido Aprista Peruano", districtName: "Arequipa" },
  { fullName: "Mercedes Núñez Gutiérrez", partyName: "Partido Aprista Peruano", districtName: "Arequipa" },

  // Perú Primero
  { fullName: "Rolando Bedregal Sanz", partyName: "Perú Primero", districtName: "Arequipa" },
  { fullName: "Susana Condori Huamaní", partyName: "Perú Primero", districtName: "Arequipa" },

  // Venceremos
  { fullName: "Juan Miguel Meza Igme", partyName: "Venceremos", districtName: "Arequipa" },

  // Juntos por el Perú
  { fullName: "Andrés Antacalla Ginez", partyName: "Juntos por el Perú", districtName: "Arequipa" },
  { fullName: "Luisa Velarde Álvarez", partyName: "Juntos por el Perú", districtName: "Arequipa" },

  // === LA LIBERTAD ===
  { fullName: "Manuel García Correa", partyName: "Alianza para el Progreso", districtName: "La Libertad" },
  { fullName: "Kira Alcarraz Aguirre", partyName: "Alianza para el Progreso", districtName: "La Libertad" },
  { fullName: "Heidy Juárez Calle", partyName: "Fuerza Popular", districtName: "La Libertad" },

  // === PIURA ===
  { fullName: "Eduardo Castillo Gálvez", partyName: "Fuerza Popular", districtName: "Piura" },
  { fullName: "Wilmar Elera García", partyName: "Somos Perú", districtName: "Piura" },

  // === LAMBAYEQUE ===
  { fullName: "Arturo Fernández Bazán", partyName: "Renovación Popular", districtName: "Lambayeque" },

  // === CUSCO ===
  { fullName: "Américo Gonza Castillo", partyName: "Juntos por el Perú", districtName: "Cusco" },

  // === JUNÍN ===
  { fullName: "María Bartolo Romero", partyName: "Perú Libre", districtName: "Junín" },
  { fullName: "Guido Bellido Ugarte", partyName: "Podemos Perú", districtName: "Junín" },

  // === ÁNCASH ===
  { fullName: "Porfirio Buitrón Espinoza", partyName: "Partido Aprista Peruano", districtName: "Áncash" },
  { fullName: "Carlos Zeballos Gutiérrez", partyName: "Fuerza Popular", districtName: "Áncash" },

  // === ICA ===
  { fullName: "Belén García Mendoza", partyName: "Partido Aprista Peruano", districtName: "Ica" },

  // === CALLAO ===
  { fullName: "Milagros Morales Yauri", partyName: "Partido Aprista Peruano", districtName: "Callao" },
  { fullName: "José Luna Gálvez", partyName: "Podemos Perú", districtName: "Callao" },

  // === PUNO ===
  { fullName: "Flavio Cruz Mamani", partyName: "Perú Libre", districtName: "Puno" },

  // === LORETO ===
  { fullName: "Jorge Flores Ancachi", partyName: "Alianza para el Progreso", districtName: "Loreto" },

  // === CAJAMARCA ===
  { fullName: "Hilda Guevara Saldaña", partyName: "Renovación Popular", districtName: "Cajamarca" },

  // === EXTRANJERO ===
  { fullName: "Julio César Herrera Gonzáles", partyName: "Partido Aprista Peruano", districtName: "Extranjero" },
  { fullName: "Rocío Rincón Campos", partyName: "Partido Aprista Peruano", districtName: "Extranjero" },
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

async function getDistrictId(districtName: string): Promise<string | null> {
  const normalizedInput = districtName.toLowerCase().trim()

  const result = await sql`
    SELECT id FROM districts
    WHERE LOWER(name) = ${normalizedInput}
    OR slug = ${normalizedInput}
    LIMIT 1
  `

  if (result.length > 0) return result[0].id

  // Try partial match
  const partialResult = await sql`
    SELECT id FROM districts
    WHERE LOWER(name) LIKE ${'%' + normalizedInput + '%'}
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

async function insertDiputado(data: DiputadoData): Promise<{ success: boolean; error?: string }> {
  try {
    if (await candidateExists(data.fullName, 'diputado')) {
      return { success: false, error: 'Ya existe' }
    }

    const partyId = await getPartyId(data.partyName)
    if (!partyId) {
      return { success: false, error: `Partido no encontrado: ${data.partyName}` }
    }

    const districtId = await getDistrictId(data.districtName)
    if (!districtId) {
      return { success: false, error: `Distrito no encontrado: ${data.districtName}` }
    }

    const slug = createSlug(data.fullName)

    await sql`
      INSERT INTO candidates (
        slug,
        full_name,
        cargo,
        party_id,
        district_id,
        is_active,
        data_source,
        data_verified,
        education_level
      ) VALUES (
        ${slug},
        ${data.fullName},
        'diputado',
        ${partyId},
        ${districtId},
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
  console.log('IMPORTACIÓN DE DIPUTADOS - Elecciones 2026')
  console.log('='.repeat(60))
  console.log(`Total a importar: ${diputadosData.length}`)
  console.log()

  // Verificar partidos faltantes primero
  const missingParties = new Set<string>()
  for (const d of diputadosData) {
    const partyId = await getPartyId(d.partyName)
    if (!partyId) missingParties.add(d.partyName)
  }

  if (missingParties.size > 0) {
    console.log('Partidos faltantes - agregando:')
    for (const partyName of missingParties) {
      const existing = await sql`SELECT id FROM parties WHERE name = ${partyName}`
      if (existing.length === 0) {
        const shortName = partyName.split(' ').map(w => w[0]).join('')
        await sql`INSERT INTO parties (name, short_name) VALUES (${partyName}, ${shortName})`
        console.log(`  ✓ ${partyName}`)
      }
    }
    console.log()
  }

  let inserted = 0
  let skipped = 0
  let errors: Array<{ name: string; error: string }> = []

  // Agrupar por distrito para mejor visualización
  const byDistrict: Record<string, DiputadoData[]> = {}
  for (const d of diputadosData) {
    if (!byDistrict[d.districtName]) byDistrict[d.districtName] = []
    byDistrict[d.districtName].push(d)
  }

  for (const [district, candidates] of Object.entries(byDistrict)) {
    console.log(`\n--- ${district} ---`)
    for (const diputado of candidates) {
      const result = await insertDiputado(diputado)

      if (result.success) {
        inserted++
        console.log(`✓ ${diputado.fullName} (${diputado.partyName})`)
      } else if (result.error === 'Ya existe') {
        skipped++
        console.log(`○ ${diputado.fullName} (ya existe)`)
      } else {
        errors.push({ name: diputado.fullName, error: result.error || 'Error desconocido' })
        console.log(`✗ ${diputado.fullName}: ${result.error}`)
      }

      await new Promise(resolve => setTimeout(resolve, 50))
    }
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
      WHERE c.cargo = 'diputado'
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

  // Mostrar diputados por distrito
  const byDistrictCount = await sql`
    SELECT d.name as district, COUNT(*) as count
    FROM candidates c
    JOIN districts d ON c.district_id = d.id
    WHERE c.cargo = 'diputado' AND c.is_active = true
    GROUP BY d.name
    ORDER BY count DESC
  `

  console.log()
  console.log('Diputados por distrito:')
  byDistrictCount.forEach(row => {
    console.log(`  ${row.district}: ${row.count}`)
  })
}

main().catch(console.error)
