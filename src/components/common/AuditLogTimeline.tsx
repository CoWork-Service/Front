import React from 'react'
import { CheckCircle2, CircleDot, FileUp, GitCompare, Link2, ShieldCheck, Trash2, XCircle } from 'lucide-react'
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
  location: '위치',
  targetLabel: '대상',
  rowCount: '거래 수',
  matched: '매칭 여부',
  matchConfidence: '매칭 신뢰도',
  matchReason: '매칭 사유',
}

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

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '-'
  if (typeof value === 'number') return Number.isFinite(value) ? value.toLocaleString() : String(value)
  if (typeof value === 'boolean') return value ? '예' : '아니오'
  if (Array.isArray(value)) return value.length ? value.map(formatValue).join(', ') : '-'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function changedSummary(log: AuditLog) {
  if (log.action === 'CREATE') return `${targetLabel[log.targetType]} 생성`
  if (log.action === 'DELETE') return `${targetLabel[log.targetType]} 삭제`
  if (log.action === 'UPLOAD') return `${targetLabel[log.targetType]} 업로드`
  if (log.action === 'MATCH') return log.targetLabel ?? '통장 매칭'
  if (log.action === 'APPROVE') return '가입/권한 승인'
  if (log.action === 'REJECT') return '가입/권한 거절'
  if (log.changedFields.length === 0) return `${targetLabel[log.targetType]} 수정`
  const first = log.changedFields[0]
  const suffix = log.changedFields.length > 1 ? ` 외 ${log.changedFields.length - 1}개` : ''
  return `${fieldLabel[first] ?? first}${suffix} 수정`
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
  if (isLoading) {
    return <div className="text-sm text-slate-500 py-8 text-center">이력을 불러오는 중</div>
  }

  if (logs.length === 0) {
    return <div className="text-sm text-slate-500 py-8 text-center">{emptyText}</div>
  }

  return (
    <div className="space-y-3">
      {logs.map((log) => (
        <div key={log.id} className="border border-slate-200 rounded-lg bg-white p-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              {iconFor(log.action)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-900 truncate">
                  {log.actorName ?? '시스템'}님이 {changedSummary(log)}
                </p>
                <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                  {actionLabel[log.action]}
                </span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span>{formatDate(log.createdAt)}</span>
                <span>{targetLabel[log.targetType]}</span>
                {log.targetLabel && <span className="truncate">대상: {log.targetLabel}</span>}
              </div>

              {log.changedFields.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {log.changedFields.slice(0, 6).map((field) => (
                    <div key={field} className="grid grid-cols-[88px_1fr] gap-2 text-xs">
                      <span className="font-medium text-slate-500">{fieldLabel[field] ?? field}</span>
                      <span className="min-w-0 break-words text-slate-700">
                        <span className="text-slate-400">{formatValue(log.beforeData?.[field])}</span>
                        <span className="px-1.5 text-slate-300">→</span>
                        <span className="font-medium text-slate-900">{formatValue(log.afterData?.[field])}</span>
                      </span>
                    </div>
                  ))}
                  {log.changedFields.length > 6 && (
                    <p className="text-xs text-slate-400">+ {log.changedFields.length - 6}개 변경</p>
                  )}
                </div>
              )}

              {(log.ipAddress || log.userAgent) && (
                <div className="mt-3 border-t border-slate-100 pt-2 text-[11px] text-slate-400">
                  {log.ipAddress && <span>IP {log.ipAddress}</span>}
                  {log.userAgent && <span className="ml-2 truncate">{log.userAgent}</span>}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export { actionLabel, targetLabel, fieldLabel, formatDate }
