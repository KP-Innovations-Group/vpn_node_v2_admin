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
    <div className="overflow-hidden rounded-[16px] border border-slate-200 bg-white shadow-soft">
      <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50/80 backdrop-blur">
          <tr>
            {columns.map((col, i) => (
              <th
                key={i}
                className={`px-4 py-2.5 text-left text-[11px] font-semibold tracking-widest text-slate-500 uppercase ${col.headerClassName ?? ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {isLoading && items.length === 0 ? (
            Array.from({ length: skeletonRows }).map((_, i) => (
              <tr key={i}>
                {columns.map((_, j) => (
                  <td key={j} className="px-4 py-3">
                    <div className="h-4 animate-pulse rounded bg-slate-200" />
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
              <tr key={i} className="hover:bg-slate-50/70">
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
    </div>
  )
}
