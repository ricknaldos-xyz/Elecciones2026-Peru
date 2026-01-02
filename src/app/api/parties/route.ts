import { NextResponse } from 'next/server'
import { getParties } from '@/lib/db/queries'

export async function GET() {
  try {
    const parties = await getParties()
    return NextResponse.json(parties)
  } catch (error) {
    console.error('Error fetching parties:', error)
    return NextResponse.json(
      { error: 'Error fetching parties' },
      { status: 500 }
    )
  }
}
