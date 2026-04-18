import React, { useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Plus, BookOpen, FileText, ArrowLeft, ChevronRight, Calendar, Users, Layers, CalendarDays } from 'lucide-react'
import { useWorkspaceStore } from '../store/useWorkspaceStore'
import { useEventStore } from '../store/useEventStore'
import { useCohortStore } from '../store/useCohortStore'
import { DepartmentTag } from '../components/common/DepartmentTag'
import { EmptyState } from '../components/common/EmptyState'
import { Modal } from '../components/common/Modal'
import { useToast } from '../components/common/Toast'

export default function WorkspaceDetailPage() {
  const { departmentId } = useParams<{ departmentId: string }>()
  const { workspaces, addMeeting, deleteMeeting } = useWorkspaceStore()
  const { events } = useEventStore()
  const { currentCohortId } = useCohortStore()
  const toast = useToast()

  const cohortEvents = useMemo(() => events.filter((e) => e.cohortId === currentCohortId), [events, currentCohortId])

  const workspace = workspaces.find((ws) => ws.id === departmentId)
  const [tab, setTab] = useState<'files' | 'meetings'>('meetings')
  const [newMeetingOpen, setNewMeetingOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [meetingForm, setMeetingForm] = useState({
    title: '', date: '', attendees: '', agenda: '', content: '', eventId: '',
  })

  if (!workspace) return <div className="p-8 text-slate-500">워크스페이스를 찾을 수 없습니다.</div>

  const isAll = workspace.departmentId === '전체'

  const handleAddMeeting = () => {
    if (!meetingForm.title || !meetingForm.date) { toast.error('제목과 날짜는 필수입니다.'); return }
    addMeeting(workspace.id, {
      title: meetingForm.title,
      date: meetingForm.date,
      attendees: meetingForm.attendees.split(',').map((a) => a.trim()).filter(Boolean),
      agenda: meetingForm.agenda,
      content: meetingForm.content,
      attachments: [],
      workspaceId: workspace.id,
      createdBy: '김민준',
      eventId: meetingForm.eventId || undefined,
    })
    toast.success('회의록이 작성되었습니다.')
    setNewMeetingOpen(false)
    setMeetingForm({ title: '', date: '', attendees: '', agenda: '', content: '', eventId: '' })
  }

  return (
    <div>
      <Link to="/workspaces" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600 mb-5">
        <ArrowLeft size={15} />워크스페이스 목록
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {isAll ? (
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center">
                  <Layers size={13} className="text-white" />
                </div>
                <span className="text-sm font-medium text-blue-700">전체 공용</span>
              </div>
            ) : (
              <DepartmentTag department={workspace.departmentId} size="md" />
            )}
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{workspace.name}</h1>
          {workspace.description && <p className="text-sm text-slate-500 mt-1">{workspace.description}</p>}
        </div>
        {tab === 'meetings' && (
          <button onClick={() => setNewMeetingOpen(true)} className="btn-primary">
            <Plus size={16} />
            회의록 작성
          </button>
        )}
      </div>

      {/* 탭 */}
      <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1 mb-6 w-fit">
        <button onClick={() => setTab('meetings')} className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${tab === 'meetings' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
          <span className="flex items-center gap-1.5"><BookOpen size={14} />회의록</span>
        </button>
        <button onClick={() => setTab('files')} className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${tab === 'files' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
          <span className="flex items-center gap-1.5"><FileText size={14} />공유 자료</span>
        </button>
      </div>

      {/* 회의록 탭 */}
      {tab === 'meetings' && (
        <>
          {workspace.meetings.length === 0 ? (
            <EmptyState
              title="회의록이 아직 없습니다."
              description="첫 번째 회의록을 작성해보세요."
              action={<button onClick={() => setNewMeetingOpen(true)} className="btn-primary"><Plus size={16} />회의록 작성</button>}
            />
          ) : (
            <div className="space-y-3">
              {[...workspace.meetings].reverse().map((m) => (
                <Link
                  key={m.id}
                  to={`/workspaces/${workspace.id}/meetings/${m.id}`}
                  className="card p-4 flex items-center gap-4 hover:shadow-md transition-shadow group"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-slate-900 mb-1">{m.title}</h3>
                    <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                      <span className="flex items-center gap-1"><Calendar size={12} />{m.date}</span>
                      <span className="flex items-center gap-1"><Users size={12} />{m.attendees.join(', ')}</span>
                      {m.eventId && (() => {
                        const ev = cohortEvents.find((e) => e.id === m.eventId)
                        return ev ? (
                          <span onClick={(e) => e.preventDefault()} className="flex items-center gap-1 text-blue-600">
                            <CalendarDays size={11} />
                            <Link to={`/events/${ev.id}`} className="hover:underline">{ev.name}</Link>
                          </span>
                        ) : null
                      })()}
                    </div>
                    {m.content && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-1">{m.content}</p>
                    )}
                  </div>
                  <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-500 transition-colors shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </>
      )}

      {/* 공유 자료 탭 */}
      {tab === 'files' && (
        <div className="card p-8 text-center text-slate-500">
          <FileText size={28} className="mx-auto mb-3 text-slate-300" />
          <p className="text-sm">공유 자료는 파일 관리 페이지에서 부서별로 확인할 수 있습니다.</p>
          <Link to="/files" className="btn-secondary mt-4 inline-flex">파일 관리 열기</Link>
        </div>
      )}

      {/* 회의록 작성 모달 */}
      <Modal open={newMeetingOpen} onClose={() => setNewMeetingOpen(false)} title="회의록 작성" size="lg"
        footer={<><button onClick={() => setNewMeetingOpen(false)} className="btn-secondary">취소</button><button onClick={handleAddMeeting} className="btn-primary">저장</button></>}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">제목 *</label>
              <input type="text" value={meetingForm.title} onChange={(e) => setMeetingForm({ ...meetingForm, title: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">회의 날짜 *</label>
              <input type="date" value={meetingForm.date} onChange={(e) => setMeetingForm({ ...meetingForm, date: e.target.value })} className="input" />
            </div>
          </div>
          <div>
            <label className="label">참석자 (쉼표 구분)</label>
            <input type="text" value={meetingForm.attendees} onChange={(e) => setMeetingForm({ ...meetingForm, attendees: e.target.value })} placeholder="예: 김민준, 이서연, 박지훈" className="input" />
          </div>
          <div>
            <label className="label">안건</label>
            <textarea rows={3} value={meetingForm.agenda} onChange={(e) => setMeetingForm({ ...meetingForm, agenda: e.target.value })} placeholder="1. 안건 항목" className="textarea" />
          </div>
          <div>
            <label className="label">내용</label>
            <textarea rows={5} value={meetingForm.content} onChange={(e) => setMeetingForm({ ...meetingForm, content: e.target.value })} placeholder="회의 내용을 작성하세요." className="textarea" />
          </div>
          <div>
            <label className="label">연결 행사 (선택)</label>
            <select value={meetingForm.eventId} onChange={(e) => setMeetingForm({ ...meetingForm, eventId: e.target.value })} className="select-input">
              <option value="">행사 미연결</option>
              {cohortEvents.map((ev) => (
                <option key={ev.id} value={ev.id}>{ev.name} ({ev.startDate})</option>
              ))}
            </select>
          </div>
        </div>
      </Modal>

      {/* 삭제 확인 */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="회의록 삭제" size="sm"
        footer={<><button onClick={() => setDeleteConfirm(null)} className="btn-secondary">취소</button><button onClick={() => { deleteConfirm && deleteMeeting(workspace.id, deleteConfirm); toast.success('삭제되었습니다.'); setDeleteConfirm(null) }} className="btn-danger">삭제</button></>}
      >
        <p className="text-sm text-slate-600">이 회의록을 삭제하시겠습니까?</p>
      </Modal>
    </div>
  )
}
