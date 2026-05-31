import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: NextRequest) {
  try {
    const { requesterId, receiverId } = await request.json()
    const supabase = createClient()

    const [{ data: r1 }, { data: r2 }] = await Promise.all([
      supabase.from('contest_profiles').select('fields,certificates,contest_count').eq('user_id', requesterId).maybeSingle(),
      supabase.from('contest_profiles').select('fields,certificates,contest_count').eq('user_id', receiverId).maybeSingle(),
    ])

    if (!r1 || !r2) return NextResponse.json({ reason: null })

    const prompt = `신청자 프로필: 분야=${r1.fields?.join(',')}, 자격증=${r1.certificates?.join(',')}, 참여횟수=${r1.contest_count}회
상대방 프로필: 분야=${r2.fields?.join(',')}, 자격증=${r2.certificates?.join(',')}, 참여횟수=${r2.contest_count}회
두 사람이 공모전 팀을 이루면 좋은 이유를 한 문장으로만 알려줘.`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 100,
      messages: [{ role: 'user', content: prompt }],
    })

    const reason = message.content[0].type === 'text' ? message.content[0].text : null
    return NextResponse.json({ reason })
  } catch (error: any) {
    return NextResponse.json({ reason: null })
  }
}
