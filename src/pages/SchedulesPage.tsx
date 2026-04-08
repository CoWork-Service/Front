import React, { useState, useMemo } from 'react'
import { Plus, CalendarClock, Users, ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useScheduleStore } from '../store/useScheduleStore'
import { useWorkspaceStore } from '../store/useWorkspaceStore'
import { useCohortStore } from '../store/useCohortStore'
import { PageHeader } from '../components/common/PageHeader'
import { TimetableStatusBadge } from '../components/common/StatusBadge'
import { EmptyState } from '../components/common/EmptyState'
import { Modal } from '../components/common/Modal'
import { useToast } from '../components/common/Toast'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

function isoDate(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

function addDays(dateStr: string, n: number) {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

function rangeContains(start: string, end: string, day: string) {
  return day >= start && day <= end
}

type CalEvent = {
  id: string
  label: string
  date?: string        // 단일 날짜 이벤트 (회의록)
  start?: string       // 기간 이벤트 (조율)
  end?: string
  color: string        // tailwind bg class
  href: string
}

export default function TimetablesPage() {
  const { currentCohortId } = useCohortStore()
  const { schedules, updateStatus } = useScheduleStore()
  const { workspaces } = useWorkspaceStore()
  const toast = useToast()

  const [view, setView] = useState<'calendar' | 'polls'>('calendar')
  const [statusFilter, setStatusFilter] = useState('')
  const [closeConfirm, setCloseConfirm] = useState<string | null>(null)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)

  // 현재 달 (year, month 0-indexed)
  const today = new Date()
  const [calYear, setCalYear] = useState(today.getFullYear())
  const [calMonth, setCalMonth] = useState(today.getMonth())

  const cohortTimetables = useMemo(
    () => schedules.filter((t) => t.cohortId === currentCohortId),
    [schedules, currentCohortId]
  )

  const cohortMeetings = useMemo(() => {
    return workspaces
      .filter((ws) => ws.cohortId === currentCohortId)
      .flatMap((ws) => ws.meetings.map((m) => ({ ...m, wsId: ws.id })))
  }, [workspaces, currentCohortId])

  // 캘린더 이벤트 합산
  const calEvents: CalEvent[] = useMemo(() => {
    const events: CalEvent[] = []
    cohortTimetables.forEach((tt) => {
      events.push({
        id: tt.id,
        label: tt.title,
        start: tt.dateRange.start,
        end: tt.dateRange.end,
        color: tt.status === 'open' ? 'bg-blue-500' : 'bg-slate-400',
        href: `/schedules/${tt.id}/results`,
      })
    })
    cohortMeetings.forEach((m) => {
      events.push({
        id: m.id,
        label: m.title,
        date: m.date,
        color: 'bg-green-500',
        href: `/workspaces/${m.wsId}/meetings/${m.id}`,
      })
    })
    return events
  }, [cohortTimetables, cohortMeetings])

  // 달력 날짜 계산
  const firstDay = new Date(calYear, calMonth, 1).getDay() // 0=일
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate()
  const todayStr = today.toISOString().slice(0, 10)

  function getEventsForDay(dayStr: string): CalEvent[] {
    return calEvents.filter((e) => {
      if (e.date) return e.date === dayStr
      if (e.start && e.end) return rangeContains(e.start, e.end, dayStr)
      return false
    })
  }

  function prevMonth() {
    if (calMonth === 0) { setCalYear(calYear - 1); setCalMonth(11) }
    else setCalMonth(calMonth - 1)
    setSelectedDay(null)
  }
  function nextMonth() {
    if (calMonth === 11) { setCalYear(calYear + 1); setCalMonth(0) }
    else setCalMonth(calMonth + 1)
    setSelectedDay(null)
  }

  const selectedEvents = selectedDay ? getEventsForDay(selectedDay) : []

  const filtered = useMemo(() => {
    if (!statusFilter) return cohortTimetables
    return cohortTimetables.filter((t) => t.status === statusFilter)
  }, [cohortTimetables, statusFilter])

  return (
    <div>
      <PageHeader
        title="일정 관리"
        description="캘린더로 일정을 확인하고 가능한 시간을 조율합니다."
        actions={
          <Link to="/schedules/new" className="btn-primary">
            <Plus size={16} />
            조율 만들기
          </Link>
        }
      />

      {/* 뷰 탭 */}
      <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1 mb-5 w-fit">
        <button
          onClick={() => setView('calendar')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5 ${view === 'calendar' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          <Calendar size={14} />캘린더
        </button>
        <button
          onClick={() => setView('polls')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5 ${view === 'polls' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          <CalendarClock size={14} />시간 조율
        </button>
      </div>

      {/* ── 캘린더 뷰 ── */}
      {view === 'calendar' && (
        <div className="grid grid-cols-3 gap-4">
          {/* 달력 */}
          <div className="col-span-2 card overflow-hidden">
            {/* 헤더 */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                <ChevronLeft size={16} className="text-slate-500" />
              </button>
              <h2 className="text-sm font-semibold text-slate-900">
                {calYear}년 {calMonth + 1}월
              </h2>
              <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                <ChevronRight size={16} className="text-slate-500" />
              </button>
            </div>

            {/* 요일 헤더 */}
            <div className="grid grid-cols-7 border-b border-slate-100">
              {WEEKDAYS.map((w, i) => (
                <div key={w} className={`py-2 text-center text-xs font-medium ${i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-slate-500'}`}>
                  {w}
                </div>
              ))}
            </div>

            {/* 날짜 그리드 */}
            <div className="grid grid-cols-7">
              {/* 앞 빈칸 */}
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`blank-${i}`} className="min-h-[88px] border-b border-r border-slate-100 bg-slate-50/50" />
              ))}

              {Array.from({ length: daysInMonth }).map((_, i) => {
                const d = i + 1
                const dayStr = isoDate(calYear, calMonth, d)
                const dayOfWeek = (firstDay + i) % 7
                const isToday = dayStr === todayStr
                const isSelected = dayStr === selectedDay
                const events = getEventsForDay(dayStr)
                const isLastCol = (firstDay + i) % 7 === 6

                return (
                  <div
                    key={d}
                    onClick={() => setSelectedDay(isSelected ? null : dayStr)}
                    className={`min-h-[88px] border-b border-r border-slate-100 p-1.5 cursor-pointer transition-colors ${isLastCol ? 'border-r-0' : ''} ${isSelected ? 'bg-blue-50' : 'hover:bg-slate-50'}`}
                  >
                    <span className={`inline-flex w-6 h-6 items-center justify-center rounded-full text-xs font-medium mb-1 ${isToday ? 'bg-blue-600 text-white' : dayOfWeek === 0 ? 'text-red-500' : dayOfWeek === 6 ? 'text-blue-600' : 'text-slate-700'}`}>
                      {d}
                    </span>
                    <div className="space-y-0.5">
                      {events.slice(0, 2).map((e) => (
                        <div key={e.id} className={`text-[10px] leading-tight px-1 py-0.5 rounded text-white truncate ${e.color}`}>
                          {e.label}
                        </div>
                      ))}
                      {events.length > 2 && (
                        <div className="text-[10px] text-slate-400 px-1">+{events.length - 2}개</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 사이드 패널 */}
          <div className="space-y-4">
            {/* 범례 */}
            <div className="card p-4">
              <p className="text-xs font-semibold text-slate-500 mb-2">범례</p>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-sm bg-blue-500 shrink-0" />진행중 시간 조율
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-sm bg-slate-400 shrink-0" />마감된 시간 조율
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-sm bg-green-500 shrink-0" />워크스페이스 회의
                </div>
              </div>
            </div>

            {/* 선택한 날 이벤트 */}
            {selectedDay ? (
              <div className="card p-4">
                <p className="text-xs font-semibold text-slate-500 mb-3">{selectedDay.slice(5).replace('-', '월 ')}일</p>
                {selectedEvents.length === 0 ? (
                  <p className="text-xs text-slate-400">일정이 없습니다.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedEvents.map((e) => (
                      <Link key={e.id} to={e.href} className="block group">
                        <div className="flex items-start gap-2">
                          <span className={`w-2 h-2 rounded-full mt-1 shrink-0 ${e.color}`} />
                          <p className="text-xs text-slate-700 group-hover:text-blue-600 transition-colors leading-snug">{e.label}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="card p-4 text-center">
                <Calendar size={22} className="mx-auto mb-2 text-slate-300" />
                <p className="text-xs text-slate-400">날짜를 클릭하면<br />일정을 확인할 수 있습니다.</p>
              </div>
            )}

            {/* 이달의 일정 미리보기 */}
            <div className="card p-4">
              <p className="text-xs font-semibold text-slate-500 mb-3">{calMonth + 1}월 일정</p>
              {(() => {
                const monthStart = isoDate(calYear, calMonth, 1)
                const monthEnd = isoDate(calYear, calMonth, daysInMonth)
                const monthEvents = calEvents.filter((e) => {
                  if (e.date) return e.date >= monthStart && e.date <= monthEnd
                  if (e.start && e.end) return e.end >= monthStart && e.start <= monthEnd
                  return false
                })
                if (monthEvents.length === 0) return <p className="text-xs text-slate-400">이달 일정이 없습니다.</p>
                return (
                  <div className="space-y-2">
                    {monthEvents.map((e) => (
                      <Link key={e.id} to={e.href} className="block group">
                        <div className="flex items-start gap-2">
                          <span className={`w-2 h-2 rounded-full mt-1 shrink-0 ${e.color}`} />
                          <div className="min-w-0">
                            <p className="text-xs text-slate-700 group-hover:text-blue-600 transition-colors truncate">{e.label}</p>
                            <p className="text-[10px] text-slate-400">{e.date ?? `${e.start} ~ ${e.end}`}</p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ── 시간 조율 뷰 ── */}
      {view === 'polls' && (
        <>
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1 mb-5 w-fit">
            {[{ v: '', l: '전체' }, { v: 'open', l: '진행중' }, { v: 'closed', l: '마감' }].map(({ v, l }) => (
              <button key={v} onClick={() => setStatusFilter(v)} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${statusFilter === v ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
                {l}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              title="시간 조율이 없습니다."
              description="새 조율을 만들어 가능한 시간을 수집하세요."
              action={<Link to="/schedules/new" className="btn-primary"><Plus size={16} />조율 만들기</Link>}
              icon={<CalendarClock size={28} />}
            />
          ) : (
            <div className="space-y-3">
              {filtered.map((tt) => (
                <div key={tt.id} className="card p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <TimetableStatusBadge status={tt.status} />
                      <h3 className="text-sm font-semibold text-slate-900 truncate">{tt.title}</h3>
                    </div>
                    {tt.description && <p className="text-xs text-slate-500 mb-2 truncate">{tt.description}</p>}
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <span>{tt.dateRange.start} ~ {tt.dateRange.end}</span>
                      <span>{tt.timeRange.start} ~ {tt.timeRange.end}</span>
                      <span className="flex items-center gap-1"><Users size={11} />응답 {tt.responses.length}/{tt.participants.length}명</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {tt.status === 'open' && (
                      <>
                        <Link to={`/schedules/${tt.id}/respond`} className="btn-secondary py-1.5 text-xs">응답하기</Link>
                        <Link to={`/schedules/${tt.id}/results`} className="btn-secondary py-1.5 text-xs">결과 보기</Link>
                        <button onClick={() => setCloseConfirm(tt.id)} className="btn-secondary py-1.5 text-xs">마감</button>
                      </>
                    )}
                    {tt.status === 'closed' && (
                      <Link to={`/schedules/${tt.id}/results`} className="btn-primary py-1.5 text-xs">결과 보기</Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* 마감 확인 */}
      <Modal open={!!closeConfirm} onClose={() => setCloseConfirm(null)} title="조율 마감" size="sm"
        footer={<><button onClick={() => setCloseConfirm(null)} className="btn-secondary">취소</button><button onClick={() => { closeConfirm && updateStatus(closeConfirm, 'closed'); toast.success('마감되었습니다.'); setCloseConfirm(null) }} className="btn-primary">마감하기</button></>}
      >
        <p className="text-sm text-slate-600">이 시간 조율을 마감하시겠습니까? 이후 응답을 받을 수 없습니다.</p>
      </Modal>
    </div>
  )
}
