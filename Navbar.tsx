import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const type = request.nextUrl.searchParams.get('type') || 'received'

  let query = supabase.from('matches').select(`
    *, requester:users!requester_id(id,nickname,avatar_url),
    receiver:users!receiver_id(id,nickname,avatar_url),
    post:contest_posts(id,title),
    reservation:sports_reservations(id,facility,reservation_date,start_time)
  `).order('created_at', { ascending: false })

  if (type === 'sent') query = query.eq('requester_id', user.id)
  else query = query.eq('receiver_id', user.id)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { receiver_id, type, message, post_id, reservation_id } = await request.json()

  if (receiver_id === user.id) {
    return NextResponse.json({ error: '자신에게는 신청할 수 없습니다' }, { status: 400 })
  }

  // Check duplicate
  const { data: existing } = await supabase.from('matches')
    .select('id')
    .eq('requester_id', user.id)
    .eq('receiver_id', receiver_id)
    .in('status', ['pending', 'accepted'])
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: '이미 신청한 상대입니다' }, { status: 400 })
  }

  const { data, error } = await supabase.from('matches').insert({
    requester_id: user.id,
    receiver_id,
    type,
    message,
    post_id: post_id || null,
    reservation_id: reservation_id || null,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Create notification
  const admin = createAdminClient()
  await admin.from('notifications').insert({
    user_id: receiver_id,
    type: 'match_request',
    title: '새로운 매칭 신청',
    body: '매칭 신청이 도착했습니다. 확인해보세요!',
    match_id: data.id,
  })

  return NextResponse.json(data, { status: 201 })
}
