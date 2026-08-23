import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ApiError, configs, health, subscriptions } from '@/lib/api-client'
import { useToast } from '@/lib/useToast'
import { formatBytes } from '@/lib/utils'

export function DashboardPage() {
  const toast = useToast()
  const [now, setNow] = useState(Date.now())

  const { data, error, isLoading, refetch, isFetching, dataUpdatedAt } = useQuery({
    queryKey: ['heartbeat'],
    queryFn: () => health.heartbeat(),
    refetchInterval: 30_000,
  })

  const { data: cfgData } = useQuery({
    queryKey: ['configs', 'dashboard-summary'],
    queryFn: () => configs.list({ page: 1, pageSize: 500, order: 'desc' }),
    refetchInterval: 30_000,
  })

  const { data: subData } = useQuery({
    queryKey: ['subscriptions', 'dashboard-summary'],
    queryFn: () => subscriptions.list({ page: 1, pageSize: 100, order: 'desc' }),
    refetchInterval: 30_000,
  })

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (error) {
      toast.error(error instanceof ApiError ? error.message : 'Failed to load heartbeat', 'Error')
    }
  }, [error, toast])

  const lastUpdated = useMemo(() => {
    if (!dataUpdatedAt) return '—'
    const diff = Math.floor((now - dataUpdatedAt) / 1000)
    if (diff < 5) return 'just now'
    if (diff < 60) return `${diff}s ago`
    return new Date(dataUpdatedAt).toLocaleTimeString()
  }, [dataUpdatedAt, now])

  const fleet = useMemo(() => {
    if (!cfgData) return null
    const list = cfgData.configs ?? []
    const total = cfgData.count
    const active = list.filter((c) => c.isEnabled && !c.isDeleted).length
    const disabled = list.filter((c) => !c.isEnabled && !c.isDeleted).length
    const expiringSoon = list.filter((c) => {
      const t = new Date(c.expireAt).getTime()
      return !Number.isNaN(t) && t - Date.now() < 7 * 86400 * 1000 && t > Date.now()
    }).length
    const expired = list.filter((c) => new Date(c.expireAt).getTime() < Date.now() && !c.isDeleted).length
    const quotaUsed = list.reduce((a, c) => a + (c.quotaUsedBytes || 0), 0)
    const quotaLimit = list.reduce((a, c) => a + (c.quotaLimitBytes || 0), 0)
    const byXhttp = list.filter((c) => c.configType === 'vless-xhttp').length
    const byVless = list.filter((c) => c.configType === 'vless').length
    const sampled = list.length
    const isSampled = total > sampled
    return { total, active, disabled, expiringSoon, expired, quotaUsed, quotaLimit, byXhttp, byVless, isSampled, sampled }
  }, [cfgData])

  const quotaPct = fleet && fleet.quotaLimit > 0 ? Math.min(100, (fleet.quotaUsed / fleet.quotaLimit) * 100) : 0

  return (
    <div className="space-y-6">
      {/* header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Node overview</h2>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 shadow-sm">
              <span className={`h-2 w-2 rounded-full ${data?.status === 'ok' ? 'bg-emerald-500 animate-pulseSoft' : 'bg-amber-500'}`} />
              {data?.status ?? '—'} • {lastUpdated}
            </span>
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-2.5 py-1 text-white">
              Auto-refresh 30s
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/configs"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Manage configs
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </Link>
          <button
            onClick={() => refetch()}
            disabled={isLoading || isFetching}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-primary-600 to-primary-700 px-4 py-2 text-xs font-semibold text-white shadow-glow hover:from-primary-700 hover:to-primary-800 disabled:opacity-60"
          >
            <svg className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5M4 19a9 9 0 015-15.2M20 5a9 9 0 01-5 15.2" />
            </svg>
            {isFetching ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* hero row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* status hero */}
        <div className="relative overflow-hidden rounded-[20px] border border-white bg-gradient-to-br from-slate-900 via-slate-800 to-primary-900 p-5 text-white shadow-card lg:col-span-5">
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-accent-600/20 blur-3xl" />
          <div className="relative">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-semibold tracking-widest text-white/60">SYSTEM STATUS</p>
                <div className="mt-2 flex items-center gap-3">
                  <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${data?.status === 'ok' ? 'bg-emerald-500' : 'bg-amber-500'} shadow-lg`}>
                    <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={data?.status === 'ok' ? 'M5 13l4 4L19 7' : 'M12 8v4m0 4h.01'} />
                    </svg>
                  </span>
                  <div>
                    <p className="text-lg font-bold leading-none capitalize">{data?.status ?? '—'}</p>
                    <p className="text-xs font-medium text-white/70">All systems operational</p>
                  </div>
                </div>
              </div>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold ring-1 ring-white/15">Single node</span>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3">
              <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/10 backdrop-blur">
                <p className="text-[11px] font-semibold tracking-widest text-white/60">UPTIME</p>
                <p className="mt-1 font-mono text-sm font-bold">{data ? formatUptime(data.uptimeSec) : '—'}</p>
                <p className="text-[11px] text-white/60">{data ? `${Math.floor(data.uptimeSec / 86400)} days` : '—'}</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/10 backdrop-blur">
                <p className="text-[11px] font-semibold tracking-widest text-white/60">NODE ID</p>
                <p className="mt-1 truncate font-mono text-xs font-bold" title={data?.nodeId}>
                  {data?.nodeId ? `${data.nodeId.slice(0, 8)}…` : '—'}
                </p>
                <button
                  onClick={() => data?.nodeId && navigator.clipboard.writeText(data.nodeId)}
                  className="mt-1 text-[11px] font-medium text-white/70 hover:text-white"
                >
                  Copy full ↗
                </button>
              </div>
              <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/10 backdrop-blur">
                <p className="text-[11px] font-semibold tracking-widest text-white/60">TRAFFIC 24H</p>
                <p className="mt-1 text-sm font-bold">{data ? formatBytes(data.totalTrafficUsed) : '—'}</p>
                <p className="text-[11px] text-white/60">from heartbeat</p>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 text-[11px] font-medium text-white/70">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 ring-1 ring-white/10">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Xray active
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 ring-1 ring-white/10">
                Quota gate • Conn gate
              </span>
            </div>
          </div>
        </div>

        {/* resource gauges */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:col-span-7">
          <GaugeCard
            label="CPU"
            value={data?.cpuPercent ?? 0}
            icon={<CpuIcon />}
            gradient="from-primary-600 to-accent-600"
            isLoading={isLoading}
          />
          <GaugeCard
            label="RAM"
            value={data?.ramPercent ?? 0}
            icon={<RamIcon />}
            gradient="from-violet-600 to-primary-600"
            isLoading={isLoading}
          />
          <div className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-soft sm:col-span-1">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold tracking-widest text-slate-500">TRAFFIC</p>
              <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[11px] font-bold text-white">24H</span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <p className="text-2xl font-bold tracking-tight text-slate-900">{data ? formatBytes(data.totalTrafficUsed) : '—'}</p>
            </div>
            <p className="text-xs font-medium text-slate-500">Total up+down • 10-min buckets</p>
            <div className="mt-4 h-2 rounded-full bg-slate-100">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-primary-600 to-accent-600 transition-all"
                style={{ width: data ? `${Math.min(100, (data.totalTrafficUsed / (50 * 1024 ** 3)) * 100)}%` : '0%' }}
              />
            </div>
            <p className="mt-2 text-[11px] font-medium text-slate-400">Visual cap 50 GB • live sum from traffic_usage10m</p>
            <Link to="/configs" className="mt-3 inline-flex w-full items-center justify-center gap-1 rounded-xl bg-slate-900 py-2 text-xs font-semibold text-white hover:bg-slate-800">
              View configs
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </Link>
          </div>
        </div>
      </div>

      {/* fleet overview */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="rounded-[20px] border border-slate-200 bg-white p-5 shadow-soft lg:col-span-8">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold tracking-tight text-slate-900">Fleet overview</h3>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
              {subData ? `${subData.count} subscriptions` : '—'} • {fleet ? `${fleet.total} configs` : '…'}
            </span>
          </div>

          {!fleet ? (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-[92px] animate-pulse rounded-2xl bg-slate-100" />
              ))}
            </div>
          ) : (
            <>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <FleetStat label="Total" value={fleet.total} sub={`${fleet.byVless} VLESS • ${fleet.byXhttp} XHTTP`} tone="slate" />
                <FleetStat label="Active" value={fleet.active} sub={`${fleet.total ? Math.round((fleet.active / fleet.total) * 100) : 0}% of fleet`} tone="emerald" />
                <FleetStat label="Disabled" value={fleet.disabled} sub="needs attention" tone="amber" />
                <FleetStat label="Expired" value={fleet.expired} sub={`${fleet.expiringSoon} expiring 7d`} tone="rose" />
              </div>

              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-700">Quota consumption {fleet.isSampled && <span className="font-normal text-slate-500">• sample {fleet.sampled}/{fleet.total}</span>}</p>
                  <p className="font-mono text-xs font-bold text-slate-900">{formatBytes(fleet.quotaUsed)} / {formatBytes(fleet.quotaLimit)}</p>
                </div>
                <div className="mt-3 h-2.5 rounded-full bg-white ring-1 ring-slate-200">
                  <div
                    className={`h-2.5 rounded-full transition-all ${quotaPct > 88 ? 'bg-gradient-to-r from-amber-500 to-rose-500' : quotaPct > 65 ? 'bg-gradient-to-r from-primary-500 to-amber-500' : 'bg-gradient-to-r from-primary-600 to-accent-600'}`}
                    style={{ width: `${quotaPct}%` }}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] font-medium text-slate-500">
                  <span>{quotaPct.toFixed(1)}% used</span>
                  <span>{formatBytes(Math.max(0, fleet.quotaLimit - fleet.quotaUsed))} remaining</span>
                </div>
                {fleet.isSampled && (
                  <p className="mt-2 text-[11px] text-amber-700">Showing first {fleet.sampled} configs — for exact totals add a <code className="rounded bg-white px-1 py-0.5 ring-1 ring-slate-200">GET /api/v1/stats/summary</code> endpoint.</p>
                )}
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Link to="/configs" className="rounded-2xl border border-slate-200 bg-white p-3 hover:bg-slate-50">
                  <p className="text-xs font-semibold text-slate-900">Browse configs →</p>
                  <p className="text-xs text-slate-500">Filter by type, status, quota</p>
                </Link>
                <Link to="/subscriptions" className="rounded-2xl border border-slate-200 bg-white p-3 hover:bg-slate-50">
                  <p className="text-xs font-semibold text-slate-900">Subscriptions →</p>
                  <p className="text-xs text-slate-500">{subData?.count ?? 0} bundles • manage attachments</p>
                </Link>
                <a href="/swagger" target="_blank" rel="noreferrer" className="rounded-2xl border border-primary-200 bg-primary-50 p-3 hover:bg-primary-100">
                  <p className="text-xs font-semibold text-primary-900">API reference →</p>
                  <p className="text-xs text-primary-700">XHTTP, quota, heartbeat</p>
                </a>
              </div>
            </>
          )}
        </div>

        {/* system / quick actions */}
        <div className="space-y-4 lg:col-span-4">
          <div className="rounded-[20px] border border-slate-200 bg-white p-5 shadow-soft">
            <h3 className="text-sm font-bold tracking-tight text-slate-900">Quick actions</h3>
            <div className="mt-4 space-y-2">
              <Link to="/configs" className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 hover:bg-white">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600 text-white">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                </span>
                <span>
                  <span className="block text-xs font-semibold text-slate-900">Create config</span>
                  <span className="block text-xs text-slate-500">VLESS / VLESS-XHTTP</span>
                </span>
              </Link>
              <Link to="/subscriptions" className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 hover:bg-slate-50">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                </span>
                <span>
                  <span className="block text-xs font-semibold text-slate-900">New subscription</span>
                  <span className="block text-xs text-slate-500">Bundle configs for users</span>
                </span>
              </Link>
              <a href="/swagger" target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 hover:bg-slate-50">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-600 text-white">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                </span>
                <span>
                  <span className="block text-xs font-semibold text-slate-900">Open Swagger</span>
                  <span className="block text-xs text-slate-500">Explore backend API</span>
                </span>
              </a>
            </div>
          </div>

          <div className="rounded-[20px] border border-slate-200 bg-gradient-to-br from-primary-600 to-accent-600 p-5 text-white shadow-glow">
            <h3 className="text-sm font-bold">Single-node tip</h3>
            <p className="mt-1 text-xs leading-relaxed text-white/80">
              This panel is scoped to <span className="font-semibold text-white">one edge node</span>. Heartbeat is at <code className="rounded bg-white/15 px-1 py-0.5 font-mono text-[11px]">/health/heartbeat</code> (no auth prefix).
              For a complete ops view add the stats APIs proposed below.
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-medium ring-1 ring-white/20">Gopsutil live</span>
              <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-medium ring-1 ring-white/20">Traffic 10m buckets</span>
            </div>
          </div>
        </div>
      </div>

      {!data && !isLoading && (
        <div className="rounded-[20px] border border-amber-200 bg-amber-50 p-6 text-center">
          <p className="text-sm font-semibold text-amber-900">No heartbeat data available</p>
          <p className="mx-auto mt-1 max-w-xl text-xs leading-relaxed text-amber-800">
            The node didn’t respond. Check that <code className="rounded bg-white px-1 py-0.5 font-mono ring-1 ring-amber-200">/health/heartbeat</code> is reachable and
            <code className="ml-1 rounded bg-white px-1 py-0.5 font-mono ring-1 ring-amber-200">VITE_API_ORIGIN</code> is correct.
          </p>
        </div>
      )}
    </div>
  )
}

function FleetStat({ label, value, sub, tone }: { label: string; value: number | string; sub: string; tone: 'slate' | 'emerald' | 'amber' | 'rose' }) {
  const toneMap: Record<string, string> = {
    slate: 'bg-slate-900 text-white',
    emerald: 'bg-emerald-600 text-white',
    amber: 'bg-amber-500 text-white',
    rose: 'bg-rose-600 text-white',
  }
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold tracking-widest text-slate-500">{label}</p>
        <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${toneMap[tone]}`}>{String(value).length > 3 ? '•' : String(value).slice(0, 1)}</span>
      </div>
      <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
      <p className="text-xs font-medium text-slate-500">{sub}</p>
    </div>
  )
}

function GaugeCard({
  label,
  value,
  icon,
  gradient,
  isLoading,
}: {
  label: string
  value: number
  icon: React.ReactNode
  gradient: string
  isLoading: boolean
}) {
  const pct = Math.max(0, Math.min(100, value))
  const dash = 2 * Math.PI * 46
  const offset = dash - (pct / 100) * dash
  const tone = pct > 85 ? 'text-rose-600' : pct > 65 ? 'text-amber-600' : 'text-primary-600'
  return (
    <div className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-soft">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold tracking-widest text-slate-500">{label}</p>
        <span className={`rounded-full bg-slate-900 px-2.5 py-1 text-[11px] font-bold text-white ${isLoading ? 'opacity-60' : ''}`}>{pct.toFixed(1)}%</span>
      </div>
      <div className="relative mx-auto mt-3 flex h-[132px] w-[132px] items-center justify-center">
        <svg className="h-[132px] w-[132px] -rotate-90" viewBox="0 0 110 110">
          <circle cx="55" cy="55" r="46" stroke="#f1f5f9" strokeWidth="10" fill="none" />
          <circle
            cx="55"
            cy="55"
            r="46"
            stroke="url(#grad)"
            strokeWidth="10"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={dash}
            strokeDashoffset={offset}
            className="transition-all duration-700"
          />
          <defs>
            <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4f46e5" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className={`flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-white shadow-sm`}>{icon}</span>
          <span className={`mt-2 font-mono text-lg font-bold ${tone}`}>{pct.toFixed(0)}%</span>
          <span className="text-[11px] font-medium text-slate-500">{label} usage</span>
        </div>
      </div>
      <div className="mt-2 h-1.5 rounded-full bg-slate-100">
        <div className={`h-1.5 rounded-full bg-gradient-to-r ${gradient}`} style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-2 text-center text-[11px] font-medium text-slate-400">gopsutil • live from node</p>
    </div>
  )
}

const CpuIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <rect x="7" y="7" width="10" height="10" rx="2" strokeWidth={1.8} />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 7V5M12 19v-2M7 12H5m14 0h-2M8 8l-1.5-1.5M16 8l1.5-1.5M8 16l-1.5 1.5M16 16l1.5 1.5" />
  </svg>
)
const RamIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 7h16M4 17h16M7 7v10M17 7v10M9 10h6M9 14h6" />
  </svg>
)

function formatUptime(sec: number): string {
  if (!sec && sec !== 0) return '—'
  if (sec < 60) return `${Math.floor(sec)}s`
  const d = Math.floor(sec / 86400)
  const h = Math.floor((sec % 86400) / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const parts: string[] = []
  if (d) parts.push(`${d}d`)
  if (h || d) parts.push(`${h}h`)
  if (m || h || d) parts.push(`${m}m`)
  if (!d && !h) parts.push(`${Math.floor(sec % 60)}s`)
  return parts.join(' ')
}
