/**
 * Script para actualizar fotos de candidatos con las fotos oficiales del JNE
 * Lee el archivo voto-informado-candidates.json y actualiza la base de datos
 */

import { neon } from '@neondatabase/serverless'
import * as fs from 'fs'

const sql = neon(process.env.DATABASE_URL || '')

interface JNECandidate {
  full_name: string
  party_name: string
  cargo: string
  photo_url?: string
}

// Normalizar nombre para comparación
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s]/g, '') // Remove special chars
    .replace(/\s+/g, ' ')
    .trim()
}

// Verificar si dos nombres son similares
function nameMatch(name1: string, name2: string): boolean {
  const n1 = normalizeName(name1)
  const n2 = normalizeName(name2)

  // Match exacto
  if (n1 === n2) return true

  // Un nombre contiene al otro
  if (n1.includes(n2) || n2.includes(n1)) return true

  // Match por apellidos (primeras dos palabras de cada nombre)
  const parts1 = n1.split(' ')
  const parts2 = n2.split(' ')

  // Comparar apellidos (asumiendo formato APELLIDO1 APELLIDO2 NOMBRES)
  if (parts1.length >= 2 && parts2.length >= 2) {
    if (parts1[0] === parts2[0] && parts1[1] === parts2[1]) return true
  }

  // Comparar si los apellidos coinciden en cualquier orden
  const surnames1 = parts1.slice(0, 2).sort().join(' ')
  const surnames2 = parts2.slice(0, 2).sort().join(' ')
  if (surnames1 === surnames2) return true

  return false
}

async function updatePhotos() {
  console.log('=== ACTUALIZANDO FOTOS CON DATOS DEL JNE ===\n')

  // Leer datos del JNE
  const jneData: JNECandidate[] = JSON.parse(
    fs.readFileSync('voto-informado-candidates.json', 'utf-8')
  )
  console.log(`Candidatos JNE cargados: ${jneData.length}`)

  // Obtener candidatos de la base de datos
  const dbCandidates = await sql`
    SELECT id, full_name, photo_url
    FROM candidates
    ORDER BY full_name
  `
  console.log(`Candidatos en BD: ${dbCandidates.length}\n`)

  let updated = 0
  let notFound = 0
  let alreadyHasJNE = 0

  for (const jneCandidate of jneData) {
    if (!jneCandidate.photo_url) continue

    // Buscar candidato en BD
    const dbCandidate = dbCandidates.find(db =>
      nameMatch(db.full_name, jneCandidate.full_name)
    )

    if (dbCandidate) {
      // Verificar si ya tiene foto del JNE
      if (dbCandidate.photo_url?.includes('mpesije.jne.gob.pe') ||
          dbCandidate.photo_url?.includes('votoinformado.jne.gob.pe')) {
        alreadyHasJNE++
        continue
      }

      // Actualizar foto
      await sql`
        UPDATE candidates
        SET photo_url = ${jneCandidate.photo_url},
            data_source = 'jne',
            last_updated = NOW()
        WHERE id = ${dbCandidate.id}::uuid
      `

      console.log(`✓ ${dbCandidate.full_name}`)
      console.log(`  JNE: ${jneCandidate.full_name}`)
      console.log(`  Foto: ${jneCandidate.photo_url.substring(0, 60)}...`)
      updated++
    } else {
      console.log(`✗ No encontrado: ${jneCandidate.full_name}`)
      notFound++
    }
  }

  console.log('\n=== RESUMEN ===')
  console.log(`Fotos actualizadas: ${updated}`)
  console.log(`Ya tenían foto JNE: ${alreadyHasJNE}`)
  console.log(`No encontrados: ${notFound}`)

  // Mostrar candidatos sin match para debug
  if (notFound > 0) {
    console.log('\n=== CANDIDATOS JNE SIN MATCH ===')
    for (const jneCandidate of jneData) {
      const dbCandidate = dbCandidates.find(db =>
        nameMatch(db.full_name, jneCandidate.full_name)
      )
      if (!dbCandidate) {
        console.log(`  - ${jneCandidate.full_name}`)
      }
    }
  }
}

updatePhotos().catch(console.error)
