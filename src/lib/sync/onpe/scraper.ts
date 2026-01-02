import * as cheerio from 'cheerio'
import pLimit from 'p-limit'
import { createSyncLogger } from '../logger'
import { sql } from '@/lib/db'

const ONPE_CLARIDAD_URL = 'https://claridad.onpe.gob.pe'

// Rate limiter: 1 request every 3 seconds
const limit = pLimit(1)
const DELAY_MS = 3000

interface PartyFinanceData {
  party_name: string
  period: string
  public_funding: number
  private_funding: number
  total_income: number
  campaign_expenses: number
  administrative_expenses: number
  total_expenses: number
  donors: Array<{
    name: string
    amount: number
    type: 'individual' | 'corporate'
  }>
  report_url?: string
}

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchWithRetry(
  url: string,
  retries: number = 3
): Promise<string> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (compatible; RankingElectoral/1.0; +https://rankingelectoral.pe)',
          Accept: 'text/html,application/xhtml+xml',
          'Accept-Language': 'es-PE,es;q=0.9',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.text()
    } catch (error) {
      console.error(`[ONPE] Fetch attempt ${i + 1} failed:`, error)
      if (i === retries - 1) throw error
      await delay(DELAY_MS * (i + 1))
    }
  }
  throw new Error('All retries failed')
}

/**
 * Fetches the list of parties with finance reports
 */
async function fetchPartyList(): Promise<string[]> {
  const partyIds: string[] = []

  try {
    const html = await fetchWithRetry(`${ONPE_CLARIDAD_URL}/organizaciones`)
    const $ = cheerio.load(html)

    // Extract party IDs from the list
    $('.party-item, .organization-card, [data-party-id]').each((_, el) => {
      const id =
        $(el).attr('data-party-id') ||
        $(el).find('a').attr('href')?.match(/\/(\d+)/)?.[1]
      if (id) {
        partyIds.push(id)
      }
    })

    // Try table format as well
    $('table tbody tr').each((_, el) => {
      const $row = $(el)
      const link = $row.find('a').attr('href')
      const id = link?.match(/\/partido\/(\d+)/)?.[1]
      if (id) {
        partyIds.push(id)
      }
    })
  } catch (error) {
    console.error('[ONPE] Error fetching party list:', error)
  }

  return partyIds
}

/**
 * Fetches finance data for a single party
 */
async function fetchPartyFinances(
  partyId: string
): Promise<PartyFinanceData | null> {
  return limit(async () => {
    await delay(DELAY_MS)

    try {
      const html = await fetchWithRetry(
        `${ONPE_CLARIDAD_URL}/partido/${partyId}/finanzas`
      )
      const $ = cheerio.load(html)

      // Parse party name
      const partyName =
        $('h1.party-name, .organization-name').text().trim() ||
        $('title').text().replace(' - CLARIDAD', '').trim()

      // Parse finance summary
      const publicFunding = parseAmount(
        $('.financiamiento-publico, [data-public]').text()
      )
      const privateFunding = parseAmount(
        $('.financiamiento-privado, [data-private]').text()
      )
      const campaignExpenses = parseAmount(
        $('.gastos-campana, [data-campaign]').text()
      )
      const adminExpenses = parseAmount(
        $('.gastos-admin, [data-admin]').text()
      )

      // Parse donors list
      const donors: PartyFinanceData['donors'] = []
      $('.donor-item, .aportantes tr').each((_, el) => {
        const $el = $(el)
        const name = $el.find('.donor-name, td:nth-child(1)').text().trim()
        const amount = parseAmount($el.find('.donor-amount, td:nth-child(2)').text())
        const typeText = $el.find('.donor-type, td:nth-child(3)').text().toLowerCase()

        if (name && amount > 0) {
          donors.push({
            name,
            amount,
            type: typeText.includes('jurídic') ? 'corporate' : 'individual',
          })
        }
      })

      // Get report URL
      const reportUrl = $('a[href*="reporte"], a[href*=".pdf"]')
        .first()
        .attr('href')

      return {
        party_name: partyName,
        period: '2024-2025', // Current electoral period
        public_funding: publicFunding,
        private_funding: privateFunding,
        total_income: publicFunding + privateFunding,
        campaign_expenses: campaignExpenses,
        administrative_expenses: adminExpenses,
        total_expenses: campaignExpenses + adminExpenses,
        donors,
        report_url: reportUrl
          ? reportUrl.startsWith('http')
            ? reportUrl
            : `${ONPE_CLARIDAD_URL}${reportUrl}`
          : undefined,
      }
    } catch (error) {
      console.error(`[ONPE] Error fetching party ${partyId}:`, error)
      return null
    }
  })
}

/**
 * Parses a currency amount string to number
 */
function parseAmount(text: string): number {
  if (!text) return 0

  // Remove currency symbols and commas
  const cleaned = text
    .replace(/[S\/\.]/g, '')
    .replace(/,/g, '.')
    .replace(/\s/g, '')
    .trim()

  const match = cleaned.match(/[\d.]+/)
  if (match) {
    return parseFloat(match[0]) || 0
  }

  return 0
}

/**
 * Finds a party by name in the database
 */
async function findPartyByName(partyName: string): Promise<string | null> {
  const normalizedName = partyName.toLowerCase().trim()

  const result = await sql`
    SELECT id FROM parties
    WHERE LOWER(name) LIKE ${'%' + normalizedName + '%'}
       OR LOWER(short_name) LIKE ${'%' + normalizedName + '%'}
    LIMIT 1
  `

  return result[0]?.id || null
}

/**
 * Updates party finance data in the database
 */
async function updatePartyFinances(
  partyId: string,
  data: PartyFinanceData
): Promise<boolean> {
  try {
    // Check if finance record exists
    const existing = await sql`
      SELECT id FROM party_finances
      WHERE party_id = ${partyId}::uuid
        AND period = ${data.period}
    `

    if (existing.length > 0) {
      // Update existing record
      await sql`
        UPDATE party_finances
        SET
          public_funding = ${data.public_funding},
          private_funding = ${data.private_funding},
          total_income = ${data.total_income},
          campaign_expenses = ${data.campaign_expenses},
          administrative_expenses = ${data.administrative_expenses},
          total_expenses = ${data.total_expenses},
          donors = ${JSON.stringify(data.donors)}::jsonb,
          report_url = ${data.report_url || null},
          updated_at = NOW()
        WHERE party_id = ${partyId}::uuid
          AND period = ${data.period}
      `
    } else {
      // Insert new record
      await sql`
        INSERT INTO party_finances (
          party_id,
          period,
          public_funding,
          private_funding,
          total_income,
          campaign_expenses,
          administrative_expenses,
          total_expenses,
          donors,
          report_url
        ) VALUES (
          ${partyId}::uuid,
          ${data.period},
          ${data.public_funding},
          ${data.private_funding},
          ${data.total_income},
          ${data.campaign_expenses},
          ${data.administrative_expenses},
          ${data.total_expenses},
          ${JSON.stringify(data.donors)}::jsonb,
          ${data.report_url || null}
        )
      `
    }

    return true
  } catch (error) {
    console.error(`[ONPE] Error updating finances for party ${partyId}:`, error)
    return false
  }
}

/**
 * Main sync function for ONPE CLARIDAD data
 */
export async function syncONPEFinances(): Promise<{
  records_processed: number
  records_updated: number
  records_created: number
  records_skipped: number
}> {
  const logger = createSyncLogger('onpe')
  await logger.start()

  try {
    await logger.markRunning()

    // Get list of parties to fetch
    console.log('[ONPE] Fetching party list...')
    const partyIds = await fetchPartyList()
    console.log(`[ONPE] Found ${partyIds.length} parties`)

    logger.setMetadata('parties_found', partyIds.length)

    // Fetch and process each party's finances
    for (const partyId of partyIds) {
      logger.incrementProcessed()

      const financeData = await fetchPartyFinances(partyId)

      if (!financeData || !financeData.party_name) {
        logger.incrementSkipped()
        continue
      }

      // Find matching party in database
      const dbPartyId = await findPartyByName(financeData.party_name)

      if (!dbPartyId) {
        console.log(`[ONPE] Party not found in DB: ${financeData.party_name}`)
        logger.incrementSkipped()
        continue
      }

      // Update finances
      const updated = await updatePartyFinances(dbPartyId, financeData)

      if (updated) {
        logger.incrementUpdated()
        console.log(`[ONPE] Updated finances for: ${financeData.party_name}`)
      } else {
        logger.incrementSkipped()
      }
    }

    return await logger.complete()
  } catch (error) {
    await logger.fail(error as Error)
    throw error
  }
}

export { fetchPartyList, fetchPartyFinances }
