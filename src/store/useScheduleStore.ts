import { create } from 'zustand'
import { apiRequest } from '../lib/api'
import { fetchSchedules, toTimetable, type ApiTimetableDetail, type ApiTimetableResponse, type ApiTimetableSummary } from '../lib/backendApi'
import type { Timetable, TimetableResponse, TimetableStatus } from '../types'

interface ScheduleStore {
  schedules: Timetable[]
  isLoading: boolean
  error?: string
  loadSchedules: (cohortId: string) => Promise<void>
  loadScheduleDetail: (id: string) => Promise<void>
  addSchedule: (tt: Omit<Timetable, 'id' | 'createdAt' | 'responses'>) => Promise<string>
  updateStatus: (id: string, status: TimetableStatus) => Promise<void>
  addResponse: (ttId: string, response: Omit<TimetableResponse, 'id'>) => Promise<void>
  updateResponse: (ttId: string, responseId: string, data: Partial<TimetableResponse>) => void
}

export const useScheduleStore = create<ScheduleStore>((set) => ({
  schedules: [],
  isLoading: false,
  error: undefined,
  loadSchedules: async (cohortId) => {
    if (!cohortId) return
    set({ isLoading: true, error: undefined })
    try {
      set({ schedules: await fetchSchedules(cohortId), isLoading: false })
    } catch (error) {
      set({ isLoading: false, error: error instanceof Error ? error.message : '일정 조율 목록을 불러오지 못했습니다.' })
    }
  },
  loadScheduleDetail: async (id) => {
    const detail = await apiRequest<ApiTimetableDetail>(`/api/timetables/${id}`)
    const schedule = toTimetable(detail)
    set((state) => ({
      schedules: state.schedules.some((item) => item.id === id)
        ? state.schedules.map((item) => (item.id === id ? schedule : item))
        : [...state.schedules, schedule],
    }))
  },
  addSchedule: async (tt) => {
    const detail = await apiRequest<ApiTimetableDetail>('/api/timetables', {
      method: 'POST',
      body: JSON.stringify(timetableToApiPayload(tt)),
    })
    const schedule = toTimetable(detail)
    set((state) => ({ schedules: [...state.schedules, schedule] }))
    return schedule.id
  },
  updateStatus: async (id, status) => {
    const summary = await apiRequest<ApiTimetableSummary>(`/api/timetables/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: status.toUpperCase() }),
    })
    set((state) => ({
      schedules: state.schedules.map((t) => (t.id === id ? { ...t, status: summary.status.toLowerCase() as TimetableStatus } : t)),
    }))
  },
  addResponse: async (ttId, response) => {
    const saved = await apiRequest<ApiTimetableResponse>(`/api/timetables/${ttId}/respond`, {
      method: 'POST',
      body: JSON.stringify({
        participantName: response.participantName,
        availableSlots: response.availableSlots,
      }),
    })
    set((state) => ({
      schedules: state.schedules.map((t) =>
        t.id === ttId
          ? {
              ...t,
              responses: [
                ...t.responses.filter((item) => item.participantName !== response.participantName),
                {
                  id: String(saved.id),
                  participantName: saved.participantName,
                  availableSlots: saved.selectedSlots,
                  respondedAt: saved.submittedAt,
                },
              ],
            }
          : t
      ),
    }))
  },
  updateResponse: (ttId, responseId, data) =>
    set((state) => ({
      schedules: state.schedules.map((t) =>
        t.id === ttId
          ? { ...t, responses: t.responses.map((r) => (r.id === responseId ? { ...r, ...data } : r)) }
          : t
      ),
    })),
}))

function timetableToApiPayload(timetable: Partial<Timetable>) {
  return {
    cohortId: timetable.cohortId ? Number(timetable.cohortId) : undefined,
    title: timetable.title,
    description: timetable.description,
    dateRangeStart: timetable.dateRange?.start,
    dateRangeEnd: timetable.dateRange?.end,
    timeRangeStart: timetable.timeRange?.start,
    timeRangeEnd: timetable.timeRange?.end,
    slotMinutes: timetable.slotMinutes,
    status: timetable.status?.toUpperCase(),
    eventId: timetable.eventId ? Number(timetable.eventId) : undefined,
    participants: timetable.participants ?? [],
  }
}
