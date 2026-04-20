import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Plus, CalendarDays, LayoutGrid, ChevronLeft, ChevronRight, MapPin, Users, Wallet } from 'lucide-react'
import { useEventStore } from '../store/useEventStore'
import { useCohortStore } from '../store/useCohortStore'
import { PageHeader } from '../components/common/PageHeader'
import { StatusBadge } from '../components/common/StatusBadge'
import { Modal } from '../components/common/Modal'
import { EmptyState } from '../components/common/EmptyState'
import { useToast } from '../components/common/Toast'
import type { CoworkEvent, EventStatus, EventCategory, Department } from '../types'
import { DEPARTMENTS } from '../types'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

function isoDate(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

function rangeContains(start: string, end: string, day: string) {
  return day >= start && day <= end
}

const EVENT_CATEGORIES: EventCategory[] = ['OT', '정기총회', 'MT', '체육대회', '축제', '간담회', '기타']

const coverColorMap: Record<string, string> = {
  blue: 'bg-blue-500',
  green: 'bg-emerald-500',
  orange: 'bg-amber-500',
  purple: 'bg-purple-500',
  red: 'bg-red-500',
}

const coverBorderMap: Record<string, string> = {
  blue: 'border-l-blue-500',
  green: 'border-l-emerald-500',
  orange: 'border-l-amber-500',
  purple: 'border-l-purple-500',
  red: 'border-l-red-500',
}

const coverTextMap: Record<string, string> = {
  blue: 'text-blue-600',
  green: 'text-emerald-600',
  orange: 'text-amber-600',
  purple: 'text-purple-600',
  red: 'text-red-600',
}

function eventStatusBadge(status: EventStatus) {
  if (status === 'planning') return <StatusBadge label="기획중" variant="blue" />
  if (status === 'ongoing') return <StatusBadge label="진행중" variant="green" />
  if (status === 'done') return <StatusBadge label="완료" variant="gray" />
  if (status === 'cancelled') return <StatusBadge label="취소" variant="red" />
  return null
}

function formatDateRange(start: string, end: string) {
  if (start === end) return start
  return `${start} ~ ${end}`
}

function formatBudget(amount: number) {
  return `₩${amount.toLocaleString()}`
}

// ── 행사 카드 ─────────────────────────────────────────────────────────────────

function EventCard({ event }: { event: CoworkEvent }) {
  const color = event.coverColor ?? 'blue'
  const borderClass = coverBorderMap[color] ?? 'border-l-blue-500'
  const textClass = coverTextMap[color] ?? 'text-blue-600'

  return (
    <Link
      to={`/events/${event.id}`}
      className={`block bg-white rounded-xl border border-slate-200 border-l-4 ${borderClass} p-5 hover:shadow-md transition-shadow`}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <h3 className={`font-semibold text-slate-900 text-sm leading-snug flex-1`}>{event.name}</h3>
        {eventStatusBadge(event.status)}
      </div>

      <div className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-md mb-3 ${textClass} bg-slate-50 border border-slate-200`}>
        {event.category}
      </div>

      <div className="space-y-1.5 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <CalendarDays size={13} className="shrink-0" />
          <span>{formatDateRange(event.startDate, event.endDate)}</span>
        </div>
        {event.location && (
          <div className="flex items-center gap-1.5">
            <MapPin size={13} className="shrink-0" />
            <span className="truncate">{event.location}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <Users size={13} className="shrink-0" />
          <span>{event.leadDepartment} · {event.organizers.join(', ')}</span>
        </div>
        {event.budget !== undefined && (
          <div className="flex items-center gap-1.5">
            <Wallet size={13} className="shrink-0" />
            <span>계획 예산 {formatBudget(event.budget)}</span>
          </div>
        )}
      </div>
    </Link>
  )
}

// ── 캘린더 뷰 ─────────────────────────────────────────────────────────────────

function CalendarView({ events }: { events: CoworkEvent[] }) {
  const today = new Date()
  const [calYear, setCalYear] = useState(today.getFullYear())
  const [calMonth, setCalMonth] = useState(today.getMonth())

  const firstDay = new Date(calYear, calMonth, 1).getDay()
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate()
  const prevMonthDays = new Date(calYear, calMonth, 0).getDate()

  const cells: Array<{ dateStr: string; isCurrentMonth: boolean }> = []
  for (let i = 0; i < firstDay; i++) {
    const d = prevMonthDays - firstDay + 1 + i
    cells.push({ dateStr: isoDate(calYear, calMonth - 1, d), isCurrentMonth: false })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ dateStr: isoDate(calYear, calMonth, d), isCurrentMonth: true })
  }
  const remaining = 42 - cells.length
  for (let d = 1; d <= remaining; d++) {
    cells.push({ dateStr: isoDate(calYear, calMonth + 1, d), isCurrentMonth: false })
  }

  const todayStr = isoDate(today.getFullYear(), today.getMonth(), today.getDate())

  return (
    <div>
      {/* 월 이동 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => {
            if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1) }
            else setCalMonth(m => m - 1)
          }}
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="font-semibold text-slate-800 text-sm">
          {calYear}년 {calMonth + 1}월
        </span>
        <button
          onClick={() => {
            if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1) }
            else setCalMonth(m => m + 1)
          }}
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-center text-xs font-medium text-slate-400 py-1">{d}</div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      <div className="grid grid-cols-7 gap-px bg-slate-200 rounded-xl overflow-hidden">
        {cells.map(({ dateStr, isCurrentMonth }) => {
          const dayEvents = events.filter((e) => rangeContains(e.startDate, e.endDate, dateStr))
          const isToday = dateStr === todayStr
          const dayNum = parseInt(dateStr.slice(8), 10)

          return (
            <div
              key={dateStr}
              className={`bg-white min-h-[80px] p-1.5 ${!isCurrentMonth ? 'opacity-40' : ''}`}
            >
              <div
                className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1 ${
                  isToday ? 'bg-blue-600 text-white' : 'text-slate-600'
                }`}
              >
                {dayNum}
              </div>
              <div className="space-y-0.5">
                {dayEvents.slice(0, 2).map((e) => {
                  const color = e.coverColor ?? 'blue'
                  const bgClass = coverColorMap[color] ?? 'bg-blue-500'
                  return (
                    <Link
                      key={e.id}
                      to={`/events/${e.id}`}
                      className={`block text-white text-[10px] leading-tight px-1 py-0.5 rounded truncate ${bgClass} hover:opacity-90`}
                    >
                      {e.name}
                    </Link>
                  )
                })}
                {dayEvents.length > 2 && (
                  <div className="text-[10px] text-slate-400 px-1">+{dayEvents.length - 2}개</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── 생성/수정 모달 ─────────────────────────────────────────────────────────────

type FormState = {
  name: string
  category: EventCategory
  status: EventStatus
  startDate: string
  endDate: string
  location: string
  leadDepartment: Department
  organizers: string
  budget: string
  description: string
  coverColor: string
}

const DEFAULT_FORM: FormState = {
  name: '',
  category: 'OT',
  status: 'planning',
  startDate: '',
  endDate: '',
  location: '',
  leadDepartment: '기획국',
  organizers: '',
  budget: '',
  description: '',
  coverColor: 'blue',
}

function toFormState(event: CoworkEvent): FormState {
  return {
    name: event.name,
    category: event.category,
    status: event.status,
    startDate: event.startDate,
    endDate: event.endDate,
    location: event.location ?? '',
    leadDepartment: event.leadDepartment,
    organizers: event.organizers.join(', '),
    budget: event.budget?.toString() ?? '',
    description: event.description ?? '',
    coverColor: event.coverColor ?? 'blue',
  }
}

interface EventModalProps {
  open: boolean
  onClose: () => void
  editTarget: CoworkEvent | null
  currentCohortId: string
}

function EventModal({ open, onClose, editTarget, currentCohortId }: EventModalProps) {
  const { addEvent, updateEvent } = useEventStore()
  const toast = useToast()

  const [form, setForm] = useState<FormState>(DEFAULT_FORM)

  React.useEffect(() => {
    if (open) {
      setForm(editTarget ? toFormState(editTarget) : DEFAULT_FORM)
    }
  }, [open, editTarget])

  function set(key: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleSave() {
    if (!form.name.trim()) { toast.error('행사명을 입력해주세요.'); return }
    if (!form.startDate) { toast.error('시작일을 입력해주세요.'); return }
    if (!form.endDate) { toast.error('종료일을 입력해주세요.'); return }

    const payload = {
      cohortId: currentCohortId,
      name: form.name.trim(),
      category: form.category,
      status: form.status,
      startDate: form.startDate,
      endDate: form.endDate,
      location: form.location.trim() || undefined,
      leadDepartment: form.leadDepartment,
      organizers: form.organizers.split(',').map((s) => s.trim()).filter(Boolean),
      budget: form.budget ? parseInt(form.budget, 10) : undefined,
      description: form.description.trim() || undefined,
      coverColor: form.coverColor,
      createdBy: '김민준',
    }

    if (editTarget) {
      updateEvent(editTarget.id, payload)
      toast.success('행사가 수정되었습니다.')
    } else {
      addEvent(payload)
      toast.success('행사가 등록되었습니다.')
    }
    onClose()
  }

  const inputCls = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
  const labelCls = 'block text-xs font-medium text-slate-600 mb-1'

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editTarget ? '행사 수정' : '새 행사 등록'}
      size="lg"
      footer={
        <>
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg border border-slate-200">
            취소
          </button>
          <button onClick={handleSave} className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            {editTarget ? '저장' : '등록'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className={labelCls}>행사명 <span className="text-red-500">*</span></label>
          <input className={inputCls} value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="예: 4월 정기총회" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>카테고리</label>
            <select className={inputCls} value={form.category} onChange={(e) => set('category', e.target.value as EventCategory)}>
              {EVENT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>상태</label>
            <select className={inputCls} value={form.status} onChange={(e) => set('status', e.target.value as EventStatus)}>
              <option value="planning">기획중</option>
              <option value="ongoing">진행중</option>
              <option value="done">완료</option>
              <option value="cancelled">취소</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>시작일 <span className="text-red-500">*</span></label>
            <input type="date" className={inputCls} value={form.startDate} onChange={(e) => set('startDate', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>종료일 <span className="text-red-500">*</span></label>
            <input type="date" className={inputCls} value={form.endDate} onChange={(e) => set('endDate', e.target.value)} />
          </div>
        </div>

        <div>
          <label className={labelCls}>장소</label>
          <input className={inputCls} value={form.location} onChange={(e) => set('location', e.target.value)} placeholder="예: 공학관 세미나실 201호" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>주관부서</label>
            <select className={inputCls} value={form.leadDepartment} onChange={(e) => set('leadDepartment', e.target.value as Department)}>
              {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>계획 예산 (원)</label>
            <input type="number" className={inputCls} value={form.budget} onChange={(e) => set('budget', e.target.value)} placeholder="예: 300000" />
          </div>
        </div>

        <div>
          <label className={labelCls}>담당자 (쉼표로 구분)</label>
          <input className={inputCls} value={form.organizers} onChange={(e) => set('organizers', e.target.value)} placeholder="예: 박지훈, 정다은" />
        </div>

        <div>
          <label className={labelCls}>색상</label>
          <div className="flex gap-2 mt-1">
            {Object.entries(coverColorMap).map(([key, bgClass]) => (
              <button
                key={key}
                onClick={() => set('coverColor', key)}
                className={`w-7 h-7 rounded-full ${bgClass} border-2 transition-all ${form.coverColor === key ? 'border-slate-700 scale-110' : 'border-transparent'}`}
              />
            ))}
          </div>
        </div>

        <div>
          <label className={labelCls}>설명</label>
          <textarea
            className={`${inputCls} resize-none`}
            rows={3}
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="행사에 대한 간략한 설명을 입력하세요."
          />
        </div>
      </div>
    </Modal>
  )
}

// ── 메인 페이지 ───────────────────────────────────────────────────────────────

type StatusFilter = '' | 'planning' | 'ongoing' | 'done' | 'cancelled'

export default function EventsPage() {
  const { currentCohortId } = useCohortStore()
  const { events } = useEventStore()

  const [view, setView] = useState<'list' | 'calendar'>('list')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<CoworkEvent | null>(null)

  const cohortEvents = useMemo(
    () => events.filter((e) => e.cohortId === currentCohortId),
    [events, currentCohortId]
  )

  const filtered = useMemo(() => {
    let list = cohortEvents
    if (statusFilter) list = list.filter((e) => e.status === statusFilter)
    return list.sort((a, b) => a.startDate.localeCompare(b.startDate))
  }, [cohortEvents, statusFilter])

  const filterButtons: Array<{ value: StatusFilter; label: string }> = [
    { value: '', label: '전체' },
    { value: 'planning', label: '기획중' },
    { value: 'ongoing', label: '진행중' },
    { value: 'done', label: '완료' },
    { value: 'cancelled', label: '취소' },
  ]

  function openCreate() {
    setEditTarget(null)
    setModalOpen(true)
  }

  return (
    <div className="p-8">
      <PageHeader
        title="행사 관리"
        description="학생회 행사를 등록하고 파일·예산·설문 등을 통합 관리합니다."
        actions={
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
          >
            <Plus size={16} />
            새 행사
          </button>
        }
      />

      {/* 필터 & 뷰 토글 */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex gap-1">
          {filterButtons.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setStatusFilter(value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                statusFilter === value
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {label}
              {value === '' && (
                <span className="ml-1 text-[10px] opacity-70">({cohortEvents.length})</span>
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
          <button
            onClick={() => setView('list')}
            className={`p-1.5 rounded-md transition-colors ${view === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
            title="카드 목록"
          >
            <LayoutGrid size={16} />
          </button>
          <button
            onClick={() => setView('calendar')}
            className={`p-1.5 rounded-md transition-colors ${view === 'calendar' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
            title="캘린더"
          >
            <CalendarDays size={16} />
          </button>
        </div>
      </div>

      {/* 본문 */}
      {view === 'list' ? (
        filtered.length === 0 ? (
          <EmptyState
            icon={<CalendarDays size={32} className="text-slate-300" />}
            title="행사가 없습니다"
            description="새 행사를 등록하면 파일·예산·설문을 한 곳에서 관리할 수 있습니다."
            action={
              <button
                onClick={openCreate}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
              >
                <Plus size={16} />
                새 행사 등록
              </button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <CalendarView events={cohortEvents} />
        </div>
      )}

      <EventModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        editTarget={editTarget}
        currentCohortId={currentCohortId}
      />
    </div>
  )
}
