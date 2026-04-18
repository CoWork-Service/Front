import React, { useState, useMemo } from 'react'
import { Plus, Star, CheckSquare, RotateCcw, Flag, Check, Trash2, Edit2, CalendarDays, MapPin, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useMemoStore } from '../store/useMemoStore'
import { useCohortStore } from '../store/useCohortStore'
import { useEventStore } from '../store/useEventStore'
import { PageHeader } from '../components/common/PageHeader'
import { DepartmentTag } from '../components/common/DepartmentTag'
import { DueDateBadge } from '../components/common/DueDateBadge'
import { EmptyState } from '../components/common/EmptyState'
import { Modal } from '../components/common/Modal'
import { useToast } from '../components/common/Toast'
import { DEPARTMENTS } from '../types'
import type { Memo, Department } from '../types'

type Filter = 'all' | 'important' | 'open' | 'done'
type Sort = 'latest' | 'dueDate'

function MemoCard({
  memo,
  onEdit,
  onDelete,
  onTogglePriority,
  onToggleStatus,
}: {
  memo: Memo
  onEdit: (m: Memo) => void
  onDelete: (id: string) => void
  onTogglePriority: (id: string) => void
  onToggleStatus: (id: string) => void
}) {
  const isDone = memo.status === 'done'
  const isImportant = memo.priority === 'important'

  return (
    <div
      className={`card p-4 flex flex-col gap-3 transition-opacity ${
        isDone ? 'opacity-60' : ''
      } ${isImportant ? 'border-l-4 border-l-red-400' : ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className={`text-sm font-semibold text-slate-900 leading-snug flex-1 ${isDone ? 'line-through text-slate-500' : ''}`}>
          {memo.title}
        </h3>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onTogglePriority(memo.id)}
            title={isImportant ? '중요 해제' : '중요 표시'}
            className={`p-1 rounded transition-colors ${isImportant ? 'text-red-500 hover:text-red-700' : 'text-slate-300 hover:text-red-400'}`}
          >
            <Flag size={14} />
          </button>
          <button
            onClick={() => onToggleStatus(memo.id)}
            title={isDone ? '미완료로 되돌리기' : '완료 처리'}
            className={`p-1 rounded transition-colors ${isDone ? 'text-green-500 hover:text-green-700' : 'text-slate-300 hover:text-green-400'}`}
          >
            <Check size={14} />
          </button>
          <button
            onClick={() => onEdit(memo)}
            className="p-1 rounded text-slate-300 hover:text-slate-600 transition-colors"
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={() => onDelete(memo.id)}
            className="p-1 rounded text-slate-300 hover:text-red-500 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {memo.content && (
        <p className="text-xs text-slate-500 line-clamp-2">{memo.content}</p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {memo.department && <DepartmentTag department={memo.department} />}
        <DueDateBadge dueDate={memo.dueDate} status={memo.status} />
        {isImportant && (
          <span className="inline-flex items-center gap-1 text-xs text-red-600 font-medium">
            <Flag size={10} />중요
          </span>
        )}
        {isDone && (
          <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
            <Check size={10} />완료
          </span>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-50">
        <span>{memo.author}</span>
        <span>{memo.updatedAt.slice(0, 10)} 수정</span>
      </div>
    </div>
  )
}

interface MemoFormData {
  title: string
  content: string
  department: Department | ''
  dueDate: string
  priority: 'normal' | 'important'
  status: 'open' | 'done'
}

const defaultForm: MemoFormData = {
  title: '',
  content: '',
  department: '',
  dueDate: '',
  priority: 'normal',
  status: 'open',
}

const coverBorderMap: Record<string, string> = {
  blue: 'border-l-blue-500',
  green: 'border-l-emerald-500',
  orange: 'border-l-amber-500',
  purple: 'border-l-purple-500',
  red: 'border-l-red-500',
}

const coverBgMap: Record<string, string> = {
  blue: 'bg-blue-100 text-blue-700',
  green: 'bg-emerald-100 text-emerald-700',
  orange: 'bg-amber-100 text-amber-700',
  purple: 'bg-purple-100 text-purple-700',
  red: 'bg-red-100 text-red-700',
}

export default function HomePage() {
  const { currentCohortId } = useCohortStore()
  const { memos, addMemo, updateMemo, deleteMemo, togglePriority, toggleStatus } = useMemoStore()
  const { events } = useEventStore()
  const toast = useToast()

  const upcomingEvents = useMemo(() => {
    return events
      .filter(
        (e) =>
          e.cohortId === currentCohortId &&
          e.status !== 'done' &&
          e.status !== 'cancelled'
      )
      .sort((a, b) => a.startDate.localeCompare(b.startDate))
      .slice(0, 3)
  }, [events, currentCohortId])

  const [filter, setFilter] = useState<Filter>('all')
  const [sort, setSort] = useState<Sort>('latest')
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Memo | null>(null)
  const [form, setForm] = useState<MemoFormData>(defaultForm)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const cohortMemos = useMemo(
    () => memos.filter((m) => m.cohortId === currentCohortId),
    [memos, currentCohortId]
  )

  const filtered = useMemo(() => {
    let list = [...cohortMemos]
    if (filter === 'important') list = list.filter((m) => m.priority === 'important')
    else if (filter === 'open') list = list.filter((m) => m.status === 'open')
    else if (filter === 'done') list = list.filter((m) => m.status === 'done')

    if (sort === 'latest') {
      list.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    } else {
      list.sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0
        if (!a.dueDate) return 1
        if (!b.dueDate) return -1
        return a.dueDate.localeCompare(b.dueDate)
      })
    }
    return list
  }, [cohortMemos, filter, sort])

  const importantMemos = filtered.filter((m) => m.priority === 'important' && m.status === 'open')
  const otherMemos = filtered.filter((m) => !(m.priority === 'important' && m.status === 'open'))

  const openCreateModal = () => {
    setEditTarget(null)
    setForm(defaultForm)
    setModalOpen(true)
  }

  const openEditModal = (memo: Memo) => {
    setEditTarget(memo)
    setForm({
      title: memo.title,
      content: memo.content,
      department: memo.department ?? '',
      dueDate: memo.dueDate ?? '',
      priority: memo.priority,
      status: memo.status,
    })
    setModalOpen(true)
  }

  const handleSave = () => {
    if (!form.title.trim()) {
      toast.error('제목을 입력해주세요.')
      return
    }
    const data = {
      cohortId: currentCohortId,
      title: form.title.trim(),
      content: form.content.trim(),
      department: form.department || undefined,
      dueDate: form.dueDate || undefined,
      priority: form.priority,
      status: form.status,
      author: '김민준',
    }
    if (editTarget) {
      updateMemo(editTarget.id, data)
      toast.success('메모가 수정되었습니다.')
    } else {
      addMemo(data)
      toast.success('새 메모가 작성되었습니다.')
    }
    setModalOpen(false)
  }

  const handleDelete = (id: string) => {
    deleteMemo(id)
    toast.success('메모가 삭제되었습니다.')
    setDeleteConfirm(null)
  }

  const filterButtons: { key: Filter; label: string }[] = [
    { key: 'all', label: '전체' },
    { key: 'important', label: '중요' },
    { key: 'open', label: '미완료' },
    { key: 'done', label: '완료' },
  ]

  return (
    <div>
      {/* 다가오는 행사 위젯 */}
      {upcomingEvents.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CalendarDays size={15} className="text-blue-500" />
              <h2 className="text-sm font-semibold text-slate-700">다가오는 행사</h2>
              <span className="text-xs text-slate-400">{upcomingEvents.length}개</span>
            </div>
            <Link to="/events" className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
              모두 보기 <ArrowRight size={12} />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {upcomingEvents.map((e) => {
              const color = e.coverColor ?? 'blue'
              const borderClass = coverBorderMap[color] ?? 'border-l-blue-500'
              const tagClass = coverBgMap[color] ?? 'bg-blue-100 text-blue-700'
              return (
                <Link
                  key={e.id}
                  to={`/events/${e.id}`}
                  className={`bg-white rounded-xl border border-slate-200 border-l-4 ${borderClass} p-4 hover:shadow-sm transition-shadow`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-sm font-semibold text-slate-800 leading-snug">{e.name}</p>
                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded shrink-0 ${tagClass}`}>{e.category}</span>
                  </div>
                  <div className="space-y-1 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <CalendarDays size={11} />
                      <span>{e.startDate === e.endDate ? e.startDate : `${e.startDate} ~ ${e.endDate}`}</span>
                    </div>
                    {e.location && (
                      <div className="flex items-center gap-1.5">
                        <MapPin size={11} />
                        <span className="truncate">{e.location}</span>
                      </div>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      <PageHeader
        title="인계 메모"
        description="업무 인계 사항과 할 일을 기록합니다."
        actions={
          <button onClick={openCreateModal} className="btn-primary">
            <Plus size={16} />
            새 메모
          </button>
        }
      />

      {/* 필터 & 정렬 */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1">
          {filterButtons.map((btn) => (
            <button
              key={btn.key}
              onClick={() => setFilter(btn.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                filter === btn.key
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as Sort)}
          className="select-input w-auto text-sm"
        >
          <option value="latest">최신순</option>
          <option value="dueDate">마감일순</option>
        </select>
      </div>

      {filtered.length === 0 && (
        <EmptyState
          title="등록된 인계 메모가 없습니다."
          description="새 메모를 작성해서 이번 기수 업무를 정리해보세요."
          action={
            <button onClick={openCreateModal} className="btn-primary">
              <Plus size={16} />
              새 메모 작성
            </button>
          }
        />
      )}

      {/* 중요 메모 섹션 */}
      {importantMemos.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Flag size={15} className="text-red-500" />
            <h2 className="text-sm font-semibold text-slate-700">중요 메모</h2>
            <span className="text-xs text-slate-400">{importantMemos.length}개</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {importantMemos.map((m) => (
              <MemoCard
                key={m.id}
                memo={m}
                onEdit={openEditModal}
                onDelete={(id) => setDeleteConfirm(id)}
                onTogglePriority={togglePriority}
                onToggleStatus={toggleStatus}
              />
            ))}
          </div>
        </div>
      )}

      {/* 전체 메모 */}
      {otherMemos.length > 0 && (
        <div>
          {importantMemos.length > 0 && (
            <h2 className="text-sm font-semibold text-slate-700 mb-3">전체 메모</h2>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {otherMemos.map((m) => (
              <MemoCard
                key={m.id}
                memo={m}
                onEdit={openEditModal}
                onDelete={(id) => setDeleteConfirm(id)}
                onTogglePriority={togglePriority}
                onToggleStatus={toggleStatus}
              />
            ))}
          </div>
        </div>
      )}

      {/* 작성/수정 모달 */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTarget ? '메모 수정' : '새 메모'}
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="btn-secondary">취소</button>
            <button onClick={handleSave} className="btn-primary">저장</button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">제목 *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="메모 제목"
              className="input"
            />
          </div>
          <div>
            <label className="label">내용</label>
            <textarea
              rows={4}
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="업무 내용을 작성하세요."
              className="textarea"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">부서</label>
              <select
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value as Department | '' })}
                className="select-input"
              >
                <option value="">선택 안함</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">마감일</label>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className="input"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">우선순위</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value as 'normal' | 'important' })}
                className="select-input"
              >
                <option value="normal">일반</option>
                <option value="important">중요</option>
              </select>
            </div>
            <div>
              <label className="label">상태</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as 'open' | 'done' })}
                className="select-input"
              >
                <option value="open">진행중</option>
                <option value="done">완료</option>
              </select>
            </div>
          </div>
        </div>
      </Modal>

      {/* 삭제 확인 모달 */}
      <Modal
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="메모 삭제"
        size="sm"
        footer={
          <>
            <button onClick={() => setDeleteConfirm(null)} className="btn-secondary">취소</button>
            <button onClick={() => deleteConfirm && handleDelete(deleteConfirm)} className="btn-danger">삭제</button>
          </>
        }
      >
        <p className="text-sm text-slate-600">이 메모를 삭제하시겠습니까? 삭제된 메모는 복구할 수 없습니다.</p>
      </Modal>
    </div>
  )
}
