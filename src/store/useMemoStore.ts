import { create } from 'zustand'
import { memos as initialMemos } from '../data/memos'
import type { Memo, MemoPriority, MemoStatus, Department } from '../types'

interface MemoStore {
  memos: Memo[]
  addMemo: (memo: Omit<Memo, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateMemo: (id: string, data: Partial<Memo>) => void
  deleteMemo: (id: string) => void
  togglePriority: (id: string) => void
  toggleStatus: (id: string) => void
}

export const useMemoStore = create<MemoStore>((set) => ({
  memos: initialMemos,
  addMemo: (memo) =>
    set((state) => ({
      memos: [
        ...state.memos,
        {
          ...memo,
          id: `memo-${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    })),
  updateMemo: (id, data) =>
    set((state) => ({
      memos: state.memos.map((m) =>
        m.id === id ? { ...m, ...data, updatedAt: new Date().toISOString() } : m
      ),
    })),
  deleteMemo: (id) =>
    set((state) => ({
      memos: state.memos.filter((m) => m.id !== id),
    })),
  togglePriority: (id) =>
    set((state) => ({
      memos: state.memos.map((m) =>
        m.id === id
          ? {
              ...m,
              priority: (m.priority === 'important' ? 'normal' : 'important') as MemoPriority,
              updatedAt: new Date().toISOString(),
            }
          : m
      ),
    })),
  toggleStatus: (id) =>
    set((state) => ({
      memos: state.memos.map((m) =>
        m.id === id
          ? {
              ...m,
              status: (m.status === 'done' ? 'open' : 'done') as MemoStatus,
              updatedAt: new Date().toISOString(),
            }
          : m
      ),
    })),
}))
