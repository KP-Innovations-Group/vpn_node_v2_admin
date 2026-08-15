const TOKEN_KEY = 'vpn_node_admin_token'
const TOKEN_TYPE_KEY = 'vpn_node_admin_token_type'
const EXPIRES_AT_KEY = 'vpn_node_admin_expires_at'

export interface StoredAuth {
  token: string
  expiresAt: string
  expiresIn: number
}

export interface AuthState {
  token: string | null
  expiresAt: string | null
  isAuthenticated: boolean
}

export function setAuth(auth: StoredAuth): void {
  localStorage.setItem(TOKEN_KEY, auth.token)
  localStorage.setItem(TOKEN_TYPE_KEY, 'Bearer')
  localStorage.setItem(EXPIRES_AT_KEY, auth.expiresAt)
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(TOKEN_TYPE_KEY)
  localStorage.removeItem(EXPIRES_AT_KEY)
}

export function getAuth(): AuthState {
  const token = localStorage.getItem(TOKEN_KEY)
  const expiresAt = localStorage.getItem(EXPIRES_AT_KEY)

  if (!token || !expiresAt) {
    return { token: null, expiresAt: null, isAuthenticated: false }
  }

  const expired = Date.now() >= new Date(expiresAt).getTime() - 60_000

  return {
    token,
    expiresAt,
    isAuthenticated: !expired,
  }
}

export function getBearerToken(): string | null {
  const { token, isAuthenticated } = getAuth()
  return isAuthenticated ? token : null
}

export function isTokenExpiringSoon(thresholdMs = 5 * 60_000): boolean {
  const { token, expiresAt } = getAuth()
  if (!token || !expiresAt) return false
  return new Date(expiresAt).getTime() - Date.now() < thresholdMs
}
