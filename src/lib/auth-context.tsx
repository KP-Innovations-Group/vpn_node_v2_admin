import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { clearAuth, getAuth, setAuth } from '@/lib/auth'
import { admin } from '@/lib/api-client'
import type { AdminLoginRequest } from '@/types/api'

interface AuthContextValue {
  isAuthenticated: boolean
  isLoading: boolean
  token: string | null
  login: (req: AdminLoginRequest) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setLoading] = useState(true)

  useEffect(() => {
    const auth = getAuth()
    setToken(auth.isAuthenticated ? auth.token : null)
    setLoading(false)
  }, [])

  const login = async (req: AdminLoginRequest) => {
    const resp = await admin.login(req)
    setAuth({ token: resp.token, expiresAt: resp.expiresAt, expiresIn: resp.expiresIn })
    setToken(resp.token)
  }

  const logout = () => {
    clearAuth()
    setToken(null)
  }

  const value = useMemo(
    () => ({
      isAuthenticated: !!token,
      isLoading,
      token,
      login,
      logout,
    }),
    [token, isLoading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
