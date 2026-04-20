import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Lock, User } from 'lucide-react'

export default function LoginPage() {
  const navigate = useNavigate()
  const [id, setId] = useState('')
  const [pw, setPw] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (!id || !pw) {
      setError('아이디와 비밀번호를 입력해주세요.')
      return
    }
    // 더미 로그인 처리
    localStorage.setItem('cowork_auth', 'true')
    navigate('/home')
  }

  const handleDemo = () => {
    localStorage.setItem('cowork_auth', 'true')
    navigate('/home')
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* 로고 */}
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-blue-600 items-center justify-center mb-3">
            <span className="text-white font-bold text-2xl">두</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">CoWork</h1>
          <p className="text-sm text-slate-500 mt-1">학생회 행정 플랫폼</p>
        </div>

        <div className="card p-6 shadow-md">
          <h2 className="text-base font-semibold text-slate-800 mb-5">로그인</h2>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="label">아이디</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                  placeholder="학생회 계정 아이디"
                  className="input pl-9"
                />
              </div>
            </div>
            <div>
              <label className="label">비밀번호</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  placeholder="비밀번호"
                  className="input pl-9 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button type="submit" className="btn-primary w-full justify-center py-2.5">
              로그인
            </button>
          </form>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs text-slate-400 bg-white px-2">또는</div>
          </div>

          <button
            onClick={handleDemo}
            className="btn-secondary w-full justify-center py-2.5"
          >
            관리자 데모 로그인
          </button>
        </div>

        <p className="text-center mt-4 text-sm text-slate-500">
          <Link to="/" className="text-blue-600 hover:underline">
            ← 랜딩 페이지로 돌아가기
          </Link>
        </p>
      </div>
    </div>
  )
}
