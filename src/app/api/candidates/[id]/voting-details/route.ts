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

    // Get all votes on controversial laws for this candidate
    const votes = await sql`
      SELECT
        cv.project_id,
        cv.project_title,
        cv.project_summary,
        cv.vote_type,
        cv.session_date,
        cv.is_pro_crime,
        cv.is_anti_democratic,
        cv.is_pro_corruption,
        cv.category,
        cv.source_url,
        cl.title as law_title,
        cl.description as law_description,
        cl.category as law_category,
        cl.penalty_points,
        cl.bonus_points,
        cl.is_approved as law_approved
      FROM congressional_votes cv
      JOIN controversial_laws cl ON cv.project_id = cl.project_id
      WHERE cv.candidate_id = ${id}::uuid
      ORDER BY cv.session_date DESC
    `

    // Get total controversial laws count
    const totalLaws = await sql`
      SELECT COUNT(*) as cnt FROM controversial_laws
    `

    const controversialVotes = votes.map(v => ({
      projectId: v.project_id,
      projectTitle: v.law_title || v.project_title,
      description: v.law_description || v.project_summary || '',
      category: v.law_category || v.category || '',
      voteType: v.vote_type,
      sessionDate: v.session_date,
      penaltyPoints: Number(v.penalty_points) || 0,
      bonusPoints: Number(v.bonus_points) || 0,
      sourceUrl: v.source_url,
    }))

    return NextResponse.json({
      controversialVotes,
      totalControversialLaws: Number(totalLaws[0]?.cnt) || 0,
      votedInFavor: controversialVotes.filter(v => v.voteType === 'favor').length,
      votedAgainst: controversialVotes.filter(v => v.voteType === 'contra').length,
      absent: controversialVotes.filter(v => v.voteType === 'ausente' || v.voteType === 'licencia').length,
      abstentions: controversialVotes.filter(v => v.voteType === 'abstencion').length,
    })
  } catch (error) {
    console.error('Error fetching voting details:', error)
    return NextResponse.json(
      { error: 'Failed to fetch voting details' },
      { status: 500 }
    )
  }
}
