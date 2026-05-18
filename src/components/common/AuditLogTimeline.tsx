import React, { useState } from 'react'
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleDot,
  FileUp,
  GitCompare,
  Link2,
  ShieldCheck,
  Trash2,
  XCircle,
} from 'lucide-react'
import type { AuditAction, AuditLog, AuditTargetType } from '../../types'

const actionLabel: Record<AuditAction, string> = {
  CREATE: '생성',
  UPDATE: '수정',
  DELETE: '삭제',
  UPLOAD: '업로드',
  MATCH: '매칭',
  APPROVE: '승인',
  REJECT: '거절',
}

const targetLabel: Record<AuditTargetType, string> = {
  EXPENSE: '예산',
  EVENT: '행사',
  FILE: '파일',
  ASSET: '자산',
  STUDENT: '학생',
  ORGANIZATION: '조직',
  COHORT: '기수',
  ORG_MEMBER: '조직 멤버',
}

const fieldLabel: Record<string, string> = {
  id: 'ID',
  cohortId: '기수 ID',
  amount: '금액',
  vendor: '사용처',
  date: '사용일',
  department: '부서',
  category: '항목',
  paymentMethod: '결제수단',
  description: '내용',
  note: '비고',
  eventId: '연결 행사',
  receiptDatetime: '결제 시각',
  receiptStoragePath: '영수증',
  photoIds: '증빙사진',
  name: '이름',
  title: '제목',
  status: '상태',
  role: '권한',
  studentNumber: '학번',
  paymentStatus: '납부 상태',
  paidAt: '납부일',
  availableQuantity: '가용 수량',
  quantity: '수량',
  targetLabel: '대상',
  rowCount: '거래 수',
  matched: '매칭 여부',
  matchConfidence: '매칭 신뢰도',
  matchReason: '매칭 사유',
  type: '유형',
  mimeType: '파일 형식',
  size: '크기',
  startDate: '시작일',
  endDate: '종료일',
  location: '장소',
  leadDepartment: '주관 부서',
  organizers: '담당자',
  budget: '예산',
  coverColor: '색상',
  createdBy: '생성자',
}

const summaryHiddenFields = new Set([
  'id',
  'cohortId',
  'createdAt',
  'updatedAt',
  'deletedAt',
  'createdBy',
  'uploadedBy',
  'storagePath',
])

function iconFor(action: AuditAction) {
  if (action === 'CREATE') return <CheckCircle2 size={14} />
  if (action === 'UPDATE') return <GitCompare size={14} />
  if (action === 'DELETE') return <Trash2 size={14} />
  if (action === 'UPLOAD') return <FileUp size={14} />
  if (action === 'MATCH') return <Link2 size={14} />
  if (action === 'APPROVE') return <ShieldCheck size={14} />
  if (action === 'REJECT') return <XCircle size={14} />
  return <CircleDot size={14} />
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function formatValue(value: unknown, field?: string): string {
  if (value === null || value === undefined || value === '') return '-'
  if (Array.isArray(value) && isDateArray(value)) return formatDateArray(value)
  if (field === 'size' && typeof value === 'number') return formatBytes(value)
  if (field === 'amount' && typeof value === 'number') return `${value.toLocaleString()}원`
  if (typeof value === 'number') return Number.isFinite(value) ? value.toLocaleString() : String(value)
  if (typeof value === 'boolean') return value ? '예' : '아니오'
  if (Array.isArray(value)) return value.length ? value.map((item) => formatValue(item)).join(', ') : '-'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function isDateArray(value: unknown[]): value is number[] {
  return value.length >= 3
    && value.length <= 7
    && value.every((item) => typeof item === 'number')
    && Number(value[0]) >= 1900
    && Number(value[0]) <= 2100
}

function formatDateArray(value: number[]) {
  const [year, month, day, hour, minute] = value
  const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  if (hour === undefined) return date
  return `${date} ${String(hour).padStart(2, '0')}:${String(minute ?? 0).padStart(2, '0')}`
}

function formatBytes(value: number) {
  if (value < 1024) return `${value.toLocaleString()} B`
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`
  return `${(value / (1024 * 1024)).toFixed(1)} MB`
}

function changedSummary(log: AuditLog) {
  if (log.action === 'CREATE') return `${targetLabel[log.targetType]} 생성`
  if (log.action === 'DELETE') return `${targetLabel[log.targetType]} 삭제`
  if (log.action === 'UPLOAD') return `${targetLabel[log.targetType]} 업로드`
  if (log.action === 'MATCH') return log.targetLabel ?? '통장 매칭'
  if (log.action === 'APPROVE') return '가입/권한 승인'
  if (log.action === 'REJECT') return '가입/권한 거절'
  if (log.changedFields.length === 0) return `${targetLabel[log.targetType]} 수정`
  const first = summaryFields(log)[0] ?? log.changedFields[0]
  const suffix = log.changedFields.length > 1 ? ` 외 ${log.changedFields.length - 1}개` : ''
  return `${fieldLabel[first] ?? first}${suffix} 수정`
}

function summaryFields(log: AuditLog) {
  if (log.action === 'CREATE' || log.action === 'UPLOAD') return []
  const businessFields = log.changedFields.filter((field) => !summaryHiddenFields.has(field))
  return (businessFields.length > 0 ? businessFields : log.changedFields).slice(0, 3)
}

function detailFields(log: AuditLog) {
  const businessFields = log.changedFields.filter((field) => !summaryHiddenFields.has(field))
  const systemFields = log.changedFields.filter((field) => summaryHiddenFields.has(field))
  return [...businessFields, ...systemFields]
}

function valueFor(log: AuditLog, field: string, side: 'before' | 'after') {
  const data = side === 'before' ? log.beforeData : log.afterData
  return formatValue(data?.[field], field)
}

export function AuditLogTimeline({
  logs,
  isLoading = false,
  emptyText = '표시할 수정 이력이 없습니다.',
}: {
  logs: AuditLog[]
  isLoading?: boolean
  emptyText?: string
}) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  if (isLoading) {
    return <div className="text-sm text-slate-500 py-8 text-center">이력을 불러오는 중</div>
  }

  if (logs.length === 0) {
    return <div className="text-sm text-slate-500 py-8 text-center">{emptyText}</div>
  }

  return (
    <div className="space-y-3">
      {logs.map((log) => {
        const isExpanded = expandedIds.has(log.id)
        const previewFields = summaryFields(log)
        const allFields = detailFields(log)
        const hiddenCount = Math.max(0, allFields.length - previewFields.length)
        const showDetailsButton = hiddenCount > 0 || (previewFields.length === 0 && allFields.length > 0)
        const toggleExpanded = () => {
          setExpandedIds((current) => {
            const next = new Set(current)
            if (next.has(log.id)) next.delete(log.id)
            else next.add(log.id)
            return next
          })
        }

        return (
          <div key={log.id} className="border border-slate-200 rounded-lg bg-white p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                {iconFor(log.action)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {log.actorName ?? '시스템'}님이 {changedSummary(log)}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span>{formatDate(log.createdAt)}</span>
                      <span className="h-1 w-1 rounded-full bg-slate-300" />
                      <span>{targetLabel[log.targetType]}</span>
                      {log.targetLabel && (
                        <>
                          <span className="h-1 w-1 rounded-full bg-slate-300" />
                          <span className="truncate">대상: {log.targetLabel}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                    {actionLabel[log.action]}
                  </span>
                </div>

                {previewFields.length > 0 && (
                  <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2">
                    <div className="grid gap-1.5">
                      {previewFields.map((field) => (
                        <div key={field} className="grid grid-cols-[88px_1fr] gap-2 text-xs">
                          <span className="font-medium text-slate-500">{fieldLabel[field] ?? field}</span>
                          <span className="min-w-0 break-words text-slate-700">
                            <span className="text-slate-400">{valueFor(log, field, 'before')}</span>
                            <span className="px-1.5 text-slate-300">→</span>
                            <span className="font-medium text-slate-900">{valueFor(log, field, 'after')}</span>
                          </span>
                        </div>
                      ))}
                    </div>
                    {hiddenCount > 0 && (
                      <button
                        onClick={toggleExpanded}
                        className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800"
                      >
                        {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        {isExpanded ? '상세 접기' : `상세보기 · ${hiddenCount}개 더`}
                      </button>
                    )}
                  </div>
                )}

                {previewFields.length === 0 && showDetailsButton && (
                  <button
                    onClick={toggleExpanded}
                    className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800"
                  >
                    {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    {isExpanded ? '상세 접기' : '상세보기'}
                  </button>
                )}

                {isExpanded && showDetailsButton && (
                  <div className="mt-3 overflow-hidden rounded-lg border border-slate-200">
                    <div className="grid grid-cols-[110px_1fr_1fr] bg-slate-50 text-xs font-semibold text-slate-500">
                      <div className="px-3 py-2">필드</div>
                      <div className="px-3 py-2">변경 전</div>
                      <div className="px-3 py-2">변경 후</div>
                    </div>
                    {allFields.map((field) => (
                      <div key={field} className="grid grid-cols-[110px_1fr_1fr] border-t border-slate-100 text-xs">
                        <div className="px-3 py-2 font-medium text-slate-500">{fieldLabel[field] ?? field}</div>
                        <div className="min-w-0 break-words px-3 py-2 text-slate-500">{valueFor(log, field, 'before')}</div>
                        <div className="min-w-0 break-words px-3 py-2 font-medium text-slate-800">{valueFor(log, field, 'after')}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export { actionLabel, targetLabel, fieldLabel, formatDate, formatValue }
