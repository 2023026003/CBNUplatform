'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Notification } from '@/types'
import { Bell, Check } from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'
import EmptyState from '@/components/ui/EmptyState'
import Button from '@/components/ui/Button'
import Link from 'next/link'

const NOTIF_ICONS: Record<string, string> = {
  match_request: '📩',
  match_accepted: '🎉',
  match_rejected: '😔',
  match_expired: '⏰',
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('notifications').select('*')
        .eq('user_id', user.id).order('created_at', { ascending: false }).limit(50)
      setNotifications(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const markRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
  }

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.is_read).map(n => n.id)
    if (!unread.length) return
    await supabase.from('notifications').update({ is_read: true }).in('id', unread)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <div className="max-w-2xl mx-auto space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">알림</h1>
        {unreadCount > 0 && (
          <Button size="sm" variant="ghost" onClick={markAllRead}>
            <Check className="w-4 h-4" /> 모두 읽음
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="card p-4 animate-pulse h-16" />)}</div>
      ) : notifications.length === 0 ? (
        <EmptyState icon={Bell} title="알림이 없습니다" description="새로운 알림이 생기면 여기서 확인하세요" />
      ) : (
        <div className="space-y-2">
          {notifications.map(n => (
            <div key={n.id}
              className={`card p-4 cursor-pointer transition-colors ${!n.is_read ? 'bg-cbnu-light border-cbnu-blue/20' : ''}`}
              onClick={() => { markRead(n.id); if (n.match_id) window.location.href = '/matches' }}>
              <div className="flex items-start gap-3">
                <span className="text-xl">{NOTIF_ICONS[n.type] || '🔔'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-sm font-medium ${!n.is_read ? 'text-cbnu-blue' : 'text-slate-900'}`}>{n.title}</p>
                    {!n.is_read && <span className="w-2 h-2 bg-cbnu-blue rounded-full flex-shrink-0" />}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{n.body}</p>
                  <p className="text-xs text-slate-400 mt-1">{formatRelativeTime(n.created_at)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
