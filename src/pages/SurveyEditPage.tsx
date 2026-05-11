import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Plus, Trash2, ChevronUp, ChevronDown, GripVertical, Save, Loader2 } from 'lucide-react'
import { useSurveyStore } from '../store/useSurveyStore'
import { useCohortStore } from '../store/useCohortStore'
import { useEventStore } from '../store/useEventStore'
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

let draftId = 0
function nextDraftId(prefix: string) {
  draftId += 1
  return `${prefix}-${draftId}`
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
              onChange={(e) => {
                const nextType = e.target.value as QuestionType
                const nextHasOptions = ['multiple_choice', 'checkbox', 'dropdown'].includes(nextType)
                onChange(question.id, {
                  type: nextType,
                  options: nextHasOptions
                    ? (question.options?.length ? question.options : [{ id: nextDraftId('o'), text: '' }])
                    : undefined,
                })
              }}
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
                  <button type="button" onClick={() => removeOption(opt.id)} className="text-slate-400 hover:text-red-500">
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
              <button type="button" onClick={addOption} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                <Plus size={12} />선택지 추가
              </button>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <button type="button" onClick={() => onMoveUp(question.id)} disabled={index === 0} className="p-1 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30">
            <ChevronUp size={14} />
          </button>
          <button type="button" onClick={() => onMoveDown(question.id)} disabled={index === total - 1} className="p-1 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30">
            <ChevronDown size={14} />
          </button>
          <button type="button" onClick={() => onDelete(question.id)} className="p-1 rounded text-slate-400 hover:text-red-500">
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
  const { surveys, addSurvey, updateSurvey, updateStatus, loadSurveyDetail } = useSurveyStore()
  const { currentCohortId } = useCohortStore()
  const { events } = useEventStore()
  const toast = useToast()
  const requestedSurveyId = useRef<string | null>(null)

  const cohortEvents = useMemo(() => events.filter((e) => e.cohortId === currentCohortId), [events, currentCohortId])

  const isNew = !surveyId || surveyId === 'new'
  const existing = isNew ? undefined : surveys.find((s) => s.id === surveyId)

  const [title, setTitle] = useState(existing?.title ?? '')
  const [description, setDescription] = useState(existing?.description ?? '')
  const [eventId, setEventId] = useState(existing?.eventId ?? '')
  const [questions, setQuestions] = useState<Question[]>(existing?.questions ?? [])
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (isNew || !surveyId || existing || requestedSurveyId.current === surveyId) return
    requestedSurveyId.current = surveyId
    void loadSurveyDetail(surveyId).catch((error) => {
      toast.error(error instanceof Error ? error.message : '설문을 불러오지 못했습니다.')
    })
  }, [existing, isNew, loadSurveyDetail, surveyId, toast])

  useEffect(() => {
    if (!existing) return
    setTitle(existing.title)
    setDescription(existing.description ?? '')
    setEventId(existing.eventId ?? '')
    setQuestions(existing.questions)
  }, [existing])

  const addQuestion = (type: QuestionType = 'short_text') => {
    const newQ: Question = {
      id: nextDraftId('q'),
      order: questions.length + 1,
      title: '',
      type,
      required: false,
      options: ['multiple_choice', 'checkbox', 'dropdown'].includes(type)
        ? [{ id: nextDraftId('o'), text: '' }]
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

  const handleSave = async (publish = false) => {
    if (!title.trim()) { toast.error('설문 제목을 입력해주세요.'); return }
    if (!currentCohortId) { toast.error('기수 정보를 불러온 뒤 다시 시도해주세요.'); return }

    const nextQuestions = questions.map((question, index) => ({
      ...question,
      order: index + 1,
      title: question.title.trim(),
      options: question.options
        ?.map((option) => ({ ...option, text: option.text.trim() }))
        .filter((option) => option.text),
    }))

    if (nextQuestions.some((question) => !question.title)) {
      toast.error('문항 제목을 입력해주세요.')
      return
    }

    if (nextQuestions.some((question) => (
      ['multiple_choice', 'checkbox', 'dropdown'].includes(question.type) && !question.options?.length
    ))) {
      toast.error('선택형 문항에는 선택지를 1개 이상 입력해주세요.')
      return
    }

    setIsSaving(true)
    if (isNew) {
      try {
        const id = await addSurvey({
          cohortId: currentCohortId,
          title: title.trim(),
          description: description.trim(),
          status: publish ? 'open' : 'draft',
          questions: nextQuestions,
          createdBy: '김민준',
          eventId: eventId || undefined,
        })
        if (publish) toast.success('설문이 공개되었습니다.')
        else toast.success('임시 저장되었습니다.')
        navigate(`/surveys/${id}/edit`)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : '설문 저장에 실패했습니다.')
      } finally {
        setIsSaving(false)
      }
    } else if (existing) {
      try {
        await updateSurvey(existing.id, {
          title: title.trim(),
          description: description.trim(),
          questions: nextQuestions,
          eventId: eventId || undefined,
        })
        if (publish) await updateStatus(existing.id, 'open')
        toast.success(publish ? '설문이 공개되었습니다.' : '저장되었습니다.')
      } catch (error) {
        toast.error(error instanceof Error ? error.message : '설문 저장에 실패했습니다.')
      } finally {
        setIsSaving(false)
      }
    } else {
      toast.error('설문 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.')
      setIsSaving(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader
        title={isNew ? '설문 만들기' : '설문 수정'}
        actions={
          <div className="flex gap-2">
            <Link to="/surveys" className="btn-secondary">취소</Link>
            <button type="button" onClick={() => handleSave(false)} className="btn-secondary" disabled={isSaving}>
              {isSaving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              임시 저장
            </button>
            <button type="button" onClick={() => handleSave(true)} className="btn-primary" disabled={isSaving}>
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
          <div>
            <label className="label">연결 행사 (선택)</label>
            <select value={eventId} onChange={(e) => setEventId(e.target.value)} className="select-input">
              <option value="">행사 미연결</option>
              {cohortEvents.map((ev) => (
                <option key={ev.id} value={ev.id}>{ev.name} ({ev.startDate})</option>
              ))}
            </select>
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
              type="button"
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
