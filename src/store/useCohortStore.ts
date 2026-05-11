import { create } from 'zustand'
import { fetchCohorts } from '../lib/backendApi'
import type { Cohort } from '../types'

interface CohortState {
  cohorts: Cohort[]
  currentCohortId: string
  currentCohort: Cohort
  isLoading: boolean
  error?: string
  loadCohorts: () => Promise<void>
  setCohort: (id: string) => void
}

const emptyCohort: Cohort = { id: '', label: '기수 없음', year: new Date().getFullYear() }

export const useCohortStore = create<CohortState>((set, get) => ({
  cohorts: [],
  currentCohortId: '',
  currentCohort: emptyCohort,
  isLoading: false,
  error: undefined,
  loadCohorts: async () => {
    set({ isLoading: true, error: undefined })
    try {
      const nextCohorts = await fetchCohorts()
      if (nextCohorts.length === 0) {
        set({ cohorts: [], currentCohortId: '', currentCohort: emptyCohort, isLoading: false })
        return
      }

      const currentId = get().currentCohortId
      const current = nextCohorts.find((cohort) => cohort.id === currentId) ?? nextCohorts[0]
      set({
        cohorts: nextCohorts,
        currentCohortId: current.id,
        currentCohort: current,
        isLoading: false,
      })
    } catch (error) {
      set({ isLoading: false, error: error instanceof Error ? error.message : '기수 정보를 불러오지 못했습니다.' })
    }
  },
  setCohort: (id: string) =>
    set((state) => {
      const currentCohort = state.cohorts.find((c) => c.id === id) ?? state.currentCohort
      return {
        currentCohortId: id,
        currentCohort,
      }
    }),
}))
