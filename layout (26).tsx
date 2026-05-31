'use client'
import { useState, useEffect } from 'react'
import Tabs from '@/components/ui/Tabs'
import { Calendar, Users, Plus } from 'lucide-react'
import { useSearchParams, useRouter } from 'next/navigation'
import FacilityTimeline from '@/components/sports/FacilityTimeline'
import SportsRecruitList from '@/components/sports/SportsRecruitList'
import SportsProfileModal from '@/components/sports/SportsProfileModal'
import CreateSportsPostModal from '@/components/sports/CreateSportsPostModal'
import Button from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import { SportsProfile } from '@/types'

const TABS = [
  { id: 'facilities', label: '시설 현황', icon: <Calendar className="w-4 h-4" /> },
  { id: 'recruit', label: '용병/매치', icon: <Users className="w-4 h-4" /> },
]

export default function SportsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'facilities')
  const [profileOpen, setProfileOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [myProfile, setMyProfile] = useState<SportsProfile | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('sports_profiles').select('*').eq('user_id', user.id).maybeSingle()
      setMyProfile(data)
    }
    load()
  }, [])

  const handleTabChange = (t: string) => {
    setActiveTab(t)
    router.push(`/sports?tab=${t}`, { scroll: false })
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">스포츠</h1>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setProfileOpen(true)}>
            스포츠 프로필 {myProfile ? '수정' : '등록'}
          </Button>
          {activeTab === 'recruit' && (
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="w-4 h-4" /> 모집 등록
            </Button>
          )}
        </div>
      </div>

      <Tabs tabs={TABS} active={activeTab} onChange={handleTabChange} />

      {activeTab === 'facilities' && <FacilityTimeline />}
      {activeTab === 'recruit' && <SportsRecruitList />}

      <SportsProfileModal open={profileOpen} onClose={() => { setProfileOpen(false) }} profile={myProfile} />
      <CreateSportsPostModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  )
}
