import { NavLink } from 'react-router-dom'

interface NavItem {
  label: string
  to: string
  icon: React.ReactNode
}

const items: NavItem[] = [
  {
    label: 'Dashboard',
    to: '/dashboard',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2v8a2 2 0 002 2h10a2 2 0 002-2V10l2 2" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7 7 7" />
      </svg>
    ),
  },
  {
    label: 'Configs',
    to: '/configs',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 12V4m0 0l-4 4m4-4l4 4M4 16h16" />
      </svg>
    ),
  },
  {
    label: 'Subscriptions',
    to: '/subscriptions',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0v7a2 2 0 01-2 2H7a2 2 0 01-2-2V9a2 2 0 012-2h10a2 2 0 012 2v7a2 2 0 01-2 2v2a2 2 0 01-2 2h-2" />
      </svg>
    ),
  },
]

export function NavSidebar() {
  return (
    <nav className="flex w-56 shrink-0 flex-col border-r border-gray-200 bg-white">
      <div className="flex h-14 items-center border-b border-gray-200 px-4">
        <span className="text-sm font-bold text-primary-700">VPN Node Admin</span>
      </div>
      <ul className="flex-1 space-y-1 py-2">
        {items.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-4 py-2 text-sm font-medium ${
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-surface-100 hover:text-gray-800'
                }`
              }
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
