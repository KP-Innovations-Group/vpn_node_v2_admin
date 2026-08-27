import { useQuery } from '@tanstack/react-query'
import { admin } from '@/lib/api-client'
import { useAuth } from '@/lib/auth-context'

export function ProfilePage() {
  const { username, role, logout } = useAuth()
  const { data: me, isLoading } = useQuery({
    queryKey: ['admin', 'me'],
    queryFn: () => admin.me(),
  })

  const displayName = me?.username ?? username ?? 'Admin'
  const displayRole = me?.role ?? role ?? '—'

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-900 to-slate-700 text-lg font-bold text-white shadow-sm">
          {displayName.slice(0, 1).toUpperCase()}
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">{displayName}</h1>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{displayRole}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft dark:border-slate-700 dark:bg-slate-900">
        <p className="text-xs font-semibold tracking-widest text-slate-500 dark:text-slate-400">ACCOUNT</p>
        <div className="mt-3 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500 dark:text-slate-400">Username</span>
            <span className="font-medium text-slate-900 dark:text-white">{isLoading ? '—' : displayName}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500 dark:text-slate-400">Role</span>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${displayRole === 'super_admin' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}>{displayRole}</span>
          </div>
          {me?.createdBy && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 dark:text-slate-400">Created by</span>
              <span className="text-slate-700 dark:text-slate-300">{me.createdBy}</span>
            </div>
          )}
        </div>
      </div>

      <button onClick={logout} className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-3 text-sm font-semibold text-white shadow-sm hover:bg-red-700">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" /></svg>
        Logout
      </button>
    </div>
  )
}
