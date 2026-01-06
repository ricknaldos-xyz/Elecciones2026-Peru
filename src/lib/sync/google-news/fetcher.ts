/**
 * Google News RSS Fetcher
 *
 * Uses the free Google News RSS feed to search for news about candidates.
 * No API key required - uses public RSS endpoints.
 *
 * URL format: https://news.google.com/rss/search?q={query}&hl=es-419&gl=PE&ceid=PE:es-419
 */

import Parser from 'rss-parser'
import { createSyncLogger } from '../logger'
import { sql } from '@/lib/db'

const parser = new Parser({
  customFields: {
    item: ['source', 'source.url'],
  },
})

// Rate limiting
const DELAY_BETWEEN_REQUESTS = 2000 // 2 seconds between requests
const MAX_ITEMS_PER_SEARCH = 20

export interface GoogleNewsItem {
  title: string
  link: string
  pubDate: string
  source: string
  sourceUrl?: string
  guid: string
  contentSnippet?: string
}

export interface GoogleNewsSyncResult {
  success: boolean
  itemsFound: number
  itemsSaved: number
  errors: string[]
}

/**
 * Build Google News RSS URL
 */
function buildGoogleNewsUrl(query: string): string {
  const encodedQuery = encodeURIComponent(query)
  return `https://news.google.com/rss/search?q=${encodedQuery}&hl=es-419&gl=PE&ceid=PE:es-419`
}

/**
 * Delay helper
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Fetch news for a query
 */
export async function fetchGoogleNews(query: string): Promise<GoogleNewsItem[]> {
  try {
    const url = buildGoogleNewsUrl(query)
    const feed = await parser.parseURL(url)

    return (feed.items || []).slice(0, MAX_ITEMS_PER_SEARCH).map((item) => ({
      title: item.title || '',
      link: item.link || '',
      pubDate: item.pubDate || new Date().toISOString(),
      source: (item as { source?: string }).source || 'Google News',
      sourceUrl: (item as { 'source.url'?: string })['source.url'],
      guid: item.guid || item.link || '',
      contentSnippet: item.contentSnippet,
    }))
  } catch (error) {
    console.error(`Error fetching Google News for "${query}":`, error)
    return []
  }
}

/**
 * Get candidates to search for
 */
async function getCandidatesToSearch(): Promise<
  Array<{ id: string; name: string; partyId: string | null }>
> {
  const result = await sql`
    SELECT
      c.id,
      c.full_name as name,
      c.party_id as "partyId"
    FROM candidates c
    WHERE c.is_active = TRUE
    AND c.cargo IN ('presidente', 'vicepresidente')
    ORDER BY c.cargo, c.full_name
    LIMIT 25
  `
  return result as Array<{ id: string; name: string; partyId: string | null }>
}

/**
 * Get parties to search for
 */
async function getPartiesToSearch(): Promise<
  Array<{ id: string; name: string; shortName: string }>
> {
  const result = await sql`
    SELECT id, name, short_name as "shortName"
    FROM parties
    WHERE id IN (
      SELECT DISTINCT party_id FROM candidates WHERE is_active = TRUE
    )
    LIMIT 20
  `
  return result as Array<{ id: string; name: string; shortName: string }>
}

/**
 * Check if news item already exists
 */
async function newsExists(url: string): Promise<boolean> {
  const result = await sql`
    SELECT 1 FROM news_mentions
    WHERE url = ${url}
    LIMIT 1
  `
  return result.length > 0
}

/**
 * Extract source name from Google News link
 */
function extractSourceFromUrl(link: string): string {
  try {
    // Google News links often redirect, try to extract from URL
    const url = new URL(link)
    const host = url.hostname.replace('www.', '')

    // Map common domains to source names
    const sourceMap: Record<string, string> = {
      'elcomercio.pe': 'El Comercio',
      'larepublica.pe': 'La República',
      'rpp.pe': 'RPP',
      'gestion.pe': 'Gestión',
      'peru21.pe': 'Peru21',
      'andina.pe': 'Andina',
      'infobae.com': 'Infobae',
      'americatv.com.pe': 'América TV',
    }

    return sourceMap[host] || host
  } catch {
    return 'google_news'
  }
}

/**
 * Save news item to database
 */
async function saveNewsItem(
  item: GoogleNewsItem,
  candidateId: string | null,
  partyId: string | null
): Promise<void> {
  // Use the source from Google News RSS (already has the real portal name)
  // Fall back to extracting from URL only if not available
  const source = item.source || extractSourceFromUrl(item.link)

  await sql`
    INSERT INTO news_mentions (
      candidate_id,
      party_id,
      source,
      title,
      url,
      excerpt,
      published_at,
      relevance_score
    ) VALUES (
      ${candidateId},
      ${partyId},
      ${source},
      ${item.title},
      ${item.link},
      ${item.contentSnippet || ''},
      ${item.pubDate},
      ${0.5}
    )
    ON CONFLICT (url) DO NOTHING
  `
}

/**
 * Main sync function
 */
export async function syncGoogleNews(): Promise<GoogleNewsSyncResult> {
  const logger = createSyncLogger('google_news')
  const result: GoogleNewsSyncResult = {
    success: false,
    itemsFound: 0,
    itemsSaved: 0,
    errors: [],
  }

  try {
    await logger.start()
    logger.markRunning()

    // Get candidates and parties to search
    const candidates = await getCandidatesToSearch()
    const parties = await getPartiesToSearch()

    logger.setMetadata('candidates_to_search', candidates.length)
    logger.setMetadata('parties_to_search', parties.length)

    // Search for each candidate
    for (const candidate of candidates) {
      try {
        // Search by candidate name + elections context
        const query = `"${candidate.name}" elecciones 2026`
        const items = await fetchGoogleNews(query)

        result.itemsFound += items.length
        logger.incrementProcessed(items.length)

        for (const item of items) {
          // Check if already exists
          if (await newsExists(item.link)) {
            logger.incrementSkipped()
            continue
          }

          // Save to database
          await saveNewsItem(item, candidate.id, candidate.partyId)
          result.itemsSaved++
          logger.incrementCreated()
        }

        await delay(DELAY_BETWEEN_REQUESTS)
      } catch (error) {
        const errorMsg = `Error searching for ${candidate.name}: ${error}`
        result.errors.push(errorMsg)
        console.error(errorMsg)
      }
    }

    // Search for each party
    for (const party of parties) {
      try {
        const query = `"${party.name}" elecciones 2026 peru`
        const items = await fetchGoogleNews(query)

        result.itemsFound += items.length
        logger.incrementProcessed(items.length)

        for (const item of items) {
          if (await newsExists(item.link)) {
            logger.incrementSkipped()
            continue
          }

          await saveNewsItem(item, null, party.id)
          result.itemsSaved++
          logger.incrementCreated()
        }

        await delay(DELAY_BETWEEN_REQUESTS)
      } catch (error) {
        result.errors.push(`Error searching for party ${party.name}: ${error}`)
      }
    }

    // General election searches
    const generalQueries = [
      'elecciones generales peru 2026',
      'candidatos presidenciales peru 2026',
      'encuesta electoral peru 2026',
      'JNE inscripción candidatos 2026',
      'ONPE elecciones 2026',
    ]

    for (const query of generalQueries) {
      try {
        const items = await fetchGoogleNews(query)
        result.itemsFound += items.length
        logger.incrementProcessed(items.length)

        for (const item of items) {
          if (await newsExists(item.link)) {
            logger.incrementSkipped()
            continue
          }

          await saveNewsItem(item, null, null)
          result.itemsSaved++
          logger.incrementCreated()
        }

        await delay(DELAY_BETWEEN_REQUESTS)
      } catch (error) {
        result.errors.push(`Error searching general query "${query}": ${error}`)
      }
    }

    result.success = true
    await logger.complete()
  } catch (error) {
    result.errors.push(`Sync failed: ${error}`)
    await logger.fail(error instanceof Error ? error : new Error(String(error)))
  }

  return result
}
