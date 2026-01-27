/**
 * Procesa los datos capturados de la API del JNE
 * Lee jne-api-response.json y actualiza la base de datos
 */

import { neon } from '@neondatabase/serverless'
import * as fs from 'fs'

const sql = neon(process.env.DATABASE_URL || '')

const PHOTO_BASE = 'https://mpesije.jne.gob.pe/apidocs'

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
}

interface ProcessedCandidate {
  full_name: string
  party_name: string
  cargo: string
  photo_url: string
  dni: string
  birth_date: string | null
  gender: string
  position: number
}

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z\s]/g, '')
    .trim()
}

function nameMatch(jneName: string, dbName: string): boolean {
  const jne = normalizeName(jneName)
  const db = normalizeName(dbName)

  // Match exacto
  if (jne === db) return true

  // Match por apellidos
  const jneParts = jne.split(' ')
  const dbParts = db.split(' ')

  if (jneParts.length >= 2 && dbParts.length >= 2) {
    // JNE: APELLIDO1 APELLIDO2 NOMBRES
    // DB: puede ser NOMBRES APELLIDO1 APELLIDO2
    const jneApellidos = jneParts.slice(0, 2).sort().join('')
    const dbApellidos = dbParts.slice(-2).sort().join('')

    if (jneApellidos === dbApellidos) return true

    // También probar al revés
    const dbApellidos2 = dbParts.slice(0, 2).sort().join('')
    if (jneApellidos === dbApellidos2) return true
  }

  // Match parcial - al menos apellido paterno y primer nombre
  if (jneParts[0] && dbParts.some(p => p === jneParts[0])) {
    const jneFirstName = jneParts[jneParts.length - 1]
    if (dbParts.some(p => p.startsWith(jneFirstName?.substring(0, 4) || ''))) {
      return true
    }
  }

  return false
}

async function processData() {
  console.log('='.repeat(70))
  console.log('PROCESANDO DATOS CAPTURADOS DEL JNE')
  console.log('='.repeat(70))

  // Leer datos capturados
  const rawData = JSON.parse(fs.readFileSync('jne-api-response.json', 'utf-8'))
  const jneCandidates: JNECandidate[] = rawData.data || rawData

  console.log(`\nCandidatos en archivo JNE: ${jneCandidates.length}`)

  // Filtrar solo INSCRITOS y mapear
  const candidates: ProcessedCandidate[] = jneCandidates
    .filter(c => c.strEstadoCandidato === 'INSCRITO')
    .map(c => {
      const fullName = `${c.strApellidoPaterno} ${c.strApellidoMaterno} ${c.strNombres}`.trim()

      let cargo = 'presidente'
      if (c.strCargo.includes('PRIMER VICEPRESIDENTE') || c.strCargo.includes('SEGUNDO VICEPRESIDENTE')) {
        cargo = 'vicepresidente'
      } else if (c.strCargo.includes('SENADOR')) {
        cargo = 'senador'
      } else if (c.strCargo.includes('DIPUTADO')) {
        cargo = 'diputado'
      } else if (c.strCargo.includes('PARLAMENTO ANDINO')) {
        cargo = 'parlamento_andino'
      }

      return {
        full_name: fullName,
        party_name: c.strOrganizacionPolitica,
        cargo,
        photo_url: c.strGuidFoto ? `${PHOTO_BASE}/${c.strGuidFoto}.jpg` : '',
        dni: c.strDocumentoIdentidad,
        birth_date: c.strFechaNacimiento ? c.strFechaNacimiento.split(' ')[0] : null,
        gender: c.strSexo,
        position: c.intPosicion
      }
    })

  console.log(`Candidatos INSCRITOS: ${candidates.length}`)

  // Obtener candidatos de la base de datos
  const dbCandidates = await sql`
    SELECT id, full_name, photo_url, dni, party_id
    FROM candidates
    ORDER BY full_name
  `
  console.log(`Candidatos en BD: ${dbCandidates.length}`)

  // Actualizar candidatos existentes con fotos del JNE
  let updated = 0
  let notFound = 0
  let alreadyHasPhoto = 0

  console.log('\n─'.repeat(70))
  console.log('ACTUALIZANDO FOTOS Y DATOS')
  console.log('─'.repeat(70))

  for (const jne of candidates) {
    // Solo procesar presidentes y vicepresidentes por ahora
    if (jne.cargo !== 'presidente' && jne.cargo !== 'vicepresidente') continue

    // Buscar en BD
    const dbCandidate = dbCandidates.find(db => nameMatch(jne.full_name, db.full_name))

    if (dbCandidate) {
      // Verificar si ya tiene foto del JNE
      if (dbCandidate.photo_url?.includes('mpesije.jne.gob.pe')) {
        alreadyHasPhoto++
        continue
      }

      // Actualizar
      if (jne.photo_url) {
        await sql`
          UPDATE candidates SET
            photo_url = ${jne.photo_url},
            dni = COALESCE(${jne.dni}, dni),
            data_source = 'jne',
            last_updated = NOW()
          WHERE id = ${dbCandidate.id}::uuid
        `
        console.log(`✓ ${dbCandidate.full_name}`)
        console.log(`  JNE: ${jne.full_name}`)
        console.log(`  Foto: ${jne.photo_url}`)
        updated++
      }
    } else {
      notFound++
    }
  }

  console.log('\n─'.repeat(70))
  console.log('RESUMEN')
  console.log('─'.repeat(70))
  console.log(`Fotos actualizadas: ${updated}`)
  console.log(`Ya tenían foto JNE: ${alreadyHasPhoto}`)
  console.log(`No encontrados en BD: ${notFound}`)

  // Mostrar estadísticas por partido
  console.log('\n─'.repeat(70))
  console.log('CANDIDATOS POR PARTIDO (JNE)')
  console.log('─'.repeat(70))

  const byParty = candidates.reduce((acc, c) => {
    acc[c.party_name] = (acc[c.party_name] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  Object.entries(byParty)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .forEach(([party, count]) => {
      console.log(`  ${count.toString().padStart(3)} - ${party}`)
    })

  // Verificar fotos finales
  const photoStats = await sql`
    SELECT
      COUNT(*) FILTER (WHERE photo_url LIKE '%jne.gob.pe%') as jne,
      COUNT(*) FILTER (WHERE photo_url LIKE '%wikipedia%') as wiki,
      COUNT(*) FILTER (WHERE photo_url LIKE '%ui-avatars%') as avatar,
      COUNT(*) as total
    FROM candidates
  `

  console.log('\n─'.repeat(70))
  console.log('ESTADÍSTICAS DE FOTOS EN BD')
  console.log('─'.repeat(70))
  console.log(`  Fotos JNE: ${photoStats[0].jne}`)
  console.log(`  Fotos Wikipedia: ${photoStats[0].wiki}`)
  console.log(`  Avatares: ${photoStats[0].avatar}`)
  console.log(`  Total: ${photoStats[0].total}`)
}

processData().catch(console.error)
