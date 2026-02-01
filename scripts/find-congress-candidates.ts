/**
 * Find candidates in the DB who were likely congresspeople in 2021-2026.
 * Uses political_trajectory JSONB to identify those with congressional experience.
 * Also checks existing congressional_votes to see what's already populated.
 */
import { neon } from '@neondatabase/serverless'
import * as fs from 'fs'

const envContent = fs.readFileSync('./.env.local', 'utf-8')
const dbMatch = envContent.match(/DATABASE_URL=["']?([^"'\n]+)["']?/)
const DATABASE_URL = dbMatch ? dbMatch[1] : ''
const sql = neon(DATABASE_URL)

async function main() {
  console.log('=== Finding ex-congresspeople running in 2026 ===\n')

  // 1. Check existing congressional votes
  console.log('--- Existing congressional votes ---')
  const existingVotes = await sql`
    SELECT
      c.full_name,
      c.cargo,
      p.short_name as party,
      COUNT(*) as vote_count,
      COUNT(*) FILTER (WHERE cv.vote_type = 'favor') as favor,
      COUNT(*) FILTER (WHERE cv.vote_type = 'contra') as contra,
      COUNT(*) FILTER (WHERE cv.vote_type = 'abstencion') as abstencion
    FROM congressional_votes cv
    JOIN candidates c ON cv.candidate_id = c.id
    LEFT JOIN parties p ON c.party_id = p.id
    GROUP BY c.full_name, c.cargo, p.short_name
    ORDER BY p.short_name, c.full_name
  `
  for (const row of existingVotes) {
    console.log(`  ${row.party} | ${row.full_name} (${row.cargo}): ${row.vote_count} votes (F:${row.favor} C:${row.contra} A:${row.abstencion})`)
  }
  console.log(`\nTotal candidates with votes: ${existingVotes.length}`)

  // 2. Find candidates with congressional experience in political_trajectory
  console.log('\n--- Candidates with congressional/political experience ---')

  // Search for key terms in political_trajectory that indicate congressional service
  const congressCandidates = await sql`
    SELECT
      c.id,
      c.full_name,
      c.cargo,
      p.short_name as party,
      p.name as party_name,
      c.political_trajectory
    FROM candidates c
    LEFT JOIN parties p ON c.party_id = p.id
    WHERE c.is_active = true
      AND c.political_trajectory IS NOT NULL
      AND c.political_trajectory != '[]'::jsonb
      AND c.political_trajectory != 'null'::jsonb
      AND (
        c.political_trajectory::text ILIKE '%congresista%'
        OR c.political_trajectory::text ILIKE '%congreso%'
        OR c.political_trajectory::text ILIKE '%parlamentar%'
        OR c.political_trajectory::text ILIKE '%senador%'
        OR c.political_trajectory::text ILIKE '%diputado%'
      )
    ORDER BY p.short_name, c.full_name
  `

  console.log(`Found ${congressCandidates.length} candidates with congressional experience\n`)

  const byParty: Record<string, any[]> = {}
  for (const c of congressCandidates) {
    const party = (c.party as string) || 'SIN PARTIDO'
    if (!byParty[party]) byParty[party] = []
    byParty[party].push(c)
  }

  // Check which already have votes
  const candidatesWithVotes = new Set(existingVotes.map((v: any) => v.full_name))

  for (const [party, candidates] of Object.entries(byParty).sort()) {
    console.log(`\n${party} (${candidates.length}):`)
    for (const c of candidates) {
      const hasVotes = candidatesWithVotes.has(c.full_name) ? ' [HAS VOTES]' : ''
      console.log(`  ${c.full_name} (${c.cargo})${hasVotes}`)
    }
  }

  // 3. Summary by party - candidates WITHOUT votes
  console.log('\n\n=== Parties needing congressional vote data ===')
  const partySummary = await sql`
    SELECT
      COALESCE(p.short_name, 'SIN PARTIDO') as party,
      COUNT(DISTINCT c.id) as total_candidates,
      COUNT(DISTINCT cv.candidate_id) as with_votes
    FROM candidates c
    LEFT JOIN parties p ON c.party_id = p.id
    LEFT JOIN congressional_votes cv ON c.id = cv.candidate_id
    WHERE c.is_active = true
    GROUP BY p.short_name
    HAVING COUNT(DISTINCT cv.candidate_id) > 0
    ORDER BY p.short_name
  `

  for (const row of partySummary) {
    console.log(`  ${row.party}: ${row.with_votes} / ${row.total_candidates} candidates have votes`)
  }

  // Total votes
  const total = await sql`SELECT COUNT(*) as cnt FROM congressional_votes`
  console.log(`\nTotal congressional votes in DB: ${total[0].cnt}`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })
