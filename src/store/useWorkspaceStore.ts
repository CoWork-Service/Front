import { create } from 'zustand'
import { workspaces as initialWorkspaces } from '../data/workspaces'
import type { Workspace, Meeting } from '../types'

interface WorkspaceStore {
  workspaces: Workspace[]
  addMeeting: (workspaceId: string, meeting: Omit<Meeting, 'id' | 'createdAt' | 'updatedAt'>) => string
  updateMeeting: (workspaceId: string, meetingId: string, data: Partial<Meeting>) => void
  deleteMeeting: (workspaceId: string, meetingId: string) => void
}

export const useWorkspaceStore = create<WorkspaceStore>((set) => ({
  workspaces: initialWorkspaces,
  addMeeting: (workspaceId, meeting) => {
    const id = `meet-${Date.now()}`
    set((state) => ({
      workspaces: state.workspaces.map((ws) => {
        if (ws.id !== workspaceId) return ws
        return {
          ...ws,
          meetingCount: ws.meetingCount + 1,
          updatedAt: new Date().toISOString(),
          meetings: [
            ...ws.meetings,
            {
              ...meeting,
              id,
              workspaceId,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
        }
      }),
    }))
    return id
  },
  updateMeeting: (workspaceId, meetingId, data) =>
    set((state) => ({
      workspaces: state.workspaces.map((ws) => {
        if (ws.id !== workspaceId) return ws
        return {
          ...ws,
          updatedAt: new Date().toISOString(),
          meetings: ws.meetings.map((m) =>
            m.id === meetingId
              ? { ...m, ...data, updatedAt: new Date().toISOString() }
              : m
          ),
        }
      }),
    })),
  deleteMeeting: (workspaceId, meetingId) =>
    set((state) => ({
      workspaces: state.workspaces.map((ws) => {
        if (ws.id !== workspaceId) return ws
        return {
          ...ws,
          meetingCount: Math.max(0, ws.meetingCount - 1),
          meetings: ws.meetings.filter((m) => m.id !== meetingId),
        }
      }),
    })),
}))
