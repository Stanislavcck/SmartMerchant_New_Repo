import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store'
import { authApi } from '@/api'

export function AdminHeader() {
  const navigate = useNavigate()
  const { logout } = useAuthStore()

  const handleLogout = async () => {
    try {
      await authApi.logout()
    } catch (error) {
      console.error('Logout error:', error)
    }
    logout()
    navigate('/')
  }

  return (
    <header className="fixed top-0 w-full z-50 px-6 py-4 flex justify-between items-center glass-card border-none rounded-none bg-opacity-80 backdrop-blur-md">
      <div className="flex items-center space-x-2">
        <Link to="/" className="flex items-center space-x-2">
          <div className="w-10 h-10 lime-bg rounded-xl flex items-center justify-center">
            <span className="text-black font-black text-xl">L</span>
          </div>
          <span className="fancy-nav text-2xl tracking-wider lime-text">LIME MERCHANT</span>
        </Link>
      </div>
      <div className="flex items-center space-x-4">
        <Link to="/" className="text-white hover:lime-text font-bold text-sm transition">
          Home
        </Link>
        <button
          onClick={handleLogout}
          className="text-white hover:lime-text font-bold text-sm transition"
        >
          Logout
        </button>
      </div>
    </header>
  )
}
