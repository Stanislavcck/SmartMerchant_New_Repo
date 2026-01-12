import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store'
import { authApi } from '@/api'
import type { User } from '@/types'

export function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      // Call login API
      const loginResponse = await authApi.login({ username, password })

      if (loginResponse.success && loginResponse.token) {
        // Get user details
        const userResponse = await authApi.getUser()
        
        if (userResponse.success && userResponse.user) {
          const user: User = {
            guid: userResponse.user.guid,
            firstName: userResponse.user.firstName,
            lastName: userResponse.user.lastName,
            middleName: userResponse.user.middleName,
            username: userResponse.user.username,
            password: '', // Don't store password
            passwordSalt: ''
          }
          
          login(user)
          navigate('/admin')
        } else {
          setError('Failed to get user information.')
        }
      } else {
        setError(loginResponse.message || 'Invalid username or password.')
      }
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { data?: { message?: string } } }
        setError(axiosError.response?.data?.message || 'Login failed. Please try again.')
      } else {
        setError('Login failed. Please check your connection.')
      }
    }

    setIsLoading(false)
  }

  return (
    <div className="mt-12 max-w-lg mx-auto">
      <div className="text-center mb-10">
        <div className="inline-flex items-center space-x-2 bg-white/5 px-4 py-2 rounded-full border border-white/10 mb-6">
          <svg className="w-4 h-4 lime-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span className="text-[10px] uppercase font-black tracking-[0.2em] text-gray-400">Secure Merchant Login</span>
        </div>
        <h2 className="text-5xl font-black oswald uppercase mb-2">Welcome <span className="lime-text">Back</span></h2>
        <p className="text-gray-500 font-bold">Access your global payment gateway.</p>
      </div>

      <div className="glass-card p-10 space-y-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 lime-bg"></div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-400/20 border border-red-400/50 text-red-400 px-4 py-3 rounded-xl text-sm font-bold">
              {error}
            </div>
          )}

          <div>
            <label className="auth-label">LOGIN</label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. LIME"
                className="w-full p-4 pl-12 rounded-xl font-bold transition-all placeholder:text-gray-600"
                required
              />
              <svg className="w-5 h-5 absolute left-4 top-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>

          <div>
            <label className="auth-label">PASSWORD</label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full p-4 pl-12 rounded-xl font-bold transition-all placeholder:text-gray-600"
                required
              />
              <svg className="w-5 h-5 absolute left-4 top-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          </div>

          <div className="flex justify-start items-center text-xs font-bold">
            <label className="flex items-center space-x-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded !bg-transparent border-white/10 checked:!bg-lime-400"
              />
              <span className="text-gray-500 group-hover:text-gray-300 transition">Trust this device for 30 days</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn-lime w-full py-5 rounded-2xl shadow-2xl text-lg flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <span>{isLoading ? 'Authorizing...' : 'Authorize Session'}</span>
            {!isLoading && (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            )}
          </button>
        </form>

        <div className="text-center pt-4">
          <p className="text-sm text-gray-500 font-bold">
            New to Lime? <Link to="/register" className="lime-text hover:underline">Apply for an Account</Link>
          </p>
        </div>

        <div className="mt-4 p-4 bg-white/5 rounded-xl border border-white/10">
          <p className="text-xs text-gray-500 font-bold mb-2">Demo credentials:</p>
          <p className="text-xs text-gray-400"><span className="lime-text">LIME</span> / <span className="lime-text">LIME</span> - Merchant with invoices</p>
          <p className="text-xs text-gray-400"><span className="lime-text">empty_merchant</span> / <span className="lime-text">12345678</span> - Empty merchant</p>
        </div>
      </div>
    </div>
  )
}
