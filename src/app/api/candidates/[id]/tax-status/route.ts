import { NextRequest, NextResponse } from 'next/server'
import { getCandidateTaxSummary } from '@/lib/sync/sunat/scraper'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const summary = await getCandidateTaxSummary(id)
    return NextResponse.json(summary)
  } catch (error) {
    console.error('Error fetching tax status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tax status' },
      { status: 500 }
    )
  }
}
