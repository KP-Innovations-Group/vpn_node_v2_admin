interface PaginationProps {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
}

export function Pagination({ page, pageSize, total, onPageChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const pages: (number | string)[] = []
  const add = (n: number) => {
    if (n >= 1 && n <= totalPages && !pages.includes(n)) pages.push(n)
  }

  add(1)
  if (page - 2 > 1 && totalPages > 5) pages.push('ellipsis')
  add(page - 1)
  add(page)
  add(page + 1)
  if (totalPages - 1 > page + 1 && totalPages > 5) pages.push('ellipsis')
  add(totalPages)

  const go = (p: number) => {
    if (p < 1) p = 1
    if (p > totalPages) p = totalPages
    if (p !== page) onPageChange(p)
  }

  return (
    <div className="flex flex-col gap-3 border-t border-slate-200 px-2 py-3 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-sm text-slate-600 dark:text-slate-400">
        {total === 0
          ? 'No results'
          : `Showing ${(page - 1) * pageSize + 1}-${Math.min(page * pageSize, total)} of ${total}`}
      </div>
      <nav className="flex flex-wrap items-center gap-1">
        <button
          onClick={() => go(page - 1)}
          disabled={page <= 1}
          className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
        >
          Prev
        </button>
        {pages.map((p, i) =>
          p === 'ellipsis' ? (
            <span key={`e-${i}`} className="px-2 text-sm text-slate-400">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => go(p as number)}
              className={`rounded-xl px-3 py-1.5 text-sm font-semibold ${
                p === page
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {p}
            </button>
          ),
        )}
        <button
          onClick={() => go(page + 1)}
          disabled={page >= totalPages}
          className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
        >
          Next
        </button>
      </nav>
    </div>
  )
}
