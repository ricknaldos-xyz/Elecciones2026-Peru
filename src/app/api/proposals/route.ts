import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { PROPOSAL_CATEGORIES } from '@/lib/sync/plans/extractor'
import { proposalsQuerySchema } from '@/lib/validation/schemas'
import { parseSearchParams } from '@/lib/validation/helpers'

export const dynamic = 'force-dynamic'
export const revalidate = 600

/**
 * GET /api/proposals - Get proposals with filters
 *
 * Query params:
 * - candidateId: Filter by candidate
 * - category: Filter by category
 * - candidateIds: Comma-separated list for comparison
 */
export async function GET(request: NextRequest) {
  try {
    const parsed = parseSearchParams(request, proposalsQuerySchema)
    if (!parsed.success) return parsed.response

    const { candidateId, category, candidateIds } = parsed.data

    // Single candidate
    if (candidateId) {
      // Get candidate info including local PDF path
      const candidateInfo = await sql`
        SELECT plan_pdf_local, plan_gobierno_url
        FROM candidates
        WHERE id = ${candidateId}
      `

      let result
      if (category) {
        result = await sql`
          SELECT
            cp.id,
            cp.category,
            cp.title,
            cp.description,
            cp.source_quote,
            cp.page_reference,
            cp.created_at
          FROM candidate_proposals cp
          WHERE cp.candidate_id = ${candidateId}
          AND cp.category = ${category}
          ORDER BY cp.created_at
        `
      } else {
        result = await sql`
          SELECT
            cp.id,
            cp.category,
            cp.title,
            cp.description,
            cp.source_quote,
            cp.page_reference,
            cp.created_at
          FROM candidate_proposals cp
          WHERE cp.candidate_id = ${candidateId}
          ORDER BY cp.category, cp.created_at
        `
      }

      // Group by category
      const grouped: Record<string, typeof result> = {}
      for (const row of result) {
        const cat = row.category as string
        if (!grouped[cat]) grouped[cat] = []
        grouped[cat].push(row)
      }

      return NextResponse.json({
        candidateId,
        totalProposals: result.length,
        categories: Object.keys(grouped),
        proposalsByCategory: grouped,
        proposals: result,
        planPdfLocal: candidateInfo[0]?.plan_pdf_local || null,
        planUrl: candidateInfo[0]?.plan_gobierno_url || null,
      })
    }

    // Multiple candidates for comparison
    if (candidateIds && candidateIds.length > 0) {
      let result
      if (category) {
        result = await sql`
          SELECT
            cp.id,
            cp.candidate_id,
            cp.category,
            cp.title,
            cp.description,
            cp.source_quote,
            cp.page_reference,
            c.full_name as candidate_name,
            c.slug as candidate_slug,
            c.photo_url
          FROM candidate_proposals cp
          JOIN candidates c ON c.id = cp.candidate_id
          WHERE cp.candidate_id = ANY(${candidateIds})
          AND cp.category = ${category}
          ORDER BY c.full_name, cp.created_at
        `
      } else {
        result = await sql`
          SELECT
            cp.id,
            cp.candidate_id,
            cp.category,
            cp.title,
            cp.description,
            cp.source_quote,
            cp.page_reference,
            c.full_name as candidate_name,
            c.slug as candidate_slug,
            c.photo_url
          FROM candidate_proposals cp
          JOIN candidates c ON c.id = cp.candidate_id
          WHERE cp.candidate_id = ANY(${candidateIds})
          ORDER BY c.full_name, cp.category, cp.created_at
        `
      }

      // Group by candidate
      const byCandidate: Record<
        string,
        {
          candidateId: string
          candidateName: string
          candidateSlug: string
          photoUrl: string | null
          proposals: typeof result
        }
      > = {}

      for (const row of result) {
        const cId = row.candidate_id as string
        if (!byCandidate[cId]) {
          byCandidate[cId] = {
            candidateId: cId,
            candidateName: row.candidate_name as string,
            candidateSlug: row.candidate_slug as string,
            photoUrl: row.photo_url as string | null,
            proposals: [],
          }
        }
        byCandidate[cId].proposals.push(row)
      }

      return NextResponse.json({
        candidateIds,
        category: category || 'all',
        totalProposals: result.length,
        candidates: Object.values(byCandidate),
      })
    }

    // No filters - return summary
    const summary = await sql`
      SELECT
        c.id as candidate_id,
        c.full_name,
        c.slug,
        c.photo_url,
        c.cargo,
        COUNT(cp.id) as proposal_count
      FROM candidates c
      LEFT JOIN candidate_proposals cp ON cp.candidate_id = c.id
      WHERE c.cargo = 'presidente'
      GROUP BY c.id, c.full_name, c.slug, c.photo_url, c.cargo
      HAVING COUNT(cp.id) > 0
      ORDER BY c.full_name
    `

    return NextResponse.json({
      candidatesWithProposals: summary.length,
      categories: PROPOSAL_CATEGORIES,
      candidates: summary,
    })
  } catch (error) {
    console.error('Error fetching proposals:', error)
    return NextResponse.json(
      { error: 'Failed to fetch proposals' },
      { status: 500 }
    )
  }
}
