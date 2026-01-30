import { NextRequest, NextResponse } from 'next/server'

/**
 * Verify that a sync request is authorized.
 * Accepts either Vercel Cron header or Bearer token with CRON_SECRET.
 * Returns null if authorized, or a 401 response to return immediately.
 */
export function verifySyncAuth(request: NextRequest): NextResponse | null {
  const isVercelCron = request.headers.get('x-vercel-cron') === '1'
  if (isVercelCron) return null

  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    console.error('CRON_SECRET environment variable is not set')
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  }

  const authHeader = request.headers.get('authorization')
  if (authHeader === `Bearer ${cronSecret}`) return null

  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
