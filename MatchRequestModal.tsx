import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET() {
  const admin = createAdminClient()
  const now = new Date()

  // Expire contest matches (5 days)
  const contestExpiry = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString()
  const { data: expiredContest } = await admin.from('matches')
    .update({ status: 'expired' })
    .in('type', ['contest_user', 'contest_post'])
    .eq('status', 'pending')
    .lt('created_at', contestExpiry)
    .select('id,requester_id,receiver_id')

  // Expire sports matches (2h before start)
  const { data: pendingSports } = await admin.from('matches')
    .select('id,requester_id,receiver_id,reservation:sports_reservations(reservation_date,start_time)')
    .eq('type', 'sports_slot')
    .eq('status', 'pending')

  const sportsToExpire = pendingSports?.filter(m => {
    const res = m.reservation as any
    if (!res?.reservation_date || !res?.start_time) return false
    const slotTime = new Date(`${res.reservation_date}T${res.start_time}`)
    const twoHoursBefore = new Date(slotTime.getTime() - 2 * 60 * 60 * 1000)
    return now >= twoHoursBefore
  }).map(m => m.id) || []

  if (sportsToExpire.length > 0) {
    await admin.from('matches').update({ status: 'expired' }).in('id', sportsToExpire)
  }

  // Send expiry notifications
  const allExpired = [...(expiredContest || []), ...(pendingSports?.filter(m => sportsToExpire.includes(m.id)) || [])]
  for (const match of allExpired) {
    await admin.from('notifications').insert([
      { user_id: match.requester_id, type: 'match_expired', title: '매칭 신청 만료', body: '수락 대기 시간이 만료되어 신청이 자동 취소되었습니다.', match_id: match.id },
      { user_id: match.receiver_id, type: 'match_expired', title: '매칭 신청 만료', body: '수락 대기 시간이 만료된 신청이 있습니다.', match_id: match.id },
    ])
  }

  return NextResponse.json({ expired: allExpired.length })
}
