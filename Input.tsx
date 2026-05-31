'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { SportsProfile, User } from '@/types'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import Button from '@/components/ui/Button'
import SportsProfileModal from '@/components/sports/SportsProfileModal'
import MatchRequestModal from '@/components/matches/MatchRequestModal'
import ReportButton from '@/components/common/ReportButton'
import { Users, Filter } from 'lucide-react'

const SPORTS_LABELS: Record<string, string> = {
  futsal: '풋살',
  basketball: '농구',
  tennis: '테니스',
  badminton: '배드민턴',
  baseball: '야구',
  volleyball: '배구',
  tabletennis: '탁구',
  etc: '기타',
}

type PoolUser = SportsProfile & { user: User }

export default function SportsPoolPage() {
  const supabase = createClient()

  const [profiles, setProfiles] = useState<PoolUser[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [selectedSport, setSelectedSport] = useState<string>('all')
  const [showEliteOnly, setShowEliteOnly] = useState(false)
  const [myProfile, setMyProfile] = useState<SportsProfile | null>(null)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [matchTarget, setMatchTarget] = useState<PoolUser | null>(null)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCurrentUserId(user.id)
        const { data } = await supabase
          .from('sports_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single()
        setMyProfile(data)
      }
      await fetchProfiles()
    }
    init()
  }, [])

  const fetchProfiles = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('sports_profiles')
      .select(`
        *,
        user:users(id, nickname, avatar_url, is_active)
      `)
      .eq('is_visible', true)
      .order('created_at', { ascending: false })

    setProfiles((data as PoolUser[]) ?? [])
    setLoading(false)
  }

  const filtered = profiles.filter((p) => {
    if (!p.user?.is_active) return false
    if (showEliteOnly && !p.is_elite) return false
    if (selectedSport !== 'all' && !p.sports?.includes(selectedSport as any)) return false
    return true
  })

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">스포츠 인력풀</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            함께 운동할 파트너를 찾아보세요
          </p>
        </div>
        <Button
          size="sm"
          variant={myProfile ? 'secondary' : 'primary'}
          onClick={() => setShowProfileModal(true)}
        >
          {myProfile ? '프로필 수정' : '프로필 등록'}
        </Button>
      </div>

      {/* 필터 */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 mb-5 space-y-3">
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-gray-400" />
          <span className="text-sm font-medium text-gray-600">종목 필터</span>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedSport('all')}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              selectedSport === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            전체
          </button>
          {Object.entries(SPORTS_LABELS).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setSelectedSport(value)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedSport === value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showEliteOnly}
            onChange={(e) => setShowEliteOnly(e.target.checked)}
            className="rounded text-blue-600"
          />
          <span className="text-sm text-gray-600">선출 선수만 보기</span>
        </label>
      </div>

      {/* 결과 수 */}
      <p className="text-sm text-gray-500 mb-4">
        총 <span className="font-semibold text-gray-800">{filtered.length}</span>명
      </p>

      {/* 유저 카드 목록 */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-44 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Users className="w-10 h-10 text-gray-300" />}
          title="등록된 프로필이 없습니다"
          description="아직 스포츠 프로필을 등록한 사용자가 없습니다."
          action={
            !myProfile ? (
              <Button size="sm" onClick={() => setShowProfileModal(true)}>
                내 프로필 등록하기
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map((profile) => (
            <SportUserCard
              key={profile.id}
              profile={profile}
              currentUserId={currentUserId}
              onMatchRequest={() => setMatchTarget(profile)}
            />
          ))}
        </div>
      )}

      {/* 스포츠 프로필 모달 */}
      {showProfileModal && (
        <SportsProfileModal
          open={showProfileModal}
          profile={myProfile}
          onClose={() => {
            setShowProfileModal(false)
            fetchProfiles()
          }}
        />
      )}

      {/* 매칭 신청 모달 */}
      {matchTarget && (
        <MatchRequestModal
          open={true}
          targetUser={{
            id: matchTarget.user_id,
            nickname: matchTarget.user?.nickname ?? '',
            avatar_url: matchTarget.user?.avatar_url,
          }}
          matchType="contest_pool"
          onClose={() => setMatchTarget(null)}
        />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// 카드 컴포넌트
// ─────────────────────────────────────────────
function SportUserCard({
  profile,
  currentUserId,
  onMatchRequest,
}: {
  profile: PoolUser
  currentUserId: string | null
  onMatchRequest: () => void
}) {
  const isSelf = profile.user_id === currentUserId

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start gap-3">
        <Avatar
          src={profile.user?.avatar_url}
          alt={profile.user?.nickname}
          size="md"
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-gray-900 truncate text-sm">
                {profile.user?.nickname ?? '알 수 없음'}
              </span>
              {profile.is_elite && (
                <Badge variant="blue">선출</Badge>
              )}
            </div>
            {!isSelf && (
              <ReportButton
                targetUserId={profile.user_id}
                targetNickname={profile.user?.nickname}
              />
            )}
          </div>

          <p className="text-xs text-gray-400 mt-0.5">
            {profile.age}세 · 경력 {profile.career_years}년
          </p>

          {/* 관심 종목 태그 */}
          {profile.sports && profile.sports.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {profile.sports.slice(0, 4).map((s) => (
                <span
                  key={s}
                  className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full"
                >
                  {SPORTS_LABELS[s] ?? s}
                </span>
              ))}
              {profile.sports.length > 4 && (
                <span className="text-xs text-gray-400">
                  +{profile.sports.length - 4}
                </span>
              )}
            </div>
          )}

          {/* 자기소개 */}
          {profile.bio && (
            <p className="text-xs text-gray-500 mt-2 line-clamp-2">{profile.bio}</p>
          )}
        </div>
      </div>

      {!isSelf && (
        <Button
          size="sm"
          className="w-full mt-3"
          onClick={onMatchRequest}
        >
          파트너 신청
        </Button>
      )}
    </div>
  )
}
