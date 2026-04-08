import React from 'react'
import { Bell, User } from 'lucide-react'
import { CohortSelector } from './CohortSelector'

interface TopHeaderProps {
  pageTitle?: string
}

export function TopHeader({ pageTitle }: TopHeaderProps) {
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
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors">
          <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center">
            <User size={14} className="text-white" />
          </div>
          <span className="text-sm font-medium text-slate-700">김민준</span>
        </button>
      </div>
    </header>
  )
}
