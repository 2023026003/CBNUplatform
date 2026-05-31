'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ContestPost } from '@/types'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { ArrowLeft, Users, Calendar } from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'
import MatchRequestModal from '@/components/matches/MatchRequestModal'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function ContestPostDetailPage() {
  const { id } = useParams() as { id: string }
  const [post, setPost] = useState<ContestPost | null>(null)
  const [matchOpen, setMatchOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const [{ data: postData }, { data: { user } }] = await Promise.all([
        supabase.from('contest_posts').select('*, user:users(id,nickname,avatar_url), contest:contests(title)').eq('id', id).single(),
        supabase.auth.getUser()
      ])
      setPost(postData)
      setCurrentUser(user)
    }
    load()
  }, [id])

  const handleClose = async () => {
    if (!post) return
    const { error } = await supabase.from('contest_posts').update({ is_active: false }).eq('id', post.id)
    if (!error) { toast.success('모집 완료 처리했습니다'); setPost(prev => prev ? {...prev, is_active: false} : null) }
  }

  if (!post) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-cbnu-blue/30 border-t-cbnu-blue rounded-full animate-spin" /></div>

  const author = post.user as any
  const isAuthor = currentUser?.id === post.user_id

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <Link href="/contest?tab=posts" className="inline-flex items-center gap-1 text-sm text-cbnu-blue hover:underline mb-4">
        <ArrowLeft className="w-4 h-4" /> 모집 게시판
      </Link>

      <div className="card p-6 mb-4">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 mb-1">{post.title}</h1>
            {!post.is_active && <Badge variant="gray">모집 완료</Badge>}
          </div>
          <div className="flex items-center gap-1 text-sm text-slate-600">
            <Users className="w-4 h-4" />
            <span>{(post.current_count ?? post.current_members ?? 1)}/{(post.target_count ?? post.total_members ?? 2)}명</span>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-100">
          <Avatar src={author?.avatar_url} alt={author?.nickname} size="sm" />
          <div>
            <p className="text-sm font-medium text-slate-900">{author?.nickname}</p>
            <p className="text-xs text-slate-500">{formatRelativeTime(post.created_at)}</p>
          </div>
        </div>

        {(post.contest as any)?.title && (
          <div className="mb-3 text-sm text-cbnu-blue">📌 {(post.contest as any).title}</div>
        )}

        <p className="text-sm text-slate-700 whitespace-pre-wrap mb-4">{post.content}</p>

        {((post.roles ?? post.recruiting_roles) ?? []).length > 0 && (
          <div>
            <p className="text-xs font-medium text-slate-500 mb-1.5">모집 역할</p>
            <div className="flex flex-wrap gap-1.5">
              {(post.roles ?? post.recruiting_roles ?? []).map((r: string) => <span key={r} className="tag">{r}</span>)}
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        {isAuthor && post.is_active && (
          <Button variant="secondary" className="flex-1" onClick={handleClose}>모집 완료</Button>
        )}
        {!isAuthor && post.is_active && (
          <Button className="flex-1" onClick={() => setMatchOpen(true)}>팀 지원하기</Button>
        )}
      </div>

      {!isAuthor && (
        <MatchRequestModal
          open={matchOpen}
          onClose={() => setMatchOpen(false)}
          targetUser={{ id: post.author_id ?? (post as any).user_id, nickname: author?.nickname, avatar_url: author?.avatar_url }}
          matchType="contest_post"
          postId={post.id}
        />
      )}
    </div>
  )
}
