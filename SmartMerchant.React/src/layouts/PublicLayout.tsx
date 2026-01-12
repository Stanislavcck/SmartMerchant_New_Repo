import { Outlet } from 'react-router-dom'
import { Navigation } from '@/components/Navigation'
import { Footer } from '@/components/Footer'

export function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-grow pt-24 pb-12 px-6 w-full max-w-7xl mx-auto">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
