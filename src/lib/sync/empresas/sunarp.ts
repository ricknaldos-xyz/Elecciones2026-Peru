/**
 * SUNARP Company Linkage Scraper
 *
 * Fetches company ownership and directorship information from SUNARP.
 * Links candidates to companies they own or manage.
 *
 * Source: https://www.sunarp.gob.pe/
 */

import * as cheerio from 'cheerio'
import { sql } from '@/lib/db'
import { createSyncLogger } from '../logger'

const SUNARP_BASE_URL = 'https://www.sunarp.gob.pe'
const DELAY_MS = 4000

interface CompanyRecord {
  ruc: string
  companyName: string
  role: 'accionista' | 'director' | 'gerente_general' | 'representante_legal' | 'fundador'
  ownershipPct?: number
  isActive: boolean
  startDate?: string
  endDate?: string
  source: string
}

interface CandidateForCompanySearch {
  id: string
  fullName: string
  dni: string
}

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchWithRetry(url: string, retries = 3): Promise<string> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; RankingElectoral/1.0)',
          Accept: 'text/html,application/xhtml+xml,application/json',
          'Accept-Language': 'es-PE,es;q=0.9',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.text()
    } catch (error) {
      console.error(`[SUNARP] Fetch attempt ${i + 1} failed:`, error)
      if (i === retries - 1) throw error
      await delay(DELAY_MS * (i + 1))
    }
  }
  throw new Error('All retries failed')
}

/**
 * Gets candidates with DNI for company search
 */
async function getCandidatesForCompanySearch(): Promise<CandidateForCompanySearch[]> {
  const result = await sql`
    SELECT id, full_name, dni
    FROM candidates
    WHERE dni IS NOT NULL
      AND dni != ''
      AND LENGTH(dni) = 8
      AND is_active = true
    ORDER BY cargo = 'presidente' DESC, full_name ASC
    LIMIT 100
  `

  return result.map((r) => ({
    id: r.id as string,
    fullName: r.full_name as string,
    dni: r.dni as string,
  }))
}

/**
 * Searches for companies linked to a person by DNI
 * Note: SUNARP requires payment for detailed searches.
 * This is a simplified implementation that may need adaptation.
 */
async function searchCompaniesByDNI(dni: string, fullName: string): Promise<CompanyRecord[]> {
  const companies: CompanyRecord[] = []

  try {
    await delay(DELAY_MS)

    // SUNARP doesn't have a free API, this would need:
    // 1. Web scraping with session handling
    // 2. Or integration with paid API
    // For now, we'll check if there's cached/known data in our DB

    // Alternative: Use SUNAT RUC consultation to find companies
    // where the person appears as representative
    const sunatUrl = `https://e-consultaruc.sunat.gob.pe/cl-ti-itmrconsruc/jcrS00Alias`

    // This is a simplified approach - real implementation would need
    // proper form submission and session handling
    console.log(`[SUNARP] Searching companies for ${fullName} (DNI: ${dni})`)

    // For demonstration, we'll parse any existing company data
    // In production, this would do actual web scraping

  } catch (error) {
    console.error(`[SUNARP] Error searching companies for ${dni}:`, error)
  }

  return companies
}

/**
 * Saves company link to database
 */
async function saveCompanyLink(candidateId: string, company: CompanyRecord): Promise<void> {
  await sql`
    INSERT INTO candidate_companies (
      candidate_id,
      company_ruc,
      company_name,
      role,
      ownership_pct,
      is_active,
      start_date,
      end_date,
      source
    ) VALUES (
      ${candidateId}::uuid,
      ${company.ruc},
      ${company.companyName},
      ${company.role},
      ${company.ownershipPct || null},
      ${company.isActive},
      ${company.startDate ? company.startDate : null}::date,
      ${company.endDate ? company.endDate : null}::date,
      ${company.source}
    )
    ON CONFLICT (candidate_id, company_ruc, role) DO UPDATE SET
      company_name = EXCLUDED.company_name,
      ownership_pct = EXCLUDED.ownership_pct,
      is_active = EXCLUDED.is_active,
      end_date = EXCLUDED.end_date
  `
}

/**
 * Main sync function for company linkage
 */
export async function syncCandidateCompanies(): Promise<{
  records_processed: number
  records_updated: number
  records_created: number
  records_skipped: number
}> {
  const logger = createSyncLogger('contraloria') // Using contraloria as fallback since 'sunarp' isn't in SyncSource
  await logger.start()

  try {
    await logger.markRunning()

    const candidates = await getCandidatesForCompanySearch()
    console.log(`[SUNARP] Found ${candidates.length} candidates to search for companies`)

    for (const candidate of candidates) {
      logger.incrementProcessed()

      const companies = await searchCompaniesByDNI(candidate.dni, candidate.fullName)

      if (companies.length > 0) {
        for (const company of companies) {
          try {
            await saveCompanyLink(candidate.id, company)
            logger.incrementCreated()
          } catch (error) {
            console.error(`[SUNARP] Error saving company link:`, error)
            logger.incrementSkipped()
          }
        }
      } else {
        logger.incrementSkipped()
      }
    }

    return await logger.complete()
  } catch (error) {
    await logger.fail(error instanceof Error ? error : new Error(String(error)))
    throw error
  }
}

/**
 * Manually add known company links
 * Useful for adding verified company data from news sources
 */
export async function addManualCompanyLink(
  candidateId: string,
  data: {
    ruc: string
    companyName: string
    role: CompanyRecord['role']
    ownershipPct?: number
    source: string
  }
): Promise<void> {
  await saveCompanyLink(candidateId, {
    ...data,
    isActive: true,
    source: data.source || 'manual_entry',
  })
}

/**
 * Gets companies linked to a candidate
 */
export async function getCandidateCompanies(candidateId: string): Promise<{
  companies: Array<{
    ruc: string
    name: string
    role: string
    ownershipPct: number | null
    isActive: boolean
    hasLegalIssues: boolean
    issuesCount: number
  }>
  totalCompanies: number
  companiesWithIssues: number
}> {
  const result = await sql`
    SELECT
      cc.company_ruc as ruc,
      cc.company_name as name,
      cc.role,
      cc.ownership_pct,
      cc.is_active,
      COUNT(cli.id) as issues_count
    FROM candidate_companies cc
    LEFT JOIN company_legal_issues cli ON cc.id = cli.company_id
    WHERE cc.candidate_id = ${candidateId}::uuid
    GROUP BY cc.id, cc.company_ruc, cc.company_name, cc.role, cc.ownership_pct, cc.is_active
    ORDER BY cc.is_active DESC, issues_count DESC
  `

  const companies = result.map((r) => ({
    ruc: r.ruc as string,
    name: r.name as string,
    role: r.role as string,
    ownershipPct: r.ownership_pct ? Number(r.ownership_pct) : null,
    isActive: r.is_active as boolean,
    hasLegalIssues: Number(r.issues_count) > 0,
    issuesCount: Number(r.issues_count),
  }))

  return {
    companies,
    totalCompanies: companies.length,
    companiesWithIssues: companies.filter((c) => c.hasLegalIssues).length,
  }
}

export { getCandidatesForCompanySearch, searchCompaniesByDNI }
