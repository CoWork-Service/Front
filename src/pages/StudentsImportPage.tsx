import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Upload, ChevronRight, AlertCircle, CheckCircle } from 'lucide-react'
import { useStudentStore } from '../store/useStudentStore'
import { useCohortStore } from '../store/useCohortStore'
import { FileUploadDropzone } from '../components/common/FileUploadDropzone'
import { useToast } from '../components/common/Toast'
import type { Student } from '../types'

const REQUIRED_FIELDS = ['학번', '이름', '학부/전공', '학년']

// 더미 CSV 파싱 결과 시뮬레이션
const dummyPreview: Omit<Student, 'id'>[] = [
  { cohortId: 'import', studentId: '20261101', name: '김신입', department: 'AI소프트웨어학부', grade: 1, paymentStatus: 'unpaid' },
  { cohortId: 'import', studentId: '20261102', name: '이새내기', department: '소프트웨어학부', grade: 1, paymentStatus: 'unpaid' },
  { cohortId: 'import', studentId: '20261103', name: '박입학', department: 'AI융합학부', grade: 1, paymentStatus: 'unpaid' },
  { cohortId: 'import', studentId: '20261104', name: '최등록', department: 'AI소프트웨어학부', grade: 2, paymentStatus: 'unpaid' },
  { cohortId: 'import', studentId: '20261105', name: '정대학', department: '소프트웨어학부', grade: 1, paymentStatus: 'unpaid' },
]

const csvColumns = ['학번', '이름', '학부/전공', '학년', '이메일', '전화번호']

export default function StudentsImportPage() {
  const navigate = useNavigate()
  const { currentCohortId } = useCohortStore()
  const { addStudents } = useStudentStore()
  const toast = useToast()

  const [step, setStep] = useState(1)
  const [fileUploaded, setFileUploaded] = useState(false)
  const [mapping, setMapping] = useState<Record<string, string>>({
    '학번': '학번', '이름': '이름', '학부/전공': '학부/전공', '학년': '학년',
  })
  const [warnings, setWarnings] = useState<string[]>([])

  const handleFileUpload = (files: File[]) => {
    if (files.length > 0) {
      setFileUploaded(true)
      // 중복 학번 경고 시뮬레이션
      setWarnings(['20261102 학번이 기존 명단과 중복될 수 있습니다.'])
    }
  }

  const handleImport = () => {
    const students = dummyPreview.map((s) => ({ ...s, cohortId: currentCohortId }))
    addStudents(students)
    toast.success(`${students.length}명의 학생 명단이 업로드되었습니다.`)
    setStep(4)
  }

  const steps = ['파일 업로드', '컬럼 매핑', '미리보기', '완료']

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <Link to="/students" className="hover:text-blue-600">학생 관리</Link>
        <ChevronRight size={14} />
        <span className="text-slate-900 font-medium">명단 업로드</span>
      </div>

      <h1 className="text-2xl font-bold text-slate-900 mb-6">학생 명단 업로드</h1>

      {/* 스텝 인디케이터 */}
      <div className="flex items-center gap-0 mb-8">
        {steps.map((s, i) => (
          <React.Fragment key={i}>
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                step > i + 1 ? 'bg-green-500 text-white' :
                step === i + 1 ? 'bg-blue-600 text-white' :
                'bg-slate-200 text-slate-500'
              }`}>
                {step > i + 1 ? '✓' : i + 1}
              </div>
              <span className={`text-sm ${step === i + 1 ? 'font-semibold text-slate-900' : 'text-slate-500'}`}>{s}</span>
            </div>
            {i < steps.length - 1 && <div className={`flex-1 h-0.5 mx-3 ${step > i + 1 ? 'bg-green-400' : 'bg-slate-200'}`} />}
          </React.Fragment>
        ))}
      </div>

      <div className="card p-6">
        {/* Step 1: 파일 업로드 */}
        {step === 1 && (
          <div>
            <h2 className="text-base font-semibold text-slate-800 mb-1">CSV 파일을 업로드하세요</h2>
            <p className="text-sm text-slate-500 mb-4">
              필수 컬럼: <strong>{REQUIRED_FIELDS.join(', ')}</strong>
            </p>
            <FileUploadDropzone
              accept=".csv"
              label="CSV 파일을 드래그하거나 클릭하여 업로드"
              hint=".csv 형식만 지원합니다."
              onFiles={handleFileUpload}
            />
            {warnings.length > 0 && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2">
                <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                  {warnings.map((w, i) => <p key={i} className="text-xs text-amber-700">{w}</p>)}
                </div>
              </div>
            )}
            <div className="flex justify-end mt-6">
              <button onClick={() => fileUploaded && setStep(2)} disabled={!fileUploaded} className={`btn-primary ${!fileUploaded ? 'opacity-50 cursor-not-allowed' : ''}`}>
                다음 단계
              </button>
            </div>
          </div>
        )}

        {/* Step 2: 컬럼 매핑 */}
        {step === 2 && (
          <div>
            <h2 className="text-base font-semibold text-slate-800 mb-4">컬럼 매핑을 확인해주세요</h2>
            <table className="w-full mb-6">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left text-xs font-semibold text-slate-500 px-4 py-2.5">CSV 컬럼</th>
                  <th className="text-left text-xs font-semibold text-slate-500 px-4 py-2.5">샘플 값</th>
                  <th className="text-left text-xs font-semibold text-slate-500 px-4 py-2.5">시스템 필드</th>
                </tr>
              </thead>
              <tbody>
                {csvColumns.map((col) => (
                  <tr key={col} className="border-b border-slate-100">
                    <td className="px-4 py-2.5 text-sm text-slate-800 font-mono">{col}</td>
                    <td className="px-4 py-2.5 text-xs text-slate-500">
                      {col === '학번' ? '20261101' : col === '이름' ? '김신입' : col === '학년' ? '1' : col === '학부/전공' ? 'AI소프트웨어학부' : '-'}
                    </td>
                    <td className="px-4 py-2.5">
                      <select
                        value={mapping[col] ?? ''}
                        onChange={(e) => setMapping({ ...mapping, [col]: e.target.value })}
                        className="select-input text-xs w-36"
                      >
                        <option value="">매핑 없음</option>
                        {REQUIRED_FIELDS.concat(['비고']).map((f) => (
                          <option key={f} value={f}>{f} {REQUIRED_FIELDS.includes(f) ? '*' : ''}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex items-center justify-between">
              <button onClick={() => setStep(1)} className="btn-secondary">이전</button>
              <button onClick={() => setStep(3)} className="btn-primary">다음 단계</button>
            </div>
          </div>
        )}

        {/* Step 3: 미리보기 */}
        {step === 3 && (
          <div>
            <h2 className="text-base font-semibold text-slate-800 mb-4">업로드 미리보기</h2>
            <p className="text-sm text-slate-500 mb-3">{dummyPreview.length}명의 학생 데이터를 확인하세요.</p>
            <div className="overflow-x-auto mb-6">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    {['학번', '이름', '학부/전공', '학년'].map((h) => (
                      <th key={h} className="text-left text-xs font-semibold text-slate-500 px-4 py-2.5">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dummyPreview.map((s, i) => (
                    <tr key={i} className="border-b border-slate-100">
                      <td className="px-4 py-2.5 text-sm font-mono text-slate-700">{s.studentId}</td>
                      <td className="px-4 py-2.5 text-sm font-medium text-slate-900">{s.name}</td>
                      <td className="px-4 py-2.5 text-sm text-slate-600">{s.department}</td>
                      <td className="px-4 py-2.5 text-sm text-slate-600">{s.grade}학년</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between">
              <button onClick={() => setStep(2)} className="btn-secondary">이전</button>
              <button onClick={handleImport} className="btn-primary">업로드 완료</button>
            </div>
          </div>
        )}

        {/* Step 4: 완료 */}
        {step === 4 && (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-green-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-2">업로드 완료!</h2>
            <p className="text-sm text-slate-500 mb-6">{dummyPreview.length}명의 학생 명단이 성공적으로 등록되었습니다.</p>
            <Link to="/students" className="btn-primary">학생 명단 확인하기</Link>
          </div>
        )}
      </div>
    </div>
  )
}
