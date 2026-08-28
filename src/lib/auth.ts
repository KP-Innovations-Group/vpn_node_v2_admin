const TOKEN_KEY = 'vpn_node_admin_token'
const TOKEN_TYPE_KEY = 'vpn_node_admin_token_type'
const EXPIRES_AT_KEY = 'vpn_node_admin_expires_at'
const ROLE_KEY = 'vpn_node_admin_role'
const USERNAME_KEY = 'vpn_node_admin_username'
const PERMS_KEY = 'vpn_node_admin_permissions'

export interface StoredAuth {
  token: string
  expiresAt: string
  expiresIn: number
  role?: string
  username?: string
  permissions?: string[]
}

export interface AuthState {
  token: string | null
  expiresAt: string | null
  isAuthenticated: boolean
  role: string | null
  username: string | null
  permissions: string[]
}

export function setAuth(auth: StoredAuth): void {
  localStorage.setItem(TOKEN_KEY, auth.token)
  localStorage.setItem(TOKEN_TYPE_KEY, 'Bearer')
  localStorage.setItem(EXPIRES_AT_KEY, auth.expiresAt)
  if (auth.role) localStorage.setItem(ROLE_KEY, auth.role)
  if (auth.username) localStorage.setItem(USERNAME_KEY, auth.username)
  if (auth.permissions) localStorage.setItem(PERMS_KEY, JSON.stringify(auth.permissions))
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(TOKEN_TYPE_KEY)
  localStorage.removeItem(EXPIRES_AT_KEY)
  localStorage.removeItem(ROLE_KEY)
  localStorage.removeItem(USERNAME_KEY)
  localStorage.removeItem(PERMS_KEY)
}

function getStoredPerms(): string[] {
  try {
    const raw = localStorage.getItem(PERMS_KEY)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

export function getAuth(): AuthState {
  const token = localStorage.getItem(TOKEN_KEY)
  const expiresAt = localStorage.getItem(EXPIRES_AT_KEY)
  const role = localStorage.getItem(ROLE_KEY)
  const username = localStorage.getItem(USERNAME_KEY)
  const permissions = getStoredPerms()

  if (!token || !expiresAt) {
    return { token: null, expiresAt: null, isAuthenticated: false, role: role ?? null, username: username ?? null, permissions }
  }

  const expired = Date.now() >= new Date(expiresAt).getTime() - 60_000

  return {
    token,
    expiresAt,
    isAuthenticated: !expired,
    role: role ?? null,
    username: username ?? null,
    permissions,
  }
}

export function getRole(): string | null {
  return localStorage.getItem(ROLE_KEY)
}
export function getUsername(): string | null {
  return localStorage.getItem(USERNAME_KEY)
}
export function getPermissions(): string[] {
  return getStoredPerms()
}
export function hasPermission(perm: string): boolean {
  const perms = getStoredPerms()
  // super_admin implicitly has all
  if (getRole() === 'super_admin') return true
  return perms.includes(perm)
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
