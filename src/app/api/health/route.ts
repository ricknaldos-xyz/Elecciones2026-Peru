import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  const start = Date.now()

  try {
    await sql`SELECT 1`
    const dbLatency = Date.now() - start

    return NextResponse.json({
      status: 'ok',
      db: 'connected',
      dbLatencyMs: dbLatency,
      timestamp: new Date().toISOString(),
    })
  } catch {
    return NextResponse.json(
      {
        status: 'error',
        db: 'disconnected',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    )
  }
}
