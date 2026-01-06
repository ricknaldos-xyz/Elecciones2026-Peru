import { NextRequest, NextResponse } from 'next/server'
import { processAllPlans, extractCandidatePlan } from '@/lib/sync/plans/extractor'

const CRON_SECRET = process.env.CRON_SECRET

/**
 * POST /api/sync/plans - Extract proposals from government plans
 *
 * Query params:
 * - candidateId: Process single candidate (optional)
 *
 * Authorization: Bearer token or cron secret
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authorization
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!CRON_SECRET || token !== CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const candidateId = request.nextUrl.searchParams.get('candidateId')

    if (candidateId) {
      // Process single candidate
      console.log(`Processing single candidate: ${candidateId}`)
      const result = await extractCandidatePlan(candidateId)

      return NextResponse.json({
        success: result.success,
        candidateId,
        proposalsExtracted: result.proposals.length,
        error: result.error,
      })
    }

    // Process all candidates with government plans
    console.log('Processing all government plans...')
    const result = await processAllPlans()

    return NextResponse.json({
      success: true,
      processed: result.processed,
      succeeded: result.succeeded,
      failed: result.failed,
      totalProposals: result.totalProposals,
    })
  } catch (error) {
    console.error('Error processing government plans:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/sync/plans - Get sync status
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/sync/plans',
    description: 'Extract proposals from government plan PDFs using AI',
    methods: {
      POST: {
        description: 'Trigger extraction',
        params: {
          candidateId: 'Optional - process single candidate',
        },
        authorization: 'Bearer CRON_SECRET',
      },
    },
  })
}
