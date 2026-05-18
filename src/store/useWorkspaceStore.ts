import { create } from 'zustand'
import { apiRequest } from '../lib/api'
import { fetchWorkspaces, toMeeting, type ApiMeeting } from '../lib/backendApi'
import type { Workspace, Meeting } from '../types'

interface WorkspaceStore {
  workspaces: Workspace[]
  isLoading: boolean
  error?: string
  loadWorkspaces: (cohortId: string) => Promise<void>
  addMeeting: (workspaceId: string, meeting: Omit<Meeting, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>
  updateMeeting: (workspaceId: string, meetingId: string, data: Partial<Meeting>) => Promise<void>
  deleteMeeting: (workspaceId: string, meetingId: string) => Promise<void>
}

export const useWorkspaceStore = create<WorkspaceStore>((set) => ({
  workspaces: [],
  isLoading: false,
  error: undefined,
  loadWorkspaces: async (cohortId) => {
    if (!cohortId) return
    set({ isLoading: true, error: undefined })
    try {
      set({ workspaces: await fetchWorkspaces(cohortId), isLoading: false })
    } catch (error) {
      set({ isLoading: false, error: error instanceof Error ? error.message : '워크스페이스를 불러오지 못했습니다.' })
    }
  },
  addMeeting: async (workspaceId, meeting) => {
    const saved = await apiRequest<ApiMeeting>(`/api/workspaces/${workspaceId}/meetings`, {
      method: 'POST',
      body: JSON.stringify(meetingToApiPayload(meeting)),
    })
    const newMeeting = toMeeting(saved)
    set((state) => ({
      workspaces: state.workspaces.map((ws) => {
        if (ws.id !== workspaceId) return ws
        return {
          ...ws,
          meetingCount: ws.meetingCount + 1,
          updatedAt: new Date().toISOString(),
          meetings: [...ws.meetings, newMeeting],
        }
      }),
    }))
    return newMeeting.id
  },
  updateMeeting: async (workspaceId, meetingId, data) => {
    const saved = await apiRequest<ApiMeeting>(`/api/workspaces/${workspaceId}/meetings/${meetingId}`, {
      method: 'PUT',
      body: JSON.stringify(meetingToApiPayload(data)),
    })
    const nextMeeting = toMeeting(saved)
    set((state) => ({
      workspaces: state.workspaces.map((ws) => {
        if (ws.id !== workspaceId) return ws
        return {
          ...ws,
          updatedAt: new Date().toISOString(),
          meetings: ws.meetings.map((m) =>
            m.id === meetingId
              ? nextMeeting
              : m
          ),
        }
      }),
    }))
  },
  deleteMeeting: async (workspaceId, meetingId) => {
    await apiRequest<void>(`/api/workspaces/${workspaceId}/meetings/${meetingId}`, { method: 'DELETE' })
    set((state) => ({
      workspaces: state.workspaces.map((ws) => {
        if (ws.id !== workspaceId) return ws
        return {
          ...ws,
          meetingCount: Math.max(0, ws.meetingCount - 1),
          meetings: ws.meetings.filter((m) => m.id !== meetingId),
        }
      }),
    }))
  },
}))

function meetingToApiPayload(meeting: Partial<Meeting>) {
  const payload: {
    title?: string
    date?: string
    attendees?: string[]
    agenda?: string
    content?: string
    eventId?: number
    attachments?: Array<{ fileItemId: number; storagePath: string; name: string; size: number }>
  } = {
    title: meeting.title,
    date: meeting.date,
    attendees: meeting.attendees ?? [],
    agenda: meeting.agenda,
    content: meeting.content,
    eventId: meeting.eventId ? Number(meeting.eventId) : undefined,
  }

  if (meeting.attachments) {
    payload.attachments = meeting.attachments.map((attachment) => ({
      fileItemId: Number(attachment.fileItemId ?? attachment.id),
      storagePath: attachment.storagePath ?? extractUploadStoragePath(attachment.url),
      name: attachment.name,
      size: attachment.size,
    }))
  }

  return payload
}

function extractUploadStoragePath(url: string) {
  const marker = '/uploads/'
  const markerIndex = url.indexOf(marker)
  return markerIndex >= 0 ? url.slice(markerIndex + marker.length) : url
}
