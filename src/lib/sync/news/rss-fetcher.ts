import Parser from 'rss-parser'
import { createSyncLogger } from '../logger'
import { matchNewsToEntities, NewsItem } from './matcher'
import { sql } from '@/lib/db'

const parser = new Parser({
  customFields: {
    item: ['media:content', 'content:encoded', 'dc:creator'],
  },
})

interface RSSSource {
  name: string
  id: string
  url: string
  type: 'rss' | 'atom'
}

// Main news sources in Peru
const NEWS_SOURCES: RSSSource[] = [
  {
    name: 'El Comercio',
    id: 'elcomercio',
    url: 'https://elcomercio.pe/feed/politica/',
    type: 'rss',
  },
  {
    name: 'La República',
    id: 'larepublica',
    url: 'https://larepublica.pe/feed/politica/',
    type: 'rss',
  },
  {
    name: 'RPP Noticias',
    id: 'rpp',
    url: 'https://rpp.pe/feed/politica',
    type: 'rss',
  },
  {
    name: 'Gestión',
    id: 'gestion',
    url: 'https://gestion.pe/feed/politica/',
    type: 'rss',
  },
  {
    name: 'Peru21',
    id: 'peru21',
    url: 'https://peru21.pe/feed/politica/',
    type: 'rss',
  },
  {
    name: 'Correo',
    id: 'correo',
    url: 'https://diariocorreo.pe/feed/politica/',
    type: 'rss',
  },
  {
    name: 'Congrezoo',
    id: 'congrezoo',
    url: 'https://congrezoo.pe/feed/',
    type: 'rss',
  },
]

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Fetches and parses an RSS feed
 */
async function fetchRSSFeed(source: RSSSource): Promise<NewsItem[]> {
  try {
    console.log(`[News] Fetching RSS from ${source.name}...`)

    const feed = await parser.parseURL(source.url)
    const items: NewsItem[] = []

    for (const item of feed.items) {
      // Extract published date
      let publishedAt: Date | undefined
      if (item.pubDate) {
        publishedAt = new Date(item.pubDate)
      } else if (item.isoDate) {
        publishedAt = new Date(item.isoDate)
      }

      // Extract content/excerpt
      const content =
        (item['content:encoded'] as string) ||
        item.content ||
        item.contentSnippet ||
        item.summary ||
        ''

      // Clean HTML from content
      const excerpt = content
        .replace(/<[^>]*>/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 500)

      items.push({
        title: item.title || '',
        url: item.link || '',
        excerpt,
        source: source.id,
        published_at: publishedAt,
        author: (item['dc:creator'] as string) || item.creator,
      })
    }

    console.log(`[News] Found ${items.length} items from ${source.name}`)
    return items
  } catch (error) {
    console.error(`[News] Error fetching ${source.name}:`, error)
    return []
  }
}

/**
 * Checks if a news item already exists in the database
 */
async function newsExists(url: string): Promise<boolean> {
  const result = await sql`
    SELECT id FROM news_mentions
    WHERE url = ${url}
    LIMIT 1
  `
  return result.length > 0
}

/**
 * Saves a news mention to the database
 */
async function saveNewsMention(
  item: NewsItem,
  candidateId: string | null,
  partyId: string | null,
  sentiment: string,
  keywords: string[]
): Promise<boolean> {
  try {
    await sql`
      INSERT INTO news_mentions (
        candidate_id,
        party_id,
        source,
        title,
        url,
        excerpt,
        published_at,
        sentiment,
        keywords
      ) VALUES (
        ${candidateId}::uuid,
        ${partyId}::uuid,
        ${item.source},
        ${item.title},
        ${item.url},
        ${item.excerpt || null},
        ${item.published_at?.toISOString() || null}::timestamptz,
        ${sentiment},
        ${keywords}::text[]
      )
      ON CONFLICT (url) DO NOTHING
    `
    return true
  } catch (error) {
    console.error(`[News] Error saving news mention:`, error)
    return false
  }
}

/**
 * Main sync function - fetches news from all sources
 */
export async function syncNews(): Promise<{
  records_processed: number
  records_updated: number
  records_created: number
  records_skipped: number
}> {
  const logger = createSyncLogger('news')
  await logger.start()

  try {
    await logger.markRunning()

    // Fetch from all RSS sources
    const allItems: NewsItem[] = []

    for (const source of NEWS_SOURCES) {
      const items = await fetchRSSFeed(source)
      allItems.push(...items)
      await delay(1000) // Small delay between sources
    }

    console.log(`[News] Total items fetched: ${allItems.length}`)
    logger.setMetadata('total_fetched', allItems.length)

    // Process each news item
    for (const item of allItems) {
      logger.incrementProcessed()

      // Skip if already exists
      if (await newsExists(item.url)) {
        logger.incrementSkipped()
        continue
      }

      // Match to candidates/parties
      const matches = await matchNewsToEntities(item)

      if (matches.length === 0) {
        // No match found, skip
        logger.incrementSkipped()
        continue
      }

      // Save for each match
      for (const match of matches) {
        const saved = await saveNewsMention(
          item,
          match.candidateId,
          match.partyId,
          match.sentiment,
          match.keywords
        )

        if (saved) {
          logger.incrementCreated()
          console.log(
            `[News] Saved: "${item.title.substring(0, 50)}..." -> ${
              match.candidateName || match.partyName
            }`
          )
        }
      }
    }

    return await logger.complete()
  } catch (error) {
    await logger.fail(error as Error)
    throw error
  }
}

export { NEWS_SOURCES, fetchRSSFeed }
