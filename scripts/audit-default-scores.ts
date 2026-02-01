import { neon } from '@neondatabase/serverless'

const DATABASE_URL = 'postgresql://neondb_owner:npg_QsCV8j4rFmiW@ep-polished-mouse-ahxxvvbh-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require'
const sql = neon(DATABASE_URL)

async function audit() {
  console.log('=== AUDIT: Default/Suspicious Scores ===\n')

  // 1. Total candidates with scores
  const [{ total }] = await sql`
    SELECT COUNT(*) as total FROM candidates c
    JOIN scores s ON c.id = s.candidate_id
    WHERE c.is_active = true
  `
  console.log(`Total active candidates with scores: ${total}`)

  // 2. Candidates with integrity = 100 (likely default/unprocessed)
  const integ100 = await sql`
    SELECT COUNT(*) as cnt FROM candidates c
    JOIN scores s ON c.id = s.candidate_id
    WHERE c.is_active = true AND s.integrity = 100
  `
  console.log(`Candidates with integrity = 100: ${integ100[0].cnt}`)

  // 3. Candidates with integrity = 95 (another common default pattern)
  const integ95 = await sql`
    SELECT COUNT(*) as cnt FROM candidates c
    JOIN scores s ON c.id = s.candidate_id
    WHERE c.is_active = true AND s.integrity = 95
  `
  console.log(`Candidates with integrity = 95: ${integ95[0].cnt}`)

  // 4. Candidates with transparency = 88 (suspiciously uniform)
  const trans88 = await sql`
    SELECT COUNT(*) as cnt FROM candidates c
    JOIN scores s ON c.id = s.candidate_id
    WHERE c.is_active = true AND s.transparency = 88
  `
  console.log(`Candidates with transparency = 88: ${trans88[0].cnt}`)

  // 5. Candidates with confidence = 80 (suspiciously uniform)
  const conf80 = await sql`
    SELECT COUNT(*) as cnt FROM candidates c
    JOIN scores s ON c.id = s.candidate_id
    WHERE c.is_active = true AND s.confidence = 80
  `
  console.log(`Candidates with confidence = 80: ${conf80[0].cnt}`)

  // 6. Distribution of integrity scores
  console.log('\n=== Integrity Score Distribution ===')
  const integDist = await sql`
    SELECT
      CASE
        WHEN s.integrity = 100 THEN '100 (likely default)'
        WHEN s.integrity >= 90 THEN '90-99'
        WHEN s.integrity >= 80 THEN '80-89'
        WHEN s.integrity >= 60 THEN '60-79'
        WHEN s.integrity >= 40 THEN '40-59'
        WHEN s.integrity >= 20 THEN '20-39'
        WHEN s.integrity > 0 THEN '1-19'
        ELSE '0'
      END as range,
      COUNT(*) as cnt
    FROM candidates c
    JOIN scores s ON c.id = s.candidate_id
    WHERE c.is_active = true
    GROUP BY range
    ORDER BY range
  `
  integDist.forEach(r => console.log(`  ${r.range}: ${r.cnt}`))

  // 7. Check score_breakdowns: candidates with integrity_base=100 and NO penalties
  console.log('\n=== Score Breakdowns: No Penalties Applied ===')
  const noPenalties = await sql`
    SELECT COUNT(*) as cnt FROM candidates c
    JOIN score_breakdowns sb ON c.id = sb.candidate_id
    WHERE c.is_active = true
    AND COALESCE(sb.penal_penalty, 0) = 0
    AND COALESCE(sb.resignation_penalty, 0) = 0
    AND COALESCE(sb.company_penalty, 0) = 0
    AND COALESCE(sb.voting_penalty, 0) = 0
    AND COALESCE(sb.tax_penalty, 0) = 0
    AND COALESCE(sb.omission_penalty, 0) = 0
  `
  console.log(`Candidates with ZERO penalties in breakdown: ${noPenalties[0].cnt}`)

  // 8. Candidates WITHOUT score_breakdowns at all
  const noBreakdown = await sql`
    SELECT COUNT(*) as cnt FROM candidates c
    JOIN scores s ON c.id = s.candidate_id
    LEFT JOIN score_breakdowns sb ON c.id = sb.candidate_id
    WHERE c.is_active = true AND sb.id IS NULL
  `
  console.log(`Candidates WITHOUT score_breakdowns: ${noBreakdown[0].cnt}`)

  // 9. Duplicate candidates (same full_name, different cargo)
  console.log('\n=== Duplicate Candidates (same name, different cargo) ===')
  const dupes = await sql`
    SELECT c.full_name, COUNT(DISTINCT c.cargo) as cargo_count,
           array_agg(c.cargo) as cargos,
           array_agg(s.integrity ORDER BY s.integrity) as integrities,
           array_agg(s.score_balanced ORDER BY s.integrity) as scores
    FROM candidates c
    JOIN scores s ON c.id = s.candidate_id
    WHERE c.is_active = true
    GROUP BY c.full_name
    HAVING COUNT(DISTINCT c.cargo) > 1
    ORDER BY c.full_name
    LIMIT 30
  `
  console.log(`Duplicate candidates: ${dupes.length}`)
  dupes.forEach(d => {
    console.log(`  ${d.full_name}: cargos=${d.cargos}, integrities=${d.integrities}, scores=${d.scores}`)
  })

  // 10. Candidates with scores but whose integrity doesn't match breakdowns
  console.log('\n=== Integrity Mismatch (scores vs breakdowns) ===')
  const mismatch = await sql`
    SELECT
      c.full_name, c.cargo,
      s.integrity as score_integrity_value,
      GREATEST(0, 100
        - COALESCE(sb.penal_penalty, 0)
        - COALESCE(sb.resignation_penalty, 0)
        - COALESCE(sb.company_penalty, 0)
        - COALESCE(sb.voting_penalty, 0)
        + COALESCE(sb.voting_bonus, 0)
        - COALESCE(sb.tax_penalty, 0)
        - COALESCE(sb.omission_penalty, 0)
      ) as calculated_integrity
    FROM candidates c
    JOIN scores s ON c.id = s.candidate_id
    JOIN score_breakdowns sb ON c.id = sb.candidate_id
    WHERE c.is_active = true
    AND ABS(s.integrity - GREATEST(0, 100
        - COALESCE(sb.penal_penalty, 0)
        - COALESCE(sb.resignation_penalty, 0)
        - COALESCE(sb.company_penalty, 0)
        - COALESCE(sb.voting_penalty, 0)
        + COALESCE(sb.voting_bonus, 0)
        - COALESCE(sb.tax_penalty, 0)
        - COALESCE(sb.omission_penalty, 0)
    )) > 5
    ORDER BY ABS(s.integrity - GREATEST(0, 100
        - COALESCE(sb.penal_penalty, 0)
        - COALESCE(sb.resignation_penalty, 0)
        - COALESCE(sb.company_penalty, 0)
        - COALESCE(sb.voting_penalty, 0)
        + COALESCE(sb.voting_bonus, 0)
        - COALESCE(sb.tax_penalty, 0)
        - COALESCE(sb.omission_penalty, 0)
    )) DESC
    LIMIT 20
  `
  console.log(`Candidates with integrity mismatch: ${mismatch.length}`)
  mismatch.forEach(m => {
    console.log(`  ${m.full_name} (${m.cargo}): stored=${m.score_integrity_value}, calculated=${m.calculated_integrity}`)
  })

  // 11. Top candidates by score to check if suspicious
  console.log('\n=== Top 20 by score_balanced (checking for suspicious scores) ===')
  const top = await sql`
    SELECT c.full_name, c.cargo, s.competence, s.integrity, s.transparency, s.score_balanced,
           sb.penal_penalty, sb.resignation_penalty, sb.company_penalty, sb.voting_penalty, sb.tax_penalty, sb.omission_penalty
    FROM candidates c
    JOIN scores s ON c.id = s.candidate_id
    LEFT JOIN score_breakdowns sb ON c.id = sb.candidate_id
    WHERE c.is_active = true
    ORDER BY s.score_balanced DESC
    LIMIT 20
  `
  top.forEach(t => {
    const penalties = `pen=${t.penal_penalty || 0} res=${t.resignation_penalty || 0} comp=${t.company_penalty || 0} vot=${t.voting_penalty || 0} tax=${t.tax_penalty || 0} om=${t.omission_penalty || 0}`
    console.log(`  ${t.score_balanced} | ${t.full_name} (${t.cargo}) | C=${t.competence} I=${t.integrity} T=${t.transparency} | ${penalties}`)
  })

  // 12. How many candidates have had real score calculations (breakdowns with non-zero competence points)
  console.log('\n=== Real vs Default Scores ===')
  const realScores = await sql`
    SELECT
      CASE
        WHEN sb.id IS NULL THEN 'no_breakdown'
        WHEN COALESCE(sb.education_level_points, 0) = 0
             AND COALESCE(sb.experience_total_points, 0) = 0
             AND COALESCE(sb.experience_relevant_points, 0) = 0
        THEN 'default_breakdown'
        ELSE 'real_breakdown'
      END as category,
      COUNT(*) as cnt
    FROM candidates c
    JOIN scores s ON c.id = s.candidate_id
    LEFT JOIN score_breakdowns sb ON c.id = sb.candidate_id
    WHERE c.is_active = true
    GROUP BY category
  `
  realScores.forEach(r => console.log(`  ${r.category}: ${r.cnt}`))
}

audit().catch(console.error)
