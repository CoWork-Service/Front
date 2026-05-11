import { create } from 'zustand'
import { apiRequest } from '../lib/api'
import {
  eventToApiPayload,
  fetchEventDetail,
  fetchEvents,
  toEvent,
  toEventPhoto,
  type ApiEventDetail,
  type ApiEventPhoto,
} from '../lib/backendApi'
import type { CoworkEvent, EventPhoto, EventPhotoTag } from '../types'

interface EventStore {
  events: CoworkEvent[]
  isLoading: boolean
  error?: string
  loadEvents: (cohortId: string) => Promise<void>
  loadEventDetail: (id: string) => Promise<void>
  addEvent: (event: Omit<CoworkEvent, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>
  updateEvent: (id: string, data: Partial<CoworkEvent>) => Promise<void>
  deleteEvent: (id: string) => Promise<void>
  addPhoto: (eventId: string, photo: { file?: File; url?: string; caption?: string; tag?: EventPhotoTag; uploadedBy: string }) => Promise<void>
  deletePhoto: (eventId: string, photoId: string) => Promise<void>
}

export const useEventStore = create<EventStore>((set, get) => ({
  events: [],
  isLoading: false,
  error: undefined,

  loadEvents: async (cohortId) => {
    if (!cohortId) return
    set({ isLoading: true, error: undefined })
    try {
      set({ events: await fetchEvents(cohortId), isLoading: false })
    } catch (error) {
      set({ isLoading: false, error: error instanceof Error ? error.message : '행사 목록을 불러오지 못했습니다.' })
    }
  },

  loadEventDetail: async (id) => {
    try {
      const event = await fetchEventDetail(id)
      set((state) => ({
        events: state.events.some((item) => item.id === id)
          ? state.events.map((item) => (item.id === id ? event : item))
          : [...state.events, event],
      }))
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '행사 상세를 불러오지 못했습니다.' })
    }
  },

  addEvent: async (event) => {
    const detail = await apiRequest<ApiEventDetail>('/api/events', {
      method: 'POST',
      body: JSON.stringify(eventToApiPayload(event)),
    })
    const nextEvent = toEvent(detail.event, detail.photos)
    set((state) => ({
      events: [...state.events, nextEvent],
    }))
    return nextEvent.id
  },

  updateEvent: async (id, data) => {
    const current = get().events.find((event) => event.id === id)
    const payload = eventToApiPayload({ ...current, ...data })
    const detail = await apiRequest<ApiEventDetail>(`/api/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
    const nextEvent = toEvent(detail.event, detail.photos)
    set((state) => ({
      events: state.events.map((event) => (event.id === id ? nextEvent : event)),
    }))
  },

  deleteEvent: async (id) => {
    await apiRequest<void>(`/api/events/${id}`, { method: 'DELETE' })
    set((state) => ({
      events: state.events.filter((e) => e.id !== id),
    }))
  },

  addPhoto: async (eventId, photo) => {
    if (!photo.file) {
      const newPhoto: EventPhoto = {
        id: `photo-${Date.now()}`,
        url: photo.url ?? '',
        caption: photo.caption,
        tag: photo.tag,
        uploadedBy: photo.uploadedBy,
        uploadedAt: new Date().toISOString(),
      }
      set((state) => ({
        events: state.events.map((event) =>
          event.id === eventId
            ? { ...event, photos: [...(event.photos ?? []), newPhoto], updatedAt: new Date().toISOString() }
            : event,
        ),
      }))
      return
    }

    const body = new FormData()
    body.append('photo', photo.file)
    if (photo.caption) body.append('caption', photo.caption)
    if (photo.tag) body.append('tag', photo.tag)

    const savedPhoto = await apiRequest<ApiEventPhoto>(`/api/events/${eventId}/photos`, {
      method: 'POST',
      body,
    })
    const newPhoto = toEventPhoto(savedPhoto)
    set((state) => ({
      events: state.events.map((e) => {
        if (e.id !== eventId) return e
        return {
          ...e,
          photos: [...(e.photos ?? []), newPhoto],
          updatedAt: new Date().toISOString(),
        }
      }),
    }))
  },

  deletePhoto: async (eventId, photoId) => {
    await apiRequest<void>(`/api/events/${eventId}/photos/${photoId}`, { method: 'DELETE' })
    set((state) => ({
      events: state.events.map((e) => {
        if (e.id !== eventId) return e
        return {
          ...e,
          photos: (e.photos ?? []).filter((p) => p.id !== photoId),
          updatedAt: new Date().toISOString(),
        }
      }),
    }))
  },
}))
