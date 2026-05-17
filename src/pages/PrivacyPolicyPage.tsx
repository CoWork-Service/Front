import type { ReactNode } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, FileText, ShieldCheck } from 'lucide-react'
import logoUrl from '../assets/logo.png'
import { useAuth } from '../lib/authState'

export default function PrivacyPolicyPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { status, user } = useAuth()
  const returnTo = safeReturnPath(searchParams.get('returnTo'))

  const handleBack = () => {
    if (returnTo) {
      navigate(returnTo, { replace: true })
      return
    }
    if (status === 'authenticated') {
      navigate(user?.consentRequired ? '/consent' : '/home', { replace: true })
      return
    }
    navigate('/', { replace: true })
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:py-10">
      <main className="w-full max-w-3xl mx-auto">
        <div className="flex items-center justify-between gap-4 mb-6">
          <Link to="/" className="flex items-center gap-2 min-w-0">
            <img src={logoUrl} alt="CoWork 로고" className="w-10 h-10 rounded-lg object-contain shrink-0" />
            <div className="min-w-0">
              <p className="font-bold text-slate-900 text-sm leading-tight">CoWork</p>
              <p className="text-xs text-slate-400 leading-tight truncate">학생회 행정 플랫폼</p>
            </div>
          </Link>
          <button
            onClick={handleBack}
            className="btn-secondary py-1.5"
          >
            <ArrowLeft size={15} />
            돌아가기
          </button>
        </div>

        <article className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <header className="px-6 py-5 border-b border-slate-100">
            <div className="flex items-center gap-2 text-blue-600 mb-2">
              <ShieldCheck size={18} />
              <span className="text-xs font-semibold">개인정보 처리방침</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900">CoWork 개인정보 처리방침</h1>
            <p className="text-sm text-slate-500 mt-2">시행일 및 버전: 2026-05-17</p>
          </header>

          <div className="px-6 py-6 space-y-6 text-sm text-slate-600 leading-relaxed">
            <PolicySection title="1. 처리 목적">
              <p>CoWork는 학생회 행정 플랫폼 제공을 위해 계정 인증, 학생회 조직·기수·권한 관리, 지출·예산·회의록·파일·설문·일정 관리, 영수증 OCR 자동 입력, 보안·장애 대응 목적으로 개인정보를 처리합니다.</p>
            </PolicySection>

            <PolicySection title="2. 처리하는 개인정보 항목">
              <p>이름, 이메일, 학번 또는 SSO 식별값, 소속 조직·기수·역할, 접속 IP, User-Agent, 인증 이력을 처리합니다.</p>
              <p>서비스 이용 과정에서 사용자가 입력하거나 업로드하는 지출, 예산, 회의록, 파일, 설문, 일정 등 업무 데이터가 함께 처리될 수 있습니다.</p>
            </PolicySection>

            <PolicySection title="3. 영수증 OCR 관련 처리 항목">
              <p>영수증 OCR 기능 사용 시 영수증 이미지와 OCR로 추출된 거래처, 날짜, 금액, 결제수단, 승인번호, 카드 관련 정보 등이 처리될 수 있습니다.</p>
            </PolicySection>

            <PolicySection title="4. 보유 및 이용 기간">
              <p>개인정보와 업무 데이터는 회원 탈퇴 또는 조직 이용 종료 시까지 보관합니다. 다만 법령 준수, 분쟁 대응, 감사 추적, 보안 사고 조사에 필요한 정보는 필요한 기간 동안 보관할 수 있습니다.</p>
            </PolicySection>

            <PolicySection title="5. 개인정보 처리업무 위탁">
              <div className="overflow-x-auto">
                <table className="w-full border border-slate-200 text-left">
                  <thead className="bg-slate-50 text-slate-700">
                    <tr>
                      <th className="px-3 py-2 border-b border-slate-200 font-semibold">수탁자</th>
                      <th className="px-3 py-2 border-b border-slate-200 font-semibold">위탁 업무</th>
                      <th className="px-3 py-2 border-b border-slate-200 font-semibold">처리 항목</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="px-3 py-2 border-b border-slate-100">NAVER Cloud Platform CLOVA OCR</td>
                      <td className="px-3 py-2 border-b border-slate-100">영수증 이미지 OCR 분석 및 텍스트 추출</td>
                      <td className="px-3 py-2 border-b border-slate-100">영수증 이미지, 추출 대상 문자 정보</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2">인프라·스토리지 제공 사업자</td>
                      <td className="px-3 py-2">서비스 운영, 데이터 저장, 파일 보관</td>
                      <td className="px-3 py-2">계정 정보, 업무 데이터, 업로드 파일</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </PolicySection>

            <PolicySection title="6. 동의 거부 권리 및 불이익">
              <p>사용자는 필수 개인정보 수집·이용에 대한 동의를 거부할 수 있습니다. 다만 해당 정보는 CoWork 서비스 제공에 필수적이므로 동의하지 않으면 서비스를 이용할 수 없습니다.</p>
            </PolicySection>

            <PolicySection title="7. 안전성 확보 조치">
              <p>CoWork는 인증 쿠키의 HttpOnly 설정, 권한 기반 접근 제어, 파일 저장 경로 관리, 접속 기록 확인 등 개인정보와 업무 데이터를 보호하기 위한 조치를 적용합니다.</p>
            </PolicySection>

            <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 flex items-start gap-3">
              <FileText size={17} className="text-blue-600 mt-0.5 shrink-0" />
              <p className="text-sm text-blue-800">본 처리방침은 필수 동의 화면에서 고지되는 개인정보 수집·이용 동의와 함께 적용됩니다.</p>
            </div>
          </div>
        </article>
      </main>
    </div>
  )
}

function safeReturnPath(value: string | null) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return ''
  return value
}

function PolicySection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-base font-semibold text-slate-900 mb-2">{title}</h2>
      <div className="space-y-2">{children}</div>
    </section>
  )
}
