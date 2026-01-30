import { NextRequest, NextResponse } from 'next/server'
import { syncYouTube } from '@/lib/sync/youtube/fetcher'
import { verifySyncAuth } from '@/lib/sync/auth'

export const runtime = 'nodejs'
export const maxDuration = 300

/**
 * YouTube sync endpoint
 * Fetches videos and comments related to candidates
 *
 * Schedule: every 4 hours (0 *​/4 * * *)
 */
export async function GET(request: NextRequest) {
  const authError = verifySyncAuth(request)
  if (authError) return authError

  try {
    const result = await syncYouTube()

    return NextResponse.json({
      success: result.success,
      videosFound: result.videosFound,
      videosSaved: result.videosSaved,
      errors: result.errors,
    })
  } catch (error) {
    console.error('YouTube sync error:', error)
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
