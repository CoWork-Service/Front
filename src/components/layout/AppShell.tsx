import React from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from '../common/Sidebar'
import { TopHeader } from '../common/TopHeader'

export function AppShell() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <TopHeader />
      <main className="ml-64 mt-16 p-6 min-h-[calc(100vh-64px)]">
        <Outlet />
      </main>
    </div>
  )
}
