import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { candidateIdParamSchema } from '@/lib/validation/schemas'
import { parseParams } from '@/lib/validation/helpers'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const parsed = parseParams(await params, candidateIdParamSchema)
    if (!parsed.success) return parsed.response
    const { id } = parsed.data

    // Get aggregate stats
    const statsRows = await sql`
      SELECT
        COUNT(*)::int as total_mentions,
        COUNT(*) FILTER (WHERE platform = 'twitter')::int as twitter_mentions,
        COUNT(*) FILTER (WHERE platform = 'tiktok')::int as tiktok_mentions,
        COUNT(*) FILTER (WHERE platform = 'youtube')::int as youtube_mentions,
        COUNT(*) FILTER (WHERE sentiment = 'positive')::int as positive_mentions,
        COUNT(*) FILTER (WHERE sentiment = 'negative')::int as negative_mentions,
        COUNT(*) FILTER (WHERE sentiment = 'neutral')::int as neutral_mentions,
        COALESCE(SUM(engagement_total), 0)::int as total_engagement,
        COALESCE(SUM(view_count), 0)::int as total_views
      FROM social_mentions
      WHERE candidate_id = ${id}::uuid
    `

    const stats = statsRows[0] || {
      total_mentions: 0,
      twitter_mentions: 0,
      tiktok_mentions: 0,
      youtube_mentions: 0,
      positive_mentions: 0,
      negative_mentions: 0,
      neutral_mentions: 0,
      total_engagement: 0,
      total_views: 0,
    }

    if (Number(stats.total_mentions) === 0) {
      return NextResponse.json({ stats, mentions: [] })
    }

    // Get top mentions by engagement
    const mentions = await sql`
      SELECT
        platform, author_handle, author_name, content, url,
        like_count, comment_count, share_count, view_count,
        engagement_total, sentiment, ai_summary, published_at
      FROM social_mentions
      WHERE candidate_id = ${id}::uuid
      ORDER BY engagement_total DESC
      LIMIT 10
    `

    return NextResponse.json({ stats, mentions })
  } catch (error) {
    console.error('Error fetching social mentions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch social mentions' },
      { status: 500 }
    )
  }
}
