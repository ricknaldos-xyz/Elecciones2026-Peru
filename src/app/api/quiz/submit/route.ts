import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { answers, matches } = body

    // Get or create session ID
    const cookieStore = await cookies()
    let sessionId = cookieStore.get('session_id')?.value

    if (!sessionId) {
      sessionId = crypto.randomUUID()
    }

    // Extract top 3 matches for storage
    const topMatches = matches.slice(0, 3).map((m: { candidateSlug: string; candidateName: string; matchPercentage: number }) => ({
      candidate_slug: m.candidateSlug,
      candidate_name: m.candidateName,
      match_percentage: m.matchPercentage,
    }))

    // Save quiz response
    const result = await sql`
      INSERT INTO quiz_responses (
        session_id,
        answers,
        top_matches
      ) VALUES (
        ${sessionId},
        ${JSON.stringify(answers)},
        ${JSON.stringify(topMatches)}
      )
      RETURNING id
    `

    return NextResponse.json({
      success: true,
      id: result[0].id,
    })
  } catch (error) {
    console.error('Error saving quiz response:', error)
    return NextResponse.json(
      { error: 'Failed to save quiz response' },
      { status: 500 }
    )
  }
}
