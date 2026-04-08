import React from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Users, BarChart2 } from 'lucide-react'
import { useSurveyStore } from '../store/useSurveyStore'
import { SurveyStatusBadge } from '../components/common/StatusBadge'

export default function SurveyResultsPage() {
  const { surveyId } = useParams<{ surveyId: string }>()
  const { surveys } = useSurveyStore()
  const survey = surveys.find((s) => s.id === surveyId)

  if (!survey) return <div className="p-8 text-slate-500">설문을 찾을 수 없습니다.</div>

  const totalResponses = survey.responses.length

  const getQuestionStats = (questionId: string, type: string) => {
    if (type === 'multiple_choice' || type === 'checkbox' || type === 'dropdown') {
      const counts: Record<string, number> = {}
      survey.responses.forEach((r) => {
        const ans = r.answers[questionId]
        if (Array.isArray(ans)) ans.forEach((a) => { counts[a] = (counts[a] ?? 0) + 1 })
        else if (ans) counts[ans as string] = (counts[ans as string] ?? 0) + 1
      })
      return counts
    }
    return {}
  }

  const getTextAnswers = (questionId: string) => {
    return survey.responses
      .map((r) => r.answers[questionId] as string)
      .filter((a) => a && a.trim())
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Link to="/surveys" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600 mb-5">
        <ArrowLeft size={15} />설문 목록
      </Link>

      {/* 요약 카드 */}
      <div className="card p-5 mb-6">
        <div className="flex items-start justify-between mb-2">
          <h1 className="text-xl font-bold text-slate-900">{survey.title}</h1>
          <SurveyStatusBadge status={survey.status} />
        </div>
        {survey.description && <p className="text-sm text-slate-600 mb-3">{survey.description}</p>}
        <div className="flex items-center gap-6 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-blue-500" />
            <div>
              <p className="text-xs text-slate-500">총 응답</p>
              <p className="text-2xl font-bold text-slate-900">{totalResponses}명</p>
            </div>
          </div>
          <div>
            <p className="text-xs text-slate-500">마지막 응답</p>
            <p className="text-sm font-medium text-slate-700">
              {survey.responses.length > 0
                ? survey.responses[survey.responses.length - 1].respondedAt.slice(0, 10)
                : '-'}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">문항 수</p>
            <p className="text-sm font-medium text-slate-700">{survey.questions.length}개</p>
          </div>
        </div>
      </div>

      {totalResponses === 0 ? (
        <div className="card p-10 text-center">
          <BarChart2 size={32} className="text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">아직 응답이 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {survey.questions.map((q, i) => {
            const isChoice = ['multiple_choice', 'checkbox', 'dropdown'].includes(q.type)
            const stats = isChoice ? getQuestionStats(q.id, q.type) : {}
            const textAnswers = !isChoice ? getTextAnswers(q.id) : []
            const maxCount = isChoice ? Math.max(...Object.values(stats), 1) : 1

            return (
              <div key={q.id} className="card p-5">
                <p className="text-sm font-semibold text-slate-700 mb-4">
                  {i + 1}. {q.title}
                  <span className="ml-2 text-xs text-slate-400 font-normal">
                    {q.type === 'short_text' ? '단답형' :
                     q.type === 'long_text' ? '장문형' :
                     q.type === 'multiple_choice' ? '객관식' :
                     q.type === 'checkbox' ? '체크박스' : '드롭다운'}
                  </span>
                </p>

                {isChoice && q.options && (
                  <div className="space-y-2">
                    {q.options.map((opt) => {
                      const count = stats[opt.text] ?? 0
                      const pct = totalResponses > 0 ? Math.round((count / totalResponses) * 100) : 0
                      return (
                        <div key={opt.id}>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-slate-700">{opt.text}</span>
                            <span className="text-slate-500">{count}명 ({pct}%)</span>
                          </div>
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {!isChoice && textAnswers.length === 0 && (
                  <p className="text-xs text-slate-400">응답 없음</p>
                )}

                {!isChoice && textAnswers.length > 0 && (
                  <div className="space-y-2">
                    {textAnswers.map((ans, idx) => (
                      <div key={idx} className="text-sm text-slate-700 p-3 bg-slate-50 rounded-xl border border-slate-100">
                        {ans}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
