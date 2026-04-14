import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { ToastProvider } from './components/common/Toast'

import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import HomePage from './pages/HomePage'
import FilesPage from './pages/FilesPage'
import BudgetPage from './pages/BudgetPage'
import AssetsPage from './pages/AssetsPage'
import StudentsPage from './pages/StudentsPage'
import StudentsImportPage from './pages/StudentsImportPage'
import SurveysPage from './pages/SurveysPage'
import SurveyEditPage from './pages/SurveyEditPage'
import SurveyRespondPage from './pages/SurveyRespondPage'
import SurveyResultsPage from './pages/SurveyResultsPage'
import WorkspacesPage from './pages/WorkspacesPage'
import WorkspaceDetailPage from './pages/WorkspaceDetailPage'
import MeetingDetailPage from './pages/MeetingDetailPage'
import SchedulesPage from './pages/SchedulesPage'
import ScheduleNewPage from './pages/ScheduleNewPage'
import ScheduleRespondPage from './pages/ScheduleRespondPage'
import ScheduleResultsPage from './pages/ScheduleResultsPage'
import OrgPage from './pages/OrgPage'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const isAuth = localStorage.getItem('dowork_auth') === 'true'
  if (!isAuth) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Routes>
          {/* 공개 라우트 */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* 설문 응답 (공개) */}
          <Route path="/surveys/:surveyId/respond" element={<SurveyRespondPage />} />

          {/* 로그인 후 앱 셸 */}
          <Route
            element={
              <RequireAuth>
                <AppShell />
              </RequireAuth>
            }
          >
            <Route path="/home" element={<HomePage />} />
            <Route path="/files" element={<FilesPage />} />
            <Route path="/files/:fileId" element={<FilesPage />} />
            <Route path="/budget" element={<BudgetPage />} />
            <Route path="/budget/new" element={<BudgetPage />} />
            <Route path="/budget/:expenseId" element={<BudgetPage />} />
            <Route path="/assets" element={<AssetsPage />} />
            <Route path="/assets/:assetId" element={<AssetsPage />} />
            <Route path="/students" element={<StudentsPage />} />
            <Route path="/students/import" element={<StudentsImportPage />} />
            <Route path="/surveys" element={<SurveysPage />} />
            <Route path="/surveys/new" element={<SurveyEditPage />} />
            <Route path="/surveys/:surveyId/edit" element={<SurveyEditPage />} />
            <Route path="/surveys/:surveyId/results" element={<SurveyResultsPage />} />
            <Route path="/workspaces" element={<WorkspacesPage />} />
            <Route path="/workspaces/:departmentId" element={<WorkspaceDetailPage />} />
            <Route path="/workspaces/:departmentId/meetings/:meetingId" element={<MeetingDetailPage />} />
            <Route path="/schedules" element={<SchedulesPage />} />
            <Route path="/schedules/new" element={<ScheduleNewPage />} />
            <Route path="/schedules/:pollId/respond" element={<ScheduleRespondPage />} />
            <Route path="/schedules/:pollId/results" element={<ScheduleResultsPage />} />
            <Route path="/org" element={<OrgPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  )
}
