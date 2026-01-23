import { NextRequest, NextResponse } from 'next/server'
import { syncCandidateCompanies } from '@/lib/sync/empresas/sunarp'
import { syncIndecopiComplaints } from '@/lib/sync/empresas/indecopi'
import { syncSunafilViolations } from '@/lib/sync/empresas/sunafil'
import { syncOefaViolations } from '@/lib/sync/empresas/oefa'

const CRON_SECRET = process.env.CRON_SECRET

export const maxDuration = 600 // 10 minutes timeout for multiple syncs
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

    // Check which syncs to run
    const url = new URL(request.url)
    const syncType = url.searchParams.get('type') || 'all'

    const results: Record<string, unknown> = {}

    console.log(`[API] Starting empresas sync (type: ${syncType})...`)

    // Run syncs based on type parameter
    if (syncType === 'all' || syncType === 'sunarp') {
      console.log('[API] Running SUNARP company linkage sync...')
      try {
        results.sunarp = await syncCandidateCompanies()
      } catch (error) {
        results.sunarp = { error: error instanceof Error ? error.message : 'Unknown error' }
      }
    }

    if (syncType === 'all' || syncType === 'indecopi') {
      console.log('[API] Running INDECOPI complaints sync...')
      try {
        results.indecopi = await syncIndecopiComplaints()
      } catch (error) {
        results.indecopi = { error: error instanceof Error ? error.message : 'Unknown error' }
      }
    }

    if (syncType === 'all' || syncType === 'sunafil') {
      console.log('[API] Running SUNAFIL violations sync...')
      try {
        results.sunafil = await syncSunafilViolations()
      } catch (error) {
        results.sunafil = { error: error instanceof Error ? error.message : 'Unknown error' }
      }
    }

    if (syncType === 'all' || syncType === 'oefa') {
      console.log('[API] Running OEFA environmental violations sync...')
      try {
        results.oefa = await syncOefaViolations()
      } catch (error) {
        results.oefa = { error: error instanceof Error ? error.message : 'Unknown error' }
      }
    }

    return NextResponse.json({
      success: true,
      source: 'empresas',
      syncType,
      results,
    })
  } catch (error) {
    console.error('[API] Empresas sync error:', error)
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
