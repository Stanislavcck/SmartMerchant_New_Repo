import { useState, useEffect, type FormEvent } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { invoiceApi, merchantApi, paymentApi } from '@/api'
import type { MerchantInvoice, Merchant } from '@/types'

export function PaymentPage() {
  const { invoiceId } = useParams<{ invoiceId: string }>()
  const navigate = useNavigate()

  const [invoice, setInvoice] = useState<MerchantInvoice | null>(null)
  const [merchant, setMerchant] = useState<Merchant | null>(null)
  const [isLoadingData, setIsLoadingData] = useState(true)

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [cvv, setCvv] = useState('')

  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState('')
  const [showError, setShowError] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      if (!invoiceId) {
        navigate('/')
        return
      }

      setIsLoadingData(true)
      try {
        // Fetch invoice
        const inv = await invoiceApi.getInvoice(invoiceId)
        if (!inv) {
          navigate('/')
          return
        }

        // Redirect to cheque if already paid
        if (inv.isPaid) {
          navigate(`/cheque/${invoiceId}`)
          return
        }

        setInvoice(inv)

        // Fetch merchant
        if (inv.merchantGuid) {
          const merch = await merchantApi.getMerchantByGuid(inv.merchantGuid)
          setMerchant(merch)
        }
      } catch (error) {
        console.error('Failed to fetch invoice:', error)
        navigate('/')
      }
      setIsLoadingData(false)
    }

    fetchData()
  }, [invoiceId, navigate])

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    const parts = []
    for (let i = 0; i < v.length && i < 16; i += 4) {
      parts.push(v.substring(i, i + 4))
    }
    return parts.join(' ')
  }

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\D/g, '')
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4)
    }
    return v
  }

  const formatCurrency = (amount: number) => {
    return `₴ ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardNumber(formatCardNumber(e.target.value))
  }

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setExpiryDate(formatExpiryDate(e.target.value))
  }

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCvv(e.target.value.replace(/\D/g, '').substring(0, 3))
  }

  const processPayment = async (e: FormEvent) => {
    e.preventDefault()

    if (!invoice) return

    // Validation
    if (!firstName.trim() || !lastName.trim()) {
      setError('Please enter your first and last name')
      setShowError(true)
      return
    }

    const cleanCardNumber = cardNumber.replace(/\s/g, '')
    if (cleanCardNumber.length < 16) {
      setError('Please enter a valid card number')
      setShowError(true)
      return
    }

    if (!expiryDate || expiryDate.length < 5) {
      setError('Please enter a valid expiry date')
      setShowError(true)
      return
    }

    if (!cvv || cvv.length < 3) {
      setError('Please enter a valid CVV')
      setShowError(true)
      return
    }

    setIsProcessing(true)

    try {
      const result = await paymentApi.pay({
        invoiceGuid: invoice.guid,
        cardNumber: cleanCardNumber,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        expiryDate: expiryDate.replace('/', ''),
        cvv
      })

      if (result.success) {
        // Store payment result in localStorage for cross-window communication
        const paymentResult = {
          invoiceId: invoice.guid,
          invoiceNumber: invoice.number,
          amount: invoice.amount,
          paidBy: `${firstName.trim()} ${lastName.trim()}`,
          paidAt: new Date().toISOString(),
          timestamp: Date.now()
        }
        localStorage.setItem(`payment_result_${invoice.guid}`, JSON.stringify(paymentResult))
        
        setPaymentSuccess(true)
        setTimeout(() => {
          navigate(`/cheque/${invoiceId}`)
        }, 1000)
      } else {
        setError(result.message || 'Payment failed. Please try again.')
        setShowError(true)
        setIsProcessing(false)
      }
    } catch (error) {
      setError('Payment failed. Please try again.')
      setShowError(true)
      setIsProcessing(false)
    }
  }

  if (isLoadingData || !invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-lime-400 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-400 font-bold">Loading invoice...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-24 px-6">
      <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
        {/* Merchant Branding */}
        <div className="space-y-8">
          <div className="glass-card p-10 flex flex-col items-center text-center space-y-6 border-lime-400/20">
            <div className="w-32 h-32 lime-bg rounded-[3rem] shadow-2xl flex items-center justify-center overflow-hidden ring-4 ring-black">
              {merchant?.logoURL ? (
                <img 
                  src={merchant.logoURL} 
                  className="w-full h-full object-cover" 
                  alt={merchant.name}
                  onError={(e) => {
                    e.currentTarget.parentElement!.innerHTML = '<span class="text-black font-black text-4xl">L</span>'
                  }}
                />
              ) : (
                <span className="text-black font-black text-4xl">L</span>
              )}
            </div>
            <div>
              <h2 className="text-4xl font-black oswald uppercase">{merchant?.name || 'Lime Merchant'}</h2>
              <p className="text-gray-400 font-bold max-w-xs mt-2">{merchant?.description || 'Verified Business Partner'}</p>
            </div>
            <div className="w-full pt-6 border-t border-white/5">
              <span className="text-[10px] text-gray-600 font-black uppercase tracking-[0.2em]">Secure Lime Gateway</span>
            </div>
          </div>
        </div>

        {/* Invoice Details & Form */}
        <div className="space-y-8">
          <div className="glass-card p-10 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 lime-bg"></div>
            
            <div className="flex justify-between items-start mb-10">
              <div>
                <span className="auth-label">Invoice ID</span>
                <div className="text-gray-400 font-black text-xs">{invoice.guid.substring(0, 13).toUpperCase()}</div>
              </div>
              <div className="text-right">
                <span className="auth-label">Order No.</span>
                <div className="oswald font-black text-xl">#{invoice.number}</div>
              </div>
            </div>

            <div className="mb-10">
              <span className="auth-label">Sum to Pay</span>
              <div className="text-6xl font-black oswald lime-text leading-none">{formatCurrency(invoice.amount)}</div>
              <p className="text-gray-400 font-bold mt-4 italic text-sm">{invoice.description || 'No description'}</p>
            </div>

            <form onSubmit={processPayment} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="auth-label">First Name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Ivan"
                    className="w-full p-4 rounded-xl font-bold"
                    disabled={isProcessing}
                  />
                </div>
                <div>
                  <label className="auth-label">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Petrenko"
                    className="w-full p-4 rounded-xl font-bold"
                    disabled={isProcessing}
                  />
                </div>
              </div>
              
              <div>
                <label className="auth-label">Card Number</label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={handleCardNumberChange}
                  placeholder="0000 0000 0000 0000"
                  maxLength={19}
                  className="w-full p-4 rounded-xl font-bold tracking-[0.2em]"
                  disabled={isProcessing}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="auth-label">Expiry Date</label>
                  <input
                    type="text"
                    value={expiryDate}
                    onChange={handleExpiryChange}
                    placeholder="MM/YY"
                    maxLength={5}
                    className="w-full p-4 rounded-xl font-bold"
                    disabled={isProcessing}
                  />
                </div>
                <div>
                  <label className="auth-label">CVV</label>
                  <input
                    type="password"
                    value={cvv}
                    onChange={handleCvvChange}
                    placeholder="***"
                    maxLength={3}
                    className="w-full p-4 rounded-xl font-bold"
                    disabled={isProcessing}
                  />
                </div>
              </div>
              
              <button
                type="submit"
                disabled={isProcessing}
                className={`btn-lime w-full py-5 rounded-2xl shadow-2xl text-xl transition-all ${
                  paymentSuccess ? 'bg-white' : ''
                } ${isProcessing && !paymentSuccess ? 'opacity-80' : ''}`}
              >
                <span className="flex items-center justify-center space-x-3">
                  {isProcessing && !paymentSuccess ? (
                    <div className="w-5 h-5 border-3 border-black/10 border-t-black rounded-full animate-spin"></div>
                  ) : paymentSuccess ? (
                    <>
                      <svg className="w-6 h-6 text-black" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                      </svg>
                      <span className="text-black font-black">LIME</span>
                    </>
                  ) : (
                    'Authorize Payment'
                  )}
                </span>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Error Modal */}
      {showError && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowError(false)}
        >
          <div 
            className="glass-card p-8 w-full max-w-sm text-center border-red-500/30"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </div>
            <h3 className="text-xl font-black oswald uppercase mb-2">Payment Declined</h3>
            <p className="text-gray-400 font-bold mb-6">{error}</p>
            <button 
              onClick={() => setShowError(false)} 
              className="w-full py-4 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition"
            >
              Try Another Card
            </button>
          </div>
        </div>
      )}

      {/* CSS for spinner */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 0.8s linear infinite;
        }
        .border-3 {
          border-width: 3px;
        }
      `}</style>
    </div>
  )
}
