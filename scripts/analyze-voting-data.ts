/**
 * Analyze all voting-related data in the database.
 *
 * Checks:
 * 1. All table names in the database
 * 2. Candidates table voting-related columns
 * 3. congressional_votes table schema + sample data
 * 4. controversial_laws table schema + sample data
 * 5. voting_record / investigations tables
 * 6. scores table voting-related data
 * 7. trajectoryContext field content
 * 8. Individual law/bill detail storage
 */

import { neon } from '@neondatabase/serverless'
import * as fs from 'fs'
import * as path from 'path'

// Read DATABASE_URL from .env.local
const envPath = path.join(process.cwd(), '.env.local')
const envContent = fs.readFileSync(envPath, 'utf-8')
const dbMatch = envContent.match(/DATABASE_URL=["']?([^"'\n]+)["']?/)
const DATABASE_URL = dbMatch ? dbMatch[1] : process.env.DATABASE_URL!
const sql = neon(DATABASE_URL)

function section(title: string) {
  console.log('\n' + '='.repeat(70))
  console.log(`  ${title}`)
  console.log('='.repeat(70))
}

function subsection(title: string) {
  console.log(`\n--- ${title} ---`)
}

async function main() {
  // =============================================
  // 1. ALL TABLE NAMES
  // =============================================
  section('1. ALL TABLES IN DATABASE')

  const tables = await sql`
    SELECT table_name, table_type
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name
  `
  console.log(`\nFound ${tables.length} tables/views:`)
  for (const t of tables) {
    console.log(`  - ${t.table_name} (${t.table_type})`)
  }

  // =============================================
  // 2. CANDIDATES TABLE - VOTING-RELATED COLUMNS
  // =============================================
  section('2. CANDIDATES TABLE - VOTING-RELATED COLUMNS')

  const candidateCols = await sql`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'candidates'
      AND (
        column_name ILIKE '%vot%'
        OR column_name ILIKE '%law%'
        OR column_name ILIKE '%ley%'
        OR column_name ILIKE '%congress%'
        OR column_name ILIKE '%bill%'
        OR column_name ILIKE '%trajectory%'
        OR column_name ILIKE '%investigation%'
        OR column_name ILIKE '%incumbent%'
        OR column_name ILIKE '%performance%'
      )
    ORDER BY column_name
  `

  if (candidateCols.length === 0) {
    console.log('\nNo voting-related columns found in candidates table.')
    console.log('Checking ALL columns in candidates table:')
    const allCols = await sql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'candidates'
      ORDER BY ordinal_position
    `
    for (const c of allCols) {
      console.log(`  - ${c.column_name} (${c.data_type})`)
    }
  } else {
    for (const c of candidateCols) {
      console.log(`  - ${c.column_name} (${c.data_type}, nullable: ${c.is_nullable})`)
    }
  }

  // =============================================
  // 3. CONGRESSIONAL_VOTES TABLE
  // =============================================
  section('3. CONGRESSIONAL_VOTES TABLE')

  const cvExists = tables.some(t => t.table_name === 'congressional_votes')
  if (!cvExists) {
    console.log('\n  TABLE DOES NOT EXIST')
  } else {
    subsection('Schema')
    const cvCols = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'congressional_votes'
      ORDER BY ordinal_position
    `
    for (const c of cvCols) {
      console.log(`  ${c.column_name}: ${c.data_type} ${c.is_nullable === 'NO' ? 'NOT NULL' : ''} ${c.column_default ? `DEFAULT ${c.column_default}` : ''}`)
    }

    subsection('Row count')
    const cvCount = await sql`SELECT COUNT(*) as cnt FROM congressional_votes`
    console.log(`  Total rows: ${cvCount[0].cnt}`)

    subsection('Unique candidates with votes')
    const cvCandidates = await sql`
      SELECT COUNT(DISTINCT candidate_id) as cnt FROM congressional_votes
    `
    console.log(`  Unique candidates: ${cvCandidates[0].cnt}`)

    subsection('Vote type distribution')
    const voteTypes = await sql`
      SELECT vote_type, COUNT(*) as cnt
      FROM congressional_votes
      GROUP BY vote_type
      ORDER BY cnt DESC
    `
    for (const v of voteTypes) {
      console.log(`  ${v.vote_type}: ${v.cnt}`)
    }

    subsection('Votes per project')
    const votesPerProject = await sql`
      SELECT project_id, project_title, COUNT(*) as vote_count,
             COUNT(*) FILTER (WHERE vote_type = 'favor') as favor,
             COUNT(*) FILTER (WHERE vote_type = 'contra') as contra,
             COUNT(*) FILTER (WHERE vote_type = 'abstencion') as abstencion,
             COUNT(*) FILTER (WHERE vote_type IN ('ausente', 'licencia')) as ausente
      FROM congressional_votes
      GROUP BY project_id, project_title
      ORDER BY vote_count DESC
    `
    for (const v of votesPerProject) {
      console.log(`  ${v.project_id} - ${(v.project_title || '').substring(0, 50)}`)
      console.log(`    Total: ${v.vote_count} | Favor: ${v.favor} | Contra: ${v.contra} | Abstención: ${v.abstencion} | Ausente: ${v.ausente}`)
    }

    subsection('Sample rows (first 5)')
    const cvSample = await sql`
      SELECT cv.*, c.full_name as candidate_name
      FROM congressional_votes cv
      JOIN candidates c ON cv.candidate_id = c.id
      ORDER BY cv.session_date DESC
      LIMIT 5
    `
    for (const row of cvSample) {
      console.log(`  ${row.candidate_name} | ${row.project_id} | ${row.vote_type} | ${row.session_date} | cat: ${row.category}`)
    }

    subsection('Candidates with most votes recorded')
    const topVoters = await sql`
      SELECT c.full_name, c.cargo, COUNT(*) as total_votes,
             COUNT(*) FILTER (WHERE cv.vote_type = 'favor') as favor,
             COUNT(*) FILTER (WHERE cv.vote_type = 'contra') as contra
      FROM congressional_votes cv
      JOIN candidates c ON cv.candidate_id = c.id
      GROUP BY c.full_name, c.cargo
      ORDER BY total_votes DESC
      LIMIT 15
    `
    for (const v of topVoters) {
      console.log(`  ${v.full_name} (${v.cargo}): ${v.total_votes} votes (${v.favor} favor, ${v.contra} contra)`)
    }
  }

  // =============================================
  // 4. CONTROVERSIAL_LAWS TABLE
  // =============================================
  section('4. CONTROVERSIAL_LAWS TABLE')

  const clExists = tables.some(t => t.table_name === 'controversial_laws')
  if (!clExists) {
    console.log('\n  TABLE DOES NOT EXIST')
  } else {
    subsection('Schema')
    const clCols = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'controversial_laws'
      ORDER BY ordinal_position
    `
    for (const c of clCols) {
      console.log(`  ${c.column_name}: ${c.data_type} ${c.is_nullable === 'NO' ? 'NOT NULL' : ''}`)
    }

    subsection('All controversial laws')
    const clAll = await sql`
      SELECT project_id, title, category, penalty_points, bonus_points,
             is_approved, approval_date
      FROM controversial_laws
      ORDER BY approval_date DESC NULLS LAST
    `
    console.log(`  Total: ${clAll.length} laws`)
    for (const law of clAll) {
      console.log(`  ${law.project_id} | ${(law.title || '').substring(0, 55)} | cat: ${law.category} | penalty: ${law.penalty_points} | bonus: ${law.bonus_points} | approved: ${law.is_approved} | date: ${law.approval_date}`)
    }
  }

  // =============================================
  // 5. VOTING_RECORD / INVESTIGATIONS TABLES
  // =============================================
  section('5. OTHER VOTING/INVESTIGATION TABLES')

  const votingTables = tables.filter(t =>
    t.table_name.includes('vot') ||
    t.table_name.includes('investigation') ||
    t.table_name.includes('incumbent') ||
    t.table_name.includes('performance')
  )

  if (votingTables.length === 0) {
    console.log('\nNo separate voting_record or investigations tables found.')
  } else {
    for (const t of votingTables) {
      console.log(`\n  Found: ${t.table_name} (${t.table_type})`)
      const cols = await sql`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = ${t.table_name}
        ORDER BY ordinal_position
      `
      for (const c of cols) {
        console.log(`    ${c.column_name}: ${c.data_type}`)
      }
    }
  }

  // Check for any table with 'incumbent' or 'performance' in name
  const perfTables = tables.filter(t =>
    t.table_name.includes('incumbent') ||
    t.table_name.includes('performance') ||
    t.table_name.includes('budget')
  )
  if (perfTables.length > 0) {
    subsection('Performance/Incumbent tables')
    for (const t of perfTables) {
      console.log(`  ${t.table_name}`)
    }
  }

  // =============================================
  // 6. SCORES TABLE - VOTING-RELATED DATA
  // =============================================
  section('6. SCORES TABLE - VOTING-RELATED DATA')

  subsection('Scores table schema')
  const scoresCols = await sql`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'scores'
    ORDER BY ordinal_position
  `
  for (const c of scoresCols) {
    console.log(`  ${c.column_name}: ${c.data_type}`)
  }

  subsection('Score breakdowns table schema')
  const sbCols = await sql`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'score_breakdowns'
    ORDER BY ordinal_position
  `
  for (const c of sbCols) {
    const isVotingRelated = c.column_name.includes('vot') ||
      c.column_name.includes('integrity') ||
      c.column_name.includes('penal') ||
      c.column_name.includes('penalty')
    console.log(`  ${c.column_name}: ${c.data_type}${isVotingRelated ? ' <-- VOTING/INTEGRITY RELATED' : ''}`)
  }

  // Check if score_breakdowns has voting-specific penalty columns
  const votingScoreCols = sbCols.filter(c =>
    c.column_name.includes('vot') || c.column_name.includes('congress')
  )
  if (votingScoreCols.length > 0) {
    subsection('Voting-specific score breakdown columns')
    for (const c of votingScoreCols) {
      console.log(`  ${c.column_name}: ${c.data_type}`)
    }
  } else {
    console.log('\n  No voting-specific columns in score_breakdowns (penalties likely applied in code, not stored separately)')
  }

  // =============================================
  // 7. TRAJECTORY CONTEXT (political_trajectory JSONB)
  // =============================================
  section('7. TRAJECTORY CONTEXT - political_trajectory JSONB')

  subsection('Sample political_trajectory entries for candidates with votes')
  const trajSamples = await sql`
    SELECT c.full_name, c.political_trajectory
    FROM candidates c
    WHERE c.id IN (SELECT DISTINCT candidate_id FROM congressional_votes)
    LIMIT 3
  `
  for (const row of trajSamples) {
    console.log(`\n  ${row.full_name}:`)
    const traj = row.political_trajectory
    if (Array.isArray(traj)) {
      for (const t of traj.slice(0, 5)) {
        console.log(`    - ${t.position || 'N/A'} | party: ${t.party || 'N/A'} | ${t.start_date || '?'}-${t.end_date || 'present'} | elected: ${t.is_elected}`)
      }
      if (traj.length > 5) console.log(`    ... and ${traj.length - 5} more entries`)
    } else {
      console.log(`    (raw): ${JSON.stringify(traj).substring(0, 200)}`)
    }
  }

  // =============================================
  // 8. CANDIDATE VOTING SUMMARY
  // =============================================
  section('8. CANDIDATE VOTING SUMMARIES (JOIN with controversial_laws)')

  const votingSummaries = await sql`
    SELECT
      c.full_name,
      c.cargo,
      COUNT(cv.*) as total_votes,
      COUNT(cv.*) FILTER (WHERE cv.vote_type = 'favor') as favor,
      COUNT(cv.*) FILTER (WHERE cv.vote_type = 'contra') as contra,
      COUNT(cv.*) FILTER (WHERE cv.vote_type IN ('ausente', 'licencia')) as ausente,
      COALESCE(SUM(CASE WHEN cv.vote_type = 'favor' THEN cl.penalty_points ELSE 0 END), 0) as total_penalty,
      COALESCE(SUM(CASE WHEN cv.vote_type = 'contra' THEN cl.bonus_points ELSE 0 END), 0) as total_bonus
    FROM candidates c
    JOIN congressional_votes cv ON c.id = cv.candidate_id
    LEFT JOIN controversial_laws cl ON cv.project_id = cl.project_id
    GROUP BY c.full_name, c.cargo
    ORDER BY total_penalty DESC
    LIMIT 20
  `
  for (const s of votingSummaries) {
    console.log(`  ${s.full_name} (${s.cargo}): ${s.total_votes} votes | favor: ${s.favor} | contra: ${s.contra} | ausente: ${s.ausente} | penalty: -${s.total_penalty}pts | bonus: +${s.total_bonus}pts`)
  }

  // =============================================
  // 9. CHECK IF INDIVIDUAL BILL DETAILS STORED
  // =============================================
  section('9. INDIVIDUAL BILL/LAW DETAILS')

  subsection('Controversial laws - full detail sample (first 3)')
  const lawDetails = await sql`
    SELECT * FROM controversial_laws LIMIT 3
  `
  for (const law of lawDetails) {
    console.log(`\n  Project: ${law.project_id}`)
    console.log(`  Title: ${law.title}`)
    console.log(`  Description: ${(law.description || '').substring(0, 150)}...`)
    console.log(`  Category: ${law.category}`)
    console.log(`  Penalty/Bonus: ${law.penalty_points}/${law.bonus_points}`)
    console.log(`  Approved: ${law.is_approved} | Date: ${law.approval_date}`)
    console.log(`  Source: ${law.source_url}`)
    // Show all columns
    const keys = Object.keys(law)
    console.log(`  All columns: ${keys.join(', ')}`)
  }

  // =============================================
  // 10. CROSS-REFERENCE: Are all voted projects in controversial_laws?
  // =============================================
  section('10. CROSS-REFERENCE: voted projects vs controversial_laws')

  const orphanVotes = await sql`
    SELECT DISTINCT cv.project_id, cv.project_title
    FROM congressional_votes cv
    LEFT JOIN controversial_laws cl ON cv.project_id = cl.project_id
    WHERE cl.project_id IS NULL
  `
  if (orphanVotes.length > 0) {
    console.log(`\n  WARNING: ${orphanVotes.length} project IDs in congressional_votes NOT in controversial_laws:`)
    for (const v of orphanVotes) {
      console.log(`    - ${v.project_id}: ${v.project_title}`)
    }
  } else {
    console.log('\n  All voted projects exist in controversial_laws table.')
  }

  const unvotedLaws = await sql`
    SELECT cl.project_id, cl.title
    FROM controversial_laws cl
    LEFT JOIN congressional_votes cv ON cl.project_id = cv.project_id
    WHERE cv.project_id IS NULL
  `
  if (unvotedLaws.length > 0) {
    console.log(`\n  ${unvotedLaws.length} controversial laws with NO votes recorded:`)
    for (const l of unvotedLaws) {
      console.log(`    - ${l.project_id}: ${l.title}`)
    }
  } else {
    console.log('  All controversial laws have at least one vote recorded.')
  }

  // =============================================
  // SUMMARY
  // =============================================
  section('SUMMARY')

  const totalVotes = await sql`SELECT COUNT(*) as cnt FROM congressional_votes`
  const totalLaws = await sql`SELECT COUNT(*) as cnt FROM controversial_laws`
  const totalCandidatesWithVotes = await sql`SELECT COUNT(DISTINCT candidate_id) as cnt FROM congressional_votes`
  const totalCandidates = await sql`SELECT COUNT(*) as cnt FROM candidates WHERE is_active = true`

  console.log(`
  Total tables in DB: ${tables.length}
  Voting-related tables: congressional_votes, controversial_laws

  Congressional votes records: ${totalVotes[0].cnt}
  Controversial laws defined: ${totalLaws[0].cnt}
  Candidates with vote records: ${totalCandidatesWithVotes[0].cnt}
  Total active candidates: ${totalCandidates[0].cnt}

  Data model:
  - controversial_laws: Defines the 9 controversial laws with penalty/bonus points and categories
  - congressional_votes: Links candidate_id -> project_id with vote_type (favor/contra/abstencion/ausente)
  - Each vote on a controversial law applies penalty_points (if favor) or bonus_points (if contra)
  - Penalties feed into the integrity score via calculateVotingPenalty() in scoring engine
  - trajectoryContext in CandidateProfileContent.tsx fetches voting summary to annotate timeline
  - The scoring engine (calculateEnhancedIntegrity) uses votingIntegrityPenalty/votingIntegrityBonus
  - No separate voting_record or investigations table exists
  - Individual law details (title, description, source_url) are stored in controversial_laws
  `)
}

main().catch(console.error)
