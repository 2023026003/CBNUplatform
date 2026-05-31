import { createAdminClient } from '@/lib/supabase/admin'
import { validateChungbukEmail } from '@/lib/utils'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email, password, nickname, studentId } = await request.json()

    if (!validateChungbukEmail(email)) {
      return NextResponse.json({ error: '충북대학교 이메일만 가입 가능합니다' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
      user_metadata: { nickname, student_id: studentId },
    })

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    // Insert user record
    await supabase.from('users').insert({
      id: data.user.id,
      email,
      nickname,
      student_id: studentId,
    })

    // Send confirmation email via Supabase Auth (generateLink requires password for signup type)
    await supabase.auth.admin.generateLink({
      type: 'signup',
      email,
      password: Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2),
      options: { redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback` },
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
