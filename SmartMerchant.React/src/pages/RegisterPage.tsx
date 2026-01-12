import { useState, type FormEvent, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '@/api'

export function RegisterPage() {
  const navigate = useNavigate()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [middleName, setMiddleName] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSoleProprietorship, setIsSoleProprietorship] = useState(false)
  const [agreeToTerms, setAgreeToTerms] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isFormValid, setIsFormValid] = useState(false)

  useEffect(() => {
    const valid =
      firstName.trim() !== '' &&
      lastName.trim() !== '' &&
      username.trim().length >= 3 &&
      username.trim().length <= 50 &&
      password.length >= 12 &&
      password === confirmPassword &&
      isSoleProprietorship &&
      agreeToTerms

    setIsFormValid(valid)
  }, [firstName, lastName, username, password, confirmPassword, isSoleProprietorship, agreeToTerms])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!isFormValid) return

    setIsLoading(true)
    setError('')

    try {
      const response = await authApi.register({
        firstName,
        lastName,
        middleName: middleName || undefined,
        username,
        password
      })

      if (response.success) {
        // Registration successful, redirect to login
        navigate('/login')
      } else {
        setError(response.message || 'Registration failed. Please try again.')
      }
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { data?: { message?: string } } }
        setError(axiosError.response?.data?.message || 'Registration failed. Please try again.')
      } else {
        setError('Registration failed. Please check your connection.')
      }
    }

    setIsLoading(false)
  }

  return (
    <div className="mt-12 max-w-lg mx-auto">
      <div className="text-center mb-10">
        <div className="inline-flex items-center space-x-2 bg-lime-400/10 px-4 py-2 rounded-full border border-lime-400/20 mb-6">
          <span className="w-2 h-2 rounded-full lime-bg animate-pulse"></span>
          <span className="text-[10px] uppercase font-black tracking-[0.2em] lime-text">Onboarding Portal Open</span>
        </div>
        <h2 className="text-5xl font-black oswald uppercase mb-2">Join the <span className="lime-text">Circle</span></h2>
        <p className="text-gray-500 font-bold">Start processing global payments in minutes.</p>
      </div>

      <div className="glass-card p-10 space-y-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 lime-bg"></div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="auth-label">First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="John"
                className="w-full p-4 rounded-xl font-bold transition-all placeholder:text-gray-600"
                required
              />
            </div>
            <div>
              <label className="auth-label">Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Doe"
                className="w-full p-4 rounded-xl font-bold transition-all placeholder:text-gray-600"
                required
              />
            </div>
          </div>

          <div>
            <label className="auth-label">Middle Name (Optional)</label>
            <input
              type="text"
              value={middleName}
              onChange={(e) => setMiddleName(e.target.value)}
              placeholder="Michael"
              className="w-full p-4 rounded-xl font-bold transition-all placeholder:text-gray-600"
            />
          </div>

          <div>
            <label className="auth-label">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="johndoe"
              className="w-full p-4 rounded-xl font-bold transition-all placeholder:text-gray-600"
              required
            />
          </div>

          <div>
            <label className="auth-label">Account Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 12 characters"
              className="w-full p-4 rounded-xl font-bold transition-all placeholder:text-gray-600"
              required
            />
            {password.length > 0 && password.length < 12 && (
              <p className="text-red-400 text-xs font-bold mt-2">Password must be at least 12 characters</p>
            )}
          </div>

          <div>
            <label className="auth-label">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              className="w-full p-4 rounded-xl font-bold transition-all placeholder:text-gray-600"
              required
            />
          </div>

          <div className="p-4 bg-white/5 rounded-xl border border-white/5">
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isSoleProprietorship}
                onChange={(e) => setIsSoleProprietorship(e.target.checked)}
                className="mt-1 w-4 h-4 rounded !bg-transparent border-white/10 checked:!bg-lime-400"
              />
              <span className="text-[10px] text-gray-500 leading-relaxed font-bold">
                I'm sole proprietorship
              </span>
            </label>
          </div>

          <div className="p-4 bg-white/5 rounded-xl border border-white/5">
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreeToTerms}
                onChange={(e) => setAgreeToTerms(e.target.checked)}
                className="mt-1 w-4 h-4 rounded !bg-transparent border-white/10 checked:!bg-lime-400"
              />
              <span className="text-[10px] text-gray-500 leading-relaxed font-bold">
                I agree to the Global Merchant Agreement, Privacy Policy, and confirm that I am not engaged in any prohibited business activities as defined in the Master Service Disclosure.
              </span>
            </label>
          </div>

          {error && (
            <div className="bg-red-400/20 border border-red-400/50 text-red-400 px-4 py-3 rounded-xl text-sm font-bold">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!isFormValid || isLoading}
            className="btn-lime w-full py-5 rounded-2xl shadow-2xl text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <div className="text-center pt-4">
          <p className="text-sm text-gray-500 font-bold">
            Already a partner? <Link to="/login" className="lime-text hover:underline">Secure Log In</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
