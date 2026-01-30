import { NextRequest, NextResponse } from 'next/server'
import { getCandidateJudicialDiscrepancy } from '@/lib/sync/judicial/scraper'
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
    const discrepancy = await getCandidateJudicialDiscrepancy(id)

    if (!discrepancy) {
      return NextResponse.json({
        hasDiscrepancy: false,
        severity: 'none',
        undeclaredCount: 0,
        details: [],
        integrityPenalty: 0,
      })
    }

    return NextResponse.json(discrepancy)
  } catch (error) {
    console.error('Error fetching judicial verification:', error)
    return NextResponse.json(
      { error: 'Failed to fetch judicial verification' },
      { status: 500 }
    )
  }
}
