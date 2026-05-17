import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import {
  AUTH_SESSION_EXPIRED_EVENT,
  clearLegacyAuthStorage,
  getApiBaseUrl,
  normalizeJoinStatus,
  type AuthUser,
} from './auth'

type ApiResponse<T> = {
  success?: boolean
  data?: T
  message?: string | null
  code?: string | null
}

type MeResponse = {
  userId?: number
  name?: string
  email?: string | null
  organizationId?: number
  organizationName?: string
  consentRequired?: boolean
  termsVersion?: string
  privacyVersion?: string
}

type AuthStatus = 'checking' | 'authenticated' | 'anonymous'

type AuthContextValue = {
  status: AuthStatus
  user: AuthUser | null
  refreshSession: () => Promise<AuthUser | null>
  setAuthenticatedUser: (user: AuthUser) => void
  clearAuthUser: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('checking')
  const [user, setUser] = useState<AuthUser | null>(null)
  const sessionVersionRef = useRef(0)

  const setAuthenticatedUser = useCallback((nextUser: AuthUser) => {
    sessionVersionRef.current += 1
    clearLegacyAuthStorage()
    setUser({
      ...nextUser,
      joinStatus: normalizeJoinStatus(nextUser.joinStatus || 'ACTIVE'),
    })
    setStatus('authenticated')
  }, [])

  const clearAuthUser = useCallback(() => {
    sessionVersionRef.current += 1
    clearLegacyAuthStorage()
    setUser(null)
    setStatus('anonymous')
  }, [])

  const refreshSession = useCallback(async () => {
    const requestVersion = sessionVersionRef.current
    clearLegacyAuthStorage()
    const nextUser = await fetchCurrentUser()
    if (requestVersion !== sessionVersionRef.current) {
      return nextUser
    }

    if (nextUser) {
      setAuthenticatedUser(nextUser)
      return nextUser
    }
    clearAuthUser()
    return null
  }, [clearAuthUser, setAuthenticatedUser])

  useEffect(() => {
    void refreshSession()
  }, [refreshSession])

  useEffect(() => {
    window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, clearAuthUser)
    return () => window.removeEventListener(AUTH_SESSION_EXPIRED_EVENT, clearAuthUser)
  }, [clearAuthUser])

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      refreshSession,
      setAuthenticatedUser,
      clearAuthUser,
    }),
    [clearAuthUser, refreshSession, setAuthenticatedUser, status, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

async function fetchCurrentUser() {
  let response = await fetchMe()
  if (response.status === 401) {
    const refreshed = await refreshAuthCookies()
    if (!refreshed) return null
    response = await fetchMe()
  }

  if (!response.ok) return null

  const body = (await response.json().catch(() => ({}))) as ApiResponse<MeResponse>
  if (body.success === false || !body.data) return null
  return toAuthUser(body.data)
}

function fetchMe() {
  return fetch(`${getApiBaseUrl()}/api/auth/me`, {
    credentials: 'include',
  })
}

async function refreshAuthCookies() {
  const response = await fetch(`${getApiBaseUrl()}/api/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  })
  return response.ok
}

function toAuthUser(response: MeResponse): AuthUser {
  return {
    userId: response.userId,
    name: response.name,
    email: response.email,
    organizationId: response.organizationId,
    organizationName: response.organizationName,
    joinStatus: 'ACTIVE',
    consentRequired: Boolean(response.consentRequired),
    termsVersion: response.termsVersion,
    privacyVersion: response.privacyVersion,
  }
}
