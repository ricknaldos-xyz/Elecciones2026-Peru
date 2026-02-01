import { NextRequest, NextResponse } from 'next/server'
import Parser from 'rss-parser'
import { ALL_RSS_SOURCES, isPoliticallyRelevant, getRateLimit } from '@/lib/sync/news/expanded-sources'
import { matchNewsToEntities } from '@/lib/sync/news/matcher'
import { createSyncLogger } from '@/lib/sync/logger'
import { sql } from '@/lib/db'
import { verifySyncAuth } from '@/lib/sync/auth'

export const runtime = 'nodejs'
export const maxDuration = 300

const parser = new Parser()

interface RSSItem {
  title: string
  link: string
  pubDate?: string
  contentSnippet?: string
  content?: string
}

/**
 * Expanded RSS News sync endpoint
 * Fetches news from 15+ Peruvian media outlets
 *
 * Schedule: every 2 hours (0 *​/2 * * *)
 */
export async function GET(request: NextRequest) {
  const authError = verifySyncAuth(request)
  if (authError) return authError

  const logger = createSyncLogger('expanded_rss')
  const stats = {
    sourcesProcessed: 0,
    itemsFound: 0,
    itemsSaved: 0,
    itemsSkipped: 0,
    errors: [] as string[],
  }

  try {
    await logger.start()
    logger.markRunning()

    for (const source of ALL_RSS_SOURCES) {
      try {
        console.log(`Fetching RSS: ${source.name}`)
        const feed = await parser.parseURL(source.url)

        stats.sourcesProcessed++
        const items = feed.items || []
        stats.itemsFound += items.length
        logger.incrementProcessed(items.length)

        for (const item of items as RSSItem[]) {
          // Check if politically relevant
          if (!isPoliticallyRelevant(item.title, item.contentSnippet)) {
            stats.itemsSkipped++
            logger.incrementSkipped()
            continue
          }

          // Check if already exists
          const exists = await sql`
            SELECT 1 FROM news_mentions WHERE url = ${item.link} LIMIT 1
          `

          if (exists.length > 0) {
            stats.itemsSkipped++
            logger.incrementSkipped()
            continue
          }

          // Match to candidates/parties - only save if linked
          const matches = await matchNewsToEntities({
            title: item.title,
            url: item.link,
            excerpt: item.contentSnippet || item.content || '',
            source: source.id,
          })

          if (matches.length === 0) {
            stats.itemsSkipped++
            logger.incrementSkipped()
            continue
          }

          // Save for each match (candidate or party)
          for (const match of matches) {
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
                keywords,
                relevance_score
              ) VALUES (
                ${match.candidateId}::uuid,
                ${match.partyId}::uuid,
                ${source.id},
                ${item.title},
                ${item.link},
                ${item.contentSnippet || item.content || ''},
                ${item.pubDate || new Date().toISOString()},
                ${match.sentiment},
                ${match.keywords}::text[],
                ${match.relevanceScore}
              )
              ON CONFLICT (url) DO NOTHING
            `
          }

          stats.itemsSaved++
          logger.incrementCreated()
        }

        // Rate limiting between sources
        const rateLimit = getRateLimit(source.id)
        await new Promise((resolve) => setTimeout(resolve, rateLimit.delayMs))
      } catch (error) {
        const errorMsg = `Error fetching ${source.name}: ${error}`
        stats.errors.push(errorMsg)
        console.error(errorMsg)
      }
    }

    logger.setMetadata('sources_processed', stats.sourcesProcessed)
    await logger.complete()

    return NextResponse.json({
      success: true,
      ...stats,
    })
  } catch (error) {
    await logger.fail(error instanceof Error ? error : new Error(String(error)))

    console.error('Expanded RSS sync error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        ...stats,
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  return GET(request)
}
