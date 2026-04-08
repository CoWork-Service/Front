import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Plus, Trash2, ChevronUp, ChevronDown, GripVertical, Save } from 'lucide-react'
import { useSurveyStore } from '../store/useSurveyStore'
import { useCohortStore } from '../store/useCohortStore'
import { PageHeader } from '../components/common/PageHeader'
import { useToast } from '../components/common/Toast'
import type { Question, QuestionType, QuestionOption } from '../types'

const TYPE_LABELS: Record<QuestionType, string> = {
  short_text: '단답형',
  long_text: '장문형',
  multiple_choice: '객관식',
  checkbox: '체크박스',
  dropdown: '드롭다운',
}

interface QuestionCardProps {
  question: Question
  index: number
  total: number
  onChange: (id: string, data: Partial<Question>) => void
  onDelete: (id: string) => void
  onMoveUp: (id: string) => void
  onMoveDown: (id: string) => void
}

function QuestionCard({ question, index, total, onChange, onDelete, onMoveUp, onMoveDown }: QuestionCardProps) {
  const hasOptions = ['multiple_choice', 'checkbox', 'dropdown'].includes(question.type)

  const addOption = () => {
    const newOption: QuestionOption = { id: `opt-${Date.now()}`, text: '' }
    onChange(question.id, { options: [...(question.options ?? []), newOption] })
  }

  const updateOption = (optId: string, text: string) => {
    onChange(question.id, {
      options: question.options?.map((o) => o.id === optId ? { ...o, text } : o),
    })
  }

  const removeOption = (optId: string) => {
    onChange(question.id, { options: question.options?.filter((o) => o.id !== optId) })
  }

  return (
    <div className="card p-4 mb-3">
      <div className="flex items-start gap-3">
        <div className="flex flex-col items-center gap-1 pt-1 text-slate-400">
          <GripVertical size={16} />
          <span className="text-xs font-mono">{index + 1}</span>
        </div>
        <div className="flex-1 space-y-3">
          <div className="flex gap-3">
            <input
              type="text"
              value={question.title}
              onChange={(e) => onChange(question.id, { title: e.target.value })}
              placeholder="문항 제목을 입력하세요"
              className="input flex-1"
            />
            <select
              value={question.type}
              onChange={(e) => onChange(question.id, { type: e.target.value as QuestionType, options: hasOptions ? question.options : undefined })}
              className="select-input w-32"
            >
              {Object.entries(TYPE_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
            <label className="flex items-center gap-1.5 text-sm text-slate-600 shrink-0">
              <input type="checkbox" checked={question.required} onChange={(e) => onChange(question.id, { required: e.target.checked })} className="rounded" />
              필수
            </label>
          </div>

          {/* 미리보기 */}
          {question.type === 'short_text' && (
            <div className="h-8 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 flex items-center">
              <span className="text-xs text-slate-400">단답 입력란</span>
            </div>
          )}
          {question.type === 'long_text' && (
            <div className="h-16 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 flex items-start pt-2">
              <span className="text-xs text-slate-400">장문 입력란</span>
            </div>
          )}

          {/* 선택지 편집 */}
          {hasOptions && (
            <div className="space-y-2">
              {(question.options ?? []).map((opt, i) => (
                <div key={opt.id} className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
                  <input
                    type="text"
                    value={opt.text}
                    onChange={(e) => updateOption(opt.id, e.target.value)}
                    placeholder={`선택지 ${i + 1}`}
                    className="input flex-1 text-sm py-1.5"
                  />
                  <button onClick={() => removeOption(opt.id)} className="text-slate-400 hover:text-red-500">
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
              <button onClick={addOption} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                <Plus size={12} />선택지 추가
              </button>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <button onClick={() => onMoveUp(question.id)} disabled={index === 0} className="p-1 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30">
            <ChevronUp size={14} />
          </button>
          <button onClick={() => onMoveDown(question.id)} disabled={index === total - 1} className="p-1 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30">
            <ChevronDown size={14} />
          </button>
          <button onClick={() => onDelete(question.id)} className="p-1 rounded text-slate-400 hover:text-red-500">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default function SurveyEditPage() {
  const { surveyId } = useParams<{ surveyId: string }>()
  const navigate = useNavigate()
  const { surveys, addSurvey, updateSurvey, updateStatus } = useSurveyStore()
  const { currentCohortId } = useCohortStore()
  const toast = useToast()

  const isNew = surveyId === 'new'
  const existing = surveys.find((s) => s.id === surveyId)

  const [title, setTitle] = useState(existing?.title ?? '')
  const [description, setDescription] = useState(existing?.description ?? '')
  const [questions, setQuestions] = useState<Question[]>(existing?.questions ?? [])

  const addQuestion = (type: QuestionType = 'short_text') => {
    const newQ: Question = {
      id: `q-${Date.now()}`,
      order: questions.length + 1,
      title: '',
      type,
      required: false,
      options: ['multiple_choice', 'checkbox', 'dropdown'].includes(type)
        ? [{ id: `o-${Date.now()}`, text: '' }]
        : undefined,
    }
    setQuestions([...questions, newQ])
  }

  const updateQuestion = (id: string, data: Partial<Question>) => {
    setQuestions(questions.map((q) => (q.id === id ? { ...q, ...data } : q)))
  }

  const deleteQuestion = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id))
  }

  const moveUp = (id: string) => {
    const i = questions.findIndex((q) => q.id === id)
    if (i <= 0) return
    const next = [...questions]
    ;[next[i - 1], next[i]] = [next[i], next[i - 1]]
    setQuestions(next)
  }

  const moveDown = (id: string) => {
    const i = questions.findIndex((q) => q.id === id)
    if (i >= questions.length - 1) return
    const next = [...questions]
    ;[next[i], next[i + 1]] = [next[i + 1], next[i]]
    setQuestions(next)
  }

  const handleSave = (publish = false) => {
    if (!title.trim()) { toast.error('설문 제목을 입력해주세요.'); return }
    if (isNew) {
      const id = addSurvey({
        cohortId: currentCohortId,
        title: title.trim(),
        description: description.trim(),
        status: publish ? 'open' : 'draft',
        questions,
        createdBy: '김민준',
      })
      if (publish) toast.success('설문이 공개되었습니다.')
      else toast.success('임시 저장되었습니다.')
      navigate(`/surveys/${id}/edit`)
    } else if (existing) {
      updateSurvey(existing.id, { title, description, questions })
      if (publish) updateStatus(existing.id, 'open')
      toast.success(publish ? '설문이 공개되었습니다.' : '저장되었습니다.')
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader
        title={isNew ? '설문 만들기' : '설문 수정'}
        actions={
          <div className="flex gap-2">
            <Link to="/surveys" className="btn-secondary">취소</Link>
            <button onClick={() => handleSave(false)} className="btn-secondary">
              <Save size={15} />임시 저장
            </button>
            <button onClick={() => handleSave(true)} className="btn-primary">
              공개
            </button>
          </div>
        }
      />

      {/* 설문 기본 정보 */}
      <div className="card p-5 mb-4">
        <div className="space-y-3">
          <div>
            <label className="label">설문 제목 *</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="설문 제목" className="input text-base" />
          </div>
          <div>
            <label className="label">설문 설명</label>
            <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="응답자에게 보여줄 설명을 입력하세요." className="textarea" />
          </div>
        </div>
      </div>

      {/* 문항 목록 */}
      {questions.length === 0 ? (
        <div className="card p-8 text-center text-slate-400 mb-4">
          <p className="text-sm">아직 문항이 없습니다. 아래에서 문항을 추가하세요.</p>
        </div>
      ) : (
        <div>
          {questions.map((q, i) => (
            <QuestionCard
              key={q.id}
              question={q}
              index={i}
              total={questions.length}
              onChange={updateQuestion}
              onDelete={deleteQuestion}
              onMoveUp={moveUp}
              onMoveDown={moveDown}
            />
          ))}
        </div>
      )}

      {/* 문항 추가 버튼 */}
      <div className="card p-4">
        <p className="text-xs text-slate-500 mb-3 font-medium">문항 추가</p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(TYPE_LABELS).map(([type, label]) => (
            <button
              key={type}
              onClick={() => addQuestion(type as QuestionType)}
              className="btn-secondary py-1.5 text-xs"
            >
              <Plus size={13} />
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
