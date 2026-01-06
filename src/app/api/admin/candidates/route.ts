import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const SESSION_COOKIE_NAME = 'admin_session'

function isAuthenticated(request: NextRequest): boolean {
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value
  return !!sessionToken && /^[a-z0-9]+_[a-z0-9]+$/.test(sessionToken)
}

// GET /api/admin/candidates - List candidates with filters
export async function GET(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const page = parseInt(searchParams.get('page') || '1')
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
  const search = searchParams.get('q')
  const cargo = searchParams.get('cargo')
  const partyId = searchParams.get('party_id')
  const districtId = searchParams.get('district_id')

  const offset = (page - 1) * limit

  try {
    const supabase = await createClient()

    // Build query
    let query = supabase
      .from('candidates')
      .select(`
        id,
        slug,
        full_name,
        photo_url,
        cargo,
        birth_date,
        education_level,
        is_active,
        data_source,
        data_verified,
        last_updated,
        created_at,
        parties!left (
          id,
          name,
          short_name
        ),
        districts!left (
          id,
          name
        )
      `, { count: 'exact' })
      .order('full_name', { ascending: true })

    // Apply filters
    if (search) {
      query = query.ilike('full_name', `%${search}%`)
    }
    if (cargo) {
      query = query.eq('cargo', cargo)
    }
    if (partyId) {
      query = query.eq('party_id', partyId)
    }
    if (districtId) {
      query = query.eq('district_id', districtId)
    }

    // Pagination
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching candidates:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    // Get parties for filter
    const { data: parties } = await supabase
      .from('parties')
      .select('id, name, short_name')
      .order('name')

    // Get districts for filter
    const { data: districts } = await supabase
      .from('districts')
      .select('id, name')
      .order('name')

    // Get counts by cargo
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: allCandidates } = await (supabase as any)
      .from('candidates')
      .select('cargo') as { data: Array<{ cargo: string }> | null }

    const countsByCargo = {
      total: allCandidates?.length || 0,
      presidente: allCandidates?.filter(c => c.cargo === 'presidente').length || 0,
      vicepresidente: allCandidates?.filter(c => c.cargo === 'vicepresidente').length || 0,
      senador: allCandidates?.filter(c => c.cargo === 'senador').length || 0,
      diputado: allCandidates?.filter(c => c.cargo === 'diputado').length || 0,
      parlamento_andino: allCandidates?.filter(c => c.cargo === 'parlamento_andino').length || 0,
    }

    return NextResponse.json({
      candidates: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
      parties: parties || [],
      districts: districts || [],
      counts: countsByCargo,
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
