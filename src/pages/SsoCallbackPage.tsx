import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Loader2, ShieldCheck, TriangleAlert } from 'lucide-react'
import logoUrl from '../assets/logo.png'
import {
  hasAuthenticatedSession,
  normalizeJoinStatus,
  parseBooleanParam,
  saveAuthSession,
  userFromToken,
  type AuthUser,
} from '../lib/auth'

export default function SsoCallbackPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [error, setError] = useState('')

  useEffect(() => {
    const processCallback = () => {
      const errorMessage = searchParams.get('error') || searchParams.get('message')
      if (errorMessage) {
        setError(errorMessage)
        return
      }

      const tempToken = searchParams.get('tempToken')
      const accessToken = searchParams.get('accessToken') || searchParams.get('token')

      if (tempToken) {
        saveAuthSession({
          tempToken,
          user: userFromSearchParams(searchParams),
          onboardingRequired: true,
          onboardingStatus: 'select',
        })
        navigate(`/onboarding?tempToken=${encodeURIComponent(tempToken)}`, { replace: true })
        return
      }

      const tokenUser = accessToken ? userFromToken(accessToken) : {}
      const queryUser = userFromSearchParams(searchParams)

      if (!accessToken && !hasUserIdentity(queryUser)) {
        if (hasAuthenticatedSession()) {
          navigate('/home', { replace: true })
          return
        }
        setError('SSO 로그인 결과를 확인할 수 없습니다.')
        return
      }

      const user: AuthUser = {
        ...tokenUser,
        ...queryUser,
        name: queryUser.name || tokenUser.name || 'SSO 사용자',
        joinStatus: normalizeJoinStatus(queryUser.joinStatus || tokenUser.joinStatus),
      }

      if (user.joinStatus === 'PENDING') {
        saveAuthSession({
          user,
          authenticated: false,
          onboardingRequired: true,
          onboardingStatus: 'pending',
        })
        navigate('/pending', { replace: true })
        return
      }

      if (user.joinStatus === 'REJECTED') {
        saveAuthSession({
          user,
          authenticated: false,
          onboardingRequired: true,
          onboardingStatus: 'rejected',
        })
        navigate('/rejected', { replace: true })
        return
      }

      const hasCouncilParam = searchParams.get('hasCouncil')
      const hasCouncil =
        hasCouncilParam === null
          ? true
          : parseBooleanParam(hasCouncilParam) || Boolean(user.organizationId || user.organizationName)

      if (!hasCouncil) {
        saveAuthSession({
          user,
          authenticated: false,
          onboardingRequired: true,
          onboardingStatus: 'select',
        })
        navigate('/onboarding', { replace: true })
        return
      }

      saveAuthSession({
        user: { ...user, joinStatus: user.joinStatus === 'UNKNOWN' ? 'ACTIVE' : user.joinStatus },
        authenticated: true,
        onboardingRequired: false,
      })
      navigate('/home', { replace: true })
    }

    processCallback()
  }, [navigate, searchParams])

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <img src={logoUrl} alt="CoWork 로고" className="w-24 h-24 mx-auto object-contain mb-2" />
          <p className="text-sm text-slate-500">학생회 행정 플랫폼</p>
        </div>

        <div className="card p-6 text-center">
          {error ? (
            <>
              <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4">
                <TriangleAlert size={22} />
              </div>
              <h2 className="text-base font-semibold text-slate-900 mb-2">SSO 로그인 실패</h2>
              <p className="text-sm text-slate-500 mb-5">{error}</p>
              <Link to="/login" className="btn-secondary w-full justify-center">
                로그인으로 돌아가기
              </Link>
            </>
          ) : (
            <>
              <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
                <ShieldCheck size={22} />
              </div>
              <h2 className="text-base font-semibold text-slate-900 mb-2">SSO 로그인 확인 중</h2>
              <p className="text-sm text-slate-500 mb-5">학생 정보와 학생회 등록 상태를 확인하고 있습니다.</p>
              <Loader2 size={22} className="animate-spin text-blue-600 mx-auto" />
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function hasUserIdentity(user: AuthUser) {
  return Boolean(
    user.userId ||
      user.name ||
      user.email ||
      user.studentId ||
      user.organizationId ||
      user.organizationName ||
      user.joinStatus,
  )
}

function userFromSearchParams(searchParams: URLSearchParams): AuthUser {
  const joinStatus = searchParams.get('joinStatus')

  return {
    userId: searchParams.get('userId') || undefined,
    name: searchParams.get('name') || undefined,
    email: searchParams.get('email') || undefined,
    studentId:
      searchParams.get('studentId') ||
      searchParams.get('studentNumber') ||
      searchParams.get('sIdno') ||
      undefined,
    department: searchParams.get('department') || undefined,
    organizationId: searchParams.get('organizationId') || searchParams.get('orgId') || undefined,
    organizationName: searchParams.get('organizationName') || searchParams.get('orgName') || undefined,
    role: searchParams.get('role') || undefined,
    joinStatus: joinStatus ? normalizeJoinStatus(joinStatus) : undefined,
  }
}
