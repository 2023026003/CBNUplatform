'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@/types'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Avatar from '@/components/ui/Avatar'
import { Camera, Trophy, Dumbbell, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null)
  const [nickname, setNickname] = useState('')
  const [nicknameError, setNicknameError] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) return
      const { data } = await supabase.from('users').select('*').eq('id', authUser.id).single()
      setUser(data)
      setNickname(data?.nickname || '')
    }
    load()
  }, [])

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    if (file.size > 5 * 1024 * 1024) { toast.error('5MB 이하 파일만 업로드 가능합니다'); return }
    setUploading(true)
    const ext = file.name.split('.').pop()
    const { data, error } = await supabase.storage.from('avatars').upload(`${user.id}.${ext}`, file, { upsert: true })
    if (error) { toast.error('업로드 실패'); setUploading(false); return }
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(data.path)
    await supabase.from('users').update({ avatar_url: publicUrl }).eq('id', user.id)
    setUser(prev => prev ? { ...prev, avatar_url: publicUrl } : null)
    toast.success('프로필 이미지가 변경되었습니다')
    setUploading(false)
  }

  const handleNicknameSave = async () => {
    if (!user || !nickname.trim()) return
    if (nickname.length < 2 || nickname.length > 10) { setNicknameError('2~10자이어야 합니다'); return }
    if (nickname === user.nickname) { toast.success('저장됨'); return }
    setSaving(true)
    const res = await fetch(`/api/auth/nickname-check?nickname=${encodeURIComponent(nickname)}`)
    const { exists } = await res.json()
    if (exists) { setNicknameError('이미 사용 중인 닉네임입니다'); setSaving(false); return }
    await supabase.from('users').update({ nickname }).eq('id', user.id)
    setUser(prev => prev ? { ...prev, nickname } : null)
    toast.success('닉네임이 변경되었습니다')
    setSaving(false)
  }

  const handleDeleteAccount = async () => {
    const res = await fetch('/api/auth/delete', { method: 'POST' })
    if (res.ok) {
      await supabase.auth.signOut()
      window.location.href = '/login'
    } else toast.error('탈퇴 처리 실패')
  }

  if (!user) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-cbnu-blue/30 border-t-cbnu-blue rounded-full animate-spin" /></div>

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <h1 className="text-xl font-bold text-slate-900">마이페이지</h1>

      {/* 아바타 */}
      <div className="card p-6">
        <h2 className="text-sm font-semibold text-slate-900 mb-4">프로필 이미지</h2>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar src={user.avatar_url} alt={user.nickname} size="xl" />
            <button onClick={() => fileRef.current?.click()}
              className="absolute bottom-0 right-0 w-7 h-7 bg-cbnu-blue rounded-full flex items-center justify-center shadow-lg hover:bg-cbnu-navy">
              <Camera className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
          <div>
            <p className="font-semibold text-slate-900">{user.nickname}</p>
            <p className="text-sm text-slate-500">{user.email}</p>
            <p className="text-xs text-slate-400 mt-0.5">학번: {user.student_id}</p>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
        </div>
      </div>

      {/* 닉네임 변경 */}
      <div className="card p-6">
        <h2 className="text-sm font-semibold text-slate-900 mb-4">닉네임 변경</h2>
        <div className="flex gap-3">
          <Input value={nickname} onChange={e => { setNickname(e.target.value); setNicknameError('') }}
            error={nicknameError} placeholder="새 닉네임 (2~10자)" />
          <Button onClick={handleNicknameSave} loading={saving} className="flex-shrink-0">저장</Button>
        </div>
      </div>

      {/* 프로필 바로가기 */}
      <div className="card p-6">
        <h2 className="text-sm font-semibold text-slate-900 mb-4">내 프로필</h2>
        <div className="flex gap-3">
          <Link href="/contest?tab=pool" className="flex-1 p-3 border border-slate-200 rounded-xl hover:border-cbnu-blue/40 transition-colors text-center">
            <Trophy className="w-6 h-6 text-cbnu-blue mx-auto mb-1.5" />
            <p className="text-xs font-medium text-slate-700">공모전 프로필</p>
          </Link>
          <Link href="/sports?tab=pool" className="flex-1 p-3 border border-slate-200 rounded-xl hover:border-cbnu-blue/40 transition-colors text-center">
            <Dumbbell className="w-6 h-6 text-cbnu-blue mx-auto mb-1.5" />
            <p className="text-xs font-medium text-slate-700">스포츠 프로필</p>
          </Link>
        </div>
      </div>

      {/* 회원탈퇴 */}
      <div className="card p-6 border-red-100">
        <h2 className="text-sm font-semibold text-red-600 mb-2">회원 탈퇴</h2>
        <p className="text-xs text-slate-500 mb-4">탈퇴 시 프로필과 게시글이 비공개 처리되며, 개인정보는 30일 후 삭제됩니다.</p>
        {!deleteConfirm ? (
          <Button variant="danger" size="sm" onClick={() => setDeleteConfirm(true)}>
            <AlertTriangle className="w-4 h-4" /> 회원 탈퇴
          </Button>
        ) : (
          <div className="flex gap-3">
            <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(false)}>취소</Button>
            <Button variant="danger" size="sm" onClick={handleDeleteAccount}>정말 탈퇴하기</Button>
          </div>
        )}
      </div>
    </div>
  )
}
