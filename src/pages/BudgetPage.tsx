import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { Plus, Search, Trash2, Edit2, Eye, TrendingDown, Smartphone, QrCode, CalendarDays, Image, CheckSquare, Square, Receipt } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { Link } from 'react-router-dom'
import { useBudgetStore } from '../store/useBudgetStore'
import { useCohortStore } from '../store/useCohortStore'
import { useEventStore } from '../store/useEventStore'
import { PageHeader } from '../components/common/PageHeader'
import { DepartmentTag } from '../components/common/DepartmentTag'
import { EmptyState } from '../components/common/EmptyState'
import { Modal } from '../components/common/Modal'
import { useToast } from '../components/common/Toast'
import { DEPARTMENTS } from '../types'
import type { Expense, Department, BudgetCategory, PaymentMethod, EventPhoto } from '../types'

const CATEGORIES: BudgetCategory[] = ['행사비', '소모품', '식대', '인쇄비', '기타']
const PAYMENT_METHODS: PaymentMethod[] = ['법인카드', '개인카드', '현금', '계좌이체']

const defaultForm = {
  date: '',
  department: '' as Department | '',
  category: '' as BudgetCategory | '',
  vendor: '',
  description: '',
  amount: '',
  paymentMethod: '' as PaymentMethod | '',
  receiptUrl: '',
  photoIds: [] as string[],
  note: '',
  eventId: '',
}

// ── 증빙 미리보기 모달 ────────────────────────────────────────────────────────

function EvidenceModal({
  open,
  onClose,
  showOnly,
  receiptUrl,
  photos,
}: {
  open: boolean
  onClose: () => void
  showOnly: 'receipt' | 'photos'
  receiptUrl?: string
  photos: EventPhoto[]
}) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)

  const images = useMemo(() => {
    if (showOnly === 'receipt') {
      return receiptUrl ? [{ url: receiptUrl, label: '영수증' }] : []
    }
    return photos.map((p) => ({ url: p.url, label: p.caption ?? '증빙 사진' }))
  }, [showOnly, receiptUrl, photos])

  const handleClose = () => {
    setLightboxIdx(null)
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose} title={showOnly === 'receipt' ? '영수증' : '증빙사진'} size={showOnly === 'receipt' ? 'sm' : 'lg'}>
      {showOnly === 'receipt' && (
        receiptUrl ? (
          <div className="cursor-pointer rounded-xl overflow-hidden border border-slate-200" onClick={() => setLightboxIdx(0)}>
            <img src={receiptUrl} alt="영수증" className="w-full object-cover hover:opacity-90 transition-opacity" />
          </div>
        ) : (
          <p className="text-sm text-slate-500 text-center py-4">영수증이 첨부되어 있지 않습니다.</p>
        )
      )}

      {showOnly === 'photos' && (
        photos.length > 0 ? (
          <div className="grid grid-cols-3 gap-3">
            {photos.map((photo, idx) => (
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

// ── 사진 연결 피커 ─────────────────────────────────────────────────────────────

function PhotoPicker({
  eventPhotos,
  selectedIds,
  onChange,
}: {
  eventPhotos: EventPhoto[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
}) {
  if (eventPhotos.length === 0) {
    return <p className="text-xs text-slate-400 mt-1">이 행사에 등록된 사진이 없습니다.</p>
  }

  const toggle = (id: string) => {
    onChange(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id])
  }

  return (
    <div className="grid grid-cols-4 gap-2 mt-2">
      {eventPhotos.map((photo) => {
        const selected = selectedIds.includes(photo.id)
        return (
          <div
            key={photo.id}
            onClick={() => toggle(photo.id)}
            className={`relative aspect-square rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
              selected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-slate-200 hover:border-slate-400'
            }`}
          >
            <img src={photo.url} alt={photo.caption ?? ''} className="w-full h-full object-cover" />
            <div className={`absolute inset-0 ${selected ? 'bg-blue-500/20' : 'bg-transparent'} transition-colors`} />
            <div className="absolute top-1 right-1">
              {selected
                ? <CheckSquare size={14} className="text-blue-600 drop-shadow" />
                : <Square size={14} className="text-white drop-shadow" />
              }
            </div>
            {photo.tag && (
              <span className="absolute bottom-1 left-1 text-[9px] bg-black/60 text-white px-1 py-0.5 rounded">
                {photo.tag}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── 메인 페이지 ───────────────────────────────────────────────────────────────

export default function BudgetPage() {
  const { currentCohortId } = useCohortStore()
  const { expenses, addExpense, updateExpense, deleteExpense } = useBudgetStore()
  const { events } = useEventStore()
  const toast = useToast()

  const cohortEvents = useMemo(
    () => events.filter((e) => e.cohortId === currentCohortId),
    [events, currentCohortId]
  )

  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [eventFilter, setEventFilter] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Expense | null>(null)
  const [form, setForm] = useState(defaultForm)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [evidenceExpense, setEvidenceExpense] = useState<{ expense: Expense; showOnly: 'receipt' | 'photos' } | null>(null)
  const [qrOpen, setQrOpen] = useState(false)
  const [qrToken, setQrToken] = useState('')
  const [qrRemaining, setQrRemaining] = useState(0)

  const SESSION_TTL = 5 * 60 * 1000

  const generateQrSession = useCallback(() => {
    const token = btoa(JSON.stringify({ cohortId: currentCohortId, createdAt: Date.now() }))
    setQrToken(token)
    setQrRemaining(SESSION_TTL)
  }, [currentCohortId])

  const openQr = () => {
    generateQrSession()
    setQrOpen(true)
  }

  useEffect(() => {
    if (!qrOpen) return
    const id = setInterval(() => {
      setQrRemaining((prev) => {
        const next = Math.max(0, prev - 1000)
        if (next === 0) {
          generateQrSession() // 만료되면 자동 갱신
        }
        return next
      })
    }, 1000)
    return () => clearInterval(id)
  }, [qrOpen, generateQrSession])

  const cohortExpenses = useMemo(
    () => expenses.filter((e) => e.cohortId === currentCohortId),
    [expenses, currentCohortId]
  )

  const filtered = useMemo(() => {
    let list = [...cohortExpenses]
    if (search) list = list.filter((e) => e.vendor.includes(search) || e.description.includes(search))
    if (deptFilter) list = list.filter((e) => e.department === deptFilter)
    if (categoryFilter) list = list.filter((e) => e.category === categoryFilter)
    if (eventFilter === '__none__') list = list.filter((e) => !e.eventId)
    else if (eventFilter) list = list.filter((e) => e.eventId === eventFilter)
    return list.sort((a, b) => b.date.localeCompare(a.date))
  }, [cohortExpenses, search, deptFilter, categoryFilter, eventFilter])

  const totalAmount = filtered.reduce((sum, e) => sum + e.amount, 0)
  const deptSummary = useMemo(() => {
    const map: Record<string, number> = {}
    filtered.forEach((e) => { map[e.department] = (map[e.department] ?? 0) + e.amount })
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 4)
  }, [filtered])

  // 현재 폼에 선택된 행사의 사진 목록
  const formEventPhotos = useMemo(() => {
    if (!form.eventId) return []
    const ev = cohortEvents.find((e) => e.id === form.eventId)
    return ev?.photos ?? []
  }, [form.eventId, cohortEvents])

  // 증빙 미리보기용 사진 목록
  const evidencePhotos = useMemo(() => {
    if (!evidenceExpense?.expense.eventId) return []
    const ev = cohortEvents.find((e) => e.id === evidenceExpense.expense.eventId)
    const photos = ev?.photos ?? []
    return photos.filter((p) => evidenceExpense.expense.photoIds?.includes(p.id))
  }, [evidenceExpense, cohortEvents])

  const openCreate = () => { setEditTarget(null); setForm(defaultForm); setFormOpen(true) }
  const openEdit = (e: Expense) => {
    setEditTarget(e)
    setForm({
      date: e.date,
      department: e.department,
      category: e.category,
      vendor: e.vendor,
      description: e.description,
      amount: String(e.amount),
      paymentMethod: e.paymentMethod,
      receiptUrl: e.receiptUrl ?? '',
      photoIds: e.photoIds ?? [],
      note: e.note ?? '',
      eventId: e.eventId ?? '',
    })
    setFormOpen(true)
  }

  const handleSave = () => {
    if (!form.date || !form.department || !form.amount || !form.vendor) {
      toast.error('날짜, 부서, 사용처, 금액은 필수입니다.')
      return
    }
    const amt = Number(form.amount.replace(/,/g, ''))
    if (isNaN(amt) || amt <= 0) { toast.error('올바른 금액을 입력해주세요.'); return }

    const data: Omit<Expense, 'id' | 'createdAt'> = {
      cohortId: currentCohortId,
      date: form.date,
      department: form.department as Department,
      category: (form.category || '기타') as BudgetCategory,
      vendor: form.vendor,
      description: form.description,
      amount: amt,
      paymentMethod: (form.paymentMethod || '현금') as PaymentMethod,
      receiptUrl: form.receiptUrl || undefined,
      photoIds: form.photoIds.length > 0 ? form.photoIds : undefined,
      note: form.note || undefined,
      eventId: form.eventId || undefined,
    }
    if (editTarget) { updateExpense(editTarget.id, data); toast.success('지출 내역이 수정되었습니다.') }
    else { addExpense(data); toast.success('지출 내역이 등록되었습니다.') }
    setFormOpen(false)
  }

  const handleEventChange = (eventId: string) => {
    setForm({ ...form, eventId, photoIds: [] })
  }

  return (
    <div>
      <PageHeader
        title="예산 처리"
        description="지출 내역과 영수증을 관리합니다."
        actions={
          <button onClick={openCreate} className="btn-primary">
            <Plus size={16} />
            지출 등록
          </button>
        }
      />

      {/* 요약 카드 */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="card p-4">
          <p className="text-xs text-slate-500 mb-1">총 지출액</p>
          <p className="text-xl font-bold text-slate-900">{totalAmount.toLocaleString()}원</p>
          <p className="text-xs text-slate-400 mt-1">{filtered.length}건</p>
        </div>
        {deptSummary.map(([dept, amt]) => (
          <div key={dept} className="card p-4">
            <DepartmentTag department={dept} />
            <p className="text-base font-bold text-slate-900 mt-2">{amt.toLocaleString()}원</p>
            <p className="text-xs text-slate-400 mt-0.5">{filtered.filter((e) => e.department === dept).length}건</p>
          </div>
        ))}
      </div>

      {/* 필터 */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="사용처, 내용 검색"
            className="input pl-8 w-52"
          />
        </div>
        <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className="select-input w-36">
          <option value="">전체 부서</option>
          {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="select-input w-32">
          <option value="">전체 항목</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={eventFilter} onChange={(e) => setEventFilter(e.target.value)} className="select-input w-40">
          <option value="">전체 행사</option>
          <option value="__none__">행사 미연결</option>
          {cohortEvents.map((ev) => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
        </select>
        {(search || deptFilter || categoryFilter || eventFilter) && (
          <button onClick={() => { setSearch(''); setDeptFilter(''); setCategoryFilter(''); setEventFilter('') }}
            className="text-xs text-slate-500 hover:text-slate-700 underline">초기화</button>
        )}
      </div>

      {/* 테이블 */}
      <div className="card overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState
            title="조건에 맞는 지출 내역이 없습니다."
            description="새 지출 내역을 등록하거나 필터를 조정해보세요."
            action={<button onClick={openCreate} className="btn-primary"><Plus size={16} />지출 등록</button>}
          />
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {['사용일', '부서', '항목', '사용처', '금액', '결제수단', '연결 행사', '영수증', '증빙사진', ''].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-slate-500 px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => {
                const linkedEvent = e.eventId ? cohortEvents.find((ev) => ev.id === e.eventId) : null
                const linkedPhotos = linkedEvent
                  ? (linkedEvent.photos ?? []).filter((p) => e.photoIds?.includes(p.id))
                  : []
                const hasEvidence = !!e.receiptUrl || linkedPhotos.length > 0

                return (
                  <tr key={e.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">{e.date}</td>
                    <td className="px-4 py-3"><DepartmentTag department={e.department} /></td>
                    <td className="px-4 py-3 text-sm text-slate-600">{e.category}</td>
                    <td className="px-4 py-3 text-sm text-slate-800 font-medium">{e.vendor}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-slate-900 whitespace-nowrap">{e.amount.toLocaleString()}원</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{e.paymentMethod}</td>
                    <td className="px-4 py-3">
                      {linkedEvent ? (
                        <Link
                          to={`/events/${linkedEvent.id}`}
                          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline max-w-[120px] truncate"
                        >
                          <CalendarDays size={11} className="shrink-0" />
                          <span className="truncate">{linkedEvent.name}</span>
                        </Link>
                      ) : <span className="text-xs text-slate-400">-</span>}
                    </td>
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
                        <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">미첨부</span>
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
                        <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">미첨부</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(e)} className="p-1 rounded text-slate-400 hover:text-slate-700"><Edit2 size={13} /></button>
                        <button onClick={() => setDeleteConfirm(e.id)} className="p-1 rounded text-slate-400 hover:text-red-500"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* 지출 폼 모달 */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editTarget ? '지출 수정' : '지출 등록'}
        size="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <button
              onClick={openQr}
              className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <Smartphone size={15} />
              모바일로 등록하기
            </button>
            <div className="flex items-center gap-2">
              <button onClick={() => setFormOpen(false)} className="btn-secondary">취소</button>
              <button onClick={handleSave} className="btn-primary">저장</button>
            </div>
          </div>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">집행일 *</label>
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="input" />
          </div>
          <div>
            <label className="label">부서 *</label>
            <select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value as Department })} className="select-input">
              <option value="">선택</option>
              {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="label">예산 항목</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as BudgetCategory })} className="select-input">
              <option value="">선택</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label">결제 수단</label>
            <select value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value as PaymentMethod })} className="select-input">
              <option value="">선택</option>
              {PAYMENT_METHODS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="label">사용처 *</label>
            <input type="text" value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })} placeholder="예: 이마트" className="input" />
          </div>
          <div>
            <label className="label">금액 *</label>
            <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0" className="input" />
          </div>
          <div className="col-span-2">
            <label className="label">사용 내용</label>
            <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="구체적인 사용 내용" className="input" />
          </div>
          <div className="col-span-2">
            <label className="label">연결 행사 (선택)</label>
            <select value={form.eventId} onChange={(e) => handleEventChange(e.target.value)} className="select-input">
              <option value="">행사 미연결</option>
              {cohortEvents.map((ev) => (
                <option key={ev.id} value={ev.id}>{ev.name} ({ev.startDate})</option>
              ))}
            </select>
            <p className="text-xs text-slate-400 mt-1">이 지출을 특정 행사에 연결하면 행사 상세 페이지에서 함께 확인할 수 있습니다.</p>
          </div>
          <div className="col-span-2">
            <label className="label">영수증 이미지 URL (더미)</label>
            <input type="text" value={form.receiptUrl} onChange={(e) => setForm({ ...form, receiptUrl: e.target.value })} placeholder="https://..." className="input" />
          </div>
          {form.eventId && (
            <div className="col-span-2">
              <label className="label flex items-center gap-1.5">
                <Image size={13} className="text-slate-400" />
                행사 사진 증빙 연결
                {form.photoIds.length > 0 && (
                  <span className="text-xs font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full">
                    {form.photoIds.length}장 선택
                  </span>
                )}
              </label>
              <p className="text-xs text-slate-400 mb-2">이 지출의 증빙으로 사용할 행사 사진을 선택하세요. 여러 장 선택 가능합니다.</p>
              <PhotoPicker
                eventPhotos={formEventPhotos}
                selectedIds={form.photoIds}
                onChange={(ids) => setForm({ ...form, photoIds: ids })}
              />
            </div>
          )}
          <div className="col-span-2">
            <label className="label">비고</label>
            <textarea rows={2} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className="textarea" />
          </div>
        </div>
      </Modal>

      {/* 증빙 미리보기 모달 */}
      <EvidenceModal
        open={!!evidenceExpense}
        onClose={() => setEvidenceExpense(null)}
        showOnly={evidenceExpense?.showOnly ?? 'receipt'}
        receiptUrl={evidenceExpense?.expense.receiptUrl}
        photos={evidencePhotos}
      />

      {/* 삭제 확인 */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="삭제 확인" size="sm" footer={
        <>
          <button onClick={() => setDeleteConfirm(null)} className="btn-secondary">취소</button>
          <button onClick={() => { deleteConfirm && deleteExpense(deleteConfirm); toast.success('삭제되었습니다.'); setDeleteConfirm(null) }} className="btn-danger">삭제</button>
        </>
      }>
        <p className="text-sm text-slate-600">이 지출 내역을 삭제하시겠습니까?</p>
      </Modal>

      {/* 모바일 QR 등록 모달 */}
      <Modal open={qrOpen} onClose={() => setQrOpen(false)} title="모바일로 지출 등록" size="sm">
        <div className="flex flex-col items-center py-2 gap-4">
          {/* 카운트다운 */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500">세션 유효 시간</span>
            <span className={`font-mono font-semibold px-2 py-0.5 rounded-full border ${
              qrRemaining < 60000
                ? 'bg-red-50 text-red-600 border-red-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}>
              {Math.floor(qrRemaining / 60000)}:{String(Math.ceil((qrRemaining % 60000) / 1000)).padStart(2, '0')}
            </span>
          </div>

          {/* QR 코드 */}
          <div className="p-4 bg-white border-2 border-slate-200 rounded-2xl shadow-sm">
            {qrToken && (
              <QRCodeSVG
                value={`${window.location.origin}/budget/mobile-register/${qrToken}`}
                size={180}
                bgColor="#ffffff"
                fgColor="#1e3a8a"
                level="M"
                includeMargin={false}
              />
            )}
          </div>

          <div className="text-center space-y-1">
            <p className="text-sm font-semibold text-slate-800">QR코드를 스캔하세요</p>
            <p className="text-xs text-slate-500">모바일 카메라로 스캔하면<br />지출 등록 페이지로 이동합니다.</p>
          </div>
          <div className="w-full bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-xs text-blue-700 text-center">
            영수증 사진 촬영 → OCR 자동 추출 → 내역 확인 후 제출<br />
            <span className="text-blue-500">만료 시 QR코드가 자동으로 갱신됩니다.</span>
          </div>
        </div>
      </Modal>
    </div>
  )
}
