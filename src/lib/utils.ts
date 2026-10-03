export function formatDate(iso: string): string {
  if (!iso) return '-'
  try {
    const date = new Date(iso)
    if (Number.isNaN(date.getTime())) return iso
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

export function isExpired(expireAt: string): boolean {
  if (!expireAt) return true
  try {
    return new Date(expireAt).getTime() < Date.now()
  } catch {
    return false
  }
}

/**
 * Whether a config has an expiration at all. The node stores an absent expiry as the
 * zero time, which arrives as `0001-01-01T00:00:00Z` — a real instant in year 1, so
 * `isExpired` alone reports such a config as long expired. The node's own rule is
 * "the zero time means no expiry, not expired in year 1", so anything before 2000 is
 * read as unset. Callers need this *before* `isExpired`, since a zero time is
 * technically in the past.
 */
export function hasExpiry(expireAt: string): boolean {
  if (!expireAt) return false
  const date = new Date(expireAt)
  if (Number.isNaN(date.getTime())) return false
  return date.getUTCFullYear() >= 2000
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(1024))
  const val = bytes / Math.pow(1024, i)
  return `${val.toFixed(i === 0 ? 0 : 2)} ${units[i]}`
}

// 1 GiB. The panel's "GB" is binary everywhere it renders or converts one —
// `formatBytes` divides by 1024 and `ConfigForm` converts with `1024 ** 3` — so the
// GB an operator types into the decrease modal is the same GB the quota card shows.
export const ONE_GB = 1024 ** 3

export interface QuotaDecreaseCheck {
  /** Whether the node is expected to accept this decrease. */
  ok: boolean
  /** What the quota limit would become, in bytes. */
  newLimitBytes: number
  /** Why it would be refused — blocking. */
  reason?: string
  /** A consequence worth showing even when the change is allowed — non-blocking. */
  warning?: string
}

/**
 * Pre-checks a decrease against the rules the node enforces in
 * `NextQuotaAfterDecrease` (internal/service/quota.go), so the panel can explain a
 * refusal instead of only surfacing the 400. The node stays the authority.
 */
export function nextQuotaAfterDecrease(
  limitBytes: number,
  usedBytes: number,
  decreaseBytes: number,
): QuotaDecreaseCheck {
  if (!Number.isFinite(decreaseBytes) || decreaseBytes <= 0) {
    return { ok: false, newLimitBytes: limitBytes, reason: 'Enter an amount greater than zero.' }
  }

  if (limitBytes <= 0) {
    return {
      ok: false,
      newLimitBytes: limitBytes,
      reason: 'This config has no quota limit (0 means unlimited), so there is nothing to decrease.',
    }
  }

  // Nothing can be subtracted from a config already at or over its limit: every
  // candidate result would sit below what it has already used. Worth saying plainly,
  // because being over quota is exactly when an operator reaches for a decrease.
  if (usedBytes >= limitBytes) {
    return {
      ok: false,
      newLimitBytes: limitBytes,
      reason: `This config has already used ${formatBytes(usedBytes)} of its ${formatBytes(limitBytes)} quota, so no decrease is possible.`,
    }
  }

  const newLimitBytes = limitBytes - decreaseBytes

  // Subtracting the whole quota lands on 0, which this model reads as "unlimited" —
  // the opposite of what a decrease asks for.
  if (newLimitBytes <= 0) {
    return {
      ok: false,
      newLimitBytes,
      reason: `That would leave ${newLimitBytes} bytes. A quota of 0 means unlimited, so the whole ${formatBytes(limitBytes)} cannot be subtracted.`,
    }
  }

  // Landing exactly on current usage is allowed and meaningful: the node's limiter
  // disables the config on its next run. Falling below it is not.
  if (newLimitBytes < usedBytes) {
    return {
      ok: false,
      newLimitBytes,
      reason: `That would leave ${formatBytes(newLimitBytes)}, below the ${formatBytes(usedBytes)} already used; the lowest quota allowed here is ${formatBytes(usedBytes)}.`,
    }
  }

  return {
    ok: true,
    newLimitBytes,
    warning:
      newLimitBytes === usedBytes
        ? 'This sets the limit exactly at current usage, so the node will disable this config on its next limiter run (within a minute).'
        : undefined,
  }
}

/**
 * The node's cap on how far ahead an expiration may be set (`maxExpiryHorizon` in
 * internal/service/expiry.go): 10 * 365 days — a typo guard, not a policy on long
 * subscriptions.
 */
export const MAX_EXPIRY_HORIZON_MS = 10 * 365 * 24 * 60 * 60 * 1000

export interface ExpireCheck {
  /** Whether the node is expected to accept this instant. */
  ok: boolean
  /** The instant that would be stored — UTC, truncated to whole seconds. Present when `ok`. */
  newExpireAt?: Date
  /** Why it would be refused — blocking. */
  reason?: string
}

/**
 * Formats an instant for a `datetime-local` input, which reads and writes *local*
 * wall-clock time at minute precision. Accepts a Date or the node's RFC3339 string,
 * and returns '' when there is no expiry to show.
 */
export function toDateTimeLocalValue(input: Date | string): string {
  const date = typeof input === 'string' ? (hasExpiry(input) ? new Date(input) : null) : input
  if (!date || Number.isNaN(date.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/**
 * Adds whole months, clamping the day to the target month's length so 31 Jan + 1
 * month is 28/29 Feb rather than overflowing into March. The plain `setMonth` the
 * create form uses does overflow, which silently grants days nobody asked for.
 */
export function addMonthsClamped(from: Date, months: number): Date {
  const day = from.getDate()
  const target = new Date(from.getTime())
  target.setDate(1) // move the month with no day present to overflow first
  target.setMonth(target.getMonth() + months)
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate()
  target.setDate(Math.min(day, lastDay))
  return target
}

/**
 * Mirrors `NextExpireAt` in the node's internal/service/expiry.go so the panel can
 * explain a refusal before the request is made. The order matches the node and
 * matters: truncate to whole seconds FIRST, then require the result to be strictly in
 * the future, then apply the horizon — truncating after comparing could bless a
 * proposal that lands in the past once stored. The node stays the authority and
 * compares against its own clock, so a proposal only seconds ahead can still be
 * refused on a skewed clock; the caller surfaces that message too.
 */
export function nextExpireAtCheck(now: Date, proposed: Date | null): ExpireCheck {
  if (!proposed || Number.isNaN(proposed.getTime())) {
    return { ok: false, reason: 'Pick a date and time.' }
  }

  const nowMs = now.getTime()
  const nextMs = Math.floor(proposed.getTime() / 1000) * 1000
  const newExpireAt = new Date(nextMs)

  if (!(nextMs > nowMs)) {
    return {
      ok: false,
      newExpireAt,
      reason: `That instant is not in the future (it is now ${formatDate(now.toISOString())}). A date that has passed would disable this config within a minute.`,
    }
  }

  if (nextMs > nowMs + MAX_EXPIRY_HORIZON_MS) {
    return {
      ok: false,
      newExpireAt,
      reason: `That is more than 10 years away (${formatDate(newExpireAt.toISOString())}), which is almost certainly a mistyped year.`,
    }
  }

  return { ok: true, newExpireAt }
}

export function formatPercent(part: number, total: number): string {
  if (total === 0) return '0%'
  const pct = (part / total) * 100
  return `${pct.toFixed(1)}%`
}

export function relativeTime(iso: string): string {
  if (!iso) return '-'
  try {
    const date = new Date(iso)
    if (Number.isNaN(date.getTime())) return iso
    const diff = date.getTime() - Date.now()
    const abs = Math.abs(diff)
    const sec = Math.floor(abs / 1000)
    if (sec < 60) return diff > 0 ? 'in a few seconds' : 'a few seconds ago'
    const min = Math.floor(sec / 60)
    if (min < 60) return diff > 0 ? `in ${min} min` : `${min} min ago`
    const hr = Math.floor(min / 60)
    if (hr < 24) return diff > 0 ? `in ${hr} h` : `${hr} h ago`
    const day = Math.floor(hr / 24)
    return diff > 0 ? `in ${day} d` : `${day} d ago`
  } catch {
    return iso
  }
}
