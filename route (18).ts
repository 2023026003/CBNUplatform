import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Trophy, Dumbbell, Users, Clock, ArrowRight, Calendar } from 'lucide-react'
import { CONTEST_FIELD_LABELS, FACILITY_LABELS, getDaysUntil, formatRelativeTime } from '@/lib/utils'
import Badge from '@/components/ui/Badge'

export default async function HomePage() {
  const supabase = createClient()

  const today = new Date().toISOString().split('T')[0]

  const [{ count: availableSlots }, { data: urgentContests }, { data: recentPosts }, { data: recentSports }] = await Promise.all([
    supabase.from('sports_reservations').select('*', { count: 'exact', head: true })
      .eq('reservation_date', today).eq('status', 'available').eq('is_user_created', false),
    supabase.from('contests').select('*').eq('is_active', true)
      .gte('end_date', today).lte('end_date', new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0])
      .order('end_date').limit(3),
    supabase.from('contest_posts').select('*, user:users(nickname,avatar_url)')
      .eq('is_active', true).order('created_at', { ascending: false }).limit(3),
    supabase.from('sports_reservations').select('*, creator:users(nickname,avatar_url)')
      .eq('is_user_created', true).gte('reservation_date', today)
      .order('reservation_date').order('start_time').limit(3),
  ])

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 대시보드 카드 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card p-5 bg-gradient-to-br from-cbnu-blue to-cbnu-navy text-white border-0">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Dumbbell className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium opacity-90">오늘 이용 가능한 시설</span>
          </div>
          <div className="text-3xl font-bold">{availableSlots ?? 0}<span className="text-lg font-normal opacity-70 ml-1">개</span></div>
          <Link href="/sports" className="mt-3 text-xs opacity-70 hover:opacity-100 flex items-center gap-1">
            시설 현황 보기 <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="card p-5 bg-gradient-to-br from-amber-500 to-orange-600 text-white border-0">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Trophy className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium opacity-90">마감 임박 공모전</span>
          </div>
          <div className="text-3xl font-bold">{urgentContests?.length ?? 0}<span className="text-lg font-normal opacity-70 ml-1">개</span></div>
          <Link href="/contest" className="mt-3 text-xs opacity-70 hover:opacity-100 flex items-center gap-1">
            공모전 보기 <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* 팀원 모집 피드 */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-cbnu-blue" /> 최근 팀원 모집
          </h2>
          <Link href="/contest?tab=posts" className="text-sm text-cbnu-blue hover:underline flex items-center gap-1">
            더보기 <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="space-y-2">
          {recentPosts?.length ? recentPosts.map(post => (
            <Link key={post.id} href={`/contest/posts/${post.id}`} className="card p-4 block hover:border-cbnu-blue/30 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 text-sm truncate">{post.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-slate-500">{(post.user as any)?.nickname}</span>
                    <span className="text-xs text-slate-400">·</span>
                    <span className="text-xs text-slate-500">{formatRelativeTime(post.created_at)}</span>
                  </div>
                  {post.recruiting_roles?.length > 0 && (
                    <div className="flex gap-1 mt-1.5 flex-wrap">
                      {post.recruiting_roles.slice(0, 3).map((r: string) => (
                        <span key={r} className="tag text-xs">{r}</span>
                      ))}
                    </div>
                  )}
                </div>
                <Badge variant="blue">{post.current_members}/{post.total_members}명</Badge>
              </div>
            </Link>
          )) : (
            <div className="card p-6 text-center text-sm text-slate-500">아직 모집 글이 없습니다</div>
          )}
        </div>
      </section>

      {/* 스포츠 용병 피드 */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Dumbbell className="w-4 h-4 text-cbnu-blue" /> 최근 용병/매치 모집
          </h2>
          <Link href="/sports?tab=recruit" className="text-sm text-cbnu-blue hover:underline flex items-center gap-1">
            더보기 <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="space-y-2">
          {recentSports?.length ? recentSports.map(slot => (
            <Link key={slot.id} href={`/sports/slots/${slot.id}`} className="card p-4 block hover:border-cbnu-blue/30 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 text-sm truncate">{slot.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span className="text-xs text-slate-500">
                      {slot.reservation_date} {slot.start_time?.slice(0, 5)}~{slot.end_time?.slice(0, 5)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{FACILITY_LABELS[slot.facility] || slot.facility}</p>
                </div>
                <Badge variant={slot.match_type === 'guest' ? 'orange' : 'blue'}>
                  {slot.match_type === 'guest' ? '용병구함' : '팀매치'}
                </Badge>
              </div>
            </Link>
          )) : (
            <div className="card p-6 text-center text-sm text-slate-500">아직 모집 글이 없습니다</div>
          )}
        </div>
      </section>
    </div>
  )
}
