import React, { useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { CheckCircle, AlertCircle } from 'lucide-react'
import { useSurveyStore } from '../store/useSurveyStore'
import { useToast } from '../components/common/Toast'

export default function SurveyRespondPage() {
  const { surveyId } = useParams<{ surveyId: string }>()
  const { surveys, addResponse, loadSurveyDetail } = useSurveyStore()
  const toast = useToast()

  const survey = surveys.find((s) => s.id === surveyId)
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({})
  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loadError, setLoadError] = useState('')
  const requestedSurveyId = useRef<string | null>(null)

  useEffect(() => {
    if (!surveyId || survey || requestedSurveyId.current === surveyId) return
    requestedSurveyId.current = surveyId
    void loadSurveyDetail(surveyId)
      .catch((error) => {
        const message = error instanceof Error ? error.message : '설문을 불러오지 못했습니다.'
        setLoadError(message)
        toast.error(message)
      })
  }, [loadSurveyDetail, survey, surveyId, toast])

  const isLoading = Boolean(surveyId && !survey && !loadError)
  if (isLoading) return <div className="p-8 text-slate-500">설문을 불러오는 중입니다.</div>
  if (loadError) return <div className="p-8 text-slate-500">{loadError}</div>
  if (!survey) return <div className="p-8 text-slate-500">설문을 찾을 수 없습니다.</div>

  if (survey.status === 'closed') {
    return (
      <div className="max-w-xl mx-auto py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
          <AlertCircle size={32} className="text-slate-400" />
        </div>
        <h2 className="text-lg font-bold text-slate-800 mb-2">마감된 설문입니다</h2>
        <p className="text-sm text-slate-500 mb-6">이 설문은 더 이상 응답을 받지 않습니다.</p>
        <Link to="/surveys" className="btn-secondary">설문 목록으로</Link>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={32} className="text-green-600" />
        </div>
        <h2 className="text-lg font-bold text-slate-800 mb-2">응답이 제출되었습니다!</h2>
        <p className="text-sm text-slate-500 mb-6">소중한 응답 감사합니다.</p>
        <Link to="/surveys" className="btn-secondary">설문 목록으로</Link>
      </div>
    )
  }

  const setAnswer = (questionId: string, value: string | string[]) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
    setErrors((prev) => { const e = { ...prev }; delete e[questionId]; return e })
  }

  const toggleCheckbox = (questionId: string, value: string) => {
    const current = (answers[questionId] as string[]) ?? []
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value]
    setAnswer(questionId, next)
  }

  const handleSubmit = async () => {
    const newErrors: Record<string, string> = {}
    for (const q of survey.questions) {
      if (!q.required) continue
      const ans = answers[q.id]
      if (!ans || (Array.isArray(ans) && ans.length === 0) || ans === '') {
        newErrors[q.id] = '필수 문항입니다.'
      }
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      toast.error('필수 문항을 모두 작성해주세요.')
      return
    }
    try {
      await addResponse(survey.id, {
        respondedAt: new Date().toISOString(),
        answers,
      })
      setSubmitted(true)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '응답 제출에 실패했습니다.')
    }
  }

  return (
    <div className="max-w-xl mx-auto py-8">
      {/* 설문 헤더 */}
      <div className="card p-6 mb-6">
        <h1 className="text-xl font-bold text-slate-900 mb-2">{survey.title}</h1>
        {survey.description && (
          <p className="text-sm text-slate-600">{survey.description}</p>
        )}
        <p className="text-xs text-slate-400 mt-3">* 표시된 항목은 필수 입력입니다.</p>
      </div>

      {/* 문항 리스트 */}
      <div className="space-y-4 mb-6">
        {survey.questions.map((q, i) => (
          <div key={q.id} className="card p-5">
            <p className="text-sm font-semibold text-slate-900 mb-3">
              {i + 1}. {q.title}
              {q.required && <span className="text-red-500 ml-1">*</span>}
            </p>
            {errors[q.id] && (
              <p className="text-xs text-red-500 mb-2">{errors[q.id]}</p>
            )}
            {q.type === 'short_text' && (
              <input
                type="text"
                value={(answers[q.id] as string) ?? ''}
                onChange={(e) => setAnswer(q.id, e.target.value)}
                placeholder="답변을 입력하세요."
                className={`input ${errors[q.id] ? 'border-red-400' : ''}`}
              />
            )}
            {q.type === 'long_text' && (
              <textarea
                rows={4}
                value={(answers[q.id] as string) ?? ''}
                onChange={(e) => setAnswer(q.id, e.target.value)}
                placeholder="답변을 입력하세요."
                className={`textarea ${errors[q.id] ? 'border-red-400' : ''}`}
              />
            )}
            {q.type === 'multiple_choice' && (
              <div className="space-y-2">
                {(q.options ?? []).map((opt) => (
                  <label key={opt.id} className="flex items-center gap-2.5 cursor-pointer group">
                    <input
                      type="radio"
                      name={q.id}
                      value={opt.id}
                      checked={answers[q.id] === opt.id}
                      onChange={() => setAnswer(q.id, opt.id)}
                      className="accent-blue-600"
                    />
                    <span className="text-sm text-slate-700 group-hover:text-slate-900">{opt.text}</span>
                  </label>
                ))}
              </div>
            )}
            {q.type === 'checkbox' && (
              <div className="space-y-2">
                {(q.options ?? []).map((opt) => (
                  <label key={opt.id} className="flex items-center gap-2.5 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={((answers[q.id] as string[]) ?? []).includes(opt.id)}
                      onChange={() => toggleCheckbox(q.id, opt.id)}
                      className="accent-blue-600"
                    />
                    <span className="text-sm text-slate-700 group-hover:text-slate-900">{opt.text}</span>
                  </label>
                ))}
              </div>
            )}
            {q.type === 'dropdown' && (
              <select
                value={(answers[q.id] as string) ?? ''}
                onChange={(e) => setAnswer(q.id, e.target.value)}
                className={`select-input ${errors[q.id] ? 'border-red-400' : ''}`}
              >
                <option value="">선택하세요</option>
                {(q.options ?? []).map((opt) => (
                  <option key={opt.id} value={opt.id}>{opt.text}</option>
                ))}
              </select>
            )}
          </div>
        ))}
      </div>

      <button onClick={handleSubmit} className="btn-primary w-full justify-center py-3 text-base">
        제출하기
      </button>
    </div>
  )
}
