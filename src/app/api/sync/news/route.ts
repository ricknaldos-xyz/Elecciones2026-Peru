import { NextRequest, NextResponse } from 'next/server'
import { syncNews } from '@/lib/sync/news/rss-fetcher'
import { verifySyncAuth } from '@/lib/sync/auth'

export const maxDuration = 300 // 5 minutes timeout
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const authError = verifySyncAuth(request)
    if (authError) return authError
    const result = await syncNews()

    return NextResponse.json({
      success: true,
      source: 'news',
      ...result,
    })
  } catch (error) {
    console.error('[API] News sync error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  return POST(request)
}
