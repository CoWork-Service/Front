export type JoinStatus = 'ACTIVE' | 'PENDING' | 'REJECTED' | 'UNKNOWN'

export type AuthUser = {
  userId?: number | string
  name?: string
  email?: string | null
  studentId?: string
  department?: string | null
  organizationId?: number | string
  organizationName?: string
  organizationDepartments?: string[]
  role?: string
  joinStatus?: JoinStatus
  consentRequired?: boolean
  termsVersion?: string
  privacyVersion?: string
}

export type SsoProfile = {
  studentId: string
  name: string
  department?: string | null
}

type ApiResponse<T> = {
  success?: boolean
  data?: T
  message?: string | null
  code?: string | null
}

type TokenResponse = {
  userId?: number
  name?: string
  email?: string | null
  joinStatus?: string
  consentRequired?: boolean
  termsVersion?: string
  privacyVersion?: string
}

type JwtPayload = Record<string, string | number | null | undefined>

function pickTokenValue(payload: JwtPayload, keys: string[]) {
  for (const key of keys) {
    const value = payload[key]
    if (value !== null && value !== undefined) return value
  }
  return undefined
}

function tokenString(value: string | number | null | undefined) {
  if (value === null || value === undefined) return undefined
  return String(value)
}

function tokenNullableString(value: string | number | null | undefined) {
  if (value === null) return null
  return tokenString(value)
}

const LEGACY_AUTH_STORAGE_KEYS = [
  'cowork_auth',
  'cowork_access_token',
  'cowork_refresh_token',
  'cowork_sso_temp_token',
  'cowork_user',
  'cowork_onboarding_required',
  'cowork_onboarding_status',
] as const

export const AUTH_SESSION_EXPIRED_EVENT = 'cowork:auth-session-expired'
export const AUTH_CONSENT_REQUIRED_EVENT = 'cowork:policy-consent-required'
const LOGOUT_REQUEST_TIMEOUT_MS = 3000

export function getApiBaseUrl() {
  if (typeof window !== 'undefined' && window.location.origin === 'https://cowork.kro.kr') {
    return window.location.origin
  }

  return (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').replace(/\/$/, '')
}

export function buildSsoLoginUrl() {
  const explicitUrl = import.meta.env.VITE_SSO_LOGIN_URL
  if (explicitUrl) return explicitUrl

  const apiReturnUrl = `${getApiBaseUrl()}/api/auth/sso/callback`
  return `https://smartid.ssu.ac.kr/Symtra_sso/smln.asp?apiReturnUrl=${encodeURIComponent(apiReturnUrl)}`
}

export function normalizeJoinStatus(value?: string | null): JoinStatus {
  const normalized = value?.toUpperCase()
  if (normalized === 'ACTIVE' || normalized === 'PENDING' || normalized === 'REJECTED') return normalized
  return 'UNKNOWN'
}

export function clearLegacyAuthStorage() {
  LEGACY_AUTH_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key))
}

export function expireAuthSession() {
  clearLegacyAuthStorage()
  window.dispatchEvent(new Event(AUTH_SESSION_EXPIRED_EVENT))
}

export async function logoutSession() {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), LOGOUT_REQUEST_TIMEOUT_MS)

  try {
    await fetch(`${getApiBaseUrl()}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include',
      signal: controller.signal,
    })
  } catch {
    // Local state must be cleared even if the network request is interrupted.
  } finally {
    window.clearTimeout(timeout)
  }
  expireAuthSession()
}

export function userFromToken(accessToken: string): AuthUser {
  const payload = decodeJwtPayload(accessToken)
  if (!payload) return {}

  return {
    userId: pickTokenValue(payload, ['userId', 'id', 'sub']),
    name: tokenString(payload.name),
    email: tokenNullableString(payload.email),
    studentId: tokenString(pickTokenValue(payload, ['studentId', 'student_id', 'studentNumber', 'sIdno'])),
    department: tokenNullableString(payload.department),
    organizationId: pickTokenValue(payload, ['organizationId', 'orgId']),
    organizationName: tokenString(pickTokenValue(payload, ['organizationName', 'orgName'])),
    role: tokenString(pickTokenValue(payload, ['role', 'authority'])),
    joinStatus: normalizeJoinStatus(tokenString(payload.joinStatus)),
    consentRequired: parseBooleanParam(tokenString(payload.consentRequired) || null),
    termsVersion: tokenString(payload.termsVersion),
    privacyVersion: tokenString(payload.privacyVersion),
  }
}

export function parseBooleanParam(value: string | null) {
  if (!value) return false
  return ['1', 'true', 'yes', 'y'].includes(value.toLowerCase())
}

export async function fetchSsoProfile(tempToken: string): Promise<SsoProfile> {
  const response = await fetch(`${getApiBaseUrl()}/api/auth/sso/profile?tempToken=${encodeURIComponent(tempToken)}`, {
    credentials: 'include',
  })
  const body = (await response.json()) as ApiResponse<SsoProfile>

  if (!response.ok || body.success === false || !body.data) {
    throw new Error(body.message || 'SSO 프로필을 불러오지 못했습니다.')
  }

  return body.data
}

export async function registerSsoUser(payload: {
  tempToken: string
  councilMember: boolean
  cohortLabel?: string
  department?: string | null
  organizationName?: string
  inviteCode?: string
  departments?: string[]
}): Promise<TokenResponse> {
  const response = await fetch(`${getApiBaseUrl()}/api/auth/sso/register`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const body = (await response.json()) as ApiResponse<TokenResponse>

  if (!response.ok || body.success === false || !body.data) {
    throw new Error(body.message || '가입 처리에 실패했습니다.')
  }

  return body.data
}

function decodeJwtPayload(token: string): JwtPayload | null {
  const [, payload] = token.split('.')
  if (!payload) return null

  try {
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=')
    const json = decodeURIComponent(
      atob(padded)
        .split('')
        .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`)
        .join(''),
    )
    return JSON.parse(json) as JwtPayload
  } catch {
    return null
  }
}
