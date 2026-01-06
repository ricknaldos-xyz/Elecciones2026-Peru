import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

const CRON_SECRET = process.env.CRON_SECRET

// POST /api/admin/fix-news-sources - Fix existing news with Google News source
export async function POST(request: NextRequest) {
  // Validate authorization
  const authHeader = request.headers.get('authorization')
  const isValidToken = CRON_SECRET && authHeader === `Bearer ${CRON_SECRET}`

  if (!isValidToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Count records to fix (news.google.com or Google News)
    const countResult = await sql`
      SELECT COUNT(*) as count
      FROM news_mentions
      WHERE source LIKE '%google%' OR source = 'news.google.com'
    `
    const totalToFix = parseInt(countResult[0]?.count || '0')

    // Update records: extract source from title (after last " - ")
    // Use SUBSTRING with regex pattern for PostgreSQL
    const updateResult = await sql`
      UPDATE news_mentions
      SET
        source = TRIM(SUBSTRING(title FROM ' - ([^-]+)$')),
        title = TRIM(REGEXP_REPLACE(title, ' - [^-]+$', ''))
      WHERE (source LIKE '%google%' OR source = 'news.google.com')
      AND title ~ ' - [^-]+$'
      AND SUBSTRING(title FROM ' - ([^-]+)$') IS NOT NULL
    `

    // Count remaining (couldn't extract source from title)
    const remainingResult = await sql`
      SELECT COUNT(*) as count
      FROM news_mentions
      WHERE source LIKE '%google%' OR source = 'news.google.com'
    `
    const remaining = parseInt(remainingResult[0]?.count || '0')

    return NextResponse.json({
      success: true,
      message: 'News sources fixed',
      stats: {
        totalToFix,
        fixed: totalToFix - remaining,
        remaining,
      },
    })
  } catch (error) {
    console.error('Error fixing news sources:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// GET - Show stats without modifying
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const isValidToken = CRON_SECRET && authHeader === `Bearer ${CRON_SECRET}`

  if (!isValidToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await sql`
      SELECT source, COUNT(*) as count
      FROM news_mentions
      GROUP BY source
      ORDER BY count DESC
      LIMIT 20
    `

    return NextResponse.json({
      sources: result,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
