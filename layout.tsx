'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Report } from '@/types'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Avatar from '@/components/ui/Avatar'
import EmptyState from '@/components/ui/EmptyState'
import { Shield, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function AdminPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [filter, setFilter] = useState<'pending' | 'resolved' | 'dismissed'>('pending')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const { data } = await supabase.from('reports')
        .select('*, reporter:users!reporter_id(nickname,avatar_url), reported_user:users!reported_user_id(id,nickname,avatar_url)')
        .eq('status', filter).order('created_at', { ascending: false })
      setReports(data || [])
      setLoading(false)
    }
    load()
  }, [filter])

  const handleReport = async (id: string, status: 'resolved' | 'dismissed') => {
    const res = await fetch(`/api/reports/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      toast.success('처리 완료')
      setReports(prev => prev.filter(r => r.id !== id))
    }
  }

  const handleUnblind = async (userId: string) => {
    const { error } = await supabase.from('users').update({ is_active: true }).eq('id', userId)
    if (!error) toast.success('블라인드 해제됨')
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-2">
        <Shield className="w-5 h-5 text-cbnu-blue" />
        <h1 className="text-xl font-bold text-slate-900">관리자 대시보드</h1>
      </div>

      <div className="flex border-b border-slate-200">
        {[['pending', '처리 대기'], ['resolved', '처리됨'], ['dismissed', '기각됨']].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v as any)}
            className={`px-5 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
              filter === v ? 'border-cbnu-blue text-cbnu-blue' : 'border-transparent text-slate-500'
            }`}>
            {l}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="card p-4 animate-pulse h-24" />)}</div>
      ) : reports.length === 0 ? (
        <EmptyState icon={Shield} title="신고 없음" description="현재 처리할 신고가 없습니다" />
      ) : (
        <div className="space-y-3">
          {reports.map(report => {
            const reporter = report.reporter as any
            const reportedUser = (report as any).target_user ?? (report as any).reported_user
            return (
              <div key={report.id} className="card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm font-semibold text-slate-900">{report.reason}</span>
                    </div>
                    {report.detail && <p className="text-sm text-slate-600 mb-2">{report.detail}</p>}
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span>신고자: {reporter?.nickname}</span>
                      {reportedUser && <span>피신고자: {reportedUser?.nickname}</span>}
                      <span>{formatRelativeTime(report.created_at)}</span>
                    </div>
                  </div>
                  {filter === 'pending' && (
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" className="text-red-500"
                        onClick={() => handleReport(report.id, 'dismissed')}>기각</Button>
                      <Button size="sm" onClick={() => handleReport(report.id, 'resolved')}>처리</Button>
                    </div>
                  )}
                  {reportedUser && filter === 'resolved' && (
                    <Button size="sm" variant="secondary" onClick={() => handleUnblind(reportedUser.id)}>블라인드 해제</Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
