import { AUTH_CONSENT_REQUIRED_EVENT, expireAuthSession, getApiBaseUrl } from './auth'

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
    if (body.code === 'POLICY_CONSENT_REQUIRED') {
      window.dispatchEvent(new Event(AUTH_CONSENT_REQUIRED_EVENT))
    }
    throw new Error(body.message || '요청 처리에 실패했습니다.')
  }

  return body.data as T
}

async function refreshAccessToken() {
  try {
    await sendApiRequest('/api/auth/refresh', {
      method: 'POST',
    }, false)

    return true
  } catch {
    expireAuthSession()
    return false
  }
}
