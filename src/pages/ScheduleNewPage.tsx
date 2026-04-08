import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useScheduleStore } from '../store/useScheduleStore'
import { useCohortStore } from '../store/useCohortStore'
import { PageHeader } from '../components/common/PageHeader'
import { useToast } from '../components/common/Toast'

export default function TimetableNewPage() {
  const navigate = useNavigate()
  const { addSchedule } = useScheduleStore()
  const { currentCohortId } = useCohortStore()
  const toast = useToast()

  const [form, setForm] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    startTime: '09:00',
    endTime: '21:00',
    slotMinutes: '60' as '30' | '60',
    participants: '',
  })

  const handleCreate = () => {
    if (!form.title || !form.startDate || !form.endDate) {
      toast.error('제목, 시작일, 종료일은 필수입니다.')
      return
    }
    const id = addSchedule({
      cohortId: currentCohortId,
      title: form.title,
      description: form.description || undefined,
      dateRange: { start: form.startDate, end: form.endDate },
      timeRange: { start: form.startTime, end: form.endTime },
      slotMinutes: Number(form.slotMinutes) as 30 | 60,
      participants: form.participants.split(',').map((p) => p.trim()).filter(Boolean),
      status: 'open',
      createdBy: '김민준',
    })
    toast.success('조율방이 생성되었습니다.')
    navigate(`/schedules/${id}/respond`)
  }

  return (
    <div className="max-w-xl mx-auto">
      <PageHeader
        title="시간 조율 만들기"
        actions={<Link to="/schedules" className="btn-secondary">취소</Link>}
      />

      <div className="card p-6 space-y-5">
        <div>
          <label className="label">일정명 *</label>
          <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="예: 4월 정기총회 날짜 조율" className="input" />
        </div>
        <div>
          <label className="label">설명</label>
          <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="textarea" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">시작일 *</label>
            <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="input" />
          </div>
          <div>
            <label className="label">종료일 *</label>
            <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="input" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">시작 시간</label>
            <input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} className="input" />
          </div>
          <div>
            <label className="label">종료 시간</label>
            <input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} className="input" />
          </div>
        </div>
        <div>
          <label className="label">슬롯 단위</label>
          <select value={form.slotMinutes} onChange={(e) => setForm({ ...form, slotMinutes: e.target.value as '30' | '60' })} className="select-input">
            <option value="30">30분</option>
            <option value="60">1시간</option>
          </select>
        </div>
        <div>
          <label className="label">참여 대상 (쉼표 구분)</label>
          <input type="text" value={form.participants} onChange={(e) => setForm({ ...form, participants: e.target.value })} placeholder="예: 김민준, 이서연, 박지훈" className="input" />
        </div>
        <button onClick={handleCreate} className="btn-primary w-full justify-center py-2.5 text-base">
          조율방 생성
        </button>
      </div>
    </div>
  )
}
