import { create } from 'zustand'
import { apiRequest } from '../lib/api'
import { fetchExpenses, toExpense, type ApiExpense } from '../lib/backendApi'
import type { Expense } from '../types'

interface BudgetStore {
  expenses: Expense[]
  isLoading: boolean
  error?: string
  loadExpenses: (cohortId: string) => Promise<void>
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>, receipt?: File | null) => Promise<void>
  upsertExpense: (expense: Expense) => void
  updateExpense: (id: string, data: Partial<Expense>, receipt?: File | null) => Promise<void>
  deleteExpense: (id: string) => Promise<void>
}

export const useBudgetStore = create<BudgetStore>((set) => ({
  expenses: [],
  isLoading: false,
  error: undefined,
  loadExpenses: async (cohortId) => {
    if (!cohortId) return
    set({ isLoading: true, error: undefined })
    try {
      set({ expenses: await fetchExpenses(cohortId), isLoading: false })
    } catch (error) {
      set({ isLoading: false, error: error instanceof Error ? error.message : '지출 내역을 불러오지 못했습니다.' })
    }
  },
  addExpense: async (expense, receipt) => {
    const form = expenseToFormData(expense, receipt)
    const saved = await apiRequest<ApiExpense>('/api/expenses', {
      method: 'POST',
      body: form,
    })
    set((state) => ({
      expenses: [...state.expenses, toExpense(saved)],
    }))
  },
  upsertExpense: (expense) =>
    set((state) => {
      const exists = state.expenses.some((e) => e.id === expense.id)
      return {
        expenses: exists
          ? state.expenses.map((e) => (e.id === expense.id ? expense : e))
          : [...state.expenses, expense],
      }
    }),
  updateExpense: async (id, data, receipt) => {
    const form = expenseToFormData(data, receipt)
    const saved = await apiRequest<ApiExpense>(`/api/expenses/${id}`, {
      method: 'PUT',
      body: form,
    })
    set((state) => ({
      expenses: state.expenses.map((e) => (e.id === id ? toExpense(saved) : e)),
    }))
  },
  deleteExpense: async (id) => {
    await apiRequest<void>(`/api/expenses/${id}`, { method: 'DELETE' })
    set((state) => ({
      expenses: state.expenses.filter((e) => e.id !== id),
    }))
  },
}))

function expenseToFormData(expense: Partial<Expense>, receipt?: File | null) {
  const form = new FormData()
  if (expense.cohortId) form.append('cohortId', expense.cohortId)
  if (expense.date) form.append('date', expense.date)
  if (expense.department && expense.department !== '전체') form.append('department', expense.department)
  if (expense.category) form.append('category', expense.category)
  if (expense.vendor) form.append('vendor', expense.vendor)
  if (expense.description !== undefined) form.append('description', expense.description)
  if (expense.amount !== undefined) form.append('amount', String(expense.amount))
  if (expense.paymentMethod) form.append('paymentMethod', expense.paymentMethod)
  if (expense.note !== undefined) form.append('note', expense.note)
  if (expense.eventId) form.append('eventId', expense.eventId)
  expense.photoIds?.forEach((photoId) => form.append('photoIds', photoId))
  if (receipt) form.append('receipt', receipt)
  return form
}
