import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { invoiceApi, merchantApi } from '@/api'
import type { MerchantInvoice, Merchant } from '@/types'

export function ChequePage() {
  const { invoiceId } = useParams<{ invoiceId: string }>()
  const navigate = useNavigate()

  const [invoice, setInvoice] = useState<MerchantInvoice | null>(null)
  const [merchant, setMerchant] = useState<Merchant | null>(null)
  const [transactionId, setTransactionId] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      if (!invoiceId) {
        navigate('/')
        return
      }

      setIsLoading(true)
      try {
        const inv = await invoiceApi.getInvoice(invoiceId)
        if (!inv) {
          navigate('/')
          return
        }

        // Redirect to payment page if not paid
        if (!inv.isPaid) {
          navigate(`/pay/${invoiceId}`)
          return
        }

        setInvoice(inv)

        if (inv.merchantGuid) {
          const merch = await merchantApi.getMerchantByGuid(inv.merchantGuid)
          setMerchant(merch)
        }

        // Generate transaction ID
        const txnId = `TXN-${invoiceId.substring(0, 8).toUpperCase()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`
        setTransactionId(txnId)
      } catch (error) {
        console.error('Failed to fetch invoice:', error)
        navigate('/')
      }
      setIsLoading(false)
    }

    fetchData()
  }, [invoiceId, navigate])

  const formatCurrency = (amount: number) => {
    return `₴ ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const formatDateTime = () => {
    return new Date().toLocaleString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (isLoading || !invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-lime-400 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-400 font-bold">Loading receipt...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-24 px-6">
      <div className="max-w-2xl mx-auto">
        <div className="glass-card p-12 text-center relative overflow-hidden border-lime-400/30">
          {/* Background glow */}
          <div className="absolute -top-20 -left-20 w-40 h-40 bg-lime-400/10 rounded-full blur-3xl"></div>
          
          {/* Success icon */}
          <div className="w-20 h-20 bg-lime-400/20 rounded-full flex items-center justify-center mx-auto mb-8">
            <svg className="w-10 h-10 lime-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/>
            </svg>
          </div>
          
          <h2 className="text-4xl font-black oswald uppercase mb-2">
            Payment <span className="lime-text">Successful</span>
          </h2>
          <p className="text-gray-400 font-bold mb-10">Digital Transaction Cheque</p>
          
          {/* Transaction details */}
          <div className="space-y-4 text-left border-y border-white/5 py-8 mb-8">
            <div className="flex justify-between">
              <span className="text-gray-500 text-xs font-black uppercase">Transaction ID</span>
              <span className="font-bold text-xs">{transactionId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 text-xs font-black uppercase">Merchant</span>
              <span className="font-bold text-xs uppercase">{merchant?.name || 'Merchant'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 text-xs font-black uppercase">Paid On</span>
              <span className="font-bold text-xs">{formatDateTime()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 text-xs font-black uppercase">Reference</span>
              <span className="font-bold text-xs">#{invoice.number}</span>
            </div>
            {invoice.paidBy && (
              <div className="flex justify-between">
                <span className="text-gray-500 text-xs font-black uppercase">Paid By</span>
                <span className="font-bold text-xs">{invoice.paidBy}</span>
              </div>
            )}
            <div className="flex justify-between items-end pt-4">
              <span className="text-gray-500 text-xs font-black uppercase">Total Amount</span>
              <span className="oswald font-black text-3xl lime-text">{formatCurrency(invoice.amount)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-4">
            <button 
              onClick={() => window.print()} 
              className="flex-1 py-4 rounded-xl font-bold bg-white/5 border border-white/10 hover:bg-white/10 transition"
            >
              Download PDF
            </button>
            <Link 
              to="/" 
              className="flex-1 btn-lime py-4 rounded-xl shadow-lg text-center font-bold"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body {
            background: white !important;
          }
          .glass-card {
            border: 1px solid #e5e5e5 !important;
            background: white !important;
          }
          .lime-text {
            color: #84cc16 !important;
          }
        }
      `}</style>
    </div>
  )
}
