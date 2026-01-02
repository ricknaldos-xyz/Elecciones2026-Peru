import { NextRequest, NextResponse } from 'next/server'
import { getCandidatesByIds } from '@/lib/db/queries'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const idsParam = searchParams.get('ids')

    if (!idsParam) {
      return NextResponse.json([])
    }

    const ids = idsParam.split(',').filter(Boolean)

    if (ids.length === 0) {
      return NextResponse.json([])
    }

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
