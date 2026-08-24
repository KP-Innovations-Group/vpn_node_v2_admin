import { useState } from 'react'
import { useForm } from 'react-hook-form'
import type { ConfigCreateRequest } from '@/types/api'

interface ConfigFormProps {
  onSubmit: (data: ConfigCreateRequest & { configType?: string }) => Promise<void>
  isLoading?: boolean
  defaultValues?: Partial<ConfigCreateRequest>
}

const ONE_GB = 1024 ** 3

export function ConfigForm({ onSubmit, isLoading, defaultValues }: ConfigFormProps) {
  const [configType, setConfigType] = useState('vless')
  const [unlimited, setUnlimited] = useState((defaultValues?.connectionAllowed ?? 0) === 0)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ConfigCreateRequest & { quotaGB: number; configType: string }>({
    defaultValues: {
      email: '',
      expirationTime: '',
      connectionAllowed: 0,
      configType: 'vless',
      ...defaultValues,
      // @ts-ignore virtual field
      quotaGB: defaultValues?.quotaLimit ? +(defaultValues.quotaLimit / ONE_GB).toFixed(2) : 100,
    } as unknown as ConfigCreateRequest & { quotaGB: number; configType: string },
  })

  const quotaGB = watch('quotaGB' as unknown as keyof ConfigCreateRequest & string) as unknown as number
  const connVal = watch('connectionAllowed')

  const handleValid = async (data: Record<string, unknown>) => {
    const gb = Number((data as { quotaGB: number }).quotaGB)
    const bytes = Math.round(gb * ONE_GB)
    const payload: ConfigCreateRequest & { configType: string } = {
      email: String(data.email).trim(),
      quotaLimit: bytes,
      expirationTime: data.expirationTime ? new Date(String(data.expirationTime)).toISOString() : '',
      connectionAllowed: unlimited ? 0 : Number(data.connectionAllowed ?? 0),
      initialQuotaUsedBytes: data.initialQuotaUsedBytes ? Number(data.initialQuotaUsedBytes) : undefined,
      configType,
    } as ConfigCreateRequest & { configType: string }
    await onSubmit(payload)
  }

  return (
    <form onSubmit={handleSubmit(handleValid as never)} className="space-y-5">
      <div>
        <label className="block text-xs font-semibold tracking-wide text-slate-700 dark:text-slate-300">Config type</label>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { id: 'vless', label: 'VLESS', enabled: true },
            { id: 'vless-xhttp', label: 'VLESS-XHTTP', enabled: true },
            { id: 'vmess', label: 'VMess', enabled: false },
            { id: 'trojan', label: 'Trojan', enabled: false },
          ].map((o) => (
            <button
              key={o.id}
              type="button"
              disabled={!o.enabled}
              onClick={() => setConfigType(o.id)}
              className={`rounded-xl border px-3 py-2.5 text-xs font-semibold transition ${configType === o.id ? 'border-primary-600 bg-primary-600 text-white shadow-sm' : o.enabled ? 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300' : 'border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-700 dark:bg-slate-800/50 cursor-not-allowed'}`}
            >
              {o.label}
              {!o.enabled && <span className="ml-1 text-[10px] opacity-70">soon</span>}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold tracking-wide text-slate-700 dark:text-slate-300">Email *</label>
        <input
          type="email"
          placeholder="user@example.com"
          {...register('email' as never, { required: 'Email is required' })}
          className="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        />
        {errors.email && <p className="mt-1 text-xs text-red-600">{(errors.email as { message?: string })?.message}</p>}
      </div>

      <div>
        <label className="block text-xs font-semibold tracking-wide text-slate-700 dark:text-slate-300">Quota *</label>
        <div className="mt-2 flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="number"
              step="0.1"
              min={0.1}
              // @ts-ignore
              {...register('quotaGB' as never, { required: 'Quota is required', valueAsNumber: true, validate: (v: number) => v > 0 || 'Must be > 0' })}
              className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 pr-12 text-sm font-medium text-slate-900 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              placeholder="1.2"
            />
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-xs font-bold text-slate-500">GB</span>
          </div>
          <span className="hidden text-xs text-slate-500 dark:text-slate-400 sm:block">{quotaGB ? `${Math.round(Number(quotaGB) * ONE_GB).toLocaleString()} bytes` : ''}</span>
        </div>
        {/* @ts-ignore */ errors.quotaGB && <p className="mt-1 text-xs text-red-600">{(errors as Record<string, { message?: string }>).quotaGB?.message}</p>}
      </div>

      <div>
        <label className="block text-xs font-semibold tracking-wide text-slate-700 dark:text-slate-300">Expiration *</label>
        <input
          type="datetime-local"
          {...register('expirationTime' as never, { required: 'Expiration is required' })}
          className="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-900 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        />
        {/* @ts-ignore */ errors.expirationTime && <p className="mt-1 text-xs text-red-600">{(errors.expirationTime as { message?: string })?.message}</p>}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-semibold tracking-wide text-slate-700 dark:text-slate-300">Initial used (GB, optional)</label>
          <div className="relative">
            <input
              type="number"
              step="0.1"
              min={0}
              placeholder="0"
              defaultValue={defaultValues?.initialQuotaUsedBytes ? +(defaultValues.initialQuotaUsedBytes / ONE_GB).toFixed(2) : undefined}
              onChange={(e) => {
                const v = e.target.value === '' ? undefined : Math.round(Number(e.target.value) * ONE_GB)
                setValue('initialQuotaUsedBytes' as never, v as never)
              }}
              className="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 pr-12 text-sm font-medium text-slate-900 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            <span className="pointer-events-none absolute inset-y-0 right-0 top-2 flex items-center pr-3 text-xs font-bold text-slate-500">GB</span>
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold tracking-wide text-slate-700 dark:text-slate-300">Concurrent connections</label>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => setUnlimited(true)}
              className={`flex-1 rounded-xl border px-3 py-2.5 text-xs font-semibold ${unlimited ? 'border-primary-600 bg-primary-600 text-white' : 'border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}
            >
              Unlimited
            </button>
            <button
              type="button"
              onClick={() => { setUnlimited(false); setValue('connectionAllowed' as never, 1 as never) }}
              className={`flex-1 rounded-xl border px-3 py-2.5 text-xs font-semibold ${!unlimited ? 'border-primary-600 bg-primary-600 text-white' : 'border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}
            >
              Limited
            </button>
          </div>
          {!unlimited && (
            <input
              type="number"
              min={0}
              {...register('connectionAllowed' as never, { valueAsNumber: true, min: 0 })}
              defaultValue={watch('connectionAllowed') ?? 1}
              onChange={(e) => setValue('connectionAllowed' as never, Number(e.target.value) as never)}
              className="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-900 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              placeholder="1"
            />
          )}
          <p className="mt-1 text-xs text-slate-500">{unlimited ? 'No limit' : connVal != null ? `${connVal} devices (0 = unlimited)` : ''}</p>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-xl bg-primary-600 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 disabled:opacity-60"
      >
        {isLoading ? 'Saving…' : 'Create'}
      </button>
    </form>
  )
}
