import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { ToastProvider } from './components/common/Toast'
import { AUTH_CONSENT_REQUIRED_EVENT, AUTH_SESSION_EXPIRED_EVENT } from './lib/auth'
import { AuthProvider, useAuth } from './lib/authState'

import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import ConsentPage from './pages/ConsentPage'
import PrivacyPolicyPage from './pages/PrivacyPolicyPage'
import SsoCallbackPage from './pages/SsoCallbackPage'
import OnboardingPage from './pages/OnboardingPage'
import SsoStatusPage from './pages/SsoStatusPage'
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
import EventsPage from './pages/EventsPage'
import EventDetailPage from './pages/EventDetailPage'
import MobileRegisterPage from './pages/MobileRegisterPage'
import AuditLogsPage from './pages/AuditLogsPage'

function RequireAuth({ children, allowMissingConsent = false }: { children: React.ReactNode; allowMissingConsent?: boolean }) {
  const location = useLocation()
  const { status, user } = useAuth()

  if (status === 'checking') return <RouteLoading />
  if (status !== 'authenticated') return <Navigate to="/login" replace />
  if (!allowMissingConsent && user?.consentRequired) {
    return <Navigate to="/consent" replace state={{ from: location.pathname }} />
  }
  return <>{children}</>
}

function RequireOnboarding({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const { status } = useAuth()

  if (params.get('tempToken')) return <>{children}</>
  if (status === 'checking') return <RouteLoading />
  if (status === 'authenticated') return <Navigate to="/home" replace />
  return <Navigate to="/login" replace />
}

function RouteLoading() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-sm text-slate-500">인증 상태 확인 중</div>
    </div>
  )
}

function AuthSessionWatcher() {
  const navigate = useNavigate()

  useEffect(() => {
    const handleExpired = () => {
      navigate('/login', { replace: true })
    }
    const handleConsentRequired = () => {
      navigate('/consent', { replace: true })
    }

    window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, handleExpired)
    window.addEventListener(AUTH_CONSENT_REQUIRED_EVENT, handleConsentRequired)
    return () => {
      window.removeEventListener(AUTH_SESSION_EXPIRED_EVENT, handleExpired)
      window.removeEventListener(AUTH_CONSENT_REQUIRED_EVENT, handleConsentRequired)
    }
  }, [navigate])

  return null
}

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <AuthProvider>
          <AuthSessionWatcher />
          <Routes>
            {/* 공개 라우트 */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/privacy" element={<PrivacyPolicyPage />} />
            <Route path="/auth/sso/callback" element={<SsoCallbackPage />} />
            <Route path="/main" element={<SsoCallbackPage />} />
            <Route path="/consent" element={<ConsentPage />} />
            <Route
              path="/onboarding"
              element={
                <RequireOnboarding>
                  <OnboardingPage />
                </RequireOnboarding>
              }
            />
            <Route path="/pending" element={<SsoStatusPage status="pending" />} />
            <Route path="/rejected" element={<SsoStatusPage status="rejected" />} />

            {/* 설문 응답 (공개) */}
            <Route path="/surveys/:surveyId/respond" element={<SurveyRespondPage />} />

            {/* 모바일 지출 등록 (공개, QR 세션) */}
            <Route path="/budget/mobile-register/:token" element={<MobileRegisterPage />} />

            {/* 로그인 후 앱 셸 */}
            <Route
              element={
                <RequireAuth>
                  <AppShell />
                </RequireAuth>
              }
            >
              <Route path="/home" element={<HomePage />} />
              <Route path="/events" element={<EventsPage />} />
              <Route path="/events/:eventId" element={<EventDetailPage />} />
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
              <Route path="/history" element={<AuditLogsPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ToastProvider>
  )
}
