import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { status } = await request.json()
  if (!['accepted', 'rejected', 'cancelled'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const { data: match } = await supabase.from('matches').select('*').eq('id', params.id).single()
  if (!match) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (status === 'cancelled' && match.requester_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (['accepted', 'rejected'].includes(status) && match.receiver_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data, error } = await supabase.from('matches').update({ status }).eq('id', params.id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const admin = createAdminClient()
  const notifTarget = status === 'cancelled' ? match.receiver_id : match.requester_id
  const notifType = status === 'accepted' ? 'match_accepted' : status === 'rejected' ? 'match_rejected' : null

  if (notifType) {
    await admin.from('notifications').insert({
      user_id: notifTarget,
      type: notifType,
      title: status === 'accepted' ? '매칭이 수락되었습니다!' : '매칭이 거절되었습니다',
      body: status === 'accepted' ? '카카오톡으로 연락해보세요!' : '다음 기회에 다시 신청해보세요.',
      match_id: match.id,
    })
  }

  return NextResponse.json(data)
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: match } = await supabase.from('matches').select('*').eq('id', params.id).single()
  if (!match) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (match.requester_id !== user.id && match.receiver_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // If accepted, fetch contact_link
  let contact_link: string | null = null
  if (match.status === 'accepted') {
    const targetId = match.requester_id === user.id ? match.receiver_id : match.requester_id
    const { data: contestProfile } = await supabase.from('contest_profiles').select('contact_link').eq('user_id', targetId).maybeSingle()
    const { data: sportsProfile } = await supabase.from('sports_profiles').select('contact_link').eq('user_id', targetId).maybeSingle()
    contact_link = contestProfile?.contact_link || sportsProfile?.contact_link || null
  }

  return NextResponse.json({ ...match, contact_link })
}
