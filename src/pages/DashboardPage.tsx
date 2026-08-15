import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ApiError, health } from '@/lib/api-client'
import { useToast } from '@/lib/useToast'
import { formatBytes } from '@/lib/utils'

interface MetricCardProps {
  label: string
  value: string
  icon: React.ReactNode
}

export function DashboardPage() {
  const toast = useToast()
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ['heartbeat'],
    queryFn: () => health.heartbeat(),
    refetchInterval: 30_000,
  })

  useEffect(() => {
    if (error) {
      toast.error(
        error instanceof ApiError ? error.message : 'Failed to load heartbeat',
        'Error',
      )
    }
  }, [error, toast])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">Node Dashboard</h2>
        <button
          onClick={() => refetch()}
          disabled={isLoading}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-60"
        >
          {isLoading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {data && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <MetricCard label="Status" value={data.status} icon={statusIcon(data.status)} />
          <MetricCard label="Node ID" value={data.nodeId} icon={nodeIcon} />
          <MetricCard label="Uptime" value={formatUptime(data.uptimeSec)} icon={uptimeIcon} />
          <MetricCard label="CPU" value={`${data.cpuPercent.toFixed(1)}%`} icon={cpuIcon} />
          <MetricCard label="RAM" value={`${data.ramPercent.toFixed(1)}%`} icon={ramIcon} />
          <MetricCard label="Traffic (24h)" value={formatBytes(data.totalTrafficUsed)} icon={trafficIcon} />
        </div>
      )}

      {!data && !isLoading && (
        <div className="rounded-md border border-gray-200 bg-white p-6 text-center text-gray-500">
          No heartbeat data available.
        </div>
      )}
    </div>
  )
}

function MetricCard({ label, value, icon }: MetricCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-center gap-2 text-gray-500">{icon}</div>
      <div className="mt-2 text-2xl font-semibold text-gray-800">{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  )
}

const statusIcon = (s: string) => (
  <svg className={`h-5 w-5 ${s === 'ok' ? 'text-green-500' : 'text-red-500'}`} fill="currentColor" viewBox="0 0 24 24">
    {s === 'ok' ? (
      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
    ) : (
      <path d="M19.74 19L12 11.26 4.26 19 2.82 17.56 11.26 9 3.26 4.26 4.84 2.85 12 11.24 19.16 2.85 20.74 4.26 12.84 9 19.74 17.56z" />
    )}
  </svg>
)

const nodeIcon = <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 18.004a9 9 0 1112.728 0" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14v4l3-3" /></svg>

const uptimeIcon = <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 7v5l3 3" /></svg>

const cpuIcon = <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h.01M15 12h.01M9 16h.01M15 16h.01M9 8h.01M15 8h.01M8 5a4 4 0 11-4 4 4 4 0 014-4zm8 0a4 4 0 11-4 4 4 4 0 014-4z" /></svg>

const ramIcon = <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 20h16M4 4h16v16a2 2 0 002 2h-2" /></svg>

const trafficIcon = <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 9h10a2 2 0 012 2v7a2 2 0 01-2 2H7a2 2 0 01-2-2v-7a2 2 0 012-2z" /></svg>

function formatUptime(sec: number): string {
  if (!sec) return '0s'
  const d = Math.floor(sec / 86400)
  const h = Math.floor((sec % 86400) / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = Math.floor(sec % 60)
  const parts = []
  if (d) parts.push(`${d}d`)
  if (h || d) parts.push(`${h}h`)
  if (m || h || d) parts.push(`${m}m`)
  parts.push(`${s}s`)
  return parts.join(' ')
}
