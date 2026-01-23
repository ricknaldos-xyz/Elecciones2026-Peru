/**
 * INDECOPI Consumer Complaints Scraper with Puppeteer
 *
 * Fetches consumer complaints and sanctions from INDECOPI's
 * "Mira a Quién le Compras" portal for companies linked to candidates.
 *
 * Source: https://servicio.indecopi.gob.pe/appMQLC/
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

// The actual INDECOPI "Mira a quien le compras" portal URL
const INDECOPI_MQLC_URL = 'https://servicio.indecopi.gob.pe/appMQLC/'
const DELAY_MS = 2000

interface IndecopiComplaint {
  complaintId: string
  companyRuc: string
  companyName: string
  complaintType: 'libro_reclamaciones' | 'denuncia' | 'sancion'
  description: string
  status: 'en_proceso' | 'resuelto' | 'archivado'
  resolution?: 'fundada' | 'infundada' | 'conciliacion'
  fineAmount?: number
  complaintDate: string
  resolutionDate?: string
  sourceUrl: string
}

interface CompanyStats {
  ruc: string
  companyName: string
  totalComplaints: number
  resolvedFavorably: number
  resolvedUnfavorably: number
  pendingComplaints: number
  averageResolutionDays: number
}

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Gets companies linked to candidates for INDECOPI check
 */
async function getCompaniesForIndecopiCheck(): Promise<Array<{
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
 * Searches INDECOPI complaints by company RUC using Puppeteer
 */
async function searchIndecopiByRUC(ruc: string): Promise<{
  complaints: IndecopiComplaint[]
  stats: CompanyStats | null
}> {
  const browser = await getBrowser()
  const page = await createPage(browser)
  const complaints: IndecopiComplaint[] = []
  let stats: CompanyStats | null = null

  try {
    console.log(`[INDECOPI] Searching "Mira a Quién le Compras" for RUC ${ruc}...`)

    // Navigate to the portal
    await page.goto(INDECOPI_MQLC_URL, { waitUntil: 'networkidle2' })
    await delay(2000)

    await debugScreenshot(page, 'indecopi-initial')

    // Find the RUC input field
    const rucSelectors = [
      '#txtRuc',
      'input[name="ruc"]',
      'input[placeholder*="RUC"]',
      '#ruc',
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
        'button:contains("Buscar")',
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
      await debugScreenshot(page, 'indecopi-after-search')

      // Wait for results
      try {
        await page.waitForSelector('.resultados, table, #gridResultados, .empresa-info', {
          timeout: 10000,
        })
      } catch {
        console.log('[INDECOPI] No results container found')
      }

      // Extract data from the page
      const extractedData = await page.evaluate((searchRuc) => {
        const result = {
          companyName: '',
          totalComplaints: 0,
          resolvedFavorably: 0,
          resolvedUnfavorably: 0,
          pendingComplaints: 0,
          averageResolutionDays: 0,
          complaints: [] as Array<{
            type: string
            description: string
            status: string
            date: string
            resolution: string
            fine: number
          }>,
        }

        // Try to extract company name
        const nameEl = document.querySelector('.nombre-empresa, .empresa-name, h2, h3')
        if (nameEl) {
          result.companyName = nameEl.textContent?.trim() || ''
        }

        // Try to extract statistics (MQLC shows complaint statistics)
        const statsElements = document.querySelectorAll('.estadistica, .stat-item, .indicador')
        statsElements.forEach((el) => {
          const text = el.textContent?.toLowerCase() || ''
          const numberMatch = text.match(/\d+/)
          const number = numberMatch ? parseInt(numberMatch[0]) : 0

          if (text.includes('total') || text.includes('reclamos')) {
            result.totalComplaints = number
          } else if (text.includes('resuelto') && text.includes('favor')) {
            result.resolvedFavorably = number
          } else if (text.includes('no') && text.includes('favor')) {
            result.resolvedUnfavorably = number
          } else if (text.includes('pendiente') || text.includes('proceso')) {
            result.pendingComplaints = number
          }
        })

        // Try to extract from summary table/div
        const summaryText = document.body.textContent || ''

        // Parse total complaints from text
        const totalMatch = summaryText.match(/total[:\s]+(\d+)/i)
        if (totalMatch && !result.totalComplaints) {
          result.totalComplaints = parseInt(totalMatch[1])
        }

        // Extract detailed complaints if available
        const tables = document.querySelectorAll('table')
        tables.forEach((table) => {
          const rows = table.querySelectorAll('tr')
          rows.forEach((row) => {
            const cells = row.querySelectorAll('td')
            if (cells.length >= 3) {
              const text = row.textContent || ''
              if (text.includes(searchRuc) || text.toLowerCase().includes('reclamo')) {
                result.complaints.push({
                  type: cells[0]?.textContent?.trim() || 'denuncia',
                  description: cells[1]?.textContent?.trim() || '',
                  status: cells[2]?.textContent?.trim() || '',
                  date: cells[3]?.textContent?.trim() || new Date().toISOString().split('T')[0],
                  resolution: cells[4]?.textContent?.trim() || '',
                  fine: 0,
                })
              }
            }
          })
        })

        return result
      }, ruc)

      // Build stats object
      if (extractedData.companyName || extractedData.totalComplaints > 0) {
        stats = {
          ruc,
          companyName: extractedData.companyName || ruc,
          totalComplaints: extractedData.totalComplaints,
          resolvedFavorably: extractedData.resolvedFavorably,
          resolvedUnfavorably: extractedData.resolvedUnfavorably,
          pendingComplaints: extractedData.pendingComplaints,
          averageResolutionDays: extractedData.averageResolutionDays,
        }
      }

      // Convert extracted complaints to proper format
      for (const c of extractedData.complaints) {
        let complaintType: IndecopiComplaint['complaintType'] = 'denuncia'
        if (c.type.toLowerCase().includes('libro') || c.type.toLowerCase().includes('reclamacion')) {
          complaintType = 'libro_reclamaciones'
        } else if (c.type.toLowerCase().includes('sancion') || c.type.toLowerCase().includes('multa')) {
          complaintType = 'sancion'
        }

        let status: IndecopiComplaint['status'] = 'en_proceso'
        if (c.status.toLowerCase().includes('resuelto') || c.status.toLowerCase().includes('concluido')) {
          status = 'resuelto'
        } else if (c.status.toLowerCase().includes('archivado')) {
          status = 'archivado'
        }

        complaints.push({
          complaintId: `INDECOPI-${ruc}-${Date.now()}-${complaints.length}`,
          companyRuc: ruc,
          companyName: extractedData.companyName || '',
          complaintType,
          description: c.description,
          status,
          resolution: c.resolution as IndecopiComplaint['resolution'],
          fineAmount: c.fine || undefined,
          complaintDate: c.date,
          sourceUrl: INDECOPI_MQLC_URL,
        })
      }

      // If we got stats but no detailed complaints, create summary complaints
      if (stats && complaints.length === 0 && stats.totalComplaints > 0) {
        // Create summary records based on stats
        if (stats.resolvedUnfavorably > 0) {
          complaints.push({
            complaintId: `INDECOPI-${ruc}-sanctions`,
            companyRuc: ruc,
            companyName: stats.companyName,
            complaintType: 'sancion',
            description: `${stats.resolvedUnfavorably} reclamos resueltos a favor del consumidor`,
            status: 'resuelto',
            resolution: 'fundada',
            complaintDate: new Date().toISOString().split('T')[0],
            sourceUrl: INDECOPI_MQLC_URL,
          })
        }

        if (stats.pendingComplaints > 0) {
          complaints.push({
            complaintId: `INDECOPI-${ruc}-pending`,
            companyRuc: ruc,
            companyName: stats.companyName,
            complaintType: 'denuncia',
            description: `${stats.pendingComplaints} reclamos en proceso`,
            status: 'en_proceso',
            complaintDate: new Date().toISOString().split('T')[0],
            sourceUrl: INDECOPI_MQLC_URL,
          })
        }
      }
    }

    console.log(`[INDECOPI] Found ${complaints.length} complaints for RUC ${ruc}`)

    return { complaints, stats }
  } catch (error) {
    console.error(`[INDECOPI] Error searching RUC ${ruc}:`, error)
    await debugScreenshot(page, 'indecopi-error')
    return { complaints, stats }
  } finally {
    await page.close()
  }
}

/**
 * Saves INDECOPI complaint to database
 */
async function saveIndecopiComplaint(companyId: string, complaint: IndecopiComplaint): Promise<void> {
  await sql`
    INSERT INTO company_legal_issues (
      company_id,
      issue_type,
      description,
      case_number,
      institution,
      status,
      resolution,
      fine_amount,
      issue_date,
      resolution_date,
      source_url
    ) VALUES (
      ${companyId}::uuid,
      'consumidor',
      ${complaint.description},
      ${complaint.complaintId},
      'INDECOPI',
      ${complaint.status},
      ${complaint.resolution || null},
      ${complaint.fineAmount || null},
      ${complaint.complaintDate}::date,
      ${complaint.resolutionDate ? complaint.resolutionDate : null}::date,
      ${complaint.sourceUrl}
    )
    ON CONFLICT DO NOTHING
  `
}

/**
 * Main sync function for INDECOPI complaints
 */
export async function syncIndecopiComplaints(): Promise<{
  records_processed: number
  records_updated: number
  records_created: number
  records_skipped: number
}> {
  const logger = createSyncLogger('indecopi')
  await logger.start()

  try {
    await logger.markRunning()

    const companies = await getCompaniesForIndecopiCheck()
    console.log(`[INDECOPI] Found ${companies.length} companies to check`)

    const checkedRucs = new Set<string>()

    for (const company of companies) {
      logger.incrementProcessed()

      if (checkedRucs.has(company.ruc)) {
        logger.incrementSkipped()
        continue
      }
      checkedRucs.add(company.ruc)

      const { complaints } = await withRetry(
        () => searchIndecopiByRUC(company.ruc),
        2,
        3000
      )

      for (const complaint of complaints) {
        try {
          await saveIndecopiComplaint(company.companyId, complaint)
          logger.incrementCreated()
        } catch (error) {
          console.error(`[INDECOPI] Error saving complaint:`, error)
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
 * Gets INDECOPI complaint summary for candidate's companies
 */
export async function getCandidateIndecopiSummary(candidateId: string): Promise<{
  totalComplaints: number
  totalSanctions: number
  totalFines: number
  integrityPenalty: number
}> {
  const result = await sql`
    SELECT
      COUNT(*) as total_complaints,
      COUNT(*) FILTER (WHERE cli.resolution = 'fundada' OR cli.fine_amount > 0) as total_sanctions,
      COALESCE(SUM(cli.fine_amount), 0) as total_fines
    FROM company_legal_issues cli
    JOIN candidate_companies cc ON cli.company_id = cc.id
    WHERE cc.candidate_id = ${candidateId}::uuid
      AND cli.institution = 'INDECOPI'
  `

  const row = result[0] || { total_complaints: 0, total_sanctions: 0, total_fines: 0 }
  const complaints = Number(row.total_complaints) || 0
  const sanctions = Number(row.total_sanctions) || 0

  // Calculate penalty
  let penalty = 0
  if (sanctions > 5) {
    penalty = 15 // Many sanctions
  } else if (sanctions > 0) {
    penalty = 10 // Some sanctions
  } else if (complaints > 10) {
    penalty = 5 // Many complaints
  }

  return {
    totalComplaints: complaints,
    totalSanctions: sanctions,
    totalFines: Number(row.total_fines) || 0,
    integrityPenalty: penalty,
  }
}

export { getCompaniesForIndecopiCheck, searchIndecopiByRUC }
