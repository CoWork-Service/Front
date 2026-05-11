import { AUTH_KEYS, getApiBaseUrl } from './auth'

type ApiResponse<T> = {
  success?: boolean
  data?: T
  message?: string | null
  code?: string | null
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
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

  const body = (await response.json().catch(() => ({}))) as ApiResponse<T>
  if (!response.ok || body.success === false) {
    throw new Error(body.message || '요청 처리에 실패했습니다.')
  }

  return body.data as T
}
