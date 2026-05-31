import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { reported_user_id, reported_post_id, reason, detail } = await request.json()

  const { data, error } = await supabase.from('reports').insert({
    reporter_id: user.id, reported_user_id, reported_post_id, reason, detail,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Check auto-blind trigger (3+ reports)
  if (reported_user_id) {
    const { count } = await supabase.from('reports')
      .select('*', { count: 'exact', head: true })
      .eq('reported_user_id', reported_user_id)
      .in('status', ['pending', 'resolved'])

    if ((count || 0) >= 3) {
      const admin = createAdminClient()
      await admin.from('users').update({ is_active: false }).eq('id', reported_user_id)
      await admin.from('contest_profiles').update({ is_visible: false }).eq('user_id', reported_user_id)
      await admin.from('sports_profiles').update({ is_visible: false }).eq('user_id', reported_user_id)
      await admin.from('contest_posts').update({ is_active: false }).eq('user_id', reported_user_id)
    }
  }

  return NextResponse.json(data, { status: 201 })
}
