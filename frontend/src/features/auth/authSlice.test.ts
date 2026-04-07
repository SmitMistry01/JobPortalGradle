import { describe, expect, it } from 'vitest'
import authReducer, { logout, setCredentials } from './authSlice'

describe('authSlice', () => {
  it('stores credentials and clears on logout', () => {
    const loggedIn = authReducer(
      { token: null, user: null },
      setCredentials({ token: 'abc', userId: 5, email: 'user@test.com', role: 'RECRUITER' }),
    )

    expect(loggedIn.token).toBe('abc')
    expect(loggedIn.user?.role).toBe('RECRUITER')

    const loggedOut = authReducer(loggedIn, logout())
    expect(loggedOut.token).toBeNull()
    expect(loggedOut.user).toBeNull()
  })
})

