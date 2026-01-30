import { NextRequest, NextResponse } from 'next/server'
import { enrichCandidates, enrichWithFallbackPhotos } from '@/lib/sync/jne/candidate-enricher'
import { verifySyncAuth } from '@/lib/sync/auth'

export const runtime = 'nodejs'
export const maxDuration = 300

/**
 * JNE Candidate Enrichment endpoint
 * Fetches additional data (photos, JNE IDs, DJHV URLs) for candidates
 */
export async function GET(request: NextRequest) {
  const authError = verifySyncAuth(request)
  if (authError) return authError

  const mode = request.nextUrl.searchParams.get('mode') || 'jne'

  try {
    if (mode === 'fallback') {
      // Use fallback Wikipedia photos
      const result = await enrichWithFallbackPhotos()
      return NextResponse.json({
        success: true,
        mode: 'fallback',
        ...result,
      })
    }

    // Default: try JNE scraping
    const result = await enrichCandidates()

    return NextResponse.json({
      success: true,
      mode: 'jne',
      processed: result.processed,
      enriched: result.enriched,
      failed: result.failed,
      results: result.results.map((r) => ({
        slug: r.slug,
        success: r.success,
        hasPhoto: !!r.photoUrl,
        hasJneId: !!r.jneId,
        error: r.error,
      })),
    })
  } catch (error) {
    console.error('JNE Enrich sync error:', error)
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
