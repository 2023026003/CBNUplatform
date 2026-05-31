import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const nickname = request.nextUrl.searchParams.get('nickname')
  if (!nickname) return NextResponse.json({ exists: false })
  const supabase = createClient()
  const { data } = await supabase.from('users').select('id').eq('nickname', nickname).maybeSingle()
  return NextResponse.json({ exists: !!data })
}
