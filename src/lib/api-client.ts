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
  ExpiringResponse,
  HealthDetailsResponse,
  HealthHeartBeatResponse,
  OnlineResponse,
  PaginatedQuery,
  StatsSummaryResponse,
  SubscriptionCreateRequest,
  SubscriptionResponse,
  SubscriptionResponseList,
  SubscriptionUpdateRequest,
  SubscriptionUUIDRequest,
  TopConsumersResponse,
  TrafficHistoryResponse,
  XrayStatsResponse,
} from '@/types/api'

export const admin = {
  login: (req: AdminLoginRequest): Promise<AdminLoginResponse> =>
    apiFetch<AdminLoginResponse>('/admin/login', { method: 'POST', body: JSON.stringify(req) }),
  create: (req: import('@/types/api').AdminCreateRequest): Promise<import('@/types/api').AdminInfo> =>
    apiFetch<import('@/types/api').AdminInfo>('/admin/create', { method: 'POST', body: JSON.stringify(req) }),
  list: (): Promise<import('@/types/api').AdminListResponse> => apiFetch<import('@/types/api').AdminListResponse>('/admin/list'),
  me: (): Promise<import('@/types/api').AdminInfo> => apiFetch<import('@/types/api').AdminInfo>('/admin/me'),
  delete: (username: string): Promise<void> =>
    apiFetch<void>('/admin/delete', { method: 'DELETE', body: JSON.stringify({ username }) }),
  update: (req: import('@/types/api').AdminUpdateRequest): Promise<import('@/types/api').AdminInfo> =>
    apiFetch<import('@/types/api').AdminInfo>('/admin/update', { method: 'PATCH', body: JSON.stringify(req) }),
  permissions: (): Promise<import('@/types/api').PermissionsResponse> =>
    apiFetch<import('@/types/api').PermissionsResponse>('/admin/permissions'),
  getPermissions: (username: string): Promise<{ username: string; role: string; permissions: string[] }> =>
    apiFetch<{ username: string; role: string; permissions: string[] }>(`/admin/${encodeURIComponent(username)}/permissions`),
  setPermissions: (username: string, permissions: string[]): Promise<{ permissions: string[] }> =>
    apiFetch<{ permissions: string[] }>(`/admin/${encodeURIComponent(username)}/permissions`, { method: 'PUT', body: JSON.stringify({ username, permissions }) }),
}

export const configs = {
  list: (query?: PaginatedQuery & { status?: string; creator?: string; q?: string }): Promise<ConfigResponseList> => {
    const params = new URLSearchParams()
    if (query?.page) params.set('page', String(query.page))
    if (query?.pageSize) params.set('pageSize', String(query.pageSize))
    if (query?.order) params.set('order', query.order)
    if (query?.status) params.set('status', query.status)
    if (query?.creator) params.set('creator', query.creator)
    if (query?.q?.trim()) params.set('q', query.q.trim().slice(0, 100))
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
  list: (query?: PaginatedQuery & { creator?: string; q?: string }): Promise<SubscriptionResponseList> => {
    const params = new URLSearchParams()
    if (query?.page) params.set('page', String(query.page))
    if (query?.pageSize) params.set('pageSize', String(query.pageSize))
    if (query?.order) params.set('order', query.order)
    if (query?.creator) params.set('creator', query.creator)
    if (query?.q?.trim()) params.set('q', query.q.trim().slice(0, 100))
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
      { rawPath: true },
    )
  },
  details: (): Promise<HealthDetailsResponse> =>
    apiFetch<HealthDetailsResponse>('/health/details', { rawPath: true }),
}

export const stats = {
  summary: (): Promise<StatsSummaryResponse> => apiFetch<StatsSummaryResponse>('/stats/summary'),
  traffic: (range: '24h' | '7d' | '30d' = '7d', granularity?: '10m' | '1h' | '1d'): Promise<TrafficHistoryResponse> => {
    const params = new URLSearchParams()
    params.set('range', range)
    if (granularity) params.set('granularity', granularity)
    const qs = params.toString()
    return apiFetch<TrafficHistoryResponse>(`/stats/traffic${qs ? `?${qs}` : ''}`)
  },
  topConsumers: (opts?: { limit?: number; sort?: 'quotaUsed' | 'traffic'; range?: string }): Promise<TopConsumersResponse> => {
    const params = new URLSearchParams()
    if (opts?.limit) params.set('limit', String(opts.limit))
    if (opts?.sort) params.set('sort', opts.sort)
    if (opts?.range) params.set('range', opts.range)
    const qs = params.toString()
    return apiFetch<TopConsumersResponse>(`/stats/top-consumers${qs ? `?${qs}` : ''}`)
  },
  expiring: (within: '24h' | '7d' | '14d' | '30d' = '7d', limit = 20): Promise<ExpiringResponse> => {
    const params = new URLSearchParams()
    params.set('within', within)
    params.set('limit', String(limit))
    return apiFetch<ExpiringResponse>(`/stats/expiring?${params.toString()}`)
  },
  xray: (): Promise<XrayStatsResponse> => apiFetch<XrayStatsResponse>('/stats/xray'),
  online: (params?: { includeIdle?: boolean; limit?: number; offset?: number; sort?: 'connected' | 'lastSeen' | 'email' }): Promise<OnlineResponse> => {
    const qs = new URLSearchParams()
    if (params?.includeIdle) qs.set('includeIdle', 'true')
    if (params?.limit) qs.set('limit', String(params.limit))
    if (params?.offset) qs.set('offset', String(params.offset))
    if (params?.sort) qs.set('sort', params.sort)
    const s = qs.toString()
    return apiFetch<OnlineResponse>(`/stats/online${s ? `?${s}` : ''}`)
  },
}

export { ApiError } from '@/lib/api'

export function isApiError(err: unknown): err is ErrorResponse {
  return err instanceof Error && 'status' in err
}
