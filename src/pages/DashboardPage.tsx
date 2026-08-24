import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ApiError, health, stats } from '@/lib/api-client'
import { useToast } from '@/lib/useToast'
import { formatBytes } from '@/lib/utils'

export function DashboardPage() {
  const toast = useToast()
  const [now, setNow] = useState(Date.now())

  const {
    data: heartbeat,
    error: hbError,
    isLoading: hbLoading,
  } = useQuery({
    queryKey: ['heartbeat'],
    queryFn: () => health.heartbeat(),
    refetchInterval: 30_000,
  })

  const {
    data: summary,
    error: sumError,
    isLoading: sumLoading,
    isFetching: sumFetching,
    dataUpdatedAt,
    refetch,
  } = useQuery({
    queryKey: ['stats', 'summary'],
    queryFn: () => stats.summary(),
    refetchInterval: 30_000,
  })

  const { data: traffic } = useQuery({
    queryKey: ['stats', 'traffic', '7d'],
    queryFn: () => stats.traffic('7d'),
    refetchInterval: 60_000,
  })

  const { data: top } = useQuery({
    queryKey: ['stats', 'top-consumers'],
    queryFn: () => stats.topConsumers({ limit: 5, sort: 'quotaUsed' }),
    refetchInterval: 30_000,
  })

  const { data: expiring } = useQuery({
    queryKey: ['stats', 'expiring'],
    queryFn: () => stats.expiring('7d', 5),
    refetchInterval: 60_000,
  })

  const { data: details } = useQuery({
    queryKey: ['health', 'details'],
    queryFn: () => health.details(),
    refetchInterval: 30_000,
  })

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const err = sumError || hbError
    if (err) toast.error(err instanceof ApiError ? err.message : 'Failed to load stats', 'Error')
  }, [sumError, hbError, toast])

  const lastUpdated = useMemo(() => {
    if (!dataUpdatedAt) return '—'
    const diff = Math.floor((now - dataUpdatedAt) / 1000)
    if (diff < 5) return 'just now'
    if (diff < 60) return `${diff}s ago`
    return new Date(dataUpdatedAt).toLocaleTimeString()
  }, [dataUpdatedAt, now])

  const isLoading = sumLoading && hbLoading

  // Prefer summary, fallback to heartbeat for system fields
  const nodeId = summary?.node.nodeId ?? heartbeat?.nodeId ?? '—'
  const uptimeSec = summary?.node.uptimeSec ?? heartbeat?.uptimeSec ?? 0
  const cpu = summary?.system.cpuPercent ?? heartbeat?.cpuPercent ?? 0
  const ram = summary?.system.ramPercent ?? heartbeat?.ramPercent ?? 0
  const status = summary ? 'ok' : (heartbeat?.status ?? '—')
  const traffic24h = summary?.traffic.last24hBytes ?? heartbeat?.totalTrafficUsed ?? 0
  const isOk = status === 'ok'

  const fleet = summary?.fleet
  const subs = summary?.subscriptions
  const live = summary?.live

  const quotaPct = fleet && fleet.quotaLimitBytes > 0 ? Math.min(100, (fleet.quotaUsedBytes / fleet.quotaLimitBytes) * 100) : 0

  return (
    <div className="space-y-6">
      {/* header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Node overview</h2>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 shadow-sm">
              <span className={`h-2 w-2 rounded-full ${isOk ? 'bg-emerald-500 animate-pulseSoft' : 'bg-amber-500'}`} />
              {status} • {lastUpdated}
            </span>
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-2.5 py-1 text-white">
              Auto-refresh
            </span>
            {summary?.node.version && (
              <span className="hidden sm:inline-flex rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs">v{summary.node.version}</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            disabled={isLoading || sumFetching}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-primary-600 to-primary-700 px-4 py-2 text-xs font-semibold text-white shadow-glow hover:from-primary-700 hover:to-primary-800 disabled:opacity-60"
          >
            <svg className={`h-4 w-4 ${sumFetching ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5M4 19a9 9 0 015-15.2M20 5a9 9 0 01-5 15.2" />
            </svg>
            {sumFetching ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* hero + gauges */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="relative overflow-hidden rounded-[20px] border border-white bg-gradient-to-br from-slate-900 via-slate-800 to-primary-900 p-5 text-white shadow-card lg:col-span-5">
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-accent-600/20 blur-3xl" />
          <div className="relative">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-semibold tracking-widest text-white/60">SYSTEM STATUS</p>
                <div className="mt-2 flex items-center gap-3">
                  <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${isOk ? 'bg-emerald-500' : 'bg-amber-500'} shadow-lg`}>
                    <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isOk ? 'M5 13l4 4L19 7' : 'M12 8v4m0 4h.01'} />
                    </svg>
                  </span>
                  <div>
                    <p className="text-lg font-bold leading-none capitalize">{status}</p>
                    <p className="text-xs font-medium text-white/70">
                      {live ? `${live.onlineUsers} online • ${live.activeConnections} conns` : heartbeat ? `${heartbeat.currentUsers} online` : '—'}
                    </p>
                  </div>
                </div>
              </div>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold ring-1 ring-white/15">
                {summary?.node.xrayVersion ? `Xray ${summary.node.xrayVersion}` : details?.xray.version ? `Xray ${details.xray.version}` : 'Single node'}
              </span>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3">
              <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/10 backdrop-blur">
                <p className="text-[11px] font-semibold tracking-widest text-white/60">UPTIME</p>
                <p className="mt-1 font-mono text-sm font-bold">{formatUptime(uptimeSec)}</p>
                <p className="text-[11px] text-white/60">{uptimeSec ? `${Math.floor(uptimeSec / 86400)} days` : '—'}</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/10 backdrop-blur">
                <p className="text-[11px] font-semibold tracking-widest text-white/60">NODE ID</p>
                <p className="mt-1 truncate font-mono text-xs font-bold" title={nodeId}>
                  {nodeId !== '—' ? `${nodeId.slice(0, 8)}…` : '—'}
                </p>
                <button
                  onClick={() => nodeId !== '—' && navigator.clipboard.writeText(nodeId)}
                  className="mt-1 text-[11px] font-medium text-white/70 hover:text-white"
                >
                  Copy full ↗
                </button>
              </div>
              <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/10 backdrop-blur">
                <p className="text-[11px] font-semibold tracking-widest text-white/60">TRAFFIC 24H</p>
                <p className="mt-1 text-sm font-bold">{formatBytes(traffic24h)}</p>
                <p className="text-[11px] text-white/60">{summary ? `${formatBytes(summary.traffic.todayBytes)} today` : 'from heartbeat'}</p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] font-medium text-white/70">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 ring-1 ring-white/10">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Xray {details?.xray.inbounds.length ?? 0} inbounds
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 ring-1 ring-white/10">
                {details?.system.goVersion ?? summary?.system.goroutines != null ? `${details?.system.goVersion ?? ''} • ${summary?.system.goroutines ?? details?.system.goroutines ?? 0} gr` : 'Quota • Conn gate'}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:col-span-7">
          <GaugeCard label="CPU" value={cpu} icon={<CpuIcon />} gradient="from-primary-600 to-accent-600" isLoading={isLoading} />
          <GaugeCard label="RAM" value={ram} icon={<RamIcon />} gradient="from-violet-600 to-primary-600" isLoading={isLoading} />
          <GaugeCard
            label="DISK"
            value={summary?.system.diskUsedPercent ?? details?.system.diskUsedPercent ?? 0}
            icon={<DiskIcon />}
            gradient="from-amber-500 to-rose-500"
            isLoading={isLoading}
            sub={summary?.system.diskTotalBytes ? formatBytes(summary.system.diskTotalBytes) + ' total' : undefined}
          />
        </div>
      </div>

      {/* traffic sparkline + fleet */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="rounded-[20px] border border-slate-200 bg-white p-5 shadow-soft dark:border-slate-800 dark:bg-slate-900 lg:col-span-8">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">Fleet overview</h3>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {subs ? `${subs.count} subs • ${subs.totalAttachedConfigs} attached` : '—'} • {fleet ? `${fleet.totalConfigs} configs` : '…'}
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
                <FleetStat label="Total" value={fleet.totalConfigs} sub={`${fleet.byType['vless'] ?? 0} VLESS • ${fleet.byType['vless-xhttp'] ?? 0} XHTTP`} tone="slate" />
                <FleetStat label="Active" value={fleet.active} sub={`${fleet.totalConfigs ? Math.round((fleet.active / fleet.totalConfigs) * 100) : 0}% of fleet`} tone="emerald" />
                <FleetStat label="Disabled" value={fleet.disabled} sub={`${fleet.deleted} deleted`} tone="amber" />
                <FleetStat label="Expired" value={fleet.expired} sub={`${fleet.expiringIn7d} expiring 7d`} tone="rose" />
              </div>

              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-700">Quota consumption</p>
                  <p className="font-mono text-xs font-bold text-slate-900">{formatBytes(fleet.quotaUsedBytes)} / {formatBytes(fleet.quotaLimitBytes)}</p>
                </div>
                <div className="mt-3 h-2.5 rounded-full bg-white ring-1 ring-slate-200">
                  <div
                    className={`h-2.5 rounded-full transition-all ${quotaPct > 88 ? 'bg-gradient-to-r from-amber-500 to-rose-500' : quotaPct > 65 ? 'bg-gradient-to-r from-primary-500 to-amber-500' : 'bg-gradient-to-r from-primary-600 to-accent-600'}`}
                    style={{ width: `${quotaPct}%` }}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] font-medium text-slate-500">
                  <span>{quotaPct.toFixed(1)}% used • {fleet.avgQuotaUsedPct.toFixed(1)}% avg</span>
                  <span>{formatBytes(Math.max(0, fleet.quotaLimitBytes - fleet.quotaUsedBytes))} remaining</span>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-3">
                  <p className="text-[11px] font-semibold tracking-widest text-slate-500">LOAD / GOROUTINES</p>
                  <p className="mt-1 text-sm font-bold text-slate-900">{summary?.system.load1?.toFixed(2) ?? details?.system.load1?.toFixed(2) ?? '—'} load1</p>
                  <p className="text-xs text-slate-500">{summary?.system.goroutines ?? details?.system.goroutines ?? '—'} goroutines • {formatBytes(summary?.system.ramTotalBytes ?? details?.system.ramTotalBytes ?? 0)} RAM</p>
                </div>
                <Link to="/subscriptions" className="rounded-2xl border border-slate-200 bg-white p-3 hover:bg-slate-50">
                  <p className="text-xs font-semibold text-slate-900">Subscriptions →</p>
                  <p className="text-xs text-slate-500">{subs?.count ?? 0} bundles • {subs?.totalAttachedConfigs ?? 0} attached configs</p>
                </Link>
                <div className="rounded-2xl border border-slate-200 bg-white p-3">
                  <p className="text-xs font-semibold text-slate-900">Overview</p>
                  <p className="text-xs text-slate-500">{fleet.totalConfigs} configs • {subs?.count ?? 0} subscriptions</p>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="rounded-[20px] border border-slate-200 bg-white p-5 shadow-soft lg:col-span-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold tracking-tight text-slate-900">Traffic — 7d</h3>
            <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[11px] font-bold text-white">{traffic?.granularity ?? '—'}</span>
          </div>
          <p className="mt-1 text-xs font-medium text-slate-500">
            {traffic ? `${formatBytes(traffic.totalBytes)} total` : 'Loading usage…'}
          </p>
          <div className="mt-4 h-[96px] rounded-xl bg-slate-50 ring-1 ring-slate-200">
            {traffic?.points?.length ? <Sparkline points={traffic.points} /> : <div className="flex h-full items-center justify-center text-xs text-slate-400">No data</div>}
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-slate-50 p-2 ring-1 ring-slate-200">
              <p className="text-[11px] font-semibold tracking-widest text-slate-500">TODAY</p>
              <p className="font-mono text-xs font-bold text-slate-900">{summary ? formatBytes(summary.traffic.todayBytes) : '—'}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-2 ring-1 ring-slate-200">
              <p className="text-[11px] font-semibold tracking-widest text-slate-500">24H</p>
              <p className="font-mono text-xs font-bold text-slate-900">{summary ? formatBytes(summary.traffic.last24hBytes) : '—'}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-2 ring-1 ring-slate-200">
              <p className="text-[11px] font-semibold tracking-widest text-slate-500">7D</p>
              <p className="font-mono text-xs font-bold text-slate-900">{summary ? formatBytes(summary.traffic.last7dBytes) : '—'}</p>
            </div>
          </div>
          <p className="mt-2 text-[11px] font-medium text-slate-400">Updated every minute</p>
        </div>
      </div>

      {/* top consumers + expiring + xray */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="rounded-[20px] border border-slate-200 bg-white p-5 shadow-soft lg:col-span-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold tracking-tight text-slate-900">Top consumers</h3>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">by quotaUsed</span>
          </div>
          {!top?.consumers?.length ? (
            <p className="mt-4 text-center text-xs text-slate-500">No consumers</p>
          ) : (
            <ul className="mt-4 divide-y divide-slate-100">
              {top.consumers.map((c) => {
                const pct = c.quotaLimitBytes > 0 ? Math.min(100, (c.quotaUsedBytes / c.quotaLimitBytes) * 100) : 0
                return (
                  <li key={c.uuid} className="flex items-center gap-3 py-3">
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white ${c.configType === 'vless-xhttp' ? 'bg-accent-600' : 'bg-primary-600'}`}>
                      {c.email.slice(0, 1).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-slate-900">{c.email} <span className="font-normal text-slate-500">• {c.configType}</span></p>
                      <div className="mt-1 h-1.5 rounded-full bg-slate-100">
                        <div className="h-1.5 rounded-full bg-primary-600" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <span className="shrink-0 font-mono text-xs font-bold text-slate-700">{formatBytes(c.quotaUsedBytes)}<span className="font-normal text-slate-500"> / {formatBytes(c.quotaLimitBytes)}</span></span>
                  </li>
                )
              })}
            </ul>
          )}
          <Link to="/configs" className="mt-3 inline-flex w-full items-center justify-center rounded-xl border border-slate-200 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">View all configs →</Link>
        </div>

        <div className="rounded-[20px] border border-slate-200 bg-white p-5 shadow-soft lg:col-span-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold tracking-tight text-slate-900">Expiring soon</h3>
            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">within 7d • {expiring?.count ?? 0}</span>
          </div>
          {!expiring?.configs?.length ? (
            <p className="mt-4 text-center text-xs text-slate-500">No configs expiring within 7 days</p>
          ) : (
            <ul className="mt-4 divide-y divide-slate-100">
              {expiring.configs.map((c) => (
                <li key={c.uuid} className="flex items-center justify-between py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-slate-900">{c.email}</p>
                    <p className="text-xs text-slate-500">{new Date(c.expireAt).toLocaleDateString()} • {c.isEnabled ? 'active' : 'disabled'}</p>
                  </div>
                  <span className="ml-2 shrink-0 rounded-full bg-slate-900 px-2.5 py-1 font-mono text-xs font-bold text-white">{formatBytes(c.quotaUsedBytes)} / {formatBytes(c.quotaLimitBytes)}</span>
                </li>
              ))}
            </ul>
          )}
          {fleet && fleet.expiringIn7d > (expiring?.configs.length ?? 0) && (
            <p className="mt-2 text-center text-[11px] font-medium text-slate-500">+{fleet.expiringIn7d - (expiring?.configs.length ?? 0)} more expiring soon</p>
          )}
        </div>
      </div>

      {/* system + xray details */}
      {details && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="rounded-[20px] border border-slate-200 bg-white p-5 shadow-soft lg:col-span-8">
            <h3 className="text-sm font-bold tracking-tight text-slate-900">System details</h3>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Detail label="RAM" value={`${details.system.ramTotalBytes ? formatBytes(details.system.ramTotalBytes) : '—'} total`} sub={`${ram.toFixed(1)}% used`} />
              <Detail label="Disk" value={`${details.system.diskTotalBytes ? formatBytes(details.system.diskTotalBytes) : '—'} total`} sub={`${details.system.diskUsedPercent.toFixed(1)}% used`} />
              <Detail label="Go" value={details.system.goVersion} sub={`${details.system.goroutines} goroutines`} />
              <Detail label="Load1" value={details.system.load1.toFixed(2)} sub={`${summary?.system.goroutines ?? details.system.goroutines} gr total`} />
            </div>
          </div>
          <div className="rounded-[20px] border border-slate-200 bg-slate-900 p-5 text-white shadow-card lg:col-span-4">
            <h3 className="text-sm font-bold">Xray</h3>
            <p className="mt-1 text-xs text-white/70">{details.xray.version ? `v${details.xray.version}` : '—'} • {details.xray.uptimeSec ? formatUptime(details.xray.uptimeSec) + ' up' : '—'}</p>
            <ul className="mt-3 space-y-1.5">
              {details.xray.inbounds.map((ib) => (
                <li key={ib.tag} className="flex items-center justify-between rounded-xl bg-white/10 px-3 py-2 text-xs ring-1 ring-white/10">
                  <span className="font-semibold">{ib.tag}</span>
                  <span className="font-mono text-white/70">{ib.protocol} • {ib.listen}</span>
                </li>
              ))}
              {!details.xray.inbounds.length && <li className="text-xs text-white/60">No inbounds reported</li>}
            </ul>
          </div>
        </div>
      )}

      {!summary && !isLoading && (
        <div className="rounded-[20px] border border-amber-200 bg-amber-50 p-6 text-center">
          <p className="text-sm font-semibold text-amber-900">Stats unavailable</p>
          <p className="mx-auto mt-1 max-w-xl text-xs leading-relaxed text-amber-800">
            Couldn’t load the latest stats. Please refresh or check your connection.
          </p>
        </div>
      )}
    </div>
  )
}

function Detail({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-[11px] font-semibold tracking-widest text-slate-500">{label}</p>
      <p className="mt-1 text-xs font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500">{sub}</p>
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
  sub,
}: {
  label: string
  value: number
  icon: React.ReactNode
  gradient: string
  isLoading: boolean
  sub?: string
}) {
  const pct = Math.max(0, Math.min(100, value))
  const dash = 2 * Math.PI * 46
  const offset = dash - (pct / 100) * dash
  const tone = pct > 85 ? 'text-rose-600' : pct > 65 ? 'text-amber-600' : 'text-primary-600'
  const gid = `grad-${label.toLowerCase()}`
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
            stroke={`url(#${gid})`}
            strokeWidth="10"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={dash}
            strokeDashoffset={offset}
            className="transition-all duration-700"
          />
          <defs>
            <linearGradient id={gid} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4f46e5" />
              <stop offset="100%" stopColor={label === 'DISK' ? '#f59e0b' : '#a855f7'} />
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
      <p className="mt-2 text-center text-[11px] font-medium text-slate-400">{sub ?? 'gopsutil • live from node'}</p>
    </div>
  )
}

function Sparkline({ points }: { points: { totalBytes: number }[] }) {
  const vals = points.map((p) => p.totalBytes)
  const max = Math.max(...vals, 1)
  const min = Math.min(...vals)
  const range = max - min || 1
  const w = 320
  const h = 80
  const step = w / Math.max(1, vals.length - 1)
  const d = vals
    .map((v, i) => {
      const x = i * step
      const y = h - 8 - ((v - min) / range) * (h - 24)
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
    })
    .join(' ')
  const area = `${d} L ${w} ${h} L 0 ${h} Z`
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-full w-full">
      <path d={area} fill="url(#sparkFill)" opacity={0.15} />
      <path d={d} fill="none" stroke="#4f46e5" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      <defs>
        <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.4} />
          <stop offset="100%" stopColor="#4f46e5" stopOpacity={0} />
        </linearGradient>
      </defs>
    </svg>
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
const DiskIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 7a5 5 0 015 5 5 5 0 01-5 5 5 5 0 01-5-5 5 5 0 015-5z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 12V7M9 9l3-2 3 2" />
    <circle cx="12" cy="12" r="8" strokeWidth={1.8} />
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
