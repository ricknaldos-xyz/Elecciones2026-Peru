import { NextRequest, NextResponse } from 'next/server'
import { getPartyDonors } from '@/lib/db/queries'

export const dynamic = 'force-dynamic'
export const revalidate = 300 // Cache for 5 minutes

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const searchParams = request.nextUrl.searchParams
    const year = searchParams.get('year')
    const limit = searchParams.get('limit')
    const offset = searchParams.get('offset')

    const donors = await getPartyDonors(id, {
      year: year ? parseInt(year, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : 50,
      offset: offset ? parseInt(offset, 10) : 0,
    })

    return NextResponse.json(donors)
  } catch (error) {
    console.error('Error fetching party donors:', error)
    return NextResponse.json(
      { error: 'Error fetching party donors' },
      { status: 500 }
    )
  }
}
