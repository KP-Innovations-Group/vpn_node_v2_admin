import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiError, configs } from '@/lib/api-client'
import { useToast } from '@/lib/useToast'
import { Modal } from '@/components/ui/Modal'
import { formatBytes, formatDate, isExpired } from '@/lib/utils'

export function ConfigDetailPage() {
  const { uuid } = useParams<{ uuid: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const toast = useToast()
  const [increaseOpen, setIncreaseOpen] = useState(false)
  const [connLimitOpen, setConnLimitOpen] = useState(false)
  const [isMutating, setIsMutating] = useState(false)

  const {
    data: config,
    error,
    isLoading,
    refetch,
  } = useQuery({
    queryFn: () => configs.get(uuid!),
    queryKey: ['config', uuid],
    enabled: Boolean(uuid),
  })

  const toggleEnabled = async () => {
    if (!config) return
    try {
      if (config.isEnabled) {
        await configs.disable(config.uuid)
        toast.success('Config disabled')
      } else {
        await configs.enable(config.uuid)
        toast.success('Config enabled')
      }
      refetch()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Action failed', 'Error')
    }
  }

  const deleteConfig = async () => {
    if (!config) return
    if (!confirm(`Delete config ${config.email}?`)) return
    try {
      await configs.delete(config.uuid)
      toast.success('Config deleted')
      navigate('/configs')
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to delete', 'Error')
    }
  }

  const handleIncrease = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!config) return
    const bytes = parseInt(new FormData(e.currentTarget).get('increaseBytes') as string, 10)
    if (!bytes || bytes < 1_000_000_000) {
      toast.error('Increase must be at least 1GB (1,000,000,000 bytes)')
      return
    }
    setIsMutating(true)
    try {
      await configs.increaseQuota(config.uuid, bytes)
      toast.success('Quota increased')
      setIncreaseOpen(false)
      refetch()
      queryClient.invalidateQueries({ queryKey: ['configs'] })
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to increase quota', 'Error')
    } finally {
      setIsMutating(false)
    }
  }

  const handleConnLimit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!config) return
    const limit = parseInt(new FormData(e.currentTarget).get('connectionAllowed') as string, 10)
    setIsMutating(true)
    try {
      await configs.setConnectionAllowed(config.uuid, limit)
      toast.success('Connection limit updated')
      setConnLimitOpen(false)
      refetch()
      queryClient.invalidateQueries({ queryKey: ['configs'] })
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to update connection limit', 'Error')
    } finally {
      setIsMutating(false)
    }
  }

  if (isLoading) {
    return <div className="text-center py-12 text-gray-500">Loading config...</div>
  }

  if (error || !config) {
    return (
      <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">
        {error instanceof ApiError ? error.message : 'Config not found'}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">Config: {config.email}</h2>
        <button
          onClick={() => navigate('/configs')}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
        >
          Back to Configs
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <DetailCard label="UUID" value={config.uuid} />
        <DetailCard label="Email" value={config.email} />
        <DetailCard label="Type" value={config.configType === 'vless-xhttp' ? 'VLESS-XHTTP' : 'VLESS'} />
        <DetailCard label="Creator" value={config.creator} />
        <DetailCard
          label="Status"
          value={
            <StatusBadge enabled={config.isEnabled} deleted={config.isDeleted} />
          }
        />
        <DetailCard
          label="Expiration"
          value={formatDate(config.expireAt)}
          sub={isExpired(config.expireAt) ? 'Expired' : ''}
          subColor={isExpired(config.expireAt) ? 'text-red-600' : 'text-gray-500'}
        />
        <DetailCard label="Concurrent Limit" value={config.connectionAllowed === 0 ? 'Unlimited' : String(config.connectionAllowed)} />
        <DetailCard label="Created" value={formatDate(config.createdAt)} />
        <DetailCard label="Updated" value={formatDate(config.updatedAt)} />
        <QuotaCard used={config.quotaUsedBytes} limit={config.quotaLimitBytes} />
      </div>

      {config.vlessConfig && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Share Link</label>
          <textarea
            readOnly
            value={config.vlessConfig}
            rows={4}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-600 read-only:bg-surface-50"
          />
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={toggleEnabled}
          disabled={config.isDeleted}
          className={`rounded-md px-4 py-2 text-sm font-medium ${
            config.isEnabled
              ? 'border border-amber-600 text-amber-700 hover:bg-amber-50'
              : 'border border-green-600 text-green-700 hover:bg-green-50'
          } disabled:cursor-not-allowed disabled:opacity-60`}
        >
          {config.isDeleted ? 'Deleted' : config.isEnabled ? 'Disable' : 'Enable'}
        </button>
        <button
          onClick={deleteConfig}
          disabled={config.isDeleted}
          className="rounded-md border border-red-600 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Delete
        </button>
        <button
          onClick={() => setIncreaseOpen(true)}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
        >
          Increase Quota
        </button>
        <button
          onClick={() => setConnLimitOpen(true)}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
        >
          Set Connection Limit
        </button>
      </div>

      <Modal isOpen={increaseOpen} onClose={() => setIncreaseOpen(false)} title="Increase Quota">
        <form onSubmit={handleIncrease} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Increase by (bytes) <span className="text-gray-500">(min 1GB = 1,000,000,000)</span>
            </label>
            <input
              type="number"
              name="increaseBytes"
              defaultValue={107374182400}
              min={1000000000}
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-600 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
          <button
            type="submit"
            disabled={isMutating}
            className="w-full rounded-md bg-primary-600 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
          >
            {isMutating ? 'Saving...' : 'Increase'}
          </button>
        </form>
      </Modal>

      <Modal isOpen={connLimitOpen} onClose={() => setConnLimitOpen(false)} title="Set Connection Limit">
        <form onSubmit={handleConnLimit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Max concurrent connections (0 = unlimited)
            </label>
            <input
              type="number"
              name="connectionAllowed"
              min={0}
              defaultValue={config.connectionAllowed}
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-600 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
          <button
            type="submit"
            disabled={isMutating}
            className="w-full rounded-md bg-primary-600 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
          >
            {isMutating ? 'Saving...' : 'Save'}
          </button>
        </form>
      </Modal>
    </div>
  )
}

function DetailCard({
  label,
  value,
  sub,
  subColor,
}: {
  label: string
  value: React.ReactNode
  sub?: string
  subColor?: string
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="text-xs uppercase text-gray-500">{label}</div>
      <div className="mt-1 break-words text-sm font-medium text-gray-800">{value}</div>
      {sub && <div className={`mt-1 text-xs ${subColor ?? 'text-gray-400'}`}>{sub}</div>}
    </div>
  )
}

function QuotaCard({ used, limit }: { used: number; limit: number }) {
  const pct = limit > 0 ? (used / limit) * 100 : 0
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="text-xs uppercase text-gray-500">Traffic Quota</div>
      <div className="mt-1 text-sm font-medium text-gray-800">
        {formatBytes(used)} / {formatBytes(limit)}
      </div>
      <div className="mt-2 h-2 w-full rounded bg-gray-200">
        <div
          className={`h-2 w-full rounded ${pct > 90 ? 'bg-red-500' : 'bg-primary-600'}`}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
    </div>
  )
}

function StatusBadge({ enabled, deleted }: { enabled: boolean; deleted: boolean }) {
  if (deleted)
    return (
      <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800">
        Deleted
      </span>
    )
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
        enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
      }`}
    >
      {enabled ? 'Active' : 'Disabled'}
    </span>
  )
}
