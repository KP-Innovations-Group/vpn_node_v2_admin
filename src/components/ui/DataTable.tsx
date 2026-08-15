import type { ReactNode } from 'react'

export type Column<T> =
  | {
      header: string
      accessor: keyof T | ((row: T) => ReactNode)
      className?: string
      render?: (row: T) => ReactNode
      headerClassName?: string
    }
  | {
      header: string
      accessor?: undefined
      className?: string
      render: (row: T) => ReactNode
      headerClassName?: string
    }

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[] | null | undefined
  emptyMessage?: string
  isLoading?: boolean
  skeletonRows?: number
}

export function DataTable<T>({
  columns,
  data,
  emptyMessage = 'No results',
  isLoading = false,
  skeletonRows = 5,
}: DataTableProps<T>) {
  const items = data ?? []

  const cellContent = (col: Column<T>, row: T): ReactNode => {
    if ('render' in col && typeof col.render === 'function') {
      return col.render(row)
    }
    const accessor = ('accessor' in col ? col.accessor : undefined) as
      | keyof T
      | ((row: T) => ReactNode)
      | undefined
    if (typeof accessor === 'function') return accessor(row)
    if (accessor !== undefined) {
      const val = row[accessor]
      return val !== undefined ? String(val) : ''
    }
    return ''
  }

  return (
    <div className="overflow-x-auto rounded-md border border-gray-200 bg-white">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-surface-100">
          <tr>
            {columns.map((col, i) => (
              <th
                key={i}
                className={`px-4 py-2.5 text-left text-xs font-medium text-gray-600 uppercase tracking-wider ${col.headerClassName ?? ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {isLoading && items.length === 0 ? (
            Array.from({ length: skeletonRows }).map((_, i) => (
              <tr key={i}>
                {columns.map((_, j) => (
                  <td key={j} className="px-4 py-3">
                    <div className="h-4 animate-pulse rounded bg-gray-200" />
                  </td>
                ))}
              </tr>
            ))
          ) : items.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-8 text-center text-sm text-gray-500"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            items.map((row, i) => (
              <tr key={i} className="hover:bg-surface-50">
                {columns.map((col, j) => (
                  <td key={j} className={`px-4 py-2.5 text-sm ${col.className ?? ''}`}>
                    {cellContent(col, row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
