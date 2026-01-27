/**
 * Scrape government plans (planes de gobierno) for all parties
 * Uses the apiplataformaelectoral API endpoints
 */

import * as fs from 'fs'
import * as path from 'path'
import { HTTPResponse } from 'puppeteer'
import {
  VOTO_INFORMADO_BASE,
  createDb,
  setupBrowser,
  delay,
  ensureCheckpointsDir,
  CHECKPOINTS_DIR,
} from './lib/scraper-utils'

const sql = createDb()

interface PlanGobierno {
  idPlanGobierno: number
  idOrganizacionPolitica: number
  strOrganizacionPolitica: string
  strUrlArchivo?: string
  strTipoEleccion?: string
}

// ============================================
// Capture plans from API response
// ============================================

async function capturePlansFromPage(page: any): Promise<PlanGobierno[]> {
  const plans: PlanGobierno[] = []

  const handler = async (response: HTTPResponse) => {
    const url = response.url()
    const method = response.request().method()

    if (method !== 'POST' && method !== 'GET') return

    // Capture plan-gobierno API responses
    if (url.includes('plan-gobierno') || url.includes('PlanGobierno')) {
      try {
        const text = await response.text()
        const data = JSON.parse(text)

        // Handle array of plans
        const items = Array.isArray(data) ? data :
          Array.isArray(data?.data) ? data.data :
          Array.isArray(data?.lista) ? data.lista : []

        for (const item of items) {
          if (item.idPlanGobierno || item.strUrlArchivo) {
            plans.push({
              idPlanGobierno: item.idPlanGobierno || 0,
              idOrganizacionPolitica: item.idOrganizacionPolitica || item.idOP || 0,
              strOrganizacionPolitica: item.strOrganizacionPolitica || item.strPartido || '',
              strUrlArchivo: item.strUrlArchivo || item.strUrl || '',
              strTipoEleccion: item.strTipoEleccion || '',
            })
          }
        }
      } catch (e) {}
    }
  }

  page.on('response', handler)

  // Navigate to pages that may trigger plan de gobierno API calls
  const paths = [
    '/presidente-vicepresidentes',
    '/senadores',
    '/diputados',
    '/parlamento-andino',
  ]

  for (const urlPath of paths) {
    console.log(`  Navegando a ${urlPath}...`)
    try {
      await page.goto(`${VOTO_INFORMADO_BASE}${urlPath}`, {
        waitUntil: 'networkidle2',
        timeout: 60000
      })
      await delay(5000)
    } catch (e) {
      console.log(`  Error: ${e}`)
    }
  }

  page.off('response', handler)

  // Deduplicate by idPlanGobierno
  const seen = new Set<number>()
  return plans.filter(p => {
    if (seen.has(p.idPlanGobierno)) return false
    seen.add(p.idPlanGobierno)
    return true
  })
}

// ============================================
// Try direct API fetch from within page context
// ============================================

async function fetchPlansFromAPI(page: any): Promise<PlanGobierno[]> {
  console.log('\n  Intentando API directa desde contexto de pagina...')

  const plans = await page.evaluate(async () => {
    const results: any[] = []

    // Try the busqueda-avanzada endpoint
    const endpoints = [
      'https://apiplataformaelectoral9.jne.gob.pe/api/v1/plan-gobierno/busqueda-avanzada',
      'https://apiplataformaelectoral8.jne.gob.pe/api/v1/plan-gobierno/busqueda-avanzada',
    ]

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            idProcesoElectoral: 124,
            idTipoEleccion: 0,
          })
        })

        if (response.ok) {
          const data = await response.json()
          const items = Array.isArray(data) ? data :
            Array.isArray(data?.data) ? data.data : []

          for (const item of items) {
            results.push({
              idPlanGobierno: item.idPlanGobierno || 0,
              idOrganizacionPolitica: item.idOrganizacionPolitica || 0,
              strOrganizacionPolitica: item.strOrganizacionPolitica || '',
              strUrlArchivo: item.strUrlArchivo || '',
              strTipoEleccion: item.strTipoEleccion || '',
            })
          }

          if (results.length > 0) break
        }
      } catch (e) {
        // Continue to next endpoint
      }
    }

    return results
  })

  return plans as PlanGobierno[]
}

// ============================================
// Download PDF
// ============================================

async function downloadPlan(pdfUrl: string, filename: string): Promise<boolean> {
  const planesDir = path.join(process.cwd(), 'public', 'planes')
  if (!fs.existsSync(planesDir)) {
    fs.mkdirSync(planesDir, { recursive: true })
  }

  const filePath = path.join(planesDir, filename)
  if (fs.existsSync(filePath)) {
    return true // Already downloaded
  }

  try {
    const response = await fetch(pdfUrl)
    if (!response.ok) return false

    const buffer = Buffer.from(await response.arrayBuffer())
    fs.writeFileSync(filePath, buffer)
    return true
  } catch (e) {
    console.log(`    Error descargando: ${e}`)
    return false
  }
}

// ============================================
// Main
// ============================================

async function main() {
  console.log('='.repeat(70))
  console.log(' SCRAPE PLANES DE GOBIERNO')
  console.log('='.repeat(70))

  const { browser, page } = await setupBrowser()
  let plans: PlanGobierno[] = []

  try {
    // First navigate to any page to establish session
    await page.goto(VOTO_INFORMADO_BASE, {
      waitUntil: 'networkidle2',
      timeout: 60000
    })
    await delay(3000)

    // Try API first
    plans = await fetchPlansFromAPI(page)
    console.log(`  Planes desde API: ${plans.length}`)

    // If API didn't work, capture from page navigation
    if (plans.length === 0) {
      console.log('\n  API directa no funciono, capturando desde navegacion...')
      plans = await capturePlansFromPage(page)
      console.log(`  Planes capturados: ${plans.length}`)
    }
  } finally {
    await browser.close()
    console.log('\nNavegador cerrado')
  }

  if (plans.length === 0) {
    console.log('\nNo se encontraron planes de gobierno.')
    return
  }

  // Save manifest
  ensureCheckpointsDir()
  fs.writeFileSync(
    path.join(CHECKPOINTS_DIR, 'planes-gobierno-manifest.json'),
    JSON.stringify(plans, null, 2)
  )

  // Process each plan
  console.log(`\nProcesando ${plans.length} planes de gobierno...`)
  let downloaded = 0
  let updated = 0
  let errors = 0

  for (const plan of plans) {
    console.log(`\n  ${plan.strOrganizacionPolitica}`)

    if (plan.strUrlArchivo) {
      // Create a safe filename
      const slug = plan.strOrganizacionPolitica
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')

      const filename = `plan-gobierno-${slug}.pdf`
      const localUrl = `/planes/${filename}`

      // Download PDF
      const success = await downloadPlan(plan.strUrlArchivo, filename)
      if (success) {
        downloaded++
        console.log(`    PDF descargado: ${filename}`)
      }

      // Update candidates with this party's plan URL
      try {
        const result = await sql`
          UPDATE candidates SET
            plan_gobierno_url = ${localUrl},
            last_updated = NOW()
          WHERE jne_org_id = ${plan.idOrganizacionPolitica}
          AND plan_gobierno_url IS NULL
        `
        console.log(`    Candidatos actualizados con URL del plan`)
        updated++
      } catch (e) {
        errors++
        console.log(`    Error actualizando BD: ${e}`)
      }
    } else {
      console.log('    Sin URL de archivo')
    }
  }

  console.log('\n' + '='.repeat(70))
  console.log('RESUMEN')
  console.log('='.repeat(70))
  console.log(`  Planes encontrados: ${plans.length}`)
  console.log(`  PDFs descargados: ${downloaded}`)
  console.log(`  Partidos actualizados: ${updated}`)
  console.log(`  Errores: ${errors}`)
}

main().catch(console.error)
