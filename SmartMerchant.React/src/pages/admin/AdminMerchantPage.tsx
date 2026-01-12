import { useState, useEffect, type FormEvent } from 'react'
import { merchantApi } from '@/api'
import type { Merchant } from '@/types'

export function AdminMerchantPage() {
  const [merchant, setMerchant] = useState<Merchant | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [logoURL, setLogoURL] = useState('')
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')
  const [imageError, setImageError] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const fetchMerchant = async () => {
      setIsLoading(true)
      try {
        const data = await merchantApi.getMerchant()
        setMerchant(data)
        if (data) {
          setName(data.name)
          setDescription(data.description)
          setLogoURL(data.logoURL)
        }
      } catch (error) {
        console.error('Failed to fetch merchant:', error)
      }
      setIsLoading(false)
    }

    fetchMerchant()
  }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    
    if (!merchant) return

    setIsSaving(true)
    try {
      const result = await merchantApi.edit(merchant.guid, {
        name,
        description,
        logoUrl: logoURL
      })

      if (result.success) {
        // Update local state
        setMerchant({
          ...merchant,
          name,
          description,
          logoURL
        })
        setMessage('Merchant updated successfully!')
        setMessageType('success')
        setIsEditing(false)
      } else {
        setMessage(result.message || 'Failed to update merchant')
        setMessageType('error')
      }
    } catch (error) {
      setMessage('Failed to update merchant. Please try again.')
      setMessageType('error')
    }
    setIsSaving(false)

    setTimeout(() => setMessage(''), 3000)
  }

  const handleStartEdit = () => {
    setName(merchant?.name || '')
    setDescription(merchant?.description || '')
    setLogoURL(merchant?.logoURL || '')
    setImageError(false)
    setIsEditing(true)
  }

  const handleLogoURLChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLogoURL(e.target.value)
    setImageError(false)
  }

  // Logo Preview Component
  const LogoPreview = ({ url, size = 'lg' }: { url: string; size?: 'sm' | 'lg' }) => {
    const sizeClasses = size === 'lg' 
      ? 'w-32 h-32 rounded-[2rem]' 
      : 'w-24 h-24 rounded-2xl'
    
    const textSize = size === 'lg' ? 'text-4xl' : 'text-2xl'

    return (
      <div className={`${sizeClasses} lime-bg shadow-xl flex items-center justify-center overflow-hidden ring-4 ring-black/50`}>
        {url && !imageError ? (
          <img 
            src={url} 
            alt="Logo Preview"
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <span className={`text-black font-black ${textSize}`}>
            {name?.charAt(0)?.toUpperCase() || merchant?.name?.charAt(0)?.toUpperCase() || 'L'}
          </span>
        )}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-lime-400 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (!merchant) {
    return (
      <div className="glass-card p-8 text-center">
        <h3 className="text-xl font-black oswald uppercase mb-4">No Merchant Found</h3>
        <p className="text-gray-500 font-bold">Please contact support to set up your merchant account.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-black oswald uppercase">
          Merchant <span className="lime-text">Settings</span>
        </h2>
        <p className="text-gray-500 font-bold text-sm uppercase tracking-widest">
          Manage your merchant profile and business information
        </p>
      </div>

      <div className="glass-card p-8">
        {message && (
          <div className={`mb-6 px-4 py-3 rounded-xl text-sm font-bold ${
            messageType === 'success' ? 'bg-lime-400/20 text-lime-400' : 'bg-red-400/20 text-red-400'
          }`}>
            {message}
          </div>
        )}

        {!isEditing ? (
          <div className="space-y-6">
            {/* Logo Preview Section */}
            <div className="flex items-start gap-8">
              <LogoPreview url={merchant?.logoURL || ''} size="lg" />
              <div className="flex-1 space-y-4">
                <div>
                  <div className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-2">Business Name</div>
                  <div className="text-2xl font-black">{merchant?.name || 'Not set'}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-2">Merchant Code</div>
                  <div className="text-lg font-bold text-gray-400">{merchant?.code || 'N/A'}</div>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 pt-4 border-t border-white/5">
              <div>
                <div className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-2">Balance</div>
                <div className="text-xl font-bold lime-text">
                  ₴ {(merchant?.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div>
                <div className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-2">Logo URL</div>
                <div className="text-sm font-bold text-gray-400 truncate">{merchant?.logoURL || 'Not set'}</div>
              </div>
            </div>
            
            <div>
              <div className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-2">Description</div>
              <div className="text-gray-300 font-bold">{merchant?.description || 'No description provided'}</div>
            </div>
            
            <button
              onClick={handleStartEdit}
              className="btn-lime px-6 py-3 rounded-xl font-black"
            >
              Edit Merchant Info
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Logo Preview with Edit */}
            <div className="flex flex-col md:flex-row items-start gap-6">
              <div className="flex flex-col items-center gap-3">
                <LogoPreview url={logoURL} size="lg" />
                <span className="text-gray-500 text-[10px] font-black uppercase tracking-widest">Logo Preview</span>
              </div>
              
              <div className="flex-1 space-y-4">
                <div>
                  <label className="auth-label">Business Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your business name"
                    className="w-full p-4 rounded-xl font-bold transition-all placeholder:text-gray-600"
                    required
                  />
                </div>
                <div>
                  <label className="auth-label">Logo URL</label>
                  <input
                    type="url"
                    value={logoURL}
                    onChange={handleLogoURLChange}
                    placeholder="https://example.com/logo.png"
                    className="w-full p-4 rounded-xl font-bold transition-all placeholder:text-gray-600"
                  />
                  {imageError && logoURL && (
                    <p className="text-red-400 text-xs font-bold mt-2">
                      Unable to load image. Please check the URL.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="auth-label">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell customers about your business"
                className="w-full p-4 rounded-xl font-bold transition-all placeholder:text-gray-600 min-h-32"
              />
            </div>
            
            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={isSaving}
                className="btn-lime px-6 py-3 rounded-xl font-black disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="bg-white/5 px-6 py-3 rounded-xl font-bold border border-white/10 hover:bg-white/10"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
