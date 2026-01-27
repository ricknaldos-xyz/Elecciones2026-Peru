/**
 * Actualiza la base de datos con las rutas locales de los PDFs de planes de gobierno
 * Usa planes-download-results.json para mapear candidato/partido -> ruta local
 */

import * as fs from 'fs'
import * as path from 'path'
import { neon } from '@neondatabase/serverless'

function loadEnv(): string {
  const envPath = path.join(process.cwd(), '.env.local')
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8')
    const match = content.match(/DATABASE_URL=["']?([^"'\n]+)["']?/)
    if (match) return match[1]
  }
  return ''
}

const sql = neon(loadEnv())

interface DownloadResult {
  candidato: string
  partido: string
  url: string
  localPath: string
  status: 'downloaded' | 'skipped' | 'failed'
  size?: number
  error?: string
}

function normalize(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
}

function getLastName(fullName: string): string {
  // Get first word (usually last name in UPPERCASE format)
  const parts = fullName.split(' ')
  return parts[0].toLowerCase()
}

async function main() {
  console.log('='.repeat(70))
  console.log('ACTUALIZANDO RUTAS DE PDFs LOCALES')
  console.log('='.repeat(70))

  // Add column if not exists
  console.log('\n1. Verificando columna plan_pdf_local...')
  await sql`ALTER TABLE candidates ADD COLUMN IF NOT EXISTS plan_pdf_local TEXT`
  console.log('   OK')

  // Read download results
  const resultsPath = path.join(process.cwd(), 'planes-download-results.json')
  if (!fs.existsSync(resultsPath)) {
    console.error('No se encontro planes-download-results.json')
    console.log('Ejecuta primero: npx tsx scripts/download-planes-gobierno.ts')
    process.exit(1)
  }

  const results: DownloadResult[] = JSON.parse(fs.readFileSync(resultsPath, 'utf-8'))
  const successfulDownloads = results.filter(r => r.status === 'downloaded' || r.status === 'skipped')

  console.log(`\n2. PDFs disponibles: ${successfulDownloads.length}`)

  // Get all presidential candidates with their party names
  const candidates = await sql`
    SELECT c.id, c.full_name, c.slug, p.name as party_name
    FROM candidates c
    LEFT JOIN parties p ON c.party_id = p.id
    WHERE c.cargo = 'presidente'
    ORDER BY c.full_name
  `

  console.log(`   Candidatos presidenciales: ${candidates.length}`)

  // Create mappings
  const candidateToPath = new Map<string, string>()
  const partyToPath = new Map<string, string>()

  for (const result of successfulDownloads) {
    // Map by candidate last name
    const lastName = getLastName(result.candidato)
    candidateToPath.set(lastName, result.localPath)

    // Map by party name (normalized)
    const normalizedParty = normalize(result.partido)
    partyToPath.set(normalizedParty, result.localPath)

    // Also map first words of party
    const partyWords = normalizedParty.split(' ')
    if (partyWords.length >= 2) {
      partyToPath.set(partyWords.slice(0, 2).join(' '), result.localPath)
    }
  }

  // Manual mappings for known candidates
  const manualMappings: Record<string, string> = {
    // By slug -> localPath
    'keiko-fujimori': '/planes/fuerza-popular.pdf',
    'cesar-acuna': '/planes/alianza-para-el-progreso.pdf',
    'rafael-lopez-aliaga': '/planes/renovacion-popular.pdf',
    'george-forsyth': '/planes/partido-democratico-somos-peru.pdf',
    'jose-luna': '/planes/podemos-peru.pdf',
    'yonhy-lescano': '/planes/partido-politico-cooperacion-popular.pdf',
    'hernando-de-soto': '/planes/avanza-pais-partido-de-integracion-social.pdf',
    'jose-williams': '/planes/avanza-pais-partido-de-integracion-social.pdf',
    'martin-vizcarra': '/planes/partido-politico-peru-primero.pdf',
    'roberto-chiabra': '/planes/unidad-nacional.pdf',
    'alex-gonzales': '/planes/partido-democrata-verde.pdf',
    'alfonso-lopez-chau': '/planes/ahora-nacion-an.pdf',
    'antonio-ortiz': '/planes/salvemos-al-peru.pdf',
    'armando-masse': '/planes/partido-democratico-federal.pdf',
  }

  console.log('\n3. Actualizando candidatos...')

  let updated = 0
  let notFound = 0

  for (const candidate of candidates) {
    const slug = candidate.slug as string
    const fullName = candidate.full_name as string
    const partyName = (candidate.party_name as string) || ''

    let localPath: string | undefined

    // 1. Try manual mapping first
    localPath = manualMappings[slug]

    // 2. Try by candidate last name
    if (!localPath) {
      const lastName = getLastName(fullName)
      localPath = candidateToPath.get(lastName)
    }

    // 3. Try by party name
    if (!localPath && partyName) {
      const normalizedParty = normalize(partyName)
      localPath = partyToPath.get(normalizedParty)

      // Try partial match
      if (!localPath) {
        for (const [key, value] of partyToPath) {
          if (normalizedParty.includes(key) || key.includes(normalizedParty)) {
            localPath = value
            break
          }
        }
      }
    }

    if (localPath) {
      // Verify file exists
      const fullPath = path.join(process.cwd(), 'public', localPath)
      if (fs.existsSync(fullPath)) {
        await sql`
          UPDATE candidates
          SET plan_pdf_local = ${localPath}
          WHERE id = ${candidate.id}
        `
        console.log(`   [OK] ${fullName} -> ${localPath}`)
        updated++
      } else {
        console.log(`   [!] ${fullName} - archivo no existe: ${localPath}`)
        notFound++
      }
    } else {
      console.log(`   [?] ${fullName} (${partyName || 'sin partido'}) - sin mapeo`)
      notFound++
    }
  }

  console.log('\n' + '='.repeat(70))
  console.log('RESUMEN')
  console.log('='.repeat(70))
  console.log(`Actualizados: ${updated}`)
  console.log(`Sin mapeo: ${notFound}`)

  // Verify results
  const withPdf = await sql`
    SELECT full_name, plan_pdf_local
    FROM candidates
    WHERE cargo = 'presidente' AND plan_pdf_local IS NOT NULL
    ORDER BY full_name
  `

  console.log(`\nCandidatos con PDF local: ${withPdf.length}`)
}

main().catch(console.error)
