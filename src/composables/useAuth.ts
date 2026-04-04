import { computed, ref } from 'vue'

const AUTH_STORAGE_KEY = 'persist-net-auth-session'
const LOGIN_URL = 'http://localhost:5156/api/user/login'

export interface LoginCredentials {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
}

export interface AuthSession {
  email: string
  loggedInAt: string
  token: string
}

const session = ref<AuthSession | null>(readStoredSession())
const error = ref<string | null>(null)
const isLoading = ref(false)

function readStoredSession(): AuthSession | null {
  if (typeof window === 'undefined') {
    return null
  }

  const rawSession = window.localStorage.getItem(AUTH_STORAGE_KEY)

  if (!rawSession) {
    return null
  }

  try {
    return JSON.parse(rawSession) as AuthSession
  } catch {
    window.localStorage.removeItem(AUTH_STORAGE_KEY)
    return null
  }
}

function persistSession(nextSession: AuthSession | null) {
  if (typeof window === 'undefined') {
    return
  }

  if (!nextSession) {
    window.localStorage.removeItem(AUTH_STORAGE_KEY)
    return
  }

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextSession))
}

function getErrorMessage(payload: unknown, status?: number): string {
  if (status === 401) {
    return 'Credenciales invalidas. Revisa el email y la contrasena.'
  }

  if (typeof payload === 'string' && payload.trim()) {
    return payload
  }

  if (payload && typeof payload === 'object') {
    if (
      'status' in payload &&
      payload.status === 401 &&
      'title' in payload &&
      payload.title === 'Unauthorized'
    ) {
      return 'Credenciales invalidas. Revisa el email y la contrasena.'
    }

    if ('message' in payload && typeof payload.message === 'string' && payload.message.trim()) {
      return payload.message
    }

    if ('error' in payload && typeof payload.error === 'string' && payload.error.trim()) {
      return payload.error
    }
  }

  return 'No se pudo iniciar sesion. Verifica tus credenciales e intentalo otra vez.'
}

async function parseResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') ?? ''

  if (contentType.includes('application/json')) {
    return response.json()
  }

  const text = await response.text()
  return text || null
}

function isLoginResponse(payload: unknown): payload is LoginResponse {
  return Boolean(
    payload &&
      typeof payload === 'object' &&
      'token' in payload &&
      typeof payload.token === 'string' &&
      payload.token.trim(),
  )
}

async function login(credentials: LoginCredentials) {
  isLoading.value = true
  error.value = null

  try {
    const response = await fetch(LOGIN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    })

    const payload = await parseResponseBody(response)

    if (!response.ok) {
      const nextError = getErrorMessage(payload, response.status)
      error.value = nextError
      throw new Error(nextError)
    }

    if (!isLoginResponse(payload)) {
      const nextError = 'La respuesta del servidor no incluye un token JWT valido.'
      error.value = nextError
      throw new Error(nextError)
    }

    const nextSession: AuthSession = {
      email: credentials.email,
      loggedInAt: new Date().toISOString(),
      token: payload.token,
    }

    session.value = nextSession
    persistSession(nextSession)

    return nextSession
  } catch (loginError) {
    if (!error.value) {
      error.value = 'No se pudo conectar con el servidor de autenticacion.'
    }

    throw loginError
  } finally {
    isLoading.value = false
  }
}

function logout() {
  session.value = null
  error.value = null
  persistSession(null)
}

function clearError() {
  error.value = null
}

export function useAuth() {
  return {
    session,
    error,
    isLoading,
    isAuthenticated: computed(() => session.value !== null),
    login,
    logout,
    clearError,
  }
}