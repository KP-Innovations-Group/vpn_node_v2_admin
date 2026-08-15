import { Routes, Route, Navigate } from 'react-router-dom'
import { RequireAuth } from '@/components/auth/RequireAuth'
import { MainLayout } from '@/components/layout/MainLayout'
import { LoginPage } from '@/pages/LoginPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { ConfigsPage } from '@/pages/ConfigsPage'
import { ConfigDetailPage } from '@/pages/ConfigDetailPage'
import { SubscriptionsPage } from '@/pages/SubscriptionsPage'
import { SubscriptionDetailPage } from '@/pages/SubscriptionDetailPage'
import { NotFoundPage } from '@/pages/NotFoundPage'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/*"
        element={
          <RequireAuth>
            <MainLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="configs" element={<ConfigsPage />} />
        <Route path="configs/:uuid" element={<ConfigDetailPage />} />
        <Route path="subscriptions" element={<SubscriptionsPage />} />
        <Route path="subscriptions/:uuid" element={<SubscriptionDetailPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
