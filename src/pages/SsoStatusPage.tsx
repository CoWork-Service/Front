import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Clock3, LogOut, ShieldOff } from 'lucide-react'
import logoUrl from '../assets/logo.png'
import { logoutSession } from '../lib/auth'

export default function SsoStatusPage({ status }: { status: 'pending' | 'rejected' }) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const user = {
    name: searchParams.get('name') || undefined,
    studentId: searchParams.get('studentId') || undefined,
  }
  const isPending = status === 'pending'

  const handleLogout = () => {
    void logoutSession().finally(() => {
      navigate('/login', { replace: true })
    })
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center justify-center">
            <img src={logoUrl} alt="CoWork 로고" className="w-24 h-24 object-contain mb-2" />
          </Link>
          <p className="text-sm text-slate-500">학생회 행정 플랫폼</p>
        </div>

        <div className="card p-7 text-center">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${
              isPending ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'
            }`}
          >
            {isPending ? <Clock3 size={22} /> : <ShieldOff size={22} />}
          </div>
          <h2 className="text-base font-semibold text-slate-900">
            {isPending ? '가입 신청 대기중' : '가입 신청이 거절되었습니다'}
          </h2>
          <p className="text-sm text-slate-500 mt-2">
            {user?.name ? `${user.name}님의 ` : ''}
            {isPending ? '학생회 가입 승인을 기다리고 있습니다.' : '학생회 관리자에게 상태를 확인해주세요.'}
          </p>
          {user?.studentId && <p className="text-xs text-slate-400 font-mono mt-2">{user.studentId}</p>}

          <button onClick={handleLogout} className="btn-secondary w-full justify-center mt-6">
            <LogOut size={16} />
            다른 계정으로 로그인
          </button>
        </div>
      </div>
    </div>
  )
}
