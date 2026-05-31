'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { SportsSlot } from '@/types'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import MatchRequestModal from '@/components/matches/MatchRequestModal'
import { FACILITY_LABELS } from '@/lib/utils'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const RECRUIT_LABELS: Record<string, string> = {
  mercenary: '용병구함',
  match: '팀매치',
}

export default function SportsSlotPage() {
  const { id } = useParams() as { id: string }
  const [slot, setSlot] = useState<(SportsSlot & { author?: any }) | null>(null)
  const [matchOpen, setMatchOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const [{ data: slotData }, { data: { user } }] = await Promise.all([
        supabase
          .from('sports_slots')
          .select('*, author:users(id, nickname, avatar_url)')
          .eq('id', id)
          .single(),
        supabase.auth.getUser()
      ])
      setSlot(slotData as any)
      setCurrentUser(user)
    }
    load()
  }, [id])

  if (!slot) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    )
  }

  const author = slot.author as any
  const isAuthor = currentUser?.id === slot.author_id

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <Link href="/sports?tab=recruit" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline mb-4">
        <ArrowLeft className="w-4 h-4" /> 모집 목록
      </Link>

      <div className="bg-white border border-gray-100 rounded-xl p-6">
        <div className="flex items-start justify-between gap-3 mb-4">
          <h1 className="text-xl font-bold text-slate-900">{slot.title}</h1>
          <Badge variant={slot.recruit_type === 'mercenary' ? 'orange' : 'blue'}>
            {RECRUIT_LABELS[slot.recruit_type]}
          </Badge>
        </div>

        {/* 작성자 */}
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-100">
          <Avatar src={author?.avatar_url} alt={author?.nickname} size="sm" />
          <p className="text-sm font-medium text-slate-800">{author?.nickname}</p>
        </div>

        {/* 상세 정보 */}
        <div className="space-y-2 text-sm mb-4">
          <div className="flex gap-2">
            <span className="text-slate-500 w-20 flex-shrink-0">시설</span>
            <span className="text-slate-800">{FACILITY_LABELS[slot.facility] ?? slot.facility}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-slate-500 w-20 flex-shrink-0">날짜</span>
            <span className="text-slate-800">{slot.slot_date}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-slate-500 w-20 flex-shrink-0">시간</span>
            <span className="text-slate-800">
              {slot.start_time?.slice(0, 5)} ~ {slot.end_time?.slice(0, 5)}
            </span>
          </div>
        </div>

        {slot.description && (
          <p className="text-sm text-slate-700 whitespace-pre-wrap mb-4">
            {slot.description}
          </p>
        )}

        {!isAuthor && slot.is_active && (
          <Button className="w-full mt-2" onClick={() => setMatchOpen(true)}>
            참가 신청하기
          </Button>
        )}

        {!slot.is_active && (
          <p className="text-center text-sm text-gray-400 mt-2">모집이 마감된 슬롯입니다.</p>
        )}
      </div>

      {!isAuthor && author && matchOpen && (
        <MatchRequestModal
          open={matchOpen}
          onClose={() => setMatchOpen(false)}
          targetUser={{ id: slot.author_id, nickname: author.nickname, avatar_url: author.avatar_url }}
          matchType="sports_slot"
          reservationId={slot.id}
        />
      )}
    </div>
  )
}
