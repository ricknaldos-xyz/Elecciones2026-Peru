import { NextRequest, NextResponse } from 'next/server'
import { syncPlanViability, analyzeGovernmentPlan } from '@/lib/sync/plans/viability-analyzer'

const CRON_SECRET = process.env.CRON_SECRET

/**
 * POST /api/sync/plan-viability - Run holistic viability analysis on government plans
 *
 * Query params:
 * - candidateId: Process single candidate (optional)
 *
 * Authorization: Bearer token (CRON_SECRET)
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!CRON_SECRET || token !== CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const candidateId = request.nextUrl.searchParams.get('candidateId')

    if (candidateId) {
      console.log(`[PlanViability] Processing single candidate: ${candidateId}`)
      const result = await analyzeGovernmentPlan(candidateId)

      return NextResponse.json({
        success: result.success,
        candidateId,
        error: result.error,
      })
    }

    console.log('[PlanViability] Processing all presidential candidates...')
    const result = await syncPlanViability()

    return NextResponse.json({
      success: true,
      processed: result.records_processed,
      succeeded: result.records_updated,
      failed: result.records_skipped,
    })
  } catch (error) {
    console.error('Error running plan viability analysis:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/sync/plan-viability - Endpoint documentation
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/sync/plan-viability',
    description:
      'Run holistic AI viability analysis on presidential government plans (fiscal, legal, coherence, historical)',
    methods: {
      POST: {
        description: 'Trigger analysis for all or single candidate',
        params: {
          candidateId: 'Optional - process single candidate UUID',
        },
        authorization: 'Bearer CRON_SECRET',
      },
    },
  })
}
