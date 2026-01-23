import { NextRequest, NextResponse } from 'next/server'
import { getCandidatePerformanceSummary } from '@/lib/sync/mef/ejecucion'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const summary = await getCandidatePerformanceSummary(id)

    if (!summary) {
      return NextResponse.json({ isIncumbent: false })
    }

    return NextResponse.json(summary)
  } catch (error) {
    console.error('Error fetching performance data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch performance data' },
      { status: 500 }
    )
  }
}
