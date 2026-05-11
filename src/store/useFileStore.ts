import { create } from 'zustand'
import { apiRequest } from '../lib/api'
import { fetchFiles, toFileItem, type ApiFileItem } from '../lib/backendApi'
import type { FileItem, FileLog } from '../types'

interface FileStore {
  files: FileItem[]
  isLoading: boolean
  error?: string
  loadFiles: (cohortId: string) => Promise<void>
  addFile: (file: Omit<FileItem, 'id' | 'logs'>, uploadFile?: File) => Promise<void>
  addFolder: (folder: Omit<FileItem, 'id' | 'logs'>) => Promise<void>
  renameFile: (id: string, newName: string, actor: string) => Promise<void>
  deleteFile: (id: string) => Promise<void>
  moveFile: (id: string, newParentId: string | undefined, actor: string) => Promise<void>
  updateFileEvent: (id: string, eventId: string | undefined) => Promise<void>
}

export const useFileStore = create<FileStore>((set) => ({
  files: [],
  isLoading: false,
  error: undefined,
  loadFiles: async (cohortId) => {
    if (!cohortId) return
    set({ isLoading: true, error: undefined })
    try {
      set({ files: await fetchFiles(cohortId), isLoading: false })
    } catch (error) {
      set({ isLoading: false, error: error instanceof Error ? error.message : '파일 목록을 불러오지 못했습니다.' })
    }
  },
  addFile: async (file, uploadFile) => {
    if (uploadFile) {
      const form = new FormData()
      form.append('file', uploadFile)
      form.append('cohortId', file.cohortId)
      if (file.parentId) form.append('parentId', file.parentId)
      if (file.department && file.department !== '전체') form.append('department', file.department)
      if (file.eventId) form.append('eventId', file.eventId)
      const saved = await apiRequest<ApiFileItem>('/api/files/upload', { method: 'POST', body: form })
      set((state) => ({ files: [...state.files, toFileItem(saved)] }))
      return
    }

    set((state) => ({
      files: [
        ...state.files,
        {
          ...file,
          id: `file-${Date.now()}`,
          logs: [
            {
              id: `log-${Date.now()}`,
              action: 'upload',
              actor: file.uploadedBy || '사용자',
              timestamp: new Date().toISOString(),
              detail: '파일 업로드',
            },
          ],
        },
      ],
    }))
  },
  addFolder: async (folder) => {
    const saved = await apiRequest<ApiFileItem>('/api/files/folder', {
      method: 'POST',
      body: JSON.stringify({
        cohortId: Number(folder.cohortId),
        name: folder.name,
        parentId: folder.parentId ? Number(folder.parentId) : undefined,
        department: folder.department === '전체' ? undefined : folder.department,
        eventId: folder.eventId ? Number(folder.eventId) : undefined,
      }),
    })
    set((state) => ({
      files: [...state.files, toFileItem(saved)],
    }))
  },
  renameFile: async (id, newName, actor) => {
    const saved = await apiRequest<ApiFileItem>(`/api/files/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name: newName }),
    })
    set((state) => ({
      files: state.files.map((f) => {
        if (f.id !== id) return f
        const log: FileLog = {
          id: `log-${Date.now()}`,
          action: 'rename',
          actor,
          timestamp: new Date().toISOString(),
          detail: `${f.name} → ${newName}`,
        }
        return {
          ...f,
          name: newName,
          updatedAt: new Date().toISOString(),
          logs: [...f.logs, log],
        }
      }),
    }))
    set((state) => ({
      files: state.files.map((f) => (f.id === id ? { ...f, ...toFileItem(saved), logs: f.logs } : f)),
    }))
  },
  deleteFile: async (id) => {
    await apiRequest<void>(`/api/files/${id}`, { method: 'DELETE' })
    set((state) => ({
      files: state.files.filter((f) => f.id !== id && f.parentId !== id),
    }))
  },
  moveFile: async (id, newParentId, actor) => {
    const saved = await apiRequest<ApiFileItem>(`/api/files/${id}/move`, {
      method: 'PATCH',
      body: JSON.stringify({ parentId: newParentId ? Number(newParentId) : null }),
    })
    set((state) => ({
      files: state.files.map((f) => {
        if (f.id !== id) return f
        const log: FileLog = {
          id: `log-${Date.now()}`,
          action: 'move',
          actor,
          timestamp: new Date().toISOString(),
          detail: `폴더 이동`,
        }
        return {
          ...f,
          parentId: newParentId,
          updatedAt: new Date().toISOString(),
          logs: [...f.logs, log],
        }
      }),
    }))
    set((state) => ({
      files: state.files.map((f) => (f.id === id ? { ...f, ...toFileItem(saved), logs: f.logs } : f)),
    }))
  },
  updateFileEvent: async (id, eventId) => {
    const saved = await apiRequest<ApiFileItem>(`/api/files/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ eventId: eventId ? Number(eventId) : null }),
    })
    set((state) => ({
      files: state.files.map((f) => (f.id === id ? { ...f, ...toFileItem(saved), logs: f.logs } : f)),
    }))
  },
}))
