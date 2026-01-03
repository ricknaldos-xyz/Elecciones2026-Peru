/**
 * Twitter/X Scraper via Nitter
 *
 * Uses Nitter instances (privacy-focused Twitter frontend) to fetch tweets.
 * Nitter provides RSS feeds and is more scraping-friendly than Twitter directly.
 *
 * ⚠️ WARNING: Nitter instances can go offline or rate limit.
 * This implementation tries multiple instances as fallback.
 */

import Parser from 'rss-parser'
import { createSyncLogger } from '../logger'
import { sql } from '@/lib/db'

// Nitter instances (try in order, some may be down)
const NITTER_INSTANCES = [
  'https://nitter.privacydev.net',
  'https://nitter.poast.org',
  'https://nitter.cz',
  'https://nitter.1d4.us',
  'https://nitter.kavin.rocks',
]

// Configuration
const DELAY_BETWEEN_REQUESTS = 15000 // 15 seconds - be respectful
const MAX_TWEETS_PER_USER = 20
const MAX_RETRIES = 3

const parser = new Parser()

export interface Tweet {
  tweetId: string
  authorHandle: string
  authorName: string
  content: string
  publishedAt: string
  url: string
  isRetweet: boolean
  isReply: boolean
}

export interface TwitterSyncResult {
  success: boolean
  tweetsFound: number
  tweetsSaved: number
  errors: string[]
  instancesDown: string[]
}

/**
 * Delay helper
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Find a working Nitter instance
 */
async function findWorkingInstance(): Promise<string | null> {
  for (const instance of NITTER_INSTANCES) {
    try {
      const response = await fetch(instance, {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000),
      })

      if (response.ok) {
        console.log(`Using Nitter instance: ${instance}`)
        return instance
      }
    } catch {
      console.log(`Nitter instance down: ${instance}`)
    }
  }
  return null
}

/**
 * Fetch tweets from a user's RSS feed
 */
async function fetchUserTweets(
  instance: string,
  handle: string
): Promise<Tweet[]> {
  const tweets: Tweet[] = []
  const cleanHandle = handle.replace('@', '')

  try {
    const rssUrl = `${instance}/${cleanHandle}/rss`
    const feed = await parser.parseURL(rssUrl)

    for (const item of feed.items || []) {
      // Extract tweet ID from link
      const linkMatch = item.link?.match(/\/status\/(\d+)/)
      if (!linkMatch) continue

      const tweetId = linkMatch[1]
      const content = item.contentSnippet || item.content || ''

      tweets.push({
        tweetId,
        authorHandle: cleanHandle,
        authorName: feed.title?.replace("'s posts", '') || cleanHandle,
        content: stripHtmlTags(content),
        publishedAt: item.pubDate || new Date().toISOString(),
        url: `https://twitter.com/${cleanHandle}/status/${tweetId}`,
        isRetweet: content.startsWith('RT @') || content.startsWith('RT:'),
        isReply: content.startsWith('@'),
      })
    }
  } catch (error) {
    console.error(`Error fetching tweets for @${handle}:`, error)
  }

  return tweets.slice(0, MAX_TWEETS_PER_USER)
}

/**
 * Search tweets by term using Nitter search
 */
async function searchTweets(instance: string, query: string): Promise<Tweet[]> {
  const tweets: Tweet[] = []

  try {
    const searchUrl = `${instance}/search/rss?f=tweets&q=${encodeURIComponent(query)}`
    const feed = await parser.parseURL(searchUrl)

    for (const item of feed.items || []) {
      const linkMatch = item.link?.match(/\/([^/]+)\/status\/(\d+)/)
      if (!linkMatch) continue

      const [, authorHandle, tweetId] = linkMatch
      const content = item.contentSnippet || item.content || ''

      tweets.push({
        tweetId,
        authorHandle,
        authorName: item.creator || authorHandle,
        content: stripHtmlTags(content),
        publishedAt: item.pubDate || new Date().toISOString(),
        url: `https://twitter.com/${authorHandle}/status/${tweetId}`,
        isRetweet: content.startsWith('RT @'),
        isReply: content.startsWith('@'),
      })
    }
  } catch (error) {
    console.error(`Error searching tweets for "${query}":`, error)
  }

  return tweets.slice(0, MAX_TWEETS_PER_USER)
}

/**
 * Strip HTML tags from content
 */
function stripHtmlTags(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim()
}

/**
 * Get candidate Twitter handles from database
 */
async function getCandidateHandles(): Promise<
  Array<{ candidateId: string; handle: string }>
> {
  const result = await sql`
    SELECT candidate_id as "candidateId", twitter_handle as handle
    FROM candidate_social_profiles
    WHERE twitter_handle IS NOT NULL
    LIMIT 30
  `
  return result as Array<{ candidateId: string; handle: string }>
}

/**
 * Get search queries from monitoring hashtags
 */
async function getSearchQueries(): Promise<string[]> {
  const result = await sql`
    SELECT hashtag FROM monitoring_hashtags
    WHERE (platform = 'twitter' OR platform = 'all')
    AND is_active = TRUE
    ORDER BY priority DESC
    LIMIT 10
  `
  return result.map((r) => r.hashtag as string)
}

/**
 * Check if tweet already exists
 */
async function tweetExists(tweetId: string): Promise<boolean> {
  const result = await sql`
    SELECT 1 FROM social_mentions
    WHERE platform = 'twitter' AND post_id = ${tweetId}
    LIMIT 1
  `
  return result.length > 0
}

/**
 * Save tweet to database
 */
async function saveTweet(
  tweet: Tweet,
  candidateId: string | null,
  relevanceScore: number
): Promise<void> {
  await sql`
    INSERT INTO social_mentions (
      candidate_id,
      platform,
      post_id,
      author_handle,
      author_name,
      content,
      content_type,
      url,
      published_at,
      relevance_score,
      raw_data
    ) VALUES (
      ${candidateId},
      'twitter',
      ${tweet.tweetId},
      ${tweet.authorHandle},
      ${tweet.authorName},
      ${tweet.content},
      ${tweet.isRetweet ? 'retweet' : tweet.isReply ? 'reply' : 'tweet'},
      ${tweet.url},
      ${tweet.publishedAt},
      ${relevanceScore},
      ${JSON.stringify(tweet)}
    )
    ON CONFLICT (platform, post_id) DO UPDATE SET
      updated_at = NOW()
  `
}

/**
 * Calculate relevance score for a tweet
 */
function calculateRelevance(tweet: Tweet, context: string): number {
  let score = 0.3 // Base score

  const text = tweet.content.toLowerCase()

  // Check context match
  if (text.includes(context.toLowerCase().replace('#', ''))) {
    score += 0.1
  }

  // Retweets are slightly less relevant
  if (tweet.isRetweet) {
    score -= 0.1
  }

  // Check for election-related keywords
  const keywords = [
    'elecciones',
    'candidato',
    'presidente',
    'peru',
    '2026',
    'votar',
    'voto',
    'congreso',
    'jne',
    'onpe',
  ]
  const keywordMatches = keywords.filter((k) => text.includes(k)).length
  score += Math.min(0.3, keywordMatches * 0.05)

  // Negative sentiment keywords (might be relevant news)
  const negativeKeywords = [
    'corrupción',
    'denuncia',
    'escándalo',
    'sentencia',
    'investigación',
  ]
  const negativeMatches = negativeKeywords.filter((k) => text.includes(k)).length
  if (negativeMatches > 0) {
    score += 0.1 // Newsworthy
  }

  return Math.min(1, Math.max(0, score))
}

/**
 * Main sync function
 */
export async function syncTwitter(): Promise<TwitterSyncResult> {
  const logger = createSyncLogger('twitter')
  const result: TwitterSyncResult = {
    success: false,
    tweetsFound: 0,
    tweetsSaved: 0,
    errors: [],
    instancesDown: [],
  }

  try {
    await logger.start()
    logger.markRunning()

    // Find working Nitter instance
    const instance = await findWorkingInstance()

    if (!instance) {
      result.errors.push('No working Nitter instance found')
      result.instancesDown = NITTER_INSTANCES
      await logger.fail(new Error('No working Nitter instance'))
      return result
    }

    logger.setMetadata('nitter_instance', instance)

    // Get candidate handles
    const handles = await getCandidateHandles()
    logger.setMetadata('handles_to_search', handles.length)

    // Fetch tweets for each candidate
    for (const { candidateId, handle } of handles) {
      try {
        console.log(`Fetching tweets for @${handle}`)
        const tweets = await fetchUserTweets(instance, handle)

        result.tweetsFound += tweets.length
        logger.incrementProcessed(tweets.length)

        for (const tweet of tweets) {
          if (await tweetExists(tweet.tweetId)) {
            logger.incrementSkipped()
            continue
          }

          const relevance = calculateRelevance(tweet, handle)
          await saveTweet(tweet, candidateId, relevance)
          result.tweetsSaved++
          logger.incrementCreated()
        }

        await delay(DELAY_BETWEEN_REQUESTS)
      } catch (error) {
        result.errors.push(`Error fetching @${handle}: ${error}`)
      }
    }

    // Search for hashtags/queries
    const queries = await getSearchQueries()
    logger.setMetadata('queries_to_search', queries.length)

    for (const query of queries) {
      try {
        console.log(`Searching tweets: ${query}`)
        const tweets = await searchTweets(instance, query)

        result.tweetsFound += tweets.length
        logger.incrementProcessed(tweets.length)

        for (const tweet of tweets) {
          if (await tweetExists(tweet.tweetId)) {
            logger.incrementSkipped()
            continue
          }

          const relevance = calculateRelevance(tweet, query)
          await saveTweet(tweet, null, relevance)
          result.tweetsSaved++
          logger.incrementCreated()
        }

        await delay(DELAY_BETWEEN_REQUESTS)
      } catch (error) {
        result.errors.push(`Error searching "${query}": ${error}`)
      }
    }

    result.success = result.errors.length < handles.length + queries.length
    await logger.complete()
  } catch (error) {
    result.errors.push(`Sync failed: ${error}`)
    await logger.fail(error instanceof Error ? error : new Error(String(error)))
  }

  return result
}

/**
 * Health check - verify Nitter instances are available
 */
export async function checkNitterHealth(): Promise<{
  available: string[]
  down: string[]
}> {
  const available: string[] = []
  const down: string[] = []

  for (const instance of NITTER_INSTANCES) {
    try {
      const response = await fetch(instance, {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000),
      })

      if (response.ok) {
        available.push(instance)
      } else {
        down.push(instance)
      }
    } catch {
      down.push(instance)
    }
  }

  return { available, down }
}
