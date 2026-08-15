export type Creator = 'admin' | 'brain'

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
