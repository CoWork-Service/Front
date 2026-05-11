import { create } from 'zustand'
import { apiRequest } from '../lib/api'
import { fetchSurveys, questionTypeToApi, toSurvey, type ApiSurveyDetail, type ApiSurveySummary } from '../lib/backendApi'
import type { Survey, SurveyResponse, SurveyStatus } from '../types'

interface SurveyStore {
  surveys: Survey[]
  isLoading: boolean
  error?: string
  loadSurveys: (cohortId: string) => Promise<void>
  loadSurveyDetail: (id: string) => Promise<void>
  addSurvey: (survey: Omit<Survey, 'id' | 'createdAt' | 'updatedAt' | 'responses'>) => Promise<string>
  updateSurvey: (id: string, data: Partial<Survey>) => Promise<void>
  deleteSurvey: (id: string) => Promise<void>
  updateStatus: (id: string, status: SurveyStatus) => Promise<void>
  addResponse: (surveyId: string, response: Omit<SurveyResponse, 'id'>) => Promise<void>
}

export const useSurveyStore = create<SurveyStore>((set, get) => ({
  surveys: [],
  isLoading: false,
  error: undefined,
  loadSurveys: async (cohortId) => {
    if (!cohortId) return
    set({ isLoading: true, error: undefined })
    try {
      set({ surveys: await fetchSurveys(cohortId), isLoading: false })
    } catch (error) {
      set({ isLoading: false, error: error instanceof Error ? error.message : '설문 목록을 불러오지 못했습니다.' })
    }
  },
  loadSurveyDetail: async (id) => {
    const detail = await apiRequest<ApiSurveyDetail>(`/api/surveys/${id}`)
    const survey = toSurvey(detail)
    set((state) => ({
      surveys: state.surveys.some((item) => item.id === id)
        ? state.surveys.map((item) => (item.id === id ? survey : item))
        : [...state.surveys, survey],
    }))
  },
  addSurvey: async (survey) => {
    const detail = await apiRequest<ApiSurveyDetail>('/api/surveys', {
      method: 'POST',
      body: JSON.stringify(surveyToApiPayload(survey)),
    })
    const nextSurvey = toSurvey(detail)
    set((state) => ({ surveys: [...state.surveys, nextSurvey] }))
    return nextSurvey.id
  },
  updateSurvey: async (id, data) => {
    const current = get().surveys.find((survey) => survey.id === id)
    const detail = await apiRequest<ApiSurveyDetail>(`/api/surveys/${id}`, {
      method: 'PUT',
      body: JSON.stringify(surveyToApiPayload({ ...current, ...data })),
    })
    const nextSurvey = toSurvey(detail)
    set((state) => ({
      surveys: state.surveys.map((s) => (s.id === id ? nextSurvey : s)),
    }))
  },
  deleteSurvey: async (id) => {
    await apiRequest<void>(`/api/surveys/${id}`, { method: 'DELETE' })
    set((state) => ({
      surveys: state.surveys.filter((s) => s.id !== id),
    }))
  },
  updateStatus: async (id, status) => {
    const summary = await apiRequest<ApiSurveySummary>(`/api/surveys/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: status.toUpperCase() }),
    })
    set((state) => ({
      surveys: state.surveys.map((s) =>
        s.id === id ? { ...s, status: summary.status.toLowerCase() as SurveyStatus, updatedAt: summary.updatedAt } : s
      ),
    }))
  },
  addResponse: async (surveyId, response) => {
    const survey = get().surveys.find((item) => item.id === surveyId)
    const answers = Object.entries(response.answers).map(([questionId, value]) => {
      const question = survey?.questions.find((item) => item.id === questionId)
      if (Array.isArray(value)) {
        return { questionId: Number(questionId), answerText: null, selectedOptionIds: value.map(Number) }
      }
      if (question?.type === 'multiple_choice' || question?.type === 'dropdown' || question?.type === 'checkbox') {
        return { questionId: Number(questionId), answerText: null, selectedOptionIds: value ? [Number(value)] : [] }
      }
      return { questionId: Number(questionId), answerText: value, selectedOptionIds: [] }
    })
    await apiRequest(`/api/surveys/${surveyId}/respond`, {
      method: 'POST',
      body: JSON.stringify({ respondentName: '익명', answers }),
    })
    set((state) => ({
      surveys: state.surveys.map((s) =>
        s.id === surveyId
          ? {
              ...s,
              responses: [
                ...s.responses,
                { ...response, id: `res-${Date.now()}` },
              ],
            }
          : s
      ),
    }))
  },
}))

function surveyToApiPayload(survey: Partial<Survey>) {
  return {
    cohortId: survey.cohortId ? Number(survey.cohortId) : undefined,
    title: survey.title,
    description: survey.description,
    status: survey.status?.toUpperCase(),
    eventId: survey.eventId ? Number(survey.eventId) : undefined,
    questions: survey.questions?.map((question) => ({
      orderIndex: question.order,
      title: question.title,
      type: questionTypeToApi(question.type),
      required: question.required,
      options: question.options?.map((option) => option.text) ?? [],
    })),
  }
}
