import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, FolderOpen, Wallet, Package, Users, ClipboardList, CalendarClock, CheckCircle, CalendarDays, Building2, MapPin, Flag } from 'lucide-react'
import logoUrl from '../assets/logo.png'

const features = [
  { icon: <CalendarDays size={20} />, label: '행사 관리' },
  { icon: <FolderOpen size={20} />, label: '파일 관리' },
  { icon: <Wallet size={20} />, label: '예산 처리' },
  { icon: <Package size={20} />, label: '자산 관리' },
  { icon: <Users size={20} />, label: '학생 관리' },
  { icon: <ClipboardList size={20} />, label: '설문 조사' },
  { icon: <CalendarClock size={20} />, label: '일정 조율' },
  { icon: <Building2 size={20} />, label: '워크스페이스' },
]

const benefits = [
  '행사 중심으로 파일·예산·설문을 통합 관리합니다',
  '기수별로 데이터를 분리해 관리합니다',
  'QR코드로 현장 지출을 바로 등록합니다',
  '업무 메모로, 해야할 일을 간편하게 공유합니다.',
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* 네비게이션 */}
      <nav className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <img src={logoUrl} alt="CoWork 로고" className="w-8 h-8 rounded-lg object-contain shrink-0" />
          <span className="font-bold text-slate-900">CoWork</span>
        </div>
        <Link
          to="/login"
          className="btn-primary"
        >
          로그인
        </Link>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center px-8 py-16">
        <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* 좌측 텍스트 */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-full text-blue-700 text-xs font-medium mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
              학생회 행정 플랫폼
            </div>
            <h1 className="text-5xl font-bold text-slate-900 leading-tight mb-6">
              학생회 업무를<br />
              <span className="text-blue-600">처음부터 끝까지</span><br />
              한 곳에서
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed mb-8">
              행사 기반 워크플로우로 업무를<br />
              하나의 플랫폼에서 처리합니다.
            </p>

            <div className="space-y-2.5 mb-10">
              {benefits.map((b, i) => (
                <div key={i} className="flex items-center gap-2.5 text-slate-700">
                  <CheckCircle size={16} className="text-green-500 shrink-0" />
                  <span className="text-sm">{b}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <Link to="/login" className="btn-primary text-base px-6 py-3">
                시작하기
                <ArrowRight size={18} />
              </Link>
              <Link
                to="/home"
                className="btn-secondary text-base px-6 py-3"
              >
                서비스 둘러보기
              </Link>
            </div>
          </div>

          {/* 우측 미리보기 목업 */}
          <div className="lg:block">
            <div className="card p-6 shadow-xl">
              {/* 목업 헤더 */}
              <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-100">
                <img src={logoUrl} alt="CoWork 로고" className="w-7 h-7 rounded-md object-contain shrink-0" />
                <span className="text-sm font-semibold text-slate-700">CoWork</span>
                <span className="ml-auto text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">2026 기수</span>
              </div>

              {/* 다가오는 행사 미리보기 */}
              <div className="mb-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <CalendarDays size={12} className="text-blue-500" />
                  <p className="text-xs font-semibold text-slate-500">다가오는 행사</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-start gap-3 p-3 bg-white border border-slate-200 border-l-4 border-l-purple-500 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="text-xs font-semibold text-slate-800 truncate">2026 봄 MT</p>
                        <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded shrink-0">MT</span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-slate-500">
                        <CalendarDays size={10} />
                        <span>2026-05-09 ~ 2026-05-10</span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-0.5">
                        <MapPin size={10} />
                        <span>가평 OO펜션</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-white border border-slate-200 border-l-4 border-l-blue-500 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="text-xs font-semibold text-slate-800 truncate">5월 정기총회</p>
                        <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded shrink-0">정기총회</span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-slate-500">
                        <CalendarDays size={10} />
                        <span>2026-05-21</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 인계 메모 미리보기 */}
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Flag size={12} className="text-red-500" />
                  <p className="text-xs font-semibold text-slate-500">중요 인계 메모</p>
                </div>
                <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-100 rounded-lg">
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-slate-800">MT 버스 예약 잔금 처리</p>
                    <p className="text-xs text-slate-500">총무부 · 5/1 마감</p>
                  </div>
                  <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded-md shrink-0">중요</span>
                </div>
              </div>
            </div>

            {/* 기능 그리드 */}
            <div className="grid grid-cols-4 gap-2 mt-4">
              {features.map((f, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white border border-slate-200 hover:bg-blue-50 hover:border-blue-200 transition-colors cursor-pointer"
                >
                  <span className="text-blue-500">{f.icon}</span>
                  <span className="text-xs font-medium text-slate-600">{f.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* 푸터 */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center">
        <p className="text-sm text-slate-400">CoWork — 학생회 행정 플랫폼</p>
      </footer>
    </div>
  )
}
