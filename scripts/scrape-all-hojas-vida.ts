/**
 * Scrape complete hojas de vida for ALL candidates
 * Uses the proven Puppeteer + GetHVConsolidado interception approach
 *
 * Usage:
 *   npx tsx scripts/scrape-all-hojas-vida.ts                    # All candidates needing data
 *   npx tsx scripts/scrape-all-hojas-vida.ts --cargo=senador    # Only senators
 *   npx tsx scripts/scrape-all-hojas-vida.ts --resume           # Resume from checkpoint
 *   npx tsx scripts/scrape-all-hojas-vida.ts --force            # Re-scrape all (even with data)
 */

import * as fs from 'fs'
import * as path from 'path'
import {
  createDb,
  setupBrowser,
  delay,
  DELAY_MS,
  captureHojaVida,
  updateCandidateHojaVida,
  parseAllEducation,
  parseExperience,
  parsePolitical,
  saveCheckpoint,
  loadCheckpoint,
  Checkpoint,
} from './lib/scraper-utils'

const sql = createDb()

// ============================================
// CLI Args
// ============================================

function parseArgs(): { cargo?: string; resume: boolean; force: boolean } {
  const args = process.argv.slice(2)
  let cargo: string | undefined
  let resume = false
  let force = false

  for (const arg of args) {
    if (arg.startsWith('--cargo=')) cargo = arg.split('=')[1]
    if (arg === '--resume') resume = true
    if (arg === '--force') force = true
  }

  return { cargo, resume, force }
}

// ============================================
// Get candidates needing hoja de vida data
// ============================================

interface CandidateToProcess {
  id: string
  full_name: string
  dni: string
  jne_org_id: number
  cargo: string
}

async function getCandidatesToProcess(cargo?: string, force?: boolean): Promise<CandidateToProcess[]> {
  if (force) {
    // Get all candidates with DNI and org ID
    if (cargo) {
      return await sql`
        SELECT id, full_name, dni, jne_org_id, cargo
        FROM candidates
        WHERE cargo = ${cargo}
        AND dni IS NOT NULL AND dni <> ''
        AND jne_org_id IS NOT NULL
        ORDER BY cargo, full_name
      ` as CandidateToProcess[]
    }
    return await sql`
      SELECT id, full_name, dni, jne_org_id, cargo
      FROM candidates
      WHERE dni IS NOT NULL AND dni <> ''
      AND jne_org_id IS NOT NULL
      ORDER BY cargo, full_name
    ` as CandidateToProcess[]
  }

  // Only candidates missing education data (main indicator of incomplete HV)
  if (cargo) {
    return await sql`
      SELECT id, full_name, dni, jne_org_id, cargo
      FROM candidates
      WHERE cargo = ${cargo}
      AND dni IS NOT NULL AND dni <> ''
      AND jne_org_id IS NOT NULL
      AND (education_details IS NULL OR jsonb_array_length(education_details) = 0)
      ORDER BY full_name
    ` as CandidateToProcess[]
  }

  return await sql`
    SELECT id, full_name, dni, jne_org_id, cargo
    FROM candidates
    WHERE dni IS NOT NULL AND dni <> ''
    AND jne_org_id IS NOT NULL
    AND (education_details IS NULL OR jsonb_array_length(education_details) = 0)
    ORDER BY cargo, full_name
  ` as CandidateToProcess[]
}

// ============================================
// Main
// ============================================

async function main() {
  const { cargo, resume, force } = parseArgs()

  console.log('='.repeat(70))
  console.log(' SCRAPE HOJAS DE VIDA - ALL CANDIDATES')
  console.log('='.repeat(70))
  if (cargo) console.log(`Cargo filtrado: ${cargo}`)
  if (resume) console.log('Modo: Reanudar desde checkpoint')
  if (force) console.log('Modo: Forzar re-scraping')

  // Get candidates to process
  const candidates = await getCandidatesToProcess(cargo, force)
  console.log(`\nCandidatos a procesar: ${candidates.length}`)

  if (candidates.length === 0) {
    console.log('\nTodos los candidatos ya tienen datos completos.')
    return
  }

  // Summary by cargo
  const byCargo: Record<string, number> = {}
  for (const c of candidates) {
    byCargo[c.cargo] = (byCargo[c.cargo] || 0) + 1
  }
  for (const [c, n] of Object.entries(byCargo)) {
    console.log(`  ${c}: ${n}`)
  }

  // Load checkpoint if resuming
  const checkpointName = `hojas-vida-${cargo || 'all'}`
  let checkpoint: Checkpoint | null = null
  let completedDnis = new Set<string>()
  let startIndex = 0

  if (resume) {
    checkpoint = loadCheckpoint(checkpointName)
    if (checkpoint) {
      completedDnis = new Set(checkpoint.completedDnis)
      startIndex = checkpoint.lastProcessedIndex
      console.log(`\nResumiendo desde indice ${startIndex}, ${completedDnis.size} ya completados`)
    }
  }

  // Launch browser
  let { browser, page } = await setupBrowser()

  let completed = 0
  let failed = 0
  let skipped = 0
  const failedDnis: string[] = checkpoint?.failedDnis || []

  const BROWSER_RESTART_EVERY = 200

  try {
    for (let i = 0; i < candidates.length; i++) {
      const candidate = candidates[i]

      // Skip already completed
      if (completedDnis.has(candidate.dni)) {
        skipped++
        continue
      }

      // Restart browser periodically to prevent memory leaks
      const processedSinceStart = completed + failed - (checkpoint?.completedDnis.length || 0)
      if (processedSinceStart > 0 && processedSinceStart % BROWSER_RESTART_EVERY === 0) {
        console.log('\n  Reiniciando navegador...')
        await browser.close()
        const setup = await setupBrowser()
        browser = setup.browser
        page = setup.page
      }

      console.log(`\n[${i + 1}/${candidates.length}] [${candidate.cargo}] ${candidate.full_name}`)
      console.log(`  DNI: ${candidate.dni}, OrgId: ${candidate.jne_org_id}`)

      try {
        // Capture hoja de vida with retries
        let hvData: any = null
        let retries = 0
        const MAX_RETRIES = 3

        while (!hvData && retries < MAX_RETRIES) {
          if (retries > 0) {
            const backoff = retries * 5000
            console.log(`  Reintento ${retries}/${MAX_RETRIES} (esperando ${backoff / 1000}s)...`)
            await delay(backoff)

            // Restart browser on retry
            try {
              await browser.close()
            } catch (e) {}
            const setup = await setupBrowser()
            browser = setup.browser
            page = setup.page
          }

          try {
            hvData = await captureHojaVida(page, candidate.jne_org_id, candidate.dni)
          } catch (captureError) {
            console.log(`  Error capturando: ${captureError}`)
          }
          retries++
        }

        if (!hvData) {
          failed++
          failedDnis.push(candidate.dni)
          console.log('  !! No se capturaron datos')
          await delay(DELAY_MS)

          // Save checkpoint on failures
          if (failed % 5 === 0) {
            saveCheckpoint(checkpointName, {
              lastProcessedIndex: i,
              completedDnis: Array.from(completedDnis),
              failedDnis,
              timestamp: new Date().toISOString()
            })
          }
          continue
        }

        // Parse and show summary
        const education = parseAllEducation(hvData)
        const experience = parseExperience(hvData)
        const political = parsePolitical(hvData)
        console.log(`  Edu: ${education.length}, Exp: ${experience.length}, Pol: ${political.length}`)

        // Update database
        const success = await updateCandidateHojaVida(
          sql, candidate.id, hvData, candidate.jne_org_id, candidate.dni
        )

        if (success) {
          completed++
          completedDnis.add(candidate.dni)
          console.log('  OK')
        } else {
          failed++
          failedDnis.push(candidate.dni)
        }

        // Save checkpoint every 10 candidates
        if ((completed + failed) % 10 === 0) {
          saveCheckpoint(checkpointName, {
            lastProcessedIndex: i,
            completedDnis: Array.from(completedDnis),
            failedDnis,
            timestamp: new Date().toISOString()
          })
        }

        await delay(DELAY_MS)
      } catch (outerError) {
        console.log(`  !! Error inesperado: ${outerError}`)
        failed++
        failedDnis.push(candidate.dni)

        // Restart browser after crash
        try {
          await browser.close()
        } catch (e) {}
        const setup = await setupBrowser()
        browser = setup.browser
        page = setup.page
        await delay(DELAY_MS)
      }
    }
  } finally {
    await browser.close()
    console.log('\nNavegador cerrado')
  }

  // Final checkpoint
  saveCheckpoint(checkpointName, {
    lastProcessedIndex: candidates.length,
    completedDnis: Array.from(completedDnis),
    failedDnis,
    timestamp: new Date().toISOString()
  })

  // Summary
  console.log('\n' + '='.repeat(70))
  console.log('RESUMEN')
  console.log('='.repeat(70))
  console.log(`Total procesados: ${completed + failed + skipped}`)
  console.log(`  Completados: ${completed}`)
  console.log(`  Fallidos: ${failed}`)
  console.log(`  Omitidos (ya completos): ${skipped}`)

  if (failedDnis.length > 0) {
    console.log(`\nDNIs fallidos (${failedDnis.length}):`)
    for (const dni of failedDnis.slice(0, 20)) {
      console.log(`  - ${dni}`)
    }
    if (failedDnis.length > 20) {
      console.log(`  ... y ${failedDnis.length - 20} mas`)
    }
  }

  // DB stats
  const cargoFilter = cargo ? `AND cargo = '${cargo}'` : ''
  const [stats] = await sql`
    SELECT
      COUNT(*) as total,
      COUNT(CASE WHEN education_details IS NOT NULL AND jsonb_array_length(education_details) > 0 THEN 1 END) as with_edu,
      COUNT(CASE WHEN experience_details IS NOT NULL AND jsonb_array_length(experience_details) > 0 THEN 1 END) as with_exp,
      COUNT(CASE WHEN assets_declaration IS NOT NULL AND assets_declaration <> '{}'::jsonb THEN 1 END) as with_assets
    FROM candidates
    WHERE is_active = true
    AND dni IS NOT NULL AND dni <> ''
  `

  console.log(`\nEstado BD (candidatos con DNI):`)
  console.log(`  Total: ${stats.total}`)
  console.log(`  Con educacion: ${stats.with_edu} (${((Number(stats.with_edu) / Number(stats.total)) * 100).toFixed(1)}%)`)
  console.log(`  Con experiencia: ${stats.with_exp} (${((Number(stats.with_exp) / Number(stats.total)) * 100).toFixed(1)}%)`)
  console.log(`  Con patrimonio: ${stats.with_assets} (${((Number(stats.with_assets) / Number(stats.total)) * 100).toFixed(1)}%)`)
}

main().catch(console.error)
