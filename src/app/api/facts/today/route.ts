import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET() {
  try {
    const today = new Date().toISOString().split('T')[0]

    const result = await sql`
      SELECT
        id,
        fact_text,
        fact_type,
        related_candidate_id,
        related_party_id,
        source_url
      FROM daily_facts
      WHERE date = ${today}
      LIMIT 1
    `

    if (result.length > 0) {
      // Increment views
      await sql`
        UPDATE daily_facts
        SET views = views + 1
        WHERE id = ${result[0].id}
      `

      return NextResponse.json(result[0])
    }

    // If no fact for today, get a random one
    const randomResult = await sql`
      SELECT
        id,
        fact_text,
        fact_type,
        related_candidate_id,
        related_party_id,
        source_url
      FROM daily_facts
      ORDER BY RANDOM()
      LIMIT 1
    `

    if (randomResult.length > 0) {
      return NextResponse.json(randomResult[0])
    }

    return NextResponse.json(
      { error: 'No facts available' },
      { status: 404 }
    )
  } catch (error) {
    console.error('Error fetching daily fact:', error)
    return NextResponse.json(
      { error: 'Failed to fetch daily fact' },
      { status: 500 }
    )
  }
}
