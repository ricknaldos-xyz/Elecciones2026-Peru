import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { newsQuerySchema } from '@/lib/validation/schemas'
import { parseSearchParams } from '@/lib/validation/helpers'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

const RATE_LIMIT = { name: 'news-api', max: 60, windowSec: 60 }

export const dynamic = 'force-dynamic'
export const revalidate = 300 // 5 minutes cache

export async function GET(request: NextRequest) {
  try {
    const { limited } = checkRateLimit(getClientIp(request), RATE_LIMIT)
    if (limited) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      )
    }
    const parsed = parseSearchParams(request, newsQuerySchema)
    if (!parsed.success) return parsed.response

    const { page, limit, candidato: candidateSlugVal, fuente: sourceVal, sentimiento: sentimentVal, q: search } = parsed.data
    const offset = (page - 1) * limit

    const candidateSlug = candidateSlugVal || null
    const source = sourceVal || null
    const sentiment = sentimentVal || null
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
        sources: sourcesResult.map((s) => ({
          name: s.source as string,
          count: parseInt(s.count as string, 10),
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
