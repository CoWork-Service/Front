import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { Plus, Search, Trash2, Edit2, Eye, Smartphone, CalendarDays, Image, CheckSquare, Square, FileSpreadsheet, CheckCircle2, XCircle } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { Link } from 'react-router-dom'
import { useBudgetStore } from '../store/useBudgetStore'
import { useCohortStore } from '../store/useCohortStore'
import { useEventStore } from '../store/useEventStore'
import { PageHeader } from '../components/common/PageHeader'
import { DepartmentTag } from '../components/common/DepartmentTag'
import { EmptyState } from '../components/common/EmptyState'
import { FileUploadDropzone } from '../components/common/FileUploadDropzone'
import { Modal } from '../components/common/Modal'
import { useToast } from '../components/common/Toast'
import { apiRequest } from '../lib/api'
import { toExpense, type ApiExpense } from '../lib/backendApi'
import { mergeDepartmentOptions } from '../lib/departments'
import { useDepartmentStore } from '../store/useDepartmentStore'
import type { Expense, Department, BudgetCategory, PaymentMethod, EventPhoto } from '../types'

const CATEGORIES: BudgetCategory[] = ['행사비', '소모품', '식대', '인쇄비', '기타']
const PAYMENT_METHODS: PaymentMethod[] = ['법인카드', '개인카드', '현금', '계좌이체']
const MATCH_TOLERANCE_MS = 2 * 60_000

type BankRow = {
  dateTime: string | null
  vendor: string
  amount: number
  description: string | null
}

type MobileSessionResponse = {
  sessionToken: string
  qrUrl: string
  expiresAt: string
}

type MobileUploadResponse = {
  expenseId?: number | null
}

type ReceiptOcrResult = {
  date?: string | null
  dateTime?: string | null
  vendor?: string | null
  amount?: number | null
  paymentMethod?: string | null
  category?: string | null
  description?: string | null
}

function asBudgetCategory(value?: string | null): BudgetCategory | '' {
  return CATEGORIES.includes(value as BudgetCategory) ? value as BudgetCategory : ''
}

function asPaymentMethod(value?: string | null): PaymentMethod | '' {
  return PAYMENT_METHODS.includes(value as PaymentMethod) ? value as PaymentMethod : ''
}

const defaultForm = {
  date: '',
  department: '' as Department | '',
  category: '' as BudgetCategory | '',
  vendor: '',
  description: '',
  amount: '',
  paymentMethod: '' as PaymentMethod | '',
  receiptUrl: '',
  receiptFile: null as File | null,
  photoIds: [] as string[],
  note: '',
  eventId: '',
  receiptDateTime: null as string | null,
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
  const { expenses, addExpense, upsertExpense, updateExpense, deleteExpense } = useBudgetStore()
  const { events } = useEventStore()
  const departments = useDepartmentStore((state) => state.departments)
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
  const [qrExpiresAt, setQrExpiresAt] = useState<string | null>(null)
  const [qrRemaining, setQrRemaining] = useState(0)
  const [qrLoading, setQrLoading] = useState(false)
  const [ocrLoading, setOcrLoading] = useState(false)
  const [bankOpen, setBankOpen] = useState(false)
  const [bankRows, setBankRows] = useState<BankRow[]>([])
  const [bankLoading, setBankLoading] = useState(false)

  const generateQrSession = useCallback(async () => {
    setQrLoading(true)
    try {
      const session = await apiRequest<MobileSessionResponse>('/api/mobile/sessions', {
        method: 'POST',
        body: JSON.stringify({ cohortId: Number(currentCohortId) }),
      })
      setQrToken(session.sessionToken)
      setQrExpiresAt(session.expiresAt)
      setQrRemaining(Math.max(0, new Date(session.expiresAt).getTime() - Date.now()))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '모바일 세션 생성에 실패했습니다.')
    } finally {
      setQrLoading(false)
    }
  }, [currentCohortId, toast])

  const openQr = () => {
    setQrOpen(true)
    void generateQrSession()
  }

  useEffect(() => {
    if (!qrOpen || !qrExpiresAt) return
    const id = setInterval(() => {
      setQrRemaining(() => {
        const next = Math.max(0, new Date(qrExpiresAt).getTime() - Date.now())
        if (next === 0) {
          void generateQrSession()
        }
        return next
      })
    }, 1000)
    return () => clearInterval(id)
  }, [qrOpen, qrExpiresAt, generateQrSession])

  useEffect(() => {
    if (!qrOpen || !qrToken) return
    const id = setInterval(() => {
      void apiRequest<MobileUploadResponse>(`/api/mobile/sessions/${qrToken}/result`)
        .then(async (result) => {
          if (!result.expenseId) return
          const expense = await apiRequest<ApiExpense>(`/api/expenses/${result.expenseId}`)
          upsertExpense(toExpense(expense))
          toast.success('모바일 지출 등록이 완료되었습니다.')
          setQrOpen(false)
        })
        .catch(() => {
          // 세션 폴링 실패는 다음 주기에 재시도한다.
        })
    }, 2500)
    return () => clearInterval(id)
  }, [qrOpen, qrToken, toast, upsertExpense])

  const cohortExpenses = useMemo(
    () => expenses.filter((e) => e.cohortId === currentCohortId),
    [expenses, currentCohortId]
  )

  const departmentOptions = useMemo(
    () => mergeDepartmentOptions(departments, [
      ...cohortExpenses.map((expense) => expense.department),
      form.department,
      deptFilter,
    ]),
    [departments, cohortExpenses, form.department, deptFilter]
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
      receiptFile: null,
      photoIds: e.photoIds ?? [],
      note: e.note ?? '',
      eventId: e.eventId ?? '',
      receiptDateTime: e.receiptDatetime ?? null,
    })
    setFormOpen(true)
  }

  const handleBankUpload = async (files: File[]) => {
    const file = files[0]
    if (!file) return
    setBankLoading(true)
    setBankRows([])
    try {
      const fd = new FormData()
      fd.append('file', file)
      const rows = await apiRequest<BankRow[]>('/api/expenses/parse-excel', { method: 'POST', body: fd })
      setBankRows(rows)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '파일 파싱에 실패했습니다.')
    } finally {
      setBankLoading(false)
    }
  }

  // 금액 일치 + (receiptDatetime 있으면 ±2분, 없으면 날짜 일치) → 매칭 간주
  const isBankRowMatched = (row: BankRow) => {
    if (!row.dateTime) return false
    return cohortExpenses.some((e) => {
      if (e.amount !== row.amount) return false
      if (e.receiptDatetime) {
        const diff = Math.abs(new Date(e.receiptDatetime).getTime() - new Date(row.dateTime!).getTime())
        return diff <= MATCH_TOLERANCE_MS
      }
      return e.date === row.dateTime!.substring(0, 10)
    })
  }

  // 지출 내역 → 통장 내역 매칭 여부 (bankRows 없으면 null)
  const isExpenseInBank = (expense: Expense): boolean | null => {
    if (bankRows.length === 0) return null
    return bankRows.some((row) => {
      if (!row.dateTime) return false
      if (expense.amount !== row.amount) return false
      if (expense.receiptDatetime) {
        const diff = Math.abs(new Date(expense.receiptDatetime).getTime() - new Date(row.dateTime).getTime())
        return diff <= MATCH_TOLERANCE_MS
      }
      return expense.date === row.dateTime.substring(0, 10)
    })
  }

  const handleReceiptFiles = async (files: File[]) => {
    const file = files[0] ?? null
    setForm((prev) => ({ ...prev, receiptFile: file }))
    if (!file || !file.type.startsWith('image/')) return

    setOcrLoading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const result = await apiRequest<ReceiptOcrResult>(
        '/api/expenses/ocr',
        { method: 'POST', body: fd }
      )
      const datePart = result.date ?? (result.dateTime ? result.dateTime.substring(0, 10) : null)
      const category = asBudgetCategory(result.category)
      const paymentMethod = asPaymentMethod(result.paymentMethod)
      setForm((prev) => ({
        ...prev,
        receiptFile: file,
        date: prev.date || datePart || prev.date,
        vendor: prev.vendor || result.vendor || prev.vendor,
        amount: prev.amount || (result.amount != null ? String(result.amount) : prev.amount),
        category: prev.category || category || prev.category,
        paymentMethod: prev.paymentMethod || paymentMethod || prev.paymentMethod,
        description: prev.description || result.description || prev.description,
        receiptDateTime: result.dateTime ?? prev.receiptDateTime,
      }))
      if (datePart || result.amount != null || result.vendor || category || paymentMethod || result.description) {
        toast.success('영수증에서 지출 정보를 자동으로 입력했습니다.')
      }
    } catch (error) {
      toast.error(error instanceof Error ? `${error.message} 직접 입력해 주세요.` : 'OCR 분석에 실패했습니다. 직접 입력해 주세요.')
    } finally {
      setOcrLoading(false)
    }
  }

  const handleSave = async () => {
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
      receiptDatetime: form.receiptDateTime ?? undefined,
    }
    try {
      if (editTarget) {
        await updateExpense(editTarget.id, data, form.receiptFile)
        toast.success('지출 내역이 수정되었습니다.')
      } else {
        await addExpense(data, form.receiptFile)
        toast.success('지출 내역이 등록되었습니다.')
      }
      setFormOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '지출 내역 저장에 실패했습니다.')
    }
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return
    try {
      await deleteExpense(deleteConfirm)
      toast.success('삭제되었습니다.')
      setDeleteConfirm(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '삭제에 실패했습니다.')
    }
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
          {departmentOptions.map((d) => <option key={d} value={d}>{d}</option>)}
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
        <button
          onClick={() => { setBankRows([]); setBankOpen(true) }}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap"
        >
          <FileSpreadsheet size={14} />
          통장 내역 업로드
        </button>
      </div>

      {/* 통장 매칭 결과 배너 */}
      {bankRows.length > 0 && (
        <div className="mb-3 flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5">
          <FileSpreadsheet size={14} className="text-blue-500 shrink-0" />
          <div className="flex items-center gap-3 text-sm flex-1 flex-wrap">
            <span className="text-blue-700 font-medium">통장 매칭 결과</span>
            <span className="text-slate-500">총 {bankRows.length}건</span>
            <span className="flex items-center gap-1 text-emerald-600">
              <CheckCircle2 size={13} />매칭 <span className="font-semibold">{bankRows.filter(isBankRowMatched).length}</span>건
            </span>
            <span className="flex items-center gap-1 text-rose-500">
              <XCircle size={13} />미매칭 <span className="font-semibold">{bankRows.length - bankRows.filter(isBankRowMatched).length}</span>건
            </span>
          </div>
          <button onClick={() => setBankOpen(true)} className="text-xs text-blue-600 hover:text-blue-800 underline whitespace-nowrap">
            상세 보기
          </button>
          <button onClick={() => setBankRows([])} className="text-xs text-slate-400 hover:text-slate-600 whitespace-nowrap ml-1">
            ✕ 닫기
          </button>
        </div>
      )}

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
                return (
                  <tr key={e.id} className={`border-b border-slate-100 transition-colors ${
                    bankRows.length > 0
                      ? isExpenseInBank(e) ? 'bg-emerald-50 hover:bg-emerald-100' : 'bg-amber-50/60 hover:bg-amber-100/60'
                      : 'hover:bg-slate-50'
                  }`}>
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
                        {bankRows.length > 0 && (
                          isExpenseInBank(e)
                            ? <CheckCircle2 size={13} className="text-emerald-500 mr-0.5 shrink-0" />
                            : <XCircle size={13} className="text-amber-400 mr-0.5 shrink-0" />
                        )}
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
              {departmentOptions.map((d) => <option key={d} value={d}>{d}</option>)}
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
            <label className="label">영수증 파일</label>
            <FileUploadDropzone
              accept="image/*,.pdf"
              label="영수증을 드래그하거나 클릭하여 업로드"
              hint="이미지 업로드 시 날짜·금액·가맹점이 자동 입력됩니다."
              onFiles={handleReceiptFiles}
            />
            {ocrLoading && (
              <p className="text-xs text-blue-600 mt-1.5 flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                영수증 분석 중...
              </p>
            )}
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

      {/* 통장 매칭 모달 */}
      <Modal
        open={bankOpen}
        onClose={() => setBankOpen(false)}
        title="통장 매칭"
        size="lg"
      >
        {bankRows.length === 0 ? (
          <div className="space-y-3">
            <p className="text-sm text-slate-500">통장 거래 내역 엑셀 파일(.xlsx, .xls)을 업로드하면 이미 등록된 지출과 자동으로 매칭합니다.</p>
            <FileUploadDropzone
              accept=".xlsx,.xls"
              label="통장 엑셀 파일을 드래그하거나 클릭하여 업로드"
              hint=".xlsx / .xls 형식 지원"
              onFiles={handleBankUpload}
            />
            {bankLoading && (
              <p className="text-xs text-blue-600 flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                파일 파싱 중...
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {/* 요약 */}
            {(() => {
              const matched = bankRows.filter(isBankRowMatched).length
              const unmatched = bankRows.length - matched
              return (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-slate-500">총 <span className="font-semibold text-slate-800">{bankRows.length}</span>건</span>
                    <span className="flex items-center gap-1 text-emerald-600"><CheckCircle2 size={13} /> 매칭 <span className="font-semibold">{matched}</span>건</span>
                    <span className="flex items-center gap-1 text-rose-500"><XCircle size={13} /> 미매칭 <span className="font-semibold">{unmatched}</span>건</span>
                  </div>
                  <button
                    onClick={() => setBankRows([])}
                    className="text-xs text-slate-400 hover:text-slate-600 underline"
                  >
                    다시 업로드
                  </button>
                </div>
              )
            })()}

            {/* 거래 목록 */}
            <div className="overflow-auto max-h-[420px] rounded-xl border border-slate-200">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-slate-50 border-b border-slate-200">
                  <tr>
                    {['거래일시', '가맹점', '금액', '상태'].map((h) => (
                      <th key={h} className="text-left text-xs font-semibold text-slate-500 px-4 py-2.5">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bankRows.map((row, idx) => {
                    const matched = isBankRowMatched(row)
                    return (
                      <tr
                        key={idx}
                        className={`border-b border-slate-100 last:border-0 ${matched ? 'bg-emerald-50' : 'hover:bg-slate-50'}`}
                      >
                        <td className="px-4 py-2.5 text-slate-600 whitespace-nowrap font-mono text-xs">
                          {row.dateTime ?? '-'}
                        </td>
                        <td className="px-4 py-2.5 text-slate-800 font-medium max-w-[160px] truncate">
                          {row.vendor || '-'}
                        </td>
                        <td className="px-4 py-2.5 font-semibold text-slate-900 whitespace-nowrap">
                          {row.amount.toLocaleString()}원
                        </td>
                        <td className="px-4 py-2.5">
                          {matched ? (
                            <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium bg-emerald-100 px-2 py-0.5 rounded-full">
                              <CheckCircle2 size={11} /> 매칭
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-rose-500 font-medium bg-rose-50 px-2 py-0.5 rounded-full">
                              <XCircle size={11} /> 미매칭
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>

      {/* 삭제 확인 */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="삭제 확인" size="sm" footer={
        <>
          <button onClick={() => setDeleteConfirm(null)} className="btn-secondary">취소</button>
          <button onClick={handleDelete} className="btn-danger">삭제</button>
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
            {qrLoading ? (
              <div className="w-[180px] h-[180px] flex items-center justify-center text-xs text-slate-400">
                세션 생성 중
              </div>
            ) : qrToken && (
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
