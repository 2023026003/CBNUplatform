'use client'
import { useState, useEffect } from 'react'
import { Match } from '@/types'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import { formatRelativeTime, FACILITY_LABELS } from '@/lib/utils'
import { MessageCircle, Clock, CheckCircle, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const STATUS_CONFIG: Record<string, { label: string; variant: 'blue' | 'green' | 'red' | 'gray' | 'yellow' }> = {
  pending: { label: '대기 중', variant: 'yellow' },
  accepted: { label: '수락됨', variant: 'green' },
  rejected: { label: '거절됨', variant: 'red' },
  cancelled: { label: '취소됨', variant: 'gray' },
  expired: { label: '만료됨', variant: 'gray' },
}

export default function MatchesPage() {
  const [tab, setTab] = useState<'received' | 'sent'>('received')
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(false)
  const [contactMap, setContactMap] = useState<Record<string, string>>({})

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const res = await fetch(`/api/matches?type=${tab}`)
      const data = await res.json()
      setMatches(data || [])
      setLoading(false)
    }
    load()
  }, [tab])

  const handleAction = async (matchId: string, status: string) => {
    const res = await fetch(`/api/matches/${matchId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      toast.success(status === 'accepted' ? '수락했습니다!' : '처리했습니다')
      setMatches(prev => prev.map(m => m.id === matchId ? { ...m, status: status as any } : m))
    } else toast.error('처리 실패')
  }

  const fetchContact = async (matchId: string) => {
    const res = await fetch(`/api/matches/${matchId}`)
    const data = await res.json()
    if (data.contact_link) {
      setContactMap(prev => ({ ...prev, [matchId]: data.contact_link }))
      window.open(data.contact_link, '_blank')
    }
  }

  return (
    <div className="space-y-4 animate-fade-in max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-slate-900">매칭 관리</h1>
      <div className="flex border-b border-slate-200">
        {[['received', '받은 신청'], ['sent', '보낸 신청']].map(([v, l]) => (
          <button key={v} onClick={() => setTab(v as any)}
            className={`px-5 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === v ? 'border-cbnu-blue text-cbnu-blue' : 'border-transparent text-slate-500'
            }`}>
            {l}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="card p-4 animate-pulse h-24" />)}</div>
      ) : matches.length === 0 ? (
        <EmptyState icon={MessageCircle} title="매칭 신청이 없습니다" description={tab === 'received' ? '받은 신청이 없습니다' : '보낸 신청이 없습니다'} />
      ) : (
        <div className="space-y-3">
          {matches.map(match => {
            const other = tab === 'received' ? match.requester : match.receiver as any
            const { label, variant } = STATUS_CONFIG[match.status] || STATUS_CONFIG.pending
            return (
              <div key={match.id} className="card p-4">
                <div className="flex items-start gap-3">
                  <Avatar src={(other as any)?.avatar_url} alt={(other as any)?.nickname} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-sm text-slate-900">{(other as any)?.nickname}</p>
                      <Badge variant={variant}>{label}</Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{formatRelativeTime(match.created_at)}</p>
                    {match.message && (
                      <p className="text-sm text-slate-700 mt-2 bg-slate-50 rounded-lg p-2.5 text-xs">{match.message}</p>
                    )}
                    {match.status === 'expired' && (
                      <p className="text-xs text-slate-500 mt-1">수락 대기 시간이 만료되어 신청이 자동 취소되었습니다.</p>
                    )}
                  </div>
                </div>

                {match.status === 'accepted' && (
                  <Button size="sm" className="w-full mt-3 bg-yellow-400 hover:bg-yellow-500 text-yellow-900"
                    onClick={() => fetchContact(match.id)}>
                    💬 카카오톡으로 연락하기
                  </Button>
                )}

                {tab === 'received' && match.status === 'pending' && (
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" variant="secondary" className="flex-1"
                      onClick={() => handleAction(match.id, 'rejected')}>
                      <XCircle className="w-4 h-4" /> 거절
                    </Button>
                    <Button size="sm" className="flex-1" onClick={() => handleAction(match.id, 'accepted')}>
                      <CheckCircle className="w-4 h-4" /> 수락
                    </Button>
                  </div>
                )}
                {tab === 'sent' && match.status === 'pending' && (
                  <Button size="sm" variant="ghost" className="w-full mt-2 text-red-500"
                    onClick={() => handleAction(match.id, 'cancelled')}>
                    신청 취소
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
