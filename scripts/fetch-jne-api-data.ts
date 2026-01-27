/**
 * Script para obtener datos completos desde la API del JNE
 * Usa el endpoint descubierto: sije.jne.gob.pe/ServiciosWeb/WSCandidato
 *
 * Extrae:
 * - Lista de candidatos (presidente, senadores, diputados, parlamento andino)
 * - Detalles de cada candidato (educación, experiencia, sentencias)
 * - Planes de gobierno (URLs de PDFs)
 */

import { neon } from '@neondatabase/serverless'
import * as fs from 'fs'
import * as path from 'path'

function loadEnv(): string {
  const envPath = path.join(process.cwd(), '.env.local')
  const content = fs.readFileSync(envPath, 'utf-8')
  const match = content.match(/DATABASE_URL=["']?([^"'\n]+)["']?/)
  return match ? match[1] : ''
}

const sql = neon(loadEnv())

// API del JNE descubierta
const JNE_API_BASE = 'https://sije.jne.gob.pe/ServiciosWeb/WSCandidato'
const PHOTO_BASE = 'https://mpesije.jne.gob.pe/apidocs'
const DELAY_MS = 1000

// Tipos de elección
const ELECTION_TYPES = [
  { id: 1, name: 'PRESIDENCIAL', cargo: 'presidente' },
  { id: 2, name: 'SENADORES', cargo: 'senador' },
  { id: 3, name: 'DIPUTADOS', cargo: 'diputado' },
  { id: 4, name: 'PARLAMENTO ANDINO', cargo: 'parlamento_andino' },
]

interface JNECandidate {
  strEstadoCandidato: string
  strGuidFoto: string
  strOrganizacionPolitica: string
  strDocumentoIdentidad: string
  strNombres: string
  strApellidoPaterno: string
  strApellidoMaterno: string
  strCargo: string
  strFechaNacimiento: string
  strSexo: string
  strDepartamento: string
  idOrganizacionPolitica: number
  intPosicion: number
  idCargo: number
  idTipoEleccion: number
}

interface CandidateData {
  full_name: string
  first_name: string
  paternal_surname: string
  maternal_surname: string
  party_name: string
  party_id?: number
  cargo: string
  cargo_jne: string
  position_number: number
  photo_url: string
  dni: string
  birth_date?: string
  gender?: string
  department?: string
  status: string

  // Detalles adicionales
  education_details?: any[]
  experience_details?: any[]
  political_trajectory?: any[]
  penal_sentences?: any[]
  civil_sentences?: any[]
  assets_declaration?: any
  party_resignations?: number
  plan_gobierno_url?: string
  hoja_vida_url?: string
}

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function fetchJNECandidates(tipoEleccion: number): Promise<JNECandidate[]> {
  try {
    const response = await fetch(`${JNE_API_BASE}/ListaCandidatos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Origin': 'https://votoinformado.jne.gob.pe',
        'Referer': 'https://votoinformado.jne.gob.pe/'
      },
      body: JSON.stringify({
        idProcesoElectoral: 124, // Elecciones Generales 2026
        idTipoEleccion: tipoEleccion,
        strUbigeo: "000000",
        idOrganizacionPolitica: 0,
        strNombre: ""
      })
    })

    if (!response.ok) {
      console.log(`  Error HTTP ${response.status}`)
      return []
    }

    const data = await response.json()
    return data.data || []
  } catch (error) {
    console.error(`  Error fetching:`, error)
    return []
  }
}

async function fetchCandidateDetails(dni: string): Promise<any> {
  try {
    // Intentar obtener detalles del candidato
    const endpoints = [
      `${JNE_API_BASE}/DetalleCandidato`,
      `${JNE_API_BASE}/HojaVida`,
      `${JNE_API_BASE}/DatosPersonales`,
    ]

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Origin': 'https://votoinformado.jne.gob.pe'
          },
          body: JSON.stringify({
            strDocumentoIdentidad: dni,
            idProcesoElectoral: 124
          })
        })

        if (response.ok) {
          const data = await response.json()
          if (data && Object.keys(data).length > 0) {
            return data
          }
        }
      } catch (e) {
        // Continuar con siguiente endpoint
      }
    }

    return null
  } catch (error) {
    return null
  }
}

async function processCandidates(): Promise<CandidateData[]> {
  const allCandidates: CandidateData[] = []

  console.log('='.repeat(70))
  console.log('OBTENIENDO DATOS DE LA API DEL JNE')
  console.log('='.repeat(70))

  for (const electionType of ELECTION_TYPES) {
    console.log(`\n${'─'.repeat(60)}`)
    console.log(`Obteniendo: ${electionType.name}`)
    console.log('─'.repeat(60))

    const jneCandidates = await fetchJNECandidates(electionType.id)
    console.log(`Candidatos encontrados: ${jneCandidates.length}`)

    for (const jne of jneCandidates) {
      // Filtrar solo candidatos INSCRITOS
      if (jne.strEstadoCandidato !== 'INSCRITO') continue

      const fullName = `${jne.strApellidoPaterno} ${jne.strApellidoMaterno} ${jne.strNombres}`.trim()
      const photoUrl = jne.strGuidFoto ? `${PHOTO_BASE}/${jne.strGuidFoto}.jpg` : ''

      // Determinar cargo específico
      let cargo = electionType.cargo
      if (jne.strCargo.includes('PRIMER VICEPRESIDENTE')) {
        cargo = 'vicepresidente'
      } else if (jne.strCargo.includes('SEGUNDO VICEPRESIDENTE')) {
        cargo = 'vicepresidente'
      } else if (jne.strCargo.includes('PRESIDENTE')) {
        cargo = 'presidente'
      }

      const candidate: CandidateData = {
        full_name: fullName,
        first_name: jne.strNombres,
        paternal_surname: jne.strApellidoPaterno,
        maternal_surname: jne.strApellidoMaterno,
        party_name: jne.strOrganizacionPolitica,
        party_id: jne.idOrganizacionPolitica,
        cargo: cargo,
        cargo_jne: jne.strCargo,
        position_number: jne.intPosicion,
        photo_url: photoUrl,
        dni: jne.strDocumentoIdentidad,
        birth_date: jne.strFechaNacimiento,
        gender: jne.strSexo,
        department: jne.strDepartamento,
        status: jne.strEstadoCandidato
      }

      // Evitar duplicados
      if (!allCandidates.find(c => c.dni === candidate.dni)) {
        allCandidates.push(candidate)
      }
    }

    console.log(`Procesados: ${allCandidates.filter(c => c.cargo === electionType.cargo ||
      (electionType.cargo === 'presidente' && c.cargo === 'vicepresidente')).length}`)

    await delay(DELAY_MS)
  }

  return allCandidates
}

async function saveToDatabase(candidates: CandidateData[]): Promise<void> {
  console.log(`\n${'='.repeat(70)}`)
  console.log('GUARDANDO EN BASE DE DATOS')
  console.log('='.repeat(70))

  // Primero, crear/actualizar partidos
  const parties = new Map<string, string>()

  for (const c of candidates) {
    if (!c.party_name || parties.has(c.party_name)) continue

    try {
      const existing = await sql`
        SELECT id FROM parties WHERE LOWER(name) = LOWER(${c.party_name}) LIMIT 1
      `

      if (existing.length > 0) {
        parties.set(c.party_name, existing[0].id)
      } else {
        const created = await sql`
          INSERT INTO parties (name, short_name)
          VALUES (${c.party_name}, ${c.party_name.substring(0, 20)})
          RETURNING id
        `
        parties.set(c.party_name, created[0].id)
        console.log(`+ Partido creado: ${c.party_name}`)
      }
    } catch (e) {
      // Ignorar errores de partidos duplicados
    }
  }

  // Ahora guardar candidatos
  let created = 0
  let updated = 0
  let errors = 0

  for (const c of candidates) {
    try {
      const partyId = parties.get(c.party_name) || null

      // Generar slug
      const slug = c.full_name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')

      // Buscar existente por DNI o nombre
      const existing = await sql`
        SELECT id FROM candidates
        WHERE dni = ${c.dni}
        OR LOWER(full_name) LIKE ${`%${c.paternal_surname.toLowerCase()}%`}
        AND LOWER(full_name) LIKE ${`%${c.first_name.toLowerCase().split(' ')[0]}%`}
        LIMIT 1
      `

      if (existing.length > 0) {
        // Actualizar
        await sql`
          UPDATE candidates SET
            photo_url = COALESCE(${c.photo_url || null}, photo_url),
            party_id = COALESCE(${partyId}::uuid, party_id),
            dni = COALESCE(${c.dni}, dni),
            birth_date = ${c.birth_date ? new Date(c.birth_date) : null},
            cargo = ${c.cargo},
            data_source = 'jne',
            is_active = true,
            last_updated = NOW()
          WHERE id = ${existing[0].id}::uuid
        `
        updated++
      } else {
        // Crear nuevo
        await sql`
          INSERT INTO candidates (
            full_name, slug, cargo, party_id, photo_url, dni, birth_date,
            is_active, data_source, last_updated
          ) VALUES (
            ${c.full_name},
            ${slug},
            ${c.cargo},
            ${partyId}::uuid,
            ${c.photo_url || null},
            ${c.dni},
            ${c.birth_date ? new Date(c.birth_date) : null},
            true,
            'jne',
            NOW()
          )
          ON CONFLICT (slug) DO UPDATE SET
            photo_url = COALESCE(EXCLUDED.photo_url, candidates.photo_url),
            dni = COALESCE(EXCLUDED.dni, candidates.dni),
            party_id = COALESCE(EXCLUDED.party_id, candidates.party_id),
            last_updated = NOW()
        `
        created++
      }
    } catch (error) {
      console.error(`Error con ${c.full_name}:`, error)
      errors++
    }
  }

  console.log(`\nResultados:`)
  console.log(`  Creados: ${created}`)
  console.log(`  Actualizados: ${updated}`)
  console.log(`  Errores: ${errors}`)
}

async function main() {
  console.log('╔' + '═'.repeat(68) + '╗')
  console.log('║' + ' EXTRACTOR DE DATOS JNE - API DIRECTA '.padStart(44).padEnd(68) + '║')
  console.log('╚' + '═'.repeat(68) + '╝')

  try {
    // Obtener candidatos de la API
    const candidates = await processCandidates()

    console.log(`\n${'='.repeat(70)}`)
    console.log('RESUMEN')
    console.log('='.repeat(70))
    console.log(`Total candidatos: ${candidates.length}`)

    // Estadísticas por cargo
    const byCargo = candidates.reduce((acc, c) => {
      acc[c.cargo] = (acc[c.cargo] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    for (const [cargo, count] of Object.entries(byCargo)) {
      console.log(`  ${cargo}: ${count}`)
    }

    // Guardar JSON
    fs.writeFileSync('jne-all-candidates.json', JSON.stringify(candidates, null, 2))
    console.log('\nDatos guardados en: jne-all-candidates.json')

    // Guardar en base de datos
    await saveToDatabase(candidates)

    // Mostrar algunos ejemplos
    console.log('\n─'.repeat(70))
    console.log('EJEMPLOS DE CANDIDATOS:')
    console.log('─'.repeat(70))

    candidates
      .filter(c => c.cargo === 'presidente')
      .slice(0, 10)
      .forEach((c, i) => {
        console.log(`${i + 1}. ${c.full_name}`)
        console.log(`   Partido: ${c.party_name}`)
        console.log(`   Foto: ${c.photo_url.substring(0, 60)}...`)
      })

  } catch (error) {
    console.error('Error general:', error)
  }
}

main().catch(console.error)
