import React, { useState, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit2, Trash2, Calendar, Users, Save, X, Paperclip, CalendarDays } from 'lucide-react'
import { useWorkspaceStore } from '../store/useWorkspaceStore'
import { useEventStore } from '../store/useEventStore'
import { useCohortStore } from '../store/useCohortStore'
import { Modal } from '../components/common/Modal'
import { useToast } from '../components/common/Toast'

export default function MeetingDetailPage() {
  const { departmentId, meetingId } = useParams<{ departmentId: string; meetingId: string }>()
  const navigate = useNavigate()
  const { workspaces, updateMeeting, deleteMeeting } = useWorkspaceStore()
  const { events } = useEventStore()
  const { currentCohortId } = useCohortStore()
  const toast = useToast()

  const cohortEvents = useMemo(() => events.filter((e) => e.cohortId === currentCohortId), [events, currentCohortId])

  const workspace = workspaces.find((ws) => ws.id === departmentId)
  const meeting = workspace?.meetings.find((m) => m.id === meetingId)

  const [editing, setEditing] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [form, setForm] = useState({
    title: meeting?.title ?? '',
    date: meeting?.date ?? '',
    attendees: meeting?.attendees.join(', ') ?? '',
    agenda: meeting?.agenda ?? '',
    content: meeting?.content ?? '',
    eventId: meeting?.eventId ?? '',
  })

  if (!workspace || !meeting) return <div className="p-8 text-slate-500">회의록을 찾을 수 없습니다.</div>

  const handleSave = () => {
    updateMeeting(workspace.id, meeting.id, {
      title: form.title,
      date: form.date,
      attendees: form.attendees.split(',').map((a) => a.trim()).filter(Boolean),
      agenda: form.agenda,
      content: form.content,
      eventId: form.eventId || undefined,
    })
    toast.success('회의록이 수정되었습니다.')
    setEditing(false)
  }

  const handleDelete = () => {
    deleteMeeting(workspace.id, meeting.id)
    toast.success('회의록이 삭제되었습니다.')
    navigate(`/workspaces/${workspace.id}`)
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-5">
        <Link to="/workspaces" className="hover:text-blue-600">워크스페이스</Link>
        <span>/</span>
        <Link to={`/workspaces/${workspace.id}`} className="hover:text-blue-600">{workspace.name}</Link>
        <span>/</span>
        <span className="text-slate-900 font-medium truncate">{meeting.title}</span>
      </div>

      <div className="flex items-center justify-between mb-6">
        {editing ? (
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="input text-xl font-bold text-slate-900 flex-1 mr-4"
          />
        ) : (
          <h1 className="text-2xl font-bold text-slate-900">{meeting.title}</h1>
        )}
        <div className="flex items-center gap-2 shrink-0">
          {editing ? (
            <>
              <button onClick={() => setEditing(false)} className="btn-secondary"><X size={15} />취소</button>
              <button onClick={handleSave} className="btn-primary"><Save size={15} />저장</button>
            </>
          ) : (
            <>
              <button onClick={() => setEditing(true)} className="btn-secondary"><Edit2 size={15} />수정</button>
              <button onClick={() => setDeleteConfirm(true)} className="btn-danger"><Trash2 size={15} />삭제</button>
            </>
          )}
        </div>
      </div>

      {/* 메타 정보 */}
      <div className="card p-4 mb-5 flex items-center gap-6 text-sm flex-wrap">
        <div className="flex items-center gap-2">
          <Calendar size={15} className="text-slate-400" />
          {editing ? (
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="input w-36 py-1" />
          ) : (
            <span className="text-slate-700 font-medium">{meeting.date}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Users size={15} className="text-slate-400" />
          {editing ? (
            <input type="text" value={form.attendees} onChange={(e) => setForm({ ...form, attendees: e.target.value })} className="input w-64 py-1" placeholder="쉼표로 구분" />
          ) : (
            <span className="text-slate-700">{meeting.attendees.join(', ')}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <CalendarDays size={15} className="text-slate-400" />
          {editing ? (
            <select value={form.eventId} onChange={(e) => setForm({ ...form, eventId: e.target.value })} className="select-input py-1 text-sm">
              <option value="">행사 미연결</option>
              {cohortEvents.map((ev) => (
                <option key={ev.id} value={ev.id}>{ev.name} ({ev.startDate})</option>
              ))}
            </select>
          ) : meeting.eventId ? (
            (() => {
              const ev = cohortEvents.find((e) => e.id === meeting.eventId)
              return ev ? (
                <Link to={`/events/${ev.id}`} className="text-blue-600 hover:underline font-medium">{ev.name}</Link>
              ) : <span className="text-slate-400">-</span>
            })()
          ) : (
            <span className="text-slate-400">행사 미연결</span>
          )}
        </div>
      </div>

      {/* 안건 */}
      <div className="card p-5 mb-4">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">안건</h2>
        {editing ? (
          <textarea rows={4} value={form.agenda} onChange={(e) => setForm({ ...form, agenda: e.target.value })} className="textarea" />
        ) : (
          <div className="text-sm text-slate-700 whitespace-pre-wrap">{meeting.agenda || <span className="text-slate-400">안건 없음</span>}</div>
        )}
      </div>

      {/* 내용 */}
      <div className="card p-5 mb-4">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">회의 내용</h2>
        {editing ? (
          <textarea rows={8} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className="textarea" />
        ) : (
          <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
            {meeting.content || <span className="text-slate-400">내용 없음</span>}
          </div>
        )}
      </div>

      {/* 첨부 파일 */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-700">첨부 파일</h2>
        </div>
        {meeting.attachments.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Paperclip size={15} />
            <span>첨부 파일이 없습니다.</span>
          </div>
        ) : (
          <div className="space-y-2">
            {meeting.attachments.map((att) => (
              <div key={att.id} className="flex items-center gap-2 text-sm">
                <Paperclip size={14} className="text-slate-400" />
                <a href={att.url} className="text-blue-600 hover:underline">{att.name}</a>
                <span className="text-xs text-slate-400">({(att.size / 1024).toFixed(1)} KB)</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 삭제 확인 */}
      <Modal open={deleteConfirm} onClose={() => setDeleteConfirm(false)} title="회의록 삭제" size="sm"
        footer={<><button onClick={() => setDeleteConfirm(false)} className="btn-secondary">취소</button><button onClick={handleDelete} className="btn-danger">삭제</button></>}
      >
        <p className="text-sm text-slate-600">이 회의록을 삭제하시겠습니까?</p>
      </Modal>
    </div>
  )
}
