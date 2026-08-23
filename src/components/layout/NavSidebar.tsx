import { NavLink, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { health, stats } from '@/lib/api-client'

interface NavItem {
  label: string
  to: string
  icon: React.ReactNode
  desc: string
}

const items: NavItem[] = [
  {
    label: 'Dashboard',
    to: '/dashboard',
    desc: 'Overview',
    icon: (
      <svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13h8V3H3v10zM13 21h8V11h-8v10zM13 3v6h8V3zM3 21h8v-6H3v6z" />
      </svg>
    ),
  },
  {
    label: 'Configs',
    to: '/configs',
    desc: 'VLESS keys',
    icon: (
      <svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V9z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M14 3v5h5M10 13h6M10 17h6M10 9h2" />
      </svg>
    ),
  },
  {
    label: 'Subscriptions',
    to: '/subscriptions',
    desc: 'Bundles',
    icon: (
      <svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
  },
]

export function NavSidebar() {
  const { pathname } = useLocation()
  const { data } = useQuery({
    queryKey: ['heartbeat'],
    queryFn: () => health.heartbeat(),
    refetchInterval: 30_000,
    retry: false,
  })
  const { data: summary } = useQuery({
    queryKey: ['stats', 'summary'],
    queryFn: () => stats.summary(),
    refetchInterval: 30_000,
    retry: false,
  })

  const isOk = (summary ? true : data?.status === 'ok')
  const nodeId = summary?.node.nodeId ?? data?.nodeId
  const cpu = summary?.system.cpuPercent ?? data?.cpuPercent
  const ram = summary?.system.ramPercent ?? data?.ramPercent

  return (
    <aside className="hidden w-[272px] shrink-0 flex-col border-r border-slate-200/70 bg-white/80 backdrop-blur-xl md:flex">
      {/* brand */}
      <div className="flex h-[64px] items-center gap-3 border-b border-slate-200/70 px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-600 to-accent-600 shadow-glow text-white">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div className="min-w-0">
          <div className="text-[13px] font-bold tracking-tight text-slate-900 leading-none">VPN NODE</div>
          <div className="text-[11px] font-semibold tracking-widest text-primary-600">ADMIN • SINGLE</div>
        </div>
        <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600">
          <span className={`h-2 w-2 rounded-full ${isOk ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulseSoft' : 'bg-amber-500'}`} />
          {isOk ? 'Live' : '—'}
        </span>
      </div>

      {/* nav */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <p className="px-2 pb-2 text-[11px] font-semibold tracking-widest text-slate-400">NAVIGATION</p>
        <ul className="space-y-1">
          {items.map((item) => {
            const active = pathname.startsWith(item.to)
            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all ${
                    active
                      ? 'bg-gradient-to-br from-primary-600 to-primary-700 text-white shadow-glow'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                      active ? 'bg-white/15 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-slate-700'
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`block text-[13px] font-semibold leading-none ${active ? 'text-white' : 'text-slate-800'}`}>{item.label}</span>
                    <span className={`block text-[11px] font-medium ${active ? 'text-white/70' : 'text-slate-400'}`}>{item.desc}</span>
                  </span>
                  <svg
                    className={`h-4 w-4 shrink-0 transition ${active ? 'text-white/60' : 'text-slate-300 group-hover:text-slate-400'}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </NavLink>
              </li>
            )
          })}
        </ul>

        {/* node mini card */}
        <div className="mt-6 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4 shadow-soft">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold tracking-widest text-slate-400">NODE</p>
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200">single</span>
          </div>
          <p className="mt-2 truncate font-mono text-xs font-medium text-slate-700" title={nodeId}>
            {nodeId ? `${nodeId.slice(0, 8)}…${nodeId.slice(-6)}` : '—'}
          </p>
          <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-500">
            <span className="inline-flex h-6 items-center rounded-full bg-white px-2.5 font-medium shadow-sm ring-1 ring-slate-200">
              {cpu != null ? `${cpu.toFixed(1)}% CPU` : '…'}
            </span>
            <span className="inline-flex h-6 items-center rounded-full bg-white px-2.5 font-medium shadow-sm ring-1 ring-slate-200">
              {ram != null ? `${ram.toFixed(1)}% RAM` : '…'}
            </span>
          </div>
          {summary?.live && (
            <p className="mt-2 text-[11px] font-medium text-slate-500">
              {summary.live.onlineUsers} online • {summary.live.activeConnections} conns
            </p>
          )}
        </div>
      </div>

      <div className="border-t border-slate-200/70 p-3">
        <div className="rounded-xl bg-slate-900 px-3.5 py-3 text-white shadow-card">
          <p className="text-xs font-semibold text-white">Single-node manager</p>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-300">
            VLESS + XHTTP • Quota • Connections gate
          </p>
          <a
            href="/swagger"
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-primary-300 hover:text-white"
          >
            Open API docs
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>
    </aside>
  )
}
