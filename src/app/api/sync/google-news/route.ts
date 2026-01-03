import { NextRequest, NextResponse } from 'next/server'
import { syncGoogleNews } from '@/lib/sync/google-news/fetcher'

export const runtime = 'nodejs'
export const maxDuration = 300

/**
 * Google News sync endpoint
 * Fetches news via Google News RSS feeds
 *
 * Schedule: every 2 hours, 30 min offset (30 *​/2 * * *)
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
    const result = await syncGoogleNews()

    return NextResponse.json({
      success: result.success,
      itemsFound: result.itemsFound,
      itemsSaved: result.itemsSaved,
      errors: result.errors,
    })
  } catch (error) {
    console.error('Google News sync error:', error)
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
