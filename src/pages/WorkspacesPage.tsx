import React, { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { FileText, BookOpen, ArrowRight, Layers } from 'lucide-react'
import { useWorkspaceStore } from '../store/useWorkspaceStore'
import { useCohortStore } from '../store/useCohortStore'
import { PageHeader } from '../components/common/PageHeader'
import { DepartmentTag } from '../components/common/DepartmentTag'

export default function WorkspacesPage() {
  const { currentCohortId } = useCohortStore()
  const { workspaces } = useWorkspaceStore()

  const cohortWorkspaces = useMemo(
    () => workspaces.filter((ws) => ws.cohortId === currentCohortId),
    [workspaces, currentCohortId]
  )

  const allWorkspace = cohortWorkspaces.find((ws) => ws.departmentId === '전체')
  const deptWorkspaces = cohortWorkspaces.filter((ws) => ws.departmentId !== '전체')

  return (
    <div>
      <PageHeader
        title="워크스페이스"
        description="부서별 자료와 회의록을 관리합니다."
      />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 전체 워크스페이스 카드 */}
        {allWorkspace && (
          <Link
            to={`/workspaces/${allWorkspace.id}`}
            className="card p-5 hover:shadow-md transition-all group border-blue-200 bg-blue-50/40 col-span-full"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
                  <Layers size={18} className="text-white" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">{allWorkspace.name}</h3>
                  <p className="text-xs text-slate-500">{allWorkspace.description}</p>
                </div>
              </div>
              <ArrowRight size={16} className="text-slate-300 group-hover:text-blue-500 transition-colors mt-1" />
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-500 pt-3 border-t border-blue-100">
              <div className="flex items-center gap-1.5">
                <BookOpen size={13} />
                <span>회의록 {allWorkspace.meetingCount}개</span>
              </div>
              <span className="text-slate-300">·</span>
              <span>최근 업데이트: {allWorkspace.updatedAt.slice(0, 10)}</span>
            </div>
          </Link>
        )}

        {/* 부서별 카드 */}
        {deptWorkspaces.map((ws) => (
          <Link
            key={ws.id}
            to={`/workspaces/${ws.id}`}
            className="card p-5 hover:shadow-md transition-all group"
          >
            <div className="flex items-start justify-between mb-3">
              <DepartmentTag department={ws.departmentId} size="md" />
              <ArrowRight size={16} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 mb-1">{ws.name}</h3>
            {ws.description && (
              <p className="text-xs text-slate-500 mb-3">{ws.description}</p>
            )}
            <div className="flex items-center gap-4 text-xs text-slate-500 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-1.5">
                <FileText size={13} />
                <span>파일 {ws.fileCount}개</span>
              </div>
              <div className="flex items-center gap-1.5">
                <BookOpen size={13} />
                <span>회의록 {ws.meetingCount}개</span>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-2">최근 업데이트: {ws.updatedAt.slice(0, 10)}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
