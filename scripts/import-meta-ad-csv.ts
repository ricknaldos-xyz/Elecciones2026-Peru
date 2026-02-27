/**
 * Import Meta Ad Library Report CSV
 *
 * Parses the CSV downloaded from Meta Ad Library Report for Peru,
 * maps pages to candidates using facebook_page_id and name matching,
 * and inserts spending data into meta_ad_spending table.
 *
 * Download CSV from: https://www.facebook.com/ads/library/report/?country=PE
 *
 * Usage:
 *   DATABASE_URL='...' npx tsx scripts/import-meta-ad-csv.ts data/meta-ads-report.csv --period-start=2026-01-01 --period-end=2026-02-27
 *   DATABASE_URL='...' npx tsx scripts/import-meta-ad-csv.ts data/meta-ads-report.csv --period-start=2026-01-01 --period-end=2026-02-27 --dry-run
 *   DATABASE_URL='...' npx tsx scripts/import-meta-ad-csv.ts data/meta-ads-report.csv --period-start=2026-01-01 --period-end=2026-02-27 --mapping=data/meta-ad-mapping.json
 */

import { neon } from '@neondatabase/serverless'
import { readFileSync, existsSync } from 'fs'
import { parse } from 'csv-parse/sync'
import { resolve } from 'path'

const sql = neon(process.env.DATABASE_URL!)
const DRY_RUN = process.argv.includes('--dry-run')

// Parse CLI args
function getArg(name: string): string | undefined {
  const arg = process.argv.find((a) => a.startsWith(`--${name}=`))
  return arg?.split('=')[1]
}

const CSV_PATH = process.argv[2]
const PERIOD_START = getArg('period-start')
const PERIOD_END = getArg('period-end')
const MAPPING_PATH = getArg('mapping')

if (!CSV_PATH) {
  console.error('Usage: npx tsx scripts/import-meta-ad-csv.ts <csv-file> --period-start=YYYY-MM-DD --period-end=YYYY-MM-DD [--dry-run] [--mapping=path]')
  process.exit(1)
}

if (!PERIOD_START || !PERIOD_END) {
  console.error('Error: --period-start and --period-end are required (YYYY-MM-DD format)')
  process.exit(1)
}

// --- Types ---
interface CsvRow {
  page_id: string
  page_name: string
  disclaimer: string
  amount_spent: string
  number_of_ads: string
}

interface DBCandidate {
  id: string
  full_name: string
  slug: string
  party_id: string | null
  cargo: string
}

interface DBSocialProfile {
  candidate_id: string
  facebook_page_id: string | null
}

interface MappingFile {
  pageOverrides: Record<string, { candidateSlug?: string; partyShortName?: string; isCandidatePage?: boolean }>
  excludePages: string[]
  nameAliases: Record<string, string>
}

interface DBParty {
  id: string
  name: string
  short_name: string | null
}

// --- Helpers ---
function normalizeName(name: string): string {
  return name
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function parseSpendingAmount(raw: string): { lower: number; upper: number } {
  if (!raw || raw.trim() === '' || raw.trim() === '0') return { lower: 0, upper: 0 }
  const trimmed = raw.trim()
  // Handle Meta's "≤100" format (means 0-100)
  if (trimmed.startsWith('≤') || trimmed.startsWith('<=')) {
    const val = parseFloat(trimmed.replace(/[^\d.]/g, '')) || 100
    return { lower: 0, upper: val }
  }
  // Remove currency symbols, spaces, and thousands separators
  const cleaned = trimmed.replace(/[^\d.,\-]/g, '').replace(/,/g, '')
  if (cleaned.includes('-')) {
    const parts = cleaned.split('-').map((s) => parseFloat(s.trim()))
    return { lower: parts[0] || 0, upper: parts[1] || parts[0] || 0 }
  }
  const val = parseFloat(cleaned)
  return { lower: val || 0, upper: val || 0 }
}

// Flexible CSV column name mapping (Meta CSV headers vary by language/download)
function normalizeHeaders(headers: string[]): Record<string, string> {
  const map: Record<string, string> = {}
  for (const h of headers) {
    const lower = h.toLowerCase().trim()
    if (lower.includes('page id') || lower === 'page_id') map[h] = 'page_id'
    else if (lower.includes('page name') || lower === 'page_name') map[h] = 'page_name'
    else if (lower.includes('disclaimer')) map[h] = 'disclaimer'
    else if (lower.includes('amount') || lower.includes('spent') || lower.includes('gasto')) map[h] = 'amount_spent'
    else if (lower.includes('number') || lower.includes('ads') || lower.includes('anuncios')) map[h] = 'number_of_ads'
  }
  return map
}

function nameContains(fullName: string, pageName: string): boolean {
  const normalFull = normalizeName(fullName)
  const normalPage = normalizeName(pageName)
  // Require at least 2 significant words in the page name
  const pageWords = normalPage.split(' ').filter((w) => w.length > 2)
  if (pageWords.length < 2) return false
  // Require at least 80% of page words to appear in candidate name
  const matchCount = pageWords.filter((w) => normalFull.includes(w)).length
  return matchCount >= Math.ceil(pageWords.length * 0.8)
}

// --- Main ---
async function main() {
  console.log('=== Meta Ad Library CSV Import ===')
  if (DRY_RUN) console.log('>>> DRY RUN MODE - no changes will be made <<<\n')
  console.log(`CSV: ${CSV_PATH}`)
  console.log(`Period: ${PERIOD_START} to ${PERIOD_END}\n`)

  // 1. Read and parse CSV
  const csvPath = resolve(CSV_PATH)
  if (!existsSync(csvPath)) {
    console.error(`File not found: ${csvPath}`)
    process.exit(1)
  }

  const csvContent = readFileSync(csvPath, 'utf-8')
  const rawRecords = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,
  }) as Record<string, string>[]

  if (rawRecords.length === 0) {
    console.error('CSV is empty or has no data rows')
    process.exit(1)
  }

  // Map headers
  const headers = Object.keys(rawRecords[0])
  const headerMap = normalizeHeaders(headers)
  console.log(`CSV headers: ${headers.join(', ')}`)
  console.log(`Mapped: ${JSON.stringify(headerMap)}\n`)

  const records: CsvRow[] = rawRecords.map((row) => {
    const mapped: Record<string, string> = {}
    for (const [orig, norm] of Object.entries(headerMap)) {
      mapped[norm] = row[orig] || ''
    }
    return mapped as unknown as CsvRow
  })

  console.log(`Parsed ${records.length} rows from CSV\n`)

  // 2. Load mapping file
  let mapping: MappingFile = { pageOverrides: {}, excludePages: [], nameAliases: {} }
  const mappingPath = MAPPING_PATH ? resolve(MAPPING_PATH) : resolve('data/meta-ad-mapping.json')
  if (existsSync(mappingPath)) {
    mapping = JSON.parse(readFileSync(mappingPath, 'utf-8'))
    console.log(`Loaded mapping from ${mappingPath}`)
  }

  // 3. Fetch DB data
  console.log('Fetching candidates from database...')
  const dbCandidates = (await sql`
    SELECT id, full_name, slug, party_id, cargo
    FROM candidates
    WHERE is_active = true AND cargo = 'presidente'
  `) as unknown as DBCandidate[]
  console.log(`  ${dbCandidates.length} presidential candidates`)

  let socialProfiles: DBSocialProfile[] = []
  try {
    socialProfiles = (await sql`
      SELECT candidate_id, facebook_page_id
      FROM candidate_social_profiles
      WHERE facebook_page_id IS NOT NULL
    `) as unknown as DBSocialProfile[]
    console.log(`  ${socialProfiles.length} social profiles with facebook_page_id`)
  } catch {
    console.log('  candidate_social_profiles table not available, skipping facebook_page_id matching')
  }

  const dbParties = (await sql`
    SELECT id, name, short_name FROM parties
  `) as unknown as DBParty[]

  // Build lookup maps
  const candidateByFbPageId = new Map<string, DBCandidate>()
  for (const sp of socialProfiles) {
    if (sp.facebook_page_id) {
      const candidate = dbCandidates.find((c) => c.id === sp.candidate_id)
      if (candidate) candidateByFbPageId.set(sp.facebook_page_id, candidate)
    }
  }

  const candidateBySlug = new Map<string, DBCandidate>()
  for (const c of dbCandidates) {
    candidateBySlug.set(c.slug, c)
  }

  const partyByShortName = new Map<string, DBParty>()
  for (const p of dbParties) {
    if (p.short_name) partyByShortName.set(p.short_name.toUpperCase(), p)
    partyByShortName.set(normalizeName(p.name), p)
  }

  // 4. Process records
  let matched = 0
  let unmatched = 0
  let excluded = 0
  let pagesUpserted = 0
  let spendingInserted = 0
  const unmatchedPages: { page_id: string; page_name: string; amount: string }[] = []
  const csvFilename = CSV_PATH.split('/').pop() || CSV_PATH

  for (const row of records) {
    const pageId = row.page_id?.trim()
    const pageName = row.page_name?.trim()

    if (!pageId || !pageName) continue

    // Check exclusion list
    if (mapping.excludePages.includes(pageId)) {
      excluded++
      continue
    }

    // --- Match page to candidate/party ---
    let candidateId: string | null = null
    let partyId: string | null = null
    let isCandidatePage = true

    // Priority 1: Manual override
    const override = mapping.pageOverrides[pageId]
    if (override) {
      if (override.candidateSlug) {
        const c = candidateBySlug.get(override.candidateSlug)
        if (c) {
          candidateId = c.id
          partyId = c.party_id
          isCandidatePage = override.isCandidatePage ?? true
        }
      }
      if (override.partyShortName) {
        const p = partyByShortName.get(override.partyShortName.toUpperCase())
        if (p) {
          partyId = p.id
          isCandidatePage = false
        }
      }
    }

    // Priority 2: facebook_page_id exact match
    if (!candidateId) {
      const c = candidateByFbPageId.get(pageId)
      if (c) {
        candidateId = c.id
        partyId = c.party_id
      }
    }

    // Priority 3: Name alias match
    if (!candidateId) {
      const normalPageName = normalizeName(pageName)
      for (const [alias, slug] of Object.entries(mapping.nameAliases)) {
        if (normalPageName.includes(normalizeName(alias))) {
          const c = candidateBySlug.get(slug)
          if (c) {
            candidateId = c.id
            partyId = c.party_id
            break
          }
        }
      }
    }

    // Priority 4: Fuzzy name match against candidates
    if (!candidateId) {
      for (const c of dbCandidates) {
        if (nameContains(c.full_name, pageName)) {
          candidateId = c.id
          partyId = c.party_id
          break
        }
      }
    }

    // Priority 5: Party name match
    if (!candidateId && !partyId) {
      const normalPage = normalizeName(pageName)
      for (const [pName, p] of partyByShortName) {
        if (normalPage.includes(pName) || pName.includes(normalPage)) {
          partyId = p.id
          isCandidatePage = false
          break
        }
      }
    }

    if (!candidateId && !partyId) {
      unmatched++
      unmatchedPages.push({ page_id: pageId, page_name: pageName, amount: row.amount_spent || '0' })
      continue
    }

    matched++

    // Parse spending
    const spending = parseSpendingAmount(row.amount_spent)
    const numAds = parseInt(row.number_of_ads || '0', 10) || 0

    if (!DRY_RUN) {
      // Upsert page mapping
      await sql`
        INSERT INTO meta_ad_pages (page_id, page_name, candidate_id, party_id, is_candidate_page)
        VALUES (
          ${pageId},
          ${pageName},
          ${candidateId}::uuid,
          ${partyId}::uuid,
          ${isCandidatePage}
        )
        ON CONFLICT (page_id) DO UPDATE SET
          page_name = EXCLUDED.page_name,
          candidate_id = COALESCE(EXCLUDED.candidate_id, meta_ad_pages.candidate_id),
          party_id = COALESCE(EXCLUDED.party_id, meta_ad_pages.party_id),
          updated_at = NOW()
      `
      pagesUpserted++

      // Insert spending snapshot
      await sql`
        INSERT INTO meta_ad_spending (page_id, disclaimer, amount_spent_lower, amount_spent_upper, currency, number_of_ads, period_start, period_end, csv_filename)
        VALUES (
          ${pageId},
          ${row.disclaimer || null},
          ${spending.lower},
          ${spending.upper},
          'PEN',
          ${numAds},
          ${PERIOD_START}::date,
          ${PERIOD_END}::date,
          ${csvFilename}
        )
        ON CONFLICT (page_id, period_start, period_end, disclaimer) DO UPDATE SET
          amount_spent_lower = EXCLUDED.amount_spent_lower,
          amount_spent_upper = EXCLUDED.amount_spent_upper,
          number_of_ads = EXCLUDED.number_of_ads,
          csv_filename = EXCLUDED.csv_filename,
          imported_at = NOW()
      `
      spendingInserted++
    }

    const target = candidateId
      ? dbCandidates.find((c) => c.id === candidateId)?.full_name || candidateId
      : `Party: ${partyId}`
    console.log(`  ${DRY_RUN ? '[DRY] ' : ''}${pageName} → ${target} | ${spending.lower}-${spending.upper} PEN | ${numAds} ads`)
  }

  // Summary
  console.log('\n=== Summary ===')
  console.log(`CSV rows: ${records.length}`)
  console.log(`Matched: ${matched}`)
  console.log(`Unmatched: ${unmatched}`)
  console.log(`Excluded: ${excluded}`)
  if (!DRY_RUN) {
    console.log(`Pages upserted: ${pagesUpserted}`)
    console.log(`Spending rows inserted: ${spendingInserted}`)
  }

  if (unmatchedPages.length > 0) {
    console.log('\nUnmatched pages (add to meta-ad-mapping.json):')
    for (const p of unmatchedPages.sort((a, b) => parseFloat(b.amount || '0') - parseFloat(a.amount || '0'))) {
      console.log(`  - Page ID: ${p.page_id} | Name: "${p.page_name}" | Spent: ${p.amount}`)
    }
  }

  if (DRY_RUN) {
    console.log('\n>>> DRY RUN complete. Run without --dry-run to apply changes. <<<')
  }
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
