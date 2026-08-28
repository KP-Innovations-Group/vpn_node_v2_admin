import { useState } from 'react'
import { Outlet, useLocation, Link } from 'react-router-dom'
import { useAuth } from '@/lib/auth-context'
import { NavSidebar } from '@/components/layout/NavSidebar'
import { useQuery } from '@tanstack/react-query'
import { health, stats } from '@/lib/api-client'
import { ThemeToggle } from '@/lib/theme'

export function MainLayout() {
  const { logout, username, role, can } = useAuth()
  const location = useLocation()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
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
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden max-w-[220px] items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:flex">
              <span className="h-2 w-2 shrink-0 rounded-full bg-primary-500 animate-pulseSoft" />
              <span className="truncate font-mono text-xs font-medium tracking-wide text-slate-700 dark:text-slate-300" title={summary?.node.nodeId ?? data?.nodeId ?? ''}>
                {(summary?.node.nodeId ?? data?.nodeId) ?? 'node'}
              </span>
              <span className="h-3 w-px shrink-0 bg-slate-200 dark:bg-slate-700" />
              <span className="shrink-0 text-xs font-medium text-slate-500 dark:text-slate-400">{(summary?.node.uptimeSec ?? data?.uptimeSec) ? `${Math.floor((summary?.node.uptimeSec ?? data!.uptimeSec) / 3600)}h up` : '—'}</span>
            </div>

            <ThemeToggle />

            <div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />
            <div className="relative flex items-center gap-2">
              <button
                onClick={() => setUserMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-xl border border-transparent px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <div className="hidden text-right leading-tight sm:block">
                  <p className="text-xs font-semibold text-slate-900 dark:text-white">{username ?? 'Admin'}</p>
                  <p className="text-[11px] font-medium capitalize text-slate-500 dark:text-slate-400">{role ?? 'admin'}</p>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-slate-900 to-slate-700 text-xs font-bold text-white shadow-sm">{(username ?? 'A').slice(0, 1).toUpperCase()}</div>
                <svg className={`h-3.5 w-3.5 text-slate-400 transition ${userMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </button>
              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 top-[44px] z-20 w-44 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg dark:border-slate-700 dark:bg-slate-800">
                    <div className="px-3 py-2">
                      <p className="text-xs font-semibold text-slate-900 dark:text-white">{username ?? 'Admin'}</p>
                      <p className="text-[11px] capitalize text-slate-500 dark:text-slate-400">{role ?? 'admin'}</p>
                    </div>
                    <button
                      onClick={() => { setUserMenuOpen(false); logout() }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" /></svg>
                      Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 pb-24 md:p-6 md:pb-6 lg:p-7">
          <div className="mx-auto max-w-[1400px]">
            <Outlet />
          </div>
        </main>

        {/* bottom tab bar — thumb zone, 44pt targets, safe-area */}
        <nav className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around gap-1 overflow-x-auto border-t border-slate-200 bg-white/95 px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/95 md:hidden">
          {can('stats:read') && <MobileTab to="/dashboard" label="Home" icon={<svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M21 12l-2-2m0 0v-1a2 2 0 00-2-2h-2V6a2 2 0 00-2-2H10a2 2 0 00-2 2v1H6a2 2 0 00-2 2v1l-2 2" /></svg>} />}
          {can('config:read') && <MobileTab to="/configs" label="Configs" icon={<svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14 3H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V8zM9 13h6M9 17h6" /></svg>} />}
          {can('subscription:read') && <MobileTab to="/subscriptions" label="Subs" icon={<svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2" /></svg>} />}
          {can('admin:read') && <MobileTab to="/admins" label="Admins" icon={<svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 11a4 4 0 100-8 4 4 0 000 8zM6 19a6 6 0 0112 0v1H6v-1zM16 8l4 3-4 3" /></svg>} />}
          <Link to="/profile" className={`flex min-h-[52px] min-w-[56px] shrink-0 flex-col items-center justify-center gap-1 rounded-xl px-3 py-1 text-[11px] font-semibold ${location.pathname.startsWith('/profile') ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'}`}>
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-[11px] font-bold text-white dark:bg-white dark:text-slate-900">{(username ?? 'A').slice(0,1).toUpperCase()}</span>
            <span>Me</span>
          </Link>
        </nav>
      </div>
    </div>
  )
}

function MobileTab({ to, label, icon }: { to: string; label: string; icon: React.ReactNode }) {
  const loc = useLocation()
  const active = loc.pathname.startsWith(to)
  return (
    <Link to={to} className={`flex min-h-[52px] min-w-[56px] flex-col items-center justify-center gap-1 rounded-xl px-3 py-1 text-[11px] font-semibold ${active ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'}`}>
      {icon}
      <span>{label}</span>
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
