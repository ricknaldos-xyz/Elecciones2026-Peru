/**
 * Verify Education "en curso" Fix - Comprehensive Audit
 *
 * Checks:
 * 1. Count remaining entries with is_completed=false
 * 2. Sample 20 random is_completed=false entries for manual review
 * 3. Universitario entries with has_title/has_bachelor=true but is_completed=false
 * 4. Entries with bachelor_year or title_year set but is_completed=false
 * 5. Entries with is_completed=true but NO year info (showing "Completado" badge)
 */

import { neon } from '@neondatabase/serverless'
import * as fs from 'fs'
import * as path from 'path'

// Load DATABASE_URL from .env.local
const envPath = path.join(process.cwd(), '.env.local')
const envContent = fs.readFileSync(envPath, 'utf-8')
const dbMatch = envContent.match(/DATABASE_URL=["']?([^"'\n]+)["']?/)
const DATABASE_URL = dbMatch ? dbMatch[1] : process.env.DATABASE_URL!
const sql = neon(DATABASE_URL)

interface EducationEntry {
  level: string
  degree: string
  institution: string
  is_completed: boolean
  completed?: boolean
  has_title?: boolean
  has_bachelor?: boolean
  title_year?: string | null
  bachelor_year?: string | null
  year?: string | null
  end_date?: string | null
  start_date?: string | null
  source?: string
  [key: string]: unknown
}

async function main() {
  console.log('='.repeat(70))
  console.log('  VERIFY: Education "en curso" Fix - Comprehensive Audit')
  console.log('='.repeat(70))
  console.log()

  // ─── Fetch all candidates with education data ────────────────────────
  const candidates = await sql`
    SELECT id, full_name, education_details
    FROM candidates
    WHERE education_details IS NOT NULL
      AND jsonb_array_length(education_details) > 0
    ORDER BY full_name
  `

  console.log(`Total candidates with education data: ${candidates.length}`)

  // Flatten all entries
  const allEntries: { name: string; entry: EducationEntry }[] = []
  for (const c of candidates) {
    const details = c.education_details as EducationEntry[]
    for (const entry of details) {
      allEntries.push({ name: c.full_name as string, entry })
    }
  }
  console.log(`Total education entries: ${allEntries.length}`)
  console.log()

  // ─── CHECK 1: Count remaining is_completed=false ─────────────────────
  console.log('─'.repeat(70))
  console.log('CHECK 1: Count remaining entries with is_completed=false')
  console.log('─'.repeat(70))

  const incomplete = allEntries.filter(e => !e.entry.is_completed && !e.entry.completed)
  const complete = allEntries.filter(e => e.entry.is_completed || e.entry.completed)

  console.log(`  is_completed=false: ${incomplete.length}`)
  console.log(`  is_completed=true:  ${complete.length}`)
  console.log(`  Ratio: ${((complete.length / allEntries.length) * 100).toFixed(1)}% completed`)
  console.log()

  // Breakdown by level
  const incompleteByLevel: Record<string, number> = {}
  for (const e of incomplete) {
    const level = e.entry.level || 'UNKNOWN'
    incompleteByLevel[level] = (incompleteByLevel[level] || 0) + 1
  }
  console.log('  Incomplete entries by level:')
  for (const [level, count] of Object.entries(incompleteByLevel).sort((a, b) => b[1] - a[1])) {
    console.log(`    ${level}: ${count}`)
  }
  console.log()

  // ─── CHECK 2: Sample 20 random is_completed=false entries ────────────
  console.log('─'.repeat(70))
  console.log('CHECK 2: Sample 20 random entries with is_completed=false')
  console.log('─'.repeat(70))

  // Shuffle and take 20
  const shuffled = [...incomplete].sort(() => Math.random() - 0.5)
  const sample = shuffled.slice(0, 20)

  for (const s of sample) {
    const e = s.entry
    const yearInfo = [
      e.title_year ? `title_year=${e.title_year}` : null,
      e.bachelor_year ? `bachelor_year=${e.bachelor_year}` : null,
      e.year ? `year=${e.year}` : null,
      e.end_date ? `end_date=${e.end_date}` : null,
      e.start_date ? `start_date=${e.start_date}` : null,
    ].filter(Boolean).join(', ')

    const flags = [
      e.has_title ? 'has_title=true' : null,
      e.has_bachelor ? 'has_bachelor=true' : null,
    ].filter(Boolean).join(', ')

    console.log(`  ${s.name}`)
    console.log(`    Level: ${e.level} | Degree: "${e.degree || '(none)'}" | Institution: "${e.institution}"`)
    if (yearInfo) console.log(`    Dates: ${yearInfo}`)
    if (flags) console.log(`    Flags: ${flags}`)
    console.log()
  }

  // ─── CHECK 3: Universitario with has_title/has_bachelor but incomplete ─
  console.log('─'.repeat(70))
  console.log('CHECK 3: Universitario with has_title=true or has_bachelor=true but is_completed=false')
  console.log('─'.repeat(70))

  const check3 = incomplete.filter(e =>
    e.entry.level === 'Universitario' &&
    (e.entry.has_title === true || e.entry.has_bachelor === true)
  )

  console.log(`  Found: ${check3.length}`)
  if (check3.length > 0) {
    console.log('  ** THESE ARE BUGS - should have been fixed **')
    for (const s of check3.slice(0, 20)) {
      const e = s.entry
      console.log(`    ${s.name}: "${e.degree}" at "${e.institution}" (has_title=${e.has_title}, has_bachelor=${e.has_bachelor})`)
    }
  } else {
    console.log('  PASS - No mismatches found')
  }
  console.log()

  // ─── CHECK 4: Entries with bachelor_year/title_year set but incomplete ─
  console.log('─'.repeat(70))
  console.log('CHECK 4: Entries with bachelor_year or title_year set but is_completed=false')
  console.log('─'.repeat(70))

  const check4 = incomplete.filter(e =>
    e.entry.bachelor_year || e.entry.title_year
  )

  console.log(`  Found: ${check4.length}`)
  if (check4.length > 0) {
    console.log('  ** THESE ARE BUGS - should have been fixed **')
    for (const s of check4.slice(0, 20)) {
      const e = s.entry
      console.log(`    ${s.name}: level="${e.level}" degree="${e.degree}" (bachelor_year=${e.bachelor_year}, title_year=${e.title_year})`)
    }
  } else {
    console.log('  PASS - No mismatches found')
  }
  console.log()

  // ─── CHECK 5: is_completed=true but NO year info ────────────────────
  console.log('─'.repeat(70))
  console.log('CHECK 5: is_completed=true but NO year info (will show "Completado" badge)')
  console.log('─'.repeat(70))

  const check5 = complete.filter(e => {
    const entry = e.entry
    return !entry.title_year && !entry.bachelor_year && !entry.year && !entry.end_date
  })

  console.log(`  Found: ${check5.length} out of ${complete.length} completed entries`)
  console.log(`  (These will show "Completado" badge instead of a year)`)
  console.log()

  // How does the frontend display these? Let's check what normalizeEducationDetails produces
  // year_end = entry.title_year || entry.bachelor_year || entry.year || entry.end_date
  // Badge: edu.year_end || (edu.completed ? t('completed') : t('inProgress'))
  // So if year_end is null, it shows "Completado" or "En curso"
  // These entries will show "Completado" which is correct since they ARE completed

  // Breakdown by level for check5
  const check5ByLevel: Record<string, number> = {}
  for (const e of check5) {
    const level = e.entry.level || 'UNKNOWN'
    check5ByLevel[level] = (check5ByLevel[level] || 0) + 1
  }
  console.log('  Breakdown by level:')
  for (const [level, count] of Object.entries(check5ByLevel).sort((a, b) => b[1] - a[1])) {
    console.log(`    ${level}: ${count}`)
  }
  console.log()

  // Sample 10 of these
  const check5Sample = [...check5].sort(() => Math.random() - 0.5).slice(0, 10)
  console.log('  Sample (10):')
  for (const s of check5Sample) {
    const e = s.entry
    console.log(`    ${s.name}: level="${e.level}" degree="${e.degree || '(none)'}" institution="${e.institution}"`)
  }
  console.log()

  // ─── SUMMARY ─────────────────────────────────────────────────────────
  console.log('='.repeat(70))
  console.log('  SUMMARY')
  console.log('='.repeat(70))

  const issues = check3.length + check4.length
  if (issues === 0) {
    console.log('  ALL CHECKS PASSED')
    console.log()
    console.log(`  - ${incomplete.length} entries with is_completed=false (legitimate "en curso" or incomplete)`)
    console.log(`  - ${complete.length} entries with is_completed=true`)
    console.log(`  - ${check5.length} completed entries showing "Completado" badge (no year available)`)
    console.log()
    console.log('  The fix appears to be 100% complete.')
  } else {
    console.log(`  ** ${issues} ISSUES FOUND **`)
    console.log()
    if (check3.length > 0) console.log(`  - CHECK 3 FAILED: ${check3.length} Universitario entries with has_title/has_bachelor=true but is_completed=false`)
    if (check4.length > 0) console.log(`  - CHECK 4 FAILED: ${check4.length} entries with bachelor_year/title_year but is_completed=false`)
    console.log()
    console.log('  The fix is NOT complete. These entries need to be corrected.')
  }

  console.log()
  console.log('Done!')
}

main().catch(console.error)
