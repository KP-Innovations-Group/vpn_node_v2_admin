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
    <div className="overflow-hidden rounded-[16px] border border-slate-200 bg-white shadow-soft dark:border-slate-700 dark:bg-slate-900">
      <div className="overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]">
      <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
        <thead className="bg-slate-50/80 backdrop-blur dark:bg-slate-800/80">
          <tr>
            {columns.map((col, i) => (
              <th
                key={i}
                className={`whitespace-nowrap px-4 py-2.5 text-left text-[11px] font-semibold tracking-widest text-slate-500 dark:text-slate-400 uppercase ${col.headerClassName ?? ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
          {isLoading && items.length === 0 ? (
            Array.from({ length: skeletonRows }).map((_, i) => (
              <tr key={i}>
                {columns.map((_, j) => (
                  <td key={j} className="px-4 py-3">
                    <div className="h-4 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                  </td>
                ))}
              </tr>
            ))
          ) : items.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            items.map((row, i) => (
              <tr key={i} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/60">
                {columns.map((col, j) => (
                  <td key={j} className={`px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 ${col.className ?? ''}`}>
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
