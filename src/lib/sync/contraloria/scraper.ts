/**
 * Contraloría Audit Reports Scraper with Puppeteer
 *
 * Fetches audit reports and findings from the Peruvian Comptroller General.
 * Uses Puppeteer for real browser navigation since the portal uses JavaScript.
 *
 * Source: https://apps.contraloria.gob.pe/ciudadano/
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

const CONTRALORIA_BASE_URL = 'https://apps.contraloria.gob.pe/ciudadano'
const DELAY_MS = 2000

interface AuditReport {
  reportId: string
  reportNumber: string
  title: string
  entityName: string
  entityCode: string
  auditType: 'control_simultaneo' | 'control_posterior' | 'servicio_control'
  period: string
  findingsCount: number
  recommendationsCount: number
  hasCriminalReferral: boolean
  amountObserved?: number
  status: 'en_proceso' | 'concluido' | 'archivado'
  publishDate: string
  sourceUrl: string
}

interface IncumbentCandidate {
  id: string
  fullName: string
  cargoActual: string
  entidad: string
  entidadCodigo?: string
}

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Gets candidates who are currently incumbents (in office)
 */
async function getIncumbentCandidates(): Promise<IncumbentCandidate[]> {
  const result = await sql`
    SELECT
      c.id,
      c.full_name,
      ip.cargo_actual,
      ip.entidad
    FROM candidates c
    JOIN incumbent_performance ip ON c.id = ip.candidate_id
    WHERE c.is_active = true
    UNION
    SELECT
      c.id,
      c.full_name,
      CASE
        WHEN c.cargo = 'presidente' THEN 'alcalde'
        WHEN c.cargo IN ('senador', 'diputado') THEN 'congresista'
        ELSE c.cargo
      END as cargo_actual,
      NULL as entidad
    FROM candidates c
    WHERE c.is_active = true
      AND EXISTS (
        SELECT 1 FROM jsonb_array_elements(c.political_trajectory) as pt
        WHERE (pt->>'year_end' IS NULL OR (pt->>'year_end')::int >= 2024)
          AND (
            pt->>'position' ILIKE '%alcalde%'
            OR pt->>'position' ILIKE '%gobernador%'
            OR pt->>'position' ILIKE '%congresista%'
          )
      )
  `

  return result.map((r) => ({
    id: r.id as string,
    fullName: r.full_name as string,
    cargoActual: r.cargo_actual as string,
    entidad: r.entidad as string,
  }))
}

/**
 * Maps entity names to Contraloría search terms
 */
const ENTITY_SEARCH_TERMS: Record<string, { code: string; searchTerm: string }> = {
  'municipalidad metropolitana de lima': {
    code: 'E0001',
    searchTerm: 'MUNICIPALIDAD METROPOLITANA DE LIMA',
  },
  'municipalidad de lima': {
    code: 'E0001',
    searchTerm: 'MUNICIPALIDAD METROPOLITANA DE LIMA',
  },
  'lima metropolitana': {
    code: 'E0001',
    searchTerm: 'MUNICIPALIDAD METROPOLITANA DE LIMA',
  },
  'gobierno regional de lima': {
    code: 'E0101',
    searchTerm: 'GOBIERNO REGIONAL DE LIMA',
  },
  'gobierno regional del callao': {
    code: 'E0102',
    searchTerm: 'GOBIERNO REGIONAL DEL CALLAO',
  },
  'congreso de la república': {
    code: 'E0500',
    searchTerm: 'CONGRESO DE LA REPUBLICA',
  },
  'congreso': {
    code: 'E0500',
    searchTerm: 'CONGRESO DE LA REPUBLICA',
  },
}

function getEntitySearchTerm(entidad: string): { code: string; searchTerm: string } | null {
  const normalized = entidad.toLowerCase().trim()
  for (const [key, value] of Object.entries(ENTITY_SEARCH_TERMS)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return value
    }
  }
  return null
}

/**
 * Fetches audit reports using Puppeteer
 */
async function fetchAuditReports(entity: { code: string; searchTerm: string }): Promise<AuditReport[]> {
  const browser = await getBrowser()
  const page = await createPage(browser)
  const reports: AuditReport[] = []

  try {
    console.log(`[Contraloria] Navigating to search for ${entity.searchTerm}...`)

    // Navigate to the main search page
    const searchUrl = `${CONTRALORIA_BASE_URL}/wfm_InformesControl.aspx`
    await page.goto(searchUrl, { waitUntil: 'networkidle2' })
    await delay(2000)

    await debugScreenshot(page, 'contraloria-initial')

    // Try to find and fill the search field
    const searchSelectors = [
      '#txtEntidad',
      'input[name*="entidad"]',
      'input[placeholder*="entidad"]',
      '#ContentPlaceHolder1_txtEntidad',
    ]

    let searchInput = null
    for (const selector of searchSelectors) {
      searchInput = await page.$(selector)
      if (searchInput) break
    }

    if (searchInput) {
      // Clear and type the search term
      await searchInput.click({ clickCount: 3 })
      await searchInput.type(entity.searchTerm)
      await delay(500)

      // Try to click the search button
      const searchButtons = [
        '#btnBuscar',
        'button[type="submit"]',
        'input[type="submit"]',
        '#ContentPlaceHolder1_btnBuscar',
        '.btn-buscar',
      ]

      for (const btnSelector of searchButtons) {
        const btn = await page.$(btnSelector)
        if (btn) {
          await btn.click()
          break
        }
      }

      await delay(3000)
      await debugScreenshot(page, 'contraloria-after-search')
    }

    // Wait for results to load
    try {
      await page.waitForSelector('table, .resultados, #gridResults', { timeout: 10000 })
    } catch {
      console.log('[Contraloria] No results table found, trying alternative approach...')
    }

    // Extract reports from the page
    const extractedReports = await page.evaluate((searchTerm) => {
      const reports: Array<{
        reportNumber: string
        title: string
        findings: number
        recommendations: number
        hasCriminalReferral: boolean
        status: string
        date: string
      }> = []

      // Try multiple table structures
      const tables = document.querySelectorAll('table')
      tables.forEach((table) => {
        const rows = table.querySelectorAll('tr')
        rows.forEach((row) => {
          const text = row.textContent || ''
          const cells = row.querySelectorAll('td')

          // Skip header rows or rows without data
          if (cells.length < 3) return
          if (!text.toUpperCase().includes(searchTerm.toUpperCase()) &&
              !text.includes('Informe') && !text.includes('N°')) return

          const reportNumber = cells[0]?.textContent?.trim() || ''
          const title = cells[1]?.textContent?.trim() || ''

          // Parse findings and recommendations from title
          const findingsMatch = title.match(/(\d+)\s*hallazgo/i)
          const recsMatch = title.match(/(\d+)\s*recomendaci/i)

          // Check for criminal referral indicators
          const hasCriminalReferral =
            text.toLowerCase().includes('penal') ||
            text.toLowerCase().includes('fiscal') ||
            text.toLowerCase().includes('ministerio público') ||
            text.toLowerCase().includes('delito')

          // Get status
          let status = 'concluido'
          if (text.toLowerCase().includes('proceso')) status = 'en_proceso'
          if (text.toLowerCase().includes('archivado')) status = 'archivado'

          // Get date
          const dateMatch = text.match(/\d{2}[/-]\d{2}[/-]\d{4}/)

          if (reportNumber || title) {
            reports.push({
              reportNumber,
              title,
              findings: findingsMatch ? parseInt(findingsMatch[1]) : 0,
              recommendations: recsMatch ? parseInt(recsMatch[1]) : 0,
              hasCriminalReferral,
              status,
              date: dateMatch ? dateMatch[0] : new Date().toISOString().split('T')[0],
            })
          }
        })
      })

      // Also try div-based layouts
      const items = document.querySelectorAll('.informe-item, .report-item, .resultado')
      items.forEach((item) => {
        const text = item.textContent || ''
        const reportNumber = item.querySelector('.numero, .report-number')?.textContent?.trim() || ''
        const title = item.querySelector('.titulo, .title, .descripcion')?.textContent?.trim() || ''

        if (reportNumber || title) {
          const findingsMatch = text.match(/(\d+)\s*hallazgo/i)
          const recsMatch = text.match(/(\d+)\s*recomendaci/i)

          reports.push({
            reportNumber,
            title,
            findings: findingsMatch ? parseInt(findingsMatch[1]) : 0,
            recommendations: recsMatch ? parseInt(recsMatch[1]) : 0,
            hasCriminalReferral: text.toLowerCase().includes('penal') || text.toLowerCase().includes('fiscal'),
            status: 'concluido',
            date: new Date().toISOString().split('T')[0],
          })
        }
      })

      return reports
    }, entity.searchTerm)

    // Convert to AuditReport format
    for (const extracted of extractedReports) {
      reports.push({
        reportId: extracted.reportNumber.replace(/[^\w]/g, '') || `RPT-${Date.now()}`,
        reportNumber: extracted.reportNumber,
        title: extracted.title,
        entityName: entity.searchTerm,
        entityCode: entity.code,
        auditType: extracted.title.toLowerCase().includes('simultáneo')
          ? 'control_simultaneo'
          : 'control_posterior',
        period: new Date().getFullYear().toString(),
        findingsCount: extracted.findings,
        recommendationsCount: extracted.recommendations,
        hasCriminalReferral: extracted.hasCriminalReferral,
        status: extracted.status as AuditReport['status'],
        publishDate: extracted.date,
        sourceUrl: searchUrl,
      })
    }

    // If no reports found via scraping, try the direct API
    if (reports.length === 0) {
      const apiReports = await tryContraloriaApi(entity)
      reports.push(...apiReports)
    }

    console.log(`[Contraloria] Found ${reports.length} reports for ${entity.searchTerm}`)

    return reports
  } catch (error) {
    console.error(`[Contraloria] Error fetching reports:`, error)
    await debugScreenshot(page, 'contraloria-error')
    return reports
  } finally {
    await page.close()
  }
}

/**
 * Try the Contraloría API directly
 */
async function tryContraloriaApi(entity: { code: string; searchTerm: string }): Promise<AuditReport[]> {
  const reports: AuditReport[] = []

  try {
    // Try the SIAF-like endpoint
    const apiUrl = `https://apps.contraloria.gob.pe/api/informes?entidad=${encodeURIComponent(entity.searchTerm)}`

    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
      },
    })

    if (response.ok) {
      const data = await response.json()
      if (Array.isArray(data)) {
        for (const item of data) {
          reports.push({
            reportId: String(item.id || item.numero || Date.now()),
            reportNumber: String(item.numero || ''),
            title: String(item.titulo || item.descripcion || ''),
            entityName: entity.searchTerm,
            entityCode: entity.code,
            auditType: 'control_posterior',
            period: String(item.periodo || new Date().getFullYear()),
            findingsCount: Number(item.hallazgos) || 0,
            recommendationsCount: Number(item.recomendaciones) || 0,
            hasCriminalReferral: Boolean(item.referido_penal),
            status: 'concluido',
            publishDate: String(item.fecha || new Date().toISOString().split('T')[0]),
            sourceUrl: apiUrl,
          })
        }
      }
    }
  } catch {
    // API not available, that's fine
  }

  return reports
}

/**
 * Saves audit report to database
 */
async function saveAuditReport(candidateId: string, report: AuditReport): Promise<void> {
  // Update incumbent_performance with Contraloría data
  await sql`
    UPDATE incumbent_performance
    SET
      contraloria_reports = COALESCE(contraloria_reports, 0) + 1,
      contraloria_findings = COALESCE(contraloria_findings, 0) + ${report.findingsCount},
      contraloria_recommendations = COALESCE(contraloria_recommendations, 0) + ${report.recommendationsCount},
      has_criminal_referral = has_criminal_referral OR ${report.hasCriminalReferral},
      data_sources = data_sources || ${JSON.stringify([{
        source: 'contraloria',
        report_id: report.reportId,
        report_number: report.reportNumber,
        findings: report.findingsCount,
        fetchedAt: new Date().toISOString(),
      }])}::jsonb,
      last_updated = NOW()
    WHERE candidate_id = ${candidateId}::uuid
  `
}

/**
 * Main sync function for Contraloría reports
 */
export async function syncContraloriaReports(): Promise<{
  records_processed: number
  records_updated: number
  records_created: number
  records_skipped: number
}> {
  const logger = createSyncLogger('contraloria')
  await logger.start()

  try {
    await logger.markRunning()

    const incumbents = await getIncumbentCandidates()
    console.log(`[Contraloria] Found ${incumbents.length} incumbent candidates to check`)

    const processedEntities = new Set<string>()

    for (const incumbent of incumbents) {
      logger.incrementProcessed()

      if (!incumbent.entidad) {
        logger.incrementSkipped()
        continue
      }

      const entityInfo = getEntitySearchTerm(incumbent.entidad)
      if (!entityInfo || processedEntities.has(entityInfo.code)) {
        logger.incrementSkipped()
        continue
      }

      processedEntities.add(entityInfo.code)

      console.log(`[Contraloria] Checking reports for ${incumbent.entidad} (${entityInfo.code})`)

      const reports = await withRetry(
        () => fetchAuditReports(entityInfo),
        2,
        3000
      )

      for (const report of reports) {
        try {
          await saveAuditReport(incumbent.id, report)
          logger.incrementUpdated()
        } catch (error) {
          console.error(`[Contraloria] Error saving report:`, error)
          logger.incrementSkipped()
        }
      }

      await delay(DELAY_MS)
    }

    // Clean up browser
    await closeBrowser()

    logger.setMetadata('entities_checked', processedEntities.size)
    return await logger.complete()
  } catch (error) {
    await closeBrowser()
    await logger.fail(error instanceof Error ? error : new Error(String(error)))
    throw error
  }
}

/**
 * Gets audit summary for a candidate
 */
export async function getCandidateAuditSummary(candidateId: string): Promise<{
  hasAuditData: boolean
  totalReports: number
  totalFindings: number
  totalRecommendations: number
  hasCriminalReferral: boolean
  integrityPenalty: number
} | null> {
  const result = await sql`
    SELECT
      contraloria_reports,
      contraloria_findings,
      contraloria_recommendations,
      has_criminal_referral
    FROM incumbent_performance
    WHERE candidate_id = ${candidateId}::uuid
    ORDER BY last_updated DESC
    LIMIT 1
  `

  if (result.length === 0) {
    return null
  }

  const row = result[0]
  const reports = Number(row.contraloria_reports) || 0
  const findings = Number(row.contraloria_findings) || 0
  const recommendations = Number(row.contraloria_recommendations) || 0
  const hasCriminalReferral = Boolean(row.has_criminal_referral)

  // Calculate penalty
  let penalty = 0
  if (hasCriminalReferral) {
    penalty += 40 // Serious - criminal referral
  }
  penalty += Math.min(findings * 5, 30) // 5 points per finding, max 30
  penalty += Math.min(recommendations * 2, 15) // 2 points per recommendation, max 15

  return {
    hasAuditData: reports > 0,
    totalReports: reports,
    totalFindings: findings,
    totalRecommendations: recommendations,
    hasCriminalReferral,
    integrityPenalty: Math.min(penalty, 60),
  }
}

export { getIncumbentCandidates, fetchAuditReports }
