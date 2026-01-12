import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store'

export function Navigation() {
  const navigate = useNavigate()
  const { isAuthenticated, logout } = useAuthStore()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <nav className="fixed top-0 w-full z-50 px-6 py-4 flex justify-between items-center glass-card border-none rounded-none bg-opacity-80 backdrop-blur-md">
      {/* Logo */}
      <Link to="/" className="flex items-center space-x-2">
        <div className="w-10 h-10 lime-bg rounded-xl flex items-center justify-center">
          <span className="text-black font-black text-xl">L</span>
        </div>
        <span className="fancy-nav text-2xl tracking-wider lime-text">LIME MERCHANT</span>
      </Link>

      {/* Navigation Links */}
      <div className="hidden md:flex space-x-8 font-semibold uppercase text-sm tracking-widest">
        <NavLink 
          to="/features" 
          className={({ isActive }) => 
            `transition ${isActive ? 'lime-text' : 'text-white hover:lime-text'}`
          }
        >
          Features
        </NavLink>
        <NavLink 
          to="/pricing" 
          className={({ isActive }) => 
            `transition ${isActive ? 'lime-text' : 'text-white hover:lime-text'}`
          }
        >
          Pricing
        </NavLink>
      </div>

      {/* Auth Buttons */}
      <div className="flex items-center space-x-4">
        {!isAuthenticated ? (
          <>
            <Link 
              to="/login" 
              className="hidden sm:block text-white hover:lime-text font-bold transition"
            >
              Log In
            </Link>
            <Link 
              to="/register" 
              className="btn-lime px-6 py-2 rounded-full text-sm"
            >
              Join Now
            </Link>
          </>
        ) : (
          <>
            <Link 
              to="/admin" 
              className="text-white hover:lime-text font-bold transition"
            >
              Dashboard
            </Link>
            <button 
              onClick={handleLogout}
              className="text-white hover:lime-text font-bold transition"
            >
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  )
}
