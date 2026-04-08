import { create } from 'zustand'
import { cohorts, defaultCohortId } from '../data/cohorts'
import type { Cohort } from '../types'

interface CohortState {
  cohorts: Cohort[]
  currentCohortId: string
  currentCohort: Cohort
  setCohort: (id: string) => void
}

export const useCohortStore = create<CohortState>((set) => ({
  cohorts,
  currentCohortId: defaultCohortId,
  currentCohort: cohorts.find((c) => c.id === defaultCohortId)!,
  setCohort: (id: string) =>
    set({
      currentCohortId: id,
      currentCohort: cohorts.find((c) => c.id === id)!,
    }),
}))
