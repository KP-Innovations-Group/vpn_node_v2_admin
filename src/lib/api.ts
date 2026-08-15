import type { ApiErrorBody, SimpleError } from '@/types/api'
import { getBearerToken } from '@/lib/auth'

export class ApiError extends Error {
  readonly status: number
  readonly body: ApiErrorBody | string

  constructor(status: number, body: ApiErrorBody | string) {
    let message: string
    if (typeof body === 'string') {
      message = body
    } else if ('error' in body) {
      const err = (body as SimpleError).error
      if (typeof err === 'string') {
        message = err
      } else if (err && typeof err === 'object' && 'message' in err) {
        message = (err as { message: string }).message
      } else {
        message = 'An error occurred'
      }
    } else {
      message = JSON.stringify(body)
    }
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

export interface RequestOptions extends RequestInit {
  skipAuth?: boolean
}

// In dev the Vite proxy forwards /api to the local node, so a relative base
// works. In production (e.g. Vercel) requests must go to the real node origin,
// which is provided via VITE_API_ORIGIN at build time.
const nodeOrigin = import.meta.env.VITE_API_ORIGIN || ''
export const API_BASE: string =
  nodeOrigin && import.meta.env.MODE === 'production' ? `${nodeOrigin}/api/v1` : '/api/v1'

export async function apiFetch<T>(
  input: string,
  options: RequestOptions = {},
): Promise<T> {
  const url = input.startsWith('http') ? input : `${API_BASE}${input}`
  const headers = new Headers(options.headers)

  if (!options.skipAuth) {
    const token = getBearerToken()
    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }
  }

  headers.set('Content-Type', 'application/json')

  const response = await fetch(url, { ...options, headers })

  if (!response.ok) {
    let body: ApiErrorBody | string
    const text = await response.text()
    try {
      body = JSON.parse(text)
    } catch {
      body = text || response.statusText
    }
    throw new ApiError(response.status, body)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}
