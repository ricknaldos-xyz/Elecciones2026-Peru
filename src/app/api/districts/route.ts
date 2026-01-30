import { NextResponse } from 'next/server'
import { getDistricts } from '@/lib/db/queries'

export const revalidate = 3600

export async function GET() {
  try {
    const districts = await getDistricts()
    return NextResponse.json(districts)
  } catch (error) {
    console.error('Error fetching districts:', error)
    return NextResponse.json(
      { error: 'Error fetching districts' },
      { status: 500 }
    )
  }
}
