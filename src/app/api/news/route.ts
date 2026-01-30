import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const revalidate = 300 // 5 minutes cache

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Pagination
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50)
    const offset = (page - 1) * limit

    // Filters
    const candidateSlug = searchParams.get('candidato') || null
    const source = searchParams.get('fuente') || null
    const sentiment = searchParams.get('sentimiento') || null
    const search = searchParams.get('q') || null
    const searchPattern = search ? `%${search}%` : null

    // Only show news linked to candidates or parties
    const news = await sql`
      SELECT id, title, url, excerpt, source, published_at, sentiment,
             relevance_score, keywords, candidate_name, candidate_slug,
             candidate_cargo, party_name, party_short_name
      FROM news_mentions_enriched
      WHERE (candidate_name IS NOT NULL OR party_name IS NOT NULL)
        AND (${candidateSlug}::text IS NULL OR candidate_slug = ${candidateSlug})
        AND (${source}::text IS NULL OR source = ${source})
        AND (${sentiment}::text IS NULL OR sentiment = ${sentiment})
        AND (${searchPattern}::text IS NULL OR title ILIKE ${searchPattern} OR excerpt ILIKE ${searchPattern})
      ORDER BY published_at DESC NULLS LAST, created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `

    const countResult = await sql`
      SELECT COUNT(*) as total
      FROM news_mentions_enriched
      WHERE (candidate_name IS NOT NULL OR party_name IS NOT NULL)
        AND (${candidateSlug}::text IS NULL OR candidate_slug = ${candidateSlug})
        AND (${source}::text IS NULL OR source = ${source})
        AND (${sentiment}::text IS NULL OR sentiment = ${sentiment})
        AND (${searchPattern}::text IS NULL OR title ILIKE ${searchPattern} OR excerpt ILIKE ${searchPattern})
    `

    const total = parseInt(countResult[0]?.total || '0', 10)

    // Get available sources for filters (only from candidate-linked news)
    const sourcesResult = await sql`
      SELECT DISTINCT source, COUNT(*) as count
      FROM news_mentions
      WHERE candidate_id IS NOT NULL
      GROUP BY source
      ORDER BY count DESC
    `

    return NextResponse.json({
      news,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: offset + news.length < total,
      },
      filters: {
        sources: sourcesResult.map((s: any) => ({
          name: s.source,
          count: parseInt(s.count, 10),
        })),
        sentiments: ['positive', 'neutral', 'negative'],
      },
    })
  } catch (error) {
    console.error('Error fetching news:', error)
    return NextResponse.json(
      { error: 'Error al obtener noticias' },
      { status: 500 }
    )
  }
}
