import React, { useEffect, useMemo, useRef, useState } from 'react'
import { ShieldCheck, Edit2, Check, Search, KeyRound, Copy, RefreshCw } from 'lucide-react'
import { PageHeader } from '../components/common/PageHeader'
import { DepartmentTag } from '../components/common/DepartmentTag'
import { Modal } from '../components/common/Modal'
import { useToast } from '../components/common/Toast'
import { apiRequest, buildApiPath } from '../lib/api'
import { mergeDepartmentOptions } from '../lib/departments'
import { useCohortStore } from '../store/useCohortStore'
import { useDepartmentStore } from '../store/useDepartmentStore'
import type { Department } from '../types'

type ApiMemberRole = 'ADMIN' | 'EDITOR' | 'VIEWER'
type Permission = '관리자' | '편집자' | '뷰어'

const PERMISSIONS: Permission[] = ['관리자', '편집자', '뷰어']

const PERMISSION_COLORS: Record<Permission, string> = {
  관리자: 'bg-red-50 text-red-700 border-red-200',
  편집자: 'bg-blue-50 text-blue-700 border-blue-200',
  뷰어: 'bg-slate-50 text-slate-600 border-slate-200',
}

type ApiMember = {
  id: number | string
  userId: number | string
  name: string
  email?: string | null
  studentId?: string | null
  role: ApiMemberRole
  department?: Department | null
  joinedAt?: string | null
}

type InviteResponse = {
  inviteCode: string
}

type Member = {
  id: string
  userId: string
  name: string
  studentId: string
  department: Department
  permission: Permission
  joinedAt: string
}

const defaultEditForm = { department: '' as Department | '', permission: '' as Permission | '' }

export default function OrgPage() {
  const toast = useToast()
  const currentCohortId = useCohortStore((state) => state.currentCohortId)
  const departments = useDepartmentStore((state) => state.departments)
  const requestedCohortId = useRef<string | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('')
  const [permFilter, setPermFilter] = useState('')
  const [editTarget, setEditTarget] = useState<Member | null>(null)
  const [editForm, setEditForm] = useState(defaultEditForm)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteCode, setInviteCode] = useState('')
  const [isGeneratingInvite, setIsGeneratingInvite] = useState(false)

  useEffect(() => {
    if (!currentCohortId || requestedCohortId.current === currentCohortId) return
    requestedCohortId.current = currentCohortId
    void apiRequest<ApiMember[]>(buildApiPath('/api/org/members', { cohortId: currentCohortId }))
      .then((nextMembers) => setMembers(nextMembers.map(toMember)))
      .catch((error) => {
        toast.error(error instanceof Error ? error.message : '조직 멤버를 불러오지 못했습니다.')
      })
  }, [currentCohortId, toast])

  const filtered = useMemo(() => members.filter((m) => {
    const searchTarget = `${m.name} ${m.studentId}`
    if (search && !searchTarget.includes(search)) return false
    if (deptFilter && m.department !== deptFilter) return false
    if (permFilter && m.permission !== permFilter) return false
    return true
  }), [deptFilter, members, permFilter, search])

  const permSummary = useMemo(() => PERMISSIONS.map((p) => ({
    label: p,
    count: members.filter((m) => m.permission === p).length,
  })), [members])
  const departmentOptions = useMemo(
    () => mergeDepartmentOptions(departments, [
      ...members.map((member) => member.department),
      editForm.department,
      deptFilter,
    ]),
    [departments, members, editForm.department, deptFilter]
  )

  const openEdit = (m: Member) => {
    setEditTarget(m)
    setEditForm({ department: m.department, permission: m.permission })
  }

  const handleSave = async () => {
    if (!editTarget) return
    if (!editForm.department || !editForm.permission) {
      toast.error('부서와 권한을 선택해주세요.')
      return
    }

    try {
      const updated = await apiRequest<ApiMember>(`/api/org/members/${editTarget.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          role: permissionToApiRole(editForm.permission),
          department: editForm.department === '전체' ? null : editForm.department,
        }),
      })
      const nextMember = toMember(updated)
      setMembers((prev) => prev.map((m) => (m.id === nextMember.id ? nextMember : m)))
      toast.success(`${editTarget.name}님의 정보가 수정되었습니다.`)
      setEditTarget(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '멤버 정보 수정에 실패했습니다.')
    }
  }

  const handleGenerateInvite = async () => {
    setIsGeneratingInvite(true)
    try {
      const response = await apiRequest<InviteResponse>('/api/org/invite', { method: 'POST' })
      setInviteCode(response.inviteCode)
      toast.success('초대코드가 발급되었습니다.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '초대코드 발급에 실패했습니다.')
    } finally {
      setIsGeneratingInvite(false)
    }
  }

  const handleCopyInvite = async () => {
    if (!inviteCode) return
    try {
      await navigator.clipboard.writeText(buildInviteShareText(inviteCode))
      toast.success('초대 문구가 복사되었습니다.')
    } catch {
      toast.error('초대 문구를 복사하지 못했습니다.')
    }
  }

  return (
    <div>
      <PageHeader
        title="조직 관리"
        description="멤버별 부서와 권한을 설정합니다."
        actions={
          <button onClick={() => setInviteOpen(true)} className="btn-secondary">
            <KeyRound size={16} />
            초대코드
          </button>
        }
      />

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="card p-4">
          <p className="text-xs text-slate-500 mb-1">전체 멤버</p>
          <p className="text-2xl font-bold text-slate-900">{members.length}명</p>
        </div>
        {permSummary.map(({ label, count }) => (
          <div key={label} className="card p-4">
            <p className="text-xs text-slate-500 mb-1">{label}</p>
            <p className="text-2xl font-bold text-slate-900">{count}명</p>
            <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded border ${PERMISSION_COLORS[label]}`}>{label}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="이름, 학번 검색"
            className="input pl-8 w-56"
          />
        </div>
        <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className="select-input w-36">
          <option value="">전체 부서</option>
          {departmentOptions.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={permFilter} onChange={(e) => setPermFilter(e.target.value)} className="select-input w-32">
          <option value="">전체 권한</option>
          {PERMISSIONS.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        {(search || deptFilter || permFilter) && (
          <button
            onClick={() => { setSearch(''); setDeptFilter(''); setPermFilter('') }}
            className="text-xs text-slate-500 hover:text-slate-700 underline"
          >
            초기화
          </button>
        )}
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {['이름', '학번', '부서', '권한', '가입일', ''].map((h) => (
                <th key={h} className="text-left text-xs font-semibold text-slate-500 px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-400">
                  <ShieldCheck size={28} className="mx-auto mb-2 text-slate-300" />
                  조건에 맞는 멤버가 없습니다.
                </td>
              </tr>
            ) : (
              filtered.map((m) => (
                <tr key={m.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-semibold text-slate-900">{m.name}</td>
                  <td className="px-4 py-3 text-sm text-slate-500 font-mono">{m.studentId || '-'}</td>
                  <td className="px-4 py-3"><DepartmentTag department={m.department} /></td>
                  <td className="px-4 py-3">
                    <span className={`inline-block text-xs px-2 py-0.5 rounded border font-medium ${PERMISSION_COLORS[m.permission]}`}>
                      {m.permission}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">{m.joinedAt}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => openEdit(m)}
                      className="p-1 rounded text-slate-400 hover:text-slate-700 transition-colors"
                    >
                      <Edit2 size={13} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title="초대코드 발급"
        size="sm"
        footer={
          <>
            <button onClick={() => setInviteOpen(false)} className="btn-secondary">닫기</button>
            {inviteCode && (
              <button onClick={handleCopyInvite} className="btn-secondary">
                <Copy size={14} />
                공유 문구 복사
              </button>
            )}
            <button onClick={handleGenerateInvite} className="btn-primary" disabled={isGeneratingInvite}>
              <RefreshCw size={14} className={isGeneratingInvite ? 'animate-spin' : ''} />
              {inviteCode ? '재발급' : '발급'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            학생회를 만든 뒤 이 초대코드를 공유하세요. 초대코드로 가입한 학생은 승인 없이 바로 들어옵니다.
            재발급하면 이전 코드는 무효화됩니다.
          </p>
          <div>
            <label className="label">현재 발급된 초대코드</label>
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <span className="font-mono text-lg font-semibold text-slate-900">
                {inviteCode || '발급 전'}
              </span>
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        title="멤버 권한/부서 수정"
        size="sm"
        footer={
          <>
            <button onClick={() => setEditTarget(null)} className="btn-secondary">취소</button>
            <button onClick={handleSave} className="btn-primary">저장</button>
          </>
        }
      >
        {editTarget && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg mb-4">
              <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
                {editTarget.name[0]}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{editTarget.name}</p>
                <p className="text-xs text-slate-500">{editTarget.studentId || '-'}</p>
              </div>
            </div>
            <div>
              <label className="label">부서</label>
              <select
                value={editForm.department}
                onChange={(e) => setEditForm({ ...editForm, department: e.target.value as Department })}
                className="select-input"
              >
                <option value="">선택</option>
                {departmentOptions.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="label">권한</label>
              <div className="grid grid-cols-3 gap-2 mt-1">
                {PERMISSIONS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setEditForm({ ...editForm, permission: p })}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                      editForm.permission === p
                        ? `${PERMISSION_COLORS[p]} ring-2 ring-offset-1 ring-blue-400`
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {editForm.permission === p && <Check size={12} />}
                    {p}
                  </button>
                ))}
              </div>
              <div className="mt-3 space-y-1.5 text-xs text-slate-500">
                <p><span className="font-semibold text-red-600">관리자</span> - 멤버 승인과 조직 설정 가능</p>
                <p><span className="font-semibold text-blue-600">편집자</span> - 데이터 등록 및 수정 가능</p>
                <p><span className="font-semibold text-slate-600">뷰어</span> - 조회만 가능</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

function buildInviteShareText(inviteCode: string) {
  const origin = window.location.origin || 'https://cowork.kro.kr'
  return [
    'CoWork 학생회 초대코드입니다.',
    '아래 링크에서 숭실대 SSO로 로그인한 뒤 초대코드를 입력하면 바로 가입됩니다.',
    '',
    `링크: ${origin}/login`,
    `초대코드: ${inviteCode}`,
  ].join('\n')
}

function toMember(member: ApiMember): Member {
  return {
    id: String(member.id),
    userId: String(member.userId),
    name: member.name,
    studentId: member.studentId ?? '',
    department: member.department ?? '기타',
    permission: apiRoleToPermission(member.role),
    joinedAt: member.joinedAt?.slice(0, 10) ?? '-',
  }
}

function apiRoleToPermission(role?: string): Permission {
  if (role === 'ADMIN') return '관리자'
  if (role === 'VIEWER') return '뷰어'
  return '편집자'
}

function permissionToApiRole(permission: Permission): ApiMemberRole {
  if (permission === '관리자') return 'ADMIN'
  if (permission === '뷰어') return 'VIEWER'
  return 'EDITOR'
}
