import { Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/lib/auth-context'
import { NavSidebar } from '@/components/layout/NavSidebar'

export function MainLayout() {
  const { logout } = useAuth()
  const location = useLocation()

  return (
    <div className="flex h-screen bg-surface-50">
      <NavSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 shadow-sm">
          <h1 className="text-lg font-semibold text-gray-800">
            {pageTitle(location.pathname)}
          </h1>
          <button
            onClick={logout}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
          >
            Logout
          </button>
        </header>
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

function pageTitle(path: string): string {
  if (path.startsWith('/configs')) return 'Configs'
  if (path.startsWith('/subscriptions')) return 'Subscriptions'
  if (path.startsWith('/dashboard')) return 'Dashboard'
  return 'VPN Node Admin'
}
