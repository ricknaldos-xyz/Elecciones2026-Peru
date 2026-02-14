import { NextRequest, NextResponse } from 'next/server'
import { getCandidates } from '@/lib/db/queries'
import { candidatesQuerySchema } from '@/lib/validation/schemas'
import { parseSearchParams } from '@/lib/validation/helpers'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

const RATE_LIMIT = { name: 'candidates-api', max: 60, windowSec: 60 }

export const dynamic = 'force-dynamic'
export const revalidate = 600

export async function GET(request: NextRequest) {
  try {
    const { limited } = checkRateLimit(getClientIp(request), RATE_LIMIT)
    if (limited) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      )
    }
    const parsed = parseSearchParams(request, candidatesQuerySchema)
    if (!parsed.success) return parsed.response

    const { cargo, distrito: districtSlug, partido: partyId, minConfidence, onlyClean, search, limit, offset } = parsed.data

    const candidates = await getCandidates({
      cargo,
      districtSlug,
      partyId,
      minConfidence,
      onlyClean,
      search,
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
