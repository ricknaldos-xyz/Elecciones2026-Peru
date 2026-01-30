import { NextRequest, NextResponse } from 'next/server'
import { syncTikTok } from '@/lib/sync/tiktok/scraper'
import { verifySyncAuth } from '@/lib/sync/auth'

export const runtime = 'nodejs'
export const maxDuration = 300

/**
 * TikTok sync endpoint (EXPERIMENTAL)
 * Attempts to scrape TikTok videos - may fail due to anti-bot measures
 *
 * Schedule: every 6 hours (0 *​/6 * * *)
 */
export async function GET(request: NextRequest) {
  const authError = verifySyncAuth(request)
  if (authError) return authError

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
