import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { clearAuth, getAuth, setAuth } from '@/lib/auth'
import { admin } from '@/lib/api-client'
import type { AdminLoginRequest } from '@/types/api'

interface AuthContextValue {
  isAuthenticated: boolean
  isLoading: boolean
  token: string | null
  role: string | null
  username: string | null
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
  const [role, setRole] = useState<string | null>(null)
  const [username, setUsername] = useState<string | null>(null)
  const [isLoading, setLoading] = useState(true)

  useEffect(() => {
    const auth = getAuth()
    setToken(auth.isAuthenticated ? auth.token : null)
    setRole(auth.role ?? null)
    setUsername(auth.username ?? null)
    setLoading(false)
  }, [])

  const login = async (req: AdminLoginRequest) => {
    const resp = await admin.login(req)
    setAuth({ token: resp.token, expiresAt: resp.expiresAt, expiresIn: resp.expiresIn, role: resp.role, username: resp.username })
    setToken(resp.token)
    setRole(resp.role ?? null)
    setUsername(resp.username ?? null)
  }

  const logout = () => {
    clearAuth()
    setToken(null)
    setRole(null)
    setUsername(null)
  }

  const value = useMemo(
    () => ({
      isAuthenticated: !!token,
      isLoading,
      token,
      role,
      username,
      login,
      logout,
    }),
    [token, role, username, isLoading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
