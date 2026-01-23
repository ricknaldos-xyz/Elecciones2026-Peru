/**
 * OEFA Environmental Violations Scraper with Puppeteer
 *
 * Fetches environmental violations and sanctions from OEFA for
 * companies linked to candidates.
 *
 * Source: https://www.oefa.gob.pe/
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

// OEFA consultation portal
const OEFA_CONSULTA_URL = 'https://apps.oefa.gob.pe/sania/consultaSanciones.php'
const OEFA_BASE_URL = 'https://www.oefa.gob.pe'
const DELAY_MS = 2000

interface OefaViolation {
  violationId: string
  companyRuc: string
  violationType: 'contaminacion_aire' | 'contaminacion_agua' | 'residuos' | 'ruido' | 'otros'
  severity: 'leve' | 'grave' | 'muy_grave'
  description: string
  status: 'en_proceso' | 'sancionado' | 'apelacion' | 'archivado'
  fineAmount?: number
  remediationRequired: boolean
  inspectionDate: string
  resolutionDate?: string
  sourceUrl: string
}

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Gets companies for OEFA check
 */
async function getCompaniesForOefaCheck(): Promise<Array<{
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
 * Searches OEFA violations by company RUC using Puppeteer
 */
async function searchOefaByRUC(ruc: string): Promise<OefaViolation[]> {
  const browser = await getBrowser()
  const page = await createPage(browser)
  const violations: OefaViolation[] = []

  try {
    console.log(`[OEFA] Searching environmental sanctions for RUC ${ruc}...`)

    // Navigate to OEFA sanctions consultation
    await page.goto(OEFA_CONSULTA_URL, { waitUntil: 'networkidle2' })
    await delay(2000)

    await debugScreenshot(page, 'oefa-initial')

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
      await debugScreenshot(page, 'oefa-after-search')

      // Wait for results
      try {
        await page.waitForSelector('table, .resultados, #gridSanciones, .sancion-item', {
          timeout: 10000,
        })
      } catch {
        console.log('[OEFA] No results container found')
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
          remediation: boolean
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
            if (!text.includes(searchRuc) && !text.toLowerCase().includes('sanción') && !text.toLowerCase().includes('infracción')) return

            // Parse violation type
            let type = 'otros'
            if (text.toLowerCase().includes('aire') || text.toLowerCase().includes('emisiones')) {
              type = 'contaminacion_aire'
            } else if (text.toLowerCase().includes('agua') || text.toLowerCase().includes('efluente')) {
              type = 'contaminacion_agua'
            } else if (text.toLowerCase().includes('residuo') || text.toLowerCase().includes('desecho')) {
              type = 'residuos'
            } else if (text.toLowerCase().includes('ruido') || text.toLowerCase().includes('sonoro')) {
              type = 'ruido'
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

            // Parse fine amount (OEFA fines are usually in UIT or soles)
            const fineMatch = text.match(/s\/?\s*([\d,]+(?:\.\d{2})?)/i) || text.match(/([\d,]+)\s*UIT/i)
            let fine = 0
            if (fineMatch) {
              fine = parseFloat(fineMatch[1].replace(/,/g, ''))
              // If in UIT, convert (1 UIT ~= 5150 soles in 2024)
              if (text.toLowerCase().includes('uit')) {
                fine *= 5150
              }
            }

            // Parse date
            const dateMatch = text.match(/\d{2}[/-]\d{2}[/-]\d{4}/)

            // Check if remediation required
            const remediation = text.toLowerCase().includes('remediación') ||
              text.toLowerCase().includes('restauración') ||
              text.toLowerCase().includes('medida correctiva')

            violations.push({
              type,
              severity,
              description: cells[1]?.textContent?.trim() || cells[0]?.textContent?.trim() || text.substring(0, 200),
              status,
              fine,
              date: dateMatch ? dateMatch[0] : new Date().toISOString().split('T')[0],
              remediation,
            })
          })
        })

        // Also try div-based layouts
        const items = document.querySelectorAll('.sancion-item, .violation-item, .resultado')
        items.forEach((item) => {
          const text = item.textContent || ''
          const fineMatch = text.match(/s\/?\s*([\d,]+(?:\.\d{2})?)/i) || text.match(/([\d,]+)\s*UIT/i)
          const dateMatch = text.match(/\d{2}[/-]\d{2}[/-]\d{4}/)

          let fine = 0
          if (fineMatch) {
            fine = parseFloat(fineMatch[1].replace(/,/g, ''))
            if (text.toLowerCase().includes('uit')) {
              fine *= 5150
            }
          }

          violations.push({
            type: 'otros',
            severity: text.toLowerCase().includes('grave') ? 'grave' : 'leve',
            description: text.substring(0, 200),
            status: 'sancionado',
            fine,
            date: dateMatch ? dateMatch[0] : new Date().toISOString().split('T')[0],
            remediation: text.toLowerCase().includes('remediación'),
          })
        })

        return violations
      }, ruc)

      // Convert to OefaViolation format
      for (let i = 0; i < extractedViolations.length; i++) {
        const v = extractedViolations[i]
        violations.push({
          violationId: `OEFA-${ruc}-${Date.now()}-${i}`,
          companyRuc: ruc,
          violationType: v.type as OefaViolation['violationType'],
          severity: v.severity as OefaViolation['severity'],
          description: v.description,
          status: v.status as OefaViolation['status'],
          fineAmount: v.fine || undefined,
          remediationRequired: v.remediation,
          inspectionDate: v.date,
          sourceUrl: OEFA_CONSULTA_URL,
        })
      }
    }

    console.log(`[OEFA] Found ${violations.length} violations for RUC ${ruc}`)

    return violations
  } catch (error) {
    console.error(`[OEFA] Error searching RUC ${ruc}:`, error)
    await debugScreenshot(page, 'oefa-error')
    return violations
  } finally {
    await page.close()
  }
}

/**
 * Saves OEFA violation to database
 */
async function saveOefaViolation(companyId: string, violation: OefaViolation): Promise<void> {
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
      'ambiental',
      ${violation.description},
      ${violation.violationId},
      'OEFA',
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
 * Main sync function for OEFA violations
 */
export async function syncOefaViolations(): Promise<{
  records_processed: number
  records_updated: number
  records_created: number
  records_skipped: number
}> {
  const logger = createSyncLogger('oefa')
  await logger.start()

  try {
    await logger.markRunning()

    const companies = await getCompaniesForOefaCheck()
    console.log(`[OEFA] Found ${companies.length} companies to check`)

    const checkedRucs = new Set<string>()

    for (const company of companies) {
      logger.incrementProcessed()

      if (checkedRucs.has(company.ruc)) {
        logger.incrementSkipped()
        continue
      }
      checkedRucs.add(company.ruc)

      const violations = await withRetry(
        () => searchOefaByRUC(company.ruc),
        2,
        3000
      )

      for (const violation of violations) {
        try {
          await saveOefaViolation(company.companyId, violation)
          logger.incrementCreated()
        } catch (error) {
          console.error(`[OEFA] Error saving violation:`, error)
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
 * Gets OEFA violation summary for candidate's companies
 */
export async function getCandidateOefaSummary(candidateId: string): Promise<{
  totalViolations: number
  graveViolations: number
  totalFines: number
  integrityPenalty: number
}> {
  const result = await sql`
    SELECT
      COUNT(*) as total_violations,
      COUNT(*) FILTER (WHERE cli.description ILIKE '%grave%' OR cli.fine_amount > 100000) as grave_violations,
      COALESCE(SUM(cli.fine_amount), 0) as total_fines
    FROM company_legal_issues cli
    JOIN candidate_companies cc ON cli.company_id = cc.id
    WHERE cc.candidate_id = ${candidateId}::uuid
      AND cli.institution = 'OEFA'
  `

  const row = result[0] || { total_violations: 0, grave_violations: 0, total_fines: 0 }
  const violations = Number(row.total_violations) || 0
  const graveViolations = Number(row.grave_violations) || 0

  // Calculate penalty - environmental violations are serious
  let penalty = 0
  penalty += Math.min(graveViolations * 25, 50) // 25 pts per grave violation, max 50
  penalty += Math.min((violations - graveViolations) * 10, 25) // 10 pts per other violation, max 25

  return {
    totalViolations: violations,
    graveViolations,
    totalFines: Number(row.total_fines) || 0,
    integrityPenalty: Math.min(penalty, 60),
  }
}

/**
 * Gets combined company issues summary for a candidate
 */
export async function getCandidateCompanyIssuesSummary(candidateId: string): Promise<{
  totalIssues: number
  byType: {
    penal: number
    laboral: number
    ambiental: number
    consumidor: number
    tributario: number
    other: number
  }
  totalFines: number
  integrityPenalty: number
}> {
  const result = await sql`
    SELECT
      cli.issue_type,
      COUNT(*) as count,
      COALESCE(SUM(cli.fine_amount), 0) as total_fines
    FROM company_legal_issues cli
    JOIN candidate_companies cc ON cli.company_id = cc.id
    WHERE cc.candidate_id = ${candidateId}::uuid
    GROUP BY cli.issue_type
  `

  const byType = {
    penal: 0,
    laboral: 0,
    ambiental: 0,
    consumidor: 0,
    tributario: 0,
    other: 0,
  }

  let totalFines = 0

  for (const row of result) {
    const type = row.issue_type as string
    const count = Number(row.count) || 0
    totalFines += Number(row.total_fines) || 0

    if (type in byType) {
      byType[type as keyof typeof byType] = count
    } else {
      byType.other += count
    }
  }

  const totalIssues = Object.values(byType).reduce((a, b) => a + b, 0)

  // Calculate penalty
  let penalty = 0
  penalty += byType.penal * 40 // Penal cases are most serious
  penalty += byType.laboral * 20
  penalty += byType.ambiental * 25
  penalty += byType.consumidor * 5
  penalty += byType.tributario * 15
  penalty += byType.other * 10

  return {
    totalIssues,
    byType,
    totalFines,
    integrityPenalty: Math.min(penalty, 60),
  }
}

export { getCompaniesForOefaCheck, searchOefaByRUC }
