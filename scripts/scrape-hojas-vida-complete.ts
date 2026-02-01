/**
 * Script completo para scrapear hojas de vida del JNE Voto Informado
 * Extrae datos de TODOS los candidatos: presidentes, vicepresidentes,
 * senadores, diputados y parlamento andino
 */

import * as fs from 'fs'
import * as path from 'path'
import { neon } from '@neondatabase/serverless'
import pLimit from 'p-limit'
import {
  createJneApiClient,
  closeJneApiClient,
  fetchCandidateList,
  fetchHojaVidaDetail,
  delay,
  CandidatoListItem,
  JneApiClient
} from './lib/jne-api-client'
import {
  parseHojaVida,
  generateSlug,
  isValidHojaVida,
  ParsedHojaVida
} from './lib/hoja-vida-parser'

// Configuración
const DELAY_BETWEEN_REQUESTS = 2500 // ms
const DELAY_BETWEEN_BATCHES = 5000 // ms
const BATCH_SIZE = 10
const MAX_CONCURRENT = 1 // Secuencial para evitar bloqueos
const CHECKPOINT_INTERVAL = 25

// Páginas a scrapear
const PAGES_TO_SCRAPE = [
  { path: '/presidente-vicepresidentes', cargo: 'presidente', name: 'Presidentes y Vicepresidentes' },
  { path: '/senadores', cargo: 'senador', name: 'Senadores' },
  { path: '/diputados', cargo: 'diputado', name: 'Diputados' },
  { path: '/parlamento-andino', cargo: 'parlamento_andino', name: 'Parlamento Andino' },
]

// Cargar configuración de BD
function loadEnv(): string {
  const envPath = path.join(process.cwd(), '.env.local')
  const content = fs.readFileSync(envPath, 'utf-8')
  const match = content.match(/DATABASE_URL=["']?([^"'\n]+)["']?/)
  return match ? match[1] : ''
}

const sql = neon(loadEnv())
const limit = pLimit(MAX_CONCURRENT)

// Estado del scraping
interface ScrapingState {
  totalCandidates: number
  processed: number
  created: number
  updated: number
  errors: number
  currentCargo: string
  checkpoint: CandidatoListItem[]
}

const state: ScrapingState = {
  totalCandidates: 0,
  processed: 0,
  created: 0,
  updated: 0,
  errors: 0,
  currentCargo: '',
  checkpoint: []
}

/**
 * Guarda checkpoint para recuperación
 */
function saveCheckpoint(candidates: CandidatoListItem[], cargo: string): void {
  const checkpointPath = path.join(process.cwd(), `checkpoint-${cargo}.json`)
  fs.writeFileSync(checkpointPath, JSON.stringify({
    cargo,
    timestamp: new Date().toISOString(),
    processed: state.processed,
    remaining: candidates.length,
    candidates
  }, null, 2))
  console.log(`  💾 Checkpoint guardado: ${checkpointPath}`)
}

/**
 * Carga checkpoint si existe
 */
function loadCheckpoint(cargo: string): CandidatoListItem[] | null {
  const checkpointPath = path.join(process.cwd(), `checkpoint-${cargo}.json`)
  if (fs.existsSync(checkpointPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(checkpointPath, 'utf-8'))
      console.log(`  📂 Checkpoint encontrado: ${data.remaining} candidatos pendientes`)
      return data.candidates
    } catch {
      return null
    }
  }
  return null
}

/**
 * Elimina checkpoint después de completar
 */
function clearCheckpoint(cargo: string): void {
  const checkpointPath = path.join(process.cwd(), `checkpoint-${cargo}.json`)
  if (fs.existsSync(checkpointPath)) {
    fs.unlinkSync(checkpointPath)
  }
}

/**
 * Busca o crea el partido político
 */
async function findOrCreateParty(partyName: string, shortName?: string): Promise<string | null> {
  if (!partyName) return null

  try {
    // Buscar partido existente
    const existing = await sql`
      SELECT id FROM parties
      WHERE LOWER(name) LIKE ${`%${partyName.toLowerCase().substring(0, 20)}%`}
      OR (short_name IS NOT NULL AND LOWER(short_name) = ${(shortName || '').toLowerCase()})
      LIMIT 1
    `

    if (existing.length > 0) {
      return existing[0].id
    }

    // Crear nuevo partido
    const newParty = await sql`
      INSERT INTO parties (name, short_name)
      VALUES (${partyName}, ${shortName || partyName.substring(0, 10)})
      ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
      RETURNING id
    `

    return newParty[0]?.id || null
  } catch (error) {
    console.error(`  Error con partido ${partyName}:`, error)
    return null
  }
}

/**
 * Guarda un candidato en la base de datos
 */
async function saveCandidate(hv: ParsedHojaVida): Promise<'created' | 'updated' | 'error'> {
  try {
    const slug = generateSlug(hv.full_name)
    const partyId = await findOrCreateParty(hv.party_name, hv.party_short_name)

    // Buscar candidato existente por DNI o nombre similar
    const existing = await sql`
      SELECT id, full_name FROM candidates
      WHERE (dni IS NOT NULL AND dni = ${hv.dni || ''})
         OR (jne_id IS NOT NULL AND jne_id = ${hv.jne_id || ''})
         OR slug = ${slug}
      LIMIT 1
    `

    if (existing.length > 0) {
      // Actualizar
      await sql`
        UPDATE candidates SET
          full_name = COALESCE(${hv.full_name}, full_name),
          photo_url = COALESCE(${hv.photo_url || null}, photo_url),
          cargo = ${hv.cargo},
          party_id = COALESCE(${partyId}::uuid, party_id),
          birth_date = COALESCE(${hv.birth_date || null}::date, birth_date),
          dni = COALESCE(${hv.dni || null}, dni),
          jne_id = COALESCE(${hv.jne_id || null}, jne_id),
          education_level = ${hv.education_details.length > 0 ? hv.education_details[hv.education_details.length - 1].level : null},
          education_details = ${JSON.stringify(hv.education_details)}::jsonb,
          experience_details = ${JSON.stringify(hv.experience_details)}::jsonb,
          political_trajectory = ${JSON.stringify(hv.political_trajectory)}::jsonb,
          penal_sentences = ${JSON.stringify(hv.penal_sentences)}::jsonb,
          civil_sentences = ${JSON.stringify(hv.civil_sentences)}::jsonb,
          party_resignations = ${hv.party_resignations_detail.length},
          assets_declaration = ${JSON.stringify(hv.assets_declaration || {})}::jsonb,
          djhv_url = ${hv.djhv_url || null},
          plan_gobierno_url = COALESCE(${hv.plan_gobierno_url || null}, plan_gobierno_url),
          data_source = 'jne',
          data_verified = true,
          verification_date = NOW(),
          last_updated = NOW()
        WHERE id = ${existing[0].id}::uuid
      `
      return 'updated'
    } else {
      // Crear nuevo
      await sql`
        INSERT INTO candidates (
          slug, full_name, photo_url, cargo, party_id,
          birth_date, dni, jne_id,
          education_level, education_details, experience_details,
          political_trajectory, penal_sentences, civil_sentences,
          party_resignations, assets_declaration,
          djhv_url, plan_gobierno_url,
          data_source, data_verified, verification_date,
          is_active, inscription_status
        ) VALUES (
          ${slug}, ${hv.full_name}, ${hv.photo_url || null}, ${hv.cargo}, ${partyId}::uuid,
          ${hv.birth_date || null}::date, ${hv.dni || null}, ${hv.jne_id || null},
          ${hv.education_details.length > 0 ? hv.education_details[hv.education_details.length - 1].level : null},
          ${JSON.stringify(hv.education_details)}::jsonb,
          ${JSON.stringify(hv.experience_details)}::jsonb,
          ${JSON.stringify(hv.political_trajectory)}::jsonb,
          ${JSON.stringify(hv.penal_sentences)}::jsonb,
          ${JSON.stringify(hv.civil_sentences)}::jsonb,
          ${hv.party_resignations_detail.length},
          ${JSON.stringify(hv.assets_declaration || {})}::jsonb,
          ${hv.djhv_url || null}, ${hv.plan_gobierno_url || null},
          'jne', true, NOW(),
          true, 'inscrito'
        )
        ON CONFLICT (slug) DO UPDATE SET
          last_updated = NOW()
      `
      return 'created'
    }
  } catch (error) {
    console.error(`  Error guardando ${hv.full_name}:`, error)
    return 'error'
  }
}

/**
 * Procesa un candidato: obtiene detalle y guarda
 */
async function processCandidate(
  client: JneApiClient,
  candidate: CandidatoListItem,
  cargoDefault: string
): Promise<void> {
  const { idOrganizacionPolitica, idHojaVida, strNombreCompleto, strCargo } = candidate

  if (!idHojaVida || idHojaVida === 0) {
    console.log(`  ⚠ Sin ID de hoja de vida: ${strNombreCompleto}`)
    state.errors++
    return
  }

  try {
    // Obtener detalle de hoja de vida
    const rawData = await fetchHojaVidaDetail(client, idOrganizacionPolitica, idHojaVida)

    if (!rawData) {
      console.log(`  ⚠ Sin datos: ${strNombreCompleto}`)
      state.errors++
      return
    }

    // Parsear datos
    const cargo = strCargo || cargoDefault
    const hojaVida = parseHojaVida(rawData, cargo, idOrganizacionPolitica, idHojaVida)

    // Completar con datos de la lista si faltan
    if (!hojaVida.full_name) hojaVida.full_name = strNombreCompleto
    if (!hojaVida.party_name) hojaVida.party_name = candidate.strOrganizacionPolitica
    if (!hojaVida.photo_url && candidate.strFoto) hojaVida.photo_url = candidate.strFoto

    // Validar
    if (!isValidHojaVida(hojaVida)) {
      console.log(`  ⚠ Datos inválidos: ${strNombreCompleto}`)
      state.errors++
      return
    }

    // Guardar en BD
    const result = await saveCandidate(hojaVida)

    if (result === 'created') {
      state.created++
      console.log(`  ✓ Creado: ${hojaVida.full_name}`)
    } else if (result === 'updated') {
      state.updated++
      console.log(`  ✓ Actualizado: ${hojaVida.full_name}`)
    } else {
      state.errors++
    }

  } catch (error) {
    console.error(`  ✗ Error procesando ${strNombreCompleto}:`, error)
    state.errors++
  }

  state.processed++
}

/**
 * Procesa todos los candidatos de un cargo
 */
async function processCargo(
  client: JneApiClient,
  pageConfig: typeof PAGES_TO_SCRAPE[0]
): Promise<void> {
  console.log(`\n${'═'.repeat(70)}`)
  console.log(`PROCESANDO: ${pageConfig.name.toUpperCase()}`)
  console.log(`${'═'.repeat(70)}`)

  state.currentCargo = pageConfig.cargo

  // Verificar checkpoint
  let candidates = loadCheckpoint(pageConfig.cargo)

  if (!candidates) {
    // Obtener lista de candidatos
    candidates = await fetchCandidateList(client, pageConfig.path)

    if (candidates.length === 0) {
      console.log('  ⚠ No se encontraron candidatos')
      return
    }
  }

  state.totalCandidates += candidates.length
  console.log(`\n📋 Candidatos a procesar: ${candidates.length}`)

  // Procesar en lotes
  const batches = []
  for (let i = 0; i < candidates.length; i += BATCH_SIZE) {
    batches.push(candidates.slice(i, i + BATCH_SIZE))
  }

  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex]
    console.log(`\n📦 Lote ${batchIndex + 1}/${batches.length} (${batch.length} candidatos)`)

    for (const candidate of batch) {
      await limit(() => processCandidate(client, candidate, pageConfig.cargo))
      await delay(DELAY_BETWEEN_REQUESTS)
    }

    // Guardar checkpoint periódicamente
    if ((batchIndex + 1) % Math.ceil(CHECKPOINT_INTERVAL / BATCH_SIZE) === 0) {
      const remaining = candidates.slice((batchIndex + 1) * BATCH_SIZE)
      if (remaining.length > 0) {
        saveCheckpoint(remaining, pageConfig.cargo)
      }
    }

    // Pausa entre lotes
    if (batchIndex < batches.length - 1) {
      console.log(`  ⏳ Pausa entre lotes...`)
      await delay(DELAY_BETWEEN_BATCHES)
    }
  }

  // Limpiar checkpoint al completar
  clearCheckpoint(pageConfig.cargo)
  console.log(`\n✅ ${pageConfig.name} completado`)
}

/**
 * Muestra estadísticas finales
 */
function printStats(): void {
  console.log(`\n${'═'.repeat(70)}`)
  console.log('RESUMEN FINAL')
  console.log('═'.repeat(70))
  console.log(`Total candidatos encontrados: ${state.totalCandidates}`)
  console.log(`Procesados: ${state.processed}`)
  console.log(`Creados: ${state.created}`)
  console.log(`Actualizados: ${state.updated}`)
  console.log(`Errores: ${state.errors}`)
  console.log(`Tasa de éxito: ${((state.created + state.updated) / Math.max(state.processed, 1) * 100).toFixed(1)}%`)
}

/**
 * Función principal
 */
async function main() {
  console.log('╔' + '═'.repeat(68) + '╗')
  console.log('║' + ' SCRAPER COMPLETO DE HOJAS DE VIDA - JNE VOTO INFORMADO '.padStart(58).padEnd(68) + '║')
  console.log('╚' + '═'.repeat(68) + '╝')
  console.log(`\nInicio: ${new Date().toISOString()}`)

  // Parsear argumentos
  const args = process.argv.slice(2)
  const cargoFilter = args.find(a => a.startsWith('--cargo='))?.split('=')[1]
  const skipList = args.includes('--skip-list')

  let client: JneApiClient | null = null

  try {
    // Inicializar cliente
    console.log('\n🚀 Inicializando navegador...')
    client = await createJneApiClient()
    console.log('✓ Navegador listo')

    // Filtrar páginas si se especificó cargo
    const pagesToProcess = cargoFilter
      ? PAGES_TO_SCRAPE.filter(p => p.cargo === cargoFilter)
      : PAGES_TO_SCRAPE

    if (pagesToProcess.length === 0) {
      console.log(`⚠ Cargo no válido: ${cargoFilter}`)
      console.log(`  Opciones: ${PAGES_TO_SCRAPE.map(p => p.cargo).join(', ')}`)
      return
    }

    // Procesar cada cargo
    for (const pageConfig of pagesToProcess) {
      await processCargo(client, pageConfig)
    }

    // Estadísticas finales
    printStats()

    // Guardar resumen en JSON
    const summaryPath = path.join(process.cwd(), 'scraping-summary.json')
    fs.writeFileSync(summaryPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      ...state
    }, null, 2))
    console.log(`\n📄 Resumen guardado en: ${summaryPath}`)

  } catch (error) {
    console.error('\n❌ Error fatal:', error)
  } finally {
    if (client) {
      console.log('\n🔒 Cerrando navegador...')
      await closeJneApiClient(client)
    }
    console.log(`\nFin: ${new Date().toISOString()}`)
  }
}

// Ejecutar
main().catch(console.error)
