import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data } = await supabase.from('notifications').select('*')
    .eq('user_id', user.id).order('created_at', { ascending: false }).limit(50)
  return NextResponse.json(data)
}

export async function PATCH(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await request.json()
  await supabase.from('notifications').update({ is_read: true }).eq('id', id).eq('user_id', user.id)
  return NextResponse.json({ success: true })
}
