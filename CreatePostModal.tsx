import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Deactivate profiles and posts
  await supabase.from('contest_profiles').update({ is_visible: false }).eq('user_id', user.id)
  await supabase.from('sports_profiles').update({ is_visible: false }).eq('user_id', user.id)
  await supabase.from('contest_posts').update({ is_active: false }).eq('user_id', user.id)
  await supabase.from('users').update({ is_active: false }).eq('id', user.id)

  return NextResponse.json({ success: true })
}
