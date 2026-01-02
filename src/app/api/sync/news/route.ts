import { NextRequest, NextResponse } from 'next/server'
import { syncNews } from '@/lib/sync/news/rss-fetcher'

const CRON_SECRET = process.env.CRON_SECRET

export const maxDuration = 300 // 5 minutes timeout
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Verify authorization
    const authHeader = request.headers.get('authorization')
    const cronHeader = request.headers.get('x-vercel-cron')

    const isVercelCron = cronHeader === '1'
    const isValidToken =
      CRON_SECRET && authHeader === `Bearer ${CRON_SECRET}`

    if (!isVercelCron && !isValidToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('[API] Starting News sync...')
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
