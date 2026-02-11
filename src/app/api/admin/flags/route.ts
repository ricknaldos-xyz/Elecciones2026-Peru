import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const SESSION_COOKIE_NAME = 'admin_session'

function isAuthenticated(request: NextRequest): boolean {
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value
  return !!sessionToken && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(sessionToken)
}

// GET /api/admin/flags - List flags with filters
export async function GET(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const page = parseInt(searchParams.get('page') || '1')
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
  const status = searchParams.get('status') // pending, verified, rejected
  const severity = searchParams.get('severity') // RED, AMBER, GRAY
  const type = searchParams.get('type')
  const candidateId = searchParams.get('candidate_id')

  const offset = (page - 1) * limit

  try {
    const supabase = await createClient()

    // Build query
    let query = supabase
      .from('flags')
      .select(`
        id,
        candidate_id,
        type,
        severity,
        title,
        description,
        source,
        evidence_url,
        date_captured,
        status,
        verified_by,
        verified_at,
        created_at,
        candidates!left (
          id,
          full_name,
          slug,
          cargo,
          photo_url,
          parties!left (
            name,
            short_name
          )
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })

    // Apply filters
    if (status) {
      if (status === 'pending') {
        query = query.or('status.is.null,status.eq.pending')
      } else {
        query = query.eq('status', status)
      }
    }
    if (severity) {
      query = query.eq('severity', severity)
    }
    if (type) {
      query = query.eq('type', type)
    }
    if (candidateId) {
      query = query.eq('candidate_id', candidateId)
    }

    // Pagination
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching flags:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    // Get counts by status
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: allFlags } = await (supabase as any)
      .from('flags')
      .select('status, severity') as { data: Array<{ status: string; severity: string }> | null }

    const counts = {
      total: allFlags?.length || 0,
      pending: allFlags?.filter(f => !f.status || f.status === 'pending').length || 0,
      verified: allFlags?.filter(f => f.status === 'verified').length || 0,
      rejected: allFlags?.filter(f => f.status === 'rejected').length || 0,
      red: allFlags?.filter(f => f.severity === 'RED').length || 0,
      amber: allFlags?.filter(f => f.severity === 'AMBER').length || 0,
      gray: allFlags?.filter(f => f.severity === 'GRAY').length || 0,
    }

    // Get unique types
    const types = [...new Set(allFlags?.map(f => f.status) || [])]

    return NextResponse.json({
      flags: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
      counts,
      types,
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// POST /api/admin/flags - Bulk actions
export async function POST(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { action, ids } = body

    if (!action || !ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const validActions = ['verify', 'reject', 'pending']
    if (!validActions.includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const supabase = await createClient()
    const now = new Date().toISOString()

    const statusMap: Record<string, string> = {
      verify: 'verified',
      reject: 'rejected',
      pending: 'pending',
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('flags')
      .update({
        status: statusMap[action],
        verified_by: 'admin',
        verified_at: now,
      })
      .in('id', ids)

    if (error) {
      console.error('Error updating flags:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    return NextResponse.json({ success: true, updated: ids.length })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
