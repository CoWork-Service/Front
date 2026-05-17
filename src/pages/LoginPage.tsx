import { Link, Navigate } from 'react-router-dom'
import { ExternalLink, GraduationCap, ShieldCheck } from 'lucide-react'
import logoUrl from '../assets/logo.png'
import { buildSsoLoginUrl, logoutSession } from '../lib/auth'
import { useAuth } from '../lib/authState'

export default function LoginPage() {
  const { status } = useAuth()

  const handleSsoLogin = () => {
    void logoutSession().finally(() => {
      window.location.assign(buildSsoLoginUrl())
    })
  }

  if (status === 'authenticated') {
    return <Navigate to="/home" replace />
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <img src={logoUrl} alt="CoWork 로고" className="w-24 h-24 mx-auto object-contain mb-2" />
          <p className="text-sm text-slate-500">학생회 행정 플랫폼</p>
        </div>

        <div className="card p-6 shadow-md">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center">
              <GraduationCap size={21} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">숭실대 SSO 로그인</h2>
              <p className="text-xs text-slate-500 mt-0.5">SmartID 인증 후 학생회 정보를 확인합니다.</p>
            </div>
          </div>

          <button onClick={handleSsoLogin} className="btn-primary w-full justify-center py-2.5">
            <ShieldCheck size={16} />
            숭실대 SSO로 로그인
            <ExternalLink size={14} className="ml-auto" />
          </button>
        </div>

        <p className="text-center mt-4 text-sm text-slate-500">
          <Link to="/" className="text-blue-600 hover:underline">
            랜딩 페이지로 돌아가기
          </Link>
        </p>
      </div>
    </div>
  )
}
