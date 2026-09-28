import { useEffect, useMemo, useState } from 'react'
import { api, setToken } from '../services/api.js'
import { AuthContext } from './authContextInstance.js'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(() => Boolean(window.localStorage.getItem('tutorlink.accessToken')))

  useEffect(() => {
    if (!window.localStorage.getItem('tutorlink.accessToken')) return
    api.get('/auth/me').then(setUser).catch(() => { setToken(null); setUser(null) }).finally(() => setLoading(false))
  }, [])

  const value = useMemo(() => ({
    user,
    loading,
    async signIn(credentials) { const result = await api.post('/auth/login', credentials); setToken(result.token); setUser(result.user); return result.user },
    async signUp(details) { const result = await api.post('/auth/register', details); setToken(result.token); setUser(result.user); return result.user },
    signOut() { setToken(null); setUser(null) },
  }), [user, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
