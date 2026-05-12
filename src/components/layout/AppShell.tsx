import React from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from '../common/Sidebar'
import { TopHeader } from '../common/TopHeader'
import { useAssetStore } from '../../store/useAssetStore'
import { useBudgetStore } from '../../store/useBudgetStore'
import { useCohortStore } from '../../store/useCohortStore'
import { useDepartmentStore } from '../../store/useDepartmentStore'
import { useEventStore } from '../../store/useEventStore'
import { useFileStore } from '../../store/useFileStore'
import { useMemoStore } from '../../store/useMemoStore'
import { useScheduleStore } from '../../store/useScheduleStore'
import { useStudentStore } from '../../store/useStudentStore'
import { useSurveyStore } from '../../store/useSurveyStore'
import { useWorkspaceStore } from '../../store/useWorkspaceStore'

export function AppShell() {
  const { currentCohortId, loadCohorts } = useCohortStore()
  const loadDepartments = useDepartmentStore((state) => state.loadDepartments)
  const loadAssets = useAssetStore((state) => state.loadAssets)
  const loadExpenses = useBudgetStore((state) => state.loadExpenses)
  const loadEvents = useEventStore((state) => state.loadEvents)
  const loadFiles = useFileStore((state) => state.loadFiles)
  const loadMemos = useMemoStore((state) => state.loadMemos)
  const loadSchedules = useScheduleStore((state) => state.loadSchedules)
  const loadStudents = useStudentStore((state) => state.loadStudents)
  const loadSurveys = useSurveyStore((state) => state.loadSurveys)
  const loadWorkspaces = useWorkspaceStore((state) => state.loadWorkspaces)

  React.useEffect(() => {
    void Promise.allSettled([loadCohorts(), loadDepartments()])
  }, [loadCohorts, loadDepartments])

  React.useEffect(() => {
    if (!currentCohortId) return
    void Promise.allSettled([
      loadAssets(currentCohortId),
      loadExpenses(currentCohortId),
      loadEvents(currentCohortId),
      loadFiles(currentCohortId),
      loadMemos(currentCohortId),
      loadSchedules(currentCohortId),
      loadStudents(currentCohortId),
      loadSurveys(currentCohortId),
      loadWorkspaces(currentCohortId),
    ])
  }, [
    currentCohortId,
    loadAssets,
    loadExpenses,
    loadEvents,
    loadFiles,
    loadMemos,
    loadSchedules,
    loadStudents,
    loadSurveys,
    loadWorkspaces,
  ])

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
