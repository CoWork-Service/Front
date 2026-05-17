import { clearAuthSession, getApiBaseUrl, getStoredUser, normalizeJoinStatus, saveAuthSession } from './auth'

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

  if (init.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers,
    credentials: 'include',
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
  try {
    const response = await sendApiRequest<{
      userId?: number
      name?: string
      email?: string | null
      joinStatus?: string
    }>('/api/auth/refresh', {
      method: 'POST',
    }, false)

    const storedUser = getStoredUser()
    saveAuthSession({
      user: {
        ...(storedUser ?? {}),
        userId: response.userId ?? storedUser?.userId,
        name: response.name ?? storedUser?.name,
        email: response.email ?? storedUser?.email,
        joinStatus: normalizeJoinStatus(response.joinStatus ?? storedUser?.joinStatus),
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
