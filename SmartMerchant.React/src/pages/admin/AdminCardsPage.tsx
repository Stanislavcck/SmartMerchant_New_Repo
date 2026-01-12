import { useState, useEffect, type FormEvent } from 'react'
import copy from 'copy-to-clipboard'
import { cardApi } from '@/api'
import type { CreditCard } from '@/types'

export function AdminCardsPage() {
  const [cards, setCards] = useState<CreditCard[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null)
  const [number, setNumber] = useState('')
  const [expirationMonth, setExpirationMonth] = useState('')
  const [expirationYear, setExpirationYear] = useState('')
  const [cvv, setCvv] = useState('')
  const [holderFirstName, setHolderFirstName] = useState('')
  const [holderLastName, setHolderLastName] = useState('')
  const [balance, setBalance] = useState('')
  const [message, setMessage] = useState('')
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchCards = async () => {
    try {
      const data = await cardApi.getCards()
      setCards(data)
    } catch (error) {
      console.error('Failed to fetch cards:', error)
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      await fetchCards()
      setIsLoading(false)
    }
    loadData()
  }, [])

  const resetForm = () => {
    setNumber('')
    setExpirationMonth('')
    setExpirationYear('')
    setCvv('')
    setHolderFirstName('')
    setHolderLastName('')
    setBalance('')
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    setIsSubmitting(true)
    try {
      const expiry = `${String(expirationMonth).padStart(2, '0')}.${String(expirationYear).padStart(2, '0')}`
      
      const result = await cardApi.create({
        holderFirstName,
        holderLastName,
        number,
        expiry,
        cvv,
        balance: parseFloat(balance) || 0
      })

      if (result.success) {
        setMessage('Card added successfully!')
        setIsAdding(false)
        resetForm()
        await fetchCards()
      } else {
        setMessage(result.message || 'Failed to add card')
      }
    } catch (error) {
      setMessage('Failed to add card. Please try again.')
    }
    setIsSubmitting(false)

    setTimeout(() => setMessage(''), 3000)
  }

  const handleEditSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!editingCard) return

    setIsSubmitting(true)
    try {
      const expiry = `${String(expirationMonth).padStart(2, '0')}.${String(expirationYear).padStart(2, '0')}`
      
      const result = await cardApi.edit(editingCard.guid, {
        holderFirstName,
        holderLastName,
        number,
        expiry,
        cvv,
        balance: parseFloat(balance) || 0
      })

      if (result.success) {
        setMessage('Card updated successfully!')
        setEditingCard(null)
        resetForm()
        await fetchCards()
      } else {
        setMessage(result.message || 'Failed to update card')
      }
    } catch (error) {
      setMessage('Failed to update card. Please try again.')
    }
    setIsSubmitting(false)

    setTimeout(() => setMessage(''), 3000)
  }

  const handleDelete = async (guid: string) => {
    if (!confirm('Are you sure you want to remove this card?')) return
    
    try {
      const result = await cardApi.delete(guid)
      if (result.success) {
        setMessage('Card removed successfully!')
        await fetchCards()
      } else {
        setMessage(result.message || 'Failed to remove card')
      }
    } catch (error) {
      setMessage('Failed to remove card. Please try again.')
    }
    setTimeout(() => setMessage(''), 3000)
  }

  const handleEdit = (card: CreditCard) => {
    const expDate = new Date(card.expirationDate)
    setNumber(card.number)
    setExpirationMonth(String(expDate.getMonth() + 1).padStart(2, '0'))
    setExpirationYear(String(expDate.getFullYear()).slice(-2))
    setCvv(card.cvv)
    setHolderFirstName(card.holderFirstName)
    setHolderLastName(card.holderLastName)
    setBalance(String(card.balance))
    setEditingCard(card)
  }

  const handleCopy = (text: string, fieldId: string) => {
    copy(text)
    setCopiedField(fieldId)
    setMessage(`Copied: ${text}`)
    setTimeout(() => {
      setCopiedField(null)
      setMessage('')
    }, 2000)
  }

  const formatCardNumber = (cardNumber: string) => {
    return cardNumber.replace(/(.{4})/g, '$1 ').trim()
  }

  const formatExpiry = (dateString: string) => {
    const date = new Date(dateString)
    return `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getFullYear()).slice(-2)}`
  }


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
            Payment <span className="lime-text">Cards</span>
          </h2>
          <p className="text-gray-500 font-bold text-sm uppercase tracking-widest">
            Manage payment methods (for testing payment flow)
          </p>
        </div>
        <button
          onClick={() => {
            setIsAdding(!isAdding)
            setEditingCard(null)
            if (!isAdding) resetForm()
          }}
          className="btn-lime px-6 py-2 rounded-xl text-xs font-black"
        >
          {isAdding ? 'Cancel' : 'Add Card'}
        </button>
      </div>

      {message && (
        <div className="px-4 py-3 rounded-xl text-sm font-bold bg-lime-400/20 text-lime-400">
          {message}
        </div>
      )}

      {isAdding && !editingCard && (
        <div className="glass-card p-8">
          <h3 className="text-xl font-black oswald uppercase mb-6">Add New Card</h3>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="auth-label">Card Number</label>
              <input
                type="text"
                value={number}
                onChange={(e) => setNumber(e.target.value.replace(/\D/g, '').slice(0, 16))}
                placeholder="4242424242424242"
                className="w-full p-4 rounded-xl font-bold transition-all placeholder:text-gray-600"
                maxLength={16}
                required
              />
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <label className="auth-label">Expiry Month</label>
                <input
                  type="text"
                  value={expirationMonth}
                  onChange={(e) => setExpirationMonth(e.target.value.replace(/\D/g, '').slice(0, 2))}
                  placeholder="12"
                  className="w-full p-4 rounded-xl font-bold transition-all placeholder:text-gray-600"
                  maxLength={2}
                  required
                />
              </div>
              <div>
                <label className="auth-label">Expiry Year</label>
                <input
                  type="text"
                  value={expirationYear}
                  onChange={(e) => setExpirationYear(e.target.value.replace(/\D/g, '').slice(0, 2))}
                  placeholder="28"
                  className="w-full p-4 rounded-xl font-bold transition-all placeholder:text-gray-600"
                  maxLength={2}
                  required
                />
              </div>
              <div>
                <label className="auth-label">CVV</label>
                <input
                  type="text"
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="123"
                  className="w-full p-4 rounded-xl font-bold transition-all placeholder:text-gray-600"
                  maxLength={4}
                  required
                />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="auth-label">First Name</label>
                <input
                  type="text"
                  value={holderFirstName}
                  onChange={(e) => setHolderFirstName(e.target.value)}
                  placeholder="John"
                  className="w-full p-4 rounded-xl font-bold transition-all placeholder:text-gray-600"
                  required
                />
              </div>
              <div>
                <label className="auth-label">Last Name</label>
                <input
                  type="text"
                  value={holderLastName}
                  onChange={(e) => setHolderLastName(e.target.value)}
                  placeholder="Doe"
                  className="w-full p-4 rounded-xl font-bold transition-all placeholder:text-gray-600"
                  required
                />
              </div>
            </div>
            <div>
              <label className="auth-label">Balance (₴)</label>
              <input
                type="number"
                step="0.01"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                placeholder="10000.00"
                className="w-full p-4 rounded-xl font-bold transition-all placeholder:text-gray-600"
              />
            </div>
            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-lime px-6 py-3 rounded-xl font-black disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Add Card'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false)
                  resetForm()
                }}
                className="bg-white/5 px-6 py-3 rounded-xl font-bold border border-white/10 hover:bg-white/10"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Cards Table */}
      <div className="glass-card p-8">
        <h3 className="text-xl font-black oswald uppercase mb-6">All Cards</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b border-white/10">
              <tr className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                <th className="pb-4 pr-4">Cardholder</th>
                <th className="pb-4 pr-4">Card Number</th>
                <th className="pb-4 pr-4">Expiry</th>
                <th className="pb-4 pr-4">CVV</th>
                <th className="pb-4 pr-4">Balance</th>
                <th className="pb-4">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm font-bold">
              {cards.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500 font-bold">
                    No cards added yet
                  </td>
                </tr>
              ) : (
                cards.map((card: CreditCard) => (
                  <tr key={card.guid} className="border-b border-white/5">
                    <td className="py-4 pr-4">
                      <span className="text-gray-300 uppercase">
                        {card.holderFirstName} {card.holderLastName}
                      </span>
                    </td>
                    <td className="py-4 pr-4">
                      <button
                        onClick={() => handleCopy(card.number, `num-${card.guid}`)}
                        className={`font-mono tracking-wider transition ${
                          copiedField === `num-${card.guid}` 
                            ? 'lime-text' 
                            : 'text-lime-400/80 hover:text-lime-400 hover:underline'
                        }`}
                        title="Click to copy"
                      >
                        {formatCardNumber(card.number)}
                      </button>
                    </td>
                    <td className="py-4 pr-4">
                      <button
                        onClick={() => handleCopy(formatExpiry(card.expirationDate), `exp-${card.guid}`)}
                        className={`font-mono transition ${
                          copiedField === `exp-${card.guid}` 
                            ? 'lime-text' 
                            : 'text-lime-400/80 hover:text-lime-400 hover:underline'
                        }`}
                        title="Click to copy"
                      >
                        {formatExpiry(card.expirationDate)}
                      </button>
                    </td>
                    <td className="py-4 pr-4">
                      <button
                        onClick={() => handleCopy(card.cvv, `cvv-${card.guid}`)}
                        className={`font-mono transition ${
                          copiedField === `cvv-${card.guid}` 
                            ? 'lime-text' 
                            : 'text-lime-400/80 hover:text-lime-400 hover:underline'
                        }`}
                        title="Click to copy"
                      >
                        {card.cvv}
                      </button>
                    </td>
                    <td className="py-4 pr-4">
                      <span className="text-white">
                        ₴ {card.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        {/* Edit Button */}
                        <button
                          onClick={() => handleEdit(card)}
                          className="p-2 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition"
                          title="Edit card"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        
                        {/* Delete Button */}
                        <button
                          onClick={() => handleDelete(card.guid)}
                          className="p-2 rounded-lg bg-white/5 text-gray-400 hover:bg-red-400/20 hover:text-red-400 transition"
                          title="Delete card"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingCard && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => {
            setEditingCard(null)
            resetForm()
          }}
        >
          <div 
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="glass-card p-8 relative">
              <button
                onClick={() => {
                  setEditingCard(null)
                  resetForm()
                }}
                className="absolute top-4 right-4 p-2 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <h3 className="text-xl font-black oswald uppercase mb-6">Edit Card</h3>
              <form onSubmit={handleEditSubmit} className="space-y-6">
                <div>
                  <label className="auth-label">Card Number</label>
                  <input
                    type="text"
                    value={number}
                    onChange={(e) => setNumber(e.target.value.replace(/\D/g, '').slice(0, 16))}
                    placeholder="4242424242424242"
                    className="w-full p-4 rounded-xl font-bold transition-all placeholder:text-gray-600"
                    required
                  />
                </div>
                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <label className="auth-label">Expiry Month</label>
                    <input
                      type="text"
                      value={expirationMonth}
                      onChange={(e) => setExpirationMonth(e.target.value.replace(/\D/g, '').slice(0, 2))}
                      placeholder="12"
                      className="w-full p-4 rounded-xl font-bold transition-all placeholder:text-gray-600"
                      maxLength={2}
                      required
                    />
                  </div>
                  <div>
                    <label className="auth-label">Expiry Year</label>
                    <input
                      type="text"
                      value={expirationYear}
                      onChange={(e) => setExpirationYear(e.target.value.replace(/\D/g, '').slice(0, 2))}
                      placeholder="28"
                      className="w-full p-4 rounded-xl font-bold transition-all placeholder:text-gray-600"
                      maxLength={2}
                      required
                    />
                  </div>
                  <div>
                    <label className="auth-label">CVV</label>
                    <input
                      type="text"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 3))}
                      placeholder="123"
                      className="w-full p-4 rounded-xl font-bold transition-all placeholder:text-gray-600"
                      maxLength={3}
                      required
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="auth-label">First Name</label>
                    <input
                      type="text"
                      value={holderFirstName}
                      onChange={(e) => setHolderFirstName(e.target.value)}
                      placeholder="John"
                      className="w-full p-4 rounded-xl font-bold transition-all placeholder:text-gray-600"
                      required
                    />
                  </div>
                  <div>
                    <label className="auth-label">Last Name</label>
                    <input
                      type="text"
                      value={holderLastName}
                      onChange={(e) => setHolderLastName(e.target.value)}
                      placeholder="Doe"
                      className="w-full p-4 rounded-xl font-bold transition-all placeholder:text-gray-600"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="auth-label">Balance (₴)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={balance}
                    onChange={(e) => setBalance(e.target.value)}
                    placeholder="10000.00"
                    className="w-full p-4 rounded-xl font-bold transition-all placeholder:text-gray-600"
                  />
                </div>
                <div className="flex space-x-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-lime px-6 py-3 rounded-xl font-black disabled:opacity-50"
                  >
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCard(null)
                      resetForm()
                    }}
                    className="bg-white/5 px-6 py-3 rounded-xl font-bold border border-white/10 hover:bg-white/10"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
