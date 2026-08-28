import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiError, admin } from '@/lib/api-client'
import { useToast } from '@/lib/useToast'
import { useAuth } from '@/lib/auth-context'
import { Modal } from '@/components/ui/Modal'

export function AdminsPage() {
  const { can } = useAuth()
  const toast = useToast()
  const qc = useQueryClient()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [createRole, setCreateRole] = useState<'admin' | 'super_admin'>('admin')
  const [creating, setCreating] = useState(false)
  const [editUser, setEditUser] = useState<string | null>(null)
  const [editRole, setEditRole] = useState<'admin' | 'super_admin'>('admin')
  const [editActive, setEditActive] = useState(true)
  const [editPassword, setEditPassword] = useState('')
  const [permUser, setPermUser] = useState<string | null>(null)
  const [selectedPerms, setSelectedPerms] = useState<string[]>([])

  const { data, isLoading, error } = useQuery({
    queryKey: ['admins'],
    queryFn: () => admin.list(),
    enabled: can('admin:read'),
  })

  const { data: catalog } = useQuery({
    queryKey: ['admin', 'permissions', 'catalog'],
    queryFn: () => admin.permissions(),
    enabled: can('admin:permissions'),
  })

  const { data: userPerms, isLoading: userPermsLoading } = useQuery({
    queryKey: ['admin', 'permissions', permUser],
    queryFn: () => admin.getPermissions(permUser!),
    enabled: !!permUser && can('admin:permissions'),
  })

  // sync selectedPerms when userPerms loads
  if (permUser && userPerms && selectedPerms.length === 0 && !userPermsLoading) {
    // initialize once
    if (JSON.stringify(selectedPerms) !== JSON.stringify(userPerms.permissions ?? [])) {
      // avoid infinite loop by only setting if empty
      setTimeout(() => setSelectedPerms(userPerms.permissions ?? []), 0)
    }
  }

  if (!can('admin:read')) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center dark:border-amber-800 dark:bg-amber-950/20">
        <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">Forbidden</p>
        <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">Missing admin:read — ask super admin.</p>
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

  const openEdit = (u: string, roleVal: string, active?: boolean) => {
    setEditUser(u)
    setEditRole((roleVal as never) === 'super_admin' ? 'super_admin' : 'admin')
    setEditActive(active ?? true)
    setEditPassword('')
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editUser) return
    try {
      await admin.update({ username: editUser, role: editRole, isActive: editActive, password: editPassword || undefined })
      toast.success('Updated')
      setEditUser(null)
      setEditPassword('')
      qc.invalidateQueries({ queryKey: ['admins'] })
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to update')
    }
  }

  const openPerms = (u: string) => {
    setPermUser(u)
    setSelectedPerms([])
  }

  const savePerms = async () => {
    if (!permUser) return
    try {
      await admin.setPermissions(permUser, selectedPerms)
      toast.success('Permissions saved — ask user to relogin')
      setPermUser(null)
      qc.invalidateQueries({ queryKey: ['admins'] })
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to save')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white sm:text-xl">Admins</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">Manage admins, roles and permissions. Changes require relogin to take effect.</p>
      </div>

      {can('admin:write') && (
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
      )}

      {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-300">{error instanceof ApiError ? error.message : 'Failed to load'}</p>}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-800/80"><tr>
              <th className="px-4 py-2 text-left text-xs font-semibold tracking-widest text-slate-500 dark:text-slate-400">Username</th>
              <th className="px-4 py-2 text-left text-xs font-semibold tracking-widest text-slate-500 dark:text-slate-400">Role</th>
              <th className="px-4 py-2 text-left text-xs font-semibold tracking-widest text-slate-500 dark:text-slate-400">Active</th>
              <th className="px-4 py-2 text-left text-xs font-semibold tracking-widest text-slate-500 dark:text-slate-400">Permissions</th>
              <th className="px-4 py-2"></th>
            </tr></thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {isLoading ? (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-sm text-slate-500">Loading…</td></tr>
              ) : !data?.admins?.length ? (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-sm text-slate-500">No admins</td></tr>
              ) : (
                data.admins.map((a) => (
                  <tr key={a.username} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-2.5 text-sm font-medium text-slate-900 dark:text-white">{a.username}</td>
                    <td className="px-4 py-2.5"><span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${a.role === 'super_admin' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200' : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'}`}>{a.role}</span></td>
                    <td className="px-4 py-2.5 text-xs">{a.isActive === false ? <span className="rounded-full bg-red-100 px-2 py-0.5 text-red-700 dark:bg-red-900/30">inactive</span> : <span className="rounded-full bg-green-100 px-2 py-0.5 text-green-700 dark:bg-green-900/30">active</span>}</td>
                    <td className="max-w-[260px] px-4 py-2.5">
                      <div className="flex flex-wrap gap-1">
                        {(a.permissions ?? []).length ? (a.permissions ?? []).map((p) => (
                          <span key={p} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">{p}</span>
                        )) : <span className="text-xs text-slate-400">—</span>}
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex flex-wrap justify-end gap-1.5">
                        {can('admin:write') && <button onClick={() => openEdit(a.username, a.role, a.isActive ?? true)} className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">Edit</button>}
                        {can('admin:permissions') && <button onClick={() => openPerms(a.username)} className="rounded-lg bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white dark:bg-white dark:text-slate-900">Perms</button>}
                        {can('admin:delete') && a.role !== 'super_admin' && <button onClick={() => handleDelete(a.username)} className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300">Delete</button>}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={!!editUser} onClose={() => setEditUser(null)} title={`Edit ${editUser ?? ''}`}>
        <form onSubmit={handleEdit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Role</label>
            <select value={editRole} onChange={(e) => setEditRole(e.target.value as never)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white">
              <option value="admin">admin</option>
              <option value="super_admin">super_admin</option>
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={editActive} onChange={(e) => setEditActive(e.target.checked)} /> Active
          </label>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">New password (leave blank to keep)</label>
            <input type="password" value={editPassword} onChange={(e) => setEditPassword(e.target.value)} placeholder="••••••••" className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
          </div>
          <button type="submit" className="w-full rounded-xl bg-primary-600 py-2.5 text-sm font-semibold text-white">Save</button>
        </form>
      </Modal>

      <Modal isOpen={!!permUser} onClose={() => setPermUser(null)} title={`Permissions — ${permUser ?? ''}`}>
        <div className="space-y-3">
          <p className="text-xs text-slate-500">Select permissions. Super admin always has all.</p>
          {userPermsLoading ? (
            <p className="text-sm text-slate-500">Loading…</p>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {(catalog?.permissions ?? []).map((p) => (
                <label key={p} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800">
                  <input type="checkbox" checked={selectedPerms.includes(p)} onChange={(e) => setSelectedPerms((prev) => e.target.checked ? [...prev, p] : prev.filter((x) => x !== p))} />
                  <span className="font-mono text-xs dark:text-slate-200">{p}</span>
                </label>
              ))}
            </div>
          )}
          <button onClick={savePerms} className="w-full rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white dark:bg-white dark:text-slate-900">Save — ask user to relogin</button>
        </div>
      </Modal>
    </div>
  )
}
