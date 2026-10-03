import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiError, configs } from '@/lib/api-client'
import { useToast } from '@/lib/useToast'
import { Modal } from '@/components/ui/Modal'
import {
  addMonthsClamped,
  formatBytes,
  formatDate,
  hasExpiry,
  isExpired,
  nextExpireAtCheck,
  nextQuotaAfterDecrease,
  ONE_GB,
  toDateTimeLocalValue,
} from '@/lib/utils'
import type { ConfigResponse } from '@/types/api'
import { QRCodeSVG } from 'qrcode.react'

export function ConfigDetailPage() {
  const { uuid } = useParams<{ uuid: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const toast = useToast()
  const [increaseOpen, setIncreaseOpen] = useState(false)
  const [decreaseOpen, setDecreaseOpen] = useState(false)
  const [expirationOpen, setExpirationOpen] = useState(false)
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

  const handleIncrease = async (increaseBytes: number) => {
    if (!config) return
    setIsMutating(true)
    try {
      await configs.increaseQuota(config.uuid, increaseBytes)
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

  const handleDecrease = async (decreaseBytes: number) => {
    if (!config) return
    setIsMutating(true)
    try {
      await configs.decreaseQuota(config.uuid, decreaseBytes)
      toast.success('Quota decreased')
      setDecreaseOpen(false)
      refetch()
      queryClient.invalidateQueries({ queryKey: ['configs'] })
    } catch (err) {
      // The node re-checks the rule against live usage, so a refusal can still arrive
      // here (usage grew since the modal opened) — show its reason rather than a guess.
      toast.error(err instanceof ApiError ? err.message : 'Failed to decrease quota', 'Error')
    } finally {
      setIsMutating(false)
    }
  }

  const handleSetExpiration = async (expirationTime: string) => {
    if (!config) return
    setIsMutating(true)
    try {
      await configs.setExpiration(config.uuid, expirationTime)
      toast.success('Expiration changed')
      setExpirationOpen(false)
      refetch()
      queryClient.invalidateQueries({ queryKey: ['configs'] })
    } catch (err) {
      // The node compares against its own clock, so a date only seconds ahead can still
      // be refused here — show its reason rather than the panel's guess.
      toast.error(err instanceof ApiError ? err.message : 'Failed to change expiration', 'Error')
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
    return <div className="text-center py-12 text-slate-500 dark:text-slate-400">Loading config…</div>
  }

  if (error || !config) {
    return (
      <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-300">
        {error instanceof ApiError ? error.message : 'Config not found'}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="break-all text-lg font-bold tracking-tight text-slate-900 dark:text-white">Config: {config.email}</h2>
        <button
          onClick={() => navigate('/configs')}
          className="self-start rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 sm:self-auto"
        >
          Back
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <DetailCard label="UUID" value={config.uuid} />
        <DetailCard label="Email" value={config.email} />
        <DetailCard label="Remark" value={config.remark || '—'} />
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
          value={hasExpiry(config.expireAt) ? formatDate(config.expireAt) : 'No expiry'}
          sub={hasExpiry(config.expireAt) && isExpired(config.expireAt) ? 'Expired' : ''}
          subColor="text-red-600"
        />
        <DetailCard label="Concurrent Limit" value={config.connectionAllowed === 0 ? 'Unlimited' : String(config.connectionAllowed)} />
        <DetailCard label="Created" value={formatDate(config.createdAt)} />
        <DetailCard label="Updated" value={formatDate(config.updatedAt)} />
        <QuotaCard used={config.quotaUsedBytes} limit={config.quotaLimitBytes} />
      </div>

      {config.vlessConfig && (
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Share Link {config.remark ? `— ${config.remark}` : ''}</label>
          <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
            <div className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
              <div className="rounded-xl p-3 shadow-sm" style={{ backgroundColor: '#fff' }}>
                <QRCodeSVG value={config.vlessConfig} size={180} level="M" bgColor="#ffffff" fgColor="#000000" includeMargin />
              </div>
              <p className="mt-2 text-center text-xs font-medium text-slate-500 dark:text-slate-400">Scan with client</p>
              <button
                onClick={() => {
                  const svg = document.getElementById(`qr-config-${config.uuid}`)
                  if (!svg) return
                  const s = new XMLSerializer().serializeToString(svg)
                  const blob = new Blob([s], { type: 'image/svg+xml' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `${config.email}-qr.svg`
                  a.click()
                  URL.revokeObjectURL(url)
                }}
                className="mt-2 text-xs font-semibold text-primary-600 hover:underline dark:text-primary-400"
              >
                Download SVG
              </button>
              <div className="hidden">
                <QRCodeSVG id={`qr-config-${config.uuid}`} value={config.vlessConfig} size={512} level="M" bgColor="#ffffff" fgColor="#000000" includeMargin />
              </div>
            </div>
            <div className="relative">
              <textarea
                readOnly
                value={config.vlessConfig}
                rows={6}
                className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 pr-20 font-mono text-xs text-slate-600 read-only:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(config.vlessConfig ?? '')
                  toast.success('Copied')
                }}
                className="absolute right-2 top-2 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900"
              >
                Copy
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          onClick={toggleEnabled}
          disabled={config.isDeleted}
          className={`rounded-xl px-4 py-2.5 text-sm font-semibold ${
            config.isEnabled
              ? 'border border-amber-600 text-amber-700 hover:bg-amber-50 dark:border-amber-500 dark:text-amber-300'
              : 'border border-emerald-600 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-500 dark:text-emerald-300'
          } disabled:cursor-not-allowed disabled:opacity-60`}
        >
          {config.isDeleted ? 'Deleted' : config.isEnabled ? 'Disable' : 'Enable'}
        </button>
        <button
          onClick={deleteConfig}
          disabled={config.isDeleted}
          className="rounded-xl border border-red-600 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50 dark:border-red-500 dark:text-red-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Delete
        </button>
        <button
          onClick={() => setIncreaseOpen(true)}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
        >
          Increase Quota
        </button>
        <button
          onClick={() => setDecreaseOpen(true)}
          disabled={config.quotaLimitBytes <= 0}
          title={config.quotaLimitBytes <= 0 ? 'This config has no quota limit to decrease' : undefined}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
        >
          Decrease Quota
        </button>
        <button
          onClick={() => setExpirationOpen(true)}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
        >
          Change expiry
        </button>
        <button
          onClick={() => setConnLimitOpen(true)}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
        >
          Connection Limit
        </button>
      </div>

      <Modal isOpen={increaseOpen} onClose={() => setIncreaseOpen(false)} title="Increase Quota">
        <IncreaseQuotaForm config={config} onSubmit={handleIncrease} isLoading={isMutating} />
      </Modal>

      <Modal isOpen={decreaseOpen} onClose={() => setDecreaseOpen(false)} title="Decrease Quota">
        <DecreaseQuotaForm config={config} onSubmit={handleDecrease} isLoading={isMutating} />
      </Modal>

      <Modal isOpen={expirationOpen} onClose={() => setExpirationOpen(false)} title="Change expiry">
        <ChangeExpiryForm config={config} onSubmit={handleSetExpiration} isLoading={isMutating} />
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

function ChangeExpiryForm({
  config,
  onSubmit,
  isLoading,
}: {
  config: ConfigResponse
  onSubmit: (expirationTime: string) => Promise<void>
  isLoading: boolean
}) {
  // Only mounted while the modal is open (Modal renders null when closed), so this
  // state — including a pending confirmation — resets on every open.
  const [value, setValue] = useState(() => toDateTimeLocalValue(config.expireAt))
  const [confirming, setConfirming] = useState(false)

  const current = hasExpiry(config.expireAt) ? new Date(config.expireAt) : null
  const check = nextExpireAtCheck(new Date(), value === '' ? null : new Date(value))
  const next = check.newExpireAt
  // The quick buttons count from today, so on a config that still has time left they
  // bring the date forward. That is the direction that expires a paying customer, so it
  // is the one case that asks for a second click.
  const movesEarlier = check.ok && !!next && current !== null && next.getTime() < current.getTime()

  const setDate = (date: Date) => {
    setValue(toDateTimeLocalValue(date))
    setConfirming(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!check.ok || !next) return
    if (movesEarlier && !confirming) {
      setConfirming(true)
      return
    }
    await onSubmit(next.toISOString())
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-xs text-gray-500">
        {current ? `Expires ${formatDate(config.expireAt)}.` : 'This config has no expiry set.'} Changing the date
        does not change the customer’s link.
      </p>

      {!config.isEnabled && !config.isDeleted && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-medium text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
          This config is disabled and will be re-enabled by this change.
        </p>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700">New expiration</label>
        <input
          type="datetime-local"
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            setConfirming(false)
          }}
          required
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-600 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
        <div className="mt-2 flex flex-wrap gap-1.5">
          {[
            { label: '1 month', months: 1 },
            { label: '2 months', months: 2 },
            { label: '3 months', months: 3 },
            { label: '6 months', months: 6 },
            { label: '1 year', months: 12 },
          ].map((o) => (
            <button
              key={o.label}
              type="button"
              onClick={() => setDate(addMonthsClamped(new Date(), o.months))}
              className="min-h-[32px] rounded-md border border-gray-300 px-3 text-xs font-medium text-gray-700 hover:bg-gray-100"
            >
              {o.label}
            </button>
          ))}
        </div>
        <p className="mt-1 text-xs text-gray-400">Quick buttons count from today, not from the current expiry.</p>
      </div>

      {check.ok && next && (
        <p className="text-sm text-gray-600">
          New expiration: <span className="font-semibold">{formatDate(next.toISOString())}</span>
        </p>
      )}

      {value !== '' && !check.ok && (
        <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {check.reason}
        </p>
      )}

      {movesEarlier && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-medium text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
          That is earlier than the current expiry ({formatDate(config.expireAt)}); the node disables the config within
          a minute of that moment.
        </p>
      )}

      <button
        type="submit"
        disabled={isLoading || !check.ok}
        className={`w-full rounded-md py-2 text-sm font-medium text-white disabled:opacity-60 ${
          confirming ? 'bg-red-600 hover:bg-red-700' : 'bg-primary-600 hover:bg-primary-700'
        }`}
      >
        {isLoading ? 'Saving...' : confirming ? 'Confirm earlier expiry' : 'Change expiry'}
      </button>
    </form>
  )
}

function IncreaseQuotaForm({
  config,
  onSubmit,
  isLoading,
}: {
  config: ConfigResponse
  onSubmit: (increaseBytes: number) => Promise<void>
  isLoading: boolean
}) {
  // Only mounted while the modal is open (Modal renders null when closed), so this state
  // resets on every open. 100 GB is what the byte input this replaced defaulted to.
  const [gb, setGb] = useState('100')

  const increaseBytes = gb.trim() === '' ? 0 : Math.round(Number(gb) * ONE_GB)
  // The node refuses an increase below 1 GB. It measures that floor as 1e9 bytes while the
  // panel's GB is 1024^3, so any whole GB clears it comfortably — but a fraction of a GB
  // would not, which is why the minimum is enforced in whole GB here.
  const valid = Number.isFinite(increaseBytes) && increaseBytes >= ONE_GB
  const unlimited = config.quotaLimitBytes <= 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!valid) return
    await onSubmit(increaseBytes)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-xs text-gray-500">
        Currently using {formatBytes(config.quotaUsedBytes)} of{' '}
        {unlimited ? 'an unlimited quota' : formatBytes(config.quotaLimitBytes)}.
      </p>

      <div>
        <label className="block text-sm font-medium text-gray-700">Increase by (GB)</label>
        <input
          type="number"
          name="increaseGB"
          value={gb}
          onChange={(e) => setGb(e.target.value)}
          min={1}
          step="any"
          required
          autoFocus
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-600 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
        <div className="mt-2 flex flex-wrap gap-1.5">
          {[10, 50, 100, 200].map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setGb(String(v))}
              className={`min-h-[32px] rounded-md border px-3 text-xs font-semibold ${
                gb === String(v)
                  ? 'border-primary-600 bg-primary-600 text-white'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-100'
              }`}
            >
              {v} GB
            </button>
          ))}
        </div>
        {valid && <p className="mt-1 text-xs text-gray-400">= {increaseBytes.toLocaleString()} bytes</p>}
      </div>

      {valid && (
        <p className="text-sm text-gray-600">
          New limit: <span className="font-semibold">{formatBytes(config.quotaLimitBytes + increaseBytes)}</span>
        </p>
      )}

      {gb.trim() !== '' && !valid && (
        <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          Enter at least 1 GB — the node refuses a smaller increase.
        </p>
      )}

      {unlimited && valid && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-medium text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
          This config has no limit today, and an increase sets a finite quota: it becomes{' '}
          {formatBytes(increaseBytes)} rather than unlimited.
        </p>
      )}

      <button
        type="submit"
        disabled={isLoading || !valid}
        className="w-full rounded-md bg-primary-600 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
      >
        {isLoading ? 'Saving...' : 'Increase'}
      </button>
    </form>
  )
}

function DecreaseQuotaForm({
  config,
  onSubmit,
  isLoading,
}: {
  config: ConfigResponse
  onSubmit: (decreaseBytes: number) => Promise<void>
  isLoading: boolean
}) {
  // Only mounted while the modal is open (Modal renders null when closed), so this
  // state — including a pending confirmation — resets on every open.
  const [gb, setGb] = useState('')
  const [confirming, setConfirming] = useState(false)

  const decreaseBytes = gb.trim() === '' ? 0 : Math.round(Number(gb) * ONE_GB)
  const check = nextQuotaAfterDecrease(config.quotaLimitBytes, config.quotaUsedBytes, decreaseBytes)
  const hasAmount = decreaseBytes > 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!check.ok) return
    // The first click only arms the button: a decrease can cut a user off, so applying
    // it should be deliberate rather than a single mis-click.
    if (!confirming) {
      setConfirming(true)
      return
    }
    await onSubmit(decreaseBytes)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-xs text-gray-500">
        Currently {formatBytes(config.quotaUsedBytes)} used of {formatBytes(config.quotaLimitBytes)}. A decrease
        cannot go below what is already used, and cannot reach zero (0 means unlimited).
      </p>

      <div>
        <label className="block text-sm font-medium text-gray-700">Decrease by (GB)</label>
        <input
          type="number"
          name="decreaseGB"
          value={gb}
          onChange={(e) => {
            setGb(e.target.value)
            setConfirming(false)
          }}
          min={0}
          step="any"
          required
          autoFocus
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-600 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
        {hasAmount && <p className="mt-1 text-xs text-gray-500">{decreaseBytes.toLocaleString()} bytes</p>}
      </div>

      {hasAmount && (
        <p className="text-sm text-gray-600">
          New limit: <span className="font-semibold">{formatBytes(Math.max(0, check.newLimitBytes))}</span>
        </p>
      )}

      {hasAmount && !check.ok && (
        <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {check.reason}
        </p>
      )}

      {check.ok && check.warning && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-medium text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
          {check.warning}
        </p>
      )}

      <button
        type="submit"
        disabled={isLoading || !check.ok}
        className={`w-full rounded-md py-2 text-sm font-medium text-white disabled:opacity-60 ${
          confirming ? 'bg-red-600 hover:bg-red-700' : 'bg-primary-600 hover:bg-primary-700'
        }`}
      >
        {isLoading ? 'Saving...' : confirming ? 'Confirm decrease' : 'Decrease'}
      </button>
    </form>
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
    <div className="rounded-[16px] border border-slate-200 bg-white p-4 shadow-soft dark:border-slate-800 dark:bg-slate-900">
      <div className="text-[11px] font-semibold tracking-widest text-slate-500 dark:text-slate-400 uppercase">{label}</div>
      <div className="mt-1 break-words text-sm font-medium text-slate-900 dark:text-slate-100">{value}</div>
      {sub && <div className={`mt-1 text-xs ${subColor ?? 'text-slate-400'}`}>{sub}</div>}
    </div>
  )
}

function QuotaCard({ used, limit }: { used: number; limit: number }) {
  const pct = limit > 0 ? (used / limit) * 100 : 0
  return (
    <div className="rounded-[16px] border border-slate-200 bg-white p-4 shadow-soft dark:border-slate-800 dark:bg-slate-900">
      <div className="text-[11px] font-semibold tracking-widest text-slate-500 dark:text-slate-400 uppercase">Traffic Quota</div>
      <div className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">
        {formatBytes(used)} / {formatBytes(limit)}
      </div>
      <div className="mt-2 h-2 w-full rounded bg-slate-200 dark:bg-slate-700">
        <div
          className={`h-2 rounded ${pct > 90 ? 'bg-red-500' : 'bg-primary-600'}`}
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
