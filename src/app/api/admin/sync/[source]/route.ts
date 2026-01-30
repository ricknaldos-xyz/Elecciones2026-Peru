import { NextRequest, NextResponse } from 'next/server'

const SESSION_COOKIE_NAME = 'admin_session'

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

// Validate session token format (UUID v4)
function isValidSessionFormat(token: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(token)
}

// POST /api/admin/sync/[source] - Trigger sync via proxy
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ source: string }> }
) {
  try {
    const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value

    if (!sessionToken || !isValidSessionFormat(sessionToken)) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      )
    }

    const cronSecret = process.env.CRON_SECRET
    if (!cronSecret) {
      return NextResponse.json(
        { success: false, error: 'Error de configuración del servidor' },
        { status: 500 }
      )
    }

    const { source } = await params
    const apiPath = API_PATHS[source] || source

    // Get the base URL for internal API calls
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ||
                    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)

    if (!baseUrl) {
      console.error('Admin sync: no base URL configured')
      return NextResponse.json(
        { success: false, error: 'Error de configuración: URL base no configurada' },
        { status: 500 }
      )
    }

    const syncUrl = `${baseUrl}/api/sync/${apiPath}`

    // Call the actual sync API with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 120000) // 2 min timeout

    let response: Response
    try {
      response = await fetch(syncUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${cronSecret}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      })
    } catch (fetchError) {
      clearTimeout(timeoutId)
      const errorMsg = fetchError instanceof Error ? fetchError.message : 'Error de conexión'
      console.error(`Admin sync: fetch failed for ${source}:`, errorMsg)
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
        console.error('Admin sync: invalid JSON response')
        data = { error: 'Respuesta JSON inválida del servidor' }
      }
    } else {
      console.error(`Admin sync: unexpected content-type for ${source}`)
      data = { error: 'Respuesta inesperada del servidor' }
    }


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
