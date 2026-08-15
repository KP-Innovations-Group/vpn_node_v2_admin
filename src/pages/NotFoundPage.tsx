import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-6xl font-bold text-gray-300">404</div>
      <h2 className="mt-2 text-2xl font-semibold text-gray-700">Page not found</h2>
      <p className="mt-2 text-gray-500">The page you're looking for doesn't exist.</p>
      <Link
        to="/dashboard"
        className="mt-6 rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
      >
        Go to Dashboard
      </Link>
    </div>
  )
}
