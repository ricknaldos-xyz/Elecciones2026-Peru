import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { cookies } from 'next/headers'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

const RATE_LIMIT = { name: 'share-analytics', max: 30, windowSec: 60 }

export async function POST(request: NextRequest) {
  try {
    const { limited } = checkRateLimit(getClientIp(request), RATE_LIMIT)
    if (limited) {
      return NextResponse.json({ success: true }) // silent fail for analytics
    }
    const body = await request.json()
    const { platform, url, contentType = 'page', contentId } = body

    // Get or create session ID
    const cookieStore = await cookies()
    let sessionId = cookieStore.get('session_id')?.value

    if (!sessionId) {
      sessionId = crypto.randomUUID()
    }

    await sql`
      INSERT INTO share_events (
        session_id,
        share_type,
        share_platform,
        content_id
      ) VALUES (
        ${sessionId},
        ${contentType},
        ${platform},
        ${contentId || url}
      )
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error tracking share:', error)
    // Don't fail the share action due to analytics
    return NextResponse.json({ success: true })
  }
}
