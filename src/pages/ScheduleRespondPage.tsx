import React, { useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, RotateCcw, CheckCircle, AlertCircle } from 'lucide-react'
import { useScheduleStore } from '../store/useScheduleStore'
import { TimetableStatusBadge } from '../components/common/StatusBadge'
import { useToast } from '../components/common/Toast'
import type { TimeSlot } from '../types'

function generateDates(start: string, end: string): string[] {
  const dates: string[] = []
  const d = new Date(start)
  const e = new Date(end)
  while (d <= e) {
    dates.push(d.toISOString().slice(0, 10))
    d.setDate(d.getDate() + 1)
  }
  return dates
}

function generateTimes(start: string, end: string, slotMinutes: number): string[] {
  const times: string[] = []
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  let mins = sh * 60 + sm
  const endMins = eh * 60 + em
  while (mins < endMins) {
    const h = Math.floor(mins / 60)
    const m = mins % 60
    times.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    mins += slotMinutes
  }
  return times
}

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토']

export default function TimetableRespondPage() {
  const { pollId } = useParams<{ pollId: string }>()
  const { schedules, addResponse } = useScheduleStore()
  const toast = useToast()

  const tt = schedules.find((t) => t.id === pollId)
  const [name, setName] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [dragging, setDragging] = useState(false)
  const [dragAction, setDragAction] = useState<'add' | 'remove'>('add')
  const [submitted, setSubmitted] = useState(false)

  if (!tt) return <div className="p-8 text-slate-500">조율을 찾을 수 없습니다.</div>

  if (tt.status === 'closed') {
    return (
      <div className="max-w-xl mx-auto py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
          <AlertCircle size={32} className="text-slate-400" />
        </div>
        <h2 className="text-lg font-bold text-slate-800 mb-2">마감된 조율입니다</h2>
        <Link to="/schedules" className="btn-secondary">목록으로</Link>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={32} className="text-green-600" />
        </div>
        <h2 className="text-lg font-bold text-slate-800 mb-2">응답이 저장되었습니다!</h2>
        <p className="text-sm text-slate-500 mb-6">{selected.size}개 슬롯 선택 완료</p>
        <div className="flex gap-2 justify-center">
          <Link to={`/schedules/${pollId}/results`} className="btn-primary">결과 확인하기</Link>
          <Link to="/schedules" className="btn-secondary">목록으로</Link>
        </div>
      </div>
    )
  }

  const dates = generateDates(tt.dateRange.start, tt.dateRange.end)
  const times = generateTimes(tt.timeRange.start, tt.timeRange.end, tt.slotMinutes)

  const slotKey = (date: string, time: string) => `${date}_${time}`

  const toggle = (date: string, time: string) => {
    const key = slotKey(date, time)
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  const handleMouseDown = (date: string, time: string) => {
    const key = slotKey(date, time)
    setDragAction(selected.has(key) ? 'remove' : 'add')
    setDragging(true)
    toggle(date, time)
  }

  const handleMouseEnter = (date: string, time: string) => {
    if (!dragging) return
    const key = slotKey(date, time)
    setSelected((prev) => {
      const next = new Set(prev)
      if (dragAction === 'add') next.add(key)
      else next.delete(key)
      return next
    })
  }

  const handleSubmit = () => {
    if (!name.trim()) { toast.error('이름을 입력해주세요.'); return }
    const slots: TimeSlot[] = Array.from(selected).map((k) => {
      const [date, time] = k.split('_')
      return { date, time }
    })
    addResponse(pollId!, {
      participantName: name.trim(),
      availableSlots: slots,
      respondedAt: new Date().toISOString(),
    })
    setSubmitted(true)
  }

  return (
    <div
      className="max-w-4xl mx-auto"
      onMouseUp={() => setDragging(false)}
    >
      <Link to="/schedules" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600 mb-5">
        <ArrowLeft size={15} />타임테이블 목록
      </Link>

      <div className="card p-5 mb-5">
        <div className="flex items-start justify-between mb-2">
          <h1 className="text-xl font-bold text-slate-900">{tt.title}</h1>
          <TimetableStatusBadge status={tt.status} />
        </div>
        {tt.description && <p className="text-sm text-slate-600 mb-2">{tt.description}</p>}
        <p className="text-xs text-slate-400">{tt.dateRange.start} ~ {tt.dateRange.end} · {tt.timeRange.start} ~ {tt.timeRange.end} · {tt.slotMinutes}분 단위</p>
      </div>

      {/* 이름 입력 */}
      <div className="card p-4 mb-5 flex items-center gap-3">
        <label className="text-sm font-medium text-slate-700 shrink-0">이름 *</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="본인 이름을 입력하세요"
          className="input flex-1"
        />
        <span className="text-xs text-slate-500 shrink-0">{selected.size}개 선택</span>
        <button onClick={() => setSelected(new Set())} className="btn-secondary py-1.5 text-xs shrink-0">
          <RotateCcw size={13} />초기화
        </button>
      </div>

      {/* 그리드 */}
      <div className="card overflow-hidden mb-5">
        <div className="overflow-x-auto">
          <table className="w-full select-none">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="w-16 text-xs font-medium text-slate-500 px-3 py-2.5 text-right">시간</th>
                {dates.map((d) => {
                  const day = new Date(d).getDay()
                  return (
                    <th key={d} className="text-center text-xs font-medium text-slate-600 px-2 py-2.5 min-w-[52px]">
                      <div className={`font-semibold ${day === 0 ? 'text-red-500' : day === 6 ? 'text-blue-500' : 'text-slate-700'}`}>
                        {d.slice(5)}
                      </div>
                      <div className="text-slate-400">{DAY_NAMES[day]}</div>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {times.map((time) => (
                <tr key={time} className="border-b border-slate-100">
                  <td className="text-right text-xs text-slate-400 px-3 py-1 w-16">{time}</td>
                  {dates.map((date) => {
                    const key = slotKey(date, time)
                    const isSelected = selected.has(key)
                    return (
                      <td key={date} className="px-1 py-0.5">
                        <div
                          onMouseDown={() => handleMouseDown(date, time)}
                          onMouseEnter={() => handleMouseEnter(date, time)}
                          className={`h-8 rounded cursor-pointer transition-colors border ${
                            isSelected
                              ? 'bg-blue-500 border-blue-400'
                              : 'bg-slate-100 border-slate-200 hover:bg-blue-100 hover:border-blue-300'
                          }`}
                        />
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-slate-400 text-center mb-3">셀을 클릭하거나 드래그하여 가능한 시간을 선택하세요.</p>

      <button onClick={handleSubmit} className="btn-primary w-full justify-center py-3 text-base">
        응답 저장
      </button>
    </div>
  )
}
