import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const SESSION_COOKIE_NAME = 'admin_session'

function isAuthenticated(request: NextRequest): boolean {
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value
  return !!sessionToken && /^[a-z0-9]+_[a-z0-9]+$/.test(sessionToken)
}

// GET /api/admin/news - List news with filters
export async function GET(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const page = parseInt(searchParams.get('page') || '1')
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
  const status = searchParams.get('status') // pending, approved, rejected, featured
  const source = searchParams.get('source')
  const sentiment = searchParams.get('sentiment')
  const candidateSlug = searchParams.get('candidate')
  const search = searchParams.get('q')

  const offset = (page - 1) * limit

  try {
    const supabase = await createClient()

    // Build query
    let query = supabase
      .from('news_mentions')
      .select(`
        id,
        title,
        url,
        excerpt,
        source,
        published_at,
        sentiment,
        relevance_score,
        keywords,
        candidate_id,
        status,
        moderated_by,
        moderated_at,
        moderation_note,
        created_at,
        candidates!left (
          id,
          full_name,
          slug,
          cargo,
          parties!left (
            name,
            short_name
          )
        )
      `, { count: 'exact' })
      .order('published_at', { ascending: false })

    // Apply filters
    if (status) {
      query = query.eq('status', status)
    }
    if (source) {
      query = query.eq('source', source)
    }
    if (sentiment) {
      query = query.eq('sentiment', sentiment)
    }
    if (candidateSlug) {
      query = query.eq('candidates.slug', candidateSlug)
    }
    if (search) {
      query = query.or(`title.ilike.%${search}%,excerpt.ilike.%${search}%`)
    }

    // Pagination
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching news:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    // Get unique sources for filter dropdown
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: sources } = await (supabase as any)
      .from('news_mentions')
      .select('source')
      .order('source') as { data: Array<{ source: string }> | null }

    const uniqueSources = [...new Set(sources?.map(s => s.source) || [])]

    // Get counts by status
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: statusCounts } = await (supabase as any)
      .from('news_mentions')
      .select('status') as { data: Array<{ status: string }> | null }

    const counts = {
      total: statusCounts?.length || 0,
      pending: statusCounts?.filter(s => !s.status || s.status === 'pending').length || 0,
      approved: statusCounts?.filter(s => s.status === 'approved').length || 0,
      rejected: statusCounts?.filter(s => s.status === 'rejected').length || 0,
      featured: statusCounts?.filter(s => s.status === 'featured').length || 0,
    }

    return NextResponse.json({
      news: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
      sources: uniqueSources,
      counts,
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// POST /api/admin/news - Bulk actions
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

    const validActions = ['approve', 'reject', 'feature', 'pending']
    if (!validActions.includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const supabase = await createClient()
    const now = new Date().toISOString()

    const statusMap: Record<string, string> = {
      approve: 'approved',
      reject: 'rejected',
      feature: 'featured',
      pending: 'pending',
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('news_mentions')
      .update({
        status: statusMap[action],
        moderated_by: 'admin',
        moderated_at: now,
      })
      .in('id', ids)

    if (error) {
      console.error('Error updating news:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    return NextResponse.json({ success: true, updated: ids.length })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
