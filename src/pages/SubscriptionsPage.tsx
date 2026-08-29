import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiError, subscriptions } from '@/lib/api-client'
import { useToast } from '@/lib/useToast'
import type { SubscriptionCreateRequest, SubscriptionResponse } from '@/types/api'
import { DataTable } from '@/components/ui/DataTable'
import { Pagination } from '@/components/ui/Pagination'
import { Modal } from '@/components/ui/Modal'
import { SubscriptionCreateForm } from '@/components/subscription/SubscriptionCreateForm'
import { formatDate } from '@/lib/utils'
import { Link } from 'react-router-dom'

const PAGE_SIZE = 10

export function SubscriptionsPage() {
  const [page, setPage] = useState(1)
  const [order, setOrder] = useState<'asc' | 'desc'>('desc')
  const [createOpen, setCreateOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const toast = useToast()
  const queryClient = useQueryClient()

  const {
    data: subData,
    error,
    isLoading,
  } = useQuery({
    queryKey: ['subscriptions', page, order],
    queryFn: () => subscriptions.list({ page, pageSize: PAGE_SIZE, order }),
  })



  const handleCreate = async (values: SubscriptionCreateRequest) => {
    setIsCreating(true)
    try {
      await subscriptions.create(values)
      toast.success('Subscription created successfully')
      setCreateOpen(false)
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] })
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to create subscription', 'Error')
    } finally {
      setIsCreating(false)
    }
  }

  const deleteSub = async (sub: SubscriptionResponse) => {
    if (!confirm(`Delete subscription "${sub.title}"?`)) return
    try {
      await subscriptions.delete(sub.uuid)
      toast.success('Subscription deleted')
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] })
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to delete subscription', 'Error')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white sm:text-xl">Subscriptions</h2>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={order}
            onChange={(e) => setOrder(e.target.value as 'asc' | 'desc')}
            className="min-w-[140px] flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 sm:flex-none"
          >
            <option value="desc">Newest first</option>
            <option value="asc">Oldest first</option>
          </select>
          <button
            onClick={() => setCreateOpen(true)}
            className="flex-1 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 sm:flex-none"
          >
            Create Subscription
          </button>
        </div>
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-300">
          {error instanceof ApiError ? error.message : 'Failed to load subscriptions'}
        </p>
      )}

      <div className="hidden md:block">
        <DataTable
          columns={[
            { header: 'Title', accessor: 'title', className: 'font-medium text-slate-900 dark:text-white', headerClassName: 'w-[220px]' },
            {
              header: 'Configs',
              headerClassName: 'w-[110px]',
              render: (r) => (
                <span className="text-sm text-slate-600 dark:text-slate-400">{(r.configs ?? []).length} config(s)</span>
              ),
            },
            { header: 'Creator', accessor: 'creator', headerClassName: 'w-[120px]' },
            {
              header: 'Created',
              headerClassName: 'w-[140px]',
              render: (r) => (
                <span className="text-sm text-slate-600 dark:text-slate-400">{formatDate(r.createdAt)}</span>
              ),
            },
            {
              header: '',
              headerClassName: 'w-[110px]',
              render: (r) => (
                <div className="flex items-center justify-end gap-1">
                  <Link
                    to={`/subscriptions/${r.uuid}`}
                    className="rounded-md p-1 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
                    title="View"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </Link>
                  <button
                    onClick={() => deleteSub(r)}
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
          data={subData?.subscriptions ?? []}
          isLoading={isLoading}
          emptyMessage="No subscriptions found"
        />
      </div>
      <div className="grid gap-3 md:hidden">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-700" />)
        ) : !(subData?.subscriptions ?? []).length ? (
          <p className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">No subscriptions found</p>
        ) : (
          (subData?.subscriptions ?? []).map((r) => (
            <div key={r.uuid} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft dark:border-slate-700 dark:bg-slate-900">
              <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{r.title}</p>
              <p className="mt-1 flex flex-wrap gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <span className="rounded-full bg-slate-100 px-2.5 py-1 dark:bg-slate-800">{(r.configs ?? []).length} configs</span>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 dark:bg-slate-800">{r.creator}</span>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 dark:bg-slate-800">{formatDate(r.createdAt)}</span>
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Link to={`/subscriptions/${r.uuid}`} className="flex min-h-[44px] items-center justify-center rounded-xl bg-slate-900 text-xs font-semibold text-white dark:bg-white dark:text-slate-900">View</Link>
                <button onClick={() => deleteSub(r)} className="flex min-h-[44px] items-center justify-center rounded-xl border border-red-200 bg-red-50 text-xs font-semibold text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300">Delete</button>
              </div>
            </div>
          ))
        )}
      </div>

      {subData && (
        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={subData.count}
          onPageChange={setPage}
        />
      )}

      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Create Subscription">
        <SubscriptionCreateForm
          onSubmit={handleCreate}
          isLoading={isCreating}
        />
      </Modal>
    </div>
  )
}
