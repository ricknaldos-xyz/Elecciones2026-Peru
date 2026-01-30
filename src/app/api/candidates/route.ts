import { NextRequest, NextResponse } from 'next/server'
import { getCandidates } from '@/lib/db/queries'
import { candidatesQuerySchema } from '@/lib/validation/schemas'
import { parseSearchParams } from '@/lib/validation/helpers'

export const dynamic = 'force-dynamic'
export const revalidate = 600

export async function GET(request: NextRequest) {
  try {
    const parsed = parseSearchParams(request, candidatesQuerySchema)
    if (!parsed.success) return parsed.response

    const { cargo, distrito: districtSlug, partido: partyId, minConfidence, onlyClean, limit, offset } = parsed.data

    const candidates = await getCandidates({
      cargo,
      districtSlug,
      partyId,
      minConfidence,
      onlyClean,
      limit,
      offset,
    })

    return NextResponse.json(candidates)
  } catch (error) {
    console.error('Error fetching candidates:', error)
    return NextResponse.json(
      { error: 'Error fetching candidates' },
      { status: 500 }
    )
  }
}
