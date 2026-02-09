import { NextRequest, NextResponse } from 'next/server'
import { getCandidateViabilityAnalysis } from '@/lib/sync/plans/viability-analyzer'
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
    const analysis = await getCandidateViabilityAnalysis(id)

    if (!analysis) {
      return NextResponse.json(null)
    }

    return NextResponse.json(analysis)
  } catch (error) {
    console.error('Error fetching plan viability:', error)
    return NextResponse.json(
      { error: 'Failed to fetch plan viability analysis' },
      { status: 500 }
    )
  }
}
