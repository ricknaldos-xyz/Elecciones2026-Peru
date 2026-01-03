import { NextRequest, NextResponse } from 'next/server'
import { processAIQueue, queueForAnalysis } from '@/lib/sync/ai/analyzer'

export const runtime = 'nodejs'
export const maxDuration = 300

/**
 * AI Analysis endpoint
 * Processes items in the AI analysis queue using Claude API
 *
 * Schedule: every 4 hours, 30 min offset (30 *​/4 * * *)
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

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({
      success: false,
      error: 'ANTHROPIC_API_KEY not configured',
    })
  }

  try {
    const result = await processAIQueue()

    return NextResponse.json({
      success: true,
      processed: result.processed,
      succeeded: result.succeeded,
      failed: result.failed,
    })
  } catch (error) {
    console.error('AI Analysis sync error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * POST: Manually queue an item for AI analysis
 */
export async function POST(request: NextRequest) {
  // Verify authorization
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { sourceType, sourceId, priority } = body

    if (!sourceType || !sourceId) {
      return NextResponse.json(
        { error: 'sourceType and sourceId are required' },
        { status: 400 }
      )
    }

    if (!['social_mention', 'news_mention'].includes(sourceType)) {
      return NextResponse.json(
        { error: 'Invalid sourceType' },
        { status: 400 }
      )
    }

    await queueForAnalysis(sourceType, sourceId, priority || 5)

    return NextResponse.json({
      success: true,
      message: `Queued ${sourceType} ${sourceId} for AI analysis`,
    })
  } catch (error) {
    console.error('AI Queue error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
