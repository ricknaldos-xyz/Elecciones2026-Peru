import { NextRequest, NextResponse } from 'next/server'
import { syncTwitter, checkNitterHealth } from '@/lib/sync/twitter/scraper'
import { verifySyncAuth } from '@/lib/sync/auth'

export const runtime = 'nodejs'
export const maxDuration = 300

/**
 * Twitter sync endpoint via Nitter
 * Uses Nitter instances to fetch tweets without Twitter API
 *
 * Schedule: every 6 hours, 30 min offset (30 *​/6 * * *)
 */
export async function GET(request: NextRequest) {
  const authError = verifySyncAuth(request)
  if (authError) return authError

  // Check if this is a health check request
  const url = new URL(request.url)
  if (url.searchParams.get('health') === 'true') {
    const health = await checkNitterHealth()
    return NextResponse.json(health)
  }

  try {
    const result = await syncTwitter()

    return NextResponse.json({
      success: result.success,
      tweetsFound: result.tweetsFound,
      tweetsSaved: result.tweetsSaved,
      instancesDown: result.instancesDown,
      errors: result.errors,
    })
  } catch (error) {
    console.error('Twitter sync error:', error)
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
