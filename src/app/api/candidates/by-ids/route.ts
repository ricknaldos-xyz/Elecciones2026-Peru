import { NextRequest, NextResponse } from 'next/server'
import { getCandidatesByIds } from '@/lib/db/queries'
import { candidateByIdsSchema } from '@/lib/validation/schemas'
import { parseSearchParams } from '@/lib/validation/helpers'

export const dynamic = 'force-dynamic'
export const revalidate = 600

export async function GET(request: NextRequest) {
  try {
    const parsed = parseSearchParams(request, candidateByIdsSchema)
    if (!parsed.success) {
      return NextResponse.json([])
    }

    const { ids } = parsed.data
    const candidates = await getCandidatesByIds(ids)
    return NextResponse.json(candidates)
  } catch (error) {
    console.error('Error fetching candidates by ids:', error)
    return NextResponse.json(
      { error: 'Error fetching candidates' },
      { status: 500 }
    )
  }
}
