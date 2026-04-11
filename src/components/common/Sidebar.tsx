import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  Home,
  FolderOpen,
  Wallet,
  Package,
  Users,
  ClipboardList,
  Layers,
  CalendarClock,
  ShieldCheck,
} from 'lucide-react'

const mainNavItems = [
  { to: '/home', label: '홈', icon: <Home size={18} /> },
  { to: '/files', label: '파일 관리', icon: <FolderOpen size={18} /> },
  { to: '/budget', label: '예산 처리', icon: <Wallet size={18} /> },
  { to: '/assets', label: '자산 관리', icon: <Package size={18} /> },
  { to: '/students', label: '학생 관리', icon: <Users size={18} /> },
  { to: '/surveys', label: '설문 조사', icon: <ClipboardList size={18} /> },
  { to: '/workspaces', label: '워크스페이스', icon: <Layers size={18} /> },
  { to: '/schedules', label: '일정 관리', icon: <CalendarClock size={18} /> },
]

function NavItem({ to, label, icon }: { to: string; label: string; icon: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
          isActive
            ? 'bg-blue-50 text-blue-700'
            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <span className={isActive ? 'text-blue-600' : 'text-slate-400'}>{icon}</span>
          {label}
        </>
      )}
    </NavLink>
  )
}

export function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-slate-200 flex flex-col z-30">
      {/* 로고 */}
      <div className="px-5 py-5 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">두</span>
          </div>
          <div>
            <p className="font-bold text-slate-900 text-sm leading-tight">두워크</p>
            <p className="text-xs text-slate-400 leading-tight">학생회 행정 플랫폼</p>
          </div>
        </div>
      </div>

      {/* 메인 네비게이션 */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {mainNavItems.map((item) => (
          <NavItem key={item.to} {...item} />
        ))}
      </nav>

      {/* 하단 조직 관리 + 버전 */}
      <div className="px-3 pb-3 border-t border-slate-100 pt-3 space-y-0.5">
        <NavItem to="/org" label="조직 관리" icon={<ShieldCheck size={18} />} />
        <p className="text-xs text-slate-400 px-3 pt-2">두워크 v0.1 · 더미 데이터 모드</p>
      </div>
    </aside>
  )
}
