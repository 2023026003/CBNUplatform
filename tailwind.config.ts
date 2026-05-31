'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        if (error.message.includes('Email not confirmed')) {
          toast.error('이메일 인증을 완료해주세요.')
        } else {
          toast.error('이메일 또는 비밀번호가 올바르지 않습니다.')
        }
        return
      }
      router.push(searchParams.get('redirect') || '/')
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cbnu-navy via-cbnu-blue to-blue-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 animate-slide-up">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-cbnu-blue rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl font-bold">충</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">충북대 매칭</h1>
          <p className="text-sm text-slate-500 mt-1">공모전 팀원 · 스포츠 파트너 매칭</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <Input label="학교 이메일" type="email" placeholder="student@chungbuk.ac.kr"
            value={email} onChange={e => setEmail(e.target.value)} required />
          <Input label="비밀번호" type="password" placeholder="비밀번호를 입력하세요"
            value={password} onChange={e => setPassword(e.target.value)} required />
          <Button type="submit" className="w-full" size="lg" loading={loading}>로그인</Button>
        </form>
        <div className="mt-6 text-center space-y-2">
          <Link href="/forgot-password" className="text-sm text-cbnu-blue hover:underline block">
            비밀번호를 잊으셨나요?
          </Link>
          <p className="text-sm text-slate-500">
            계정이 없으신가요?{' '}
            <Link href="/signup" className="text-cbnu-blue font-medium hover:underline">회원가입</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
