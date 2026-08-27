export type Creator = string // admin username, super_admin, brain, etc.

export type ConfigType = 'vless' | 'vless-xhttp'

export interface ConfigResponse {
  uuid: string
  email: string
  quotaLimitBytes: number
  quotaUsedBytes: number
  expireAt: string
  isEnabled: boolean
  isDeleted: boolean
  configType: ConfigType
  vlessConfig?: string
  creator: Creator
  createdAt: string
  updatedAt: string
  connectionAllowed: number
  remark?: string
}

export interface ConfigResponseList {
  configs: ConfigResponse[]
  count: number
}

export interface ConfigCreateRequest {
  email: string
  quotaLimit: number
  expirationTime: string
  initialQuotaUsedBytes?: number
  connectionAllowed?: number
  remark?: string
}

export interface ConfigUUIDRequest {
  uuid: string
}

export interface ConfigIncreaseRequest {
  uuid: string
  increaseBytes: number
}

export interface ConfigConnectionLimitRequest {
  uuid: string
  connectionAllowed: number
}

export interface SubscriptionConfigResponse {
  vlessConfig: string
  quotaLimitBytes: number
  quotaUsedBytes: number
  isEnabled: boolean
}

export interface SubscriptionConfigsResponse {
  subscriptionUUID: string
  configs: SubscriptionConfigResponse[]
}

export interface SubscriptionResponse {
  uuid: string
  title: string
  description: string
  creator: Creator
  subscriptionLinkUrl: string
  subscriptionBaseURL: string
  configs: ConfigResponse[]
  createdAt: string
  updatedAt: string
}

export interface SubscriptionResponseList {
  subscriptions: SubscriptionResponse[]
  count: number
}

export interface SubscriptionCreateRequest {
  title: string
  description: string
  configUUIDs: string[]
  subscriptionBaseURL: string
  newConfigs?: Array<{
    email: string
    quotaLimit: number
    expirationTime: string
    connectionAllowed?: number
    remark?: string
    configType: ConfigType
  }>
}

export interface SubscriptionUpdateRequest {
  uuid: string
  title?: string
  description?: string
  subscriptionBaseURL?: string
  addConfigUUIDs?: string[]
  removeConfigUUIDs?: string[]
}

export interface SubscriptionUUIDRequest {
  uuid: string
}

export interface AdminLoginRequest {
  username: string
  password: string
}

export interface AdminLoginResponse {
  token: string
  tokenType: 'Bearer'
  expiresAt: string
  expiresIn: number
  role: string
  username: string
}

export interface AdminInfo {
  username: string
  role: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface AdminListResponse {
  admins: AdminInfo[]
  count: number
}

export interface AdminCreateRequest {
  username: string
  password: string
  role?: 'admin' | 'super_admin'
}

export interface HealthHeartBeatResponse {
  status: string
  uptimeSec: number
  cpuPercent: number
  ramPercent: number
  nodeId: string
  currentUsers: number
  totalTrafficUsed: number
}

export interface HealthDetailsResponse extends HealthHeartBeatResponse {
  system: {
    ramTotalBytes: number
    diskUsedPercent: number
    diskTotalBytes: number
    load1: number
    goroutines: number
    goVersion: string
  }
  xray: {
    version: string
    uptimeSec: number
    inbounds: Array<{ tag: string; protocol: string; listen: string }>
  }
}

// stats/summary — GET /api/v1/stats/summary (internal/dto/stats.go:6)
export interface StatsSummaryResponse {
  node: {
    nodeId: string
    version: string
    xrayVersion: string
    startedAt: string
    uptimeSec: number
  }
  system: {
    cpuPercent: number
    ramPercent: number
    ramTotalBytes: number
    diskUsedPercent: number
    diskTotalBytes: number
    load1: number
    goroutines: number
  }
  traffic: {
    last24hBytes: number
    last7dBytes: number
    todayBytes: number
  }
  fleet: {
    totalConfigs: number
    active: number
    disabled: number
    deleted: number
    expired: number
    expiringIn7d: number
    byType: Record<string, number>
    quotaUsedBytes: number
    quotaLimitBytes: number
    avgQuotaUsedPct: number
  }
  subscriptions: {
    count: number
    totalAttachedConfigs: number
  }
  live: {
    onlineUsers: number
    activeConnections: number
  }
}

export interface TrafficPoint {
  bucketStart: string
  uploadBytes: number
  downloadBytes: number
  totalBytes: number
}

export interface TrafficHistoryResponse {
  range: string
  granularity: string
  points: TrafficPoint[]
  totalBytes: number
}

export interface TopConsumer {
  uuid: string
  email: string
  configType: string
  quotaUsedBytes: number
  quotaLimitBytes: number
  expireAt: string
  isEnabled: boolean
  recentTraffic?: number
  remark?: string
}

export interface TopConsumersResponse {
  consumers: TopConsumer[]
}

export interface ExpiringResponse {
  configs: ConfigResponse[]
  count: number
}

export interface XrayStatsResponse {
  running: boolean
  version: string
  inbounds: Array<{ tag: string; protocol: string; listen: string }>
  outbounds: number
  activeUsers: number
}

export interface OnlineEntry {
  uuid: string
  email: string
  configType: string
  isEnabled: boolean
  isOnline: boolean
  activeConnections: number
  lastSeen?: string
  remoteIPs?: string[]
  quotaUsedBytes: number
  quotaLimitBytes: number
  remark?: string
}

export interface OnlineResponse {
  total: number
  onlineCount: number
  entries: OnlineEntry[]
  generatedAt: string
}

export interface ErrorBody {
  code: number
  message: string
  status: string
  details?: Array<Record<string, unknown>>
}

export interface ErrorResponse {
  error: ErrorBody
}

export interface SimpleError {
  error: string
}

export type ApiErrorBody = ErrorResponse | SimpleError

export interface PaginatedQuery {
  page?: number
  pageSize?: number
  order?: 'asc' | 'desc'
}
