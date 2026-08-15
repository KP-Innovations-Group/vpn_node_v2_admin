import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/lib/auth-context'
import { getAuth } from '@/lib/auth'

export function RequireAuth({ children }: { children: React.ReactElement }) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
      </div>
    )
  }

  const location = useLocation()
  if (!isAuthenticated || !getAuth().isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}
