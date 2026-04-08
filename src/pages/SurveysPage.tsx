import React, { useState, useMemo } from 'react'
import { Plus, Copy, BarChart2, Edit2, Trash2, ClipboardList } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useSurveyStore } from '../store/useSurveyStore'
import { useCohortStore } from '../store/useCohortStore'
import { PageHeader } from '../components/common/PageHeader'
import { SurveyStatusBadge } from '../components/common/StatusBadge'
import { EmptyState } from '../components/common/EmptyState'
import { Modal } from '../components/common/Modal'
import { useToast } from '../components/common/Toast'
import type { Survey } from '../types'

export default function SurveysPage() {
  const { currentCohortId } = useCohortStore()
  const { surveys, deleteSurvey, updateStatus } = useSurveyStore()
  const toast = useToast()
  const navigate = useNavigate()

  const [statusFilter, setStatusFilter] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const cohortSurveys = useMemo(
    () => surveys.filter((s) => s.cohortId === currentCohortId),
    [surveys, currentCohortId]
  )

  const filtered = useMemo(() => {
    let list = [...cohortSurveys]
    if (statusFilter) list = list.filter((s) => s.status === statusFilter)
    return list.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }, [cohortSurveys, statusFilter])

  const copyLink = (id: string) => {
    const url = `${window.location.origin}/surveys/${id}/respond`
    navigator.clipboard.writeText(url).then(() => toast.success('응답 링크가 복사되었습니다.'))
  }

  return (
    <div>
      <PageHeader
        title="설문 조사"
        description="설문을 만들고 응답을 수집합니다."
        actions={
          <Link to="/surveys/new" className="btn-primary">
            <Plus size={16} />
            설문 만들기
          </Link>
        }
      />

      {/* 필터 */}
      <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1 mb-5 w-fit">
        {[{ v: '', l: '전체' }, { v: 'draft', l: '작성중' }, { v: 'open', l: '진행중' }, { v: 'closed', l: '마감' }].map(({ v, l }) => (
          <button key={v} onClick={() => setStatusFilter(v)} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${statusFilter === v ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
            {l}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="설문이 없습니다."
          description="새 설문을 만들어 응답을 수집하세요."
          action={<Link to="/surveys/new" className="btn-primary"><Plus size={16} />설문 만들기</Link>}
          icon={<ClipboardList size={28} />}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((survey) => (
            <div key={survey.id} className="card p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <SurveyStatusBadge status={survey.status} />
                  <h3 className="text-sm font-semibold text-slate-900 truncate">{survey.title}</h3>
                </div>
                {survey.description && (
                  <p className="text-xs text-slate-500 truncate mb-2">{survey.description}</p>
                )}
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span>문항 {survey.questions.length}개</span>
                  <span>응답 {survey.responses.length}개</span>
                  <span>수정: {survey.updatedAt.slice(0, 10)}</span>
                  <span>작성: {survey.createdBy}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {survey.status !== 'closed' && (
                  <Link
                    to={`/surveys/${survey.id}/edit`}
                    className="btn-secondary py-1.5 text-xs"
                  >
                    <Edit2 size={13} />수정
                  </Link>
                )}
                {survey.status === 'open' && (
                  <>
                    <button onClick={() => copyLink(survey.id)} className="btn-secondary py-1.5 text-xs">
                      <Copy size={13} />링크 복사
                    </button>
                    <button onClick={() => { updateStatus(survey.id, 'closed'); toast.success('설문이 마감되었습니다.') }} className="btn-secondary py-1.5 text-xs">
                      마감
                    </button>
                  </>
                )}
                {survey.status === 'draft' && (
                  <button onClick={() => { updateStatus(survey.id, 'open'); toast.success('설문이 공개되었습니다.') }} className="btn-primary py-1.5 text-xs">
                    공개
                  </button>
                )}
                {survey.status === 'closed' && (
                  <Link to={`/surveys/${survey.id}/results`} className="btn-primary py-1.5 text-xs">
                    <BarChart2 size={13} />결과 보기
                  </Link>
                )}
                {survey.status === 'open' && (
                  <Link to={`/surveys/${survey.id}/results`} className="btn-secondary py-1.5 text-xs">
                    <BarChart2 size={13} />결과
                  </Link>
                )}
                <button onClick={() => setDeleteConfirm(survey.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="설문 삭제" size="sm"
        footer={<><button onClick={() => setDeleteConfirm(null)} className="btn-secondary">취소</button><button onClick={() => { deleteConfirm && deleteSurvey(deleteConfirm); toast.success('삭제되었습니다.'); setDeleteConfirm(null) }} className="btn-danger">삭제</button></>}
      >
        <p className="text-sm text-slate-600">이 설문과 모든 응답 데이터가 삭제됩니다. 계속하시겠습니까?</p>
      </Modal>
    </div>
  )
}
