/**
 * YouTube Data API v3 Integration
 *
 * Fetches videos, comments, and channel data related to candidates.
 * Uses the free tier (10,000 quota units/day).
 *
 * Quota costs:
 * - search.list: 100 units
 * - videos.list: 1 unit
 * - commentThreads.list: 1 unit
 * - channels.list: 1 unit
 */

import { createSyncLogger } from '../logger'
import { sql } from '@/lib/db'

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3'

// Rate limiting
const DELAY_BETWEEN_REQUESTS = 500 // 500ms between requests
const MAX_RESULTS_PER_SEARCH = 25

export interface YouTubeVideo {
  videoId: string
  title: string
  description: string
  channelId: string
  channelTitle: string
  publishedAt: string
  thumbnailUrl: string
  viewCount: number
  likeCount: number
  commentCount: number
}

export interface YouTubeComment {
  commentId: string
  videoId: string
  authorName: string
  authorChannelId?: string
  text: string
  likeCount: number
  publishedAt: string
}

export interface YouTubeSyncResult {
  success: boolean
  videosFound: number
  videosSaved: number
  commentsFound: number
  commentsSaved: number
  errors: string[]
}

/**
 * Delay helper
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Make authenticated request to YouTube API
 */
async function youtubeRequest<T>(
  endpoint: string,
  params: Record<string, string>
): Promise<T | null> {
  if (!YOUTUBE_API_KEY) {
    console.error('YOUTUBE_API_KEY not configured')
    return null
  }

  const url = new URL(`${YOUTUBE_API_BASE}/${endpoint}`)
  url.searchParams.set('key', YOUTUBE_API_KEY)
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value)
  })

  try {
    const response = await fetch(url.toString(), {
      headers: {
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.text()
      console.error(`YouTube API error: ${response.status}`, error)
      return null
    }

    return (await response.json()) as T
  } catch (error) {
    console.error('YouTube API request failed:', error)
    return null
  }
}

/**
 * Search for videos by query
 */
export async function searchVideos(
  query: string,
  maxResults: number = MAX_RESULTS_PER_SEARCH
): Promise<YouTubeVideo[]> {
  // Search request (100 quota units)
  const searchResult = await youtubeRequest<{
    items: Array<{
      id: { videoId: string }
      snippet: {
        title: string
        description: string
        channelId: string
        channelTitle: string
        publishedAt: string
        thumbnails: { high?: { url: string } }
      }
    }>
  }>('search', {
    part: 'snippet',
    q: query,
    type: 'video',
    regionCode: 'PE',
    relevanceLanguage: 'es',
    maxResults: maxResults.toString(),
    order: 'date',
    publishedAfter: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // Last 7 days
  })

  if (!searchResult?.items?.length) {
    return []
  }

  await delay(DELAY_BETWEEN_REQUESTS)

  // Get video statistics (1 quota unit per call)
  const videoIds = searchResult.items.map((item) => item.id.videoId).join(',')
  const statsResult = await youtubeRequest<{
    items: Array<{
      id: string
      statistics: {
        viewCount: string
        likeCount: string
        commentCount: string
      }
    }>
  }>('videos', {
    part: 'statistics',
    id: videoIds,
  })

  const statsMap = new Map(
    statsResult?.items?.map((item) => [item.id, item.statistics]) || []
  )

  return searchResult.items.map((item) => {
    const stats = statsMap.get(item.id.videoId)
    return {
      videoId: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      channelId: item.snippet.channelId,
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
      thumbnailUrl: item.snippet.thumbnails?.high?.url || '',
      viewCount: parseInt(stats?.viewCount || '0', 10),
      likeCount: parseInt(stats?.likeCount || '0', 10),
      commentCount: parseInt(stats?.commentCount || '0', 10),
    }
  })
}

/**
 * Get comments for a video
 */
export async function getVideoComments(
  videoId: string,
  maxResults: number = 50
): Promise<YouTubeComment[]> {
  const result = await youtubeRequest<{
    items: Array<{
      id: string
      snippet: {
        topLevelComment: {
          snippet: {
            authorDisplayName: string
            authorChannelId?: { value: string }
            textDisplay: string
            likeCount: number
            publishedAt: string
          }
        }
      }
    }>
  }>('commentThreads', {
    part: 'snippet',
    videoId,
    maxResults: maxResults.toString(),
    order: 'relevance',
  })

  if (!result?.items) {
    return []
  }

  return result.items.map((item) => ({
    commentId: item.id,
    videoId,
    authorName: item.snippet.topLevelComment.snippet.authorDisplayName,
    authorChannelId: item.snippet.topLevelComment.snippet.authorChannelId?.value,
    text: item.snippet.topLevelComment.snippet.textDisplay,
    likeCount: item.snippet.topLevelComment.snippet.likeCount,
    publishedAt: item.snippet.topLevelComment.snippet.publishedAt,
  }))
}

/**
 * Get candidates to search for
 */
async function getCandidatesToSearch(): Promise<
  Array<{ id: string; name: string; party: string }>
> {
  const result = await sql`
    SELECT
      c.id,
      c.full_name as name,
      COALESCE(p.name, '') as party
    FROM candidates c
    LEFT JOIN parties p ON c.party_id = p.id
    WHERE c.is_active = TRUE
    AND c.cargo IN ('presidente', 'vicepresidente')
    ORDER BY c.cargo, c.full_name
    LIMIT 30
  `
  return result as Array<{ id: string; name: string; party: string }>
}

/**
 * Check if video already exists
 */
async function videoExists(videoId: string): Promise<boolean> {
  const result = await sql`
    SELECT 1 FROM social_mentions
    WHERE platform = 'youtube' AND post_id = ${videoId}
    LIMIT 1
  `
  return result.length > 0
}

/**
 * Save video to database
 */
async function saveVideo(
  video: YouTubeVideo,
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
      view_count,
      like_count,
      comment_count,
      published_at,
      relevance_score,
      raw_data
    ) VALUES (
      ${candidateId},
      ${partyId},
      'youtube',
      ${video.videoId},
      ${video.channelId},
      ${video.channelTitle},
      ${video.title + '\n\n' + video.description},
      'video',
      ${'https://www.youtube.com/watch?v=' + video.videoId},
      ${video.thumbnailUrl},
      ${video.viewCount},
      ${video.likeCount},
      ${video.commentCount},
      ${video.publishedAt},
      ${relevanceScore},
      ${JSON.stringify(video)}
    )
    ON CONFLICT (platform, post_id) DO UPDATE SET
      view_count = EXCLUDED.view_count,
      like_count = EXCLUDED.like_count,
      comment_count = EXCLUDED.comment_count,
      updated_at = NOW()
  `
}

/**
 * Main sync function
 */
export async function syncYouTube(): Promise<YouTubeSyncResult> {
  const logger = createSyncLogger('youtube')
  const result: YouTubeSyncResult = {
    success: false,
    videosFound: 0,
    videosSaved: 0,
    commentsFound: 0,
    commentsSaved: 0,
    errors: [],
  }

  if (!YOUTUBE_API_KEY) {
    result.errors.push('YOUTUBE_API_KEY not configured')
    return result
  }

  try {
    await logger.start()
    logger.markRunning()

    // Get candidates to search
    const candidates = await getCandidatesToSearch()
    logger.setMetadata('candidates_to_search', candidates.length)

    // Search for each candidate
    for (const candidate of candidates) {
      try {
        // Search by candidate name
        const searchQuery = `"${candidate.name}" elecciones peru 2026`
        const videos = await searchVideos(searchQuery, 10)

        result.videosFound += videos.length
        logger.incrementProcessed(videos.length)

        for (const video of videos) {
          // Check if already exists
          if (await videoExists(video.videoId)) {
            logger.incrementSkipped()
            continue
          }

          // Calculate relevance score
          const relevance = calculateRelevance(video, candidate.name)

          // Save to database
          await saveVideo(video, candidate.id, null, relevance)
          result.videosSaved++
          logger.incrementCreated()
        }

        await delay(DELAY_BETWEEN_REQUESTS)
      } catch (error) {
        const errorMsg = `Error searching for ${candidate.name}: ${error}`
        result.errors.push(errorMsg)
        console.error(errorMsg)
      }
    }

    // Also search for general election hashtags
    const generalQueries = [
      'elecciones peru 2026',
      'candidatos presidenciales peru 2026',
      'debate presidencial peru',
    ]

    for (const query of generalQueries) {
      try {
        const videos = await searchVideos(query, 15)
        result.videosFound += videos.length
        logger.incrementProcessed(videos.length)

        for (const video of videos) {
          if (await videoExists(video.videoId)) {
            logger.incrementSkipped()
            continue
          }

          await saveVideo(video, null, null, 0.3)
          result.videosSaved++
          logger.incrementCreated()
        }

        await delay(DELAY_BETWEEN_REQUESTS * 2)
      } catch (error) {
        result.errors.push(`Error searching query "${query}": ${error}`)
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

/**
 * Calculate relevance score for a video
 */
function calculateRelevance(video: YouTubeVideo, candidateName: string): number {
  let score = 0.3 // Base score for matching search

  const text = `${video.title} ${video.description}`.toLowerCase()
  const nameParts = candidateName.toLowerCase().split(' ')

  // Check if candidate name is in title (higher weight)
  if (nameParts.some((part) => video.title.toLowerCase().includes(part))) {
    score += 0.2
  }

  // Check if full name appears
  if (text.includes(candidateName.toLowerCase())) {
    score += 0.1
  }

  // Engagement bonus (log scale)
  if (video.viewCount > 1000) {
    score += Math.min(0.2, Math.log10(video.viewCount) / 30)
  }

  // Recent bonus
  const daysSincePublished =
    (Date.now() - new Date(video.publishedAt).getTime()) / (1000 * 60 * 60 * 24)
  if (daysSincePublished < 1) {
    score += 0.1
  } else if (daysSincePublished < 3) {
    score += 0.05
  }

  return Math.min(1, score)
}
