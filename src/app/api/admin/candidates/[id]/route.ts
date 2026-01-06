import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

const SESSION_COOKIE_NAME = 'admin_session'

async function isAuthenticated(): Promise<boolean> {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value
    return !!sessionToken && /^[a-z0-9]+_[a-z0-9]+$/.test(sessionToken)
  } catch {
    return false
  }
}

// GET /api/admin/candidates/[id] - Get single candidate
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('candidates')
      .select(`
        *,
        parties!left (
          id,
          name,
          short_name
        ),
        districts!left (
          id,
          name
        ),
        scores!left (
          competence,
          integrity,
          transparency,
          confidence,
          score_balanced
        )
      `)
      .eq('id', id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// PATCH /api/admin/candidates/[id] - Update candidate
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const body = await request.json()
    const {
      full_name,
      photo_url,
      birth_date,
      education_level,
      education_details,
      experience_details,
      political_trajectory,
      is_active,
      data_verified,
    } = body

    const supabase = await createClient()
    const now = new Date().toISOString()

    const updateData: Record<string, unknown> = {
      last_updated: now,
    }

    if (full_name !== undefined) updateData.full_name = full_name
    if (photo_url !== undefined) updateData.photo_url = photo_url
    if (birth_date !== undefined) updateData.birth_date = birth_date
    if (education_level !== undefined) updateData.education_level = education_level
    if (education_details !== undefined) updateData.education_details = education_details
    if (experience_details !== undefined) updateData.experience_details = experience_details
    if (political_trajectory !== undefined) updateData.political_trajectory = political_trajectory
    if (is_active !== undefined) updateData.is_active = is_active
    if (data_verified !== undefined) updateData.data_verified = data_verified

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('candidates')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating candidate:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
