import { NextRequest, NextResponse } from 'next/server'
import { getCandidatePerformanceSummary } from '@/lib/sync/mef/ejecucion'
import { candidateIdParamSchema } from '@/lib/validation/schemas'
import { parseParams } from '@/lib/validation/helpers'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const parsed = parseParams(await params, candidateIdParamSchema)
    if (!parsed.success) return parsed.response
    const { id } = parsed.data
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
