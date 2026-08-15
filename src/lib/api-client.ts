import { apiFetch } from '@/lib/api'
import type {
  AdminLoginRequest,
  AdminLoginResponse,
  ConfigConnectionLimitRequest,
  ConfigCreateRequest,
  ConfigIncreaseRequest,
  ConfigResponse,
  ConfigResponseList,
  ConfigUUIDRequest,
  ErrorResponse,
  HealthHeartBeatResponse,
  PaginatedQuery,
  SubscriptionCreateRequest,
  SubscriptionResponse,
  SubscriptionResponseList,
  SubscriptionUpdateRequest,
  SubscriptionUUIDRequest,
} from '@/types/api'

export const admin = {
  login: (req: AdminLoginRequest): Promise<AdminLoginResponse> =>
    apiFetch<AdminLoginResponse>('/admin/login', { method: 'POST', body: JSON.stringify(req) }),
}

export const configs = {
  list: (query?: PaginatedQuery): Promise<ConfigResponseList> => {
    const params = new URLSearchParams()
    if (query?.page) params.set('page', String(query.page))
    if (query?.pageSize) params.set('pageSize', String(query.pageSize))
    if (query?.order) params.set('order', query.order)
    const qs = params.toString()
    return apiFetch<ConfigResponseList>(`/config/list${qs ? `?${qs}` : ''}`)
  },

  get: (uuid: string): Promise<ConfigResponse> => apiFetch<ConfigResponse>(`/config/${encodeURIComponent(uuid)}`),

  create: (req: ConfigCreateRequest, xhttp = false): Promise<ConfigResponse> =>
    apiFetch<ConfigResponse>(xhttp ? '/config/create-xhttp' : '/config/create', {
      method: 'POST',
      body: JSON.stringify(req),
    }),

  enable: (uuid: string): Promise<void> =>
    apiFetch<void>('/config/enable', { method: 'PATCH', body: JSON.stringify({ uuid } as ConfigUUIDRequest) }),

  disable: (uuid: string): Promise<void> =>
    apiFetch<void>('/config/disable', { method: 'PATCH', body: JSON.stringify({ uuid } as ConfigUUIDRequest) }),

  increaseQuota: (uuid: string, increaseBytes: number): Promise<void> =>
    apiFetch<void>('/config/increase', {
      method: 'PATCH',
      body: JSON.stringify({ uuid, increaseBytes } as ConfigIncreaseRequest),
    }),

  setConnectionAllowed: (uuid: string, connectionAllowed: number): Promise<void> =>
    apiFetch<void>('/config/connection-allowed', {
      method: 'PATCH',
      body: JSON.stringify({ uuid, connectionAllowed } as ConfigConnectionLimitRequest),
    }),

  delete: (uuid: string): Promise<void> =>
    apiFetch<void>('/config/delete', { method: 'DELETE', body: JSON.stringify({ uuid } as ConfigUUIDRequest) }),
}

export const subscriptions = {
  list: (query?: PaginatedQuery): Promise<SubscriptionResponseList> => {
    const params = new URLSearchParams()
    if (query?.page) params.set('page', String(query.page))
    if (query?.pageSize) params.set('pageSize', String(query.pageSize))
    if (query?.order) params.set('order', query.order)
    const qs = params.toString()
    return apiFetch<SubscriptionResponseList>(
      `/subscription/list${qs ? `?${qs}` : ''}`,
    )
  },

  get: (uuid: string): Promise<SubscriptionResponse> =>
    apiFetch<SubscriptionResponse>(`/subscription/${encodeURIComponent(uuid)}`),

  create: (req: SubscriptionCreateRequest): Promise<SubscriptionResponse> =>
    apiFetch<SubscriptionResponse>('/subscription/create', {
      method: 'POST',
      body: JSON.stringify(req),
    }),

  update: (req: SubscriptionUpdateRequest): Promise<SubscriptionResponse> =>
    apiFetch<SubscriptionResponse>('/subscription/update', {
      method: 'PATCH',
      body: JSON.stringify(req),
    }),

  delete: (uuid: string): Promise<void> =>
    apiFetch<void>('/subscription/delete', {
      method: 'DELETE',
      body: JSON.stringify({ uuid } as SubscriptionUUIDRequest),
    }),
}

export const health = {
  check: (): Promise<{ status: string }> => apiFetch<{ status: string }>('/health/health', { skipAuth: true }),
  heartbeat: (from?: string): Promise<HealthHeartBeatResponse> => {
    const params = new URLSearchParams()
    if (from) params.set('from', from)
    const qs = params.toString()
    return apiFetch<HealthHeartBeatResponse>(
      `/health/heartbeat${qs ? `?${qs}` : ''}`,
    )
  },
}

export { ApiError } from '@/lib/api'

export function isApiError(err: unknown): err is ErrorResponse {
  return err instanceof Error && 'status' in err
}
