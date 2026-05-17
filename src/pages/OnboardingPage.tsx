import { useEffect, useMemo, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Clock3,
  Loader2,
  LogOut,
  Plus,
  ShieldCheck,
  Trash2,
  TriangleAlert,
  UserPlus,
} from 'lucide-react'
import logoUrl from '../assets/logo.png'
import {
  fetchSsoProfile,
  logoutSession,
  normalizeJoinStatus,
  registerSsoUser,
  type AuthUser,
} from '../lib/auth'
import { useAuth } from '../lib/authState'
import { REQUIRED_DEPARTMENT } from '../lib/departments'

type Mode = 'select' | 'create' | 'departments' | 'join' | 'pending'

const DEFAULT_DEPARTMENTS = [REQUIRED_DEPARTMENT, '기획국', '총무부', '홍보국', '복지국']

export default function OnboardingPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { setAuthenticatedUser } = useAuth()
  const tempToken = useMemo(() => searchParams.get('tempToken') || '', [searchParams])

  const [mode, setMode] = useState<Mode>('select')
  const [profile, setProfile] = useState<AuthUser>({})
  const [isLoading, setIsLoading] = useState(Boolean(tempToken))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [form, setForm] = useState({
    councilName: '',
    cohortLabel: '',
    department: '',
    inviteCode: '',
    presidentConfirmed: false,
  })
  const [departmentRows, setDepartmentRows] = useState([...DEFAULT_DEPARTMENTS])

  useEffect(() => {
    if (!tempToken) return

    const loadProfile = async () => {
      try {
        setIsLoading(true)
        const nextProfile = await fetchSsoProfile(tempToken)
        setProfile((prev) => ({ ...prev, ...nextProfile }))
        setForm((prev) => ({
          ...prev,
          department: prev.department || nextProfile.department || '',
        }))
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : 'SSO 프로필을 불러오지 못했습니다.')
      } finally {
        setIsLoading(false)
      }
    }

    loadProfile()
  }, [tempToken])

  useEffect(() => {
    if (!form.department && profile.department) {
      setForm((prev) => ({
        ...prev,
        department: profile.department || '',
      }))
    }
  }, [form.department, profile.department])

  const handleLogout = () => {
    void logoutSession().finally(() => {
      navigate('/login', { replace: true })
    })
  }

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault()
    if (!form.presidentConfirmed) {
      setSubmitError('회장 권한 확인이 필요합니다.')
      return
    }
    setSubmitError('')
    setMode('departments')
  }

  const handleJoin = async (event: FormEvent) => {
    event.preventDefault()
    if (!form.inviteCode.trim()) {
      setSubmitError('초대코드를 입력해주세요.')
      return
    }
    await submitOnboarding(false)
  }

  const addDepartmentRow = () => {
    setDepartmentRows((prev) => [...prev, ''])
  }

  const updateDepartmentRow = (index: number, value: string) => {
    if (index === 0) return
    setDepartmentRows((prev) => prev.map((department, rowIndex) => (rowIndex === index ? value : department)))
  }

  const removeDepartmentRow = (index: number) => {
    if (index === 0) return
    setDepartmentRows((prev) => (prev.length <= 1 ? prev : prev.filter((_, rowIndex) => rowIndex !== index)))
  }

  const submitOnboarding = async (councilMember: boolean) => {
    setSubmitError('')
    setIsSubmitting(true)
    const organizationDepartments = councilMember ? resolveDepartmentRows(departmentRows) : undefined

    const nextUser: AuthUser = {
      ...profile,
      department: form.department || profile.department,
      organizationName: councilMember ? form.councilName.trim() || 'A:NSWER' : profile.organizationName,
      organizationDepartments,
      role: councilMember ? 'ADMIN' : 'EDITOR',
      joinStatus: 'ACTIVE',
    }

    try {
      if (!tempToken) {
        setSubmitError('SSO 인증 정보가 없습니다. 다시 로그인해주세요.')
        return
      }

      const response = await registerSsoUser({
        tempToken,
        councilMember,
        cohortLabel: form.cohortLabel.trim() || '1기',
        department: form.department || profile.department,
        organizationName: form.councilName.trim() || 'A:NSWER',
        inviteCode: form.inviteCode,
        departments: organizationDepartments,
      })
      const joinStatus = normalizeJoinStatus(response.joinStatus)
      const responseUser: AuthUser = {
        ...nextUser,
        userId: response.userId,
        name: response.name || nextUser.name,
        joinStatus,
      }
      const authenticatedJoinStatus = joinStatus === 'UNKNOWN' ? 'ACTIVE' : joinStatus

      if (authenticatedJoinStatus !== 'PENDING' && authenticatedJoinStatus !== 'REJECTED') {
        const authenticatedUser = {
          ...responseUser,
          joinStatus: authenticatedJoinStatus,
          consentRequired: Boolean(response.consentRequired),
          termsVersion: response.termsVersion,
          privacyVersion: response.privacyVersion,
        }
        setAuthenticatedUser(authenticatedUser)
        navigate(authenticatedUser.consentRequired ? '/consent' : '/home', { replace: true })
        return
      }

      if (joinStatus === 'REJECTED') {
        navigate(statusPath('/rejected', responseUser), { replace: true })
        return
      }
      setMode('pending')
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : '가입 처리에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const displayName = profile.name || 'SSO 사용자'
  const displayStudentId = profile.studentId || '학번 확인 중'
  const displayDepartment = profile.department || form.department || '소속 확인 중'

  if (isLoading) {
    return (
      <OnboardingShell>
        <div className="card p-7 text-center">
          <Loader2 size={26} className="animate-spin text-blue-600 mx-auto mb-4" />
          <h1 className="text-lg font-semibold text-slate-900">학생 정보 확인 중</h1>
          <p className="text-sm text-slate-500 mt-2">SSO 인증 결과를 불러오고 있습니다.</p>
        </div>
      </OnboardingShell>
    )
  }

  if (loadError) {
    return (
      <OnboardingShell>
        <div className="card p-7 text-center">
          <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4">
            <TriangleAlert size={22} />
          </div>
          <h1 className="text-lg font-semibold text-slate-900">학생 정보 확인 실패</h1>
          <p className="text-sm text-slate-500 mt-2 mb-5">{loadError}</p>
          <button onClick={handleLogout} className="btn-secondary w-full justify-center">
            <LogOut size={16} />
            다시 로그인
          </button>
        </div>
      </OnboardingShell>
    )
  }

  return (
    <OnboardingShell>
      <div className="card overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-blue-600 mb-1">숭실대 SSO 인증 완료</p>
            <h1 className="text-lg font-bold text-slate-900">학생회 등록이 필요합니다</h1>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            title="로그아웃"
          >
            <LogOut size={18} />
          </button>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center">
              <ShieldCheck size={19} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">{displayName}</p>
              <p className="text-xs text-slate-500">
                <span className="font-mono">{displayStudentId}</span>
                <span className="px-1.5">·</span>
                {displayDepartment}
              </p>
            </div>
          </div>
        </div>

        {mode === 'select' && (
          <div className="p-6 space-y-3">
            <button
              onClick={() => setMode('create')}
              className="w-full flex items-start gap-4 p-4 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 text-left transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                <Building2 size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900">새 학생회 만들기</p>
                <p className="text-xs text-slate-500 mt-1">회장 계정으로 학생회와 첫 기수를 생성합니다.</p>
              </div>
            </button>

            <button
              onClick={() => setMode('join')}
              className="w-full flex items-start gap-4 p-4 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 text-left transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0">
                <UserPlus size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900">기존 학생회 가입하기</p>
                <p className="text-xs text-slate-500 mt-1">공유받은 초대코드를 입력하면 바로 가입됩니다.</p>
              </div>
            </button>
          </div>
        )}

        {mode === 'create' && (
          <form onSubmit={handleCreate} className="p-6 space-y-4">
            <button
              type="button"
              onClick={() => setMode('select')}
              className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
            >
              <ArrowLeft size={15} />
              선택으로 돌아가기
            </button>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label">학생회명</label>
                <input
                  value={form.councilName}
                  onChange={(event) => setForm({ ...form, councilName: event.target.value })}
                  className="input"
                  placeholder="A:NSWER"
                />
              </div>
              <div>
                <label className="label">기수</label>
                <input
                  value={form.cohortLabel}
                  onChange={(event) => setForm({ ...form, cohortLabel: event.target.value })}
                  className="input"
                  placeholder="1기"
                />
              </div>
            </div>

            <div>
              <label className="label">소속</label>
              <input
                value={form.department}
                onChange={(event) => setForm({ ...form, department: event.target.value })}
                className="input"
              />
            </div>

            <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={form.presidentConfirmed}
                onChange={(event) => setForm({ ...form, presidentConfirmed: event.target.checked })}
                className="mt-0.5"
              />
              <span className="text-sm text-slate-600">현재 학생회장 권한으로 새 학생회를 생성합니다.</span>
            </label>

            {submitError && <p className="text-sm text-red-600">{submitError}</p>}

            <button type="submit" className="btn-primary w-full justify-center py-2.5" disabled={isSubmitting}>
              <CheckCircle2 size={16} />
              학생회 만들기
            </button>
          </form>
        )}

        {mode === 'departments' && (
          <form
            onSubmit={(event) => {
              event.preventDefault()
              submitOnboarding(true)
            }}
            className="p-6 space-y-4"
          >
            <button
              type="button"
              onClick={() => setMode('create')}
              className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
            >
              <ArrowLeft size={15} />
              학생회 정보로 돌아가기
            </button>

            <div>
              <h2 className="text-base font-semibold text-slate-900">조직 구성</h2>
              <p className="text-xs text-slate-500 mt-1">부서명을 입력하면 조직 관리와 워크스페이스 구성에 사용할 수 있습니다.</p>
            </div>

            <div className="space-y-2">
              {departmentRows.map((department, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    value={index === 0 ? REQUIRED_DEPARTMENT : department}
                    onChange={(event) => updateDepartmentRow(index, event.target.value)}
                    readOnly={index === 0}
                    className={`input ${index === 0 ? 'bg-slate-50 text-slate-700 font-semibold' : ''}`}
                    placeholder={DEFAULT_DEPARTMENTS[index] || `부서 ${index + 1}`}
                  />
                  {index === 0 ? (
                    <span className="px-2.5 py-2 rounded-lg border border-blue-100 bg-blue-50 text-xs font-semibold text-blue-700 shrink-0">
                      필수
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => removeDepartmentRow(index)}
                      className="p-2 rounded-lg border border-slate-200 text-slate-400 hover:text-red-600 hover:bg-red-50 hover:border-red-200 shrink-0"
                      title="부서 삭제"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button type="button" onClick={addDepartmentRow} className="btn-secondary w-full justify-center">
              <Plus size={16} />
              부서 추가
            </button>

            {submitError && <p className="text-sm text-red-600">{submitError}</p>}

            <button type="submit" className="btn-primary w-full justify-center py-2.5" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
              조직 구성 완료
            </button>
          </form>
        )}

        {mode === 'join' && (
          <form onSubmit={handleJoin} className="p-6 space-y-4">
            <button
              type="button"
              onClick={() => setMode('select')}
              className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
            >
              <ArrowLeft size={15} />
              선택으로 돌아가기
            </button>

            <div>
              <label className="label">초대코드</label>
              <input
                value={form.inviteCode}
                onChange={(event) => setForm({ ...form, inviteCode: event.target.value.toUpperCase() })}
                className="input font-mono"
                placeholder="예: XK9M2P7Q4R8T1AZ6"
              />
            </div>

            {submitError && <p className="text-sm text-red-600">{submitError}</p>}

            <button type="submit" className="btn-primary w-full justify-center py-2.5" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
              바로 가입하기
            </button>
          </form>
        )}

        {mode === 'pending' && (
          <div className="p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4">
              <Clock3 size={22} />
            </div>
            <h2 className="text-base font-semibold text-slate-900">가입 신청 대기중</h2>
            <p className="text-sm text-slate-500 mt-2 mb-5">학생회 관리자가 승인하면 CoWork를 사용할 수 있습니다.</p>
            <button onClick={handleLogout} className="btn-secondary w-full justify-center">
              <LogOut size={16} />
              다른 계정으로 로그인
            </button>
          </div>
        )}
      </div>
    </OnboardingShell>
  )
}

function statusPath(path: '/pending' | '/rejected', user: AuthUser) {
  const params = new URLSearchParams()
  if (user.name) params.set('name', user.name)
  if (user.studentId) params.set('studentId', user.studentId)
  const query = params.toString()
  return query ? `${path}?${query}` : path
}

function OnboardingShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center justify-center">
            <img src={logoUrl} alt="CoWork 로고" className="w-24 h-24 object-contain mb-2" />
          </Link>
          <p className="text-sm text-slate-500">학생회 행정 플랫폼</p>
        </div>
        {children}
      </div>
    </div>
  )
}

function resolveDepartmentRows(rows: string[]) {
  const seen = new Set<string>()
  const names: string[] = []

  const add = (department: string) => {
    const normalized = department.trim()
    if (!normalized || seen.has(normalized)) return
    seen.add(normalized)
    names.push(normalized)
  }

  add(REQUIRED_DEPARTMENT)
  rows.forEach(add)
  return names.length > 0 ? names : DEFAULT_DEPARTMENTS
}
