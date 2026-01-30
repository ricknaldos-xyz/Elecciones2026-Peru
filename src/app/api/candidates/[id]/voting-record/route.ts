import { NextRequest, NextResponse } from 'next/server'
import { getCandidateVotingSummary } from '@/lib/sync/congreso/votaciones'
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
    const summary = await getCandidateVotingSummary(id)
    return NextResponse.json(summary)
  } catch (error) {
    console.error('Error fetching voting record:', error)
    return NextResponse.json(
      { error: 'Failed to fetch voting record' },
      { status: 500 }
    )
  }
}
