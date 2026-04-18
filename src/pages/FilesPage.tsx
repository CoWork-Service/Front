import React, { useState, useMemo } from 'react'
import {
  FolderOpen, Folder, File, FileText, FileImage, FileSpreadsheet,
  Upload, FolderPlus, Search, ChevronRight, CalendarDays,
  Trash2, Edit2, History, Download, LayoutList, Tag,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useFileStore } from '../store/useFileStore'
import { useCohortStore } from '../store/useCohortStore'
import { useEventStore } from '../store/useEventStore'
import { PageHeader } from '../components/common/PageHeader'
import { EmptyState } from '../components/common/EmptyState'
import { Modal } from '../components/common/Modal'
import { FileUploadDropzone } from '../components/common/FileUploadDropzone'
import { DepartmentTag } from '../components/common/DepartmentTag'
import { useToast } from '../components/common/Toast'
import type { FileItem } from '../types'

function formatSize(bytes?: number): string {
  if (!bytes) return '-'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getFileIcon(item: FileItem) {
  if (item.type === 'folder') return <Folder size={18} className="text-amber-400" />
  const mime = item.mimeType ?? ''
  if (mime.startsWith('image/')) return <FileImage size={18} className="text-pink-400" />
  if (mime.includes('pdf')) return <FileText size={18} className="text-red-400" />
  if (mime.includes('spreadsheet') || mime.includes('excel')) return <FileSpreadsheet size={18} className="text-green-500" />
  if (mime.includes('word') || mime.includes('document')) return <FileText size={18} className="text-blue-400" />
  return <File size={18} className="text-slate-400" />
}

const logActionLabel: Record<string, string> = {
  upload: '업로드', update: '수정', rename: '이름 변경', move: '이동', delete: '삭제',
}

type ViewMode = 'event' | 'folder'

export default function FilesPage() {
  const { currentCohortId } = useCohortStore()
  const { files, addFile, addFolder, renameFile, deleteFile, updateFileEvent } = useFileStore()
  const { events } = useEventStore()
  const toast = useToast()

  const cohortEvents = useMemo(
    () => events.filter((e) => e.cohortId === currentCohortId),
    [events, currentCohortId]
  )

  const [viewMode, setViewMode] = useState<ViewMode>('event')

  // 행사별 뷰 상태
  const [selectedEventId, setSelectedEventId] = useState<string | '__none__' | ''>('')

  // 폴더 뷰 상태
  const [currentFolderId, setCurrentFolderId] = useState<string | undefined>(undefined)

  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null)
  const [search, setSearch] = useState('')
  const [uploadOpen, setUploadOpen] = useState(false)
  const [uploadEventId, setUploadEventId] = useState('')
  const [newFolderOpen, setNewFolderOpen] = useState(false)
  const [renameOpen, setRenameOpen] = useState(false)
  const [renameTarget, setRenameTarget] = useState<FileItem | null>(null)
  const [newName, setNewName] = useState('')
  const [newFolderName, setNewFolderName] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<FileItem | null>(null)

  const cohortFiles = useMemo(
    () => files.filter((f) => f.cohortId === currentCohortId),
    [files, currentCohortId]
  )

  const rootFolders = useMemo(
    () => cohortFiles.filter((f) => f.type === 'folder' && !f.parentId),
    [cohortFiles]
  )

  // 행사별 뷰: 파일 수 집계
  const eventFileCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    cohortFiles.forEach((f) => {
      if (f.type === 'file' && f.eventId) {
        counts[f.eventId] = (counts[f.eventId] ?? 0) + 1
      }
    })
    return counts
  }, [cohortFiles])

  const unlinkedFileCount = useMemo(
    () => cohortFiles.filter((f) => f.type === 'file' && !f.eventId).length,
    [cohortFiles]
  )

  // 표시할 파일 목록
  const currentItems = useMemo(() => {
    let items: FileItem[]

    if (viewMode === 'event') {
      // 행사별 뷰: 폴더 무시, 파일만
      items = cohortFiles.filter((f) => f.type === 'file')
      if (selectedEventId === '__none__') {
        items = items.filter((f) => !f.eventId)
      } else if (selectedEventId) {
        items = items.filter((f) => f.eventId === selectedEventId)
      }
    } else {
      // 폴더 뷰: 기존 방식
      items = cohortFiles.filter((f) => f.parentId === currentFolderId)
    }

    if (search) {
      items = cohortFiles.filter(
        (f) => f.type === 'file' && f.name.toLowerCase().includes(search.toLowerCase())
      )
    }

    return items.sort((a, b) => {
      if (a.type === 'folder' && b.type !== 'folder') return -1
      if (a.type !== 'folder' && b.type === 'folder') return 1
      return a.name.localeCompare(b.name)
    })
  }, [cohortFiles, viewMode, selectedEventId, currentFolderId, search])

  const buildPath = (folderId?: string): FileItem[] => {
    if (!folderId) return []
    const folder = cohortFiles.find((f) => f.id === folderId)
    if (!folder) return []
    return [...buildPath(folder.parentId), folder]
  }
  const pathItems = buildPath(currentFolderId)

  const handleItemClick = (item: FileItem) => {
    if (item.type === 'folder') {
      setCurrentFolderId(item.id)
      setSelectedFile(null)
    } else {
      setSelectedFile(item)
    }
  }

  const openUpload = () => {
    // 행사별 뷰에서 특정 행사 선택 중이면 해당 행사 미리 선택
    if (viewMode === 'event' && selectedEventId && selectedEventId !== '__none__') {
      setUploadEventId(selectedEventId)
    } else {
      setUploadEventId('')
    }
    setUploadOpen(true)
  }

  const handleUpload = () => {
    const newFile: Omit<FileItem, 'id' | 'logs'> = {
      cohortId: currentCohortId,
      name: '업로드된 파일.pdf',
      type: 'file',
      mimeType: 'application/pdf',
      size: 512000,
      parentId: viewMode === 'folder' ? currentFolderId : undefined,
      path: '/업로드된 파일.pdf',
      uploadedBy: '김민준',
      updatedAt: new Date().toISOString(),
      eventId: uploadEventId || undefined,
    }
    addFile(newFile)
    toast.success('파일이 업로드되었습니다.')
    setUploadOpen(false)
  }

  const handleNewFolder = () => {
    if (!newFolderName.trim()) return
    addFolder({
      cohortId: currentCohortId,
      name: newFolderName.trim(),
      type: 'folder',
      parentId: currentFolderId,
      path: `/${newFolderName.trim()}`,
      updatedAt: new Date().toISOString(),
    })
    toast.success(`'${newFolderName}' 폴더가 생성되었습니다.`)
    setNewFolderName('')
    setNewFolderOpen(false)
  }

  const handleRename = () => {
    if (!renameTarget || !newName.trim()) return
    renameFile(renameTarget.id, newName.trim(), '김민준')
    toast.success('이름이 변경되었습니다.')
    if (selectedFile?.id === renameTarget.id) setSelectedFile({ ...selectedFile, name: newName.trim() })
    setRenameOpen(false)
    setRenameTarget(null)
  }

  const handleDelete = (item: FileItem) => {
    deleteFile(item.id)
    if (selectedFile?.id === item.id) setSelectedFile(null)
    toast.success('삭제되었습니다.')
    setDeleteConfirm(null)
  }

  // 현재 선택된 행사 라벨
  const activeEventLabel = useMemo(() => {
    if (!selectedEventId) return '전체 파일'
    if (selectedEventId === '__none__') return '미연결 파일'
    return cohortEvents.find((e) => e.id === selectedEventId)?.name ?? '전체 파일'
  }, [selectedEventId, cohortEvents])

  return (
    <div>
      <PageHeader
        title="파일 관리"
        description="기수별 파일과 폴더를 관리합니다."
        actions={
          <>
            {viewMode === 'folder' && (
              <button onClick={() => setNewFolderOpen(true)} className="btn-secondary">
                <FolderPlus size={16} />새 폴더
              </button>
            )}
            <button onClick={openUpload} className="btn-primary">
              <Upload size={16} />업로드
            </button>
          </>
        }
      />

      <div className="flex gap-4 h-[calc(100vh-220px)]">
        {/* 좌측 사이드바 */}
        <div className="w-52 shrink-0 card p-3 overflow-y-auto flex flex-col gap-1">
          {/* 뷰 모드 토글 */}
          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1 mb-2">
            <button
              onClick={() => { setViewMode('event'); setSelectedFile(null) }}
              className={`flex-1 flex items-center justify-center gap-1 text-xs py-1.5 rounded-md font-medium transition-colors ${viewMode === 'event' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Tag size={12} />행사별
            </button>
            <button
              onClick={() => { setViewMode('folder'); setSelectedEventId(''); setSelectedFile(null) }}
              className={`flex-1 flex items-center justify-center gap-1 text-xs py-1.5 rounded-md font-medium transition-colors ${viewMode === 'folder' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <LayoutList size={12} />폴더별
            </button>
          </div>

          {/* 행사별 뷰 사이드바 */}
          {viewMode === 'event' && (
            <>
              <button
                onClick={() => { setSelectedEventId(''); setSelectedFile(null) }}
                className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-sm transition-colors ${!selectedEventId ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <span className="flex items-center gap-2">
                  <CalendarDays size={14} className="text-slate-400" />전체
                </span>
                <span className="text-xs text-slate-400">{cohortFiles.filter(f => f.type === 'file').length}</span>
              </button>

              <div className="h-px bg-slate-100 my-1" />

              {cohortEvents.map((ev) => {
                const count = eventFileCounts[ev.id] ?? 0
                const colorDot: Record<string, string> = {
                  blue: 'bg-blue-500', green: 'bg-emerald-500', orange: 'bg-amber-500',
                  purple: 'bg-purple-500', red: 'bg-red-500',
                }
                return (
                  <button
                    key={ev.id}
                    onClick={() => { setSelectedEventId(ev.id); setSelectedFile(null) }}
                    className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-sm transition-colors ${selectedEventId === ev.id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    <span className="flex items-center gap-2 truncate">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${colorDot[ev.coverColor ?? 'blue'] ?? 'bg-slate-400'}`} />
                      <span className="truncate text-xs">{ev.name}</span>
                    </span>
                    <span className="text-xs text-slate-400 shrink-0 ml-1">{count}</span>
                  </button>
                )
              })}

              <div className="h-px bg-slate-100 my-1" />

              <button
                onClick={() => { setSelectedEventId('__none__'); setSelectedFile(null) }}
                className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-sm transition-colors ${selectedEventId === '__none__' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-slate-300 shrink-0" />
                  <span className="text-xs">미연결 파일</span>
                </span>
                <span className="text-xs text-slate-400">{unlinkedFileCount}</span>
              </button>
            </>
          )}

          {/* 폴더별 뷰 사이드바 */}
          {viewMode === 'folder' && (
            <>
              <button
                onClick={() => { setCurrentFolderId(undefined); setSelectedFile(null) }}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors mb-1 ${!currentFolderId ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <FolderOpen size={15} className="text-amber-400" />
                전체 파일
              </button>
              {rootFolders.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => { setCurrentFolderId(folder.id); setSelectedFile(null) }}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors ${currentFolderId === folder.id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <Folder size={15} className="text-amber-400" />
                  <span className="truncate">{folder.name}</span>
                </button>
              ))}
            </>
          )}
        </div>

        {/* 중앙 파일 리스트 */}
        <div className="flex-1 card overflow-hidden flex flex-col">
          {/* 툴바 */}
          <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3">
            {/* 행사별 뷰: 현재 선택 레이블 */}
            {viewMode === 'event' ? (
              <div className="flex items-center gap-2 flex-1">
                <CalendarDays size={15} className="text-slate-400" />
                <span className="text-sm font-medium text-slate-700">{activeEventLabel}</span>
                {selectedEventId && selectedEventId !== '__none__' && (
                  <Link to={`/events/${selectedEventId}`} className="text-xs text-blue-600 hover:underline">
                    행사 페이지 →
                  </Link>
                )}
              </div>
            ) : (
              /* 폴더별 뷰: Breadcrumb */
              <div className="flex items-center gap-1 text-sm text-slate-600 flex-1">
                <button
                  onClick={() => { setCurrentFolderId(undefined); setSelectedFile(null) }}
                  className="text-blue-600 hover:underline"
                >
                  전체
                </button>
                {pathItems.map((p) => (
                  <React.Fragment key={p.id}>
                    <ChevronRight size={14} className="text-slate-400" />
                    <button
                      onClick={() => { setCurrentFolderId(p.id); setSelectedFile(null) }}
                      className="text-blue-600 hover:underline truncate max-w-32"
                    >
                      {p.name}
                    </button>
                  </React.Fragment>
                ))}
              </div>
            )}

            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="파일 검색"
                className="input pl-8 w-48 py-1.5 text-xs"
              />
            </div>
          </div>

          {/* 파일 목록 */}
          <div className="flex-1 overflow-y-auto">
            {currentItems.length === 0 ? (
              <EmptyState
                title="파일이 없습니다."
                description={
                  search ? '검색 조건에 맞는 파일이 없습니다.'
                  : viewMode === 'event' && selectedEventId
                  ? '이 행사에 연결된 파일이 없습니다. 업로드 버튼을 눌러 추가하세요.'
                  : '파일을 업로드하세요.'
                }
                action={
                  !search ? (
                    <button onClick={openUpload} className="btn-primary">
                      <Upload size={16} />업로드
                    </button>
                  ) : undefined
                }
              />
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left text-xs font-medium text-slate-500 px-4 py-2.5">이름</th>
                    {viewMode === 'folder' && (
                      <th className="text-left text-xs font-medium text-slate-500 px-4 py-2.5 w-32">연결 행사</th>
                    )}
                    <th className="text-left text-xs font-medium text-slate-500 px-4 py-2.5 w-24">크기</th>
                    <th className="text-left text-xs font-medium text-slate-500 px-4 py-2.5 w-36">수정일</th>
                    <th className="text-left text-xs font-medium text-slate-500 px-4 py-2.5 w-24">업로드</th>
                    <th className="w-20" />
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((item) => {
                    const linkedEvent = item.eventId ? cohortEvents.find((e) => e.id === item.eventId) : null
                    return (
                      <tr
                        key={item.id}
                        className={`border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors ${selectedFile?.id === item.id ? 'bg-blue-50' : ''}`}
                        onClick={() => handleItemClick(item)}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            {getFileIcon(item)}
                            <span className="text-sm text-slate-800 font-medium">{item.name}</span>
                            {item.department && <DepartmentTag department={item.department} />}
                          </div>
                        </td>
                        {viewMode === 'folder' && (
                          <td className="px-4 py-3">
                            {linkedEvent ? (
                              <Link
                                to={`/events/${linkedEvent.id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center gap-1 text-xs text-blue-600 hover:underline truncate max-w-[110px]"
                              >
                                <CalendarDays size={11} />
                                {linkedEvent.name}
                              </Link>
                            ) : (
                              <span className="text-xs text-slate-300">-</span>
                            )}
                          </td>
                        )}
                        <td className="px-4 py-3 text-xs text-slate-500">{formatSize(item.size)}</td>
                        <td className="px-4 py-3 text-xs text-slate-500">{item.updatedAt.slice(0, 10)}</td>
                        <td className="px-4 py-3 text-xs text-slate-500">{item.uploadedBy ?? '-'}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => { e.stopPropagation(); setRenameTarget(item); setNewName(item.name); setRenameOpen(true) }}
                              className="p-1 rounded text-slate-400 hover:text-slate-700 transition-colors"
                              title="이름 변경"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); setDeleteConfirm(item) }}
                              className="p-1 rounded text-slate-400 hover:text-red-500 transition-colors"
                              title="삭제"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* 우측 상세 패널 */}
        {selectedFile && (
          <div className="w-72 shrink-0 card p-4 overflow-y-auto flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800 truncate flex-1">{selectedFile.name}</h3>
              <button onClick={() => setSelectedFile(null)} className="text-slate-400 hover:text-slate-600 ml-2 shrink-0">✕</button>
            </div>

            {selectedFile.previewUrl ? (
              <div className="rounded-xl overflow-hidden border border-slate-200">
                <img src={selectedFile.previewUrl} alt={selectedFile.name} className="w-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
              </div>
            ) : (
              <div className="rounded-xl bg-slate-100 flex items-center justify-center h-32 text-slate-400 text-xs">
                미리보기 없음
              </div>
            )}

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">크기</span>
                <span className="text-slate-800 font-medium">{formatSize(selectedFile.size)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">수정일</span>
                <span className="text-slate-800">{selectedFile.updatedAt.slice(0, 10)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">업로드</span>
                <span className="text-slate-800">{selectedFile.uploadedBy ?? '-'}</span>
              </div>
              {selectedFile.department && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">부서</span>
                  <DepartmentTag department={selectedFile.department} />
                </div>
              )}
            </div>

            {/* 연결 행사 */}
            {selectedFile.type === 'file' && (
              <div>
                <div className="flex items-center gap-1 mb-2">
                  <CalendarDays size={13} className="text-slate-400" />
                  <span className="text-xs font-semibold text-slate-600">연결 행사</span>
                </div>
                <select
                  value={selectedFile.eventId ?? ''}
                  onChange={(e) => {
                    const val = e.target.value || undefined
                    updateFileEvent(selectedFile.id, val)
                    setSelectedFile({ ...selectedFile, eventId: val })
                    toast.success(val ? '행사에 연결되었습니다.' : '연결이 해제되었습니다.')
                  }}
                  className="select-input text-xs py-1 w-full"
                >
                  <option value="">행사 미연결</option>
                  {cohortEvents.map((ev) => (
                    <option key={ev.id} value={ev.id}>{ev.name}</option>
                  ))}
                </select>
                {selectedFile.eventId && (() => {
                  const ev = cohortEvents.find((e) => e.id === selectedFile.eventId)
                  return ev ? (
                    <Link to={`/events/${ev.id}`} className="mt-1.5 flex items-center gap-1 text-xs text-blue-600 hover:underline">
                      <CalendarDays size={11} />행사 페이지에서 보기 →
                    </Link>
                  ) : null
                })()}
              </div>
            )}

            <div className="flex gap-2">
              <button className="btn-secondary flex-1 justify-center py-1.5 text-xs">
                <Download size={13} />다운로드
              </button>
              <button
                onClick={() => { setRenameTarget(selectedFile); setNewName(selectedFile.name); setRenameOpen(true) }}
                className="btn-secondary flex-1 justify-center py-1.5 text-xs"
              >
                <Edit2 size={13} />이름 변경
              </button>
            </div>

            {selectedFile.logs.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <History size={13} className="text-slate-400" />
                  <span className="text-xs font-semibold text-slate-600">수정 로그</span>
                </div>
                <div className="space-y-2">
                  {selectedFile.logs.map((log) => (
                    <div key={log.id} className="flex gap-2 text-xs">
                      <div className="w-1 bg-slate-200 rounded-full shrink-0 mt-0.5" />
                      <div>
                        <span className="font-medium text-slate-700">{logActionLabel[log.action] ?? log.action}</span>
                        <span className="text-slate-400"> · {log.actor}</span>
                        <p className="text-slate-400">{log.timestamp.slice(0, 16).replace('T', ' ')}</p>
                        {log.detail && <p className="text-slate-500">{log.detail}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 업로드 모달 */}
      <Modal open={uploadOpen} onClose={() => setUploadOpen(false)} title="파일 업로드" footer={
        <><button onClick={() => setUploadOpen(false)} className="btn-secondary">취소</button>
        <button onClick={handleUpload} className="btn-primary">업로드</button></>
      }>
        <div className="space-y-4">
          <FileUploadDropzone multiple label="파일을 드래그하거나 클릭하여 업로드" hint="더미 모드: 실제 파일은 저장되지 않습니다." />
          <div>
            <label className="label">연결 행사 (선택)</label>
            <select value={uploadEventId} onChange={(e) => setUploadEventId(e.target.value)} className="select-input">
              <option value="">행사 미연결</option>
              {cohortEvents.map((ev) => (
                <option key={ev.id} value={ev.id}>{ev.name} ({ev.startDate})</option>
              ))}
            </select>
          </div>
        </div>
      </Modal>

      {/* 새 폴더 모달 */}
      <Modal open={newFolderOpen} onClose={() => setNewFolderOpen(false)} title="새 폴더" size="sm" footer={
        <><button onClick={() => setNewFolderOpen(false)} className="btn-secondary">취소</button>
        <button onClick={handleNewFolder} className="btn-primary">만들기</button></>
      }>
        <input type="text" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)}
          placeholder="폴더 이름" className="input" onKeyDown={(e) => e.key === 'Enter' && handleNewFolder()} />
      </Modal>

      {/* 이름 변경 모달 */}
      <Modal open={renameOpen} onClose={() => setRenameOpen(false)} title="이름 변경" size="sm" footer={
        <><button onClick={() => setRenameOpen(false)} className="btn-secondary">취소</button>
        <button onClick={handleRename} className="btn-primary">변경</button></>
      }>
        <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)}
          className="input" onKeyDown={(e) => e.key === 'Enter' && handleRename()} />
      </Modal>

      {/* 삭제 확인 */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="삭제 확인" size="sm" footer={
        <><button onClick={() => setDeleteConfirm(null)} className="btn-secondary">취소</button>
        <button onClick={() => deleteConfirm && handleDelete(deleteConfirm)} className="btn-danger">삭제</button></>
      }>
        <p className="text-sm text-slate-600">
          <strong className="text-slate-900">'{deleteConfirm?.name}'</strong>을(를) 삭제하시겠습니까?
        </p>
      </Modal>
    </div>
  )
}
