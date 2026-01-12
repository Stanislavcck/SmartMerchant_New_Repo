import { Outlet, Navigate } from 'react-router-dom'
import { AdminHeader } from '@/components/AdminHeader'
import { AdminSidebar } from '@/components/AdminSidebar'
import { useAuthStore } from '@/store'

export function AdminLayout() {
  const { isAuthenticated } = useAuthStore()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="min-h-screen flex flex-col">
      <AdminHeader />
      <div className="pt-24 pb-12 px-6 w-full max-w-full">
        <div className="flex flex-col lg:flex-row gap-8">
          <AdminSidebar />
          <main className="flex-grow">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
