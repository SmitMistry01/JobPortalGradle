import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { AuthResponse, AuthUser } from '../../types/auth'

interface AuthState {
  token: string | null
  user: AuthUser | null
}

function isLikelyJwt(value: unknown): value is string {
  return typeof value === 'string' && value.split('.').length === 3
}

function safeParseUser(raw: string | null): AuthUser | null {
  if (!raw) {
    return null
  }
  try {
    return JSON.parse(raw) as AuthUser
  } catch {
    return null
  }
}

function readTokenFromStorage(): string | null {
  const raw = localStorage.getItem('jp_token') ?? localStorage.getItem('token')
  if (!isLikelyJwt(raw)) {
    return null
  }
  return raw
}

function normalizeCredentials(payload: AuthResponse | Record<string, unknown>) {
  const source = payload as Record<string, unknown>
  const nestedUser = (source.user ?? {}) as Record<string, unknown>

  const tokenCandidate = source.token ?? source.accessToken ?? source.jwt
  const token = isLikelyJwt(tokenCandidate) ? tokenCandidate : null

  const userIdCandidate = source.userId ?? source.id ?? nestedUser.userId ?? nestedUser.id
  const userId = typeof userIdCandidate === 'number' ? userIdCandidate : Number(userIdCandidate)

  const emailCandidate = source.email ?? nestedUser.email
  const email = typeof emailCandidate === 'string' ? emailCandidate : ''

  const roleCandidate = source.role ?? nestedUser.role
  const role = typeof roleCandidate === 'string' ? roleCandidate : 'JOB_SEEKER'

  if (!token || !Number.isFinite(userId) || !email) {
    throw new Error('Invalid auth payload')
  }

  return {
    token,
    user: {
      userId,
      email,
      role: role as AuthUser['role'],
    },
  }
}

const storageToken = readTokenFromStorage()
const storageUser = safeParseUser(localStorage.getItem('jp_user') ?? localStorage.getItem('user'))

const initialState: AuthState = {
  token: storageToken,
  user: storageUser,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<AuthResponse>) => {
      const normalized = normalizeCredentials(action.payload as unknown as Record<string, unknown>)
      state.token = normalized.token
      state.user = normalized.user
      localStorage.setItem('jp_token', normalized.token)
      localStorage.setItem('jp_user', JSON.stringify(state.user))
    },
    logout: (state) => {
      state.token = null
      state.user = null
      localStorage.removeItem('jp_token')
      localStorage.removeItem('jp_user')
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    },
  },
})

export const { setCredentials, logout } = authSlice.actions
export const clearCredentials = logout
export default authSlice.reducer
