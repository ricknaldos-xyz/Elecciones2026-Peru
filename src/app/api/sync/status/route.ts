import { NextRequest, NextResponse } from 'next/server'
import { getLatestSyncStatus, getAllSyncLogs, SyncSource, SyncStatus } from '@/lib/sync/logger'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const source = searchParams.get('source') as SyncSource | null
    const status = searchParams.get('status') as SyncStatus | null
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const detailed = searchParams.get('detailed') === 'true'

    if (detailed) {
      // Return detailed logs with pagination
      const { logs, total } = await getAllSyncLogs({
        source: source || undefined,
        status: status || undefined,
        limit,
        offset,
      })

      return NextResponse.json({
        logs,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      })
    }

    // Return latest status for each source
    const latestStatus = await getLatestSyncStatus()

    // Format for easy consumption
    const statusBySource: Record<string, unknown> = {}
    for (const entry of latestStatus) {
      statusBySource[entry.source] = {
        status: entry.status,
        records_processed: entry.records_processed,
        records_updated: entry.records_updated,
        records_created: entry.records_created,
        records_skipped: entry.records_skipped,
        error_message: entry.error_message,
        started_at: entry.started_at,
        completed_at: entry.completed_at,
        duration_ms: entry.duration_ms,
      }
    }

    return NextResponse.json({
      sources: statusBySource,
      last_updated: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[API] Sync status error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
