import { NextRequest, NextResponse } from 'next/server'
import { getPartyFinanceSummary, getPartyFinances } from '@/lib/db/queries'

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
    const summary = searchParams.get('summary') === 'true'

    if (summary) {
      const financeSummary = await getPartyFinanceSummary(id)
      if (!financeSummary) {
        return NextResponse.json(
          { error: 'Party not found' },
          { status: 404 }
        )
      }
      return NextResponse.json(financeSummary)
    }

    const finances = await getPartyFinances(id, year ? parseInt(year, 10) : undefined)
    return NextResponse.json(finances)
  } catch (error) {
    console.error('Error fetching party finances:', error)
    return NextResponse.json(
      { error: 'Error fetching party finances' },
      { status: 500 }
    )
  }
}
