import { create } from 'zustand'
import { surveys as initialSurveys } from '../data/surveys'
import type { Survey, Question, SurveyResponse, SurveyStatus } from '../types'

interface SurveyStore {
  surveys: Survey[]
  addSurvey: (survey: Omit<Survey, 'id' | 'createdAt' | 'updatedAt' | 'responses'>) => string
  updateSurvey: (id: string, data: Partial<Survey>) => void
  deleteSurvey: (id: string) => void
  updateStatus: (id: string, status: SurveyStatus) => void
  addResponse: (surveyId: string, response: Omit<SurveyResponse, 'id'>) => void
}

export const useSurveyStore = create<SurveyStore>((set, get) => ({
  surveys: initialSurveys,
  addSurvey: (survey) => {
    const id = `survey-${Date.now()}`
    set((state) => ({
      surveys: [
        ...state.surveys,
        {
          ...survey,
          id,
          responses: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    }))
    return id
  },
  updateSurvey: (id, data) =>
    set((state) => ({
      surveys: state.surveys.map((s) =>
        s.id === id ? { ...s, ...data, updatedAt: new Date().toISOString() } : s
      ),
    })),
  deleteSurvey: (id) =>
    set((state) => ({
      surveys: state.surveys.filter((s) => s.id !== id),
    })),
  updateStatus: (id, status) =>
    set((state) => ({
      surveys: state.surveys.map((s) =>
        s.id === id ? { ...s, status, updatedAt: new Date().toISOString() } : s
      ),
    })),
  addResponse: (surveyId, response) =>
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
    })),
}))
