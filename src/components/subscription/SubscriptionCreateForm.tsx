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
      subscriptionBaseURL: '',
      configUUIDs: [],
    },
  })

  const handleValid = async (data: SubscriptionCreateRequest) => {
    const payload: SubscriptionCreateRequest = {
      ...data,
      configUUIDs: data.configUUIDs ?? [],
    }
    await onSubmit(payload)
  }

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
        <label className="block text-xs font-semibold tracking-wide text-slate-700 dark:text-slate-300">Subscription Base URL</label>
        <input
          type="url"
          placeholder="https://sub.example.com"
          {...register('subscriptionBaseURL')}
          className="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        />
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
        <label className="block text-xs font-semibold tracking-wide text-slate-700 dark:text-slate-300">Attach configs (optional)</label>
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
