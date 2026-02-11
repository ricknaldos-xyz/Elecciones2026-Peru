import * as fs from 'fs'
import * as path from 'path'
import { neon } from '@neondatabase/serverless'

function loadEnv(): string {
  const envPath = path.join(process.cwd(), '.env.local')
  const content = fs.readFileSync(envPath, 'utf-8')
  const match = content.match(/DATABASE_URL=["']?([^"'\n]+)["']?/)
  return match ? match[1] : ''
}

const sql = neon(loadEnv())

function separator(title: string) {
  console.log('\n' + '='.repeat(80))
  console.log(`  ${title}`)
  console.log('='.repeat(80))
}

async function main() {
  // ─── A. Count total candidates with assets_declaration NOT NULL ───
  separator('A. Total candidates with assets_declaration NOT NULL')
  const countResult = await sql`
    SELECT
      COUNT(*) AS total_candidates,
      COUNT(assets_declaration) AS with_assets,
      COUNT(*) - COUNT(assets_declaration) AS without_assets
    FROM candidates
  `
  console.log(`Total candidates:        ${countResult[0].total_candidates}`)
  console.log(`With assets_declaration: ${countResult[0].with_assets}`)
  console.log(`Without (NULL):          ${countResult[0].without_assets}`)

  // ─── B. All distinct top-level property names ───
  separator('B. All distinct top-level property names across all JSONB entries')
  const keysResult = await sql`
    SELECT DISTINCT jsonb_object_keys(assets_declaration) AS key_name
    FROM candidates
    WHERE assets_declaration IS NOT NULL
    ORDER BY key_name
  `
  console.log(`Found ${keysResult.length} distinct top-level keys:`)
  keysResult.forEach(r => console.log(`  - ${r.key_name}`))

  // ─── C. Sample 15 diverse entries (full raw JSONB) ───
  separator('C. Sample 15 diverse entries (full raw JSONB)')
  const sampleResult = await sql`
    WITH ranked AS (
      SELECT
        c.id, c.full_name, p.name AS party_name,
        c.assets_declaration,
        jsonb_typeof(c.assets_declaration->'assets') AS assets_type,
        ROW_NUMBER() OVER (
          PARTITION BY (
            CASE
              WHEN c.assets_declaration ? 'assets' AND jsonb_typeof(c.assets_declaration->'assets') = 'array' THEN 'structured'
              WHEN c.assets_declaration ? 'real_estate_count' THEN 'flat'
              ELSE 'other'
            END
          )
          ORDER BY random()
        ) AS rn
      FROM candidates c
      LEFT JOIN parties p ON c.party_id = p.id
      WHERE c.assets_declaration IS NOT NULL
    )
    SELECT id, full_name, party_name, assets_declaration, assets_type
    FROM ranked
    WHERE rn <= 5
    ORDER BY assets_type NULLS LAST, id
    LIMIT 15
  `
  sampleResult.forEach((r, i) => {
    console.log(`\n--- Sample ${i + 1}: ${r.full_name} (${r.party_name}) [id=${r.id}] ---`)
    console.log(JSON.stringify(r.assets_declaration, null, 2))
  })

  // ─── D & E. Format detection and counts ───
  separator('D & E. Format detection: flat vs structured vs other')
  const formatCounts = await sql`
    SELECT
      CASE
        WHEN assets_declaration ? 'assets' AND jsonb_typeof(assets_declaration->'assets') = 'array' THEN 'structured (has assets array)'
        WHEN assets_declaration ? 'real_estate_count' OR assets_declaration ? 'vehicle_count' THEN 'flat scraper format'
        ELSE 'other/unknown'
      END AS format_type,
      COUNT(*) AS cnt
    FROM candidates
    WHERE assets_declaration IS NOT NULL
    GROUP BY 1
    ORDER BY cnt DESC
  `
  formatCounts.forEach(r => console.log(`  ${r.format_type}: ${r.cnt}`))

  // ─── F. Flat format: distinct property names and sample values ───
  separator('F. Flat format: distinct property names and sample values')
  const flatKeys = await sql`
    SELECT DISTINCT jsonb_object_keys(assets_declaration) AS key_name
    FROM candidates
    WHERE assets_declaration IS NOT NULL
      AND (assets_declaration ? 'real_estate_count' OR assets_declaration ? 'vehicle_count')
    ORDER BY key_name
  `
  console.log(`Flat format top-level keys (${flatKeys.length}):`)
  flatKeys.forEach(r => console.log(`  - ${r.key_name}`))

  // Sample values for each flat key
  console.log('\nSample values per flat-format key:')
  const flatSample = await sql`
    SELECT assets_declaration
    FROM candidates
    WHERE assets_declaration IS NOT NULL
      AND (assets_declaration ? 'real_estate_count' OR assets_declaration ? 'vehicle_count')
    LIMIT 3
  `
  flatSample.forEach((r, i) => {
    console.log(`\n  Flat sample ${i + 1}:`)
    const obj = r.assets_declaration as Record<string, unknown>
    for (const [k, v] of Object.entries(obj)) {
      console.log(`    ${k}: ${JSON.stringify(v)} (${typeof v})`)
    }
  })

  // ─── G. Structured format: show assets array structure ───
  separator('G. Structured format: assets array structure')
  const structuredSample = await sql`
    SELECT id, full_name, assets_declaration
    FROM candidates
    WHERE assets_declaration IS NOT NULL
      AND assets_declaration ? 'assets'
      AND jsonb_typeof(assets_declaration->'assets') = 'array'
    LIMIT 5
  `
  if (structuredSample.length === 0) {
    console.log('  No candidates found with structured (assets array) format.')
  } else {
    structuredSample.forEach((r, i) => {
      console.log(`\n  Structured sample ${i + 1}: ${r.full_name} [id=${r.id}]`)
      console.log(JSON.stringify(r.assets_declaration, null, 2))
    })
  }

  // ─── H. Null/zero/missing values in critical fields ───
  separator('H. Null/zero/missing values in critical fields (flat format)')
  const criticalFields = await sql`
    SELECT
      COUNT(*) FILTER (WHERE NOT assets_declaration ? 'real_estate_count') AS missing_real_estate_count,
      COUNT(*) FILTER (WHERE (assets_declaration->>'real_estate_count')::numeric = 0) AS zero_real_estate_count,
      COUNT(*) FILTER (WHERE NOT assets_declaration ? 'real_estate_total') AS missing_real_estate_total,
      COUNT(*) FILTER (WHERE (assets_declaration->>'real_estate_total')::numeric = 0) AS zero_real_estate_total,
      COUNT(*) FILTER (WHERE NOT assets_declaration ? 'vehicle_count') AS missing_vehicle_count,
      COUNT(*) FILTER (WHERE (assets_declaration->>'vehicle_count')::numeric = 0) AS zero_vehicle_count,
      COUNT(*) FILTER (WHERE NOT assets_declaration ? 'vehicle_total') AS missing_vehicle_total,
      COUNT(*) FILTER (WHERE (assets_declaration->>'vehicle_total')::numeric = 0) AS zero_vehicle_total,
      COUNT(*) FILTER (WHERE NOT assets_declaration ? 'total_income') AS missing_total_income,
      COUNT(*) FILTER (WHERE (assets_declaration->>'total_income')::numeric = 0) AS zero_total_income,
      COUNT(*) AS total_flat
    FROM candidates
    WHERE assets_declaration IS NOT NULL
      AND (assets_declaration ? 'real_estate_count' OR assets_declaration ? 'vehicle_count')
  `
  const cf = criticalFields[0]
  console.log(`Total flat-format entries: ${cf.total_flat}`)
  console.log(`  real_estate_count - missing: ${cf.missing_real_estate_count}, zero: ${cf.zero_real_estate_count}`)
  console.log(`  real_estate_total - missing: ${cf.missing_real_estate_total}, zero: ${cf.zero_real_estate_total}`)
  console.log(`  vehicle_count     - missing: ${cf.missing_vehicle_count}, zero: ${cf.zero_vehicle_count}`)
  console.log(`  vehicle_total     - missing: ${cf.missing_vehicle_total}, zero: ${cf.zero_vehicle_total}`)
  console.log(`  total_income      - missing: ${cf.missing_total_income}, zero: ${cf.zero_total_income}`)

  // ─── I. Check for negative values ───
  separator('I. Check for negative values (should not exist)')
  const negativeCheck = await sql`
    SELECT id, full_name, assets_declaration
    FROM candidates
    WHERE assets_declaration IS NOT NULL
      AND (
        (assets_declaration->>'real_estate_total')::numeric < 0
        OR (assets_declaration->>'vehicle_total')::numeric < 0
        OR (assets_declaration->>'total_income')::numeric < 0
        OR (assets_declaration->>'public_salary')::numeric < 0
        OR (assets_declaration->>'private_salary')::numeric < 0
      )
    LIMIT 20
  `
  if (negativeCheck.length === 0) {
    console.log('  No negative values found. Good!')
  } else {
    console.log(`  Found ${negativeCheck.length} entries with negative values:`)
    negativeCheck.forEach(r => {
      console.log(`    ${r.full_name} [id=${r.id}]: ${JSON.stringify(r.assets_declaration)}`)
    })
  }

  // ─── J. total_value distribution (computed from flat fields) ───
  separator('J. Total value distribution (real_estate_total + vehicle_total)')
  const valueDistribution = await sql`
    WITH vals AS (
      SELECT
        COALESCE((assets_declaration->>'real_estate_total')::numeric, 0) +
        COALESCE((assets_declaration->>'vehicle_total')::numeric, 0) AS total_value
      FROM candidates
      WHERE assets_declaration IS NOT NULL
        AND (assets_declaration ? 'real_estate_count' OR assets_declaration ? 'vehicle_count')
    )
    SELECT
      MIN(total_value) AS min_val,
      MAX(total_value) AS max_val,
      ROUND(AVG(total_value), 2) AS avg_val,
      PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY total_value) AS median_val,
      PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY total_value) AS p25,
      PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY total_value) AS p75,
      PERCENTILE_CONT(0.90) WITHIN GROUP (ORDER BY total_value) AS p90,
      PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY total_value) AS p99,
      COUNT(*) AS cnt
    FROM vals
  `
  const vd = valueDistribution[0]
  console.log(`  Count:  ${vd.cnt}`)
  console.log(`  Min:    ${vd.min_val}`)
  console.log(`  P25:    ${vd.p25}`)
  console.log(`  Median: ${vd.median_val}`)
  console.log(`  Avg:    ${vd.avg_val}`)
  console.log(`  P75:    ${vd.p75}`)
  console.log(`  P90:    ${vd.p90}`)
  console.log(`  P99:    ${vd.p99}`)
  console.log(`  Max:    ${vd.max_val}`)

  // ─── K. Income fields analysis ───
  separator('K. Income fields: total_income, public_salary, private_salary, etc.')
  const incomeFields = await sql`
    SELECT
      COUNT(*) FILTER (WHERE assets_declaration ? 'total_income') AS has_total_income,
      COUNT(*) FILTER (WHERE assets_declaration ? 'public_salary') AS has_public_salary,
      COUNT(*) FILTER (WHERE assets_declaration ? 'private_salary') AS has_private_salary,
      COUNT(*) FILTER (WHERE assets_declaration ? 'public_rent') AS has_public_rent,
      COUNT(*) FILTER (WHERE assets_declaration ? 'private_rent') AS has_private_rent,
      COUNT(*) FILTER (WHERE assets_declaration ? 'other_public') AS has_other_public,
      COUNT(*) FILTER (WHERE assets_declaration ? 'other_private') AS has_other_private,
      COUNT(*) FILTER (WHERE assets_declaration ? 'income_year') AS has_income_year,
      COUNT(*) AS total
    FROM candidates
    WHERE assets_declaration IS NOT NULL
      AND (assets_declaration ? 'real_estate_count' OR assets_declaration ? 'vehicle_count')
  `
  const inc = incomeFields[0]
  console.log(`  Total flat entries:  ${inc.total}`)
  console.log(`  has total_income:    ${inc.has_total_income}`)
  console.log(`  has public_salary:   ${inc.has_public_salary}`)
  console.log(`  has private_salary:  ${inc.has_private_salary}`)
  console.log(`  has public_rent:     ${inc.has_public_rent}`)
  console.log(`  has private_rent:    ${inc.has_private_rent}`)
  console.log(`  has other_public:    ${inc.has_other_public}`)
  console.log(`  has other_private:   ${inc.has_other_private}`)
  console.log(`  has income_year:     ${inc.has_income_year}`)

  // Income distribution
  const incomeDist = await sql`
    WITH vals AS (
      SELECT COALESCE((assets_declaration->>'total_income')::numeric, 0) AS income
      FROM candidates
      WHERE assets_declaration IS NOT NULL
        AND assets_declaration ? 'total_income'
    )
    SELECT
      MIN(income) AS min_val,
      MAX(income) AS max_val,
      ROUND(AVG(income), 2) AS avg_val,
      PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY income) AS median_val,
      COUNT(*) AS cnt,
      COUNT(*) FILTER (WHERE income = 0) AS zero_count,
      COUNT(*) FILTER (WHERE income > 0) AS positive_count
    FROM vals
  `
  const id = incomeDist[0]
  console.log(`\n  Income distribution (total_income field):`)
  console.log(`    Count:    ${id.cnt}`)
  console.log(`    Zero:     ${id.zero_count}`)
  console.log(`    Positive: ${id.positive_count}`)
  console.log(`    Min:      ${id.min_val}`)
  console.log(`    Median:   ${id.median_val}`)
  console.log(`    Avg:      ${id.avg_val}`)
  console.log(`    Max:      ${id.max_val}`)

  // ─── L. Candidates with 0 total assets ───
  separator('L. Candidates with 0 total assets value')
  const zeroAssets = await sql`
    SELECT COUNT(*) AS cnt
    FROM candidates
    WHERE assets_declaration IS NOT NULL
      AND (assets_declaration ? 'real_estate_count' OR assets_declaration ? 'vehicle_count')
      AND (
        COALESCE((assets_declaration->>'real_estate_total')::numeric, 0) +
        COALESCE((assets_declaration->>'vehicle_total')::numeric, 0)
      ) = 0
  `
  console.log(`  Candidates with total assets = 0: ${zeroAssets[0].cnt}`)

  const zeroAssetsSample = await sql`
    SELECT c.id, c.full_name, p.name AS party_name, c.assets_declaration
    FROM candidates c
    LEFT JOIN parties p ON c.party_id = p.id
    WHERE c.assets_declaration IS NOT NULL
      AND (c.assets_declaration ? 'real_estate_count' OR c.assets_declaration ? 'vehicle_count')
      AND (
        COALESCE((c.assets_declaration->>'real_estate_total')::numeric, 0) +
        COALESCE((c.assets_declaration->>'vehicle_total')::numeric, 0)
      ) = 0
    LIMIT 5
  `
  console.log('  Sample zero-asset entries:')
  zeroAssetsSample.forEach(r => {
    console.log(`    ${r.full_name} (${r.party_name}): ${JSON.stringify(r.assets_declaration)}`)
  })

  // ─── M. Candidates with very high and very low values ───
  separator('M. Candidates with very high values (top 10)')
  const highValues = await sql`
    SELECT c.id, c.full_name, p.name AS party_name,
      COALESCE((c.assets_declaration->>'real_estate_total')::numeric, 0) +
      COALESCE((c.assets_declaration->>'vehicle_total')::numeric, 0) AS total_value,
      c.assets_declaration
    FROM candidates c
    LEFT JOIN parties p ON c.party_id = p.id
    WHERE c.assets_declaration IS NOT NULL
      AND (c.assets_declaration ? 'real_estate_count' OR c.assets_declaration ? 'vehicle_count')
    ORDER BY total_value DESC
    LIMIT 10
  `
  highValues.forEach(r => {
    console.log(`  ${r.full_name} (${r.party_name}): total_value=${r.total_value}`)
    console.log(`    raw: ${JSON.stringify(r.assets_declaration)}`)
  })

  separator('M (cont). Candidates with lowest non-zero values (bottom 10)')
  const lowValues = await sql`
    SELECT c.id, c.full_name, p.name AS party_name,
      COALESCE((c.assets_declaration->>'real_estate_total')::numeric, 0) +
      COALESCE((c.assets_declaration->>'vehicle_total')::numeric, 0) AS total_value,
      c.assets_declaration
    FROM candidates c
    LEFT JOIN parties p ON c.party_id = p.id
    WHERE c.assets_declaration IS NOT NULL
      AND (c.assets_declaration ? 'real_estate_count' OR c.assets_declaration ? 'vehicle_count')
      AND (
        COALESCE((c.assets_declaration->>'real_estate_total')::numeric, 0) +
        COALESCE((c.assets_declaration->>'vehicle_total')::numeric, 0)
      ) > 0
    ORDER BY total_value ASC
    LIMIT 10
  `
  lowValues.forEach(r => {
    console.log(`  ${r.full_name} (${r.party_name}): total_value=${r.total_value}`)
    console.log(`    raw: ${JSON.stringify(r.assets_declaration)}`)
  })

  // ─── N. Check for string values where numbers are expected ───
  separator('N. Check for string values where numbers are expected')
  const typeCheckResult = await sql`
    SELECT
      jsonb_typeof(assets_declaration->'real_estate_count') AS real_estate_count_type,
      jsonb_typeof(assets_declaration->'real_estate_total') AS real_estate_total_type,
      jsonb_typeof(assets_declaration->'vehicle_count') AS vehicle_count_type,
      jsonb_typeof(assets_declaration->'vehicle_total') AS vehicle_total_type,
      jsonb_typeof(assets_declaration->'total_income') AS total_income_type,
      jsonb_typeof(assets_declaration->'public_salary') AS public_salary_type,
      jsonb_typeof(assets_declaration->'private_salary') AS private_salary_type,
      jsonb_typeof(assets_declaration->'public_rent') AS public_rent_type,
      jsonb_typeof(assets_declaration->'private_rent') AS private_rent_type,
      jsonb_typeof(assets_declaration->'other_public') AS other_public_type,
      jsonb_typeof(assets_declaration->'other_private') AS other_private_type,
      COUNT(*) AS cnt
    FROM candidates
    WHERE assets_declaration IS NOT NULL
    GROUP BY 1,2,3,4,5,6,7,8,9,10,11
    ORDER BY cnt DESC
  `
  console.log('  JSONB type combinations for numeric fields (type: count):')
  const fieldNames = [
    'real_estate_count', 'real_estate_total',
    'vehicle_count', 'vehicle_total',
    'total_income', 'public_salary', 'private_salary',
    'public_rent', 'private_rent', 'other_public', 'other_private'
  ]
  // Aggregate types per field
  const fieldTypeCounts: Record<string, Record<string, number>> = {}
  for (const fn of fieldNames) fieldTypeCounts[fn] = {}
  for (const row of typeCheckResult) {
    const cnt = Number(row.cnt)
    for (const fn of fieldNames) {
      const t = row[fn + '_type'] || 'null/missing'
      fieldTypeCounts[fn][t] = (fieldTypeCounts[fn][t] || 0) + cnt
    }
  }
  for (const fn of fieldNames) {
    const parts = Object.entries(fieldTypeCounts[fn])
      .sort((a, b) => b[1] - a[1])
      .map(([t, c]) => `${t}:${c}`)
      .join(', ')
    console.log(`  ${fn}: ${parts}`)
  }

  // ─── O. Check djhv_compliant field ───
  separator('O. djhv_compliant field distribution')
  const djhvCheck = await sql`
    SELECT
      COUNT(*) FILTER (WHERE assets_declaration ? 'djhv_compliant') AS has_field,
      COUNT(*) FILTER (WHERE NOT assets_declaration ? 'djhv_compliant') AS missing_field,
      COUNT(*) FILTER (WHERE (assets_declaration->>'djhv_compliant')::text = 'true') AS is_true,
      COUNT(*) FILTER (WHERE (assets_declaration->>'djhv_compliant')::text = 'false') AS is_false,
      COUNT(*) FILTER (WHERE assets_declaration ? 'djhv_compliant' AND assets_declaration->>'djhv_compliant' IS NULL) AS is_null,
      COUNT(*) AS total
    FROM candidates
    WHERE assets_declaration IS NOT NULL
  `
  const dj = djhvCheck[0]
  console.log(`  Total with assets_declaration: ${dj.total}`)
  console.log(`  Has djhv_compliant field:      ${dj.has_field}`)
  console.log(`  Missing djhv_compliant field:   ${dj.missing_field}`)
  console.log(`  djhv_compliant = true:          ${dj.is_true}`)
  console.log(`  djhv_compliant = false:         ${dj.is_false}`)
  console.log(`  djhv_compliant = null:          ${dj.is_null}`)

  // ─── Extra: Check for 'source' field ───
  separator('Extra: Check for "source" field')
  const sourceCheck = await sql`
    SELECT
      COUNT(*) FILTER (WHERE assets_declaration ? 'source') AS has_source,
      COUNT(*) FILTER (WHERE NOT assets_declaration ? 'source') AS no_source,
      COUNT(*) AS total
    FROM candidates
    WHERE assets_declaration IS NOT NULL
  `
  console.log(`  Has source: ${sourceCheck[0].has_source}`)
  console.log(`  No source:  ${sourceCheck[0].no_source}`)

  if (Number(sourceCheck[0].has_source) > 0) {
    const sourceDist = await sql`
      SELECT assets_declaration->>'source' AS source_val, COUNT(*) AS cnt
      FROM candidates
      WHERE assets_declaration IS NOT NULL
        AND assets_declaration ? 'source'
      GROUP BY 1
      ORDER BY cnt DESC
      LIMIT 10
    `
    console.log('  Source value distribution:')
    sourceDist.forEach(r => console.log(`    "${r.source_val}": ${r.cnt}`))
  }

  // ─── Extra: Distinct income_year values ───
  separator('Extra: Distinct income_year values')
  const yearDist = await sql`
    SELECT assets_declaration->>'income_year' AS yr, COUNT(*) AS cnt
    FROM candidates
    WHERE assets_declaration IS NOT NULL
      AND assets_declaration ? 'income_year'
    GROUP BY 1
    ORDER BY yr
  `
  if (yearDist.length === 0) {
    console.log('  No income_year values found.')
  } else {
    yearDist.forEach(r => console.log(`  ${r.yr}: ${r.cnt}`))
  }

  console.log('\n\nDone! Analysis complete.')
}

main().catch(console.error)
