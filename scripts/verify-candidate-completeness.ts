import { neon } from '@neondatabase/serverless'

const DATABASE_URL = process.env.DATABASE_URL || ''
const sql = neon(DATABASE_URL)

// Valid cargo values based on the schema
const VALID_CARGOS = [
  'presidente',
  'vicepresidente',
  'senador',
  'diputado',
  'parlamentario_andino'
]

interface CandidateIssue {
  id: string
  full_name: string
  cargo: string
  issues: string[]
}

async function verifyAllCandidates() {
  console.log('=' .repeat(80))
  console.log('CANDIDATE DATA COMPLETENESS VERIFICATION REPORT')
  console.log('=' .repeat(80))
  console.log(`Report generated: ${new Date().toISOString()}\n`)

  // Get all active candidates with their related data
  const candidates = await sql`
    SELECT
      c.id,
      c.full_name,
      c.slug,
      c.cargo,
      c.party_id,
      c.education_level,
      c.education_details,
      c.experience_details,
      c.birth_date,
      c.is_active,
      p.name as party_name
    FROM candidates c
    LEFT JOIN parties p ON c.party_id = p.id
    WHERE c.is_active = TRUE OR c.is_active IS NULL
    ORDER BY c.cargo, c.full_name
  `

  // Get all valid party IDs
  const parties = await sql`SELECT id FROM parties`
  const validPartyIds = new Set(parties.map((p: any) => p.id))

  const totalCandidates = candidates.length

  // Completeness counters
  let withFullName = 0
  let withSlug = 0
  let withValidCargo = 0
  let withValidParty = 0
  let withEducationLevel = 0
  let withEducationDetails = 0
  let withExperienceDetails = 0
  let withBirthDate = 0

  const candidatesWithIssues: CandidateIssue[] = []

  for (const candidate of candidates) {
    const issues: string[] = []

    // 1. Check full_name is not null/empty
    if (!candidate.full_name || candidate.full_name.trim() === '') {
      issues.push('Missing full_name')
    } else {
      withFullName++
    }

    // 2. Check slug is not null/empty
    if (!candidate.slug || candidate.slug.trim() === '') {
      issues.push('Missing slug')
    } else {
      withSlug++
    }

    // 3. Check cargo is valid
    if (!candidate.cargo || !VALID_CARGOS.includes(candidate.cargo)) {
      issues.push(`Invalid cargo: "${candidate.cargo || 'NULL'}" (valid: ${VALID_CARGOS.join(', ')})`)
    } else {
      withValidCargo++
    }

    // 4. Check party_id references a valid party
    if (!candidate.party_id) {
      issues.push('Missing party_id')
    } else if (!validPartyIds.has(candidate.party_id)) {
      issues.push(`Invalid party_id: "${candidate.party_id}" (no matching party found)`)
    } else {
      withValidParty++
    }

    // 5. Check education_level is set
    if (!candidate.education_level || candidate.education_level.trim() === '') {
      issues.push('Missing education_level')
    } else {
      withEducationLevel++
    }

    // 6. Check education_details has at least one record
    const eduDetails = candidate.education_details
    const hasEducationDetails = Array.isArray(eduDetails) && eduDetails.length > 0
    if (!hasEducationDetails) {
      issues.push('Missing education_details (empty or null array)')
    } else {
      withEducationDetails++
    }

    // 7. Check experience_details has at least one record
    const expDetails = candidate.experience_details
    const hasExperienceDetails = Array.isArray(expDetails) && expDetails.length > 0
    if (!hasExperienceDetails) {
      issues.push('Missing experience_details (empty or null array)')
    } else {
      withExperienceDetails++
    }

    // 8. Check birth_date is set
    if (!candidate.birth_date) {
      issues.push('Missing birth_date')
    } else {
      withBirthDate++
    }

    if (issues.length > 0) {
      candidatesWithIssues.push({
        id: candidate.id,
        full_name: candidate.full_name || 'UNKNOWN',
        cargo: candidate.cargo || 'UNKNOWN',
        issues
      })
    }
  }

  // Print completeness summary
  console.log('COMPLETENESS SUMMARY')
  console.log('-'.repeat(80))
  console.log(`Total active candidates: ${totalCandidates}\n`)

  const fields = [
    { name: 'full_name', count: withFullName, critical: true },
    { name: 'slug', count: withSlug, critical: true },
    { name: 'cargo (valid)', count: withValidCargo, critical: true },
    { name: 'party_id (valid reference)', count: withValidParty, critical: true },
    { name: 'education_level', count: withEducationLevel, critical: false },
    { name: 'education_details (1+ records)', count: withEducationDetails, critical: false },
    { name: 'experience_details (1+ records)', count: withExperienceDetails, critical: false },
    { name: 'birth_date', count: withBirthDate, critical: false },
  ]

  console.log('Field Completeness:')
  console.log('-'.repeat(80))
  console.log(`${'Field'.padEnd(40)} | ${'Complete'.padStart(10)} | ${'Percentage'.padStart(12)} | Critical`)
  console.log('-'.repeat(80))

  for (const field of fields) {
    const percentage = totalCandidates > 0
      ? ((field.count / totalCandidates) * 100).toFixed(1)
      : '0.0'
    const criticalMarker = field.critical ? 'YES' : 'NO'
    const status = parseFloat(percentage) === 100 ? '[OK]' : '[INCOMPLETE]'
    console.log(
      `${field.name.padEnd(40)} | ${field.count.toString().padStart(10)} | ${(percentage + '%').padStart(12)} | ${criticalMarker.padStart(8)} ${status}`
    )
  }

  // Overall statistics
  const criticalFields = fields.filter(f => f.critical)
  const criticalComplete = criticalFields.every(f => f.count === totalCandidates)
  const allComplete = fields.every(f => f.count === totalCandidates)

  const overallCompleteness = totalCandidates > 0
    ? (fields.reduce((sum, f) => sum + f.count, 0) / (totalCandidates * fields.length) * 100).toFixed(1)
    : '0.0'

  console.log('\n' + '='.repeat(80))
  console.log('OVERALL STATISTICS')
  console.log('='.repeat(80))
  console.log(`Overall completeness: ${overallCompleteness}%`)
  console.log(`Critical fields complete: ${criticalComplete ? 'YES' : 'NO'}`)
  console.log(`All fields complete: ${allComplete ? 'YES' : 'NO'}`)
  console.log(`Candidates with issues: ${candidatesWithIssues.length}`)
  console.log(`Candidates fully complete: ${totalCandidates - candidatesWithIssues.length}`)

  // List candidates with missing critical data
  const criticalIssues = candidatesWithIssues.filter(c =>
    c.issues.some(issue =>
      issue.includes('full_name') ||
      issue.includes('slug') ||
      issue.includes('cargo') ||
      issue.includes('party_id')
    )
  )

  if (criticalIssues.length > 0) {
    console.log('\n' + '='.repeat(80))
    console.log('CANDIDATES WITH MISSING CRITICAL DATA')
    console.log('='.repeat(80))

    for (const candidate of criticalIssues) {
      console.log(`\n[${candidate.cargo}] ${candidate.full_name}`)
      console.log(`  ID: ${candidate.id}`)
      console.log('  Critical issues:')
      candidate.issues
        .filter(i => i.includes('full_name') || i.includes('slug') || i.includes('cargo') || i.includes('party_id'))
        .forEach(issue => console.log(`    - ${issue}`))
    }
  }

  // List candidates with non-critical issues
  const nonCriticalOnlyIssues = candidatesWithIssues.filter(c =>
    !c.issues.some(issue =>
      issue.includes('full_name') ||
      issue.includes('slug') ||
      issue.includes('cargo') ||
      issue.includes('party_id')
    )
  )

  if (nonCriticalOnlyIssues.length > 0) {
    console.log('\n' + '='.repeat(80))
    console.log('CANDIDATES WITH INCOMPLETE NON-CRITICAL DATA')
    console.log('='.repeat(80))

    // Group by cargo
    const byCargo: { [key: string]: CandidateIssue[] } = {}
    for (const c of nonCriticalOnlyIssues) {
      if (!byCargo[c.cargo]) byCargo[c.cargo] = []
      byCargo[c.cargo].push(c)
    }

    for (const cargo of Object.keys(byCargo).sort()) {
      console.log(`\n--- ${cargo.toUpperCase()} (${byCargo[cargo].length} candidates) ---`)
      for (const candidate of byCargo[cargo]) {
        console.log(`\n  ${candidate.full_name}`)
        console.log(`    ID: ${candidate.id}`)
        console.log('    Missing:')
        candidate.issues.forEach(issue => console.log(`      - ${issue}`))
      }
    }
  }

  // Summary by cargo
  console.log('\n' + '='.repeat(80))
  console.log('COMPLETENESS BY CARGO')
  console.log('='.repeat(80))

  const cargoCounts = await sql`
    SELECT
      cargo,
      COUNT(*) as total,
      SUM(CASE WHEN full_name IS NOT NULL AND full_name != '' THEN 1 ELSE 0 END) as with_name,
      SUM(CASE WHEN slug IS NOT NULL AND slug != '' THEN 1 ELSE 0 END) as with_slug,
      SUM(CASE WHEN education_level IS NOT NULL AND education_level != '' THEN 1 ELSE 0 END) as with_edu_level,
      SUM(CASE WHEN education_details::text != '[]' AND education_details IS NOT NULL THEN 1 ELSE 0 END) as with_edu_details,
      SUM(CASE WHEN experience_details::text != '[]' AND experience_details IS NOT NULL THEN 1 ELSE 0 END) as with_exp_details,
      SUM(CASE WHEN birth_date IS NOT NULL THEN 1 ELSE 0 END) as with_birth
    FROM candidates
    WHERE is_active = TRUE OR is_active IS NULL
    GROUP BY cargo
    ORDER BY total DESC
  `

  for (const row of cargoCounts) {
    const total = parseInt(row.total)
    console.log(`\n${row.cargo.toUpperCase()} (${total} candidates):`)
    console.log(`  full_name:          ${row.with_name}/${total} (${((row.with_name/total)*100).toFixed(1)}%)`)
    console.log(`  slug:               ${row.with_slug}/${total} (${((row.with_slug/total)*100).toFixed(1)}%)`)
    console.log(`  education_level:    ${row.with_edu_level}/${total} (${((row.with_edu_level/total)*100).toFixed(1)}%)`)
    console.log(`  education_details:  ${row.with_edu_details}/${total} (${((row.with_edu_details/total)*100).toFixed(1)}%)`)
    console.log(`  experience_details: ${row.with_exp_details}/${total} (${((row.with_exp_details/total)*100).toFixed(1)}%)`)
    console.log(`  birth_date:         ${row.with_birth}/${total} (${((row.with_birth/total)*100).toFixed(1)}%)`)
  }

  console.log('\n' + '='.repeat(80))
  console.log('VERIFICATION COMPLETE')
  console.log('='.repeat(80))
}

verifyAllCandidates().catch(console.error)
