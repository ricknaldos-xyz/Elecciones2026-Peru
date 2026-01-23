/**
 * Congressional Votes Scraper
 *
 * Fetches voting records from the Peruvian Congress portal.
 * Tracks how congresspeople voted on specific laws, especially
 * those marked as "pro-crime" or controversial.
 *
 * Source: https://www.congreso.gob.pe/votaciones
 */

import * as cheerio from 'cheerio'
import { sql } from '@/lib/db'
import { createSyncLogger } from '../logger'

const CONGRESO_BASE_URL = 'https://www.congreso.gob.pe'
const DELAY_MS = 2000

interface VoteRecord {
  projectId: string
  projectTitle: string
  projectSummary?: string
  voteType: 'favor' | 'contra' | 'abstencion' | 'ausente' | 'licencia'
  sessionDate: string
  sessionNumber?: string
  sourceUrl?: string
}

interface CongressMember {
  candidateId: string
  fullName: string
  dni?: string
  congressId?: string // ID in the Congress system
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
          Accept: 'text/html,application/xhtml+xml',
          'Accept-Language': 'es-PE,es;q=0.9',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.text()
    } catch (error) {
      console.error(`[Congreso] Fetch attempt ${i + 1} failed:`, error)
      if (i === retries - 1) throw error
      await delay(DELAY_MS * (i + 1))
    }
  }
  throw new Error('All retries failed')
}

/**
 * Gets candidates who have been congresspeople
 */
async function getCongressCandidates(): Promise<CongressMember[]> {
  const result = await sql`
    SELECT
      c.id as candidate_id,
      c.full_name,
      c.dni
    FROM candidates c
    WHERE c.cargo IN ('senador', 'diputado', 'parlamento_andino')
      AND c.is_active = true
    UNION
    SELECT
      c.id as candidate_id,
      c.full_name,
      c.dni
    FROM candidates c
    WHERE EXISTS (
      SELECT 1 FROM jsonb_array_elements(c.political_trajectory) as pt
      WHERE pt->>'position' ILIKE '%congresista%'
         OR pt->>'position' ILIKE '%senador%'
         OR pt->>'position' ILIKE '%diputado%'
    )
      AND c.is_active = true
  `

  return result.map((r) => ({
    candidateId: r.candidate_id as string,
    fullName: r.full_name as string,
    dni: r.dni as string | undefined,
  }))
}

/**
 * Gets the list of controversial laws for penalty calculation
 */
async function getControversialLaws(): Promise<
  Map<string, { category: string; penaltyPoints: number; bonusPoints: number }>
> {
  const result = await sql`
    SELECT project_id, category, penalty_points, bonus_points
    FROM controversial_laws
  `

  const lawsMap = new Map()
  for (const row of result) {
    lawsMap.set(row.project_id, {
      category: row.category,
      penaltyPoints: row.penalty_points,
      bonusPoints: row.bonus_points,
    })
  }

  return lawsMap
}

/**
 * Fetches voting sessions list from Congress
 */
async function fetchVotingSessions(
  period: string = '2021-2026'
): Promise<Array<{ sessionId: string; date: string; title: string }>> {
  const sessions: Array<{ sessionId: string; date: string; title: string }> = []

  try {
    // Congress voting portal
    const url = `${CONGRESO_BASE_URL}/pley/votaciones`
    const html = await fetchWithRetry(url)
    const $ = cheerio.load(html)

    // Parse session list - structure may vary
    $('table.votaciones tr, .session-list .session-item').each((_, el) => {
      const $el = $(el)
      const sessionId = $el.attr('data-session-id') || $el.find('a').attr('href')?.match(/sesion=(\d+)/)?.[1]
      const dateText = $el.find('.fecha, td:nth-child(1)').text().trim()
      const title = $el.find('.titulo, td:nth-child(2)').text().trim()

      if (sessionId && dateText) {
        sessions.push({
          sessionId,
          date: dateText,
          title: title || `Sesión ${sessionId}`,
        })
      }
    })

    console.log(`[Congreso] Found ${sessions.length} voting sessions`)
  } catch (error) {
    console.error('[Congreso] Error fetching sessions:', error)
  }

  return sessions
}

/**
 * Fetches votes for a specific session/project
 */
async function fetchSessionVotes(
  sessionId: string
): Promise<Array<{ congressName: string; vote: string; projectId: string; projectTitle: string }>> {
  const votes: Array<{ congressName: string; vote: string; projectId: string; projectTitle: string }> = []

  try {
    const url = `${CONGRESO_BASE_URL}/pley/votaciones/detalle?sesion=${sessionId}`
    const html = await fetchWithRetry(url)
    const $ = cheerio.load(html)

    // Get project info
    const projectId = $('.proyecto-id, .pl-number').text().trim() || `S-${sessionId}`
    const projectTitle = $('.proyecto-titulo, h1, h2').first().text().trim()

    // Parse vote table
    $('table.votos tr, .votes-list .vote-item').each((_, el) => {
      const $el = $(el)
      const congressName = $el.find('.congresista, .nombre, td:nth-child(1)').text().trim()
      const voteText = $el.find('.voto, .vote, td:nth-child(2)').text().trim().toLowerCase()

      if (congressName && voteText) {
        let vote = 'ausente'
        if (voteText.includes('favor') || voteText.includes('sí') || voteText.includes('si')) {
          vote = 'favor'
        } else if (voteText.includes('contra') || voteText.includes('no')) {
          vote = 'contra'
        } else if (voteText.includes('absten')) {
          vote = 'abstencion'
        } else if (voteText.includes('licencia')) {
          vote = 'licencia'
        }

        votes.push({
          congressName,
          vote,
          projectId,
          projectTitle,
        })
      }
    })

    console.log(`[Congreso] Session ${sessionId}: ${votes.length} votes found for ${projectId}`)
  } catch (error) {
    console.error(`[Congreso] Error fetching session ${sessionId}:`, error)
  }

  return votes
}

/**
 * Matches a congress member name to a candidate
 */
function matchCongressMemberToCandidate(
  congressName: string,
  candidates: CongressMember[]
): CongressMember | null {
  const normalizedName = congressName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()

  for (const candidate of candidates) {
    const candidateNormalized = candidate.fullName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()

    // Check for exact match or partial match
    if (
      candidateNormalized === normalizedName ||
      candidateNormalized.includes(normalizedName) ||
      normalizedName.includes(candidateNormalized)
    ) {
      return candidate
    }

    // Check surname match (last two words usually)
    const congressSurnames = normalizedName.split(' ').slice(0, 2).join(' ')
    const candidateSurnames = candidateNormalized.split(' ').slice(0, 2).join(' ')
    if (congressSurnames === candidateSurnames) {
      return candidate
    }
  }

  return null
}

/**
 * Saves a vote record to the database
 */
async function saveVote(
  candidateId: string,
  vote: VoteRecord,
  controversialLaws: Map<string, { category: string; penaltyPoints: number; bonusPoints: number }>
): Promise<void> {
  const controversial = controversialLaws.get(vote.projectId)

  await sql`
    INSERT INTO congressional_votes (
      candidate_id,
      project_id,
      project_title,
      project_summary,
      vote_type,
      session_date,
      session_number,
      is_pro_crime,
      is_anti_democratic,
      is_pro_corruption,
      category,
      source_url
    ) VALUES (
      ${candidateId}::uuid,
      ${vote.projectId},
      ${vote.projectTitle},
      ${vote.projectSummary || null},
      ${vote.voteType},
      ${vote.sessionDate}::date,
      ${vote.sessionNumber || null},
      ${controversial?.category === 'pro_crimen' || false},
      ${controversial?.category === 'anti_fiscalia' || controversial?.category === 'anti_prensa' || false},
      ${controversial?.category === 'pro_impunidad' || controversial?.category === 'anti_colaboracion' || false},
      ${controversial?.category || null},
      ${vote.sourceUrl || null}
    )
    ON CONFLICT (candidate_id, project_id) DO UPDATE SET
      vote_type = EXCLUDED.vote_type,
      updated_at = NOW()
  `
}

/**
 * Main sync function for congressional votes
 */
export async function syncCongressionalVotes(): Promise<{
  records_processed: number
  records_created: number
  records_updated: number
  records_skipped: number
}> {
  const logger = createSyncLogger('congreso_votaciones')
  await logger.start()

  const result = {
    records_processed: 0,
    records_created: 0,
    records_updated: 0,
    records_skipped: 0,
  }

  try {
    await logger.markRunning()

    // Get candidates who are/were congresspeople
    const candidates = await getCongressCandidates()
    console.log(`[Congreso] Found ${candidates.length} candidates to track`)

    if (candidates.length === 0) {
      console.log('[Congreso] No congressional candidates found')
      return await logger.complete()
    }

    // Get controversial laws map
    const controversialLaws = await getControversialLaws()
    console.log(`[Congreso] Tracking ${controversialLaws.size} controversial laws`)

    // Fetch voting sessions
    const sessions = await fetchVotingSessions()

    // Process each session
    for (const session of sessions.slice(0, 50)) {
      // Limit to recent sessions
      await delay(DELAY_MS)

      const votes = await fetchSessionVotes(session.sessionId)
      result.records_processed += votes.length

      for (const vote of votes) {
        const matchedCandidate = matchCongressMemberToCandidate(vote.congressName, candidates)

        if (matchedCandidate) {
          try {
            await saveVote(
              matchedCandidate.candidateId,
              {
                projectId: vote.projectId,
                projectTitle: vote.projectTitle,
                voteType: vote.vote as VoteRecord['voteType'],
                sessionDate: session.date,
                sessionNumber: session.sessionId,
                sourceUrl: `${CONGRESO_BASE_URL}/pley/votaciones/detalle?sesion=${session.sessionId}`,
              },
              controversialLaws
            )
            result.records_created++
          } catch (error) {
            console.error(`[Congreso] Error saving vote for ${matchedCandidate.fullName}:`, error)
            result.records_skipped++
          }
        }
      }
    }

    logger.setMetadata('sessions_processed', sessions.length)
    logger.setMetadata('votes_saved', result.records_created)

    return await logger.complete()
  } catch (error) {
    await logger.fail(error instanceof Error ? error : new Error(String(error)))
    throw error
  }
}

/**
 * Gets voting summary for a candidate
 */
export async function getCandidateVotingSummary(candidateId: string): Promise<{
  totalVotes: number
  votesInFavor: number
  votesAgainst: number
  abstentions: number
  absences: number
  proCrimeVotesInFavor: number
  proCrimeVotesAgainst: number
  antiDemocraticVotes: number
  integrityPenalty: number
  integrityBonus: number
}> {
  const result = await sql`
    SELECT
      COUNT(*) as total_votes,
      COUNT(*) FILTER (WHERE vote_type = 'favor') as votes_favor,
      COUNT(*) FILTER (WHERE vote_type = 'contra') as votes_contra,
      COUNT(*) FILTER (WHERE vote_type = 'abstencion') as abstentions,
      COUNT(*) FILTER (WHERE vote_type IN ('ausente', 'licencia')) as absences,
      COUNT(*) FILTER (WHERE is_pro_crime = true AND vote_type = 'favor') as pro_crime_favor,
      COUNT(*) FILTER (WHERE is_pro_crime = true AND vote_type = 'contra') as pro_crime_contra,
      COUNT(*) FILTER (WHERE is_anti_democratic = true AND vote_type = 'favor') as anti_democratic
    FROM congressional_votes
    WHERE candidate_id = ${candidateId}::uuid
  `

  const row = result[0] || {}

  // Calculate penalties from controversial laws
  const penaltyResult = await sql`
    SELECT
      COALESCE(SUM(
        CASE WHEN cv.vote_type = 'favor' THEN cl.penalty_points ELSE 0 END
      ), 0) as total_penalty,
      COALESCE(SUM(
        CASE WHEN cv.vote_type = 'contra' THEN cl.bonus_points ELSE 0 END
      ), 0) as total_bonus
    FROM congressional_votes cv
    JOIN controversial_laws cl ON cv.project_id = cl.project_id
    WHERE cv.candidate_id = ${candidateId}::uuid
  `

  const penalties = penaltyResult[0] || { total_penalty: 0, total_bonus: 0 }

  return {
    totalVotes: Number(row.total_votes) || 0,
    votesInFavor: Number(row.votes_favor) || 0,
    votesAgainst: Number(row.votes_contra) || 0,
    abstentions: Number(row.abstentions) || 0,
    absences: Number(row.absences) || 0,
    proCrimeVotesInFavor: Number(row.pro_crime_favor) || 0,
    proCrimeVotesAgainst: Number(row.pro_crime_contra) || 0,
    antiDemocraticVotes: Number(row.anti_democratic) || 0,
    integrityPenalty: Number(penalties.total_penalty) || 0,
    integrityBonus: Number(penalties.total_bonus) || 0,
  }
}

export { getCongressCandidates, getControversialLaws }
