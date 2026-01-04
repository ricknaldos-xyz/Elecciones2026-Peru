import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const revalidate = 300 // 5 minutes cache

interface NewsItem {
  id: string
  title: string
  url: string
  excerpt: string | null
  source: string
  published_at: string | null
  sentiment: string | null
  relevance_score: number | null
  keywords: string[] | null
  candidate_name: string | null
  candidate_slug: string | null
  candidate_cargo: string | null
  party_name: string | null
  party_short_name: string | null
}

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

    // Get news items with filters applied in template
    let news: NewsItem[]
    let countResult: { total: string }[]

    if (candidateSlug && source && sentiment && search) {
      // All filters
      const searchPattern = `%${search}%`
      news = await sql`
        SELECT id, title, url, excerpt, source, published_at, sentiment,
               relevance_score, keywords, candidate_name, candidate_slug,
               candidate_cargo, party_name, party_short_name
        FROM news_mentions_enriched
        WHERE candidate_slug = ${candidateSlug}
          AND source = ${source}
          AND sentiment = ${sentiment}
          AND (title ILIKE ${searchPattern} OR excerpt ILIKE ${searchPattern})
        ORDER BY published_at DESC NULLS LAST, created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      ` as NewsItem[]
      countResult = await sql`
        SELECT COUNT(*) as total FROM news_mentions_enriched
        WHERE candidate_slug = ${candidateSlug}
          AND source = ${source}
          AND sentiment = ${sentiment}
          AND (title ILIKE ${searchPattern} OR excerpt ILIKE ${searchPattern})
      ` as { total: string }[]
    } else if (candidateSlug && source && sentiment) {
      news = await sql`
        SELECT id, title, url, excerpt, source, published_at, sentiment,
               relevance_score, keywords, candidate_name, candidate_slug,
               candidate_cargo, party_name, party_short_name
        FROM news_mentions_enriched
        WHERE candidate_slug = ${candidateSlug}
          AND source = ${source}
          AND sentiment = ${sentiment}
        ORDER BY published_at DESC NULLS LAST, created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      ` as NewsItem[]
      countResult = await sql`
        SELECT COUNT(*) as total FROM news_mentions_enriched
        WHERE candidate_slug = ${candidateSlug}
          AND source = ${source}
          AND sentiment = ${sentiment}
      ` as { total: string }[]
    } else if (candidateSlug && source && search) {
      const searchPattern = `%${search}%`
      news = await sql`
        SELECT id, title, url, excerpt, source, published_at, sentiment,
               relevance_score, keywords, candidate_name, candidate_slug,
               candidate_cargo, party_name, party_short_name
        FROM news_mentions_enriched
        WHERE candidate_slug = ${candidateSlug}
          AND source = ${source}
          AND (title ILIKE ${searchPattern} OR excerpt ILIKE ${searchPattern})
        ORDER BY published_at DESC NULLS LAST, created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      ` as NewsItem[]
      countResult = await sql`
        SELECT COUNT(*) as total FROM news_mentions_enriched
        WHERE candidate_slug = ${candidateSlug}
          AND source = ${source}
          AND (title ILIKE ${searchPattern} OR excerpt ILIKE ${searchPattern})
      ` as { total: string }[]
    } else if (candidateSlug && sentiment && search) {
      const searchPattern = `%${search}%`
      news = await sql`
        SELECT id, title, url, excerpt, source, published_at, sentiment,
               relevance_score, keywords, candidate_name, candidate_slug,
               candidate_cargo, party_name, party_short_name
        FROM news_mentions_enriched
        WHERE candidate_slug = ${candidateSlug}
          AND sentiment = ${sentiment}
          AND (title ILIKE ${searchPattern} OR excerpt ILIKE ${searchPattern})
        ORDER BY published_at DESC NULLS LAST, created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      ` as NewsItem[]
      countResult = await sql`
        SELECT COUNT(*) as total FROM news_mentions_enriched
        WHERE candidate_slug = ${candidateSlug}
          AND sentiment = ${sentiment}
          AND (title ILIKE ${searchPattern} OR excerpt ILIKE ${searchPattern})
      ` as { total: string }[]
    } else if (source && sentiment && search) {
      const searchPattern = `%${search}%`
      news = await sql`
        SELECT id, title, url, excerpt, source, published_at, sentiment,
               relevance_score, keywords, candidate_name, candidate_slug,
               candidate_cargo, party_name, party_short_name
        FROM news_mentions_enriched
        WHERE source = ${source}
          AND sentiment = ${sentiment}
          AND (title ILIKE ${searchPattern} OR excerpt ILIKE ${searchPattern})
        ORDER BY published_at DESC NULLS LAST, created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      ` as NewsItem[]
      countResult = await sql`
        SELECT COUNT(*) as total FROM news_mentions_enriched
        WHERE source = ${source}
          AND sentiment = ${sentiment}
          AND (title ILIKE ${searchPattern} OR excerpt ILIKE ${searchPattern})
      ` as { total: string }[]
    } else if (candidateSlug && source) {
      news = await sql`
        SELECT id, title, url, excerpt, source, published_at, sentiment,
               relevance_score, keywords, candidate_name, candidate_slug,
               candidate_cargo, party_name, party_short_name
        FROM news_mentions_enriched
        WHERE candidate_slug = ${candidateSlug} AND source = ${source}
        ORDER BY published_at DESC NULLS LAST, created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      ` as NewsItem[]
      countResult = await sql`
        SELECT COUNT(*) as total FROM news_mentions_enriched
        WHERE candidate_slug = ${candidateSlug} AND source = ${source}
      ` as { total: string }[]
    } else if (candidateSlug && sentiment) {
      news = await sql`
        SELECT id, title, url, excerpt, source, published_at, sentiment,
               relevance_score, keywords, candidate_name, candidate_slug,
               candidate_cargo, party_name, party_short_name
        FROM news_mentions_enriched
        WHERE candidate_slug = ${candidateSlug} AND sentiment = ${sentiment}
        ORDER BY published_at DESC NULLS LAST, created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      ` as NewsItem[]
      countResult = await sql`
        SELECT COUNT(*) as total FROM news_mentions_enriched
        WHERE candidate_slug = ${candidateSlug} AND sentiment = ${sentiment}
      ` as { total: string }[]
    } else if (candidateSlug && search) {
      const searchPattern = `%${search}%`
      news = await sql`
        SELECT id, title, url, excerpt, source, published_at, sentiment,
               relevance_score, keywords, candidate_name, candidate_slug,
               candidate_cargo, party_name, party_short_name
        FROM news_mentions_enriched
        WHERE candidate_slug = ${candidateSlug}
          AND (title ILIKE ${searchPattern} OR excerpt ILIKE ${searchPattern})
        ORDER BY published_at DESC NULLS LAST, created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      ` as NewsItem[]
      countResult = await sql`
        SELECT COUNT(*) as total FROM news_mentions_enriched
        WHERE candidate_slug = ${candidateSlug}
          AND (title ILIKE ${searchPattern} OR excerpt ILIKE ${searchPattern})
      ` as { total: string }[]
    } else if (source && sentiment) {
      news = await sql`
        SELECT id, title, url, excerpt, source, published_at, sentiment,
               relevance_score, keywords, candidate_name, candidate_slug,
               candidate_cargo, party_name, party_short_name
        FROM news_mentions_enriched
        WHERE source = ${source} AND sentiment = ${sentiment}
        ORDER BY published_at DESC NULLS LAST, created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      ` as NewsItem[]
      countResult = await sql`
        SELECT COUNT(*) as total FROM news_mentions_enriched
        WHERE source = ${source} AND sentiment = ${sentiment}
      ` as { total: string }[]
    } else if (source && search) {
      const searchPattern = `%${search}%`
      news = await sql`
        SELECT id, title, url, excerpt, source, published_at, sentiment,
               relevance_score, keywords, candidate_name, candidate_slug,
               candidate_cargo, party_name, party_short_name
        FROM news_mentions_enriched
        WHERE source = ${source}
          AND (title ILIKE ${searchPattern} OR excerpt ILIKE ${searchPattern})
        ORDER BY published_at DESC NULLS LAST, created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      ` as NewsItem[]
      countResult = await sql`
        SELECT COUNT(*) as total FROM news_mentions_enriched
        WHERE source = ${source}
          AND (title ILIKE ${searchPattern} OR excerpt ILIKE ${searchPattern})
      ` as { total: string }[]
    } else if (sentiment && search) {
      const searchPattern = `%${search}%`
      news = await sql`
        SELECT id, title, url, excerpt, source, published_at, sentiment,
               relevance_score, keywords, candidate_name, candidate_slug,
               candidate_cargo, party_name, party_short_name
        FROM news_mentions_enriched
        WHERE sentiment = ${sentiment}
          AND (title ILIKE ${searchPattern} OR excerpt ILIKE ${searchPattern})
        ORDER BY published_at DESC NULLS LAST, created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      ` as NewsItem[]
      countResult = await sql`
        SELECT COUNT(*) as total FROM news_mentions_enriched
        WHERE sentiment = ${sentiment}
          AND (title ILIKE ${searchPattern} OR excerpt ILIKE ${searchPattern})
      ` as { total: string }[]
    } else if (candidateSlug) {
      news = await sql`
        SELECT id, title, url, excerpt, source, published_at, sentiment,
               relevance_score, keywords, candidate_name, candidate_slug,
               candidate_cargo, party_name, party_short_name
        FROM news_mentions_enriched
        WHERE candidate_slug = ${candidateSlug}
        ORDER BY published_at DESC NULLS LAST, created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      ` as NewsItem[]
      countResult = await sql`
        SELECT COUNT(*) as total FROM news_mentions_enriched
        WHERE candidate_slug = ${candidateSlug}
      ` as { total: string }[]
    } else if (source) {
      news = await sql`
        SELECT id, title, url, excerpt, source, published_at, sentiment,
               relevance_score, keywords, candidate_name, candidate_slug,
               candidate_cargo, party_name, party_short_name
        FROM news_mentions_enriched
        WHERE source = ${source}
        ORDER BY published_at DESC NULLS LAST, created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      ` as NewsItem[]
      countResult = await sql`
        SELECT COUNT(*) as total FROM news_mentions_enriched
        WHERE source = ${source}
      ` as { total: string }[]
    } else if (sentiment) {
      news = await sql`
        SELECT id, title, url, excerpt, source, published_at, sentiment,
               relevance_score, keywords, candidate_name, candidate_slug,
               candidate_cargo, party_name, party_short_name
        FROM news_mentions_enriched
        WHERE sentiment = ${sentiment}
        ORDER BY published_at DESC NULLS LAST, created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      ` as NewsItem[]
      countResult = await sql`
        SELECT COUNT(*) as total FROM news_mentions_enriched
        WHERE sentiment = ${sentiment}
      ` as { total: string }[]
    } else if (search) {
      const searchPattern = `%${search}%`
      news = await sql`
        SELECT id, title, url, excerpt, source, published_at, sentiment,
               relevance_score, keywords, candidate_name, candidate_slug,
               candidate_cargo, party_name, party_short_name
        FROM news_mentions_enriched
        WHERE title ILIKE ${searchPattern} OR excerpt ILIKE ${searchPattern}
        ORDER BY published_at DESC NULLS LAST, created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      ` as NewsItem[]
      countResult = await sql`
        SELECT COUNT(*) as total FROM news_mentions_enriched
        WHERE title ILIKE ${searchPattern} OR excerpt ILIKE ${searchPattern}
      ` as { total: string }[]
    } else {
      // No filters
      news = await sql`
        SELECT id, title, url, excerpt, source, published_at, sentiment,
               relevance_score, keywords, candidate_name, candidate_slug,
               candidate_cargo, party_name, party_short_name
        FROM news_mentions_enriched
        ORDER BY published_at DESC NULLS LAST, created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      ` as NewsItem[]
      countResult = await sql`
        SELECT COUNT(*) as total FROM news_mentions_enriched
      ` as { total: string }[]
    }

    const total = parseInt(countResult[0]?.total || '0', 10)

    // Get available sources for filters
    const sourcesResult = await sql`
      SELECT DISTINCT source, COUNT(*) as count
      FROM news_mentions
      GROUP BY source
      ORDER BY count DESC
    ` as { source: string; count: string }[]

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
        sources: sourcesResult.map((s) => ({
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
