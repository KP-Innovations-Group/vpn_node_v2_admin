import { Outlet, useLocation, Link } from 'react-router-dom'
import { useAuth } from '@/lib/auth-context'
import { NavSidebar } from '@/components/layout/NavSidebar'
import { useQuery } from '@tanstack/react-query'
import { health, stats } from '@/lib/api-client'
import { ThemeToggle } from '@/lib/theme'

export function MainLayout() {
  const { logout } = useAuth()
  const location = useLocation()
  const { data } = useQuery({
    queryKey: ['heartbeat'],
    queryFn: () => health.heartbeat(),
    refetchInterval: 30_000,
  })
  const { data: summary } = useQuery({
    queryKey: ['stats', 'summary'],
    queryFn: () => stats.summary(),
    refetchInterval: 30_000,
    retry: false,
  })

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950">
      <NavSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-[64px] shrink-0 items-center justify-between border-b border-slate-200/70 bg-white/75 px-4 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/80 md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            {/* mobile brand */}
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-600 to-accent-600 text-white shadow-glow md:hidden">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="truncate text-[15px] font-bold tracking-tight text-slate-900 dark:text-white">{pageTitle(location.pathname)}</h1>
                {(data || summary) && <span className="hidden items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-800 sm:inline-flex">
                  <span className="h-2 w-2 animate-pulseSoft rounded-full bg-emerald-500" />
                  {summary?.live ? `${summary.live.onlineUsers} online` : 'Operational'}
                </span>}
              </div>
              <p className="hidden text-xs font-medium text-slate-500 dark:text-slate-400 sm:block">{pageSubtitle(location.pathname)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:flex">
              <span className="h-2 w-2 rounded-full bg-primary-500 animate-pulseSoft" />
              <span className="font-mono text-xs font-medium text-slate-600 dark:text-slate-300">
                {(summary?.node.nodeId ?? data?.nodeId) ? `${(summary?.node.nodeId ?? data!.nodeId).slice(0, 6)}…` : 'node —'}
              </span>
              <span className="h-3 w-px bg-slate-200 dark:bg-slate-700" />
              <span className="text-xs text-slate-500 dark:text-slate-400">{(summary?.node.uptimeSec ?? data?.uptimeSec) ? `${Math.floor((summary?.node.uptimeSec ?? data!.uptimeSec) / 3600)}h up` : '—'}</span>
            </div>

            <ThemeToggle />

            <Link to="/configs" className="hidden items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 sm:inline-flex">
              <svg className="h-4 w-4 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              New config
            </Link>

            <div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />
            <div className="flex items-center gap-2">
              <div className="hidden text-right leading-tight sm:block">
                <p className="text-xs font-semibold text-slate-900 dark:text-white">Administrator</p>
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Single node</p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-slate-900 to-slate-700 text-xs font-bold text-white shadow-sm">A</div>
            </div>
            <button
              onClick={logout}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-800"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
              </svg>
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* mobile nav */}
        <div className="flex items-center gap-2 border-b border-slate-200 bg-white px-2 py-2 dark:border-slate-800 dark:bg-slate-900 md:hidden">
          <MobileNavLink to="/dashboard" label="Dashboard" />
          <MobileNavLink to="/configs" label="Configs" />
          <MobileNavLink to="/subscriptions" label="Subscriptions" />
        </div>

        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-7">
          <div className="mx-auto max-w-[1400px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

function MobileNavLink({ to, label }: { to: string; label: string }) {
  const loc = useLocation()
  const active = loc.pathname.startsWith(to)
  return (
    <Link
      to={to}
      className={`flex-1 rounded-xl px-3 py-2 text-center text-xs font-semibold ${active ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}
    >
      {label}
    </Link>
  )
}

function pageTitle(path: string): string {
  if (path.startsWith('/configs/')) return 'Config detail'
  if (path.startsWith('/configs')) return 'Configs'
  if (path.startsWith('/subscriptions/')) return 'Subscription detail'
  if (path.startsWith('/subscriptions')) return 'Subscriptions'
  if (path.startsWith('/dashboard')) return 'Dashboard'
  return 'VPN Node Admin'
}

function pageSubtitle(path: string): string {
  if (path.startsWith('/configs')) return 'VLESS & VLESS-XHTTP • Quota & connection gate'
  if (path.startsWith('/subscriptions')) return 'Bundle configs into shareable subscription links'
  if (path.startsWith('/dashboard')) return 'Single-node health, traffic & fleet at a glance'
  return 'Single-node control plane'
}
