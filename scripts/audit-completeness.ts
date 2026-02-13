/**
 * Comprehensive data completeness and quality audit
 * Generates a full report across all candidates in the database.
 */
import * as fs from 'fs'
import * as path from 'path'
import { neon } from '@neondatabase/serverless'

function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local')
  const content = fs.readFileSync(envPath, 'utf-8')
  const dbMatch = content.match(/DATABASE_URL=["']?([^"'\n]+)["']?/)
  return { db: dbMatch![1] }
}

const sql = neon(loadEnv().db)

function pct(n: number, total: number): string {
  if (total === 0) return '0.0%'
  return (n / total * 100).toFixed(1) + '%'
}

function padRight(s: string, len: number): string {
  return s.length >= len ? s : s + ' '.repeat(len - s.length)
}

function padLeft(s: string, len: number): string {
  return s.length >= len ? s : ' '.repeat(len - s.length) + s
}

function divider(title: string) {
  console.log('')
  console.log('='.repeat(80))
  console.log(` ${title}`)
  console.log('='.repeat(80))
}

async function main() {
  console.log('')
  console.log('#'.repeat(80))
  console.log('#  COMPREHENSIVE DATA COMPLETENESS & QUALITY AUDIT')
  console.log(`#  Generated: ${new Date().toISOString()}`)
  console.log('#'.repeat(80))

  // =====================================================================
  // 1. FIELD COVERAGE BY CARGO
  // =====================================================================
  divider('1. FIELD COVERAGE BY CARGO')

  const fields = [
    'photo_url',
    'birth_date',
    'dni',
    'education_level',
    'education_details',
    'experience_details',
    'political_trajectory',
    'assets_declaration',
    'penal_sentences',
    'civil_sentences',
    'djhv_url',
    'jne_id',
    'plan_gobierno_url',
  ]

  // Get counts by cargo
  const cargoCounts = await sql`
    SELECT cargo, COUNT(*) as total
    FROM candidates
    WHERE is_active = true
    GROUP BY cargo
    ORDER BY cargo
  `
  const cargoTotals: Record<string, number> = {}
  for (const r of cargoCounts) {
    cargoTotals[r.cargo as string] = Number(r.total)
  }

  // For each field, get non-null/non-empty counts by cargo
  // We need to handle JSONB arrays separately (education_details, experience_details, etc.)
  const jsonbArrayFields = ['education_details', 'experience_details', 'political_trajectory', 'penal_sentences', 'civil_sentences']
  const jsonbObjectFields = ['assets_declaration']
  const textFields = fields.filter(f => !jsonbArrayFields.includes(f) && !jsonbObjectFields.includes(f))

  // Query for text/date fields: non-null and non-empty
  const textCoverage = await sql`
    SELECT cargo,
      COUNT(*) FILTER (WHERE photo_url IS NOT NULL AND photo_url != '') as photo_url,
      COUNT(*) FILTER (WHERE birth_date IS NOT NULL) as birth_date,
      COUNT(*) FILTER (WHERE dni IS NOT NULL AND dni != '') as dni,
      COUNT(*) FILTER (WHERE education_level IS NOT NULL AND education_level != '') as education_level,
      COUNT(*) FILTER (WHERE djhv_url IS NOT NULL AND djhv_url != '') as djhv_url,
      COUNT(*) FILTER (WHERE jne_id IS NOT NULL AND jne_id != '') as jne_id,
      COUNT(*) FILTER (WHERE plan_gobierno_url IS NOT NULL AND plan_gobierno_url != '') as plan_gobierno_url
    FROM candidates
    WHERE is_active = true
    GROUP BY cargo
    ORDER BY cargo
  `

  // Query for JSONB array fields: non-null and not empty array
  const jsonbCoverage = await sql`
    SELECT cargo,
      COUNT(*) FILTER (WHERE education_details IS NOT NULL AND education_details::text != '[]' AND education_details::text != 'null') as education_details,
      COUNT(*) FILTER (WHERE experience_details IS NOT NULL AND experience_details::text != '[]' AND experience_details::text != 'null') as experience_details,
      COUNT(*) FILTER (WHERE political_trajectory IS NOT NULL AND political_trajectory::text != '[]' AND political_trajectory::text != 'null') as political_trajectory,
      COUNT(*) FILTER (WHERE penal_sentences IS NOT NULL AND penal_sentences::text != '[]' AND penal_sentences::text != 'null') as penal_sentences,
      COUNT(*) FILTER (WHERE civil_sentences IS NOT NULL AND civil_sentences::text != '[]' AND civil_sentences::text != 'null') as civil_sentences,
      COUNT(*) FILTER (WHERE assets_declaration IS NOT NULL AND assets_declaration::text != 'null' AND assets_declaration::text != '{}') as assets_declaration
    FROM candidates
    WHERE is_active = true
    GROUP BY cargo
    ORDER BY cargo
  `

  // Build combined table
  const cargos = Object.keys(cargoTotals).sort()
  const allFields = [...textFields, ...jsonbArrayFields, ...jsonbObjectFields].sort((a, b) => fields.indexOf(a) - fields.indexOf(b))

  // Build a lookup: field -> cargo -> count
  const coverage: Record<string, Record<string, number>> = {}
  for (const f of allFields) coverage[f] = {}

  for (const row of textCoverage) {
    const c = row.cargo as string
    for (const f of textFields) {
      coverage[f][c] = Number(row[f] || 0)
    }
  }
  for (const row of jsonbCoverage) {
    const c = row.cargo as string
    for (const f of [...jsonbArrayFields, ...jsonbObjectFields]) {
      coverage[f][c] = Number(row[f] || 0)
    }
  }

  // Print table
  const fieldColWidth = 24
  const cargoColWidth = 18

  // Header
  let header = padRight('Field', fieldColWidth)
  for (const c of cargos) {
    header += padLeft(`${c}(${cargoTotals[c]})`, cargoColWidth)
  }
  // Add total column
  const totalActive = Object.values(cargoTotals).reduce((a, b) => a + b, 0)
  header += padLeft(`TOTAL(${totalActive})`, cargoColWidth)
  console.log(header)
  console.log('-'.repeat(header.length))

  for (const f of allFields) {
    let row = padRight(f, fieldColWidth)
    let totalFieldCount = 0
    for (const c of cargos) {
      const count = coverage[f][c] || 0
      totalFieldCount += count
      const total = cargoTotals[c]
      row += padLeft(`${count}/${total} (${pct(count, total)})`, cargoColWidth)
    }
    row += padLeft(`${totalFieldCount}/${totalActive} (${pct(totalFieldCount, totalActive)})`, cargoColWidth)
    console.log(row)
  }

  // =====================================================================
  // 2. PHOTO URL VALIDATION
  // =====================================================================
  divider('2. PHOTO URL VALIDATION')

  const photoStats = await sql`
    SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE photo_url IS NOT NULL AND photo_url != '') as with_photo,
      COUNT(*) FILTER (WHERE photo_url IS NULL OR photo_url = '') as without_photo
    FROM candidates
    WHERE is_active = true
  `
  console.log(`Total active candidates: ${photoStats[0].total}`)
  console.log(`With photo_url set:      ${photoStats[0].with_photo} (${pct(Number(photoStats[0].with_photo), Number(photoStats[0].total))})`)
  console.log(`Without photo_url:       ${photoStats[0].without_photo} (${pct(Number(photoStats[0].without_photo), Number(photoStats[0].total))})`)

  // Check URL patterns
  const photoPatterns = await sql`
    SELECT
      COUNT(*) FILTER (WHERE photo_url LIKE 'https://%') as https_urls,
      COUNT(*) FILTER (WHERE photo_url LIKE 'http://%' AND photo_url NOT LIKE 'https://%') as http_urls,
      COUNT(*) FILTER (WHERE photo_url NOT LIKE 'http%' AND photo_url IS NOT NULL AND photo_url != '') as non_http,
      COUNT(*) FILTER (WHERE photo_url LIKE '%declara1.jne.gob.pe%') as jne_urls,
      COUNT(*) FILTER (WHERE photo_url LIKE '%wikipedia%' OR photo_url LIKE '%wikimedia%') as wiki_urls,
      COUNT(*) FILTER (WHERE photo_url LIKE '%supabase%') as supabase_urls
    FROM candidates
    WHERE is_active = true AND photo_url IS NOT NULL AND photo_url != ''
  `
  console.log(`\nURL patterns:`)
  console.log(`  HTTPS URLs:         ${photoPatterns[0].https_urls}`)
  console.log(`  HTTP (non-HTTPS):   ${photoPatterns[0].http_urls}`)
  console.log(`  Non-HTTP paths:     ${photoPatterns[0].non_http}`)
  console.log(`  JNE domain:         ${photoPatterns[0].jne_urls}`)
  console.log(`  Wikipedia/Wikimedia:${photoPatterns[0].wiki_urls}`)
  console.log(`  Supabase storage:   ${photoPatterns[0].supabase_urls}`)

  // Sample-check a few photo URLs for HTTP status
  const samplePhotos = await sql`
    SELECT photo_url, full_name FROM candidates
    WHERE is_active = true AND photo_url IS NOT NULL AND photo_url != ''
    ORDER BY RANDOM()
    LIMIT 10
  `
  console.log(`\nSample photo URL validation (10 random):`)
  for (const row of samplePhotos) {
    const url = row.photo_url as string
    try {
      const resp = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(5000) })
      const status = resp.status
      const marker = status === 200 ? 'OK' : `FAIL(${status})`
      console.log(`  [${marker}] ${row.full_name}: ${url.substring(0, 80)}...`)
    } catch (err: any) {
      console.log(`  [ERROR] ${row.full_name}: ${err.message?.substring(0, 60)} | ${url.substring(0, 60)}`)
    }
  }

  // Also count by cargo who is missing photos
  const missingPhotoByCargo = await sql`
    SELECT cargo, COUNT(*) as cnt
    FROM candidates
    WHERE is_active = true AND (photo_url IS NULL OR photo_url = '')
    GROUP BY cargo ORDER BY cargo
  `
  console.log(`\nMissing photos by cargo:`)
  for (const r of missingPhotoByCargo) {
    console.log(`  ${padRight(r.cargo as string, 20)} ${r.cnt} missing (${pct(Number(r.cnt), cargoTotals[r.cargo as string])})`)
  }

  // =====================================================================
  // 3. EMPTY ARRAYS VS NULL VS ACTUAL DATA
  // =====================================================================
  divider('3. EMPTY ARRAYS vs NULL vs ACTUAL DATA')

  // Query all JSONB array fields in a single query to avoid dynamic column references
  const arrayStats = await sql`
    SELECT
      COUNT(*) as total,
      -- education_details
      COUNT(*) FILTER (WHERE education_details::text = '[]') as ed_empty,
      COUNT(*) FILTER (WHERE education_details IS NULL OR education_details::text = 'null') as ed_null,
      COUNT(*) FILTER (WHERE education_details IS NOT NULL AND education_details::text != '[]' AND education_details::text != 'null') as ed_data,
      -- experience_details
      COUNT(*) FILTER (WHERE experience_details::text = '[]') as exp_empty,
      COUNT(*) FILTER (WHERE experience_details IS NULL OR experience_details::text = 'null') as exp_null,
      COUNT(*) FILTER (WHERE experience_details IS NOT NULL AND experience_details::text != '[]' AND experience_details::text != 'null') as exp_data,
      -- political_trajectory
      COUNT(*) FILTER (WHERE political_trajectory::text = '[]') as pt_empty,
      COUNT(*) FILTER (WHERE political_trajectory IS NULL OR political_trajectory::text = 'null') as pt_null,
      COUNT(*) FILTER (WHERE political_trajectory IS NOT NULL AND political_trajectory::text != '[]' AND political_trajectory::text != 'null') as pt_data,
      -- penal_sentences
      COUNT(*) FILTER (WHERE penal_sentences::text = '[]') as pen_empty,
      COUNT(*) FILTER (WHERE penal_sentences IS NULL OR penal_sentences::text = 'null') as pen_null,
      COUNT(*) FILTER (WHERE penal_sentences IS NOT NULL AND penal_sentences::text != '[]' AND penal_sentences::text != 'null') as pen_data,
      -- civil_sentences
      COUNT(*) FILTER (WHERE civil_sentences::text = '[]') as civ_empty,
      COUNT(*) FILTER (WHERE civil_sentences IS NULL OR civil_sentences::text = 'null') as civ_null,
      COUNT(*) FILTER (WHERE civil_sentences IS NOT NULL AND civil_sentences::text != '[]' AND civil_sentences::text != 'null') as civ_data
    FROM candidates
    WHERE is_active = true
  `
  const s = arrayStats[0]
  const total3 = Number(s.total)

  const arrayFieldData = [
    { name: 'education_details',    empty: Number(s.ed_empty),  nullV: Number(s.ed_null),  data: Number(s.ed_data),  label: 'checked, no data' },
    { name: 'experience_details',   empty: Number(s.exp_empty), nullV: Number(s.exp_null), data: Number(s.exp_data), label: 'checked, no data' },
    { name: 'political_trajectory', empty: Number(s.pt_empty),  nullV: Number(s.pt_null),  data: Number(s.pt_data),  label: 'checked, no data' },
    { name: 'penal_sentences',      empty: Number(s.pen_empty), nullV: Number(s.pen_null), data: Number(s.pen_data), label: 'no sentences' },
    { name: 'civil_sentences',      empty: Number(s.civ_empty), nullV: Number(s.civ_null), data: Number(s.civ_data), label: 'no sentences' },
  ]

  for (const af of arrayFieldData) {
    const isSentence = af.name.includes('sentences')
    console.log(`\n${af.name}:`)
    console.log(`  [] (empty${isSentence ? '/clean' : ' array'}):     ${padLeft(String(af.empty), 5)}  (${pct(af.empty, total3)}) -- ${af.label}`)
    console.log(`  NULL:                 ${padLeft(String(af.nullV), 5)}  (${pct(af.nullV, total3)}) -- not yet checked`)
    console.log(`  Has actual data:      ${padLeft(String(af.data), 5)}  (${pct(af.data, total3)}) -- verified data present`)
    console.log(`  Total:                ${padLeft(String(total3), 5)}`)
  }

  // =====================================================================
  // 4. ASSETS DECLARATION QUALITY
  // =====================================================================
  divider('4. ASSETS DECLARATION QUALITY')

  const assetsOverview = await sql`
    SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE assets_declaration IS NULL OR assets_declaration::text = 'null' OR assets_declaration::text = '{}') as no_assets,
      COUNT(*) FILTER (WHERE assets_declaration IS NOT NULL AND assets_declaration::text != 'null' AND assets_declaration::text != '{}') as has_assets
    FROM candidates
    WHERE is_active = true
  `
  const totalCandidates = Number(assetsOverview[0].total)
  const noAssets = Number(assetsOverview[0].no_assets)
  const hasAssets = Number(assetsOverview[0].has_assets)
  console.log(`Total active candidates: ${totalCandidates}`)
  console.log(`With assets_declaration: ${hasAssets} (${pct(hasAssets, totalCandidates)})`)
  console.log(`Without (NULL/empty):    ${noAssets} (${pct(noAssets, totalCandidates)})`)

  // Analyze total_income
  const incomeStats = await sql`
    SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE (assets_declaration->>'total_income')::numeric > 0) as positive_income,
      COUNT(*) FILTER (WHERE (assets_declaration->>'total_income')::numeric = 0) as zero_income,
      COUNT(*) FILTER (WHERE (assets_declaration->>'total_income')::numeric < 0) as negative_income,
      COUNT(*) FILTER (WHERE assets_declaration->>'total_income' IS NULL) as null_income,
      MIN((assets_declaration->>'total_income')::numeric) as min_income,
      MAX((assets_declaration->>'total_income')::numeric) as max_income,
      AVG((assets_declaration->>'total_income')::numeric) as avg_income,
      PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY (assets_declaration->>'total_income')::numeric) as median_income
    FROM candidates
    WHERE is_active = true AND assets_declaration IS NOT NULL AND assets_declaration::text != 'null' AND assets_declaration::text != '{}'
  `
  console.log(`\nIncome distribution (among those with assets data):`)
  console.log(`  total_income > 0:   ${incomeStats[0].positive_income}`)
  console.log(`  total_income = 0:   ${incomeStats[0].zero_income}`)
  console.log(`  total_income < 0:   ${incomeStats[0].negative_income}`)
  console.log(`  total_income NULL:  ${incomeStats[0].null_income}`)
  console.log(`  Min income:         S/. ${Number(incomeStats[0].min_income || 0).toLocaleString()}`)
  console.log(`  Max income:         S/. ${Number(incomeStats[0].max_income || 0).toLocaleString()}`)
  console.log(`  Avg income:         S/. ${Number(incomeStats[0].avg_income || 0).toLocaleString()}`)
  console.log(`  Median income:      S/. ${Number(incomeStats[0].median_income || 0).toLocaleString()}`)

  // Real estate count
  const realEstateStats = await sql`
    SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE (assets_declaration->>'real_estate_count')::int > 0) as with_real_estate,
      COUNT(*) FILTER (WHERE (assets_declaration->>'real_estate_count')::int = 0 OR assets_declaration->>'real_estate_count' IS NULL) as without_real_estate,
      MAX((assets_declaration->>'real_estate_count')::int) as max_real_estate,
      AVG((assets_declaration->>'real_estate_count')::numeric) as avg_real_estate
    FROM candidates
    WHERE is_active = true AND assets_declaration IS NOT NULL AND assets_declaration::text != 'null' AND assets_declaration::text != '{}'
  `
  console.log(`\nReal estate:`)
  console.log(`  real_estate_count > 0: ${realEstateStats[0].with_real_estate}`)
  console.log(`  real_estate_count = 0: ${realEstateStats[0].without_real_estate}`)
  console.log(`  Max count:             ${realEstateStats[0].max_real_estate}`)
  console.log(`  Avg count:             ${Number(realEstateStats[0].avg_real_estate || 0).toFixed(2)}`)

  // Income brackets distribution
  const incomeBrackets = await sql`
    SELECT
      CASE
        WHEN (assets_declaration->>'total_income')::numeric <= 0 THEN '0 or less'
        WHEN (assets_declaration->>'total_income')::numeric <= 12000 THEN '1-12,000'
        WHEN (assets_declaration->>'total_income')::numeric <= 50000 THEN '12,001-50,000'
        WHEN (assets_declaration->>'total_income')::numeric <= 100000 THEN '50,001-100,000'
        WHEN (assets_declaration->>'total_income')::numeric <= 500000 THEN '100,001-500,000'
        WHEN (assets_declaration->>'total_income')::numeric <= 1000000 THEN '500,001-1,000,000'
        ELSE '> 1,000,000'
      END as bracket,
      COUNT(*) as cnt
    FROM candidates
    WHERE is_active = true
      AND assets_declaration IS NOT NULL AND assets_declaration::text != 'null' AND assets_declaration::text != '{}'
      AND assets_declaration->>'total_income' IS NOT NULL
    GROUP BY bracket
    ORDER BY MIN((assets_declaration->>'total_income')::numeric)
  `
  console.log(`\nIncome brackets (S/.):`)
  for (const b of incomeBrackets) {
    console.log(`  ${padRight(b.bracket as string, 22)} ${b.cnt} candidates`)
  }

  // Assets by cargo
  const assetsByCargo = await sql`
    SELECT cargo,
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE assets_declaration IS NOT NULL AND assets_declaration::text != 'null' AND assets_declaration::text != '{}') as has_assets,
      COUNT(*) FILTER (WHERE assets_declaration IS NOT NULL AND assets_declaration::text != 'null' AND assets_declaration::text != '{}' AND (assets_declaration->>'total_income')::numeric > 0) as has_income
    FROM candidates
    WHERE is_active = true
    GROUP BY cargo ORDER BY cargo
  `
  console.log(`\nAssets coverage by cargo:`)
  for (const r of assetsByCargo) {
    const total = Number(r.total)
    console.log(`  ${padRight(r.cargo as string, 20)} assets: ${r.has_assets}/${total} (${pct(Number(r.has_assets), total)})  income>0: ${r.has_income}/${total} (${pct(Number(r.has_income), total)})`)
  }

  // =====================================================================
  // 5. CANDIDATES WITHOUT PROPOSALS
  // =====================================================================
  divider('5. CANDIDATES WITHOUT PROPOSALS')

  const proposalCoverage = await sql`
    SELECT c.cargo, c.full_name, c.slug, p.name as party_name,
           COUNT(cp.id) as proposal_count
    FROM candidates c
    LEFT JOIN candidate_proposals cp ON c.id = cp.candidate_id
    LEFT JOIN parties p ON c.party_id = p.id
    WHERE c.is_active = true
    GROUP BY c.id, c.cargo, c.full_name, c.slug, p.name
    ORDER BY proposal_count ASC, c.cargo, c.full_name
  `
  const withoutProposals = proposalCoverage.filter((r: any) => Number(r.proposal_count) === 0)
  const withProposals = proposalCoverage.filter((r: any) => Number(r.proposal_count) > 0)

  console.log(`Total active candidates:    ${proposalCoverage.length}`)
  console.log(`With proposals:             ${withProposals.length} (${pct(withProposals.length, proposalCoverage.length)})`)
  console.log(`Without proposals:          ${withoutProposals.length} (${pct(withoutProposals.length, proposalCoverage.length)})`)

  // Break down without-proposals by cargo
  const noPropsByCargo: Record<string, number> = {}
  const noPropsTotalByCargo: Record<string, number> = {}
  for (const r of proposalCoverage) {
    const cargo = r.cargo as string
    noPropsTotalByCargo[cargo] = (noPropsTotalByCargo[cargo] || 0) + 1
    if (Number(r.proposal_count) === 0) {
      noPropsByCargo[cargo] = (noPropsByCargo[cargo] || 0) + 1
    }
  }
  console.log(`\nWithout proposals by cargo:`)
  for (const cargo of cargos) {
    const missing = noPropsByCargo[cargo] || 0
    const total = noPropsTotalByCargo[cargo] || 0
    console.log(`  ${padRight(cargo, 20)} ${missing}/${total} missing (${pct(missing, total)})`)
  }

  // List presidential candidates without proposals (if any)
  const presNoProps = withoutProposals.filter((r: any) => r.cargo === 'presidente')
  if (presNoProps.length > 0) {
    console.log(`\nPresidential candidates WITHOUT proposals:`)
    for (const r of presNoProps) {
      console.log(`  - ${r.full_name} (${r.party_name || 'no party'})`)
    }
  } else {
    console.log(`\nAll presidential candidates have proposals.`)
  }

  // Proposal count distribution
  const propCountDist = await sql`
    SELECT
      CASE
        WHEN cnt = 0 THEN '0'
        WHEN cnt BETWEEN 1 AND 5 THEN '1-5'
        WHEN cnt BETWEEN 6 AND 10 THEN '6-10'
        WHEN cnt BETWEEN 11 AND 20 THEN '11-20'
        WHEN cnt BETWEEN 21 AND 50 THEN '21-50'
        ELSE '51+'
      END as bracket,
      COUNT(*) as num_candidates
    FROM (
      SELECT c.id, COUNT(cp.id) as cnt
      FROM candidates c
      LEFT JOIN candidate_proposals cp ON c.id = cp.candidate_id
      WHERE c.is_active = true
      GROUP BY c.id
    ) sub
    GROUP BY bracket
    ORDER BY MIN(cnt)
  `
  console.log(`\nProposal count distribution:`)
  for (const r of propCountDist) {
    console.log(`  ${padRight(r.bracket as string + ' proposals', 20)} ${r.num_candidates} candidates`)
  }

  // =====================================================================
  // 6. INSCRIPTION STATUS
  // =====================================================================
  divider('6. INSCRIPTION STATUS')

  const inscriptionStats = await sql`
    SELECT
      inscription_status,
      COUNT(*) as cnt
    FROM candidates
    WHERE is_active = true
    GROUP BY inscription_status
    ORDER BY cnt DESC
  `
  console.log(`Values in inscription_status (active candidates):`)
  for (const r of inscriptionStats) {
    const status = r.inscription_status === null ? 'NULL' : `"${r.inscription_status}"`
    console.log(`  ${padRight(status, 25)} ${r.cnt} candidates`)
  }

  // Also check across all candidates (including inactive)
  const inscriptionAll = await sql`
    SELECT
      inscription_status,
      is_active,
      COUNT(*) as cnt
    FROM candidates
    GROUP BY inscription_status, is_active
    ORDER BY is_active DESC, cnt DESC
  `
  console.log(`\nInscription status (all candidates, including inactive):`)
  for (const r of inscriptionAll) {
    const status = r.inscription_status === null ? 'NULL' : `"${r.inscription_status}"`
    const active = r.is_active ? 'active' : 'inactive'
    console.log(`  ${padRight(status, 25)} ${padRight(active, 10)} ${r.cnt}`)
  }

  // =====================================================================
  // 7. PARTY COVERAGE
  // =====================================================================
  divider('7. PARTY COVERAGE')

  const partyStats = await sql`
    SELECT
      COUNT(DISTINCT p.id) as unique_parties,
      COUNT(*) as total_candidates,
      COUNT(*) FILTER (WHERE c.party_id IS NULL) as no_party,
      COUNT(*) FILTER (WHERE c.party_id IS NOT NULL) as with_party
    FROM candidates c
    LEFT JOIN parties p ON c.party_id = p.id
    WHERE c.is_active = true
  `
  console.log(`Unique parties:              ${partyStats[0].unique_parties}`)
  console.log(`Total active candidates:     ${partyStats[0].total_candidates}`)
  console.log(`With party_id:               ${partyStats[0].with_party} (${pct(Number(partyStats[0].with_party), Number(partyStats[0].total_candidates))})`)
  console.log(`Without party_id (NULL):     ${partyStats[0].no_party} (${pct(Number(partyStats[0].no_party), Number(partyStats[0].total_candidates))})`)

  // Candidates per party
  const perParty = await sql`
    SELECT p.name, p.short_name, COUNT(c.id) as cnt
    FROM parties p
    LEFT JOIN candidates c ON c.party_id = p.id AND c.is_active = true
    GROUP BY p.id, p.name, p.short_name
    ORDER BY cnt DESC
  `
  console.log(`\nCandidates per party:`)
  for (const r of perParty) {
    const short = r.short_name ? ` (${r.short_name})` : ''
    console.log(`  ${padLeft(String(r.cnt), 4)} | ${r.name}${short}`)
  }

  // List candidates without party
  const noPartyCandidates = await sql`
    SELECT full_name, cargo, slug
    FROM candidates
    WHERE is_active = true AND party_id IS NULL
    ORDER BY cargo, full_name
  `
  if (noPartyCandidates.length > 0) {
    console.log(`\nCandidates without party (${noPartyCandidates.length}):`)
    for (const r of noPartyCandidates) {
      console.log(`  ${padRight(r.cargo as string, 20)} ${r.full_name}`)
    }
  }

  // Parties with no logo
  const noLogos = await sql`
    SELECT name, short_name FROM parties WHERE logo_url IS NULL OR logo_url = ''
  `
  if (noLogos.length > 0) {
    console.log(`\nParties without logo (${noLogos.length}):`)
    for (const r of noLogos) {
      console.log(`  - ${r.name}`)
    }
  }

  // =====================================================================
  // 8. SLUG UNIQUENESS
  // =====================================================================
  divider('8. SLUG UNIQUENESS')

  const slugDupes = await sql`
    SELECT slug, COUNT(*) as cnt
    FROM candidates
    GROUP BY slug
    HAVING COUNT(*) > 1
    ORDER BY cnt DESC
  `
  if (slugDupes.length === 0) {
    console.log('All slugs are unique. No duplicates found.')
  } else {
    console.log(`DUPLICATE SLUGS FOUND (${slugDupes.length}):`)
    for (const r of slugDupes) {
      console.log(`  "${r.slug}" appears ${r.cnt} times`)
      const details = await sql`
        SELECT id, full_name, cargo, is_active FROM candidates WHERE slug = ${r.slug}
      `
      for (const d of details) {
        console.log(`    - ${d.full_name} (${d.cargo}, active=${d.is_active})`)
      }
    }
  }

  // Also check for NULL slugs
  const nullSlugs = await sql`SELECT COUNT(*) as cnt FROM candidates WHERE slug IS NULL OR slug = ''`
  console.log(`\nCandidates with NULL/empty slug: ${nullSlugs[0].cnt}`)

  // Check slug format consistency
  const badSlugs = await sql`
    SELECT slug, full_name FROM candidates
    WHERE slug !~ '^[a-z0-9-]+$'
    LIMIT 20
  `
  if (badSlugs.length > 0) {
    console.log(`\nSlugs with non-standard characters (first 20):`)
    for (const r of badSlugs) {
      console.log(`  "${r.slug}" -> ${r.full_name}`)
    }
  } else {
    console.log(`All slugs follow standard format (lowercase, hyphens, digits only).`)
  }

  // =====================================================================
  // SUMMARY
  // =====================================================================
  divider('SUMMARY')

  // Overall completeness score
  const totalFields = allFields.length
  let overallFilled = 0
  let overallPossible = 0
  for (const f of allFields) {
    for (const c of cargos) {
      overallFilled += (coverage[f][c] || 0)
      overallPossible += (cargoTotals[c] || 0)
    }
  }
  console.log(`Overall field completeness:  ${overallFilled}/${overallPossible} cells filled (${pct(overallFilled, overallPossible)})`)
  console.log(`Active candidates:           ${totalActive}`)
  console.log(`Unique parties:              ${partyStats[0].unique_parties}`)
  console.log(`Slug issues:                 ${slugDupes.length > 0 ? `${slugDupes.length} duplicates` : 'None'}`)
  console.log(`Without proposals:           ${withoutProposals.length}/${proposalCoverage.length}`)

  // Most complete / least complete fields
  const fieldCompleteness: { field: string; pctVal: number }[] = []
  for (const f of allFields) {
    let fieldTotal = 0
    for (const c of cargos) fieldTotal += (coverage[f][c] || 0)
    fieldCompleteness.push({ field: f, pctVal: totalActive > 0 ? fieldTotal / totalActive * 100 : 0 })
  }
  fieldCompleteness.sort((a, b) => b.pctVal - a.pctVal)

  console.log(`\nField completeness ranking:`)
  for (const fc of fieldCompleteness) {
    const bar = '#'.repeat(Math.round(fc.pctVal / 2))
    console.log(`  ${padRight(fc.field, 24)} ${padLeft(fc.pctVal.toFixed(1) + '%', 7)} ${bar}`)
  }

  console.log('\n' + '#'.repeat(80))
  console.log('#  AUDIT COMPLETE')
  console.log('#'.repeat(80))
}

main().catch(console.error)
