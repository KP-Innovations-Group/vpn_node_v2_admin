import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiError, configs, subscriptions } from '@/lib/api-client'
import { useToast } from '@/lib/useToast'
import type {
  ConfigResponse,
  SubscriptionResponse,
  SubscriptionUpdateRequest,
} from '@/types/api'
import { Modal } from '@/components/ui/Modal'
import { DataTable } from '@/components/ui/DataTable'
import { formatDate, formatBytes } from '@/lib/utils'

export function SubscriptionDetailPage() {
  const { uuid } = useParams<{ uuid: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const toast = useToast()

  const [attachOpen, setAttachOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [isMutating, setIsMutating] = useState(false)
  const [selectedAttach, setSelectedAttach] = useState<string[]>([])

  const {
    data: sub,
    error,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['subscription', uuid],
    queryFn: () => subscriptions.get(uuid!),
    enabled: Boolean(uuid),
  })

  const { data: configListData } = useQuery({
    queryKey: ['configs-all'],
    queryFn: () => configs.list({ page: 1, pageSize: 100, order: 'asc' }),
    enabled: attachOpen,
    staleTime: 5 * 60_000,
  })

  const allConfigs = configListData?.configs ?? []
  const attachedUUIDs = new Set((sub?.configs ?? []).map((c) => c.uuid))
  const availableConfigs = allConfigs.filter((c) => !attachedUUIDs.has(c.uuid))

  const refresh = () => {
    refetch()
    queryClient.invalidateQueries({ queryKey: ['subscriptions'] })
  }

  const detachConfig = async (cfg: ConfigResponse) => {
    if (!sub) return
    setIsMutating(true)
    try {
      await subscriptions.update({
        uuid: sub.uuid,
        removeConfigUUIDs: [cfg.uuid],
      })
      toast.success('Config detached')
      refresh()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to detach config', 'Error')
    } finally {
      setIsMutating(false)
    }
  }

  const attachConfigs = async () => {
    if (!sub || selectedAttach.length === 0) {
      toast.warning('No configs selected')
      return
    }
    setIsMutating(true)
    try {
      await subscriptions.update({
        uuid: sub.uuid,
        addConfigUUIDs: selectedAttach,
      })
      toast.success('Configs attached')
      setAttachOpen(false)
      setSelectedAttach([])
      refresh()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to attach configs', 'Error')
    } finally {
      setIsMutating(false)
    }
  }

  const deleteSub = async () => {
    if (!sub) return
    if (!confirm(`Delete subscription "${sub.title}"?`)) return
    setIsMutating(true)
    try {
      await subscriptions.delete(sub.uuid)
      toast.success('Subscription deleted')
      navigate('/subscriptions')
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to delete subscription', 'Error')
    } finally {
      setIsMutating(false)
    }
  }

  const saveEdit = async (data: { title: string; description: string; subscriptionBaseURL: string }) => {
    if (!sub) return
    setIsMutating(true)
    try {
      const payload: SubscriptionUpdateRequest = {
        uuid: sub.uuid,
        title: data.title,
        description: data.description,
        subscriptionBaseURL: data.subscriptionBaseURL,
      }
      await subscriptions.update(payload)
      toast.success('Subscription updated')
      setEditOpen(false)
      refresh()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to update subscription', 'Error')
    } finally {
      setIsMutating(false)
    }
  }

  if (isLoading) {
    return <div className="text-center py-12 text-slate-500 dark:text-slate-400">Loading subscription…</div>
  }

  if (error || !sub) {
    return (
      <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-300">
        {error instanceof ApiError ? error.message : 'Subscription not found'}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="break-all text-lg font-bold tracking-tight text-slate-900 dark:text-white">Subscription: {sub.title}</h2>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setEditOpen(true)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            Edit
          </button>
          <button
            onClick={deleteSub}
            className="rounded-xl border border-red-600 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 dark:border-red-500 dark:text-red-300"
          >
            Delete
          </button>
          <button
            onClick={() => navigate('/subscriptions')}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            Back
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DetailCard label="Title" value={sub.title} />
        <DetailCard label="Creator" value={sub.creator} />
        <DetailCard label="Config Count" value={String(sub.configs.length)} />
        <DetailCard label="Created" value={formatDate(sub.createdAt)} />
      </div>

      {sub.subscriptionBaseURL && (
        <DetailCard
          label="Subscription Link"
          value={
            <a
              href={`${sub.subscriptionBaseURL}${sub.subscriptionLinkUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary-600 hover:underline"
            >
              {sub.subscriptionBaseURL}
              {sub.subscriptionLinkUrl}
            </a>
          }
        />
      )}

      {sub.description && <DetailCard label="Description" value={sub.description} />}

      <div className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Attached Configs</h3>
          <button
            onClick={() => setAttachOpen(true)}
            className="rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-700"
          >
            Attach Configs
          </button>
        </div>

        {sub.configs.length === 0 ? (
          <p className="text-sm text-gray-500">No configs attached to this subscription.</p>
        ) : (
          <DataTable
            columns={[
              { header: 'Email', accessor: 'email', className: 'font-medium text-gray-800' },
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
                    {r.configType === 'vless-xhttp' ? 'VLESS-XHTTP' : 'VLESS'}
                  </span>
                ),
              },
              {
                header: 'Quota',
                render: (r) => (
                  <span className="text-sm text-gray-600">
                    {formatBytes(r.quotaUsedBytes)} / {formatBytes(r.quotaLimitBytes)}
                  </span>
                ),
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
                header: '',
                render: (r) => (
                  <div className="flex justify-end">
                    <button
                      onClick={() => detachConfig(r)}
                      disabled={isMutating}
                      className="rounded-md p-1 text-sm text-red-600 hover:bg-gray-100"
                      title="Detach"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12H9m12 0l-4 4m-4-4l4-4" />
                      </svg>
                    </button>
                  </div>
                ),
              },
            ]}
            data={sub.configs}
            emptyMessage="No configs attached"
          />
        )}
      </div>

      <Modal
        isOpen={attachOpen}
        onClose={() => setAttachOpen(false)}
        title="Attach Configs"
      >
        <div className="space-y-4">
          <div className="max-h-64 space-y-1 overflow-y-auto rounded-md border border-gray-200 p-2">
            {availableConfigs.length === 0 ? (
              <p className="text-xs text-gray-500">No standalone configs available to attach.</p>
            ) : (
              availableConfigs.map((cfg) => (
                <label
                  key={cfg.uuid}
                  className="flex items-center gap-2 rounded p-1 text-sm hover:bg-surface-50"
                >
                  <input
                    type="checkbox"
                    checked={selectedAttach.includes(cfg.uuid)}
                    onChange={(e) =>
                      setSelectedAttach(
                        e.target.checked
                          ? [...selectedAttach, cfg.uuid]
                          : selectedAttach.filter((u) => u !== cfg.uuid),
                      )
                    }
                  />
                  <span className="truncate">{cfg.email}</span>
                  <span className="text-xs text-gray-400">({cfg.configType})</span>
                </label>
              ))
            )}
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setAttachOpen(false)}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={attachConfigs}
              disabled={isMutating || selectedAttach.length === 0}
              className="rounded-md bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
            >
              {isMutating ? 'Saving...' : 'Attach'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title="Edit Subscription">
        <EditSubscriptionForm sub={sub} onSubmit={saveEdit} isLoading={isMutating} />
      </Modal>
    </div>
  )
}

function DetailCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="text-xs uppercase text-gray-500">{label}</div>
      <div className="mt-1 break-words text-sm font-medium text-gray-800">{value}</div>
    </div>
  )
}

function EditSubscriptionForm({
  sub,
  onSubmit,
  isLoading,
}: {
  sub: SubscriptionResponse
  onSubmit: (data: { title: string; description: string; subscriptionBaseURL: string }) => Promise<void>
  isLoading: boolean
}) {
  const [title, setTitle] = useState(sub.title)
  const [description, setDescription] = useState(sub.description)
  const [subBaseURL, setSubBaseURL] = useState(sub.subscriptionBaseURL)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit({ title, description, subscriptionBaseURL: subBaseURL })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title *</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-600 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-600 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Subscription Base URL</label>
        <input
          type="url"
          value={subBaseURL}
          onChange={(e) => setSubBaseURL(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-600 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
      </div>
      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-md bg-primary-600 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
      >
        {isLoading ? 'Saving...' : 'Save'}
      </button>
    </form>
  )
}
