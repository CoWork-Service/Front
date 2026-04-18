import React, { useState, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ChevronLeft,
  CalendarDays,
  MapPin,
  Users,
  Wallet,
  FileText,
  File,
  FileImage,
  FileSpreadsheet,
  Pencil,
  ClipboardList,
  MessageSquare,
  TrendingUp,
  Upload,
  Trash2,
  Image,
  X,
  Eye,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight,
} from 'lucide-react'
import { useEventStore } from '../store/useEventStore'
import { useFileStore } from '../store/useFileStore'
import { useBudgetStore } from '../store/useBudgetStore'
import { useSurveyStore } from '../store/useSurveyStore'
import { useScheduleStore } from '../store/useScheduleStore'
import { useWorkspaceStore } from '../store/useWorkspaceStore'
import { useCohortStore } from '../store/useCohortStore'
import { StatusBadge } from '../components/common/StatusBadge'
import { SurveyStatusBadge, TimetableStatusBadge } from '../components/common/StatusBadge'
import { Modal } from '../components/common/Modal'
import { FileUploadDropzone } from '../components/common/FileUploadDropzone'
import { useToast } from '../components/common/Toast'
import type { EventStatus, EventPhoto, EventPhotoTag, FileItem, Expense, Survey, Timetable } from '../types'

// ── 상태 뱃지 헬퍼 ────────────────────────────────────────────────────────────

function EventStatusBadge({ status }: { status: EventStatus }) {
  if (status === 'planning') return <StatusBadge label="기획중" variant="blue" />
  if (status === 'ongoing') return <StatusBadge label="진행중" variant="green" />
  if (status === 'done') return <StatusBadge label="완료" variant="gray" />
  if (status === 'cancelled') return <StatusBadge label="취소" variant="red" />
  return null
}

// ── 파일 아이콘 헬퍼 ──────────────────────────────────────────────────────────

function FileIcon({ mimeType }: { mimeType?: string }) {
  const cls = 'shrink-0'
  if (!mimeType) return <File size={16} className={`text-slate-400 ${cls}`} />
  if (mimeType.startsWith('image/')) return <FileImage size={16} className={`text-emerald-500 ${cls}`} />
  if (mimeType.includes('pdf')) return <FileText size={16} className={`text-red-500 ${cls}`} />
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return <FileSpreadsheet size={16} className={`text-green-600 ${cls}`} />
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return <File size={16} className={`text-orange-500 ${cls}`} />
  return <File size={16} className={`text-blue-500 ${cls}`} />
}

function formatBytes(bytes?: number) {
  if (!bytes) return '-'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatBudget(amount: number) {
  return `₩${amount.toLocaleString()}`
}

// ── 탭 타입 ───────────────────────────────────────────────────────────────────

type Tab = 'overview' | 'files' | 'budget' | 'surveys' | 'meetings' | 'photos'

// ── 개요 탭 ───────────────────────────────────────────────────────────────────

function OverviewTab({
  description,
  fileCount,
  totalExpense,
  surveyResponseCount,
  meetingCount,
  photoCount,
  plannedBudget,
}: {
  description?: string
  fileCount: number
  totalExpense: number
  surveyResponseCount: number
  meetingCount: number
  photoCount: number
  plannedBudget?: number
}) {
  const stats = [
    { label: '총 지출', value: formatBudget(totalExpense), sub: plannedBudget ? `계획 ${formatBudget(plannedBudget)}` : undefined, icon: <Wallet size={18} className="text-blue-500" /> },
    { label: '관련 파일', value: `${fileCount}개`, icon: <FileText size={18} className="text-emerald-500" /> },
    { label: '사진', value: `${photoCount}장`, icon: <Image size={18} className="text-pink-500" /> },
    { label: '설문 응답', value: `${surveyResponseCount}건`, icon: <ClipboardList size={18} className="text-purple-500" /> },
    { label: '회의록', value: `${meetingCount}개`, icon: <MessageSquare size={18} className="text-amber-500" /> },
  ]

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map(({ label, value, sub, icon }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 p-4 flex items-start gap-3">
            <div className="p-2 bg-slate-50 rounded-lg">{icon}</div>
            <div>
              <p className="text-xs text-slate-500 mb-0.5">{label}</p>
              <p className="text-lg font-bold text-slate-900 leading-tight">{value}</p>
              {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
            </div>
          </div>
        ))}
      </div>

      {description && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-2">행사 설명</h3>
          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{description}</p>
        </div>
      )}

      {!description && fileCount === 0 && meetingCount === 0 && (
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-8 text-center">
          <TrendingUp size={32} className="text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">아직 연결된 자료가 없습니다.</p>
          <p className="text-xs text-slate-400 mt-1">파일, 예산, 설문, 회의록 등을 각 탭에서 확인하세요.</p>
        </div>
      )}
    </div>
  )
}

// ── 파일 탭 ───────────────────────────────────────────────────────────────────

function FilesTab({ files, eventId, cohortId }: { files: FileItem[]; eventId: string; cohortId: string }) {
  const { addFile, deleteFile } = useFileStore()
  const toast = useToast()
  const [uploadOpen, setUploadOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<FileItem | null>(null)

  const fileOnly = files.filter((f) => f.type === 'file')

  const handleUpload = () => {
    addFile({
      cohortId,
      eventId,
      name: '업로드된 파일.pdf',
      type: 'file',
      mimeType: 'application/pdf',
      size: 512000,
      path: '/업로드된 파일.pdf',
      uploadedBy: '김민준',
      updatedAt: new Date().toISOString(),
    })
    toast.success('파일이 업로드되었습니다.')
    setUploadOpen(false)
  }

  const handleDelete = (f: FileItem) => {
    deleteFile(f.id)
    toast.success('파일이 삭제되었습니다.')
    setDeleteConfirm(null)
  }

  return (
    <div className="space-y-3">
      {/* 액션 바 */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">이 행사에 연결된 파일 {fileOnly.length}개</p>
        <button onClick={() => setUploadOpen(true)} className="btn-primary py-1.5 text-xs">
          <Upload size={14} />파일 업로드
        </button>
      </div>

      {fileOnly.length === 0 ? (
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-8 text-center">
          <FileText size={28} className="text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500">이 행사에 연결된 파일이 없습니다.</p>
          <button onClick={() => setUploadOpen(true)} className="btn-primary mt-3 text-xs py-1.5">
            <Upload size={14} />첫 파일 업로드
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">파일명</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 hidden md:table-cell">크기</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 hidden lg:table-cell">업로더</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 hidden lg:table-cell">수정일</th>
                <th className="w-12" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {fileOnly.map((f) => (
                <tr key={f.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <FileIcon mimeType={f.mimeType} />
                      <span className="text-slate-800 font-medium truncate max-w-[200px]">{f.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500 hidden md:table-cell">{formatBytes(f.size)}</td>
                  <td className="px-4 py-3 text-slate-500 hidden lg:table-cell">{f.uploadedBy ?? '-'}</td>
                  <td className="px-4 py-3 text-slate-500 hidden lg:table-cell">{f.updatedAt.slice(0, 10)}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setDeleteConfirm(f)}
                      className="p-1 rounded text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                      title="삭제"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
            <span className="text-xs text-slate-400">파일 관리에서 더 많은 옵션 이용 가능</span>
            <Link to={`/files`} className="text-xs text-blue-600 hover:underline">파일 관리 열기 →</Link>
          </div>
        </div>
      )}

      {/* 업로드 모달 */}
      <Modal open={uploadOpen} onClose={() => setUploadOpen(false)} title="파일 업로드" footer={
        <><button onClick={() => setUploadOpen(false)} className="btn-secondary">취소</button>
        <button onClick={handleUpload} className="btn-primary">업로드</button></>
      }>
        <FileUploadDropzone multiple label="파일을 드래그하거나 클릭하여 업로드" hint="이 행사에 자동으로 연결됩니다." />
      </Modal>

      {/* 삭제 확인 */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="파일 삭제" size="sm" footer={
        <><button onClick={() => setDeleteConfirm(null)} className="btn-secondary">취소</button>
        <button onClick={() => deleteConfirm && handleDelete(deleteConfirm)} className="btn-danger">삭제</button></>
      }>
        <p className="text-sm text-slate-600">
          <strong className="text-slate-900">'{deleteConfirm?.name}'</strong>을(를) 삭제하시겠습니까?
        </p>
      </Modal>
    </div>
  )
}

// ── 예산 탭 ───────────────────────────────────────────────────────────────────

function BudgetEvidenceModal({
  open,
  onClose,
  showOnly,
  expense,
  eventPhotos,
}: {
  open: boolean
  onClose: () => void
  showOnly: 'receipt' | 'photos'
  expense: Expense | null
  eventPhotos: import('../types').EventPhoto[]
}) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)

  const linkedPhotos = eventPhotos.filter((p) => expense?.photoIds?.includes(p.id))

  const images = useMemo(() => {
    if (showOnly === 'receipt') {
      return expense?.receiptUrl ? [{ url: expense.receiptUrl, label: '영수증' }] : []
    }
    return linkedPhotos.map((p) => ({ url: p.url, label: p.caption ?? '증빙 사진' }))
  }, [showOnly, expense, linkedPhotos])

  if (!expense) return null

  return (
    <Modal open={open} onClose={onClose} title={showOnly === 'receipt' ? '영수증' : '증빙사진'} size={showOnly === 'receipt' ? 'sm' : 'lg'}>
      {showOnly === 'receipt' && (
        expense.receiptUrl ? (
          <div className="cursor-pointer rounded-xl overflow-hidden border border-slate-200" onClick={() => setLightboxIdx(0)}>
            <img src={expense.receiptUrl} alt="영수증" className="w-full object-cover hover:opacity-90 transition-opacity" />
          </div>
        ) : (
          <p className="text-sm text-slate-500 text-center py-4">영수증이 첨부되어 있지 않습니다.</p>
        )
      )}

      {showOnly === 'photos' && (
        linkedPhotos.length > 0 ? (
          <div className="grid grid-cols-3 gap-3">
            {linkedPhotos.map((photo, idx) => (
              <div
                key={photo.id}
                className="group relative aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-100 cursor-pointer"
                onClick={() => setLightboxIdx(idx)}
              >
                <img src={photo.url} alt={photo.caption ?? ''} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                {photo.tag && (
                  <span className="absolute bottom-1.5 left-1.5 text-[10px] font-medium bg-black/60 text-white px-1.5 py-0.5 rounded">
                    {photo.tag}
                  </span>
                )}
                {photo.caption && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-[11px] text-white truncate">{photo.caption}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500 text-center py-4">연결된 증빙사진이 없습니다.</p>
        )
      )}

      {/* 라이트박스 */}
      {lightboxIdx !== null && images[lightboxIdx] && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={() => setLightboxIdx(null)}>
          <button className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20" onClick={() => setLightboxIdx(null)}>✕</button>
          {lightboxIdx > 0 && (
            <button className="absolute left-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20" onClick={(e) => { e.stopPropagation(); setLightboxIdx(lightboxIdx - 1) }}>‹</button>
          )}
          {lightboxIdx < images.length - 1 && (
            <button className="absolute right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20" onClick={(e) => { e.stopPropagation(); setLightboxIdx(lightboxIdx + 1) }}>›</button>
          )}
          <div className="max-w-3xl max-h-[85vh] px-16 flex flex-col items-center gap-3" onClick={(e) => e.stopPropagation()}>
            <img src={images[lightboxIdx].url} alt={images[lightboxIdx].label} className="max-w-full max-h-[75vh] object-contain rounded-lg" />
            <p className="text-sm text-white">{images[lightboxIdx].label}</p>
            {images.length > 1 && <p className="text-xs text-slate-400">{lightboxIdx + 1} / {images.length}</p>}
          </div>
        </div>
      )}
    </Modal>
  )
}

function BudgetTab({ expenses, eventPhotos }: { expenses: Expense[]; eventPhotos: import('../types').EventPhoto[] }) {
  const total = expenses.reduce((s, e) => s + e.amount, 0)
  const [evidenceExpense, setEvidenceExpense] = useState<{ expense: Expense; showOnly: 'receipt' | 'photos' } | null>(null)

  if (expenses.length === 0) {
    return (
      <div className="bg-slate-50 rounded-xl border border-slate-200 p-8 text-center">
        <Wallet size={28} className="text-slate-300 mx-auto mb-2" />
        <p className="text-sm text-slate-500">이 행사에 연결된 예산 항목이 없습니다.</p>
        <Link to="/budget" className="inline-block mt-3 text-xs text-blue-600 hover:underline">예산 처리 바로가기 →</Link>
      </div>
    )
  }

  const categoryColor: Record<string, string> = {
    '행사비': 'bg-blue-50 text-blue-700',
    '소모품': 'bg-amber-50 text-amber-700',
    '식대': 'bg-emerald-50 text-emerald-700',
    '인쇄비': 'bg-purple-50 text-purple-700',
    '기타': 'bg-slate-100 text-slate-600',
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">날짜</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">카테고리</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 hidden md:table-cell">거래처</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">내용</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">영수증</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">증빙사진</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-slate-500">금액</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {expenses.map((e) => {
              const linkedPhotos = eventPhotos.filter((p) => e.photoIds?.includes(p.id))
              const hasEvidence = !!e.receiptUrl || linkedPhotos.length > 0
              return (
                <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{e.date}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${categoryColor[e.category] ?? 'bg-slate-100 text-slate-600'}`}>
                      {e.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 hidden md:table-cell">{e.vendor}</td>
                  <td className="px-4 py-3 text-slate-700">{e.description}</td>
                  {/* 영수증 */}
                  <td className="px-4 py-3">
                    {e.receiptUrl ? (
                      <button
                        onClick={() => setEvidenceExpense({ expense: e, showOnly: 'receipt' })}
                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                      >
                        <Eye size={12} />첨부
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400">-</span>
                    )}
                  </td>
                  {/* 증빙사진 */}
                  <td className="px-4 py-3">
                    {linkedPhotos.length > 0 ? (
                      <button
                        onClick={() => setEvidenceExpense({ expense: e, showOnly: 'photos' })}
                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                      >
                        <Eye size={12} />{linkedPhotos.length}장
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-slate-900">{formatBudget(e.amount)}</td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-200 bg-slate-50">
              <td colSpan={5} className="px-4 py-3 text-xs font-semibold text-slate-600 hidden md:table-cell">합계</td>
              <td className="px-4 py-3 text-xs font-semibold text-slate-600 md:hidden">합계</td>
              <td className="px-4 py-3 text-right text-sm font-bold text-slate-900" colSpan={2}>{formatBudget(total)}</td>
            </tr>
          </tfoot>
        </table>
        <div className="px-4 py-3 border-t border-slate-100 bg-slate-50">
          <Link to="/budget" className="text-xs text-blue-600 hover:underline">예산 처리에서 전체 보기 →</Link>
        </div>
      </div>

      <BudgetEvidenceModal
        open={!!evidenceExpense}
        onClose={() => setEvidenceExpense(null)}
        showOnly={evidenceExpense?.showOnly ?? 'receipt'}
        expense={evidenceExpense?.expense ?? null}
        eventPhotos={eventPhotos}
      />
    </>
  )
}

// ── 설문·일정조율 탭 ──────────────────────────────────────────────────────────

function SurveysTab({
  surveys,
  schedules,
}: {
  surveys: Survey[]
  schedules: Timetable[]
}) {
  const isEmpty = surveys.length === 0 && schedules.length === 0

  if (isEmpty) {
    return (
      <div className="bg-slate-50 rounded-xl border border-slate-200 p-8 text-center">
        <ClipboardList size={28} className="text-slate-300 mx-auto mb-2" />
        <p className="text-sm text-slate-500">이 행사에 연결된 설문·일정조율이 없습니다.</p>
        <div className="flex justify-center gap-4 mt-3">
          <Link to="/surveys" className="text-xs text-blue-600 hover:underline">설문 조사 →</Link>
          <Link to="/schedules" className="text-xs text-blue-600 hover:underline">일정 관리 →</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {surveys.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-3">설문 조사</h3>
          <div className="space-y-2">
            {surveys.map((s) => (
              <div key={s.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{s.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    응답 {s.responses.length}건 · {s.createdAt.slice(0, 10)}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <SurveyStatusBadge status={s.status} />
                  <Link
                    to={`/surveys/${s.id}/results`}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    결과 보기
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {schedules.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-3">일정 조율</h3>
          <div className="space-y-2">
            {schedules.map((t) => (
              <div key={t.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{t.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {t.dateRange.start} ~ {t.dateRange.end} · 응답 {t.responses.length}명
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <TimetableStatusBadge status={t.status} />
                  <Link
                    to={`/schedules/${t.id}/results`}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    결과 보기
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── 회의록 탭 ─────────────────────────────────────────────────────────────────

type MeetingWithWs = {
  id: string
  workspaceId: string
  departmentId: string
  title: string
  date: string
  attendees: string[]
  content: string
}

function MeetingsTab({ meetings }: { meetings: MeetingWithWs[] }) {
  if (meetings.length === 0) {
    return (
      <div className="bg-slate-50 rounded-xl border border-slate-200 p-8 text-center">
        <MessageSquare size={28} className="text-slate-300 mx-auto mb-2" />
        <p className="text-sm text-slate-500">이 행사에 연결된 회의록이 없습니다.</p>
        <Link to="/workspaces" className="inline-block mt-3 text-xs text-blue-600 hover:underline">워크스페이스 바로가기 →</Link>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {meetings.map((m) => (
        <Link
          key={m.id}
          to={`/workspaces/${m.departmentId}/meetings/${m.id}`}
          className="block bg-white rounded-xl border border-slate-200 p-4 hover:shadow-sm transition-shadow"
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <p className="text-sm font-medium text-slate-800">{m.title}</p>
            <span className="text-xs text-slate-400 shrink-0">{m.date}</span>
          </div>
          <p className="text-xs text-slate-500 mb-2">참석: {m.attendees.join(', ')}</p>
          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{m.content}</p>
        </Link>
      ))}
    </div>
  )
}

// ── 사진 탭 ───────────────────────────────────────────────────────────────────

const TAG_OPTIONS: EventPhotoTag[] = ['행사사진', '증빙사진', '준비과정', '기타']

const tagStyle: Record<EventPhotoTag, string> = {
  '행사사진': 'bg-blue-50 text-blue-700',
  '증빙사진': 'bg-amber-50 text-amber-700',
  '준비과정': 'bg-emerald-50 text-emerald-700',
  '기타': 'bg-slate-100 text-slate-600',
}

function PhotosTab({
  photos,
  eventId,
  onAdd,
  onDelete,
}: {
  photos: EventPhoto[]
  eventId: string
  onAdd: (photo: { url: string; caption?: string; tag?: EventPhotoTag; uploadedBy: string }) => void
  onDelete: (photoId: string) => void
}) {
  const toast = useToast()
  const [uploadOpen, setUploadOpen] = useState(false)
  const [lightbox, setLightbox] = useState<number | null>(null) // index
  const [deleteConfirm, setDeleteConfirm] = useState<EventPhoto | null>(null)
  const [filterTag, setFilterTag] = useState<EventPhotoTag | '전체'>('전체')

  // 업로드 폼 상태
  const [caption, setCaption] = useState('')
  const [tag, setTag] = useState<EventPhotoTag>('행사사진')

  const filtered = filterTag === '전체' ? photos : photos.filter((p) => p.tag === filterTag)

  const handleUpload = () => {
    onAdd({
      url: `https://images.unsplash.com/photo-${Date.now() % 1000000 + 1550000000000}?w=800&q=80`,
      caption: caption || undefined,
      tag,
      uploadedBy: '김민준',
    })
    toast.success('사진이 업로드되었습니다.')
    setCaption('')
    setTag('행사사진')
    setUploadOpen(false)
  }

  const handleDelete = (photo: EventPhoto) => {
    onDelete(photo.id)
    toast.success('사진이 삭제되었습니다.')
    setDeleteConfirm(null)
    if (lightbox !== null) setLightbox(null)
  }

  const moveLightbox = (dir: 1 | -1) => {
    if (lightbox === null) return
    const next = lightbox + dir
    if (next >= 0 && next < filtered.length) setLightbox(next)
  }

  return (
    <div className="space-y-4">
      {/* 액션 바 */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterTag('전체')}
            className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${filterTag === '전체' ? 'bg-slate-800 text-white border-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
          >
            전체 {photos.length}
          </button>
          {TAG_OPTIONS.map((t) => {
            const cnt = photos.filter((p) => p.tag === t).length
            if (cnt === 0) return null
            return (
              <button
                key={t}
                onClick={() => setFilterTag(t)}
                className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${filterTag === t ? 'bg-slate-800 text-white border-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
              >
                {t} {cnt}
              </button>
            )
          })}
        </div>
        <button onClick={() => setUploadOpen(true)} className="btn-primary py-1.5 text-xs">
          <Upload size={14} />사진 추가
        </button>
      </div>

      {/* 갤러리 그리드 */}
      {filtered.length === 0 ? (
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-10 text-center">
          <Image size={32} className="text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">등록된 사진이 없습니다.</p>
          <button onClick={() => setUploadOpen(true)} className="btn-primary mt-3 text-xs py-1.5">
            <Upload size={14} />첫 사진 추가
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map((photo, idx) => (
            <div key={photo.id} className="group relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-square cursor-pointer"
              onClick={() => setLightbox(idx)}
            >
              <img
                src={photo.url}
                alt={photo.caption ?? '행사 사진'}
                className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
              />
              {/* 오버레이 */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
              {/* 태그 뱃지 */}
              {photo.tag && (
                <span className={`absolute top-2 left-2 text-xs font-medium px-2 py-0.5 rounded-md ${tagStyle[photo.tag]}`}>
                  {photo.tag}
                </span>
              )}
              {/* 삭제 버튼 */}
              <button
                onClick={(e) => { e.stopPropagation(); setDeleteConfirm(photo) }}
                className="absolute top-2 right-2 p-1 rounded bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                title="삭제"
              >
                <Trash2 size={13} />
              </button>
              {/* 캡션 */}
              {photo.caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-xs text-white truncate">{photo.caption}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 업로드 모달 */}
      <Modal open={uploadOpen} onClose={() => setUploadOpen(false)} title="사진 추가" footer={
        <><button onClick={() => setUploadOpen(false)} className="btn-secondary">취소</button>
        <button onClick={handleUpload} className="btn-primary">추가</button></>
      }>
        <div className="space-y-4">
          <FileUploadDropzone multiple accept="image/*" label="사진을 드래그하거나 클릭하여 업로드" hint="JPG, PNG, WEBP 등 이미지 파일을 업로드하세요." />
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">태그</label>
            <div className="flex flex-wrap gap-2">
              {TAG_OPTIONS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTag(t)}
                  className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${tag === t ? 'bg-slate-800 text-white border-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">캡션 (선택)</label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="사진 설명을 입력하세요"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </Modal>

      {/* 라이트박스 */}
      {lightbox !== null && filtered[lightbox] && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            onClick={() => setLightbox(null)}
          >
            <X size={20} />
          </button>

          {lightbox > 0 && (
            <button
              className="absolute left-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              onClick={(e) => { e.stopPropagation(); moveLightbox(-1) }}
            >
              <ChevronLeftIcon size={24} />
            </button>
          )}
          {lightbox < filtered.length - 1 && (
            <button
              className="absolute right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              onClick={(e) => { e.stopPropagation(); moveLightbox(1) }}
            >
              <ChevronRight size={24} />
            </button>
          )}

          <div className="max-w-4xl max-h-[90vh] flex flex-col items-center gap-3 px-16" onClick={(e) => e.stopPropagation()}>
            <img
              src={filtered[lightbox].url}
              alt={filtered[lightbox].caption ?? ''}
              className="max-w-full max-h-[75vh] object-contain rounded-lg"
            />
            <div className="flex items-center gap-3 text-center">
              {filtered[lightbox].tag && (
                <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${tagStyle[filtered[lightbox].tag!]}`}>
                  {filtered[lightbox].tag}
                </span>
              )}
              {filtered[lightbox].caption && (
                <p className="text-sm text-white">{filtered[lightbox].caption}</p>
              )}
              <span className="text-xs text-slate-400">
                {filtered[lightbox].uploadedBy} · {filtered[lightbox].uploadedAt.slice(0, 10)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>{lightbox + 1} / {filtered.length}</span>
              <button
                onClick={() => setDeleteConfirm(filtered[lightbox])}
                className="flex items-center gap-1 px-2 py-1 rounded bg-red-600/80 text-white hover:bg-red-600 transition-colors"
              >
                <Trash2 size={12} />삭제
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 삭제 확인 */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="사진 삭제" size="sm" footer={
        <><button onClick={() => setDeleteConfirm(null)} className="btn-secondary">취소</button>
        <button onClick={() => deleteConfirm && handleDelete(deleteConfirm)} className="btn-danger">삭제</button></>
      }>
        <p className="text-sm text-slate-600">이 사진을 삭제하시겠습니까? 삭제 후 복구할 수 없습니다.</p>
      </Modal>
    </div>
  )
}

// ── 메인 페이지 ───────────────────────────────────────────────────────────────

const coverBorderMap: Record<string, string> = {
  blue: 'border-blue-500',
  green: 'border-emerald-500',
  orange: 'border-amber-500',
  purple: 'border-purple-500',
  red: 'border-red-500',
}

const coverBgMap: Record<string, string> = {
  blue: 'bg-blue-600',
  green: 'bg-emerald-600',
  orange: 'bg-amber-600',
  purple: 'bg-purple-600',
  red: 'bg-red-600',
}

export default function EventDetailPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const navigate = useNavigate()

  const { events, addPhoto, deletePhoto } = useEventStore()
  const { files } = useFileStore()
  const { expenses } = useBudgetStore()
  const { surveys } = useSurveyStore()
  const { schedules } = useScheduleStore()
  const { workspaces } = useWorkspaceStore()
  const { currentCohortId } = useCohortStore()

  const [activeTab, setActiveTab] = useState<Tab>('overview')

  const event = useMemo(() => events.find((e) => e.id === eventId), [events, eventId])

  const eventFiles = useMemo(
    () => files.filter((f) => f.eventId === eventId && f.cohortId === currentCohortId),
    [files, eventId, currentCohortId]
  )
  const eventExpenses = useMemo(
    () => expenses.filter((e) => e.eventId === eventId),
    [expenses, eventId]
  )
  const eventSurveys = useMemo(
    () => surveys.filter((s) => s.eventId === eventId),
    [surveys, eventId]
  )
  const eventSchedules = useMemo(
    () => schedules.filter((t) => t.eventId === eventId),
    [schedules, eventId]
  )
  const eventMeetings: MeetingWithWs[] = useMemo(
    () =>
      workspaces
        .flatMap((ws) =>
          ws.meetings.map((m) => ({
            id: m.id,
            workspaceId: ws.id,
            departmentId: ws.departmentId,
            title: m.title,
            date: m.date,
            attendees: m.attendees,
            content: m.content,
            eventId: m.eventId,
          }))
        )
        .filter((m) => m.eventId === eventId),
    [workspaces, eventId]
  )

  const totalExpense = useMemo(() => eventExpenses.reduce((s, e) => s + e.amount, 0), [eventExpenses])
  const surveyResponseCount = useMemo(
    () => eventSurveys.reduce((s, sv) => s + sv.responses.length, 0),
    [eventSurveys]
  )

  if (!event) {
    return (
      <div className="p-8">
        <div className="flex flex-col items-center justify-center h-64 text-slate-400">
          <CalendarDays size={40} className="mb-4 text-slate-300" />
          <p className="text-sm">행사를 찾을 수 없습니다.</p>
          <button onClick={() => navigate('/events')} className="mt-4 text-sm text-blue-600 hover:underline">
            ← 행사 목록으로 돌아가기
          </button>
        </div>
      </div>
    )
  }

  const color = event.coverColor ?? 'blue'
  const borderClass = coverBorderMap[color] ?? 'border-blue-500'
  const bgClass = coverBgMap[color] ?? 'bg-blue-600'

  const eventPhotos = event.photos ?? []

  const tabs: Array<{ key: Tab; label: string; count: number }> = [
    { key: 'overview', label: '개요', count: 0 },
    { key: 'files', label: '파일', count: eventFiles.filter((f) => f.type === 'file').length },
    { key: 'budget', label: '예산', count: eventExpenses.length },
    { key: 'photos', label: '사진', count: eventPhotos.length },
    { key: 'surveys', label: '설문·일정조율', count: eventSurveys.length + eventSchedules.length },
    { key: 'meetings', label: '회의록', count: eventMeetings.length },
  ]

  return (
    <div className="p-8">
      {/* 뒤로가기 */}
      <button
        onClick={() => navigate('/events')}
        className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-5 transition-colors"
      >
        <ChevronLeft size={16} />
        행사 목록
      </button>

      {/* 히어로 섹션 */}
      <div className={`bg-white rounded-2xl border-l-4 ${borderClass} border border-slate-200 p-6 mb-6`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className={`inline-flex items-center text-xs font-semibold text-white px-2.5 py-1 rounded-md ${bgClass}`}>
                {event.category}
              </span>
              <EventStatusBadge status={event.status} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-3">{event.name}</h1>

            <div className="flex flex-wrap gap-4 text-sm text-slate-500">
              <div className="flex items-center gap-1.5">
                <CalendarDays size={15} className="text-slate-400" />
                {event.startDate === event.endDate
                  ? event.startDate
                  : `${event.startDate} ~ ${event.endDate}`}
              </div>
              {event.location && (
                <div className="flex items-center gap-1.5">
                  <MapPin size={15} className="text-slate-400" />
                  {event.location}
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Users size={15} className="text-slate-400" />
                {event.leadDepartment} · {event.organizers.join(', ')}
              </div>
              {event.budget !== undefined && (
                <div className="flex items-center gap-1.5">
                  <Wallet size={15} className="text-slate-400" />
                  계획 예산 {formatBudget(event.budget)}
                </div>
              )}
            </div>
          </div>

          <Link
            to="/events"
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 shrink-0"
          >
            <Pencil size={14} />
            목록으로
          </Link>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="flex items-center gap-1 border-b border-slate-200 mb-6">
        {tabs.map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {label}
            {key !== 'overview' && count > 0 && (
              <span className="ml-1.5 text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full">
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 탭 내용 */}
      {activeTab === 'overview' && (
        <OverviewTab
          description={event.description}
          fileCount={eventFiles.filter((f) => f.type === 'file').length}
          totalExpense={totalExpense}
          surveyResponseCount={surveyResponseCount}
          meetingCount={eventMeetings.length}
          photoCount={eventPhotos.length}
          plannedBudget={event.budget}
        />
      )}
      {activeTab === 'files' && <FilesTab files={eventFiles} eventId={event.id} cohortId={currentCohortId} />}
      {activeTab === 'budget' && <BudgetTab expenses={eventExpenses} eventPhotos={eventPhotos} />}
      {activeTab === 'photos' && (
        <PhotosTab
          photos={eventPhotos}
          eventId={event.id}
          onAdd={(photo) => addPhoto(event.id, photo)}
          onDelete={(photoId) => deletePhoto(event.id, photoId)}
        />
      )}
      {activeTab === 'surveys' && <SurveysTab surveys={eventSurveys} schedules={eventSchedules} />}
      {activeTab === 'meetings' && <MeetingsTab meetings={eventMeetings} />}
    </div>
  )
}
