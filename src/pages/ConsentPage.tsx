import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CheckCircle2, ExternalLink, FileText, Loader2, LogOut, ShieldCheck } from 'lucide-react'
import logoUrl from '../assets/logo.png'
import { logoutSession } from '../lib/auth'
import { apiRequest } from '../lib/api'
import { useAuth } from '../lib/authState'

type ConsentStatus = {
  consentRequired: boolean
  termsVersion: string
  privacyVersion: string
  acceptedTermsVersion?: string | null
  acceptedPrivacyVersion?: string | null
  agreedAt?: string | null
}

export default function ConsentPage() {
  const navigate = useNavigate()
  const { status, user, refreshSession, setAuthenticatedUser } = useAuth()
  const [termsAgreed, setTermsAgreed] = useState(false)
  const [privacyAgreed, setPrivacyAgreed] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const termsVersion = user?.termsVersion || '2026-05-17'
  const privacyVersion = user?.privacyVersion || '2026-05-17'
  const isAuthenticated = status === 'authenticated'
  const canSubmit = isAuthenticated && termsAgreed && privacyAgreed && !isSubmitting

  useEffect(() => {
    if (user && !user.consentRequired) {
      navigate('/home', { replace: true })
    }
  }, [navigate, user])

  const requiredItems = useMemo(
    () => [
      '서비스 이용약관',
      '개인정보 수집·이용 동의',
      '개인정보 처리방침 고지 확인',
      '지출·예산·회의록·파일 등 업무 데이터 처리',
      '영수증 OCR 이미지와 추출 정보 처리',
      'CLOVA OCR 등 외부 처리업체 위탁 고지 확인',
    ],
    [],
  )

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true })
      return
    }
    if (!canSubmit) return
    setIsSubmitting(true)
    setError('')

    try {
      await apiRequest<ConsentStatus>('/api/auth/consent', {
        method: 'POST',
        body: JSON.stringify({
          termsAgreed,
          privacyAgreed,
          termsVersion,
          privacyVersion,
        }),
      })
      if (user) {
        setAuthenticatedUser({ ...user, consentRequired: false, termsVersion, privacyVersion })
      } else {
        await refreshSession()
      }
      navigate('/home', { replace: true })
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '동의 저장에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLogout = () => {
    void logoutSession().finally(() => navigate('/login', { replace: true }))
  }

  return (
    <ConsentShell>
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-blue-600 mb-1">필수 동의</p>
            <h1 className="text-lg font-bold text-slate-900">CoWork 이용을 위한 동의가 필요합니다</h1>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              아래 항목은 서비스 제공에 반드시 필요한 내용입니다. 동의하지 않으면 CoWork를 사용할 수 없습니다.
            </p>
            {status === 'checking' && (
              <p className="text-xs text-blue-600 mt-3">로그인 상태를 확인하고 있습니다.</p>
            )}
            {status === 'anonymous' && (
              <p className="text-xs text-red-600 mt-3">동의 저장을 위해 다시 로그인해 주세요.</p>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 shrink-0"
            title="로그아웃"
          >
            <LogOut size={18} />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_20rem] gap-0">
          <div className="p-6 space-y-5">
            <section>
              <div className="flex items-center gap-2 mb-3">
                <FileText size={17} className="text-slate-500" />
                <h2 className="text-sm font-semibold text-slate-900">서비스 이용약관</h2>
                <span className="text-xs text-slate-400">v{termsVersion}</span>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 leading-relaxed space-y-2">
                <p>CoWork는 학생회 행정 업무를 공동으로 관리하기 위한 서비스입니다.</p>
                <p>사용자는 본인에게 부여된 권한 범위 안에서 지출, 예산, 회의록, 파일, 설문, 일정 데이터를 등록·수정·조회해야 합니다.</p>
                <p>타인의 계정을 사용하거나 허가받지 않은 데이터를 열람·변경하는 행위, 서비스 안정성을 해치는 행위는 금지됩니다.</p>
              </div>
            </section>

            <section>
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck size={17} className="text-slate-500" />
                <h2 className="text-sm font-semibold text-slate-900">개인정보 수집·이용 및 처리방침 고지</h2>
                <span className="text-xs text-slate-400">v{privacyVersion}</span>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 leading-relaxed space-y-3">
                <div>
                  <p className="font-semibold text-slate-800 mb-1">수집·이용 항목</p>
                  <p>이름, 이메일, 학번 또는 SSO 식별값, 소속 조직·기수·역할, 접속 IP, User-Agent, 인증 이력</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-800 mb-1">업무 데이터</p>
                  <p>지출·예산·회의록·파일·설문·일정 등 사용자가 입력하거나 업로드하는 학생회 행정 데이터</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-800 mb-1">영수증 OCR 데이터</p>
                  <p>영수증 이미지, 거래처, 날짜, 금액, 결제수단, 승인번호 등 OCR로 추출된 정보</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-800 mb-1">처리 목적</p>
                  <p>계정 인증, 학생회 조직 관리, 협업 기능 제공, 지출 증빙 관리, OCR 자동 입력, 보안·장애 대응</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-800 mb-1">보유 기간</p>
                  <p>회원 탈퇴 또는 조직 이용 종료 시까지 보관하며, 법령 준수·분쟁 대응에 필요한 정보는 필요한 기간 동안 보관할 수 있습니다.</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-800 mb-1">처리업무 위탁</p>
                  <p>CLOVA OCR 등 외부 OCR 처리업체에 영수증 이미지 분석 업무를 위탁할 수 있으며, 자세한 내용은 개인정보 처리방침에 고지합니다.</p>
                </div>
                <Link
                  to="/privacy?returnTo=/consent"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:underline"
                >
                  개인정보 처리방침 보기
                  <ExternalLink size={14} />
                </Link>
              </div>
            </section>
          </div>

          <aside className="border-t lg:border-t-0 lg:border-l border-slate-100 bg-slate-50 p-6">
            <h2 className="text-sm font-semibold text-slate-900 mb-3">필수 동의 항목</h2>
            <ul className="space-y-2 mb-5">
              {requiredItems.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-slate-600">
                  <CheckCircle2 size={15} className="text-blue-600 mt-0.5 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="space-y-3">
              <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 bg-white cursor-pointer">
                <input
                  type="checkbox"
                  checked={termsAgreed}
                  onChange={(event) => setTermsAgreed(event.target.checked)}
                  className="mt-1"
                />
                <span className="text-sm text-slate-700">서비스 이용약관에 동의합니다. <span className="text-red-500">(필수)</span></span>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 bg-white cursor-pointer">
                <input
                  type="checkbox"
                  checked={privacyAgreed}
                  onChange={(event) => setPrivacyAgreed(event.target.checked)}
                  className="mt-1"
                />
                <span className="text-sm text-slate-700">개인정보 수집·이용에 동의하고 처리방침을 확인했습니다. <span className="text-red-500">(필수)</span></span>
              </label>
            </div>

            {error && <p className="mt-4 text-sm text-red-600 leading-relaxed">{error}</p>}

            <button
              onClick={status === 'anonymous' ? () => navigate('/login', { replace: true }) : handleSubmit}
              disabled={status !== 'anonymous' && !canSubmit}
              className="btn-primary w-full justify-center mt-5 py-2.5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
              {status === 'anonymous' ? '로그인하러 가기' : '동의하고 시작하기'}
            </button>
          </aside>
        </div>
      </div>
    </ConsentShell>
  )
}

function ConsentShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:py-10">
      <div className="w-full max-w-5xl mx-auto">
        <div className="flex items-center justify-center gap-2 mb-6">
          <img src={logoUrl} alt="CoWork 로고" className="w-11 h-11 rounded-lg object-contain" />
          <div>
            <p className="font-bold text-slate-900 text-sm leading-tight">CoWork</p>
            <p className="text-xs text-slate-400 leading-tight">학생회 행정 플랫폼</p>
          </div>
        </div>
        {children}
      </div>
    </div>
  )
}
