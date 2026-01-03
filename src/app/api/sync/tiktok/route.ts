import { NextRequest, NextResponse } from 'next/server'
import { syncTikTok } from '@/lib/sync/tiktok/scraper'

export const runtime = 'nodejs'
export const maxDuration = 300

/**
 * TikTok sync endpoint (EXPERIMENTAL)
 * Attempts to scrape TikTok videos - may fail due to anti-bot measures
 *
 * Schedule: every 6 hours (0 *​/6 * * *)
 */
export async function GET(request: NextRequest) {
  // Verify authorization
  const isVercelCron = request.headers.get('x-vercel-cron') === '1'
  const authHeader = request.headers.get('authorization')
  const isAuthorized =
    isVercelCron ||
    authHeader === `Bearer ${process.env.CRON_SECRET}`

  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await syncTikTok()

    return NextResponse.json({
      success: result.success,
      videosFound: result.videosFound,
      videosSaved: result.videosSaved,
      blocked: result.blocked,
      errors: result.errors,
      warning: result.blocked
        ? 'TikTok is blocking requests. Consider using a paid service like Apify.'
        : undefined,
    })
  } catch (error) {
    console.error('TikTok sync error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  return GET(request)
}
