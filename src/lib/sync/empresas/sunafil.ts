/**
 * SUNAFIL Labor Violations Scraper with Puppeteer
 *
 * Fetches labor law violations and sanctions from SUNAFIL for
 * companies linked to candidates.
 *
 * Source: https://www.sunafil.gob.pe/
 */

import { sql } from '@/lib/db'
import { createSyncLogger } from '../logger'
import {
  getBrowser,
  createPage,
  closeBrowser,
  withRetry,
  debugScreenshot,
} from '../puppeteer-utils'

// SUNAFIL consultation portals
const SUNAFIL_CONSULTA_URL = 'https://www.sunafil.gob.pe/consultas-en-linea.html'
const SUNAFIL_SANCIONES_URL = 'https://servicios.sunafil.gob.pe/sanciones/'
const DELAY_MS = 2000

interface SunafilViolation {
  violationId: string
  companyRuc: string
  violationType: 'seguridad_salud' | 'derechos_laborales' | 'trabajo_infantil' | 'trabajo_forzoso' | 'otros'
  severity: 'leve' | 'grave' | 'muy_grave'
  description: string
  status: 'en_proceso' | 'sancionado' | 'apelacion' | 'archivado'
  fineAmount?: number
  workersAffected?: number
  inspectionDate: string
  resolutionDate?: string
  sourceUrl: string
}

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Gets companies for SUNAFIL check
 */
async function getCompaniesForSunafilCheck(): Promise<Array<{
  companyId: string
  candidateId: string
  ruc: string
  companyName: string
}>> {
  const result = await sql`
    SELECT
      cc.id as company_id,
      cc.candidate_id,
      cc.company_ruc as ruc,
      cc.company_name
    FROM candidate_companies cc
    WHERE cc.is_active = true
  `

  return result.map((r) => ({
    companyId: r.company_id as string,
    candidateId: r.candidate_id as string,
    ruc: r.ruc as string,
    companyName: r.company_name as string,
  }))
}

/**
 * Searches SUNAFIL violations by company RUC using Puppeteer
 */
async function searchSunafilByRUC(ruc: string): Promise<SunafilViolation[]> {
  const browser = await getBrowser()
  const page = await createPage(browser)
  const violations: SunafilViolation[] = []

  try {
    console.log(`[SUNAFIL] Searching sanctions for RUC ${ruc}...`)

    // Try the sanctions consultation portal
    await page.goto(SUNAFIL_SANCIONES_URL, { waitUntil: 'networkidle2' })
    await delay(2000)

    await debugScreenshot(page, 'sunafil-initial')

    // Find the RUC input field
    const rucSelectors = [
      '#ruc',
      'input[name="ruc"]',
      'input[placeholder*="RUC"]',
      '#txtRuc',
      'input[type="text"]',
    ]

    let rucInput = null
    for (const selector of rucSelectors) {
      rucInput = await page.$(selector)
      if (rucInput) break
    }

    if (rucInput) {
      // Clear and type the RUC
      await rucInput.click({ clickCount: 3 })
      await rucInput.type(ruc)
      await delay(500)

      // Find and click the search button
      const searchButtons = [
        '#btnBuscar',
        'button[type="submit"]',
        'input[type="submit"]',
        '.btn-buscar',
        '#buscar',
      ]

      for (const btnSelector of searchButtons) {
        const btn = await page.$(btnSelector)
        if (btn) {
          await btn.click()
          break
        }
      }

      // Also try pressing Enter
      await page.keyboard.press('Enter')

      await delay(3000)
      await debugScreenshot(page, 'sunafil-after-search')

      // Wait for results
      try {
        await page.waitForSelector('table, .resultados, #gridSanciones, .sancion-item', {
          timeout: 10000,
        })
      } catch {
        console.log('[SUNAFIL] No results container found')
      }

      // Extract violations from the page
      const extractedViolations = await page.evaluate((searchRuc) => {
        const violations: Array<{
          type: string
          severity: string
          description: string
          status: string
          fine: number
          date: string
          workers: number
        }> = []

        // Try multiple table structures
        const tables = document.querySelectorAll('table')
        tables.forEach((table) => {
          const rows = table.querySelectorAll('tr')
          rows.forEach((row) => {
            const text = row.textContent || ''
            const cells = row.querySelectorAll('td')

            // Skip header rows
            if (cells.length < 3) return
            if (!text.includes(searchRuc) && !text.toLowerCase().includes('infracción') && !text.toLowerCase().includes('sanción')) return

            // Parse violation type
            let type = 'otros'
            if (text.toLowerCase().includes('seguridad') || text.toLowerCase().includes('salud')) {
              type = 'seguridad_salud'
            } else if (text.toLowerCase().includes('derecho') || text.toLowerCase().includes('beneficio')) {
              type = 'derechos_laborales'
            } else if (text.toLowerCase().includes('infantil') || text.toLowerCase().includes('menor')) {
              type = 'trabajo_infantil'
            } else if (text.toLowerCase().includes('forzoso')) {
              type = 'trabajo_forzoso'
            }

            // Parse severity
            let severity = 'leve'
            if (text.toLowerCase().includes('muy grave') || text.toLowerCase().includes('muy_grave')) {
              severity = 'muy_grave'
            } else if (text.toLowerCase().includes('grave')) {
              severity = 'grave'
            }

            // Parse status
            let status = 'en_proceso'
            if (text.toLowerCase().includes('sancionado') || text.toLowerCase().includes('firme')) {
              status = 'sancionado'
            } else if (text.toLowerCase().includes('apelacion') || text.toLowerCase().includes('apelación')) {
              status = 'apelacion'
            } else if (text.toLowerCase().includes('archivado')) {
              status = 'archivado'
            }

            // Parse fine amount
            const fineMatch = text.match(/s\/?\s*([\d,]+(?:\.\d{2})?)/i)
            const fine = fineMatch ? parseFloat(fineMatch[1].replace(/,/g, '')) : 0

            // Parse date
            const dateMatch = text.match(/\d{2}[/-]\d{2}[/-]\d{4}/)

            // Parse workers affected
            const workersMatch = text.match(/(\d+)\s*trabajador/i)
            const workers = workersMatch ? parseInt(workersMatch[1]) : 0

            violations.push({
              type,
              severity,
              description: cells[1]?.textContent?.trim() || cells[0]?.textContent?.trim() || text.substring(0, 200),
              status,
              fine,
              date: dateMatch ? dateMatch[0] : new Date().toISOString().split('T')[0],
              workers,
            })
          })
        })

        // Also try div-based layouts
        const items = document.querySelectorAll('.sancion-item, .violation-item, .resultado')
        items.forEach((item) => {
          const text = item.textContent || ''
          const fineMatch = text.match(/s\/?\s*([\d,]+(?:\.\d{2})?)/i)
          const dateMatch = text.match(/\d{2}[/-]\d{2}[/-]\d{4}/)

          violations.push({
            type: 'otros',
            severity: text.toLowerCase().includes('grave') ? 'grave' : 'leve',
            description: text.substring(0, 200),
            status: 'sancionado',
            fine: fineMatch ? parseFloat(fineMatch[1].replace(/,/g, '')) : 0,
            date: dateMatch ? dateMatch[0] : new Date().toISOString().split('T')[0],
            workers: 0,
          })
        })

        return violations
      }, ruc)

      // Convert to SunafilViolation format
      for (let i = 0; i < extractedViolations.length; i++) {
        const v = extractedViolations[i]
        violations.push({
          violationId: `SUNAFIL-${ruc}-${Date.now()}-${i}`,
          companyRuc: ruc,
          violationType: v.type as SunafilViolation['violationType'],
          severity: v.severity as SunafilViolation['severity'],
          description: v.description,
          status: v.status as SunafilViolation['status'],
          fineAmount: v.fine || undefined,
          workersAffected: v.workers || undefined,
          inspectionDate: v.date,
          sourceUrl: SUNAFIL_SANCIONES_URL,
        })
      }
    }

    console.log(`[SUNAFIL] Found ${violations.length} violations for RUC ${ruc}`)

    return violations
  } catch (error) {
    console.error(`[SUNAFIL] Error searching RUC ${ruc}:`, error)
    await debugScreenshot(page, 'sunafil-error')
    return violations
  } finally {
    await page.close()
  }
}

/**
 * Saves SUNAFIL violation to database
 */
async function saveSunafilViolation(companyId: string, violation: SunafilViolation): Promise<void> {
  await sql`
    INSERT INTO company_legal_issues (
      company_id,
      issue_type,
      description,
      case_number,
      institution,
      status,
      fine_amount,
      issue_date,
      resolution_date,
      source_url
    ) VALUES (
      ${companyId}::uuid,
      'laboral',
      ${violation.description},
      ${violation.violationId},
      'SUNAFIL',
      ${violation.status},
      ${violation.fineAmount || null},
      ${violation.inspectionDate}::date,
      ${violation.resolutionDate ? violation.resolutionDate : null}::date,
      ${violation.sourceUrl}
    )
    ON CONFLICT DO NOTHING
  `
}

/**
 * Main sync function for SUNAFIL violations
 */
export async function syncSunafilViolations(): Promise<{
  records_processed: number
  records_updated: number
  records_created: number
  records_skipped: number
}> {
  const logger = createSyncLogger('sunafil')
  await logger.start()

  try {
    await logger.markRunning()

    const companies = await getCompaniesForSunafilCheck()
    console.log(`[SUNAFIL] Found ${companies.length} companies to check`)

    const checkedRucs = new Set<string>()

    for (const company of companies) {
      logger.incrementProcessed()

      if (checkedRucs.has(company.ruc)) {
        logger.incrementSkipped()
        continue
      }
      checkedRucs.add(company.ruc)

      const violations = await withRetry(
        () => searchSunafilByRUC(company.ruc),
        2,
        3000
      )

      for (const violation of violations) {
        try {
          await saveSunafilViolation(company.companyId, violation)
          logger.incrementCreated()
        } catch (error) {
          console.error(`[SUNAFIL] Error saving violation:`, error)
          logger.incrementSkipped()
        }
      }

      await delay(DELAY_MS)
    }

    // Clean up browser
    await closeBrowser()

    logger.setMetadata('companies_checked', checkedRucs.size)
    return await logger.complete()
  } catch (error) {
    await closeBrowser()
    await logger.fail(error instanceof Error ? error : new Error(String(error)))
    throw error
  }
}

/**
 * Gets SUNAFIL violation summary for candidate's companies
 */
export async function getCandidateSunafilSummary(candidateId: string): Promise<{
  totalViolations: number
  graveViolations: number
  totalFines: number
  integrityPenalty: number
}> {
  const result = await sql`
    SELECT
      COUNT(*) as total_violations,
      COUNT(*) FILTER (WHERE cli.description ILIKE '%grave%' OR cli.fine_amount > 50000) as grave_violations,
      COALESCE(SUM(cli.fine_amount), 0) as total_fines
    FROM company_legal_issues cli
    JOIN candidate_companies cc ON cli.company_id = cc.id
    WHERE cc.candidate_id = ${candidateId}::uuid
      AND cli.institution = 'SUNAFIL'
  `

  const row = result[0] || { total_violations: 0, grave_violations: 0, total_fines: 0 }
  const violations = Number(row.total_violations) || 0
  const graveViolations = Number(row.grave_violations) || 0

  // Calculate penalty - labor violations are serious
  let penalty = 0
  penalty += Math.min(graveViolations * 20, 40) // 20 pts per grave violation, max 40
  penalty += Math.min((violations - graveViolations) * 5, 20) // 5 pts per other violation, max 20

  return {
    totalViolations: violations,
    graveViolations,
    totalFines: Number(row.total_fines) || 0,
    integrityPenalty: Math.min(penalty, 50),
  }
}

export { getCompaniesForSunafilCheck, searchSunafilByRUC }
