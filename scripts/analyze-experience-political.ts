import * as fs from 'fs'
import * as path from 'path'
import { neon } from '@neondatabase/serverless'

function loadEnv(): string {
  const envPath = path.join(process.cwd(), '.env.local')
  const content = fs.readFileSync(envPath, 'utf-8')
  const match = content.match(/DATABASE_URL=["']?([^"'\n]+)["']?/)
  if (!match) throw new Error('DATABASE_URL not found in .env.local')
  return match[1]
}

const sql = neon(loadEnv())

// ============================================
// Helpers
// ============================================

function collectKeys(entries: Record<string, unknown>[]): Map<string, number> {
  const keyCounts = new Map<string, number>()
  for (const entry of entries) {
    for (const key of Object.keys(entry)) {
      keyCounts.set(key, (keyCounts.get(key) || 0) + 1)
    }
  }
  return keyCounts
}

function printSection(title: string) {
  const bar = '='.repeat(70)
  console.log(`\n${bar}`)
  console.log(`  ${title}`)
  console.log(bar)
}

function printSubSection(title: string) {
  console.log(`\n--- ${title} ---`)
}

function printTable(headers: string[], rows: string[][]) {
  const colWidths = headers.map((h, i) =>
    Math.max(h.length, ...rows.map(r => (r[i] || '').length))
  )
  const sep = colWidths.map(w => '-'.repeat(w + 2)).join('+')
  const fmtRow = (r: string[]) =>
    r.map((c, i) => ` ${(c || '').padEnd(colWidths[i])} `).join('|')

  console.log(sep)
  console.log(fmtRow(headers))
  console.log(sep)
  rows.forEach(r => console.log(fmtRow(r)))
  console.log(sep)
}

// ============================================
// Main
// ============================================

async function main() {
  console.log('Connecting to Neon database...')

  // ==========================================
  // EXPERIENCE_DETAILS analysis
  // ==========================================
  printSection('EXPERIENCE_DETAILS analysis')

  // 1. Count candidates with experience_details and total entries
  const expCountRows = await sql`
    SELECT
      COUNT(*) AS candidates_with_experience,
      SUM(jsonb_array_length(experience_details)) AS total_entries
    FROM candidates
    WHERE experience_details IS NOT NULL
      AND jsonb_array_length(experience_details) > 0
  `
  const expCount = expCountRows[0]
  console.log(`\nCandidates with experience_details: ${expCount.candidates_with_experience}`)
  console.log(`Total experience entries across all candidates: ${expCount.total_entries}`)

  // 2. Get ALL distinct property names from every JSONB entry
  printSubSection('All distinct property names in experience_details entries')
  const expKeyRows = await sql`
    SELECT DISTINCT key_name, COUNT(*) as occurrences
    FROM candidates,
         jsonb_array_elements(experience_details) AS elem,
         jsonb_object_keys(elem) AS key_name
    WHERE experience_details IS NOT NULL
      AND jsonb_array_length(experience_details) > 0
    GROUP BY key_name
    ORDER BY occurrences DESC
  `
  printTable(
    ['Property Name', 'Occurrences'],
    expKeyRows.map(r => [String(r.key_name), String(r.occurrences)])
  )

  // 3. Sample 10 entries
  printSubSection('Sample 10 experience_details entries (raw JSONB)')
  const expSampleRows = await sql`
    SELECT c.full_name, elem
    FROM candidates c,
         jsonb_array_elements(c.experience_details) AS elem
    WHERE c.experience_details IS NOT NULL
      AND jsonb_array_length(c.experience_details) > 0
    LIMIT 10
  `
  expSampleRows.forEach((r, i) => {
    console.log(`\n  [${i + 1}] ${r.full_name}:`)
    console.log(`      ${JSON.stringify(r.elem, null, 2).split('\n').join('\n      ')}`)
  })

  // 4. Check naming conventions: organization vs institution, sector vs type, start_date vs year_start
  printSubSection('Naming convention check for experience_details')
  const expNamingRows = await sql`
    SELECT
      COUNT(*) FILTER (WHERE elem ? 'organization') AS has_organization,
      COUNT(*) FILTER (WHERE elem ? 'institution') AS has_institution,
      COUNT(*) FILTER (WHERE elem ? 'sector') AS has_sector,
      COUNT(*) FILTER (WHERE elem ? 'type') AS has_type,
      COUNT(*) FILTER (WHERE elem ? 'start_date') AS has_start_date,
      COUNT(*) FILTER (WHERE elem ? 'year_start') AS has_year_start,
      COUNT(*) FILTER (WHERE elem ? 'end_date') AS has_end_date,
      COUNT(*) FILTER (WHERE elem ? 'year_end') AS has_year_end,
      COUNT(*) FILTER (WHERE elem ? 'role_type') AS has_role_type,
      COUNT(*) FILTER (WHERE elem ? 'seniority_level') AS has_seniority_level,
      COUNT(*) FILTER (WHERE elem ? 'is_current') AS has_is_current,
      COUNT(*) FILTER (WHERE elem ? 'description') AS has_description,
      COUNT(*) FILTER (WHERE elem ? 'position') AS has_position,
      COUNT(*) FILTER (WHERE elem ? 'is_verified') AS has_is_verified,
      COUNT(*) FILTER (WHERE elem ? 'source') AS has_source
    FROM candidates,
         jsonb_array_elements(experience_details) AS elem
    WHERE experience_details IS NOT NULL
      AND jsonb_array_length(experience_details) > 0
  `
  const en = expNamingRows[0]
  printTable(
    ['Property', 'Count', 'Used by'],
    [
      ['organization', String(en.has_organization), 'database.ts ExperienceDetail'],
      ['institution', String(en.has_institution), 'queries.ts ExperienceRecord'],
      ['sector', String(en.has_sector), 'database.ts ExperienceDetail'],
      ['type', String(en.has_type), 'queries.ts ExperienceRecord'],
      ['start_date', String(en.has_start_date), 'database.ts ExperienceDetail'],
      ['year_start', String(en.has_year_start), 'queries.ts ExperienceRecord'],
      ['end_date', String(en.has_end_date), 'database.ts ExperienceDetail'],
      ['year_end', String(en.has_year_end), 'queries.ts ExperienceRecord'],
      ['role_type', String(en.has_role_type), 'database.ts ExperienceDetail'],
      ['seniority_level', String(en.has_seniority_level), 'database.ts ExperienceDetail'],
      ['is_current', String(en.has_is_current), 'database.ts ExperienceDetail'],
      ['position', String(en.has_position), 'both'],
      ['description', String(en.has_description), 'both'],
      ['is_verified', String(en.has_is_verified), 'database.ts ExperienceDetail'],
      ['source', String(en.has_source), 'database.ts ExperienceDetail'],
    ]
  )

  // 5. Count entries with missing/null critical fields
  printSubSection('Missing/null critical fields in experience_details')
  const expMissingRows = await sql`
    SELECT
      COUNT(*) AS total_entries,
      COUNT(*) FILTER (WHERE elem->>'position' IS NULL OR elem->>'position' = '') AS missing_position,
      COUNT(*) FILTER (
        WHERE (elem->>'institution' IS NULL OR elem->>'institution' = '')
          AND (elem->>'organization' IS NULL OR elem->>'organization' = '')
      ) AS missing_institution_and_organization,
      COUNT(*) FILTER (
        WHERE (elem->>'year_start' IS NULL)
          AND (elem->>'start_date' IS NULL)
      ) AS missing_any_start,
      COUNT(*) FILTER (
        WHERE (elem->>'year_end' IS NULL)
          AND (elem->>'end_date' IS NULL)
      ) AS missing_any_end,
      COUNT(*) FILTER (
        WHERE (elem->>'type' IS NULL OR elem->>'type' = '')
          AND (elem->>'sector' IS NULL OR elem->>'sector' = '')
      ) AS missing_type_and_sector
    FROM candidates,
         jsonb_array_elements(experience_details) AS elem
    WHERE experience_details IS NOT NULL
      AND jsonb_array_length(experience_details) > 0
  `
  const em = expMissingRows[0]
  printTable(
    ['Critical Field(s)', 'Missing Count', 'of Total'],
    [
      ['position', String(em.missing_position), String(em.total_entries)],
      ['institution AND organization (both)', String(em.missing_institution_and_organization), String(em.total_entries)],
      ['year_start AND start_date (both)', String(em.missing_any_start), String(em.total_entries)],
      ['year_end AND end_date (both)', String(em.missing_any_end), String(em.total_entries)],
      ['type AND sector (both)', String(em.missing_type_and_sector), String(em.total_entries)],
    ]
  )

  // 6. Check for year_start > year_end data errors
  printSubSection('Data errors: year_start > year_end in experience_details')
  const expYearErrorRows = await sql`
    SELECT c.full_name, elem
    FROM candidates c,
         jsonb_array_elements(c.experience_details) AS elem
    WHERE c.experience_details IS NOT NULL
      AND jsonb_array_length(c.experience_details) > 0
      AND (
        (elem->>'year_start' IS NOT NULL AND elem->>'year_end' IS NOT NULL
         AND (elem->>'year_start')::int > (elem->>'year_end')::int)
        OR
        (elem->>'start_date' IS NOT NULL AND elem->>'end_date' IS NOT NULL
         AND elem->>'start_date' > elem->>'end_date')
      )
    LIMIT 20
  `
  if (expYearErrorRows.length === 0) {
    console.log('  No year_start > year_end errors found.')
  } else {
    console.log(`  Found ${expYearErrorRows.length} entries with year_start > year_end:`)
    expYearErrorRows.forEach((r, i) => {
      console.log(`    [${i + 1}] ${r.full_name}: ${JSON.stringify(r.elem)}`)
    })
  }

  // 7. Check entries where type/sector is not 'publico' or 'privado'
  printSubSection('Distinct type/sector values in experience_details')
  const expTypeRows = await sql`
    SELECT
      COALESCE(elem->>'type', elem->>'sector') AS type_or_sector,
      COUNT(*) AS count
    FROM candidates,
         jsonb_array_elements(experience_details) AS elem
    WHERE experience_details IS NOT NULL
      AND jsonb_array_length(experience_details) > 0
      AND (elem->>'type' IS NOT NULL OR elem->>'sector' IS NOT NULL)
    GROUP BY type_or_sector
    ORDER BY count DESC
  `
  printTable(
    ['type/sector value', 'Count', 'Expected?'],
    expTypeRows.map(r => [
      String(r.type_or_sector),
      String(r.count),
      ['publico', 'privado'].includes(String(r.type_or_sector)) ? 'YES' : 'NO (unexpected)',
    ])
  )

  // ==========================================
  // POLITICAL_TRAJECTORY analysis
  // ==========================================
  printSection('POLITICAL_TRAJECTORY analysis')

  // 1. Count
  const polCountRows = await sql`
    SELECT
      COUNT(*) AS candidates_with_trajectory,
      SUM(jsonb_array_length(political_trajectory)) AS total_entries
    FROM candidates
    WHERE political_trajectory IS NOT NULL
      AND jsonb_array_length(political_trajectory) > 0
  `
  const polCount = polCountRows[0]
  console.log(`\nCandidates with political_trajectory: ${polCount.candidates_with_trajectory}`)
  console.log(`Total political_trajectory entries across all candidates: ${polCount.total_entries}`)

  // 2. All distinct property names
  printSubSection('All distinct property names in political_trajectory entries')
  const polKeyRows = await sql`
    SELECT DISTINCT key_name, COUNT(*) as occurrences
    FROM candidates,
         jsonb_array_elements(political_trajectory) AS elem,
         jsonb_object_keys(elem) AS key_name
    WHERE political_trajectory IS NOT NULL
      AND jsonb_array_length(political_trajectory) > 0
    GROUP BY key_name
    ORDER BY occurrences DESC
  `
  printTable(
    ['Property Name', 'Occurrences'],
    polKeyRows.map(r => [String(r.key_name), String(r.occurrences)])
  )

  // 3. Sample 10
  printSubSection('Sample 10 political_trajectory entries (raw JSONB)')
  const polSampleRows = await sql`
    SELECT c.full_name, elem
    FROM candidates c,
         jsonb_array_elements(c.political_trajectory) AS elem
    WHERE c.political_trajectory IS NOT NULL
      AND jsonb_array_length(c.political_trajectory) > 0
    LIMIT 10
  `
  polSampleRows.forEach((r, i) => {
    console.log(`\n  [${i + 1}] ${r.full_name}:`)
    console.log(`      ${JSON.stringify(r.elem, null, 2).split('\n').join('\n      ')}`)
  })

  // 4. Check naming conventions
  printSubSection('Naming convention check for political_trajectory')
  const polNamingRows = await sql`
    SELECT
      COUNT(*) FILTER (WHERE elem ? 'start_date') AS has_start_date,
      COUNT(*) FILTER (WHERE elem ? 'year_start') AS has_year_start,
      COUNT(*) FILTER (WHERE elem ? 'end_date') AS has_end_date,
      COUNT(*) FILTER (WHERE elem ? 'year_end') AS has_year_end,
      COUNT(*) FILTER (WHERE elem ? 'year') AS has_year,
      COUNT(*) FILTER (WHERE elem ? 'is_elected') AS has_is_elected,
      COUNT(*) FILTER (WHERE elem ? 'result') AS has_result,
      COUNT(*) FILTER (WHERE elem ? 'position') AS has_position,
      COUNT(*) FILTER (WHERE elem ? 'party') AS has_party,
      COUNT(*) FILTER (WHERE elem ? 'type') AS has_type,
      COUNT(*) FILTER (WHERE elem ? 'institution') AS has_institution,
      COUNT(*) FILTER (WHERE elem ? 'description') AS has_description,
      COUNT(*) FILTER (WHERE elem ? 'source') AS has_source
    FROM candidates,
         jsonb_array_elements(political_trajectory) AS elem
    WHERE political_trajectory IS NOT NULL
      AND jsonb_array_length(political_trajectory) > 0
  `
  const pn = polNamingRows[0]
  printTable(
    ['Property', 'Count', 'Used by'],
    [
      ['start_date', String(pn.has_start_date), 'database.ts PoliticalTrajectory'],
      ['year_start', String(pn.has_year_start), 'queries.ts PoliticalRecord'],
      ['end_date', String(pn.has_end_date), 'database.ts PoliticalTrajectory'],
      ['year_end', String(pn.has_year_end), 'queries.ts PoliticalRecord'],
      ['year', String(pn.has_year), 'queries.ts PoliticalRecord'],
      ['is_elected', String(pn.has_is_elected), 'database.ts PoliticalTrajectory'],
      ['result', String(pn.has_result), 'queries.ts PoliticalRecord'],
      ['position', String(pn.has_position), 'both'],
      ['party', String(pn.has_party), 'both'],
      ['type', String(pn.has_type), 'queries.ts PoliticalRecord'],
      ['institution', String(pn.has_institution), 'queries.ts PoliticalRecord'],
      ['description', String(pn.has_description), 'database.ts PoliticalTrajectory'],
      ['source', String(pn.has_source), 'database.ts PoliticalTrajectory'],
    ]
  )

  // 5. Count all distinct type values
  printSubSection('Distinct "type" values in political_trajectory')
  const polTypeRows = await sql`
    SELECT elem->>'type' AS type_val, COUNT(*) AS count
    FROM candidates,
         jsonb_array_elements(political_trajectory) AS elem
    WHERE political_trajectory IS NOT NULL
      AND jsonb_array_length(political_trajectory) > 0
      AND elem->>'type' IS NOT NULL
    GROUP BY type_val
    ORDER BY count DESC
  `
  printTable(
    ['type value', 'Count'],
    polTypeRows.map(r => [String(r.type_val), String(r.count)])
  )

  // 6. Missing dates
  printSubSection('Entries with missing date fields in political_trajectory')
  const polMissingDateRows = await sql`
    SELECT
      COUNT(*) AS total_entries,
      COUNT(*) FILTER (
        WHERE (elem->>'year_start' IS NULL)
          AND (elem->>'start_date' IS NULL)
          AND (elem->>'year' IS NULL)
      ) AS missing_all_start_dates,
      COUNT(*) FILTER (
        WHERE (elem->>'year_end' IS NULL)
          AND (elem->>'end_date' IS NULL)
      ) AS missing_all_end_dates
    FROM candidates,
         jsonb_array_elements(political_trajectory) AS elem
    WHERE political_trajectory IS NOT NULL
      AND jsonb_array_length(political_trajectory) > 0
  `
  const pm = polMissingDateRows[0]
  printTable(
    ['Date Field(s) Missing', 'Count', 'of Total'],
    [
      ['year_start AND start_date AND year (all)', String(pm.missing_all_start_dates), String(pm.total_entries)],
      ['year_end AND end_date (both)', String(pm.missing_all_end_dates), String(pm.total_entries)],
    ]
  )

  // 7. Invalid year ranges
  printSubSection('Data errors: year_start > year_end in political_trajectory')
  const polYearErrorRows = await sql`
    SELECT c.full_name, elem
    FROM candidates c,
         jsonb_array_elements(c.political_trajectory) AS elem
    WHERE c.political_trajectory IS NOT NULL
      AND jsonb_array_length(c.political_trajectory) > 0
      AND (
        (elem->>'year_start' IS NOT NULL AND elem->>'year_end' IS NOT NULL
         AND (elem->>'year_start')::int > (elem->>'year_end')::int)
        OR
        (elem->>'start_date' IS NOT NULL AND elem->>'end_date' IS NOT NULL
         AND elem->>'start_date' > elem->>'end_date')
      )
    LIMIT 20
  `
  if (polYearErrorRows.length === 0) {
    console.log('  No year_start > year_end errors found.')
  } else {
    console.log(`  Found ${polYearErrorRows.length} entries with year_start > year_end:`)
    polYearErrorRows.forEach((r, i) => {
      console.log(`    [${i + 1}] ${r.full_name}: ${JSON.stringify(r.elem)}`)
    })
  }

  // ==========================================
  // MISMATCH COMPARISON TABLE
  // ==========================================
  printSection('DB Property vs App Type Mismatch Comparison')

  console.log('\n  This table shows which property names actually exist in the DB JSONB')
  console.log('  versus what each TypeScript interface expects.\n')

  // Gather the actual DB key names
  const expDbKeys = new Set(expKeyRows.map(r => String(r.key_name)))
  const polDbKeys = new Set(polKeyRows.map(r => String(r.key_name)))

  const dbTypeProps = {
    experience: ['role_type', 'position', 'organization', 'sector', 'start_date', 'end_date', 'is_current', 'description', 'seniority_level', 'is_verified', 'source'],
    political: ['position', 'party', 'start_date', 'end_date', 'is_elected', 'description', 'source'],
  }
  const queryTypeProps = {
    experience: ['type', 'institution', 'position', 'year_start', 'year_end', 'description'],
    political: ['type', 'party', 'position', 'year_start', 'year_end', 'year', 'institution', 'result'],
  }

  console.log('  EXPERIENCE_DETAILS:')
  printTable(
    ['DB Property', 'In DB?', 'In database.ts?', 'In queries.ts?', 'Status'],
    [...new Set([...dbTypeProps.experience, ...queryTypeProps.experience, ...expDbKeys])].sort().map(prop => {
      const inDb = expDbKeys.has(prop) ? 'YES' : 'NO'
      const inDbTs = dbTypeProps.experience.includes(prop) ? 'YES' : 'NO'
      const inQTs = queryTypeProps.experience.includes(prop) ? 'YES' : 'NO'
      let status = ''
      if (inDb === 'YES' && inDbTs === 'NO' && inQTs === 'NO') status = 'IN DB BUT NOT IN ANY TYPE'
      else if (inDb === 'NO' && (inDbTs === 'YES' || inQTs === 'YES')) status = 'IN TYPE BUT NOT IN DB'
      else if (inDb === 'YES' && inDbTs === 'YES' && inQTs === 'YES') status = 'OK (both types)'
      else if (inDb === 'YES' && inDbTs === 'YES') status = 'OK (database.ts only)'
      else if (inDb === 'YES' && inQTs === 'YES') status = 'OK (queries.ts only)'
      else status = 'OK'
      return [prop, inDb, inDbTs, inQTs, status]
    })
  )

  console.log('\n  POLITICAL_TRAJECTORY:')
  printTable(
    ['DB Property', 'In DB?', 'In database.ts?', 'In queries.ts?', 'Status'],
    [...new Set([...dbTypeProps.political, ...queryTypeProps.political, ...polDbKeys])].sort().map(prop => {
      const inDb = polDbKeys.has(prop) ? 'YES' : 'NO'
      const inDbTs = dbTypeProps.political.includes(prop) ? 'YES' : 'NO'
      const inQTs = queryTypeProps.political.includes(prop) ? 'YES' : 'NO'
      let status = ''
      if (inDb === 'YES' && inDbTs === 'NO' && inQTs === 'NO') status = 'IN DB BUT NOT IN ANY TYPE'
      else if (inDb === 'NO' && (inDbTs === 'YES' || inQTs === 'YES')) status = 'IN TYPE BUT NOT IN DB'
      else if (inDb === 'YES' && inDbTs === 'YES' && inQTs === 'YES') status = 'OK (both types)'
      else if (inDb === 'YES' && inDbTs === 'YES') status = 'OK (database.ts only)'
      else if (inDb === 'YES' && inQTs === 'YES') status = 'OK (queries.ts only)'
      else status = 'OK'
      return [prop, inDb, inDbTs, inQTs, status]
    })
  )

  // ==========================================
  // KEY FINDINGS
  // ==========================================
  printSection('KEY FINDINGS SUMMARY')

  // experience_details naming
  const expUsesOrg = Number(en.has_organization) > 0
  const expUsesInst = Number(en.has_institution) > 0
  const expUsesSector = Number(en.has_sector) > 0
  const expUsesType = Number(en.has_type) > 0
  const expUsesStartDate = Number(en.has_start_date) > 0
  const expUsesYearStart = Number(en.has_year_start) > 0
  const expUsesEndDate = Number(en.has_end_date) > 0
  const expUsesYearEnd = Number(en.has_year_end) > 0

  console.log('\n  experience_details naming:')
  console.log(`    organization vs institution: ${expUsesOrg ? 'organization=' + en.has_organization : 'NO organization'} | ${expUsesInst ? 'institution=' + en.has_institution : 'NO institution'}`)
  console.log(`    sector vs type: ${expUsesSector ? 'sector=' + en.has_sector : 'NO sector'} | ${expUsesType ? 'type=' + en.has_type : 'NO type'}`)
  console.log(`    start_date vs year_start: ${expUsesStartDate ? 'start_date=' + en.has_start_date : 'NO start_date'} | ${expUsesYearStart ? 'year_start=' + en.has_year_start : 'NO year_start'}`)
  console.log(`    end_date vs year_end: ${expUsesEndDate ? 'end_date=' + en.has_end_date : 'NO end_date'} | ${expUsesYearEnd ? 'year_end=' + en.has_year_end : 'NO year_end'}`)

  // political_trajectory naming
  const polUsesStartDate = Number(pn.has_start_date) > 0
  const polUsesYearStart = Number(pn.has_year_start) > 0
  const polUsesEndDate = Number(pn.has_end_date) > 0
  const polUsesYearEnd = Number(pn.has_year_end) > 0
  const polUsesIsElected = Number(pn.has_is_elected) > 0
  const polUsesResult = Number(pn.has_result) > 0

  console.log('\n  political_trajectory naming:')
  console.log(`    start_date vs year_start: ${polUsesStartDate ? 'start_date=' + pn.has_start_date : 'NO start_date'} | ${polUsesYearStart ? 'year_start=' + pn.has_year_start : 'NO year_start'}`)
  console.log(`    end_date vs year_end: ${polUsesEndDate ? 'end_date=' + pn.has_end_date : 'NO end_date'} | ${polUsesYearEnd ? 'year_end=' + pn.has_year_end : 'NO year_end'}`)
  console.log(`    is_elected vs result: ${polUsesIsElected ? 'is_elected=' + pn.has_is_elected : 'NO is_elected'} | ${polUsesResult ? 'result=' + pn.has_result : 'NO result'}`)

  console.log('\n  The code at queries.ts line 924 does:')
  console.log('    experience_details: (row.experience_details as ExperienceRecord[]) || []')
  console.log('  This raw cast means if the DB uses "institution" but the type expects "organization",')
  console.log('  or vice versa, the properties will be silently undefined at runtime.\n')

  console.log('Done.')
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
