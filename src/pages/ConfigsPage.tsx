import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiError, configs, admin } from '@/lib/api-client'
import { useToast } from '@/lib/useToast'
import { useAuth } from '@/lib/auth-context'
import type { ConfigCreateRequest, ConfigResponse } from '@/types/api'
import { DataTable } from '@/components/ui/DataTable'
import { Pagination } from '@/components/ui/Pagination'
import { Modal } from '@/components/ui/Modal'
import { ConfigForm } from '@/components/config/ConfigForm'
import { formatBytes, formatDate, isExpired } from '@/lib/utils'
import { Link } from 'react-router-dom'

function highlight(text: string, q: string) {
  if (!q) return text
  const idx = text.toLowerCase().indexOf(q.toLowerCase())
  if (idx === -1) return text
  const before = text.slice(0, idx)
  const match = text.slice(idx, idx + q.length)
  const after = text.slice(idx + q.length)
  return (
    <>
      {before}
      <mark className="rounded bg-amber-200 px-0.5 text-slate-900 dark:bg-amber-400">{match}</mark>
      {after}
    </>
  )
}

const PAGE_SIZE = 10

export function ConfigsPage() {
  const [page, setPage] = useState(1)
  const [order, setOrder] = useState<'asc' | 'desc'>('desc')
  const [status, setStatus] = useState<'all' | 'enabled' | 'disabled'>('all')
  const [creatorFilter, setCreatorFilter] = useState<string>('')
  const [q, setQ] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const toast = useToast()
  const queryClient = useQueryClient()
  const { role, can } = useAuth()

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedQ(q.trim()); setPage(1) }, 300)
    return () => clearTimeout(t)
  }, [q])

  const {
    data,
    error,
    isLoading,
  } = useQuery({
    queryKey: ['configs', page, order, status, creatorFilter, debouncedQ],
    queryFn: () => configs.list({ page, pageSize: PAGE_SIZE, order, status: status === 'all' ? undefined : status, creator: creatorFilter || undefined, q: debouncedQ || undefined }),
  })

  const { data: adminList } = useQuery({
    queryKey: ['admins', 'filter'],
    queryFn: () => admin.list(),
    enabled: role === 'super_admin',
  })

  const handleCreate = async (data: ConfigCreateRequest & { configType?: string }) => {
    const type = (data as { configType?: string }).configType ?? 'vless'
    const isXhttp = type === 'vless-xhttp'
    const payload: ConfigCreateRequest = {
      email: data.email,
      quotaLimit: data.quotaLimit,
      expirationTime: data.expirationTime,
      initialQuotaUsedBytes: data.initialQuotaUsedBytes,
      connectionAllowed: data.connectionAllowed,
      remark: data.remark,
    }
    setIsCreating(true)
    try {
      await configs.create(payload, isXhttp)
      toast.success('Config created successfully')
      setCreateOpen(false)
      queryClient.invalidateQueries({ queryKey: ['configs'] })
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to create config', 'Error')
    } finally {
      setIsCreating(false)
    }
  }

  const toggleEnabled = async (cfg: ConfigResponse) => {
    try {
      if (cfg.isEnabled) {
        await configs.disable(cfg.uuid)
        toast.success('Config disabled')
      } else {
        await configs.enable(cfg.uuid)
        toast.success('Config enabled')
      }
      queryClient.invalidateQueries({ queryKey: ['configs'] })
    } catch (err) {
      const msg = err instanceof ApiError ? ((err as unknown as { status: number }).status === 404 ? 'Not found or deleted' : err.message) : 'Action failed'
      toast.error(msg, 'Error')
    }
  }

  const deleteConfig = async (cfg: ConfigResponse) => {
    if (!confirm(`Delete config ${cfg.email}?`)) return
    try {
      await configs.delete(cfg.uuid)
      toast.success('Config deleted')
      queryClient.invalidateQueries({ queryKey: ['configs'] })
    } catch (err) {
      const msg = err instanceof ApiError ? ((err as unknown as { status: number }).status === 404 ? 'Already deleted' : err.message) : 'Failed to delete config'
      toast.error(msg, 'Error')
    }
  }

  const configTypeLabel = (t: ConfigResponse['configType']) => (t === 'vless-xhttp' ? 'VLESS-XHTTP' : 'VLESS')

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white sm:text-xl">Configs</h2>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={order}
            onChange={(e) => setOrder(e.target.value as 'asc' | 'desc')}
            className="min-w-[140px] flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 sm:flex-none"
          >
            <option value="desc">Newest first</option>
            <option value="asc">Oldest first</option>
          </select>
          {can('config:write') && (
            <button
              onClick={() => setCreateOpen(true)}
              className="rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-700"
            >
              Create Config
            </button>
          )}
        </div>
      </div>

      <div className="relative">
        <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search email, remark, uuid…"
          className="block w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-9 text-sm placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
        />
        {q && (
          <button onClick={() => setQ('')} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700">✕</button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-xl border border-slate-200 bg-slate-100 p-1 dark:border-slate-700 dark:bg-slate-800">
          {(['all', 'enabled', 'disabled'] as const).map((s) => (
            <button
              key={s}
              onClick={() => { setStatus(s); setPage(1) }}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize ${status === s ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}
            >
              {s === 'all' ? 'All' : s}
            </button>
          ))}
        </div>
        {role === 'super_admin' && adminList?.admins?.length ? (
          <select value={creatorFilter} onChange={(e) => { setCreatorFilter(e.target.value); setPage(1) }} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
            <option value="">All creators</option>
            {adminList.admins.map((a) => (
              <option key={a.username} value={a.username}>{a.username} ({a.role})</option>
            ))}
          </select>
        ) : null}
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-300">
          {error instanceof ApiError ? (error as unknown as { status?: number }).status === 404 ? 'Not found or deleted' : error.message : 'Failed to load configs'}
        </p>
      )}

      <div className="hidden md:block">
        <DataTable
          columns={[
          {
            header: 'Email',
            headerClassName: 'w-[200px]',
            render: (r) => (
              <span className="max-w-[190px] truncate font-medium text-slate-900 dark:text-white" title={r.email}>
                {highlight(r.email, debouncedQ)}
              </span>
            ),
          },
          {
            header: 'Remark',
            headerClassName: 'w-[140px]',
            render: (r) => (
              <span className="max-w-[140px] truncate text-xs text-slate-600 dark:text-slate-400" title={r.remark ?? ''}>
                {r.remark ? highlight(r.remark, debouncedQ) as never : '—'}
              </span>
            ),
          },
          {
            header: 'Type',
            headerClassName: 'w-[110px]',
              render: (r) => (
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                    r.configType === 'vless-xhttp'
                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200'
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200'
                  }`}
                >
                  {configTypeLabel(r.configType)}
                </span>
              ),
            },
            {
              header: 'Quota',
              headerClassName: 'w-[160px]',
              render: (r) => {
                const pct = r.quotaLimitBytes > 0 ? (r.quotaUsedBytes / r.quotaLimitBytes) * 100 : 0
                return (
                  <div className="text-sm">
                    <span>{formatBytes(r.quotaUsedBytes)} / {formatBytes(r.quotaLimitBytes)}</span>
                    <div className="mt-1 h-1.5 w-24 rounded bg-slate-200 dark:bg-slate-700">
                      <div
                        className={`h-1.5 rounded ${pct > 90 ? 'bg-red-500' : 'bg-primary-600'}`}
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>
                  </div>
                )
              },
            },
            {
              header: 'Expires',
              headerClassName: 'w-[140px]',
              render: (r) => (
                <span className={isExpired(r.expireAt) ? 'text-red-600 dark:text-red-400' : 'text-slate-700 dark:text-slate-300'}>
                  {formatDate(r.expireAt)}
                </span>
              ),
            },
            {
              header: 'Conn. Limit',
              headerClassName: 'w-[100px]',
              render: (r) => (r.connectionAllowed === 0 ? 'Unlimited' : String(r.connectionAllowed)),
            },
            {
              header: 'Status',
              headerClassName: 'w-[100px]',
              render: (r) => (
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                    r.isEnabled ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                  }`}
                >
                  {r.isEnabled ? 'Active' : 'Disabled'}
                </span>
              ),
            },
            {
              header: 'Creator',
              accessor: 'creator',
              headerClassName: 'w-[120px]',
            },
            {
              header: '',
              headerClassName: 'w-[110px]',
              render: (r) => (
                <div className="flex items-center gap-1">
                  <Link
                    to={`/configs/${r.uuid}`}
                    className="rounded-md p-1 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
                    title="View"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </Link>
                  <button
                    onClick={() => toggleEnabled(r)}
                    className={`rounded-md p-1 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 ${r.isEnabled ? 'text-amber-600' : 'text-green-600'}`}
                    title={r.isEnabled ? 'Disable' : 'Enable'}
                  >
                    {r.isEnabled ? (
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                  <button
                    onClick={() => deleteConfig(r)}
                    className="rounded-md p-1 text-sm text-red-600 hover:bg-slate-100 dark:hover:bg-slate-700"
                    title="Delete"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.975-1.858L5 7m5 5v5m4-5v5M4 7h16M4 7l1-3h14l1 3z" />
                    </svg>
                  </button>
                </div>
              ),
            },
          ]}
          data={data?.configs ?? []}
          isLoading={isLoading}
          emptyMessage={role !== 'super_admin' ? 'No configs yet — you see only your own' : 'No configs found'}
        />
      </div>

      {/* Mobile cards — thumb friendly */}
      <div className="grid gap-3 md:hidden">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-700" />)
        ) : !(data?.configs ?? []).length ? (
          <p className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">{role !== 'super_admin' ? 'No configs yet — you see only your own. Create one.' : 'No configs found'}</p>
        ) : (
          (data?.configs ?? []).map((r) => {
            const pct = r.quotaLimitBytes > 0 ? (r.quotaUsedBytes / r.quotaLimitBytes) * 100 : 0
            return (
              <div key={r.uuid} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft dark:border-slate-700 dark:bg-slate-900">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{highlight(r.email, debouncedQ) as never}</p>
                    {r.remark && <p className="truncate text-xs text-slate-500 dark:text-slate-400">{highlight(r.remark, debouncedQ) as never}</p>}
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${r.configType === 'vless-xhttp' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200'}`}>{configTypeLabel(r.configType)}</span>
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${r.isEnabled ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>{r.isEnabled ? 'Active' : 'Disabled'}</span>
                    </div>
                  </div>
                  <Link to={`/configs/${r.uuid}`} className="shrink-0 rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white dark:bg-white dark:text-slate-900">View</Link>
                </div>
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400"><span>{formatBytes(r.quotaUsedBytes)} / {formatBytes(r.quotaLimitBytes)}</span><span>{pct.toFixed(0)}%</span></div>
                  <div className="mt-1 h-2 rounded-full bg-slate-200 dark:bg-slate-700"><div className={`h-2 rounded-full ${pct > 90 ? 'bg-red-500' : 'bg-primary-600'}`} style={{ width: `${Math.min(100, pct)}%` }} /></div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600 dark:text-slate-400">
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 dark:bg-slate-800">{isExpired(r.expireAt) ? 'Expired' : formatDate(r.expireAt)}</span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 dark:bg-slate-800">{r.connectionAllowed === 0 ? 'Unlimited' : `${r.connectionAllowed} conns`}</span>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <Link to={`/configs/${r.uuid}`} className="flex min-h-[44px] items-center justify-center rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">View</Link>
                  <button onClick={() => toggleEnabled(r)} className={`flex min-h-[44px] items-center justify-center rounded-xl border text-xs font-semibold ${r.isEnabled ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300' : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300'}`}>{r.isEnabled ? 'Disable' : 'Enable'}</button>
                  <button onClick={() => deleteConfig(r)} className="flex min-h-[44px] items-center justify-center rounded-xl border border-red-200 bg-red-50 text-xs font-semibold text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300">Delete</button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {data && (
        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={data.count}
          onPageChange={setPage}
        />
      )}

      <Modal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create Config"
      >
        <ConfigForm
          defaultValues={{ connectionAllowed: 0 }}
          onSubmit={handleCreate}
          isLoading={isCreating}
        />
      </Modal>
    </div>
  )
}
