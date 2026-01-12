import { useState, useEffect, type FormEvent } from 'react'
import copy from 'copy-to-clipboard'
import { invoiceApi } from '@/api'
import type { MerchantInvoice } from '@/types'

export function AdminInvoicesPage() {
  const [invoices, setInvoices] = useState<MerchantInvoice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [viewingInvoice, setViewingInvoice] = useState<MerchantInvoice | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchInvoices = async () => {
    try {
      const data = await invoiceApi.getInvoices(1, 100)
      setInvoices(data.invoices)
    } catch (error) {
      console.error('Failed to fetch invoices:', error)
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      await fetchInvoices()
      setIsLoading(false)
    }
    loadData()
  }, [])

  const showMessage = (text: string, type: 'success' | 'error' = 'success') => {
    setMessage(text)
    setMessageType(type)
    setTimeout(() => setMessage(''), 3000)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    
    setIsSubmitting(true)
    try {
      const result = await invoiceApi.create({
        amount: parseFloat(amount),
        description
      })

      if (result.success) {
        showMessage('Invoice created successfully!')
        setIsCreating(false)
        setAmount('')
        setDescription('')
        // Refresh invoices
        await fetchInvoices()
      } else {
        showMessage(result.message || 'Failed to create invoice', 'error')
      }
    } catch (error) {
      showMessage('Failed to create invoice. Please try again.', 'error')
    }
    setIsSubmitting(false)
  }

  const handleCopyLink = (invoice: MerchantInvoice) => {
    const paymentLink = `${window.location.origin}/#/pay/${invoice.guid}`
    copy(paymentLink)
    setCopiedId(invoice.guid)
    showMessage('Payment link copied to clipboard!')
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleCopyInvoiceNumber = (invoiceNumber: string) => {
    copy(invoiceNumber)
    showMessage(`Invoice ${invoiceNumber} copied!`)
  }

  const handleDelete = async (invoice: MerchantInvoice) => {
    if (invoice.isPaid) {
      showMessage('Cannot delete a paid invoice!', 'error')
      return
    }
    
    if (!confirm(`Are you sure you want to delete invoice ${invoice.number}?`)) return
    
    try {
      const result = await invoiceApi.delete(invoice.guid)
      if (result.success) {
        showMessage(`Invoice ${invoice.number} deleted!`)
        // Refresh invoices
        await fetchInvoices()
        if (viewingInvoice?.guid === invoice.guid) {
          setViewingInvoice(null)
        }
      } else {
        showMessage(result.message || 'Failed to delete invoice', 'error')
      }
    } catch (error) {
      showMessage('Failed to delete invoice. Please try again.', 'error')
    }
  }

  const formatCurrency = (amount: number) => {
    return `₴ ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusInfo = (invoice: MerchantInvoice) => {
    if (invoice.isPaid) {
      return { label: 'Paid', className: 'bg-lime-400/20 text-lime-400' }
    }
    if (new Date(invoice.dueAt) < new Date()) {
      return { label: 'Expired', className: 'bg-red-400/20 text-red-400' }
    }
    return { label: 'Pending', className: 'bg-yellow-400/20 text-yellow-400' }
  }

  // Sort invoices by creation date (newest first)
  const sortedInvoices = [...invoices].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-lime-400 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black oswald uppercase">
            Invoice <span className="lime-text">Management</span>
          </h2>
          <p className="text-gray-500 font-bold text-sm uppercase tracking-widest">
            Create and manage payment invoices
          </p>
        </div>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="btn-lime px-6 py-2 rounded-xl text-xs font-black"
        >
          {isCreating ? 'Cancel' : 'Create Invoice'}
        </button>
      </div>

      {message && (
        <div className={`px-4 py-3 rounded-xl text-sm font-bold ${
          messageType === 'success' ? 'bg-lime-400/20 text-lime-400' : 'bg-red-400/20 text-red-400'
        }`}>
          {message}
        </div>
      )}

      {isCreating && (
        <div className="glass-card p-8">
          <h3 className="text-xl font-black oswald uppercase mb-6">New Invoice</h3>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="auth-label">Amount (₴)</label>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full p-4 rounded-xl font-bold transition-all placeholder:text-gray-600"
                required
              />
              <p className="text-gray-500 text-xs font-bold mt-2">Due date will be set to 1 month from now</p>
            </div>
            <div>
              <label className="auth-label">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Invoice description"
                className="w-full p-4 rounded-xl font-bold transition-all placeholder:text-gray-600 min-h-24"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-lime px-6 py-3 rounded-xl font-black disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Invoice'}
            </button>
          </form>
        </div>
      )}

      <div className="glass-card p-8">
        <h3 className="text-xl font-black oswald uppercase mb-6">All Invoices</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b border-white/10">
              <tr className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                <th className="pb-4 pr-4">Invoice #</th>
                <th className="pb-4 pr-4">Amount</th>
                <th className="pb-4 pr-4">Description</th>
                <th className="pb-4 pr-4">Status</th>
                <th className="pb-4 pr-4">Due</th>
                <th className="pb-4">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm font-bold">
              {sortedInvoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500 font-bold">
                    No invoices yet
                  </td>
                </tr>
              ) : (
                sortedInvoices.map((invoice: MerchantInvoice) => {
                  const status = getStatusInfo(invoice)
                  return (
                    <tr key={invoice.guid} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-4 pr-4">
                        <button
                          onClick={() => handleCopyInvoiceNumber(invoice.number)}
                          className="text-gray-300 hover:lime-text transition flex items-center gap-1 group"
                          title="Copy invoice number"
                        >
                          #{invoice.number}
                          <svg className="w-3 h-3 opacity-0 group-hover:opacity-100 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </td>
                      <td className="py-4 pr-4">{formatCurrency(invoice.amount)}</td>
                      <td className="py-4 pr-4 text-gray-400 max-w-xs truncate">{invoice.description}</td>
                      <td className="py-4 pr-4">
                        <span className={`${status.className} px-2 py-1 rounded-md text-[10px] uppercase`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="py-4 pr-4 text-gray-500">{formatDate(invoice.dueAt)}</td>
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          {/* View Button */}
                          <button
                            onClick={() => setViewingInvoice(invoice)}
                            className="p-2 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition"
                            title="View details"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>

                          {/* Copy Link Button (only for unpaid) */}
                          {!invoice.isPaid && (
                            <button
                              onClick={() => handleCopyLink(invoice)}
                              className={`p-2 rounded-lg transition ${
                                copiedId === invoice.guid
                                  ? 'bg-lime-400/20 text-lime-400'
                                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                              }`}
                              title="Copy payment link"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                              </svg>
                            </button>
                          )}

                          {/* Delete Button (only for unpaid) */}
                          {!invoice.isPaid && (
                            <button
                              onClick={() => handleDelete(invoice)}
                              className="p-2 rounded-lg bg-white/5 text-gray-400 hover:bg-red-400/20 hover:text-red-400 transition"
                              title="Delete invoice"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Invoice Modal */}
      {viewingInvoice && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setViewingInvoice(null)}
        >
          <div 
            className="glass-card p-8 max-w-lg w-full relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setViewingInvoice(null)}
              className="absolute top-4 right-4 p-2 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-black oswald uppercase">Invoice Details</h3>
                <span className={`${getStatusInfo(viewingInvoice).className} px-3 py-1 rounded-lg text-xs uppercase font-black`}>
                  {getStatusInfo(viewingInvoice).label}
                </span>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1">Invoice Number</div>
                    <div className="text-lg font-bold">{viewingInvoice.number}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1">Amount</div>
                    <div className="text-lg font-bold lime-text">{formatCurrency(viewingInvoice.amount)}</div>
                  </div>
                </div>

                <div>
                  <div className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1">Description</div>
                  <div className="text-gray-300 font-bold">{viewingInvoice.description}</div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1">Created</div>
                    <div className="text-gray-300 font-bold text-sm">{formatDateTime(viewingInvoice.createdAt)}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1">Due Date</div>
                    <div className="text-gray-300 font-bold text-sm">{formatDateTime(viewingInvoice.dueAt)}</div>
                  </div>
                </div>

                {viewingInvoice.isPaid && (
                  <div>
                    <div className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1">Paid By</div>
                    <div className="text-lime-400 font-bold">{viewingInvoice.paidBy}</div>
                  </div>
                )}

                <div>
                  <div className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1">Invoice ID</div>
                  <div className="text-gray-500 font-mono text-xs break-all">{viewingInvoice.guid}</div>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-white/10">
                {!viewingInvoice.isPaid && (
                  <>
                    <button
                      onClick={() => {
                        handleCopyLink(viewingInvoice)
                      }}
                      className="btn-lime px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                      Copy Payment Link
                    </button>
                    <button
                      onClick={() => {
                        handleDelete(viewingInvoice)
                        setViewingInvoice(null)
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-black bg-red-400/20 text-red-400 hover:bg-red-400/30 transition flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete
                    </button>
                  </>
                )}
                <button
                  onClick={() => setViewingInvoice(null)}
                  className="px-4 py-2 rounded-xl text-xs font-black bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition ml-auto"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
