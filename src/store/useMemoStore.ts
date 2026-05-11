import { create } from 'zustand'
import { apiRequest } from '../lib/api'
import { fetchMemos, memoToApiPayload, toMemo, type ApiMemo } from '../lib/backendApi'
import type { Memo, MemoPriority, MemoStatus } from '../types'

interface MemoStore {
  memos: Memo[]
  isLoading: boolean
  error?: string
  loadMemos: (cohortId: string) => Promise<void>
  addMemo: (memo: Omit<Memo, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateMemo: (id: string, data: Partial<Memo>) => Promise<void>
  deleteMemo: (id: string) => Promise<void>
  togglePriority: (id: string) => Promise<void>
  toggleStatus: (id: string) => Promise<void>
}

export const useMemoStore = create<MemoStore>((set, get) => ({
  memos: [],
  isLoading: false,
  error: undefined,
  loadMemos: async (cohortId) => {
    if (!cohortId) return
    set({ isLoading: true, error: undefined })
    try {
      set({ memos: await fetchMemos(cohortId), isLoading: false })
    } catch (error) {
      set({ isLoading: false, error: error instanceof Error ? error.message : '메모를 불러오지 못했습니다.' })
    }
  },
  addMemo: async (memo) => {
    const saved = await apiRequest<ApiMemo>('/api/memos', {
      method: 'POST',
      body: JSON.stringify(memoToApiPayload(memo)),
    })
    set((state) => ({
      memos: [...state.memos, toMemo(saved)],
    }))
  },
  updateMemo: async (id, data) => {
    const current = get().memos.find((memo) => memo.id === id)
    const saved = await apiRequest<ApiMemo>(`/api/memos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(memoToApiPayload({ ...current, ...data })),
    })
    set((state) => ({
      memos: state.memos.map((m) => (m.id === id ? toMemo(saved) : m)),
    }))
  },
  deleteMemo: async (id) => {
    await apiRequest<void>(`/api/memos/${id}`, { method: 'DELETE' })
    set((state) => ({
      memos: state.memos.filter((m) => m.id !== id),
    }))
  },
  togglePriority: async (id) => {
    const current = get().memos.find((memo) => memo.id === id)
    const nextPriority: MemoPriority = current?.priority === 'important' ? 'normal' : 'important'
    const saved = await apiRequest<ApiMemo>(`/api/memos/${id}/priority`, {
      method: 'PATCH',
      body: JSON.stringify({ priority: nextPriority === 'important' ? 'IMPORTANT' : 'NORMAL' }),
    })
    set((state) => ({
      memos: state.memos.map((m) => (m.id === id ? toMemo(saved) : m)),
    }))
  },
  toggleStatus: async (id) => {
    const current = get().memos.find((memo) => memo.id === id)
    const nextStatus: MemoStatus = current?.status === 'done' ? 'open' : 'done'
    const saved = await apiRequest<ApiMemo>(`/api/memos/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: nextStatus === 'done' ? 'DONE' : 'OPEN' }),
    })
    set((state) => ({
      memos: state.memos.map((m) => (m.id === id ? toMemo(saved) : m)),
    }))
  },
}))
