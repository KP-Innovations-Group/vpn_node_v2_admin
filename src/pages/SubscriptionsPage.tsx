import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiError, configs, subscriptions } from '@/lib/api-client'
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
  const [order, setOrder] = useState<'asc' | 'desc'>('asc')
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

  const { data: configListData } = useQuery({
    queryKey: ['configs-all'],
    queryFn: () => configs.list({ page: 1, pageSize: 50, order: 'asc' }),
    staleTime: 5 * 60_000,
  })

  const existingConfigs = configListData?.configs ?? []

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
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">Subscriptions</h2>
        <div className="flex items-center gap-2">
          <select
            value={order}
            onChange={(e) => setOrder(e.target.value as 'asc' | 'desc')}
            className="rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-700"
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
          <button
            onClick={() => setCreateOpen(true)}
            className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            Create Subscription
          </button>
        </div>
      </div>

      {error && (
        <p className="rounded-md bg-red-50 p-3 text-sm text-red-600">
          {error instanceof ApiError ? error.message : 'Failed to load subscriptions'}
        </p>
      )}

      <DataTable
        columns={[
          { header: 'Title', accessor: 'title', className: 'font-medium text-gray-800' },
          {
            header: 'Configs',
            render: (r) => (
              <span className="text-sm text-gray-600">{r.configs.length} config(s)</span>
            ),
          },
          { header: 'Creator', accessor: 'creator' },
          {
            header: 'Created',
            render: (r) => (
              <span className="text-sm text-gray-600">{formatDate(r.createdAt)}</span>
            ),
          },
          {
            header: '',
            render: (r) => (
              <div className="flex items-center justify-end gap-1">
                <Link
                  to={`/subscriptions/${r.uuid}`}
                  className="rounded-md p-1 text-sm text-gray-600 hover:bg-gray-100"
                  title="View"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </Link>
                <button
                  onClick={() => deleteSub(r)}
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
        data={subData?.subscriptions}
        isLoading={isLoading}
        emptyMessage="No subscriptions found"
      />

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
          existingConfigs={existingConfigs}
          onSubmit={handleCreate}
          isLoading={isCreating}
        />
      </Modal>
    </div>
  )
}
