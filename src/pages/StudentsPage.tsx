import React, { useState, useMemo } from 'react'
import { Plus, Search, Upload, CheckSquare, Square, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useStudentStore } from '../store/useStudentStore'
import { useCohortStore } from '../store/useCohortStore'
import { PageHeader } from '../components/common/PageHeader'
import { PaymentStatusBadge } from '../components/common/StatusBadge'
import { EmptyState } from '../components/common/EmptyState'
import { Drawer } from '../components/common/Drawer'
import { Modal } from '../components/common/Modal'
import { useToast } from '../components/common/Toast'
import type { Student } from '../types'

export default function StudentsPage() {
  const { currentCohortId } = useCohortStore()
  const { students, updateStudent, bulkSetPayment } = useStudentStore()
  const toast = useToast()

  const [search, setSearch] = useState('')
  const [gradeFilter, setGradeFilter] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [bulkConfirm, setBulkConfirm] = useState<'paid' | 'unpaid' | null>(null)

  const cohortStudents = useMemo(
    () => students.filter((s) => s.cohortId === currentCohortId),
    [students, currentCohortId]
  )

  const filtered = useMemo(() => {
    let list = [...cohortStudents]
    if (search) list = list.filter((s) => s.name.includes(search) || s.studentId.includes(search))
    if (gradeFilter) list = list.filter((s) => String(s.grade) === gradeFilter)
    if (paymentFilter) list = list.filter((s) => s.paymentStatus === paymentFilter)
    return list
  }, [cohortStudents, search, gradeFilter, paymentFilter])

  const paidCount = cohortStudents.filter((s) => s.paymentStatus === 'paid').length
  const unpaidCount = cohortStudents.length - paidCount
  const paymentRate = cohortStudents.length > 0 ? Math.round((paidCount / cohortStudents.length) * 100) : 0

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selected.size === filtered.length) setSelected(new Set())
    else setSelected(new Set(filtered.map((s) => s.id)))
  }

  const handleBulkPayment = (status: 'paid' | 'unpaid') => {
    bulkSetPayment(Array.from(selected), status)
    toast.success(`${selected.size}명 ${status === 'paid' ? '납부' : '미납'} 처리 완료`)
    setSelected(new Set())
    setBulkConfirm(null)
  }

  return (
    <div>
      <PageHeader
        title="학생 관리"
        description="학생 명단과 학생회비 납부 현황을 관리합니다."
        actions={
          <Link to="/students/import" className="btn-primary">
            <Upload size={16} />
            명단 업로드
          </Link>
        }
      />

      {/* 요약 카드 */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="card p-4">
          <p className="text-xs text-slate-500 mb-1">전체 학생</p>
          <p className="text-2xl font-bold text-slate-900">{cohortStudents.length}명</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-slate-500 mb-1">납부 완료</p>
          <p className="text-2xl font-bold text-green-600">{paidCount}명</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-slate-500 mb-1">미납</p>
          <p className="text-2xl font-bold text-red-500">{unpaidCount}명</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-slate-500 mb-1">납부율</p>
          <p className="text-2xl font-bold text-blue-600">{paymentRate}%</p>
          <div className="mt-2 h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${paymentRate}%` }} />
          </div>
        </div>
      </div>

      {/* 필터 & 일괄 액션 */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="이름, 학번 검색" className="input pl-8 w-48" />
        </div>
        <select value={gradeFilter} onChange={(e) => setGradeFilter(e.target.value)} className="select-input w-28">
          <option value="">전체 학년</option>
          {[1, 2, 3, 4].map((g) => <option key={g} value={String(g)}>{g}학년</option>)}
        </select>
        <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)} className="select-input w-28">
          <option value="">납부 전체</option>
          <option value="paid">납부</option>
          <option value="unpaid">미납</option>
        </select>
        {(search || gradeFilter || paymentFilter) && (
          <button onClick={() => { setSearch(''); setGradeFilter(''); setPaymentFilter('') }} className="text-xs text-slate-500 hover:text-slate-700 underline">초기화</button>
        )}
        {selected.size > 0 && (
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm text-slate-600 font-medium">{selected.size}명 선택</span>
            <button onClick={() => setBulkConfirm('paid')} className="btn-primary py-1.5 text-xs">납부 처리</button>
            <button onClick={() => setBulkConfirm('unpaid')} className="btn-secondary py-1.5 text-xs">미납 처리</button>
          </div>
        )}
      </div>

      {cohortStudents.length === 0 ? (
        <EmptyState
          title="아직 업로드된 학생 명단이 없습니다."
          description="CSV 파일로 학생 명단을 업로드하세요."
          action={<Link to="/students/import" className="btn-primary"><Upload size={16} />명단 업로드</Link>}
          icon={<Users size={28} />}
        />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 w-10">
                  <button onClick={toggleSelectAll} className="text-slate-400 hover:text-slate-700">
                    {selected.size === filtered.length && filtered.length > 0 ? <CheckSquare size={15} className="text-blue-600" /> : <Square size={15} />}
                  </button>
                </th>
                {['학번', '이름', '학부/전공', '학년', '납부 여부', '납부일', '비고'].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-slate-500 px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr
                  key={s.id}
                  className={`border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors ${selected.has(s.id) ? 'bg-blue-50' : ''}`}
                >
                  <td className="px-4 py-3" onClick={(e) => { e.stopPropagation(); toggleSelect(s.id) }}>
                    {selected.has(s.id) ? <CheckSquare size={15} className="text-blue-600" /> : <Square size={15} className="text-slate-400" />}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600 font-mono" onClick={() => setSelectedStudent(s)}>{s.studentId}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-slate-900" onClick={() => setSelectedStudent(s)}>{s.name}</td>
                  <td className="px-4 py-3 text-sm text-slate-600" onClick={() => setSelectedStudent(s)}>{s.department}</td>
                  <td className="px-4 py-3 text-sm text-slate-600" onClick={() => setSelectedStudent(s)}>{s.grade}학년</td>
                  <td className="px-4 py-3" onClick={() => setSelectedStudent(s)}><PaymentStatusBadge status={s.paymentStatus} /></td>
                  <td className="px-4 py-3 text-xs text-slate-500" onClick={() => setSelectedStudent(s)}>{s.paidAt ?? '-'}</td>
                  <td className="px-4 py-3 text-xs text-slate-500" onClick={() => setSelectedStudent(s)}>{s.note ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-12 text-center text-sm text-slate-500">검색 결과가 없습니다.</div>
          )}
        </div>
      )}

      {/* 학생 상세 Drawer */}
      <Drawer open={!!selectedStudent} onClose={() => setSelectedStudent(null)} title="학생 정보">
        {selectedStudent && (
          <div className="space-y-4">
            <div className="card p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                  {selectedStudent.name[0]}
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-base">{selectedStudent.name}</p>
                  <p className="text-sm text-slate-500 font-mono">{selectedStudent.studentId}</p>
                </div>
                <div className="ml-auto"><PaymentStatusBadge status={selectedStudent.paymentStatus} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-xs text-slate-500">학부/전공</p><p className="font-medium">{selectedStudent.department}</p></div>
                <div><p className="text-xs text-slate-500">학년</p><p className="font-medium">{selectedStudent.grade}학년</p></div>
                <div><p className="text-xs text-slate-500">납부일</p><p className="font-medium">{selectedStudent.paidAt ?? '-'}</p></div>
                <div><p className="text-xs text-slate-500">비고</p><p className="font-medium">{selectedStudent.note ?? '-'}</p></div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { updateStudent(selectedStudent.id, { paymentStatus: 'paid', paidAt: new Date().toISOString().slice(0, 10) }); toast.success('납부 처리 완료'); setSelectedStudent(null) }}
                className="btn-primary flex-1 justify-center"
              >납부 처리</button>
              <button
                onClick={() => { updateStudent(selectedStudent.id, { paymentStatus: 'unpaid', paidAt: undefined }); toast.success('미납 처리 완료'); setSelectedStudent(null) }}
                className="btn-secondary flex-1 justify-center"
              >미납 처리</button>
            </div>
          </div>
        )}
      </Drawer>

      {/* 일괄 처리 확인 */}
      <Modal open={!!bulkConfirm} onClose={() => setBulkConfirm(null)} title="일괄 처리" size="sm"
        footer={<><button onClick={() => setBulkConfirm(null)} className="btn-secondary">취소</button><button onClick={() => bulkConfirm && handleBulkPayment(bulkConfirm)} className="btn-primary">확인</button></>}
      >
        <p className="text-sm text-slate-600">선택한 <strong>{selected.size}명</strong>을 <strong>{bulkConfirm === 'paid' ? '납부' : '미납'}</strong> 처리하시겠습니까?</p>
      </Modal>
    </div>
  )
}
