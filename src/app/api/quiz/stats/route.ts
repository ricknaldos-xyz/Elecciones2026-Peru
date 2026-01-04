import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET() {
  try {
    // Get total quiz completions
    const totalResult = await sql`
      SELECT COUNT(*) as total FROM quiz_responses
    `

    // Get most common top candidate
    const topCandidateResult = await sql`
      SELECT
        top_matches->0->>'candidate_name' as candidate_name,
        COUNT(*) as count
      FROM quiz_responses
      WHERE top_matches IS NOT NULL
      GROUP BY top_matches->0->>'candidate_name'
      ORDER BY count DESC
      LIMIT 1
    `

    // Get distribution of political profiles (based on answers)
    const profilesResult = await sql`
      SELECT
        CASE
          WHEN (SELECT AVG(value::float) FROM jsonb_each_text(answers) WHERE key != 'completion_time') <= 2 THEN 'Progresista'
          WHEN (SELECT AVG(value::float) FROM jsonb_each_text(answers) WHERE key != 'completion_time') <= 2.8 THEN 'Centro-Izquierda'
          WHEN (SELECT AVG(value::float) FROM jsonb_each_text(answers) WHERE key != 'completion_time') <= 3.2 THEN 'Centrista'
          WHEN (SELECT AVG(value::float) FROM jsonb_each_text(answers) WHERE key != 'completion_time') <= 4 THEN 'Centro-Derecha'
          ELSE 'Conservador'
        END as profile,
        COUNT(*) as count
      FROM quiz_responses
      GROUP BY profile
      ORDER BY count DESC
    `

    return NextResponse.json({
      totalCompletions: Number(totalResult[0]?.total || 0),
      topCandidate: topCandidateResult[0]?.candidate_name || null,
      topCandidateCount: Number(topCandidateResult[0]?.count || 0),
      profiles: profilesResult,
    })
  } catch (error) {
    console.error('Error fetching quiz stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
