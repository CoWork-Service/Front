import { create } from 'zustand'
import { students as initialStudents } from '../data/students'
import type { Student, PaymentStatus } from '../types'

interface StudentStore {
  students: Student[]
  addStudents: (students: Omit<Student, 'id'>[]) => void
  updateStudent: (id: string, data: Partial<Student>) => void
  deleteStudent: (id: string) => void
  bulkSetPayment: (ids: string[], status: PaymentStatus) => void
}

export const useStudentStore = create<StudentStore>((set) => ({
  students: initialStudents,
  addStudents: (newStudents) =>
    set((state) => ({
      students: [
        ...state.students,
        ...newStudents.map((s, i) => ({
          ...s,
          id: `stu-${Date.now()}-${i}`,
        })),
      ],
    })),
  updateStudent: (id, data) =>
    set((state) => ({
      students: state.students.map((s) => (s.id === id ? { ...s, ...data } : s)),
    })),
  deleteStudent: (id) =>
    set((state) => ({
      students: state.students.filter((s) => s.id !== id),
    })),
  bulkSetPayment: (ids, status) =>
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
    })),
}))
