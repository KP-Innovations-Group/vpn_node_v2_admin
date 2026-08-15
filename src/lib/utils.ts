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

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(1024))
  const val = bytes / Math.pow(1024, i)
  return `${val.toFixed(i === 0 ? 0 : 2)} ${units[i]}`
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
