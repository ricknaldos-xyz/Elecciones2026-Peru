import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const revalidate = 300

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '5', 10), 10)

    // Get most recent news with high relevance, prioritizing those with candidates
    const trending = await sql`
      SELECT
        id,
        title,
        url,
        excerpt,
        source,
        published_at,
        sentiment,
        relevance_score,
        candidate_name,
        candidate_slug,
        candidate_cargo,
        party_name,
        party_short_name
      FROM news_mentions_enriched
      WHERE published_at > NOW() - INTERVAL '7 days'
        AND candidate_name IS NOT NULL
      ORDER BY
        relevance_score DESC NULLS LAST,
        published_at DESC NULLS LAST
      LIMIT ${limit}
    `

    // Get news distribution by source (last 24h)
    const sourceDistribution = await sql`
      SELECT source, COUNT(*) as count
      FROM news_mentions
      WHERE published_at > NOW() - INTERVAL '24 hours'
      GROUP BY source
      ORDER BY count DESC
      LIMIT 5
    `

    // Get news count by candidate (last 7 days)
    const candidateActivity = await sql`
      SELECT
        candidate_name,
        candidate_slug,
        COUNT(*) as news_count,
        SUM(CASE WHEN sentiment = 'positive' THEN 1 ELSE 0 END) as positive,
        SUM(CASE WHEN sentiment = 'negative' THEN 1 ELSE 0 END) as negative
      FROM news_mentions_enriched
      WHERE
        candidate_name IS NOT NULL
        AND published_at > NOW() - INTERVAL '7 days'
      GROUP BY candidate_name, candidate_slug
      ORDER BY news_count DESC
      LIMIT 5
    `

    return NextResponse.json({
      trending,
      stats: {
        sourceDistribution,
        candidateActivity,
      },
    })
  } catch (error) {
    console.error('Error fetching trending news:', error)
    return NextResponse.json(
      { error: 'Error al obtener noticias trending' },
      { status: 500 }
    )
  }
}
