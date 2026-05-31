import { createAdminClient } from '@/lib/supabase/admin'
import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: NextRequest) {
  try {
    const { contestId, url, content } = await request.json()

    const prompt = content
      ? `다음 공모전 내용을 핵심 일정, 지원 자격, 시상 혜택 3가지로 각각 한 줄씩 요약해줘. 불필요한 설명 없이 요약만 제공해:\n\n${content.slice(0, 3000)}`
      : `공모전 URL: ${url}\n이 공모전의 핵심 일정, 지원 자격, 시상 혜택을 각각 한 줄씩 총 3줄로 요약해줘. 정보가 없으면 "정보 없음"이라고 해.`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    })

    const summary = message.content[0].type === 'text' ? message.content[0].text : null

    // Cache summary
    if (contestId && summary) {
      const admin = createAdminClient()
      await admin.from('contests').update({ summary }).eq('id', contestId)
    }

    return NextResponse.json({ summary })
  } catch (error: any) {
    console.error('Claude API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
