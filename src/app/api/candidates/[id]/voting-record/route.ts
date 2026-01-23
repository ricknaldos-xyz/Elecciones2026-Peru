import { NextRequest, NextResponse } from 'next/server'
import { getCandidateVotingSummary } from '@/lib/sync/congreso/votaciones'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const summary = await getCandidateVotingSummary(id)
    return NextResponse.json(summary)
  } catch (error) {
    console.error('Error fetching voting record:', error)
    return NextResponse.json(
      { error: 'Failed to fetch voting record' },
      { status: 500 }
    )
  }
}
