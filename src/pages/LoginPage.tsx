import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth-context'
import { useToast } from '../lib/useToast'
import { ApiError } from '../lib/api'
import { ThemeToggle } from '@/lib/theme'

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
      toast.success('Welcome back')
      navigate(from, { replace: true })
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Invalid credentials'
      toast.error(msg, 'Sign in failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full bg-slate-50 dark:bg-slate-950">
      {/* left - form */}
      <div className="flex w-full max-w-xl flex-col justify-center px-6 py-10 lg:px-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-600 to-accent-600 text-white shadow-glow">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </span>
            <span>
              <span className="block text-sm font-bold tracking-tight text-slate-900 dark:text-white">VPN NODE</span>
              <span className="block text-xs font-semibold tracking-widest text-primary-600 dark:text-primary-400">ADMIN</span>
            </span>
          </div>
          <ThemeToggle />
        </div>

        <div className="mt-10">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Welcome back</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            Sign in to manage your node. Secure, fast, and built for a single edge.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div className="rounded-[20px] border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900">
            <label className="block text-xs font-semibold tracking-wide text-slate-700 dark:text-slate-300">Username</label>
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
                className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 pl-9 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:focus:bg-slate-800"
              />
            </div>

            <label className="mt-4 block text-xs font-semibold tracking-wide text-slate-700 dark:text-slate-300">Password</label>
            <div className="relative mt-2">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11V9a4 4 0 018 0v2" />
                </svg>
              </span>
              <input
                type={show ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 pl-9 pr-10 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:focus:bg-slate-800"
              />
              <button
                type="button"
                onClick={() => setShow((v) => !v)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
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
          </div>
        </form>

        <p className="mt-6 text-center text-xs leading-relaxed text-slate-500 dark:text-slate-400">
          Protected access • Your session stays on this device
        </p>
      </div>

      {/* right - showcase */}
      <div className="hidden flex-1 flex-col bg-slate-900 p-6 dark:bg-black lg:flex">
        <div className="flex flex-1 flex-col rounded-[28px] border border-white/10 bg-gradient-to-br from-slate-900 via-primary-950 to-slate-900 p-8 text-white shadow-2xl">
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold ring-1 ring-white/15">Edge • Private</span>
            <span className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold text-white shadow-lg">● Secure</span>
          </div>

          <div className="mt-10">
            <h2 className="max-w-md text-3xl font-bold leading-tight tracking-tight">
              Simple control for <span className="bg-gradient-to-r from-primary-300 to-accent-300 bg-clip-text text-transparent">one powerful node</span>
            </h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-300">
              Create and manage access, monitor usage, and keep your service running smoothly — all from one clean dashboard.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10 backdrop-blur">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10">
                <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 11a3 3 0 100-6 3 3 0 000 6z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 21a6 6 0 0112 0" />
                </svg>
              </div>
              <p className="mt-3 text-xs font-semibold text-white">Private by design</p>
              <p className="text-xs text-white/60">Encrypted access for your users</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10 backdrop-blur">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10">
                <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
              </div>
              <p className="mt-3 text-xs font-semibold text-white">Instant setup</p>
              <p className="text-xs text-white/60">Provision access in seconds</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10 backdrop-blur">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10">
                <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 3v18h18" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 16l4-4 4 4 6-8" />
                </svg>
              </div>
              <p className="mt-3 text-xs font-semibold text-white">Clear insights</p>
              <p className="text-xs text-white/60">Track usage at a glance</p>
            </div>
          </div>

          <div className="mt-auto rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
            <p className="text-xs font-medium leading-relaxed text-slate-300">
              Designed for operators who want power without complexity. Everything you need, nothing you don’t — beautifully organized.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
