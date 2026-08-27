import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { useQuery } from '@tanstack/react-query'
import { configs } from '@/lib/api-client'
import type { SubscriptionCreateRequest, ConfigResponse } from '@/types/api'

interface SubscriptionFormProps {
  onSubmit: (data: SubscriptionCreateRequest) => Promise<void>
  isLoading?: boolean
}

export function SubscriptionCreateForm({ onSubmit, isLoading }: SubscriptionFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<SubscriptionCreateRequest>({
    defaultValues: {
      title: '',
      description: '',
      subscriptionBaseURL: 'https://sub.pixono.li:8443',
      configUUIDs: [],
    },
  })

  const [drafts, setDrafts] = useState<Array<{ email: string; quotaGB: number; expirationTime: string; configType: 'vless' | 'vless-xhttp'; remark: string; connectionAllowed: number; initialUsedGB: number | '' }>>([])

  const handleValid = async (data: SubscriptionCreateRequest) => {
    const newConfigs = drafts
      .filter((d) => d.email.trim())
      .map((d) => ({
        email: d.email.trim(),
        quotaLimit: Math.round(d.quotaGB * 1024 ** 3),
        expirationTime: d.expirationTime ? new Date(d.expirationTime).toISOString() : new Date(Date.now() + 30 * 86400 * 1000).toISOString(),
        configType: d.configType as 'vless' | 'vless-xhttp',
        remark: d.remark || undefined,
        connectionAllowed: d.connectionAllowed,
        initialQuotaUsedBytes: d.initialUsedGB === '' || d.initialUsedGB == null ? undefined : Math.round(Number(d.initialUsedGB) * 1024 ** 3),
      }))
    const payload: SubscriptionCreateRequest = {
      ...data,
      configUUIDs: data.configUUIDs ?? [],
      newConfigs: newConfigs.length ? (newConfigs as never) : undefined,
    }
    await onSubmit(payload)
  }

  const addDraft = () => setDrafts((d) => [...d, { email: '', quotaGB: 50, expirationTime: '', configType: 'vless', remark: '', connectionAllowed: 0, initialUsedGB: '' }])
  const updateDraft = (i: number, patch: Partial<(typeof drafts)[number]>) => setDrafts((d) => d.map((x, idx) => (idx === i ? { ...x, ...patch } : x)))
  const removeDraft = (i: number) => setDrafts((d) => d.filter((_, idx) => idx !== i))

  return (
    <form onSubmit={handleSubmit(handleValid)} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold tracking-wide text-slate-700 dark:text-slate-300">Title *</label>
        <input
          type="text"
          {...register('title', { required: 'Title is required' })}
          className="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-900 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        />
        {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>}
      </div>

      <div>
        <label className="block text-xs font-semibold tracking-wide text-slate-700 dark:text-slate-300">Description</label>
        <textarea
          {...register('description')}
          rows={2}
          className="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold tracking-wide text-slate-700 dark:text-slate-300">Subscription Base URL <span className="font-normal text-slate-500">— suggested</span></label>
        <input
          type="url"
          placeholder="https://sub.pixono.li:8443"
          {...register('subscriptionBaseURL')}
          className="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        />
        <p className="mt-1 text-xs text-slate-500">Recommendation: <span className="font-mono font-medium text-slate-700 dark:text-slate-300">https://sub.pixono.li:8443</span> — you can change it.</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/30">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Create new configs inline <span className="font-normal text-slate-500">— same as Create Config</span></p>
          <button type="button" onClick={addDraft} className="min-h-[36px] rounded-lg bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700">+ Add</button>
        </div>
        {drafts.length === 0 ? (
          <p className="mt-2 text-xs text-slate-500">No new configs — they’ll be created and attached together with the subscription.</p>
        ) : (
          <div className="mt-3 space-y-4">
            {drafts.map((d, i) => (
              <div key={i} className="space-y-5 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold tracking-wide text-slate-700 dark:text-slate-300">Config #{i + 1}</span>
                  <button type="button" onClick={() => removeDraft(i)} className="min-h-[32px] rounded-lg border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300">Remove</button>
                </div>

                <div>
                  <label className="block text-xs font-semibold tracking-wide text-slate-700 dark:text-slate-300">Config type</label>
                  <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {[
                      { id: 'vless', label: 'VLESS', enabled: true },
                      { id: 'vless-xhttp', label: 'VLESS-XHTTP', enabled: true },
                      { id: 'vmess', label: 'VMess', enabled: false },
                      { id: 'trojan', label: 'Trojan', enabled: false },
                    ].map((o) => (
                      <button key={o.id} type="button" disabled={!o.enabled} onClick={() => o.enabled && updateDraft(i, { configType: o.id as never })} className={`rounded-xl border px-3 py-2.5 text-xs font-semibold transition ${d.configType === o.id ? 'border-primary-600 bg-primary-600 text-white shadow-sm' : o.enabled ? 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300' : 'border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-700 dark:bg-slate-800/50 cursor-not-allowed'}`}>
                        {o.label}
                        {!o.enabled && <span className="ml-1 text-[10px] opacity-70">soon</span>}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold tracking-wide text-slate-700 dark:text-slate-300">Email *</label>
                  <input placeholder="user@example.com" value={d.email} onChange={(e) => updateDraft(i, { email: e.target.value })} className="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-[16px] font-medium text-slate-900 placeholder:text-slate-400 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white md:py-2.5 md:text-sm" />
                </div>

                <div>
                  <label className="block text-xs font-semibold tracking-wide text-slate-700 dark:text-slate-300">Quota *</label>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="relative flex-1">
                      <input type="number" step="0.1" min={0.1} value={d.quotaGB} onChange={(e) => updateDraft(i, { quotaGB: Number(e.target.value) })} className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 pr-12 text-[16px] font-medium text-slate-900 placeholder:text-slate-400 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white md:py-2.5 md:text-sm" placeholder="50" inputMode="decimal" />
                      <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-xs font-bold text-slate-500">GB</span>
                    </div>
                    <span className="hidden text-xs text-slate-500 dark:text-slate-400 sm:block">{d.quotaGB ? `${Math.round(Number(d.quotaGB) * 1024 ** 3).toLocaleString()} bytes` : ''}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {[20, 50, 100, 200].map((v) => (
                      <button key={v} type="button" onClick={() => updateDraft(i, { quotaGB: v })} className={`min-h-[36px] rounded-full border px-3 text-xs font-semibold ${Number(d.quotaGB) === v ? 'border-primary-600 bg-primary-600 text-white' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}>{v} GB</button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold tracking-wide text-slate-700 dark:text-slate-300">Expiration *</label>
                  <input type="datetime-local" value={d.expirationTime} onChange={(e) => updateDraft(i, { expirationTime: e.target.value })} className="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-[16px] font-medium text-slate-900 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white md:py-2.5 md:text-sm" />
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {[
                      { label: '1 month', months: 1 },
                      { label: '2 months', months: 2 },
                      { label: '3 months', months: 3 },
                      { label: '6 months', months: 6 },
                      { label: '1 year', months: 12 },
                    ].map((o) => (
                      <button key={o.label} type="button" onClick={() => { const dd = new Date(); dd.setMonth(dd.getMonth() + o.months); const pad = (n: number) => String(n).padStart(2, '0'); const v = `${dd.getFullYear()}-${pad(dd.getMonth() + 1)}-${pad(dd.getDate())}T${pad(dd.getHours())}:${pad(dd.getMinutes())}`; updateDraft(i, { expirationTime: v }) }} className="min-h-[32px] rounded-full border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">{o.label}</button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold tracking-wide text-slate-700 dark:text-slate-300">Remark <span className="font-normal text-slate-500">(optional)</span></label>
                  <input placeholder="client note / Ali VIP" value={d.remark} onChange={(e) => updateDraft(i, { remark: e.target.value })} className="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-[16px] font-medium text-slate-900 placeholder:text-slate-400 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white md:py-2.5 md:text-sm" />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold tracking-wide text-slate-700 dark:text-slate-300">Initial used (GB, optional)</label>
                    <div className="relative">
                      <input type="number" step="0.1" min={0} placeholder="0" value={d.initialUsedGB} onChange={(e) => updateDraft(i, { initialUsedGB: e.target.value === '' ? '' : Number(e.target.value) } as never)} className="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 pr-12 text-sm font-medium text-slate-900 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white" inputMode="decimal" />
                      <span className="pointer-events-none absolute inset-y-0 right-0 top-2 flex items-center pr-3 text-xs font-bold text-slate-500">GB</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold tracking-wide text-slate-700 dark:text-slate-300">Concurrent connections</label>
                    <div className="mt-2 flex gap-2">
                      <button type="button" onClick={() => updateDraft(i, { connectionAllowed: 0 })} className={`flex-1 rounded-xl border px-3 py-2.5 text-xs font-semibold ${d.connectionAllowed === 0 ? 'border-primary-600 bg-primary-600 text-white' : 'border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}>Unlimited</button>
                      <button type="button" onClick={() => updateDraft(i, { connectionAllowed: 1 })} className={`flex-1 rounded-xl border px-3 py-2.5 text-xs font-semibold ${d.connectionAllowed !== 0 ? 'border-primary-600 bg-primary-600 text-white' : 'border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}>Limited</button>
                    </div>
                    {d.connectionAllowed !== 0 && (
                      <input type="number" min={0} value={d.connectionAllowed} onChange={(e) => updateDraft(i, { connectionAllowed: Number(e.target.value) })} className="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-900 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                    )}
                    <p className="mt-1 text-xs text-slate-500">{d.connectionAllowed === 0 ? 'No limit' : `${d.connectionAllowed} devices (0 = unlimited)`}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Controller
        control={control}
        name="configUUIDs"
        render={({ field }) => (
          <PaginatedConfigSelect selected={field.value ?? []} onChange={field.onChange} />
        )}
      />

      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-xl bg-primary-600 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 disabled:opacity-60"
      >
        {isLoading ? 'Saving…' : 'Save'}
      </button>
    </form>
  )
}

function PaginatedConfigSelect({ selected, onChange }: { selected: string[]; onChange: (v: string[]) => void }) {
  const [page, setPage] = useState(1)
  const pageSize = 20
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['configs', 'select', page],
    queryFn: () => configs.list({ page, pageSize, order: 'desc' }),
  })

  const configsList: ConfigResponse[] = data?.configs ?? []
  const total = data?.count ?? 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const toggle = (uuid: string) => {
    const next = selected.includes(uuid) ? selected.filter((u) => u !== uuid) : [...selected, uuid]
    onChange(next)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold tracking-wide text-slate-700 dark:text-slate-300">Attach existing configs</label>
        <span className="text-xs text-slate-500 dark:text-slate-400">{selected.length} selected • {total} total</span>
      </div>
      <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-800/50">
        {isLoading ? (
          <div className="space-y-2 p-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-8 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
            ))}
          </div>
        ) : configsList.length === 0 ? (
          <p className="p-2 text-xs text-slate-500">No configs available.</p>
        ) : (
          configsList.map((cfg) => (
            <label key={cfg.uuid} className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-white dark:hover:bg-slate-700">
              <input type="checkbox" checked={selected.includes(cfg.uuid)} onChange={() => toggle(cfg.uuid)} className="rounded" />
              <span className="min-w-0 flex-1 truncate text-slate-900 dark:text-slate-100">{cfg.email}</span>
              <span className="shrink-0 rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">{cfg.configType}</span>
            </label>
          ))
        )}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500 dark:text-slate-400">Page {page} / {totalPages} • Newest first</span>
        <div className="flex gap-1.5">
          <button type="button" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">Prev</button>
          <button type="button" disabled={page >= totalPages || isFetching} onClick={() => setPage((p) => p + 1)} className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {isFetching ? 'Loading…' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}
