'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Tabs from '@/components/ui/Tabs'
import { Search, Trophy, Users, Filter, Plus } from 'lucide-react'
import { useSearchParams, useRouter } from 'next/navigation'
import ContestCard from '@/components/contest/ContestCard'
import ContestPostCard from '@/components/contest/ContestPostCard'
import UserPoolCard from '@/components/contest/UserPoolCard'
import ContestProfileModal from '@/components/contest/ContestProfileModal'
import CreatePostModal from '@/components/contest/CreatePostModal'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import { Contest, ContestProfile, ContestPost } from '@/types'
import { CONTEST_FIELD_LABELS } from '@/lib/utils'

const TABS = [
  { id: 'contests', label: '공모전 목록', icon: <Trophy className="w-4 h-4" /> },
  { id: 'pool', label: '인력풀', icon: <Users className="w-4 h-4" /> },
  { id: 'posts', label: '팀원 모집', icon: <Users className="w-4 h-4" /> },
]

const FIELDS = ['all', 'marketing', 'video', 'design', 'literature', 'it', 'arts', 'academic']

export default function ContestPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'contests')
  const [field, setField] = useState('all')
  const [search, setSearch] = useState('')
  const [contests, setContests] = useState<Contest[]>([])
  const [profiles, setProfiles] = useState<ContestProfile[]>([])
  const [posts, setPosts] = useState<ContestPost[]>([])
  const [loading, setLoading] = useState(false)
  const [profileModalOpen, setProfileModalOpen] = useState(false)
  const [createPostOpen, setCreatePostOpen] = useState(false)
  const [myProfile, setMyProfile] = useState<ContestProfile | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchData()
    fetchMyProfile()
  }, [activeTab, field])

  const fetchMyProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('contest_profiles').select('*').eq('user_id', user.id).maybeSingle()
    setMyProfile(data)
  }

  const fetchData = async () => {
    setLoading(true)
    if (activeTab === 'contests') {
      let q = supabase.from('contests').select('*').eq('is_active', true).order('end_date')
      if (field !== 'all') q = q.eq('field', field)
      if (search) q = q.ilike('title', `%${search}%`)
      const { data } = await q.limit(20)
      setContests(data || [])
    } else if (activeTab === 'pool') {
      let q = supabase.from('contest_profiles').select('*, user:users(id,nickname,avatar_url)').eq('is_visible', true)
      if (field !== 'all') q = q.contains('fields', [field])
      const { data } = await q.limit(20)
      setProfiles(data || [])
    } else {
      let q = supabase.from('contest_posts').select('*, user:users(nickname,avatar_url), contest:contests(title,field)').eq('is_active', true).order('created_at', { ascending: false })
      const { data } = await q.limit(20)
      setPosts(data || [])
    }
    setLoading(false)
  }

  const handleTabChange = (t: string) => {
    setActiveTab(t)
    router.push(`/contest?tab=${t}`, { scroll: false })
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">공모전</h1>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setProfileModalOpen(true)}>
            내 프로필 {myProfile ? '수정' : '등록'}
          </Button>
          {activeTab === 'posts' && (
            <Button size="sm" onClick={() => setCreatePostOpen(true)}>
              <Plus className="w-4 h-4" /> 글 작성
            </Button>
          )}
        </div>
      </div>

      <Tabs tabs={TABS} active={activeTab} onChange={handleTabChange} />

      <div className="flex gap-2 flex-wrap">
        {FIELDS.map(f => (
          <button key={f}
            onClick={() => setField(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              field === f ? 'bg-cbnu-blue text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-cbnu-blue/40'
            }`}>
            {f === 'all' ? '전체' : CONTEST_FIELD_LABELS[f]}
          </button>
        ))}
      </div>

      {activeTab === 'contests' && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            className="input pl-9"
            placeholder="공모전 검색..."
            value={search}
            onChange={e => { setSearch(e.target.value); fetchData() }}
          />
        </div>
      )}

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-slate-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {activeTab === 'contests' && (
            contests.length > 0
              ? <div className="grid gap-3 sm:grid-cols-2">{contests.map(c => <ContestCard key={c.id} contest={c} />)}</div>
              : <EmptyState icon={Trophy} title="공모전이 없습니다" description="다른 분야를 선택해보세요" />
          )}
          {activeTab === 'pool' && (
            profiles.length > 0
              ? <div className="grid gap-3 sm:grid-cols-2">{profiles.map(p => <UserPoolCard key={p.id} profile={p} />)}</div>
              : <EmptyState icon={Users} title="등록된 인재가 없습니다" description="먼저 프로필을 등록해보세요" />
          )}
          {activeTab === 'posts' && (
            posts.length > 0
              ? <div className="space-y-3">{posts.map(p => <ContestPostCard key={p.id} post={p} />)}</div>
              : <EmptyState icon={Users} title="모집글이 없습니다" description="첫 번째 팀원 모집 글을 작성해보세요"
                  action={<Button size="sm" onClick={() => setCreatePostOpen(true)}>글 작성하기</Button>} />
          )}
        </>
      )}

      <ContestProfileModal open={profileModalOpen} onClose={() => { setProfileModalOpen(false); fetchMyProfile() }} profile={myProfile} />
      <CreatePostModal open={createPostOpen} onClose={() => { setCreatePostOpen(false); fetchData() }} />
    </div>
  )
}
