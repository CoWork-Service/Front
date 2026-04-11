import React, { useState } from 'react'
import { ShieldCheck, Edit2, Check, X, Search, Plus } from 'lucide-react'
import { PageHeader } from '../components/common/PageHeader'
import { DepartmentTag } from '../components/common/DepartmentTag'
import { Modal } from '../components/common/Modal'
import { useToast } from '../components/common/Toast'
import { DEPARTMENTS } from '../types'
import type { Department } from '../types'

type Role = '회장' | '부회장' | '국장' | '부장' | '팀장' | '일반'
type Permission = '관리자' | '편집자' | '뷰어'

const ROLES: Role[] = ['회장', '부회장', '국장', '부장', '팀장', '일반']
const PERMISSIONS: Permission[] = ['관리자', '편집자', '뷰어']

const PERMISSION_COLORS: Record<Permission, string> = {
  관리자: 'bg-red-50 text-red-700 border-red-200',
  편집자: 'bg-blue-50 text-blue-700 border-blue-200',
  뷰어: 'bg-slate-50 text-slate-600 border-slate-200',
}

type Member = {
  id: string
  name: string
  studentId: string
  department: Department
  role: Role
  permission: Permission
  joinedAt: string
}

const initialMembers: Member[] = [
  { id: 'm1', name: '김민준', studentId: '20260001', department: '회장단', role: '회장', permission: '관리자', joinedAt: '2026-03-01' },
  { id: 'm2', name: '이서연', studentId: '20260002', department: '총무부', role: '부장', permission: '관리자', joinedAt: '2026-03-01' },
  { id: 'm3', name: '박지훈', studentId: '20260003', department: '기획국', role: '국장', permission: '편집자', joinedAt: '2026-03-02' },
  { id: 'm4', name: '최예은', studentId: '20260004', department: '홍보국', role: '국장', permission: '편집자', joinedAt: '2026-03-02' },
  { id: 'm5', name: '정다은', studentId: '20260005', department: '복지국', role: '국장', permission: '편집자', joinedAt: '2026-03-03' },
  { id: 'm6', name: '윤성호', studentId: '20260006', department: '대외협력', role: '부장', permission: '편집자', joinedAt: '2026-03-03' },
  { id: 'm7', name: '한지원', studentId: '20260007', department: '기획국', role: '팀장', permission: '편집자', joinedAt: '2026-03-05' },
  { id: 'm8', name: '오승현', studentId: '20260008', department: '홍보국', role: '일반', permission: '뷰어', joinedAt: '2026-03-05' },
  { id: 'm9', name: '임수아', studentId: '20260009', department: '복지국', role: '일반', permission: '뷰어', joinedAt: '2026-03-06' },
  { id: 'm10', name: '강도윤', studentId: '20260010', department: '총무부', role: '팀장', permission: '편집자', joinedAt: '2026-03-06' },
  { id: 'm11', name: '신예림', studentId: '20260011', department: '기획국', role: '일반', permission: '뷰어', joinedAt: '2026-03-07' },
  { id: 'm12', name: '조현우', studentId: '20260012', department: '대외협력', role: '일반', permission: '뷰어', joinedAt: '2026-03-07' },
]

const defaultEditForm = { department: '' as Department | '', role: '' as Role | '', permission: '' as Permission | '' }

export default function OrgPage() {
  const toast = useToast()
  const [members, setMembers] = useState<Member[]>(initialMembers)
  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('')
  const [permFilter, setPermFilter] = useState('')
  const [editTarget, setEditTarget] = useState<Member | null>(null)
  const [editForm, setEditForm] = useState(defaultEditForm)

  const filtered = members.filter((m) => {
    if (search && !m.name.includes(search) && !m.studentId.includes(search)) return false
    if (deptFilter && m.department !== deptFilter) return false
    if (permFilter && m.permission !== permFilter) return false
    return true
  })

  const openEdit = (m: Member) => {
    setEditTarget(m)
    setEditForm({ department: m.department, role: m.role, permission: m.permission })
  }

  const handleSave = () => {
    if (!editTarget) return
    if (!editForm.department || !editForm.role || !editForm.permission) {
      toast.error('모든 항목을 선택해주세요.')
      return
    }
    setMembers((prev) =>
      prev.map((m) =>
        m.id === editTarget.id
          ? { ...m, department: editForm.department as Department, role: editForm.role as Role, permission: editForm.permission as Permission }
          : m
      )
    )
    toast.success(`${editTarget.name}님의 정보가 수정되었습니다.`)
    setEditTarget(null)
  }

  const permSummary = PERMISSIONS.map((p) => ({
    label: p,
    count: members.filter((m) => m.permission === p).length,
  }))

  return (
    <div>
      <PageHeader
        title="조직 관리"
        description="멤버별 부서와 권한을 설정합니다."
      />

      {/* 요약 카드 */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="card p-4">
          <p className="text-xs text-slate-500 mb-1">전체 멤버</p>
          <p className="text-2xl font-bold text-slate-900">{members.length}명</p>
        </div>
        {permSummary.map(({ label, count }) => (
          <div key={label} className="card p-4">
            <p className="text-xs text-slate-500 mb-1">{label}</p>
            <p className="text-2xl font-bold text-slate-900">{count}명</p>
            <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded border ${PERMISSION_COLORS[label as Permission]}`}>{label}</span>
          </div>
        ))}
      </div>

      {/* 필터 */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="이름, 학번 검색"
            className="input pl-8 w-48"
          />
        </div>
        <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className="select-input w-36">
          <option value="">전체 부서</option>
          {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
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

      {/* 테이블 */}
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {['이름', '학번', '부서', '역할', '권한', '가입일', ''].map((h) => (
                <th key={h} className="text-left text-xs font-semibold text-slate-500 px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-400">
                  <ShieldCheck size={28} className="mx-auto mb-2 text-slate-300" />
                  조건에 맞는 멤버가 없습니다.
                </td>
              </tr>
            ) : (
              filtered.map((m) => (
                <tr key={m.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-semibold text-slate-900">{m.name}</td>
                  <td className="px-4 py-3 text-sm text-slate-500 font-mono">{m.studentId}</td>
                  <td className="px-4 py-3"><DepartmentTag department={m.department} /></td>
                  <td className="px-4 py-3 text-sm text-slate-700">{m.role}</td>
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

      {/* 수정 모달 */}
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
                <p className="text-xs text-slate-500">{editTarget.studentId}</p>
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
                {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="label">역할</label>
              <select
                value={editForm.role}
                onChange={(e) => setEditForm({ ...editForm, role: e.target.value as Role })}
                className="select-input"
              >
                <option value="">선택</option>
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
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
                        ? PERMISSION_COLORS[p] + ' ring-2 ring-offset-1 ring-blue-400'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {editForm.permission === p && <Check size={12} />}
                    {p}
                  </button>
                ))}
              </div>
              <div className="mt-3 space-y-1.5 text-xs text-slate-500">
                <p><span className="font-semibold text-red-600">관리자</span> — 모든 기능 접근 및 설정 변경 가능</p>
                <p><span className="font-semibold text-blue-600">편집자</span> — 데이터 등록·수정 가능, 설정 제외</p>
                <p><span className="font-semibold text-slate-600">뷰어</span> — 조회만 가능</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
