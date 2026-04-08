import { create } from 'zustand'
import { timetables as initialSchedules } from '../data/schedules'
import type { Timetable, TimetableResponse, TimetableStatus } from '../types'

interface ScheduleStore {
  schedules: Timetable[]
  addSchedule: (tt: Omit<Timetable, 'id' | 'createdAt' | 'responses'>) => string
  updateStatus: (id: string, status: TimetableStatus) => void
  addResponse: (ttId: string, response: Omit<TimetableResponse, 'id'>) => void
  updateResponse: (ttId: string, responseId: string, data: Partial<TimetableResponse>) => void
}

export const useScheduleStore = create<ScheduleStore>((set) => ({
  schedules: initialSchedules,
  addSchedule: (tt) => {
    const id = `tt-${Date.now()}`
    set((state) => ({
      schedules: [
        ...state.schedules,
        { ...tt, id, responses: [], createdAt: new Date().toISOString() },
      ],
    }))
    return id
  },
  updateStatus: (id, status) =>
    set((state) => ({
      schedules: state.schedules.map((t) => (t.id === id ? { ...t, status } : t)),
    })),
  addResponse: (ttId, response) =>
    set((state) => ({
      schedules: state.schedules.map((t) =>
        t.id === ttId
          ? { ...t, responses: [...t.responses, { ...response, id: `resp-${Date.now()}` }] }
          : t
      ),
    })),
  updateResponse: (ttId, responseId, data) =>
    set((state) => ({
      schedules: state.schedules.map((t) =>
        t.id === ttId
          ? { ...t, responses: t.responses.map((r) => (r.id === responseId ? { ...r, ...data } : r)) }
          : t
      ),
    })),
}))
