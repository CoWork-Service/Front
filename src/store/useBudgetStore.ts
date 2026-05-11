import { create } from 'zustand'
import { expenses as initialExpenses } from '../data/budget'
import type { Expense } from '../types'

interface BudgetStore {
  expenses: Expense[]
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => void
  upsertExpense: (expense: Expense) => void
  updateExpense: (id: string, data: Partial<Expense>) => void
  deleteExpense: (id: string) => void
}

export const useBudgetStore = create<BudgetStore>((set) => ({
  expenses: initialExpenses,
  addExpense: (expense) =>
    set((state) => ({
      expenses: [
        ...state.expenses,
        {
          ...expense,
          id: `exp-${Date.now()}`,
          createdAt: new Date().toISOString(),
        },
      ],
    })),
  upsertExpense: (expense) =>
    set((state) => {
      const exists = state.expenses.some((e) => e.id === expense.id)
      return {
        expenses: exists
          ? state.expenses.map((e) => (e.id === expense.id ? expense : e))
          : [...state.expenses, expense],
      }
    }),
  updateExpense: (id, data) =>
    set((state) => ({
      expenses: state.expenses.map((e) => (e.id === id ? { ...e, ...data } : e)),
    })),
  deleteExpense: (id) =>
    set((state) => ({
      expenses: state.expenses.filter((e) => e.id !== id),
    })),
}))
