/**
 * MEF Budget Execution Scraper with Puppeteer
 *
 * Fetches budget execution data from the Ministry of Economy and Finance.
 * Uses Puppeteer for real browser navigation since MEF uses JavaScript rendering.
 *
 * Source: https://apps5.mineco.gob.pe/transparencia/Navegador/default.aspx (Consulta Amigable)
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

const MEF_URL = 'https://apps5.mineco.gob.pe/transparencia/Navegador/default.aspx'
const DELAY_MS = 2000

interface BudgetExecution {
  entityCode: string
  entityName: string
  period: string
  pia: number // Presupuesto Institucional de Apertura
  pim: number // Presupuesto Institucional Modificado
  certified: number // Certificado
  committed: number // Comprometido
  accrued: number // Devengado
  paid: number // Girado
  executionPct: number // % Ejecución (Devengado/PIM)
}

interface IncumbentEntity {
  candidateId: string
  fullName: string
  cargoActual: string
  entidad: string
  entidadCodigo?: string
}

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Maps entity names to MEF entity codes and search terms
 */
const MEF_ENTITY_CODES: Record<string, { nivel: string; sector: string; pliego: string; searchTerm: string }> = {
  'municipalidad metropolitana de lima': {
    nivel: 'M',
    sector: '99',
    pliego: '150101',
    searchTerm: 'MUNICIPALIDAD METROPOLITANA DE LIMA'
  },
  'municipalidad de lima': {
    nivel: 'M',
    sector: '99',
    pliego: '150101',
    searchTerm: 'MUNICIPALIDAD METROPOLITANA DE LIMA'
  },
  'lima metropolitana': {
    nivel: 'M',
    sector: '99',
    pliego: '150101',
    searchTerm: 'MUNICIPALIDAD METROPOLITANA DE LIMA'
  },
  'gobierno regional de lima': {
    nivel: 'R',
    sector: '99',
    pliego: '464',
    searchTerm: 'GOBIERNO REGIONAL DE LIMA'
  },
  'gobierno regional del callao': {
    nivel: 'R',
    sector: '99',
    pliego: '463',
    searchTerm: 'GOBIERNO REGIONAL DEL CALLAO'
  },
  'gobierno regional de arequipa': {
    nivel: 'R',
    sector: '99',
    pliego: '443',
    searchTerm: 'GOBIERNO REGIONAL DE AREQUIPA'
  },
  'gobierno regional de la libertad': {
    nivel: 'R',
    sector: '99',
    pliego: '458',
    searchTerm: 'GOBIERNO REGIONAL DE LA LIBERTAD'
  },
  'gobierno regional de piura': {
    nivel: 'R',
    sector: '99',
    pliego: '468',
    searchTerm: 'GOBIERNO REGIONAL DE PIURA'
  },
  // Add more as needed
}

function getMefEntityCode(entidad: string): { nivel: string; sector: string; pliego: string; searchTerm: string } | null {
  const normalized = entidad.toLowerCase().trim()
  for (const [key, code] of Object.entries(MEF_ENTITY_CODES)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return code
    }
  }
  return null
}

/**
 * Gets incumbent candidates with their entities
 */
async function getIncumbentEntities(): Promise<IncumbentEntity[]> {
  const result = await sql`
    SELECT
      c.id as candidate_id,
      c.full_name,
      ip.cargo_actual,
      ip.entidad
    FROM candidates c
    JOIN incumbent_performance ip ON c.id = ip.candidate_id
    WHERE c.is_active = true
      AND ip.entidad IS NOT NULL
  `

  return result.map((r) => ({
    candidateId: r.candidate_id as string,
    fullName: r.full_name as string,
    cargoActual: r.cargo_actual as string,
    entidad: r.entidad as string,
  }))
}

/**
 * Fetches budget execution data using Puppeteer
 */
async function fetchBudgetExecution(
  entityCode: { nivel: string; sector: string; pliego: string; searchTerm: string },
  year: number = new Date().getFullYear()
): Promise<BudgetExecution | null> {
  const browser = await getBrowser()
  const page = await createPage(browser)

  try {
    console.log(`[MEF] Navigating to Consulta Amigable for ${entityCode.searchTerm}...`)

    // Navigate to MEF Consulta Amigable
    await page.goto(MEF_URL, { waitUntil: 'networkidle2' })
    await delay(2000)

    await debugScreenshot(page, 'mef-initial')

    // Select the year
    const yearSelector = '#ContentPlaceHolder1_ddl_anio, select[name*="anio"]'
    await page.waitForSelector(yearSelector, { timeout: 10000 })
    await page.select(yearSelector, year.toString())
    await delay(1000)

    // Select "Gobiernos Locales" for municipalities or "Gobiernos Regionales" for regions
    let nivelSelector = ''
    if (entityCode.nivel === 'M') {
      nivelSelector = 'M' // Municipalidades
    } else if (entityCode.nivel === 'R') {
      nivelSelector = 'R' // Regionales
    }

    // Try to select the government level
    const nivelDropdown = '#ContentPlaceHolder1_ddl_nivel, select[name*="nivel"]'
    try {
      await page.select(nivelDropdown, nivelSelector)
      await delay(1000)
    } catch {
      console.log('[MEF] Could not select nivel, continuing...')
    }

    await debugScreenshot(page, 'mef-after-level')

    // Search for the entity
    // First, try to find the entity in the list by clicking through
    const searchForEntity = async (): Promise<BudgetExecution | null> => {
      // Wait for the main data table to load
      await page.waitForSelector('table, .GridView', { timeout: 15000 })

      // Get all data from the page
      const budgetData = await page.evaluate((searchTerm) => {
        // Look for all tables on the page
        const tables = document.querySelectorAll('table')
        let result: BudgetExecution | null = null

        tables.forEach((table) => {
          const rows = table.querySelectorAll('tr')
          rows.forEach((row) => {
            const text = row.textContent || ''
            if (text.toUpperCase().includes(searchTerm.toUpperCase())) {
              const cells = row.querySelectorAll('td')
              if (cells.length >= 6) {
                const parseAmount = (text: string): number => {
                  const cleaned = text.replace(/[^\d.,]/g, '').replace(',', '')
                  return parseFloat(cleaned) || 0
                }

                // Try to extract budget data from cells
                // Format typically: Entity | PIA | PIM | Cert | Comp | Dev | Gir | %
                const values = Array.from(cells).map((c) => c.textContent?.trim() || '')

                // Find numeric columns
                const numericValues = values.filter((v) => /[\d,]+/.test(v))

                if (numericValues.length >= 4) {
                  result = {
                    entityCode: searchTerm,
                    entityName: cells[0]?.textContent?.trim() || searchTerm,
                    period: new Date().getFullYear().toString(),
                    pia: parseAmount(numericValues[0] || '0'),
                    pim: parseAmount(numericValues[1] || '0'),
                    certified: parseAmount(numericValues[2] || '0'),
                    committed: parseAmount(numericValues[3] || '0'),
                    accrued: parseAmount(numericValues[4] || '0'),
                    paid: parseAmount(numericValues[5] || '0'),
                    executionPct: 0,
                  }
                }
              }
            }
          })
        })

        return result
      }, entityCode.searchTerm)

      return budgetData as BudgetExecution | null
    }

    // Try the main search
    let execution = await searchForEntity()

    // If not found, try clicking on "Consulta General"
    if (!execution) {
      try {
        const consultaLink = await page.$('a[href*="Consulta"], a:contains("Consulta")')
        if (consultaLink) {
          await consultaLink.click()
          await delay(2000)
          execution = await searchForEntity()
        }
      } catch {
        console.log('[MEF] Could not find consulta link')
      }
    }

    // If still not found, try the direct API approach
    if (!execution) {
      // Try fetching from the SIAF API directly (if available)
      const apiData = await tryMefApi(entityCode, year)
      if (apiData) {
        execution = apiData
      }
    }

    if (execution && execution.pim > 0) {
      execution.executionPct = (execution.accrued / execution.pim) * 100
      console.log(`[MEF] Found budget for ${entityCode.searchTerm}: ${execution.executionPct.toFixed(1)}% execution`)
    }

    return execution
  } catch (error) {
    console.error(`[MEF] Error fetching budget for ${entityCode.searchTerm}:`, error)
    await debugScreenshot(page, 'mef-error')
    return null
  } finally {
    await page.close()
  }
}

/**
 * Try to fetch data from MEF API directly
 */
async function tryMefApi(
  entityCode: { nivel: string; sector: string; pliego: string; searchTerm: string },
  year: number
): Promise<BudgetExecution | null> {
  try {
    // MEF has a JSON API endpoint for some queries
    const apiUrl = `https://apps5.mineco.gob.pe/transparencia/mensual/default.aspx?y=${year}&ap=Pliego`

    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json, text/html',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
      },
    })

    if (!response.ok) return null

    const text = await response.text()

    // Try to parse as JSON
    try {
      const data = JSON.parse(text)
      // Process JSON response if available
      if (Array.isArray(data)) {
        const entity = data.find((item: Record<string, unknown>) =>
          String(item.pliego || item.entidad || '').includes(entityCode.pliego)
        )
        if (entity) {
          return {
            entityCode: entityCode.pliego,
            entityName: String(entity.nombre || entity.entidad || entityCode.searchTerm),
            period: year.toString(),
            pia: Number(entity.pia) || 0,
            pim: Number(entity.pim) || 0,
            certified: Number(entity.certificado) || 0,
            committed: Number(entity.comprometido) || 0,
            accrued: Number(entity.devengado) || 0,
            paid: Number(entity.girado) || 0,
            executionPct: Number(entity.avance) || 0,
          }
        }
      }
    } catch {
      // Not JSON, might be HTML - skip
    }

    return null
  } catch {
    return null
  }
}

/**
 * Saves budget execution to database
 */
async function saveBudgetExecution(candidateId: string, execution: BudgetExecution): Promise<void> {
  await sql`
    UPDATE incumbent_performance
    SET
      budget_allocated = ${execution.pim},
      budget_executed = ${execution.accrued},
      budget_execution_pct = ${execution.executionPct},
      data_sources = data_sources || ${JSON.stringify([{
        source: 'mef',
        period: execution.period,
        pim: execution.pim,
        devengado: execution.accrued,
        executionPct: execution.executionPct,
        fetchedAt: new Date().toISOString(),
      }])}::jsonb,
      last_updated = NOW()
    WHERE candidate_id = ${candidateId}::uuid
  `
}

/**
 * Main sync function for MEF budget execution
 */
export async function syncBudgetExecution(): Promise<{
  records_processed: number
  records_updated: number
  records_created: number
  records_skipped: number
}> {
  const logger = createSyncLogger('mef')
  await logger.start()

  try {
    await logger.markRunning()

    const incumbents = await getIncumbentEntities()
    console.log(`[MEF] Found ${incumbents.length} incumbent entities to check`)

    const processedEntities = new Set<string>()

    for (const incumbent of incumbents) {
      logger.incrementProcessed()

      const entityCode = getMefEntityCode(incumbent.entidad)
      if (!entityCode || processedEntities.has(entityCode.pliego)) {
        logger.incrementSkipped()
        continue
      }

      processedEntities.add(entityCode.pliego)

      console.log(`[MEF] Checking budget for ${incumbent.entidad}`)

      const execution = await withRetry(
        () => fetchBudgetExecution(entityCode),
        2,
        3000
      )

      if (execution) {
        try {
          await saveBudgetExecution(incumbent.candidateId, execution)
          logger.incrementUpdated()
        } catch (error) {
          console.error(`[MEF] Error saving budget:`, error)
          logger.incrementSkipped()
        }
      } else {
        logger.incrementSkipped()
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
 * Gets budget execution summary for a candidate
 */
export async function getCandidateBudgetExecution(candidateId: string): Promise<{
  hasBudgetData: boolean
  budgetAllocated: number
  budgetExecuted: number
  executionPct: number
  executionRating: 'excelente' | 'bueno' | 'regular' | 'deficiente' | 'critico'
  competenceImpact: number
} | null> {
  const result = await sql`
    SELECT
      budget_allocated,
      budget_executed,
      budget_execution_pct,
      period
    FROM incumbent_performance
    WHERE candidate_id = ${candidateId}::uuid
    ORDER BY last_updated DESC
    LIMIT 1
  `

  if (result.length === 0) {
    return null
  }

  const row = result[0]
  const allocated = Number(row.budget_allocated) || 0
  const executed = Number(row.budget_executed) || 0
  const pct = Number(row.budget_execution_pct) || 0

  // Rate execution performance
  let rating: 'excelente' | 'bueno' | 'regular' | 'deficiente' | 'critico'
  let impact: number

  if (pct >= 85) {
    rating = 'excelente'
    impact = 15 // Bonus
  } else if (pct >= 70) {
    rating = 'bueno'
    impact = 5 // Small bonus
  } else if (pct >= 50) {
    rating = 'regular'
    impact = 0 // No impact
  } else if (pct >= 30) {
    rating = 'deficiente'
    impact = -15 // Penalty
  } else {
    rating = 'critico'
    impact = -30 // Severe penalty
  }

  return {
    hasBudgetData: allocated > 0,
    budgetAllocated: allocated,
    budgetExecuted: executed,
    executionPct: pct,
    executionRating: rating,
    competenceImpact: impact,
  }
}

/**
 * Gets combined performance data for a candidate
 */
export async function getCandidatePerformanceSummary(candidateId: string): Promise<{
  isIncumbent: boolean
  cargoActual: string | null
  entidad: string | null
  period: string | null
  budgetExecution: {
    pct: number
    rating: string
  } | null
  contraloria: {
    reports: number
    findings: number
    hasCriminalReferral: boolean
  } | null
  performanceScore: number | null
  competenceImpact: number
  integrityPenalty: number
} | null> {
  const result = await sql`
    SELECT
      cargo_actual,
      entidad,
      period,
      budget_allocated,
      budget_executed,
      budget_execution_pct,
      contraloria_reports,
      contraloria_findings,
      contraloria_recommendations,
      has_criminal_referral,
      performance_score
    FROM incumbent_performance
    WHERE candidate_id = ${candidateId}::uuid
    ORDER BY last_updated DESC
    LIMIT 1
  `

  if (result.length === 0) {
    return null
  }

  const row = result[0]
  const pct = Number(row.budget_execution_pct) || 0
  const reports = Number(row.contraloria_reports) || 0
  const findings = Number(row.contraloria_findings) || 0
  const hasCriminalReferral = Boolean(row.has_criminal_referral)

  // Calculate budget execution rating
  let budgetRating = 'sin_datos'
  let competenceImpact = 0

  if (row.budget_allocated) {
    if (pct >= 85) {
      budgetRating = 'excelente'
      competenceImpact = 15
    } else if (pct >= 70) {
      budgetRating = 'bueno'
      competenceImpact = 5
    } else if (pct >= 50) {
      budgetRating = 'regular'
      competenceImpact = 0
    } else if (pct >= 30) {
      budgetRating = 'deficiente'
      competenceImpact = -15
    } else {
      budgetRating = 'critico'
      competenceImpact = -30
    }
  }

  // Calculate integrity penalty from Contraloría
  let integrityPenalty = 0
  if (hasCriminalReferral) {
    integrityPenalty += 40
  }
  integrityPenalty += Math.min(findings * 5, 30)

  return {
    isIncumbent: true,
    cargoActual: row.cargo_actual as string,
    entidad: row.entidad as string,
    period: row.period as string,
    budgetExecution: row.budget_allocated
      ? {
          pct,
          rating: budgetRating,
        }
      : null,
    contraloria: reports > 0
      ? {
          reports,
          findings,
          hasCriminalReferral,
        }
      : null,
    performanceScore: row.performance_score ? Number(row.performance_score) : null,
    competenceImpact,
    integrityPenalty: Math.min(integrityPenalty, 60),
  }
}

export { getIncumbentEntities, fetchBudgetExecution }
