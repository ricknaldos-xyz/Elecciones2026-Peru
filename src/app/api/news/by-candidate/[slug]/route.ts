import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { newsByCandidateSchema } from '@/lib/validation/schemas'
import { parseSearchParams } from '@/lib/validation/helpers'

export const dynamic = 'force-dynamic'
export const revalidate = 300

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function GET(request: NextRequest, { params }: PageProps) {
  try {
    const { slug } = await params
    const parsed = parseSearchParams(request, newsByCandidateSchema)
    if (!parsed.success) return parsed.response

    const { limit } = parsed.data

    const news = await sql`
      SELECT
        id,
        title,
        url,
        excerpt,
        source,
        published_at,
        sentiment,
        relevance_score,
        keywords
      FROM news_mentions_enriched
      WHERE candidate_slug = ${slug}
      ORDER BY published_at DESC NULLS LAST, created_at DESC
      LIMIT ${limit}
    `

    // Get sentiment summary
    const sentimentSummary = await sql`
      SELECT
        sentiment,
        COUNT(*) as count
      FROM news_mentions_enriched
      WHERE candidate_slug = ${slug}
      GROUP BY sentiment
    `

    const totalNews = await sql`
      SELECT COUNT(*) as total
      FROM news_mentions_enriched
      WHERE candidate_slug = ${slug}
    `

    return NextResponse.json({
      news,
      total: parseInt(totalNews[0]?.total || '0', 10),
      sentimentSummary: sentimentSummary.reduce((acc, s) => {
        if (s.sentiment) {
          acc[s.sentiment] = parseInt(s.count, 10)
        }
        return acc
      }, {} as Record<string, number>),
    })
  } catch (error) {
    console.error('Error fetching candidate news:', error)
    return NextResponse.json(
      { error: 'Error al obtener noticias del candidato' },
      { status: 500 }
    )
  }
}
