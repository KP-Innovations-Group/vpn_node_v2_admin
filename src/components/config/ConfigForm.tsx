import { useForm } from 'react-hook-form'
import type { ConfigCreateRequest } from '@/types/api'

interface ConfigFormProps {
  onSubmit: (data: ConfigCreateRequest) => Promise<void>
  isLoading?: boolean
  defaultValues?: Partial<ConfigCreateRequest>
}

const ONE_GB = 1024 ** 3
const ONE_HUNDRED_GB = 100 * ONE_GB

export function ConfigForm({ onSubmit, isLoading, defaultValues }: ConfigFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ConfigCreateRequest>({
    defaultValues: {
      email: '',
      quotaLimit: ONE_HUNDRED_GB,
      expirationTime: '',
      connectionAllowed: 0,
      ...defaultValues,
    },
  })

  const handleValid = async (data: ConfigCreateRequest) => {
    const converted: ConfigCreateRequest = { ...data }
    if (converted.expirationTime) {
      const parsed = new Date(converted.expirationTime)
      if (!Number.isNaN(parsed.getTime())) {
        converted.expirationTime = parsed.toISOString()
      }
    }
    await onSubmit(converted)
  }

  return (
    <form onSubmit={handleSubmit(handleValid)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Email *</label>
        <input
          type="email"
          placeholder="user@example.com"
          {...register('email', { required: 'Email is required' })}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-600 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
        {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Quota Limit (bytes) *</label>
        <input
          type="number"
          {...register('quotaLimit', {
            required: 'Quota is required',
            valueAsNumber: true,
            validate: (v) => v > 0 || 'Must be greater than 0',
          })}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-600 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
        {errors.quotaLimit && (
          <p className="mt-1 text-xs text-red-600">{errors.quotaLimit.message}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          Tip: 100GB = {ONE_HUNDRED_GB.toLocaleString()}, 1GB = {ONE_GB.toLocaleString()}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Expiration Time (RFC3339) *</label>
        <input
          type="datetime-local"
          {...register('expirationTime', { required: 'Expiration is required' })}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-600 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
        {errors.expirationTime && (
          <p className="mt-1 text-xs text-red-600">{errors.expirationTime.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700">Initial Used (bytes, optional)</label>
          <input
            type="number"
            {...register('initialQuotaUsedBytes', { valueAsNumber: true })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-600 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Concurrent Conn. Limit</label>
          <input
            type="number"
            {...register('connectionAllowed', { valueAsNumber: true, min: 0 })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-600 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
          <p className="mt-1 text-xs text-gray-500">0 = unlimited</p>
        </div>
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
