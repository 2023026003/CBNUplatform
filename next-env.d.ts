'use client'
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import toast from 'react-hot-toast'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.endsWith('@chungbuk.ac.kr')) {
      toast.error('충북대 이메일을 입력해주세요')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`,
    })
    setLoading(false)
    if (error) toast.error('메일 발송에 실패했습니다')
    else setSent(true)
  }

  if (sent) return (
    <div className="min-h-screen bg-gradient-to-br from-cbnu-navy via-cbnu-blue to-blue-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center animate-slide-up">
        <p className="text-4xl mb-4">📨</p>
        <h2 className="text-xl font-bold mb-2">재설정 링크를 보냈어요</h2>
        <p className="text-sm text-slate-500 mb-6">{email}로 재설정 링크를 발송했습니다.</p>
        <Link href="/login"><Button variant="secondary" className="w-full">로그인으로</Button></Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-cbnu-navy via-cbnu-blue to-blue-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full animate-slide-up">
        <h1 className="text-xl font-bold mb-1">비밀번호 찾기</h1>
        <p className="text-sm text-slate-500 mb-6">가입한 충북대 이메일로 재설정 링크를 보내드립니다.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="학교 이메일" type="email" placeholder="student@chungbuk.ac.kr"
            value={email} onChange={e => setEmail(e.target.value)} required />
          <Button type="submit" className="w-full" loading={loading}>재설정 링크 발송</Button>
        </form>
        <p className="text-center text-sm text-slate-500 mt-4">
          <Link href="/login" className="text-cbnu-blue hover:underline">로그인으로 돌아가기</Link>
        </p>
      </div>
    </div>
  )
}
