import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const revalidate = 300 // Revalidate every 5 minutes

export async function GET() {
  try {
    const [candidatesResult, partiesResult, flagsResult, byCargoResult] = await Promise.all([
      sql`SELECT COUNT(*) as total FROM candidates`,
      sql`SELECT COUNT(*) as total FROM parties`,
      sql`SELECT COUNT(*) as total FROM flags`,
      sql`SELECT cargo, COUNT(*) as total FROM candidates GROUP BY cargo ORDER BY total DESC`
    ])

    const byCargo: Record<string, number> = {}
    for (const row of byCargoResult) {
      byCargo[row.cargo] = Number(row.total)
    }

    return NextResponse.json({
      totalCandidates: Number(candidatesResult[0].total),
      totalParties: Number(partiesResult[0].total),
      totalFlags: Number(flagsResult[0].total),
      byCargo
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json(
      { error: 'Error fetching stats' },
      { status: 500 }
    )
  }
}
