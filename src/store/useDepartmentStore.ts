import { create } from 'zustand'
import { fetchOrganizationDepartments } from '../lib/backendApi'
import { mergeDepartmentOptions } from '../lib/departments'
import { DEPARTMENTS, type Department } from '../types'

interface DepartmentState {
  departments: Department[]
  isLoading: boolean
  error?: string
  loadDepartments: () => Promise<void>
}

export const useDepartmentStore = create<DepartmentState>((set) => ({
  departments: DEPARTMENTS,
  isLoading: false,
  error: undefined,
  loadDepartments: async () => {
    set({ isLoading: true, error: undefined })
    try {
      const departments = await fetchOrganizationDepartments()
      set({ departments: mergeDepartmentOptions(departments), isLoading: false })
    } catch (error) {
      set({
        departments: DEPARTMENTS,
        isLoading: false,
        error: error instanceof Error ? error.message : '부서 목록을 불러오지 못했습니다.',
      })
    }
  },
}))
