import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api, getToken, setToken } from '../lib/api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(Boolean(getToken()))

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
  }, [])

  useEffect(() => {
    let cancelled = false

    async function hydrate() {
      if (!getToken()) {
        setLoading(false)
        return
      }
      try {
        const data = await api('/api/auth/me')
        if (!cancelled) setUser(data.user)
      } catch {
        if (!cancelled) setUser(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    hydrate()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const handler = () => setUser(null)
    window.addEventListener('joblens:unauthorized', handler)
    return () => window.removeEventListener('joblens:unauthorized', handler)
  }, [])

  const login = useCallback(async (username, password) => {
    const data = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    })
    setToken(data.token)
    setUser(data.user)
    return data.user
  }, [])

  const value = useMemo(
    () => ({ user, loading, login, logout }),
    [user, loading, login, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
