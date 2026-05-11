import { AUTH_KEYS, clearAuthSession, getApiBaseUrl, getStoredUser, normalizeJoinStatus, saveAuthSession } from './auth'

type ApiResponse<T> = {
  success?: boolean
  data?: T
  message?: string | null
  code?: string | null
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  return sendApiRequest<T>(path, init, true)
}

export function buildApiPath(path: string, params: Record<string, string | number | boolean | null | undefined> = {}) {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    search.set(key, String(value))
  })
  const query = search.toString()
  return query ? `${path}?${query}` : path
}

async function sendApiRequest<T>(path: string, init: RequestInit, allowRefresh: boolean): Promise<T> {
  const headers = new Headers(init.headers)
  const token = localStorage.getItem(AUTH_KEYS.accessToken)

  if (token) headers.set('Authorization', `Bearer ${token}`)
  if (init.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers,
  })

  if (response.status === 401 && allowRefresh) {
    const refreshed = await refreshAccessToken()
    if (refreshed) return sendApiRequest<T>(path, init, false)
  }

  const body = (await response.json().catch(() => ({}))) as ApiResponse<T>
  if (!response.ok || body.success === false) {
    throw new Error(body.message || '요청 처리에 실패했습니다.')
  }

  return body.data as T
}

async function refreshAccessToken() {
  const refreshToken = localStorage.getItem(AUTH_KEYS.refreshToken)
  if (!refreshToken) return false

  try {
    const response = await sendApiRequest<{
      accessToken?: string | null
      refreshToken?: string | null
      userId?: number
      name?: string
      email?: string | null
      joinStatus?: string
    }>('/api/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    }, false)

    if (!response.accessToken) return false
    saveAuthSession({
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      user: {
        ...(getStoredUser() ?? {}),
        userId: response.userId,
        name: response.name,
        email: response.email,
        joinStatus: normalizeJoinStatus(response.joinStatus),
      },
      authenticated: true,
      onboardingRequired: false,
    })
    return true
  } catch {
    clearAuthSession()
    return false
  }
}
