import { NextRequest, NextResponse } from 'next/server'

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
  government_plans: 'plans',
  news: 'news',
}

// Validate session token format
function isValidSessionFormat(token: string): boolean {
  return /^[a-z0-9]+_[a-z0-9]+$/.test(token)
}

// GET /api/admin/sync/[source] - Debug auth status
export async function GET(request: NextRequest) {
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value
  const allCookies = request.cookies.getAll()

  return NextResponse.json({
    debug: true,
    tokenExists: !!sessionToken,
    tokenValid: sessionToken ? isValidSessionFormat(sessionToken) : false,
    tokenPreview: sessionToken ? sessionToken.substring(0, 15) + '...' : null,
    allCookieNames: allCookies.map(c => c.name),
    cookieCount: allCookies.length,
  })
}

// POST /api/admin/sync/[source] - Trigger sync via proxy
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ source: string }> }
) {
  try {
    // Authentication: Read session token from cookie (most secure)
    const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value
    const allCookies = request.cookies.getAll()

    console.log('Admin sync: cookies received:', allCookies.map(c => c.name).join(', '))
    console.log('Admin sync: session token exists?', !!sessionToken)

    if (!sessionToken) {
      console.log('Admin sync: no session cookie found')
      return NextResponse.json(
        {
          success: false,
          error: 'No autenticado - sesión no encontrada',
          debug: {
            cookieCount: allCookies.length,
            cookieNames: allCookies.map(c => c.name)
          }
        },
        { status: 401 }
      )
    }

    if (!isValidSessionFormat(sessionToken)) {
      console.log('Admin sync: invalid token format')
      return NextResponse.json(
        { success: false, error: 'Sesión inválida - formato incorrecto' },
        { status: 401 }
      )
    }

    // Validate CRON_SECRET before proceeding
    if (!CRON_SECRET) {
      console.error('CRON_SECRET not configured in environment')
      return NextResponse.json(
        { success: false, error: 'Error de configuración: CRON_SECRET no está definido' },
        { status: 500 }
      )
    }

    const { source } = await params
    const apiPath = API_PATHS[source] || source

    // Get the base URL for internal API calls
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ||
                    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

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

    // Handle response - may not be JSON
    const responseText = await response.text()
    let data: { error?: string; message?: string; [key: string]: unknown }
    try {
      data = JSON.parse(responseText)
    } catch {
      console.error('Admin sync: non-JSON response:', responseText.substring(0, 200))
      data = { error: `Respuesta inválida del servidor sync: ${responseText.substring(0, 100)}` }
    }

    console.log(`Admin sync ${source} response:`, response.status, data)

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.error || data.message || `Sync falló con status ${response.status}` },
        { status: response.status }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Admin sync proxy error:', error)
    const errorMsg = error instanceof Error ? error.message : 'Error interno'
    return NextResponse.json(
      { success: false, error: `Error interno: ${errorMsg}` },
      { status: 500 }
    )
  }
}
