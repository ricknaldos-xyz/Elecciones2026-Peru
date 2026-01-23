import { NextRequest, NextResponse } from 'next/server'
import { getCandidateProposalQuality } from '@/lib/sync/plans/evaluator'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const quality = await getCandidateProposalQuality(id)
    return NextResponse.json(quality)
  } catch (error) {
    console.error('Error fetching proposal quality:', error)
    return NextResponse.json(
      { error: 'Failed to fetch proposal quality' },
      { status: 500 }
    )
  }
}
