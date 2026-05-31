import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ExternalLink, Calendar, Trophy, ArrowLeft, Sparkles } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import { CONTEST_FIELD_LABELS, formatDate } from '@/lib/utils'

export default async function ContestDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: contest } = await supabase.from('contests').select('*').eq('id', params.id).single()
  if (!contest) notFound()

  let summary: string | null = null
  if (contest.summary) {
    summary = contest.summary
  } else {
    // Try to generate summary via API
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/claude/summarize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contestId: contest.id, url: contest.url }),
        cache: 'no-store',
      })
      if (res.ok) {
        const data = await res.json()
        summary = data.summary
      }
    } catch {}
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <Link href="/contest" className="inline-flex items-center gap-1 text-sm text-cbnu-blue hover:underline mb-4">
        <ArrowLeft className="w-4 h-4" /> 공모전 목록
      </Link>

      {contest.thumbnail_url && (
        <div className="w-full h-48 rounded-2xl overflow-hidden mb-6 bg-slate-100">
          <img src={contest.thumbnail_url} alt={contest.title} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="card p-6 mb-4">
        <div className="flex items-start justify-between gap-3 mb-4">
          <h1 className="text-xl font-bold text-slate-900">{contest.title}</h1>
          <Badge variant="blue">{CONTEST_FIELD_LABELS[contest.field]}</Badge>
        </div>
        <div className="space-y-2 text-sm">
          {contest.organizer && (
            <div className="flex gap-2"><span className="text-slate-500 w-20 flex-shrink-0">주최</span><span className="text-slate-800">{contest.organizer}</span></div>
          )}
          {contest.start_date && (
            <div className="flex gap-2"><span className="text-slate-500 w-20 flex-shrink-0">접수 기간</span><span className="text-slate-800">{contest.start_date} ~ {contest.end_date}</span></div>
          )}
          {contest.prize && (
            <div className="flex gap-2"><span className="text-slate-500 w-20 flex-shrink-0">시상</span><span className="text-slate-800">{contest.prize}</span></div>
          )}
          {contest.target && (
            <div className="flex gap-2"><span className="text-slate-500 w-20 flex-shrink-0">지원 대상</span><span className="text-slate-800">{contest.target}</span></div>
          )}
        </div>
        <a href={contest.url} target="_blank" rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-1.5 text-sm text-cbnu-blue hover:underline">
          <ExternalLink className="w-4 h-4" /> 원본 페이지 보기
        </a>
      </div>

      {summary && (
        <div className="card p-5 border-cbnu-blue/30 bg-cbnu-light">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-cbnu-blue" />
            <span className="text-sm font-semibold text-cbnu-blue">AI 요약</span>
          </div>
          <p className="text-sm text-slate-700 whitespace-pre-line">{summary}</p>
        </div>
      )}
    </div>
  )
}
