import { useAuth } from './useAuth'
import { API_BASE_URL } from '../lib/api-config'

export class ApiError extends Error {
  status: number
  payload: unknown

  constructor(message: string, status: number, payload: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.payload = payload
  }
}

async function parseResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') ?? ''

  if (contentType.includes('application/json')) {
    return response.json()
  }

  const text = await response.text()
  return text || null
}

function getApiErrorMessage(payload: unknown, status: number): string {
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>

    if (typeof record.message === 'string' && record.message.trim()) {
      return record.message
    }

    if (typeof record.error === 'string' && record.error.trim()) {
      return record.error
    }

    if (typeof record.title === 'string' && record.title.trim()) {
      return record.title
    }
  }

  if (typeof payload === 'string' && payload.trim()) {
    return payload
  }

  return `La API respondio con un error (${status}).`
}

export function useApi() {
  const { session, logout } = useAuth()

  async function request<T = unknown>(path: string, init?: RequestInit): Promise<T> {
    const headers = new Headers(init?.headers ?? {})

    if (!headers.has('Content-Type') && init?.body) {
      headers.set('Content-Type', 'application/json')
    }

    if (session.value?.token) {
      headers.set('Authorization', `Bearer ${session.value.token}`)
    }

    const response = await fetch(`${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`, {
      ...init,
      headers,
    })

    const payload = await parseResponseBody(response)

    if (!response.ok) {
      if (response.status === 401) {
        logout()
      }

      throw new ApiError(getApiErrorMessage(payload, response.status), response.status, payload)
    }

    return payload as T
  }

  return {
    request,
  }
}