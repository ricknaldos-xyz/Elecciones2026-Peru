/**
 * SUNAT Tax Status Scraper
 *
 * Verifies candidate tax compliance status from SUNAT portal.
 * Checks if candidates are "habido" (tax compliant) or "no habido" (evading).
 *
 * Source: https://e-consultaruc.sunat.gob.pe
 */

import * as cheerio from 'cheerio'
import { sql } from '@/lib/db'
import { createSyncLogger } from '../logger'

const SUNAT_CONSULTA_URL = 'https://e-consultaruc.sunat.gob.pe/cl-ti-itmrconsruc/FrameCriterioBusquedaWeb.jsp'
const SUNAT_RESULTADO_URL = 'https://e-consultaruc.sunat.gob.pe/cl-ti-itmrconsruc/jcrS00Alias'
const DELAY_MS = 3000

interface TaxStatus {
  ruc: string
  rucType: 'persona_natural' | 'empresa'
  status: 'activo' | 'suspendido' | 'baja_definitiva' | 'baja_provisional'
  condition: 'habido' | 'no_habido' | 'pendiente' | 'no_hallado'
  hasCoactiveDebts: boolean
  coactiveDebtCount: number
  activityDescription?: string
}

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Fetches RUC status from SUNAT
 * Note: SUNAT has anti-bot protections, this may require Puppeteer for production
 */
async function fetchRUCStatus(rucOrDni: string): Promise<TaxStatus | null> {
  try {
    // First, get the session
    const sessionResponse = await fetch(SUNAT_CONSULTA_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml',
      },
    })

    if (!sessionResponse.ok) {
      console.error('[SUNAT] Failed to get session')
      return null
    }

    // Note: In production, would need to:
    // 1. Handle CAPTCHA
    // 2. Maintain session cookies
    // 3. Use Puppeteer for JavaScript rendering

    // For now, attempt a simple POST request
    const formData = new URLSearchParams()
    formData.append('nroRuc', rucOrDni.length === 11 ? rucOrDni : '')
    formData.append('nroDocumento', rucOrDni.length === 8 ? rucOrDni : '')
    formData.append('tipoDocumento', rucOrDni.length === 8 ? '01' : '')

    const response = await fetch(SUNAT_RESULTADO_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        Accept: 'text/html',
        Cookie: sessionResponse.headers.get('set-cookie') || '',
      },
      body: formData.toString(),
    })

    if (!response.ok) {
      console.error('[SUNAT] Query failed')
      return null
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    // Parse SUNAT response
    // Note: Selectors may need adjustment based on actual SUNAT page structure
    const ruc = $('.ruc-number, td:contains("RUC:")').next().text().trim()
    const statusText = $('.estado, td:contains("Estado:")').next().text().trim().toLowerCase()
    const conditionText = $('.condicion, td:contains("Condición:")').next().text().trim().toLowerCase()

    if (!ruc) {
      console.log(`[SUNAT] No RUC found for ${rucOrDni}`)
      return null
    }

    // Parse status
    let status: TaxStatus['status'] = 'activo'
    if (statusText.includes('suspens')) status = 'suspendido'
    else if (statusText.includes('baja de')) status = 'baja_definitiva'
    else if (statusText.includes('baja pro')) status = 'baja_provisional'

    // Parse condition
    let condition: TaxStatus['condition'] = 'habido'
    if (conditionText.includes('no habido')) condition = 'no_habido'
    else if (conditionText.includes('no hallado')) condition = 'no_hallado'
    else if (conditionText.includes('pendiente')) condition = 'pendiente'

    // Check for coactive debts (if visible)
    const coactiveSection = $('td:contains("Coactivo"), .deudas-coactivas').text()
    const hasCoactiveDebts = coactiveSection.toLowerCase().includes('sí') || coactiveSection.includes('SI')

    return {
      ruc,
      rucType: ruc.startsWith('10') ? 'persona_natural' : 'empresa',
      status,
      condition,
      hasCoactiveDebts,
      coactiveDebtCount: hasCoactiveDebts ? 1 : 0,
      activityDescription: $('.actividad, td:contains("Actividad")').next().text().trim() || undefined,
    }
  } catch (error) {
    console.error(`[SUNAT] Error fetching RUC for ${rucOrDni}:`, error)
    return null
  }
}

/**
 * Gets candidates with DNI for SUNAT lookup
 */
async function getCandidatesWithDNI(): Promise<Array<{ id: string; fullName: string; dni: string }>> {
  const result = await sql`
    SELECT id, full_name, dni
    FROM candidates
    WHERE dni IS NOT NULL
      AND dni != ''
      AND LENGTH(dni) = 8
      AND is_active = true
  `

  return result.map((r) => ({
    id: r.id as string,
    fullName: r.full_name as string,
    dni: r.dni as string,
  }))
}

/**
 * Saves tax status to database
 */
async function saveTaxStatus(candidateId: string, status: TaxStatus): Promise<void> {
  await sql`
    INSERT INTO candidate_tax_status (
      candidate_id,
      ruc,
      ruc_type,
      status,
      condition,
      has_coactive_debts,
      coactive_debt_count,
      activity_description,
      last_checked
    ) VALUES (
      ${candidateId}::uuid,
      ${status.ruc},
      ${status.rucType},
      ${status.status},
      ${status.condition},
      ${status.hasCoactiveDebts},
      ${status.coactiveDebtCount},
      ${status.activityDescription || null},
      NOW()
    )
    ON CONFLICT (candidate_id, ruc) DO UPDATE SET
      status = EXCLUDED.status,
      condition = EXCLUDED.condition,
      has_coactive_debts = EXCLUDED.has_coactive_debts,
      coactive_debt_count = EXCLUDED.coactive_debt_count,
      last_checked = NOW()
  `
}

/**
 * Main sync function for SUNAT tax status
 */
export async function syncSUNATStatus(): Promise<{
  records_processed: number
  records_updated: number
  records_created: number
  records_skipped: number
}> {
  const logger = createSyncLogger('sunat')
  await logger.start()

  const result = {
    records_processed: 0,
    records_updated: 0,
    records_created: 0,
    records_skipped: 0,
  }
  let noHabidoCount = 0

  try {
    await logger.markRunning()

    const candidates = await getCandidatesWithDNI()
    console.log(`[SUNAT] Found ${candidates.length} candidates with DNI`)

    for (const candidate of candidates) {
      result.records_processed++
      logger.incrementProcessed()

      await delay(DELAY_MS)

      try {
        const taxStatus = await fetchRUCStatus(candidate.dni)

        if (taxStatus) {
          await saveTaxStatus(candidate.id, taxStatus)
          result.records_updated++
          logger.incrementUpdated()

          if (taxStatus.condition === 'no_habido') {
            noHabidoCount++
            console.log(`[SUNAT] ⚠️ NO HABIDO: ${candidate.fullName}`)
          }
        } else {
          result.records_skipped++
          logger.incrementSkipped()
        }
      } catch (error) {
        console.error(`[SUNAT] Error processing ${candidate.fullName}:`, error)
        result.records_skipped++
        logger.incrementSkipped()
      }
    }

    logger.setMetadata('no_habido_count', noHabidoCount)
    return await logger.complete()
  } catch (error) {
    await logger.fail(error instanceof Error ? error : new Error(String(error)))
    throw error
  }
}

/**
 * Gets tax status summary for a candidate
 */
export async function getCandidateTaxSummary(candidateId: string): Promise<{
  isCompliant: boolean
  status: string | null
  condition: string | null
  hasCoactiveDebts: boolean
  integrityPenalty: number
}> {
  const result = await sql`
    SELECT status, condition, has_coactive_debts, coactive_debt_count
    FROM candidate_tax_status
    WHERE candidate_id = ${candidateId}::uuid
    ORDER BY last_checked DESC
    LIMIT 1
  `

  if (result.length === 0) {
    return {
      isCompliant: true, // Assume compliant if no data
      status: null,
      condition: null,
      hasCoactiveDebts: false,
      integrityPenalty: 0,
    }
  }

  const row = result[0]
  let penalty = 0

  // Calculate penalties
  if (row.condition === 'no_habido') {
    penalty += 50 // Major penalty for tax evasion
  } else if (row.condition === 'no_hallado') {
    penalty += 20
  }

  if (row.status === 'suspendido') {
    penalty += 15
  } else if (row.status === 'baja_definitiva' || row.status === 'baja_provisional') {
    penalty += 10
  }

  if (row.has_coactive_debts) {
    penalty += 20 * (Number(row.coactive_debt_count) || 1)
  }

  return {
    isCompliant: row.condition === 'habido' && row.status === 'activo' && !row.has_coactive_debts,
    status: row.status,
    condition: row.condition,
    hasCoactiveDebts: row.has_coactive_debts,
    integrityPenalty: Math.min(penalty, 85), // Cap at 85 like penal sentences
  }
}

/**
 * Alternative: Manual lookup for known problematic candidates
 * Use this to manually add data for candidates with known tax issues
 */
export async function addManualTaxStatus(
  candidateId: string,
  data: {
    ruc: string
    status: TaxStatus['status']
    condition: TaxStatus['condition']
    hasCoactiveDebts: boolean
    notes?: string
  }
): Promise<void> {
  await sql`
    INSERT INTO candidate_tax_status (
      candidate_id,
      ruc,
      ruc_type,
      status,
      condition,
      has_coactive_debts,
      source_url,
      last_checked
    ) VALUES (
      ${candidateId}::uuid,
      ${data.ruc},
      ${data.ruc.startsWith('10') ? 'persona_natural' : 'empresa'},
      ${data.status},
      ${data.condition},
      ${data.hasCoactiveDebts},
      'manual_entry',
      NOW()
    )
    ON CONFLICT (candidate_id, ruc) DO UPDATE SET
      status = EXCLUDED.status,
      condition = EXCLUDED.condition,
      has_coactive_debts = EXCLUDED.has_coactive_debts,
      last_checked = NOW()
  `
}

export { fetchRUCStatus, getCandidatesWithDNI }
