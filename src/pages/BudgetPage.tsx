import React, { useState, useMemo } from 'react'
import { Plus, Search, Receipt, Trash2, Edit2, Eye, TrendingDown } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useBudgetStore } from '../store/useBudgetStore'
import { useCohortStore } from '../store/useCohortStore'
import { PageHeader } from '../components/common/PageHeader'
import { DepartmentTag } from '../components/common/DepartmentTag'
import { EmptyState } from '../components/common/EmptyState'
import { Modal } from '../components/common/Modal'
import { useToast } from '../components/common/Toast'
import { DEPARTMENTS } from '../types'
import type { Expense, Department, BudgetCategory, PaymentMethod } from '../types'

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
  note: '',
}

export default function BudgetPage() {
  const { currentCohortId } = useCohortStore()
  const { expenses, addExpense, updateExpense, deleteExpense } = useBudgetStore()
  const toast = useToast()

  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Expense | null>(null)
  const [form, setForm] = useState(defaultForm)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null)

  const cohortExpenses = useMemo(
    () => expenses.filter((e) => e.cohortId === currentCohortId),
    [expenses, currentCohortId]
  )

  const filtered = useMemo(() => {
    let list = [...cohortExpenses]
    if (search) list = list.filter((e) => e.vendor.includes(search) || e.description.includes(search))
    if (deptFilter) list = list.filter((e) => e.department === deptFilter)
    if (categoryFilter) list = list.filter((e) => e.category === categoryFilter)
    return list.sort((a, b) => b.date.localeCompare(a.date))
  }, [cohortExpenses, search, deptFilter, categoryFilter])

  const totalAmount = filtered.reduce((sum, e) => sum + e.amount, 0)
  const deptSummary = useMemo(() => {
    const map: Record<string, number> = {}
    filtered.forEach((e) => { map[e.department] = (map[e.department] ?? 0) + e.amount })
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 4)
  }, [filtered])

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
      note: e.note ?? '',
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
      note: form.note || undefined,
    }
    if (editTarget) { updateExpense(editTarget.id, data); toast.success('지출 내역이 수정되었습니다.') }
    else { addExpense(data); toast.success('지출 내역이 등록되었습니다.') }
    setFormOpen(false)
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
        {(search || deptFilter || categoryFilter) && (
          <button onClick={() => { setSearch(''); setDeptFilter(''); setCategoryFilter('') }}
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
                {['사용일', '부서', '항목', '사용처', '금액', '결제수단', '영수증', ''].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-slate-500 px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">{e.date}</td>
                  <td className="px-4 py-3"><DepartmentTag department={e.department} /></td>
                  <td className="px-4 py-3 text-sm text-slate-600">{e.category}</td>
                  <td className="px-4 py-3 text-sm text-slate-800 font-medium">{e.vendor}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-slate-900 whitespace-nowrap">{e.amount.toLocaleString()}원</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{e.paymentMethod}</td>
                  <td className="px-4 py-3">
                    {e.receiptUrl ? (
                      <button
                        onClick={() => setReceiptPreview(e.receiptUrl!)}
                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                      >
                        <Eye size={12} />첨부
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
              ))}
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
          <>
            <button onClick={() => setFormOpen(false)} className="btn-secondary">취소</button>
            <button onClick={handleSave} className="btn-primary">저장</button>
          </>
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
            <label className="label">영수증 이미지 URL (더미)</label>
            <input type="text" value={form.receiptUrl} onChange={(e) => setForm({ ...form, receiptUrl: e.target.value })} placeholder="https://..." className="input" />
          </div>
          <div className="col-span-2">
            <label className="label">비고</label>
            <textarea rows={2} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className="textarea" />
          </div>
        </div>
      </Modal>

      {/* 영수증 미리보기 */}
      <Modal open={!!receiptPreview} onClose={() => setReceiptPreview(null)} title="영수증" size="sm">
        {receiptPreview && (
          <img src={receiptPreview} alt="영수증" className="w-full rounded-lg" />
        )}
      </Modal>

      {/* 삭제 확인 */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="삭제 확인" size="sm" footer={
        <>
          <button onClick={() => setDeleteConfirm(null)} className="btn-secondary">취소</button>
          <button onClick={() => { deleteConfirm && deleteExpense(deleteConfirm); toast.success('삭제되었습니다.'); setDeleteConfirm(null) }} className="btn-danger">삭제</button>
        </>
      }>
        <p className="text-sm text-slate-600">이 지출 내역을 삭제하시겠습니까?</p>
      </Modal>
    </div>
  )
}
