import React, { useEffect, useMemo, useState } from 'react'
import { Filter, RefreshCw } from 'lucide-react'
import { PageHeader } from '../components/common/PageHeader'
import { AuditLogTimeline, actionLabel, targetLabel } from '../components/common/AuditLogTimeline'
import { fetchAuditLogs } from '../lib/backendApi'
import type { AuditAction, AuditLog, AuditTargetType } from '../types'

const targetOptions: AuditTargetType[] = ['EXPENSE', 'EVENT', 'FILE', 'ASSET', 'STUDENT', 'ORGANIZATION', 'COHORT', 'ORG_MEMBER']
const actionOptions: AuditAction[] = ['CREATE', 'UPDATE', 'DELETE', 'UPLOAD', 'MATCH', 'APPROVE', 'REJECT']

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [targetType, setTargetType] = useState<AuditTargetType | ''>('')
  const [action, setAction] = useState<AuditAction | ''>('')
  const [actorId, setActorId] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const query = useMemo(() => ({
    targetType: targetType || undefined,
    action: action || undefined,
    actorId: actorId.trim() || undefined,
    dateFrom: dateFrom ? `${dateFrom}T00:00:00` : undefined,
    dateTo: dateTo ? `${dateTo}T23:59:59` : undefined,
    limit: 150,
  }), [targetType, action, actorId, dateFrom, dateTo])

  const loadLogs = async () => {
    setIsLoading(true)
    try {
      setLogs(await fetchAuditLogs(query))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadLogs()
  }, [query])

  const clearFilters = () => {
    setTargetType('')
    setAction('')
    setActorId('')
    setDateFrom('')
    setDateTo('')
  }

  return (
    <div>
      <PageHeader
        title="수정 이력"
        description="주요 데이터의 생성, 수정, 삭제, 업로드, 매칭 기록을 확인합니다."
        actions={
          <button onClick={loadLogs} className="btn-secondary">
            <RefreshCw size={16} />
            새로고침
          </button>
        }
      />

      <div className="card p-4 mb-5">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Filter size={15} className="text-slate-400" />
          필터
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <select value={targetType} onChange={(e) => setTargetType(e.target.value as AuditTargetType | '')} className="select-input">
            <option value="">전체 기능</option>
            {targetOptions.map((target) => <option key={target} value={target}>{targetLabel[target]}</option>)}
          </select>
          <select value={action} onChange={(e) => setAction(e.target.value as AuditAction | '')} className="select-input">
            <option value="">전체 작업</option>
            {actionOptions.map((item) => <option key={item} value={item}>{actionLabel[item]}</option>)}
          </select>
          <input value={actorId} onChange={(e) => setActorId(e.target.value)} placeholder="사용자 ID" className="input" />
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="input" />
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="input" />
          <button onClick={clearFilters} className="btn-secondary justify-center">초기화</button>
        </div>
      </div>

      <AuditLogTimeline logs={logs} isLoading={isLoading} />
    </div>
  )
}
