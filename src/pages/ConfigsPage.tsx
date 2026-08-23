import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiError, configs } from '@/lib/api-client'
import { useToast } from '@/lib/useToast'
import type { ConfigCreateRequest, ConfigResponse } from '@/types/api'
import { DataTable } from '@/components/ui/DataTable'
import { Pagination } from '@/components/ui/Pagination'
import { Modal } from '@/components/ui/Modal'
import { ConfigForm } from '@/components/config/ConfigForm'
import { formatBytes, formatDate, isExpired } from '@/lib/utils'
import { Link } from 'react-router-dom'

const PAGE_SIZE = 10

export function ConfigsPage() {
  const [page, setPage] = useState(1)
  const [order, setOrder] = useState<'asc' | 'desc'>('asc')
  const [createOpen, setCreateOpen] = useState(false)
  const [xhttpMode, setXhttpMode] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const toast = useToast()
  const queryClient = useQueryClient()

  const {
    data,
    error,
    isLoading,
  } = useQuery({
    queryKey: ['configs', page, order],
    queryFn: () => configs.list({ page, pageSize: PAGE_SIZE, order }),
  })

  const handleCreate = async (data: ConfigCreateRequest) => {
    setIsCreating(true)
    try {
      await configs.create(data, xhttpMode)
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
      toast.error(err instanceof ApiError ? err.message : 'Action failed', 'Error')
    }
  }

  const deleteConfig = async (cfg: ConfigResponse) => {
    if (!confirm(`Delete config ${cfg.email}?`)) return
    try {
      await configs.delete(cfg.uuid)
      toast.success('Config deleted')
      queryClient.invalidateQueries({ queryKey: ['configs'] })
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to delete config', 'Error')
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
            className="min-w-[130px] flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 sm:flex-none"
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
          <button
            onClick={() => {
              setXhttpMode(false)
              setCreateOpen(true)
            }}
            className="flex-1 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 sm:flex-none"
          >
            Create Config
          </button>
          <button
            onClick={() => {
              setXhttpMode(true)
              setCreateOpen(true)
            }}
            className="flex-1 rounded-xl border border-primary-600 bg-white px-4 py-2.5 text-sm font-semibold text-primary-700 hover:bg-primary-50 dark:border-primary-500 dark:bg-slate-900 dark:text-primary-300 sm:flex-none"
          >
            Create XHTTP
          </button>
        </div>
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-300">
          {error instanceof ApiError ? error.message : 'Failed to load configs'}
        </p>
      )}

      <DataTable
        columns={[
          {
            header: 'Email',
            accessor: 'email',
            className: 'font-medium text-gray-800',
          },
          {
            header: 'Type',
            render: (r) => (
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                  r.configType === 'vless-xhttp'
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                {configTypeLabel(r.configType)}
              </span>
            ),
          },
          {
            header: 'Quota',
            render: (r) => {
              const pct = r.quotaLimitBytes > 0 ? (r.quotaUsedBytes / r.quotaLimitBytes) * 100 : 0
              return (
                <div className="text-sm">
                  <span>{formatBytes(r.quotaUsedBytes)} / {formatBytes(r.quotaLimitBytes)}</span>
                  <div className="mt-1 h-1.5 w-24 rounded bg-gray-200">
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
            render: (r) => (
              <span className={isExpired(r.expireAt) ? 'text-red-600' : 'text-gray-800'}>
                {formatDate(r.expireAt)}
              </span>
            ),
          },
          {
            header: 'Conn. Limit',
            render: (r) => (r.connectionAllowed === 0 ? 'Unlimited' : String(r.connectionAllowed)),
          },
          {
            header: 'Status',
            render: (r) => (
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                  r.isEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {r.isEnabled ? 'Active' : 'Disabled'}
              </span>
            ),
          },
          {
            header: 'Creator',
            accessor: 'creator',
          },
          {
            header: '',
            render: (r) => (
              <div className="flex items-center gap-1">
                <Link
                  to={`/configs/${r.uuid}`}
                  className="rounded-md p-1 text-sm text-gray-600 hover:bg-gray-100"
                  title="View"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </Link>
                <button
                  onClick={() => toggleEnabled(r)}
                  className={`rounded-md p-1 text-sm hover:bg-gray-100 ${r.isEnabled ? 'text-amber-600' : 'text-green-600'}`}
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
                  className="rounded-md p-1 text-sm text-red-600 hover:bg-gray-100"
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
        data={data?.configs}
        isLoading={isLoading}
        emptyMessage="No configs found"
      />

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
        title={xhttpMode ? 'Create VLESS-XHTTP Config' : 'Create VLESS Config'}
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
