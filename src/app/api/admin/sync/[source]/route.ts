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
                    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)

    if (!baseUrl) {
      console.error('Admin sync: No base URL configured (NEXT_PUBLIC_APP_URL or VERCEL_URL)')
      return NextResponse.json(
        { success: false, error: 'Error de configuración: URL base no configurada' },
        { status: 500 }
      )
    }

    const syncUrl = `${baseUrl}/api/sync/${apiPath}`
    console.log(`Admin sync: calling ${syncUrl} (baseUrl=${baseUrl})`)

    // Call the actual sync API with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 120000) // 2 min timeout

    let response: Response
    try {
      response = await fetch(syncUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CRON_SECRET}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      })
    } catch (fetchError) {
      clearTimeout(timeoutId)
      const errorMsg = fetchError instanceof Error ? fetchError.message : 'Error de conexión'
      console.error(`Admin sync: fetch failed to ${syncUrl}:`, errorMsg)
      return NextResponse.json(
        { success: false, error: `No se pudo conectar al servidor sync: ${errorMsg}` },
        { status: 502 }
      )
    }
    clearTimeout(timeoutId)

    // Handle response - validate Content-Type
    const contentType = response.headers.get('content-type') || ''
    const responseText = await response.text()
    let data: { error?: string; message?: string; [key: string]: unknown }

    if (contentType.includes('application/json')) {
      try {
        data = JSON.parse(responseText)
      } catch {
        console.error('Admin sync: invalid JSON:', responseText.substring(0, 300))
        data = { error: 'Respuesta JSON inválida del servidor' }
      }
    } else {
      console.error(`Admin sync: unexpected content-type "${contentType}":`, responseText.substring(0, 300))
      data = { error: `Respuesta inesperada (${contentType}): ${responseText.substring(0, 150)}` }
    }

    console.log(`Admin sync ${source} response:`, response.status, JSON.stringify(data).substring(0, 200))

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
