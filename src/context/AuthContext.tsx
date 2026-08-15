import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import type { AuthResponse, SessionUser } from '../types'

const STORAGE_KEY = 'havenly_session'
type AuthContextValue = {
  user: SessionUser | null; accessToken: string | null
  setSession: (session: AuthResponse) => void; updateUser: (user: SessionUser) => void; logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function loadSession(): AuthResponse | null {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') }
  catch { return null }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<AuthResponse | null>(loadSession)
  const value = useMemo<AuthContextValue>(() => ({
    user: session?.user ?? null,
    accessToken: session?.accessToken ?? null,
    setSession(next) { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); setSessionState(next) },
    updateUser(user) {
      setSessionState(current => {
        if (!current) return current
        const next = { ...current, user }; localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); return next
      })
    },
    logout() { localStorage.removeItem(STORAGE_KEY); setSessionState(null) },
  }), [session])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used within AuthProvider')
  return value
}
