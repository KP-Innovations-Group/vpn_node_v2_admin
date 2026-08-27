import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiError, admin } from '@/lib/api-client'
import { useToast } from '@/lib/useToast'
import { useAuth } from '@/lib/auth-context'

export function AdminsPage() {
  const { role } = useAuth()
  const toast = useToast()
  const qc = useQueryClient()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [createRole, setCreateRole] = useState<'admin' | 'super_admin'>('admin')
  const [creating, setCreating] = useState(false)

  const { data, isLoading, error } = useQuery({
    queryKey: ['admins'],
    queryFn: () => admin.list(),
    enabled: role === 'super_admin',
  })

  if (role !== 'super_admin') {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center dark:border-amber-800 dark:bg-amber-950/20">
        <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">Super admin only</p>
        <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">Your role is {role ?? 'unknown'}. Ask the super admin.</p>
      </div>
    )
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !password) return toast.error('Username and password required')
    setCreating(true)
    try {
      await admin.create({ username: username.trim(), password, role: createRole })
      toast.success('Admin created')
      setUsername('')
      setPassword('')
      qc.invalidateQueries({ queryKey: ['admins'] })
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to create admin')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (u: string) => {
    if (!confirm(`Delete admin "${u}"?`)) return
    try {
      await admin.delete(u)
      toast.success('Deleted')
      qc.invalidateQueries({ queryKey: ['admins'] })
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to delete')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white sm:text-xl">Admins</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">Super admin can create and remove admins.</p>
      </div>

      <form onSubmit={handleCreate} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft dark:border-slate-700 dark:bg-slate-900">
        <p className="text-xs font-semibold tracking-wide text-slate-700 dark:text-slate-300">Create admin</p>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-4">
          <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="username" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
          <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="password" type="password" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
          <select value={createRole} onChange={(e) => setCreateRole(e.target.value as never)} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white">
            <option value="admin">admin</option>
            <option value="super_admin">super_admin</option>
          </select>
          <button disabled={creating} className="rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60">{creating ? 'Creating…' : 'Create'}</button>
        </div>
      </form>

      {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-300">{error instanceof ApiError ? error.message : 'Failed to load'}</p>}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-800/80"><tr>
              <th className="px-4 py-2 text-left text-xs font-semibold tracking-widest text-slate-500 dark:text-slate-400">Username</th>
              <th className="px-4 py-2 text-left text-xs font-semibold tracking-widest text-slate-500 dark:text-slate-400">Role</th>
              <th className="px-4 py-2 text-left text-xs font-semibold tracking-widest text-slate-500 dark:text-slate-400">Created by</th>
              <th className="px-4 py-2"></th>
            </tr></thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {isLoading ? (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-sm text-slate-500">Loading…</td></tr>
              ) : !data?.admins?.length ? (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-sm text-slate-500">No admins</td></tr>
              ) : (
                data.admins.map((a) => (
                  <tr key={a.username} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-2.5 text-sm font-medium text-slate-900 dark:text-white">{a.username}</td>
                    <td className="px-4 py-2.5"><span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${a.role === 'super_admin' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200' : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'}`}>{a.role}</span></td>
                    <td className="px-4 py-2.5 text-sm text-slate-600 dark:text-slate-400">{a.createdBy}</td>
                    <td className="px-4 py-2.5 text-right">
                      {a.role !== 'super_admin' && (
                        <button onClick={() => handleDelete(a.username)} className="rounded-lg border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300">Delete</button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
