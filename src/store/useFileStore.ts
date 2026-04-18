import { create } from 'zustand'
import { fileItems as initialFiles } from '../data/files'
import type { FileItem, FileLog } from '../types'

interface FileStore {
  files: FileItem[]
  addFile: (file: Omit<FileItem, 'id' | 'logs'>) => void
  addFolder: (folder: Omit<FileItem, 'id' | 'logs'>) => void
  renameFile: (id: string, newName: string, actor: string) => void
  deleteFile: (id: string) => void
  moveFile: (id: string, newParentId: string | undefined, actor: string) => void
  updateFileEvent: (id: string, eventId: string | undefined) => void
}

export const useFileStore = create<FileStore>((set) => ({
  files: initialFiles,
  addFile: (file) =>
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
    })),
  addFolder: (folder) =>
    set((state) => ({
      files: [
        ...state.files,
        {
          ...folder,
          id: `folder-${Date.now()}`,
          logs: [],
        },
      ],
    })),
  renameFile: (id, newName, actor) =>
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
    })),
  deleteFile: (id) =>
    set((state) => ({
      files: state.files.filter((f) => f.id !== id && f.parentId !== id),
    })),
  moveFile: (id, newParentId, actor) =>
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
    })),
  updateFileEvent: (id, eventId) =>
    set((state) => ({
      files: state.files.map((f) =>
        f.id === id ? { ...f, eventId, updatedAt: new Date().toISOString() } : f
      ),
    })),
}))
