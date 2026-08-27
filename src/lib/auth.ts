const TOKEN_KEY = 'vpn_node_admin_token'
const TOKEN_TYPE_KEY = 'vpn_node_admin_token_type'
const EXPIRES_AT_KEY = 'vpn_node_admin_expires_at'
const ROLE_KEY = 'vpn_node_admin_role'
const USERNAME_KEY = 'vpn_node_admin_username'

export interface StoredAuth {
  token: string
  expiresAt: string
  expiresIn: number
  role?: string
  username?: string
}

export interface AuthState {
  token: string | null
  expiresAt: string | null
  isAuthenticated: boolean
  role: string | null
  username: string | null
}

export function setAuth(auth: StoredAuth): void {
  localStorage.setItem(TOKEN_KEY, auth.token)
  localStorage.setItem(TOKEN_TYPE_KEY, 'Bearer')
  localStorage.setItem(EXPIRES_AT_KEY, auth.expiresAt)
  if (auth.role) localStorage.setItem(ROLE_KEY, auth.role)
  if (auth.username) localStorage.setItem(USERNAME_KEY, auth.username)
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(TOKEN_TYPE_KEY)
  localStorage.removeItem(EXPIRES_AT_KEY)
  localStorage.removeItem(ROLE_KEY)
  localStorage.removeItem(USERNAME_KEY)
}

export function getAuth(): AuthState {
  const token = localStorage.getItem(TOKEN_KEY)
  const expiresAt = localStorage.getItem(EXPIRES_AT_KEY)
  const role = localStorage.getItem(ROLE_KEY)
  const username = localStorage.getItem(USERNAME_KEY)

  if (!token || !expiresAt) {
    return { token: null, expiresAt: null, isAuthenticated: false, role: role ?? null, username: username ?? null }
  }

  const expired = Date.now() >= new Date(expiresAt).getTime() - 60_000

  return {
    token,
    expiresAt,
    isAuthenticated: !expired,
    role: role ?? null,
    username: username ?? null,
  }
}

export function getRole(): string | null {
  return localStorage.getItem(ROLE_KEY)
}
export function getUsername(): string | null {
  return localStorage.getItem(USERNAME_KEY)
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
