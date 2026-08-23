import { useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../lib/auth-context'
import { useToast } from '../lib/useToast'
import { ApiError } from '../lib/api'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation() as { state?: { from?: { pathname: string } } }
  const toast = useToast()

  const from = location.state?.from?.pathname || '/dashboard'

  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [show, setShow] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await login({ username: username.trim(), password })
      toast.success('Logged in successfully')
      navigate(from, { replace: true })
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Invalid credentials'
      toast.error(msg, 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full bg-slate-50">
      {/* left - form */}
      <div className="flex w-full max-w-xl flex-col justify-center px-6 py-10 lg:px-10">
        <Link to="/login" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-600 to-accent-600 text-white shadow-glow">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </span>
          <span>
            <span className="block text-sm font-bold tracking-tight text-slate-900">VPN NODE</span>
            <span className="block text-xs font-semibold tracking-widest text-primary-600">ADMIN • SINGLE NODE</span>
          </span>
        </Link>

        <div className="mt-10">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Welcome back</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Sign in to manage this edge node. Uses the node’s <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs ring-1 ring-slate-200">ADMIN_USERNAME / ADMIN_PASSWORD</code> from the node’s env.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div className="rounded-[20px] border border-slate-200 bg-white p-6 shadow-soft">
            <label className="block text-xs font-semibold tracking-wide text-slate-700">Username</label>
            <div className="relative mt-2">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
                placeholder="admin"
                className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 pl-9 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary-500/10"
              />
            </div>

            <label className="mt-4 block text-xs font-semibold tracking-wide text-slate-700">Password</label>
            <div className="relative mt-2">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.4 15a9 9 0 01-14.8 0" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9V7a4 4 0 00-4-4 4 4 0 00-4 4v2" />
                </svg>
              </span>
              <input
                type={show ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 pl-9 pr-10 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary-500/10"
              />
              <button
                type="button"
                onClick={() => setShow((v) => !v)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-xs font-semibold text-slate-500 hover:text-slate-700"
              >
                {show ? 'Hide' : 'Show'}
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-primary-600 to-primary-700 py-2.5 text-sm font-semibold text-white shadow-glow hover:from-primary-700 hover:to-primary-800 disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <svg className="h-4 w-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5M4 19a9 9 0 015-15.2M20 5a9 9 0 01-5 15.2" />
                  </svg>
                  Signing in…
                </>
              ) : (
                <>
                  Sign in
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </button>

            <p className="mt-3 text-center text-xs text-slate-500">
              Single-node JWT stored in localStorage • <span className="font-medium text-slate-700">30-second heartbeat</span>
            </p>
          </div>

          <div className="rounded-2xl border border-primary-200 bg-primary-50 px-4 py-3 text-xs leading-relaxed text-primary-800">
            <span className="font-semibold">Tip:</span> Run the node locally with <code className="rounded bg-white px-1 py-0.5 font-mono ring-1 ring-primary-200">VITE_API_ORIGIN=http://localhost:8080</code> and the Vite proxy handles
            <code className="ml-1 rounded bg-white px-1 py-0.5 font-mono ring-1 ring-primary-200">/api</code> + <code className="rounded bg-white px-1 py-0.5 font-mono ring-1 ring-primary-200">/health</code>.
          </div>
        </form>

        <p className="mt-8 text-xs text-slate-500">
          Need help? See <code className="rounded bg-white px-1.5 py-0.5 font-mono ring-1 ring-slate-200">vpn_node_v2/.env.example</code> for admin credentials and
          <Link to="/dashboard" className="font-semibold text-primary-600 hover:text-primary-700"> dashboard</Link> after login.
        </p>
      </div>

      {/* right - showcase */}
      <div className="hidden flex-1 flex-col bg-slate-900 p-6 lg:flex">
        <div className="flex flex-1 flex-col rounded-[28px] border border-white/10 bg-gradient-to-br from-slate-900 via-primary-950 to-slate-900 p-8 text-white shadow-2xl">
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold ring-1 ring-white/15">Single node • Edge</span>
            <span className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold text-white shadow-lg">● Live heartbeat</span>
          </div>

          <div className="mt-10">
            <h2 className="max-w-md text-3xl font-bold leading-tight tracking-tight">
              One node, <span className="bg-gradient-to-r from-primary-300 to-accent-300 bg-clip-text text-transparent">full control</span> — without the platform overhead.
            </h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-300">
              VLESS & VLESS-XHTTP, quota limiter, connection gate, 10-minute traffic buckets, and a 30-second heartbeat — all on a single edge host. This admin is the ops console.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10 backdrop-blur">
              <p className="text-xs font-semibold tracking-widest text-white/60">CONFIGS</p>
              <p className="mt-2 text-lg font-bold">VLESS</p>
              <p className="text-xs text-white/60">+ XHTTP</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10 backdrop-blur">
              <p className="text-xs font-semibold tracking-widest text-white/60">QUOTA</p>
              <p className="mt-2 text-lg font-bold">Per-config</p>
              <p className="text-xs text-white/60">limit & used</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10 backdrop-blur">
              <p className="text-xs font-semibold tracking-widest text-white/60">TRAFFIC</p>
              <p className="mt-2 text-lg font-bold">10m buckets</p>
              <p className="text-xs text-white/60">24h rollup</p>
            </div>
          </div>

          <div className="mt-auto rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
            <p className="text-xs font-semibold tracking-widest text-white/60">MAKE IT COMPLETE — PROPOSED</p>
            <ul className="mt-2 space-y-1 text-xs leading-relaxed text-slate-300">
              <li>• <span className="font-mono text-white">GET /api/v1/stats/summary</span> — one call for dashboard KPIs</li>
              <li>• <span className="font-mono text-white">GET /api/v1/stats/traffic?range=7d</span> — sparkline + history</li>
              <li>• <span className="font-mono text-white">GET /api/v1/health/details</span> — disk, load, xray sessions</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
