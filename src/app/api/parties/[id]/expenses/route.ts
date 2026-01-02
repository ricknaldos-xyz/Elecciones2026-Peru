import { NextRequest, NextResponse } from 'next/server'
import { getPartyExpenses, getPartyExpensesByCategory } from '@/lib/db/queries'

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
    const category = searchParams.get('category')
    const limit = searchParams.get('limit')
    const offset = searchParams.get('offset')
    const grouped = searchParams.get('grouped') === 'true'

    // If grouped, return expenses aggregated by category
    if (grouped) {
      const byCategory = await getPartyExpensesByCategory(
        id,
        year ? parseInt(year, 10) : undefined
      )
      return NextResponse.json(byCategory)
    }

    // Otherwise return individual expenses
    const expenses = await getPartyExpenses(id, {
      year: year ? parseInt(year, 10) : undefined,
      category: category || undefined,
      limit: limit ? parseInt(limit, 10) : 50,
      offset: offset ? parseInt(offset, 10) : 0,
    })

    return NextResponse.json(expenses)
  } catch (error) {
    console.error('Error fetching party expenses:', error)
    return NextResponse.json(
      { error: 'Error fetching party expenses' },
      { status: 500 }
    )
  }
}
