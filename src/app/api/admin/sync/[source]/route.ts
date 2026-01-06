import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const SESSION_COOKIE_NAME = 'admin_session'
const CRON_SECRET = process.env.CRON_SECRET

// Map source keys to API paths
const API_PATHS: Record<string, string> = {
  jne: 'jne',
  onpe: 'onpe',
  poder_judicial: 'judicial',
  expanded_rss: 'news-expanded',
  google_news: 'google-news',
  youtube: 'youtube',
  ai_analysis: 'ai-analysis',
  tiktok: 'tiktok',
  twitter: 'twitter',
  news: 'news',
}

// Validate session
async function isAuthenticated(): Promise<boolean> {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value
    return !!sessionToken && /^[a-z0-9]+_[a-z0-9]+$/.test(sessionToken)
  } catch {
    return false
  }
}

// POST /api/admin/sync/[source] - Trigger sync via proxy
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ source: string }> }
) {
  try {
    // Check authentication
    if (!(await isAuthenticated())) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { source } = await params
    const apiPath = API_PATHS[source] || source

    // Get the base URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ||
                    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

    // Validate CRON_SECRET is set
    if (!CRON_SECRET) {
      console.error('CRON_SECRET not configured')
      return NextResponse.json(
        { success: false, error: 'Server misconfiguration: CRON_SECRET not set' },
        { status: 500 }
      )
    }

    const syncUrl = `${baseUrl}/api/sync/${apiPath}`
    console.log(`Admin sync: calling ${syncUrl}`)

    // Call the actual sync API with the secret
    const response = await fetch(syncUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CRON_SECRET}`,
        'Content-Type': 'application/json',
      },
    })

    let data
    try {
      data = await response.json()
    } catch {
      data = { error: 'Invalid JSON response' }
    }

    console.log(`Admin sync ${source} response:`, response.status, data)

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.error || data.message || `Sync failed with status ${response.status}` },
        { status: response.status }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Admin sync proxy error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal error' },
      { status: 500 }
    )
  }
}
