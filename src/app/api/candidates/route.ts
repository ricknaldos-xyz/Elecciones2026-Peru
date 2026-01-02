import { NextRequest, NextResponse } from 'next/server'
import { getCandidates } from '@/lib/db/queries'
import type { CargoType } from '@/types/database'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const cargo = searchParams.get('cargo') as CargoType | undefined
    const districtSlug = searchParams.get('distrito') || undefined
    const partyId = searchParams.get('partido') || undefined
    const minConfidence = searchParams.get('minConfidence')
      ? parseInt(searchParams.get('minConfidence')!, 10)
      : undefined
    const onlyClean = searchParams.get('onlyClean') === 'true'
    const limit = searchParams.get('limit')
      ? parseInt(searchParams.get('limit')!, 10)
      : undefined
    const offset = searchParams.get('offset')
      ? parseInt(searchParams.get('offset')!, 10)
      : undefined

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
