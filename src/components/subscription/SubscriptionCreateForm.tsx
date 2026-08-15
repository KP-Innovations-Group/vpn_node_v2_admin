import { useForm, Controller } from 'react-hook-form'
import type { SubscriptionCreateRequest, ConfigResponse } from '@/types/api'

interface SubscriptionFormProps {
  existingConfigs: ConfigResponse[]
  onSubmit: (data: SubscriptionCreateRequest) => Promise<void>
  isLoading?: boolean
}

export function SubscriptionCreateForm({
  existingConfigs,
  onSubmit,
  isLoading,
}: SubscriptionFormProps) {
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
        <label className="block text-sm font-medium text-gray-700">Title *</label>
        <input
          type="text"
          {...register('title', { required: 'Title is required' })}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-600 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
        {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          {...register('description')}
          rows={3}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-600 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Subscription Base URL</label>
        <input
          type="url"
          placeholder="https://sub.example.com"
          {...register('subscriptionBaseURL')}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-600 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
      </div>

      <Controller
        control={control}
        name="configUUIDs"
        render={({ field }) => (
          <ConfigMultiSelect
            configs={existingConfigs}
            selected={field.value ?? []}
            onChange={field.onChange}
          />
        )}
      />

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

function ConfigMultiSelect({
  configs,
  selected,
  onChange,
}: {
  configs: ConfigResponse[]
  selected: string[]
  onChange: (values: string[]) => void
}) {
  const toggle = (uuid: string) => {
    const next = selected.includes(uuid)
      ? selected.filter((u) => u !== uuid)
      : [...selected, uuid]
    onChange(next)
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Attach configs (optional)
      </label>
      <div className="max-h-48 space-y-1 overflow-y-auto rounded-md border border-gray-200 p-2">
        {configs.length === 0 ? (
          <p className="text-xs text-gray-500">No configs available.</p>
        ) : (
          configs.map((cfg) => (
            <label
              key={cfg.uuid}
              className="flex items-center gap-2 rounded p-1 text-sm hover:bg-surface-50"
            >
              <input
                type="checkbox"
                checked={selected.includes(cfg.uuid)}
                onChange={() => toggle(cfg.uuid)}
              />
              <span className="truncate">{cfg.email}</span>
              <span className="text-xs text-gray-400">({cfg.configType})</span>
            </label>
          ))
        )}
      </div>
    </div>
  )
}
