import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, FolderOpen, Wallet, Package, Users, ClipboardList, CalendarClock, CheckCircle } from 'lucide-react'

const features = [
  { icon: <FolderOpen size={20} />, label: '파일 관리' },
  { icon: <Wallet size={20} />, label: '예산 처리' },
  { icon: <Package size={20} />, label: '자산 관리' },
  { icon: <Users size={20} />, label: '학생 관리' },
  { icon: <ClipboardList size={20} />, label: '설문 조사' },
  { icon: <CalendarClock size={20} />, label: '일정 관리' },
]

const benefits = [
  '기수별로 데이터를 분리해 관리합니다',
  '파일, 예산, 자산을 한 곳에서 처리합니다',
  '설문과 시간 조율을 직접 운영합니다',
  '인계 메모로 다음 기수에 업무를 전달합니다',
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* 네비게이션 */}
      <nav className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">두</span>
          </div>
          <span className="font-bold text-slate-900">두워크</span>
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
              <span className="text-blue-600">한 곳에서</span><br />
              관리하세요
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed mb-8">
              파일, 예산, 자산, 명단, 설문, 시간 조율까지<br />
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
                <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center">
                  <span className="text-white font-bold text-xs">두</span>
                </div>
                <span className="text-sm font-semibold text-slate-700">두워크</span>
                <span className="ml-auto text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">2026 기수</span>
              </div>

              {/* 인계 메모 미리보기 */}
              <div className="mb-4">
                <p className="text-xs font-semibold text-slate-500 mb-2">인계 메모</p>
                <div className="space-y-2">
                  <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-100 rounded-lg">
                    <div className="w-1 h-full bg-red-400 rounded-full mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-slate-800">과잠 수요조사 마무리</p>
                      <p className="text-xs text-slate-500">복지국 · 4/10 마감</p>
                    </div>
                    <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded-md">중요</span>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-slate-800">학생회비 납부 독려</p>
                      <p className="text-xs text-slate-500">총무부 · 4/12 마감</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 모듈 목록 */}
              <div className="grid grid-cols-3 gap-2">
                {features.map((f, i) => (
                  <div
                    key={i}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-slate-50 hover:bg-blue-50 transition-colors cursor-pointer"
                  >
                    <span className="text-blue-500">{f.icon}</span>
                    <span className="text-xs font-medium text-slate-600">{f.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 푸터 */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center">
        <p className="text-sm text-slate-400">두워크 — 학생회 행정 플랫폼 · 더미 데이터 기반 프론트엔드</p>
      </footer>
    </div>
  )
}
