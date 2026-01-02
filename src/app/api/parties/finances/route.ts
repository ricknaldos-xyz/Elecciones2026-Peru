import { NextResponse } from 'next/server'
import { getAllPartiesWithFinances } from '@/lib/db/queries'

export const dynamic = 'force-dynamic'
export const revalidate = 300 // Cache for 5 minutes

export async function GET() {
  try {
    const partiesWithFinances = await getAllPartiesWithFinances()
    return NextResponse.json(partiesWithFinances)
  } catch (error) {
    console.error('Error fetching parties with finances:', error)
    return NextResponse.json(
      { error: 'Error fetching parties with finances' },
      { status: 500 }
    )
  }
}
