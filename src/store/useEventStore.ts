import { create } from 'zustand'
import { events as initialEvents } from '../data/events'
import type { CoworkEvent, EventPhoto, EventPhotoTag } from '../types'

interface EventStore {
  events: CoworkEvent[]
  addEvent: (event: Omit<CoworkEvent, 'id' | 'createdAt' | 'updatedAt'>) => string
  updateEvent: (id: string, data: Partial<CoworkEvent>) => void
  deleteEvent: (id: string) => void
  addPhoto: (eventId: string, photo: { url: string; caption?: string; tag?: EventPhotoTag; uploadedBy: string }) => void
  deletePhoto: (eventId: string, photoId: string) => void
}

export const useEventStore = create<EventStore>((set) => ({
  events: initialEvents,

  addEvent: (event) => {
    const id = `evt-${Date.now()}`
    set((state) => ({
      events: [
        ...state.events,
        {
          ...event,
          id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    }))
    return id
  },

  updateEvent: (id, data) =>
    set((state) => ({
      events: state.events.map((e) =>
        e.id === id ? { ...e, ...data, updatedAt: new Date().toISOString() } : e
      ),
    })),

  deleteEvent: (id) =>
    set((state) => ({
      events: state.events.filter((e) => e.id !== id),
    })),

  addPhoto: (eventId, photo) =>
    set((state) => ({
      events: state.events.map((e) => {
        if (e.id !== eventId) return e
        const newPhoto: EventPhoto = {
          id: `photo-${Date.now()}`,
          url: photo.url,
          caption: photo.caption,
          tag: photo.tag,
          uploadedBy: photo.uploadedBy,
          uploadedAt: new Date().toISOString(),
        }
        return {
          ...e,
          photos: [...(e.photos ?? []), newPhoto],
          updatedAt: new Date().toISOString(),
        }
      }),
    })),

  deletePhoto: (eventId, photoId) =>
    set((state) => ({
      events: state.events.map((e) => {
        if (e.id !== eventId) return e
        return {
          ...e,
          photos: (e.photos ?? []).filter((p) => p.id !== photoId),
          updatedAt: new Date().toISOString(),
        }
      }),
    })),
}))
