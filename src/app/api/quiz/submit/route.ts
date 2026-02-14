import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { cookies } from 'next/headers'
import { quizSubmitSchema } from '@/lib/validation/schemas'
import { parseBody } from '@/lib/validation/helpers'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

const RATE_LIMIT = { name: 'quiz-submit', max: 10, windowSec: 60 }

export async function POST(request: NextRequest) {
  try {
    const { limited } = checkRateLimit(getClientIp(request), RATE_LIMIT)
    if (limited) {
      return NextResponse.json(
        { error: 'Demasiadas solicitudes. Intenta de nuevo en un minuto.' },
        { status: 429 }
      )
    }
    const parsed = await parseBody(request, quizSubmitSchema)
    if (!parsed.success) return parsed.response

    const { answers, matches } = parsed.data

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
