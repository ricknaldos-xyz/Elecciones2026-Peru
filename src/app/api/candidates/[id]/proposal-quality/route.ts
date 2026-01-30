import { NextRequest, NextResponse } from 'next/server'
import { getCandidateProposalQuality } from '@/lib/sync/plans/evaluator'
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
