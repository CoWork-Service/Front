import React, { useEffect, useRef, useState } from 'react'
import { Bell, Briefcase, Building2, CalendarDays, LogOut, User } from 'lucide-react'
import { CohortSelector } from './CohortSelector'
import { useAuth } from '../../lib/authState'
import { logoutSession } from '../../lib/auth'
import { useCohortStore } from '../../store/useCohortStore'

interface TopHeaderProps {
  pageTitle?: string
}

export function TopHeader({ pageTitle }: TopHeaderProps) {
  const { user, clearAuthUser } = useAuth()
  const { currentCohort } = useCohortStore()
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const userName = user?.name || '사용자'

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = async () => {
    setOpen(false)
    await logoutSession()
    clearAuthUser()
  }

  return (
    <header className="fixed top-0 left-64 right-0 h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-20">
      <div className="flex items-center gap-3">
        <CohortSelector />
        {pageTitle && (
          <span className="text-sm text-slate-400">·</span>
        )}
        {pageTitle && (
          <span className="text-sm text-slate-600">{pageTitle}</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
          <Bell size={18} />
        </button>

        <div ref={dropdownRef} className="relative">
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center">
              <User size={14} className="text-white" />
            </div>
            <span className="text-sm font-medium text-slate-700">{userName}</span>
          </button>

          {open && (
            <div className="absolute top-full right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-lg py-2 z-50">
              <div className="px-4 py-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                    <User size={18} className="text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{user?.name || '사용자'}</p>
                  </div>
                </div>
              </div>

              <div className="px-4 py-3 space-y-2.5">
                {user?.organizationName && (
                  <div className="flex items-center gap-2.5 text-sm text-slate-600">
                    <Building2 size={14} className="text-slate-400 shrink-0" />
                    <span className="truncate">{user.organizationName}</span>
                  </div>
                )}
                {currentCohort?.label && (
                  <div className="flex items-center gap-2.5 text-sm text-slate-600">
                    <CalendarDays size={14} className="text-slate-400 shrink-0" />
                    <span>{currentCohort.label}</span>
                  </div>
                )}
                {user?.department && (
                  <div className="flex items-center gap-2.5 text-sm text-slate-600">
                    <Briefcase size={14} className="text-slate-400 shrink-0" />
                    <span>{user.department}</span>
                  </div>
                )}
              </div>

              <div className="border-t border-slate-100 pt-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={14} />
                  <span>로그아웃</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
