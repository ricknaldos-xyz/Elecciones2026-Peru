/**
 * Re-scrape Hojas de Vida from JNE for candidates missing sentence data.
 *
 * Optimized approach:
 * 1. Capture auth token from Angular app (one navigation)
 * 2. Use direct API calls via page.evaluate(fetch) for GetHVConsolidado
 * 3. Process in batches of 5 for speed
 * 4. Checkpoint every 100 candidates for resumability
 */

import * as fs from 'fs'
import * as path from 'path'
import {
  createDb,
  setupBrowser,
  delay,
  parseSentences,
  parseResignations,
  parseAllEducation,
  parseExperience,
  parsePolitical,
  parseAssets,
  getHighestEducationLevel,
  VOTO_INFORMADO_BASE,
  CHECKPOINTS_DIR,
  ensureCheckpointsDir,
} from './lib/scraper-utils'
import { Page } from 'puppeteer'

const sql = createDb()
const JNE_API_BASE = 'https://sije.jne.gob.pe/ServiciosWeb/WSCandidato'
const CHECKPOINT_NAME = 'scrape-missing-sentences'
const BATCH_SIZE = 5

interface CheckpointData {
  completedIds: string[]
  foundSentences: number
  timestamp: string
}

function saveProgress(data: CheckpointData) {
  ensureCheckpointsDir()
  const filePath = path.join(CHECKPOINTS_DIR, `${CHECKPOINT_NAME}.json`)
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
}

function loadProgress(): CheckpointData | null {
  const filePath = path.join(CHECKPOINTS_DIR, `${CHECKPOINT_NAME}.json`)
  if (!fs.existsSync(filePath)) return null
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  } catch {
    return null
  }
}

async function captureAuthToken(page: Page): Promise<{ token: string; userId: number }> {
  console.log('  Capturando token de autenticacion...')

  let authToken = ''
  let userId = 0

  const requestHandler = (request: any) => {
    if (request.url().includes('ListaCandidatos') && request.method() === 'POST') {
      try {
        const body = JSON.parse(request.postData() || '{}')
        if (body.oToken) {
          authToken = body.oToken.AuthToken
          userId = body.oToken.UserId
        }
      } catch (e) {}
    }
  }

  page.on('request', requestHandler)
  await page.goto(`${VOTO_INFORMADO_BASE}/senadores`, {
    waitUntil: 'networkidle2',
    timeout: 60000
  })
  await delay(5000)
  page.off('request', requestHandler)

  return { token: authToken, userId }
}

async function fetchHojaVida(
  page: Page,
  token: string,
  userId: number,
  orgId: number,
  dni: string
): Promise<any | null> {
  return page.evaluate(
    async (t: string, uid: number, oid: number, d: string, apiBase: string) => {
      try {
        const resp = await fetch(`${apiBase}/GetHVConsolidado`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            oToken: { AuthToken: t, UserId: uid },
            oFiltro: {
              idProcesoElectoral: 124,
              idOrganizacionPolitica: oid,
              strDocumentoIdentidad: d,
            }
          })
        })
        if (!resp.ok) return null
        const data = await resp.json()
        if (data.success === false) return null
        return data.data || data || null
      } catch (e) {
        return null
      }
    },
    token, userId, orgId, dni, JNE_API_BASE
  )
}

function processHvData(hvData: any) {
  const penalSentences = parseSentences(hvData.lSentenciaPenal)
  const civilSentences = parseSentences(hvData.lSentenciaObliga)
  const resignations = parseResignations(hvData)
  const education = parseAllEducation(hvData)
  const experience = parseExperience(hvData)
  const political = parsePolitical(hvData)
  const assets = parseAssets(hvData)
  const educationLevel = getHighestEducationLevel(education)

  let birthDate: string | null = null
  if (hvData.oDatosPersonales?.strFechaNacimiento) {
    const parts = hvData.oDatosPersonales.strFechaNacimiento.split('/')
    if (parts.length >= 3) {
      birthDate = `${parts[2].substring(0, 4)}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
    }
  }

  const jneId = hvData.oDatosPersonales?.idHojaVida?.toString() || null

  return { penalSentences, civilSentences, resignations, education, experience, political, assets, educationLevel, birthDate, jneId }
}

async function main() {
  console.log('='.repeat(70))
  console.log(' SCRAPE MISSING SENTENCES FROM JNE HOJAS DE VIDA')
  console.log('='.repeat(70))

  // Check for resume
  const checkpoint = loadProgress()
  const completedSet = new Set(checkpoint?.completedIds || [])
  if (checkpoint) {
    console.log(`\nRetomando desde checkpoint: ${checkpoint.completedIds.length} completados, ${checkpoint.foundSentences} con sentencias`)
  }

  // Get candidates needing sentence scraping
  const candidates = await sql`
    SELECT id, full_name, dni, cargo, jne_org_id
    FROM candidates
    WHERE is_active = true
    AND dni IS NOT NULL AND dni <> ''
    AND jne_org_id IS NOT NULL
    AND (penal_sentences IS NULL OR penal_sentences = '[]'::jsonb)
    AND (civil_sentences IS NULL OR civil_sentences = '[]'::jsonb)
    ORDER BY
      CASE cargo
        WHEN 'presidente' THEN 1
        WHEN 'vicepresidente' THEN 2
        WHEN 'senador' THEN 3
        WHEN 'diputado' THEN 4
        WHEN 'parlamento_andino' THEN 5
      END,
      full_name
  `

  const toProcess = candidates.filter((c: any) => !completedSet.has(c.id))

  console.log(`\nCandidatos sin sentencias en DB: ${candidates.length}`)
  console.log(`Pendientes de procesar: ${toProcess.length}`)

  if (toProcess.length === 0) {
    console.log('\nTodos procesados!')
    return
  }

  const byCargo: Record<string, number> = {}
  for (const c of toProcess) {
    byCargo[c.cargo] = (byCargo[c.cargo] || 0) + 1
  }
  for (const [cargo, count] of Object.entries(byCargo)) {
    console.log(`  ${cargo}: ${count}`)
  }

  // Setup browser and capture auth token
  const { browser, page } = await setupBrowser()

  try {
    const { token, userId } = await captureAuthToken(page)
    if (!token) {
      console.log('ERROR: No se capturo token de autenticacion')
      return
    }
    console.log(`  Token capturado: ${token.slice(0, 10)}...`)
    console.log(`\nIniciando scraping via API directa (batch size: ${BATCH_SIZE})...\n`)

    let processed = 0
    let foundSentences = checkpoint?.foundSentences || 0
    let failed = 0
    let updated = 0

    // Process in batches
    for (let i = 0; i < toProcess.length; i += BATCH_SIZE) {
      const batch = toProcess.slice(i, i + BATCH_SIZE)

      const results = await Promise.allSettled(
        batch.map(async (candidate: any) => {
          const hvData = await fetchHojaVida(page, token, userId, candidate.jne_org_id, candidate.dni)
          return { candidate, hvData }
        })
      )

      for (const result of results) {
        processed++

        if (result.status === 'rejected' || !result.value.hvData) {
          failed++
          if (result.status === 'fulfilled') {
            completedSet.add(result.value.candidate.id)
          }
          continue
        }

        const { candidate, hvData } = result.value
        const parsed = processHvData(hvData)
        const hasSentences = parsed.penalSentences.length > 0 || parsed.civilSentences.length > 0

        if (hasSentences) {
          foundSentences++
          console.log(`  SENTENCIA: ${candidate.full_name} (${candidate.cargo})`)
          if (parsed.penalSentences.length > 0) console.log(`    Penal: ${parsed.penalSentences.length}`)
          if (parsed.civilSentences.length > 0) console.log(`    Civil: ${parsed.civilSentences.length}`)
        }

        try {
          await sql`
            UPDATE candidates SET
              jne_id = COALESCE(${parsed.jneId}, jne_id),
              birth_date = COALESCE(${parsed.birthDate}::date, birth_date),
              education_level = COALESCE(${parsed.educationLevel}, education_level),
              education_details = CASE
                WHEN ${parsed.education.length} > 0 THEN ${JSON.stringify(parsed.education)}::jsonb
                ELSE education_details
              END,
              experience_details = CASE
                WHEN ${parsed.experience.length} > 0 THEN ${JSON.stringify(parsed.experience)}::jsonb
                ELSE experience_details
              END,
              political_trajectory = CASE
                WHEN ${parsed.political.length} > 0 THEN ${JSON.stringify(parsed.political)}::jsonb
                ELSE political_trajectory
              END,
              penal_sentences = CASE
                WHEN ${parsed.penalSentences.length} > 0 THEN ${JSON.stringify(parsed.penalSentences)}::jsonb
                ELSE penal_sentences
              END,
              civil_sentences = CASE
                WHEN ${parsed.civilSentences.length} > 0 THEN ${JSON.stringify(parsed.civilSentences)}::jsonb
                ELSE civil_sentences
              END,
              party_resignations = GREATEST(${parsed.resignations}, COALESCE(party_resignations, 0)),
              assets_declaration = CASE
                WHEN ${JSON.stringify(parsed.assets)} != '{"source":"jne"}' THEN ${JSON.stringify(parsed.assets)}::jsonb
                ELSE assets_declaration
              END,
              djhv_url = ${`${VOTO_INFORMADO_BASE}/hoja-vida/${candidate.jne_org_id}/${candidate.dni}`},
              data_source = 'jne',
              data_verified = true,
              verification_date = NOW(),
              last_updated = NOW()
            WHERE id = ${candidate.id}::uuid
          `
          updated++
        } catch (e) {
          console.log(`  Error actualizando ${candidate.full_name}: ${e}`)
        }

        completedSet.add(candidate.id)
      }

      // Progress and checkpoint
      if (processed % 100 < BATCH_SIZE) {
        console.log(`  Progreso: ${processed}/${toProcess.length} | Sentencias: ${foundSentences} | Actualizados: ${updated} | Fallidos: ${failed}`)
        saveProgress({
          completedIds: Array.from(completedSet),
          foundSentences,
          timestamp: new Date().toISOString()
        })
      }

      // Small delay between batches to not overwhelm the API
      await delay(500)
    }

    // Final checkpoint
    saveProgress({
      completedIds: Array.from(completedSet),
      foundSentences,
      timestamp: new Date().toISOString()
    })

    console.log('\n' + '='.repeat(70))
    console.log('RESUMEN')
    console.log('='.repeat(70))
    console.log(`  Procesados: ${processed}`)
    console.log(`  Actualizados: ${updated}`)
    console.log(`  Con sentencias encontradas: ${foundSentences}`)
    console.log(`  Fallidos: ${failed}`)

    // Verify
    const [stats] = await sql`
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN jsonb_array_length(COALESCE(penal_sentences, '[]'::jsonb)) > 0 THEN 1 END) as with_penal,
        COUNT(CASE WHEN jsonb_array_length(COALESCE(civil_sentences, '[]'::jsonb)) > 0 THEN 1 END) as with_civil,
        COUNT(CASE WHEN party_resignations > 0 THEN 1 END) as with_resignations
      FROM candidates
      WHERE is_active = true
    `

    console.log(`\nEstado post-scrape:`)
    console.log(`  Total activos: ${stats.total}`)
    console.log(`  Con sentencias penales: ${stats.with_penal}`)
    console.log(`  Con sentencias civiles: ${stats.with_civil}`)
    console.log(`  Con renuncias: ${stats.with_resignations}`)

  } finally {
    await browser.close()
    console.log('\nNavegador cerrado')
  }
}

main().catch(console.error)
