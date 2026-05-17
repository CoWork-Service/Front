import React, { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { Camera, ImagePlus, ChevronRight, CheckCircle, AlertCircle, Loader2, Receipt } from 'lucide-react'
import { apiRequest } from '../lib/api'
import type { BudgetCategory, PaymentMethod } from '../types'

const CATEGORIES: BudgetCategory[] = ['행사비', '소모품', '식대', '인쇄비', '기타']
const PAYMENT_METHODS: PaymentMethod[] = ['법인카드', '개인카드', '현금', '계좌이체']

type Step = 'photo' | 'ocr' | 'form' | 'done'

type MobileSessionStatus = {
  sessionToken: string
  used: boolean
  expired: boolean
  expenseId?: number | null
  expiresAt: string
}

type ReceiptOcrResponse = {
  date?: string | null
  vendor?: string | null
  amount?: number | null
  paymentMethod?: string | null
  category?: string | null
  description?: string | null
  cardCompany?: string | null
  cardNumber?: string | null
  approvalNumber?: string | null
}

function formatRemaining(ms: number) {
  const s = Math.ceil(ms / 1000)
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${String(sec).padStart(2, '0')}`
}

function asBudgetCategory(value?: string | null): BudgetCategory | '' {
  return CATEGORIES.includes(value as BudgetCategory) ? value as BudgetCategory : ''
}

function asPaymentMethod(value?: string | null): PaymentMethod | '' {
  return PAYMENT_METHODS.includes(value as PaymentMethod) ? value as PaymentMethod : ''
}

export default function MobileRegisterPage() {
  const { token } = useParams<{ token: string }>()
  const [session, setSession] = useState<MobileSessionStatus | null>(null)
  const [sessionLoading, setSessionLoading] = useState(true)
  const [sessionError, setSessionError] = useState('')
  const [isExpired, setIsExpired] = useState(false)
  const [remaining, setRemaining] = useState(0)

  const [step, setStep] = useState<Step>('photo')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [uploaded, setUploaded] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const cameraRef = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)

  const today = new Date().toISOString().slice(0, 10)
  const [form, setForm] = useState({
    date: today,
    vendor: '',
    category: '' as BudgetCategory | '',
    amount: '',
    paymentMethod: '' as PaymentMethod | '',
    description: '',
    note: '',
  })

  useEffect(() => {
    if (!token) {
      setSessionError('유효하지 않은 모바일 세션입니다.')
      setSessionLoading(false)
      return
    }

    let cancelled = false
    apiRequest<MobileSessionStatus>(`/api/mobile/sessions/${token}`)
      .then((data) => {
        if (cancelled) return
        setSession(data)
        setIsExpired(data.expired)
        setRemaining(Math.max(0, new Date(data.expiresAt).getTime() - Date.now()))
        if (data.expenseId) setStep('done')
      })
      .catch((error) => {
        if (cancelled) return
        setSessionError(error instanceof Error ? error.message : '세션을 확인하지 못했습니다.')
      })
      .finally(() => {
        if (!cancelled) setSessionLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [token])

  useEffect(() => {
    if (!session || isExpired) return
    const id = setInterval(() => {
      const left = Math.max(0, new Date(session.expiresAt).getTime() - Date.now())
      setRemaining(left)
      if (left === 0) setIsExpired(true)
    }, 1000)
    return () => clearInterval(id)
  }, [session, isExpired])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !token) return
    const url = URL.createObjectURL(file)
    setSubmitError('')
    setImageFile(file)
    setImageUrl(url)
    setUploaded(false)
    setStep('ocr')

    try {
      const body = new FormData()
      body.append('file', file)
      const ocr = await apiRequest<ReceiptOcrResponse>(`/api/mobile/sessions/${token}/ocr`, {
        method: 'POST',
        body,
      })
      setForm({
        date: ocr.date || today,
        vendor: ocr.vendor || '',
        category: asBudgetCategory(ocr.category),
        amount: ocr.amount ? String(ocr.amount) : '',
        paymentMethod: asPaymentMethod(ocr.paymentMethod),
        description: ocr.description || '',
        note: '',
      })
    } catch (error) {
      setSubmitError(error instanceof Error ? `${error.message} 직접 입력해 주세요.` : 'OCR 분석에 실패했습니다. 직접 입력해 주세요.')
      setForm((prev) => ({
        ...prev,
        date: today,
        vendor: '',
        category: '',
        amount: '',
        paymentMethod: '',
        description: '',
      }))
    } finally {
      setStep('form')
    }
  }

  const handleSubmit = async () => {
    if (!token || !imageFile) return
    const amount = Number(String(form.amount).replace(/,/g, ''))
    if (!form.date || !form.vendor || !amount || amount <= 0) {
      setSubmitError('날짜, 거래처, 금액을 확인해 주세요.')
      return
    }

    setSubmitting(true)
    setSubmitError('')
    try {
      if (!uploaded) {
        const uploadBody = new FormData()
        uploadBody.append('photo', imageFile)
        await apiRequest(`/api/mobile/sessions/${token}/upload`, {
          method: 'POST',
          body: uploadBody,
        })
        setUploaded(true)
      }

      await apiRequest(`/api/mobile/sessions/${token}/expense`, {
        method: 'POST',
        body: JSON.stringify({
          date: form.date,
          department: '기타',
          category: form.category || '기타',
          vendor: form.vendor,
          description: form.description,
          amount,
          paymentMethod: form.paymentMethod || '개인카드',
          note: form.note || undefined,
        }),
      })
      setStep('done')
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : '지출 등록에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  // ── 세션 만료 / 유효하지 않음 ────────────────────────────────────────────────
  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-6 text-center">
        <Loader2 size={32} className="text-blue-500 animate-spin mb-4" />
        <p className="text-sm text-slate-500">세션 확인 중...</p>
      </div>
    )
  }

  if (!session || isExpired || sessionError) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mb-4">
          <AlertCircle size={32} className="text-red-500" />
        </div>
        <h1 className="text-lg font-bold text-slate-800 mb-2">{sessionError ? '세션을 확인할 수 없습니다' : '세션이 만료되었습니다'}</h1>
        <p className="text-sm text-slate-500 leading-relaxed">
          {sessionError || 'QR코드 유효 시간(5분)이 지났습니다.'}<br />
          PC에서 새 QR코드를 생성해 주세요.
        </p>
      </div>
    )
  }

  // ── 완료 ─────────────────────────────────────────────────────────────────────
  if (step === 'done') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center mb-4">
          <CheckCircle size={32} className="text-green-600" />
        </div>
        <h1 className="text-lg font-bold text-slate-800 mb-2">등록 완료!</h1>
        <p className="text-sm text-slate-500 leading-relaxed">
          지출 내역이 정상적으로 등록되었습니다.<br />
          PC 예산 화면에서 확인하세요.
        </p>
      </div>
    )
  }

  // ── 공통 헤더 ─────────────────────────────────────────────────────────────────
  const Header = () => (
    <div className="bg-white border-b border-slate-200 px-5 py-4 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-2">
        <Receipt size={20} className="text-blue-600" />
        <h1 className="text-base font-bold text-slate-900">지출 모바일 등록</h1>
      </div>
      <span className="text-xs font-mono bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full">
        {formatRemaining(remaining)} 남음
      </span>
    </div>
  )

  // ── 스텝 인디케이터 ───────────────────────────────────────────────────────────
  const StepIndicator = ({ current }: { current: 1 | 2 }) => (
    <div className="flex items-center px-5 py-3 gap-2 bg-white border-b border-slate-100 shrink-0">
      <div className="flex items-center gap-1.5">
        <div className={`w-6 h-6 rounded-full text-xs flex items-center justify-center font-bold transition-colors
          ${current === 1 ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-600'}`}>
          {current > 1 ? '✓' : '1'}
        </div>
        <span className={`text-xs font-medium ${current === 1 ? 'text-blue-700' : 'text-slate-400'}`}>영수증 촬영</span>
      </div>
      <ChevronRight size={14} className="text-slate-300" />
      <div className="flex items-center gap-1.5">
        <div className={`w-6 h-6 rounded-full text-xs flex items-center justify-center font-bold transition-colors
          ${current === 2 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
          2
        </div>
        <span className={`text-xs font-medium ${current === 2 ? 'text-blue-700' : 'text-slate-400'}`}>내역 확인</span>
      </div>
    </div>
  )

  // ── OCR 로딩 ─────────────────────────────────────────────────────────────────
  if (step === 'ocr') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Header />
        <StepIndicator current={1} />
        <div className="flex-1 flex flex-col items-center justify-center gap-5 px-6">
          {imageUrl && (
            <img
              src={imageUrl}
              alt="영수증"
              className="w-36 h-48 object-cover rounded-2xl border-2 border-slate-200 shadow-sm"
            />
          )}
          <div className="flex flex-col items-center gap-2">
            <Loader2 size={28} className="text-blue-500 animate-spin" />
            <p className="text-sm font-semibold text-slate-700">영수증 분석 중...</p>
            <p className="text-xs text-slate-400">OCR로 내역을 자동 추출하고 있습니다</p>
          </div>
        </div>
      </div>
    )
  }

  // ── STEP 1: 사진 촬영 ────────────────────────────────────────────────────────
  if (step === 'photo') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Header />
        <StepIndicator current={1} />

        <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6">
          {/* 미리보기 영역 */}
          <div className="w-full max-w-xs aspect-[3/4] bg-white border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center gap-3 text-slate-400">
            <Receipt size={44} className="text-slate-200" />
            <p className="text-sm text-slate-400">영수증을 촬영하거나 선택하세요</p>
          </div>

          {/* 버튼 */}
          <div className="w-full max-w-xs space-y-3">
            <button
              onClick={() => cameraRef.current?.click()}
              className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl bg-blue-600 text-white font-semibold text-[15px] active:bg-blue-700 transition-colors shadow-sm"
            >
              <Camera size={20} />
              카메라로 촬영
            </button>
            <button
              onClick={() => galleryRef.current?.click()}
              className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl bg-white border border-slate-200 text-slate-700 font-semibold text-[15px] active:bg-slate-50 transition-colors"
            >
              <ImagePlus size={20} />
              갤러리에서 선택
            </button>
          </div>
        </div>

        <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
        <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      </div>
    )
  }

  // ── STEP 2: OCR 결과 수정 폼 ─────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />
      <StepIndicator current={2} />

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {/* 영수증 미리보기 */}
        {imageUrl && (
          <div className="flex justify-center">
            <img
              src={imageUrl}
              alt="영수증"
              className="w-24 h-32 object-cover rounded-xl border-2 border-slate-200 shadow-sm"
            />
          </div>
        )}

        {/* OCR 안내 */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-700 leading-relaxed">
          OCR로 자동 추출된 내역입니다. 내용을 확인하고 수정 후 제출하세요.
        </div>

        {/* 입력 폼 */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
          <label className="flex items-center gap-3 px-4 py-3.5">
            <span className="text-xs font-medium text-slate-500 w-16 shrink-0">날짜</span>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              className="flex-1 text-sm text-slate-800 bg-transparent focus:outline-none"
            />
          </label>

          <label className="flex items-center gap-3 px-4 py-3.5">
            <span className="text-xs font-medium text-slate-500 w-16 shrink-0">거래처</span>
            <input
              type="text"
              value={form.vendor}
              onChange={(e) => setForm((f) => ({ ...f, vendor: e.target.value }))}
              placeholder="거래처명"
              className="flex-1 text-sm text-slate-800 bg-transparent focus:outline-none placeholder:text-slate-300"
            />
          </label>

          <label className="flex items-center gap-3 px-4 py-3.5">
            <span className="text-xs font-medium text-slate-500 w-16 shrink-0">금액</span>
            <input
              type="number"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              placeholder="0"
              inputMode="numeric"
              className="flex-1 text-sm text-slate-800 bg-transparent focus:outline-none placeholder:text-slate-300"
            />
            <span className="text-xs text-slate-400 shrink-0">원</span>
          </label>

          <label className="flex items-center gap-3 px-4 py-3.5">
            <span className="text-xs font-medium text-slate-500 w-16 shrink-0">카테고리</span>
            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as BudgetCategory }))}
              className="flex-1 text-sm text-slate-800 bg-transparent focus:outline-none"
            >
              <option value="">선택</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>

          <label className="flex items-center gap-3 px-4 py-3.5">
            <span className="text-xs font-medium text-slate-500 w-16 shrink-0">결제수단</span>
            <select
              value={form.paymentMethod}
              onChange={(e) => setForm((f) => ({ ...f, paymentMethod: e.target.value as PaymentMethod }))}
              className="flex-1 text-sm text-slate-800 bg-transparent focus:outline-none"
            >
              <option value="">선택</option>
              {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </label>

          <label className="flex items-center gap-3 px-4 py-3.5">
            <span className="text-xs font-medium text-slate-500 w-16 shrink-0">내용</span>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="지출 내용"
              className="flex-1 text-sm text-slate-800 bg-transparent focus:outline-none placeholder:text-slate-300"
            />
          </label>

          <label className="flex items-center gap-3 px-4 py-3.5">
            <span className="text-xs font-medium text-slate-500 w-16 shrink-0">메모</span>
            <input
              type="text"
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              placeholder="선택 입력"
              className="flex-1 text-sm text-slate-800 bg-transparent focus:outline-none placeholder:text-slate-300"
            />
          </label>
        </div>

        {/* 다시 촬영 */}
        <button
          onClick={() => { setStep('photo'); setImageUrl(null); setImageFile(null); setUploaded(false); setSubmitError('') }}
          className="w-full text-xs text-slate-400 hover:text-slate-600 underline text-center py-1"
        >
          영수증 다시 촬영하기
        </button>

        {submitError && (
          <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-xs text-red-600 leading-relaxed">
            {submitError}
          </div>
        )}
      </div>

      {/* 제출 버튼 */}
      <div className="px-5 pt-3 pb-10 bg-slate-50 border-t border-slate-100 shrink-0">
        <button
          onClick={handleSubmit}
          disabled={submitting || !imageFile || !form.vendor || !form.amount || !form.date}
          className="w-full py-4 rounded-2xl bg-blue-600 text-white font-semibold text-[15px] disabled:opacity-40 disabled:cursor-not-allowed active:bg-blue-700 transition-colors shadow-sm"
        >
          {submitting ? '제출 중...' : '제출하기'}
        </button>
      </div>
    </div>
  )
}
