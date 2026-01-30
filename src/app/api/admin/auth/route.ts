import { NextRequest, NextResponse } from 'next/server'

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD
if (!ADMIN_PASSWORD) {
  console.error('CRITICAL: ADMIN_PASSWORD environment variable is not set')
}
const SESSION_COOKIE_NAME = 'admin_session'
const SESSION_MAX_AGE = 60 * 60 * 24 // 24 hours

// Cryptographically secure session token
function generateSessionToken(): string {
  return crypto.randomUUID()
}

// Validate session token format (UUID v4)
function isValidSessionFormat(token: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(token)
}

// POST /api/admin/auth - Login
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { password } = body

    console.log('Admin auth: login attempt')

    if (!ADMIN_PASSWORD) {
      console.error('Admin login rejected: ADMIN_PASSWORD not configured')
      return NextResponse.json(
        { success: false, error: 'Admin login is not configured' },
        { status: 503 }
      )
    }

    if (!password) {
      return NextResponse.json(
        { success: false, error: 'Password required' },
        { status: 400 }
      )
    }

    if (password !== ADMIN_PASSWORD) {
      console.log('Admin auth: invalid password')
      return NextResponse.json(
        { success: false, error: 'Invalid password' },
        { status: 401 }
      )
    }

    // Generate session token
    const sessionToken = generateSessionToken()
    console.log('Admin auth: generated token', sessionToken.substring(0, 10) + '...')

    // Create response with cookie
    const response = NextResponse.json({ success: true })

    response.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_MAX_AGE,
      path: '/',
    })

    console.log('Admin auth: cookie set successfully')
    return response
  } catch (error) {
    console.error('Auth error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal error' },
      { status: 500 }
    )
  }
}

// GET /api/admin/auth - Check session
export async function GET(request: NextRequest) {
  try {
    // Use request.cookies instead of cookies() from next/headers
    const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value

    console.log('Admin auth check: token exists?', !!sessionToken)

    if (!sessionToken) {
      return NextResponse.json({ authenticated: false, reason: 'no_token' })
    }

    if (!isValidSessionFormat(sessionToken)) {
      console.log('Admin auth check: invalid format', sessionToken.substring(0, 10))
      return NextResponse.json({ authenticated: false, reason: 'invalid_format' })
    }

    console.log('Admin auth check: valid session')
    // Return token for use in API headers (for POST requests that don't receive cookies)
    return NextResponse.json({ authenticated: true, token: sessionToken })
  } catch (error) {
    console.error('Auth check error:', error)
    return NextResponse.json({ authenticated: false, reason: 'error' })
  }
}

// DELETE /api/admin/auth - Logout
export async function DELETE() {
  try {
    const response = NextResponse.json({ success: true })

    response.cookies.set(SESSION_COOKIE_NAME, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal error' },
      { status: 500 }
    )
  }
}
