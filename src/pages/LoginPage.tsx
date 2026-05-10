import { Link, useNavigate } from 'react-router-dom'
import { ExternalLink, GraduationCap, LogIn, ShieldCheck } from 'lucide-react'
import logoUrl from '../assets/logo.png'
import { buildSsoLoginUrl, clearAuthSession } from '../lib/auth'

export default function LoginPage() {
  const navigate = useNavigate()

  const handleSsoLogin = () => {
    clearAuthSession()
    window.location.assign(buildSsoLoginUrl())
  }

  const handleNewUserDemo = () => {
    clearAuthSession()
    navigate(
      '/auth/sso/callback?token=dev-sso-access-token&name=김민준&studentId=20260001&department=AI소프트웨어학부&hasCouncil=false',
    )
  }

  const handleActiveUserDemo = () => {
    clearAuthSession()
    navigate(
      '/main?accessToken=dev-sso-access-token&refreshToken=dev-sso-refresh-token&name=김민준&studentId=20260001&department=AI소프트웨어학부&hasCouncil=true&joinStatus=ACTIVE',
    )
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

          {import.meta.env.DEV && (
            <>
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-2 text-xs text-slate-400">개발 확인</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button onClick={handleNewUserDemo} className="btn-secondary justify-center py-2.5">
                  <LogIn size={15} />
                  신규 SSO
                </button>
                <button onClick={handleActiveUserDemo} className="btn-secondary justify-center py-2.5">
                  <ShieldCheck size={15} />
                  등록 회원
                </button>
              </div>
            </>
          )}
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
