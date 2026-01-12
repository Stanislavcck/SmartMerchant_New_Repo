import { useState, useEffect, useCallback, useRef } from 'react'
import { invoiceApi, merchantApi } from '@/api'
import type { Merchant, MerchantInvoice } from '@/types'

// Random product names
const productNames = [
  'Premium Wireless Headphones',
  'Smart Watch Pro',
  'Mechanical Keyboard RGB',
  'Ultra HD Monitor 27"',
  'Gaming Mouse Elite',
  'Bluetooth Speaker Max',
  'Laptop Stand Ergonomic',
  'USB-C Hub 10-in-1',
  'Webcam 4K Ultra',
  'Noise Cancelling Earbuds',
  'Portable SSD 1TB',
  'Wireless Charger Pad',
  'LED Desk Lamp Smart',
  'Microphone Condenser Pro',
  'Graphics Tablet XL',
]

// Random descriptions
const productDescriptions = [
  'Premium quality with exceptional performance',
  'Next-generation technology for modern lifestyle',
  'Designed for professionals and enthusiasts',
  'Unmatched quality and durability',
  'Experience the difference with cutting-edge features',
]

interface Product {
  id: string
  name: string
  description: string
  price: number
  imageUrl: string
}

export function AdminStorePage() {
  const [merchant, setMerchant] = useState<Merchant | null>(null)
  const [product, setProduct] = useState<Product | null>(null)
  const [isWaitingForPayment, setIsWaitingForPayment] = useState(false)
  const [currentInvoiceId, setCurrentInvoiceId] = useState<string | null>(null)
  const [paymentComplete, setPaymentComplete] = useState(false)
  const [paidInvoice, setPaidInvoice] = useState<MerchantInvoice | null>(null)
  const [paidAt, setPaidAt] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const paymentWindowRef = useRef<Window | null>(null)

  // Fetch merchant on mount
  useEffect(() => {
    const fetchMerchant = async () => {
      try {
        const data = await merchantApi.getMerchant()
        setMerchant(data)
      } catch (error) {
        console.error('Failed to fetch merchant:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchMerchant()
  }, [])

  // Generate random product
  const generateProduct = useCallback(() => {
    const randomId = Math.random().toString(36).substring(7)
    const randomName = productNames[Math.floor(Math.random() * productNames.length)]
    const randomDesc = productDescriptions[Math.floor(Math.random() * productDescriptions.length)]
    const randomPrice = Math.floor(Math.random() * (15000 - 100 + 1)) + 100
    const randomImageId = Math.floor(Math.random() * 1000)

    setProduct({
      id: randomId,
      name: randomName,
      description: randomDesc,
      price: randomPrice,
      imageUrl: `https://picsum.photos/seed/${randomImageId}/400/400`,
    })
    setPaymentComplete(false)
    setPaidInvoice(null)
    setCurrentInvoiceId(null)
    setIsWaitingForPayment(false)
  }, [])

  // Initialize product on mount
  useEffect(() => {
    generateProduct()
  }, [generateProduct])

  // Poll localStorage every 1 second for payment result
  useEffect(() => {
    if (!currentInvoiceId || paymentComplete || !isWaitingForPayment) return

    const checkPaymentStatus = async () => {
      // Check localStorage for payment result
      const paymentResultKey = `payment_result_${currentInvoiceId}`
      const paymentResultStr = localStorage.getItem(paymentResultKey)
      
      if (paymentResultStr) {
        try {
          const paymentResult = JSON.parse(paymentResultStr)
          
          // Get invoice from API
          const invoice = await invoiceApi.getInvoice(currentInvoiceId)
          if (invoice) {
            setPaymentComplete(true)
            setPaidInvoice(invoice)
            setPaidAt(new Date(paymentResult.paidAt).toLocaleString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            }))
            setIsWaitingForPayment(false)
            
            // Clear localStorage after reading
            localStorage.removeItem(paymentResultKey)
            
            // Close the payment window if still open
            if (paymentWindowRef.current && !paymentWindowRef.current.closed) {
              paymentWindowRef.current.close()
            }
          }
        } catch (error) {
          console.error('Error parsing payment result:', error)
        }
      }
    }

    // Check immediately
    checkPaymentStatus()

    // Poll every 1 second while waiting for payment
    const interval = setInterval(checkPaymentStatus, 1000)

    return () => clearInterval(interval)
  }, [currentInvoiceId, isWaitingForPayment, paymentComplete])


  const handleCheckout = async () => {
    if (!merchant || !product) return

    try {
      // Create invoice via API
      const dueDate = new Date()
      dueDate.setMonth(dueDate.getMonth() + 1)

      const result = await invoiceApi.create({
        amount: product.price,
        description: `${product.name} - ${product.description}`,
        dueAt: dueDate.toISOString()
      })

      if (!result.success || !result.invoiceGuid) {
        console.error('Failed to create invoice:', result.message)
        return
      }

      setCurrentInvoiceId(result.invoiceGuid)
      setIsWaitingForPayment(true)

      // Open payment page in new popup window
      const paymentUrl = `${window.location.origin}${window.location.pathname}#/pay/${result.invoiceGuid}`
      const width = 500
      const height = 700
      const left = window.screenX + (window.outerWidth - width) / 2
      const top = window.screenY + (window.outerHeight - height) / 2

      paymentWindowRef.current = window.open(
        paymentUrl,
        'LimePayment',
        `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=yes`
      )
    } catch (error) {
      console.error('Failed to create invoice:', error)
    }
  }

  const formatCurrency = (amount: number) => {
    return `₴ ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  if (isLoading || !product) {
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
        <p className="text-gray-400 font-bold">Please create a merchant first to use the store.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black oswald uppercase">
            Store <span className="lime-text">Popup Pay</span>
          </h2>
          <p className="text-gray-500 font-bold text-sm uppercase tracking-widest">
            Demo shop with popup payment window
          </p>
        </div>
        <button
          onClick={generateProduct}
          className="btn-lime px-6 py-2 rounded-xl text-xs font-black"
        >
          Generate New Product
        </button>
      </div>

      {/* Shop Page */}
      <div className="glass-card p-8">
        <h3 className="text-xl font-black oswald uppercase mb-6 flex items-center gap-2">
          <svg className="w-5 h-5 lime-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          Simple Shop
        </h3>

        {!paymentComplete ? (
          <div className="grid md:grid-cols-2 gap-8">
            {/* Product Image */}
            <div className="aspect-square rounded-2xl overflow-hidden bg-white/5">
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Product Info */}
            <div className="flex flex-col justify-between">
              <div className="space-y-4">
                <h4 className="text-2xl font-black">{product.name}</h4>
                <p className="text-gray-400 font-bold">{product.description}</p>
                <div className="text-4xl font-black lime-text oswald">
                  {formatCurrency(product.price)}
                </div>
              </div>

              <div className="mt-8">
                {!isWaitingForPayment ? (
                  <button
                    onClick={handleCheckout}
                    className="w-full btn-lime py-4 rounded-2xl text-lg font-black flex items-center justify-center gap-3"
                  >
                    <div className="w-8 h-8 bg-black/20 rounded-lg flex items-center justify-center">
                      <span className="text-black font-black text-sm">L</span>
                    </div>
                    Checkout with Lime
                  </button>
                ) : (
                  <div className="space-y-4">
                    <div className="w-full py-4 rounded-2xl bg-yellow-400/20 text-yellow-400 text-lg font-black flex items-center justify-center gap-3">
                      <div className="w-5 h-5 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
                      Waiting for payment...
                    </div>
                    <button
                      onClick={handleCheckout}
                      className="w-full py-3 rounded-xl bg-white/5 text-gray-400 font-bold text-sm border border-white/10 hover:bg-white/10 transition"
                    >
                      Reopen Payment Window
                    </button>
                  </div>
                )}
                <p className="text-center text-gray-500 text-xs font-bold mt-3">
                  {isWaitingForPayment 
                    ? 'Complete payment in the popup window' 
                    : 'Secure payment powered by Lime Merchant'}
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Payment Success */
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-lime-400/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 lime-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/>
              </svg>
            </div>
            <h4 className="text-3xl font-black oswald uppercase mb-2">
              Payment <span className="lime-text">Successful!</span>
            </h4>
            <p className="text-gray-400 font-bold mb-8">Your order has been confirmed</p>

            {/* Paid Item Details */}
            <div className="glass-card p-6 max-w-md mx-auto text-left border-lime-400/30">
              <div className="flex gap-4">
                <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0">
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <h5 className="font-black text-lg">{product.name}</h5>
                  <p className="text-gray-500 text-sm font-bold">{product.description}</p>
                  <div className="text-xl font-black lime-text">{formatCurrency(product.price)}</div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-white/10 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500 font-bold">Paid By</span>
                  <span className="font-bold">{paidInvoice?.paidBy || 'Customer'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 font-bold">Paid At</span>
                  <span className="font-bold">{paidAt}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 font-bold">Order #</span>
                  <span className="font-bold text-xs">{paidInvoice?.number}</span>
                </div>
              </div>
            </div>

            <button
              onClick={generateProduct}
              className="mt-8 btn-lime px-8 py-3 rounded-xl font-black"
            >
              Shop Another Item
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
