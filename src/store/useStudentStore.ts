import { create } from 'zustand'
import { apiRequest } from '../lib/api'
import { fetchStudents, paymentStatusToApi, toStudent, type ApiStudent } from '../lib/backendApi'
import type { Student, PaymentStatus } from '../types'

interface StudentStore {
  students: Student[]
  isLoading: boolean
  error?: string
  loadStudents: (cohortId: string) => Promise<void>
  addStudents: (students: Omit<Student, 'id'>[]) => Promise<void>
  importStudents: (cohortId: string, file: File) => Promise<void>
  updateStudent: (id: string, data: Partial<Student>) => Promise<void>
  deleteStudent: (id: string) => Promise<void>
  bulkSetPayment: (ids: string[], status: PaymentStatus) => Promise<void>
}

export const useStudentStore = create<StudentStore>((set) => ({
  students: [],
  isLoading: false,
  error: undefined,
  loadStudents: async (cohortId) => {
    if (!cohortId) return
    set({ isLoading: true, error: undefined })
    try {
      set({ students: await fetchStudents(cohortId), isLoading: false })
    } catch (error) {
      set({ isLoading: false, error: error instanceof Error ? error.message : '학생 명단을 불러오지 못했습니다.' })
    }
  },
  addStudents: async (newStudents) => {
    const saved: Student[] = []
    for (const student of newStudents) {
      const response = await apiRequest<ApiStudent>('/api/students', {
        method: 'POST',
        body: JSON.stringify(studentToApiPayload(student)),
      })
      saved.push(toStudent(response))
    }
    set((state) => ({
      students: [...state.students, ...saved],
    }))
  },
  importStudents: async (cohortId, file) => {
    const form = new FormData()
    form.append('cohortId', cohortId)
    form.append('file', file)
    const result = await apiRequest<{ students: ApiStudent[] }>('/api/students/import', {
      method: 'POST',
      body: form,
    })
    set({ students: result.students.map(toStudent) })
  },
  updateStudent: async (id, data) => {
    const saved = await apiRequest<ApiStudent>(`/api/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify(studentToApiPayload(data)),
    })
    set((state) => ({
      students: state.students.map((s) => (s.id === id ? toStudent(saved) : s)),
    }))
  },
  deleteStudent: async (id) => {
    await apiRequest<void>(`/api/students/${id}`, { method: 'DELETE' })
    set((state) => ({
      students: state.students.filter((s) => s.id !== id),
    }))
  },
  bulkSetPayment: async (ids, status) => {
    await apiRequest<void>('/api/students/bulk-payment', {
      method: 'PATCH',
      body: JSON.stringify({ ids: ids.map(Number), paymentStatus: paymentStatusToApi(status) }),
    })
    set((state) => ({
      students: state.students.map((s) =>
        ids.includes(s.id)
          ? {
              ...s,
              paymentStatus: status,
              paidAt: status === 'paid' ? new Date().toISOString().slice(0, 10) : undefined,
            }
          : s
      ),
    }))
  },
}))

function studentToApiPayload(student: Partial<Student>) {
  return {
    cohortId: student.cohortId ? Number(student.cohortId) : undefined,
    studentNumber: student.studentId,
    studentId: student.studentId,
    name: student.name,
    department: student.department,
    grade: student.grade,
    paymentStatus: student.paymentStatus ? paymentStatusToApi(student.paymentStatus) : undefined,
    paidAt: student.paidAt ? `${student.paidAt}T00:00:00` : undefined,
    note: student.note,
  }
}
