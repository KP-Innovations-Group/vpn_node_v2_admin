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
    <div className="flex items-center justify-between border-t border-gray-200 px-2 py-3">
      <div className="text-sm text-gray-600">
        {total === 0
          ? 'No results'
          : `Showing ${(page - 1) * pageSize + 1}-${Math.min(page * pageSize, total)} of ${total}`}
      </div>
      <nav className="flex items-center gap-1">
        <button
          onClick={() => go(page - 1)}
          disabled={page <= 1}
          className="rounded-md border border-gray-300 px-2.5 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-50"
        >
          Prev
        </button>
        {pages.map((p, i) =>
          p === 'ellipsis' ? (
            <span key={`e-${i}`} className="px-2 text-sm text-gray-400">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => go(p as number)}
              className={`rounded-md px-2.5 py-1 text-sm ${
                p === page
                  ? 'bg-primary-600 text-white'
                  : 'border border-gray-300 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {p}
            </button>
          ),
        )}
        <button
          onClick={() => go(page + 1)}
          disabled={page >= totalPages}
          className="rounded-md border border-gray-300 px-2.5 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
        </button>
      </nav>
    </div>
  )
}
