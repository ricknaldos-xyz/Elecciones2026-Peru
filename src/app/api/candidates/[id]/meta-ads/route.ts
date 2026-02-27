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

    // Get aggregate spending summary for this candidate
    const summaryRows = await sql`
      SELECT
        COUNT(DISTINCT map.page_id)::int AS pages_count,
        COALESCE(SUM(mas.number_of_ads), 0)::int AS total_ads,
        COALESCE(SUM(mas.amount_spent_lower), 0)::numeric AS total_spent_lower,
        COALESCE(SUM(mas.amount_spent_upper), 0)::numeric AS total_spent_upper,
        COALESCE(SUM(mas.amount_spent_mid), 0)::numeric AS total_spent_mid,
        MIN(mas.period_start) AS earliest_period,
        MAX(mas.period_end) AS latest_period,
        array_agg(DISTINCT mas.disclaimer) FILTER (WHERE mas.disclaimer IS NOT NULL) AS disclaimers,
        MAX(mas.currency) AS currency
      FROM meta_ad_pages map
      JOIN meta_ad_spending mas ON map.page_id = mas.page_id
      WHERE map.candidate_id = ${id}::uuid
    `

    const raw = summaryRows[0]
    const totalAds = Number(raw?.total_ads) || 0

    if (totalAds === 0) {
      return NextResponse.json({
        summary: null,
        pages: [],
        party_total_spent_mid: null,
        party_name: null,
      })
    }

    // Per-page breakdown
    const pages = await sql`
      SELECT
        map.page_name,
        map.page_id,
        map.is_candidate_page,
        COALESCE(SUM(mas.number_of_ads), 0)::int AS total_ads,
        COALESCE(SUM(mas.amount_spent_mid), 0)::numeric AS amount_spent_mid
      FROM meta_ad_pages map
      JOIN meta_ad_spending mas ON map.page_id = mas.page_id
      WHERE map.candidate_id = ${id}::uuid
      GROUP BY map.page_name, map.page_id, map.is_candidate_page
      ORDER BY amount_spent_mid DESC
    `

    // Party context: total spending across all pages linked to the same party
    const partyRows = await sql`
      SELECT
        p.name AS party_name,
        COALESCE(SUM(mas.amount_spent_mid), 0)::numeric AS party_total_spent_mid
      FROM candidates c
      JOIN parties p ON c.party_id = p.id
      JOIN meta_ad_pages map ON map.party_id = p.id
      JOIN meta_ad_spending mas ON map.page_id = mas.page_id
      WHERE c.id = ${id}::uuid
      GROUP BY p.name
    `

    return NextResponse.json({
      summary: {
        total_ads: totalAds,
        total_spent_lower: Number(raw.total_spent_lower),
        total_spent_upper: Number(raw.total_spent_upper),
        total_spent_mid: Number(raw.total_spent_mid),
        currency: raw.currency || 'PEN',
        pages_count: Number(raw.pages_count),
        earliest_period: raw.earliest_period,
        latest_period: raw.latest_period,
        disclaimers: raw.disclaimers || [],
      },
      pages,
      party_total_spent_mid: partyRows[0]
        ? Number(partyRows[0].party_total_spent_mid)
        : null,
      party_name: partyRows[0]?.party_name || null,
    })
  } catch (error) {
    console.error('Error fetching meta ads:', error)
    return NextResponse.json(
      { error: 'Failed to fetch meta ad data' },
      { status: 500 }
    )
  }
}
