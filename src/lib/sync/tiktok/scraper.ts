/**
 * TikTok Scraper (Experimental)
 *
 * ⚠️ WARNING: TikTok aggressively blocks scraping. This implementation:
 * - Uses very conservative rate limiting
 * - May fail frequently due to anti-bot measures
 * - Should be considered experimental
 *
 * Alternative: Consider using Apify TikTok Scraper ($49/month) for reliability
 */

import { createSyncLogger } from '../logger'
import { sql } from '@/lib/db'

// Configuration
const DELAY_BETWEEN_REQUESTS = 10000 // 10 seconds - very conservative
const MAX_VIDEOS_PER_HASHTAG = 10
const USER_AGENT =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'

// TikTok web URLs
const TIKTOK_BASE = 'https://www.tiktok.com'

export interface TikTokVideo {
  videoId: string
  authorHandle: string
  authorName: string
  description: string
  likeCount: number
  commentCount: number
  shareCount: number
  viewCount: number
  createTime: number
  url: string
  thumbnailUrl?: string
}

export interface TikTokSyncResult {
  success: boolean
  videosFound: number
  videosSaved: number
  errors: string[]
  blocked: boolean
}

/**
 * Delay helper
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Get hashtags to search from database
 */
async function getHashtagsToSearch(): Promise<string[]> {
  const result = await sql`
    SELECT hashtag FROM monitoring_hashtags
    WHERE (platform = 'tiktok' OR platform = 'all')
    AND is_active = TRUE
    ORDER BY priority DESC
    LIMIT 10
  `
  return result.map((r) => r.hashtag as string)
}

/**
 * Get candidate handles to search
 */
async function getCandidateHandles(): Promise<
  Array<{ candidateId: string; handle: string }>
> {
  const result = await sql`
    SELECT candidate_id as "candidateId", tiktok_handle as handle
    FROM candidate_social_profiles
    WHERE tiktok_handle IS NOT NULL
    LIMIT 20
  `
  return result as Array<{ candidateId: string; handle: string }>
}

/**
 * Attempt to fetch TikTok data via web scraping
 * Note: This is likely to fail due to TikTok's anti-bot measures
 */
async function fetchTikTokData(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'es-PE,es;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        Connection: 'keep-alive',
        'Cache-Control': 'no-cache',
      },
    })

    if (!response.ok) {
      console.error(`TikTok fetch failed: ${response.status}`)
      return null
    }

    return await response.text()
  } catch (error) {
    console.error('TikTok fetch error:', error)
    return null
  }
}

/**
 * Parse TikTok video data from HTML/JSON
 * Note: TikTok frequently changes their page structure
 */
function parseTikTokVideos(html: string): TikTokVideo[] {
  const videos: TikTokVideo[] = []

  try {
    // Look for SIGI_STATE or similar JSON data in the page
    const jsonMatch = html.match(
      /<script id="SIGI_STATE" type="application\/json">(.+?)<\/script>/
    )
    if (!jsonMatch) {
      // Try alternative patterns
      const altMatch = html.match(
        /<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__" type="application\/json">(.+?)<\/script>/
      )
      if (!altMatch) {
        console.log('Could not find TikTok data in page')
        return videos
      }
    }

    const jsonStr = jsonMatch ? jsonMatch[1] : ''
    if (!jsonStr) return videos

    const data = JSON.parse(jsonStr)

    // Navigate to video items (structure may vary)
    const itemModule = data.ItemModule || data.items || {}

    for (const videoId of Object.keys(itemModule)) {
      const item = itemModule[videoId]
      if (!item) continue

      videos.push({
        videoId: item.id || videoId,
        authorHandle: item.author?.uniqueId || item.authorId || '',
        authorName: item.author?.nickname || '',
        description: item.desc || '',
        likeCount: parseInt(item.stats?.diggCount || '0', 10),
        commentCount: parseInt(item.stats?.commentCount || '0', 10),
        shareCount: parseInt(item.stats?.shareCount || '0', 10),
        viewCount: parseInt(item.stats?.playCount || '0', 10),
        createTime: item.createTime || Date.now() / 1000,
        url: `${TIKTOK_BASE}/@${item.author?.uniqueId}/video/${item.id || videoId}`,
        thumbnailUrl: item.video?.cover || item.video?.dynamicCover,
      })
    }
  } catch (error) {
    console.error('Error parsing TikTok data:', error)
  }

  return videos
}

/**
 * Check if video already exists
 */
async function videoExists(videoId: string): Promise<boolean> {
  const result = await sql`
    SELECT 1 FROM social_mentions
    WHERE platform = 'tiktok' AND post_id = ${videoId}
    LIMIT 1
  `
  return result.length > 0
}

/**
 * Save video to database
 */
async function saveVideo(
  video: TikTokVideo,
  candidateId: string | null,
  partyId: string | null,
  relevanceScore: number
): Promise<void> {
  await sql`
    INSERT INTO social_mentions (
      candidate_id,
      party_id,
      platform,
      post_id,
      author_handle,
      author_name,
      content,
      content_type,
      url,
      thumbnail_url,
      like_count,
      comment_count,
      share_count,
      view_count,
      published_at,
      relevance_score,
      raw_data
    ) VALUES (
      ${candidateId},
      ${partyId},
      'tiktok',
      ${video.videoId},
      ${video.authorHandle},
      ${video.authorName},
      ${video.description},
      'video',
      ${video.url},
      ${video.thumbnailUrl || null},
      ${video.likeCount},
      ${video.commentCount},
      ${video.shareCount},
      ${video.viewCount},
      ${new Date(video.createTime * 1000).toISOString()},
      ${relevanceScore},
      ${JSON.stringify(video)}
    )
    ON CONFLICT (platform, post_id) DO UPDATE SET
      like_count = EXCLUDED.like_count,
      comment_count = EXCLUDED.comment_count,
      share_count = EXCLUDED.share_count,
      view_count = EXCLUDED.view_count,
      updated_at = NOW()
  `
}

/**
 * Calculate relevance score for a TikTok video
 */
function calculateRelevance(video: TikTokVideo, searchTerm: string): number {
  let score = 0.3 // Base score for appearing in search

  const text = video.description.toLowerCase()
  const term = searchTerm.toLowerCase().replace('#', '')

  // Check if search term is in description
  if (text.includes(term)) {
    score += 0.1
  }

  // Engagement bonuses (log scale)
  if (video.viewCount > 1000) {
    score += Math.min(0.2, Math.log10(video.viewCount) / 25)
  }

  if (video.likeCount > 100) {
    score += Math.min(0.1, Math.log10(video.likeCount) / 20)
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
  ]
  const keywordMatches = keywords.filter((k) => text.includes(k)).length
  score += Math.min(0.2, keywordMatches * 0.05)

  return Math.min(1, score)
}

/**
 * Main sync function
 */
export async function syncTikTok(): Promise<TikTokSyncResult> {
  const logger = createSyncLogger('tiktok')
  const result: TikTokSyncResult = {
    success: false,
    videosFound: 0,
    videosSaved: 0,
    errors: [],
    blocked: false,
  }

  try {
    await logger.start()
    logger.markRunning()

    // Get hashtags to search
    const hashtags = await getHashtagsToSearch()
    logger.setMetadata('hashtags_to_search', hashtags.length)

    // Search each hashtag
    for (const hashtag of hashtags) {
      try {
        const cleanTag = hashtag.replace('#', '')
        const url = `${TIKTOK_BASE}/tag/${cleanTag}`

        console.log(`Fetching TikTok hashtag: ${hashtag}`)
        const html = await fetchTikTokData(url)

        if (!html) {
          result.errors.push(`Failed to fetch ${hashtag}`)
          continue
        }

        // Check if we're blocked
        if (
          html.includes('captcha') ||
          html.includes('Please verify') ||
          html.length < 1000
        ) {
          result.blocked = true
          result.errors.push('TikTok is blocking requests (captcha detected)')
          break
        }

        const videos = parseTikTokVideos(html)
        result.videosFound += videos.length
        logger.incrementProcessed(videos.length)

        for (const video of videos.slice(0, MAX_VIDEOS_PER_HASHTAG)) {
          if (await videoExists(video.videoId)) {
            logger.incrementSkipped()
            continue
          }

          const relevance = calculateRelevance(video, hashtag)
          await saveVideo(video, null, null, relevance)
          result.videosSaved++
          logger.incrementCreated()
        }

        await delay(DELAY_BETWEEN_REQUESTS)
      } catch (error) {
        result.errors.push(`Error fetching ${hashtag}: ${error}`)
      }
    }

    // Also try candidate handles if we're not blocked
    if (!result.blocked) {
      const handles = await getCandidateHandles()

      for (const { candidateId, handle } of handles) {
        try {
          const url = `${TIKTOK_BASE}/@${handle}`
          const html = await fetchTikTokData(url)

          if (!html || html.includes('captcha')) {
            result.blocked = true
            break
          }

          const videos = parseTikTokVideos(html)
          result.videosFound += videos.length

          for (const video of videos.slice(0, 5)) {
            if (await videoExists(video.videoId)) {
              continue
            }

            await saveVideo(video, candidateId, null, 0.8)
            result.videosSaved++
            logger.incrementCreated()
          }

          await delay(DELAY_BETWEEN_REQUESTS)
        } catch (error) {
          result.errors.push(`Error fetching @${handle}: ${error}`)
        }
      }
    }

    result.success = !result.blocked && result.errors.length < hashtags.length
    logger.setMetadata('blocked', result.blocked)
    await logger.complete()
  } catch (error) {
    result.errors.push(`Sync failed: ${error}`)
    await logger.fail(error instanceof Error ? error : new Error(String(error)))
  }

  return result
}

/**
 * Fallback: Use web search to find TikTok videos
 * This uses Google to find TikTok videos about candidates
 */
export async function searchTikTokViaGoogle(
  query: string
): Promise<TikTokVideo[]> {
  // This is a fallback that searches Google for TikTok videos
  // Format: site:tiktok.com "query"
  const searchUrl = `https://www.google.com/search?q=site:tiktok.com+"${encodeURIComponent(query)}"&tbm=vid`

  // Note: Google also blocks scraping, so this is also experimental
  console.log('TikTok Google search is not implemented - requires Puppeteer')
  return []
}
