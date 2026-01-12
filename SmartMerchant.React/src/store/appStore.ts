import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, Merchant, MerchantInvoice, CreditCard, TransactionHistory } from '@/types'
import { 
  initialUsers, 
  initialMerchants, 
  initialInvoices, 
  initialCards 
} from '@/data/InitialState'

interface AppState {
  // Data
  users: User[]
  merchants: Merchant[]
  invoices: MerchantInvoice[]
  cards: CreditCard[]
  transactions: TransactionHistory[]
  isInitialized: boolean

  // User actions
  addUser: (user: User) => void
  findUserByCredentials: (username: string, password: string) => User | undefined
  isUsernameTaken: (username: string) => boolean

  // Merchant actions
  getMerchantByOwner: (userGuid: string) => Merchant | undefined
  updateMerchant: (merchant: Merchant) => void
  addMerchant: (merchant: Merchant) => void

  // Invoice actions
  getInvoicesByMerchant: (merchantGuid: string) => MerchantInvoice[]
  getInvoiceByGuid: (guid: string) => MerchantInvoice | undefined
  addInvoice: (invoice: MerchantInvoice) => void
  updateInvoice: (invoice: MerchantInvoice) => void
  deleteInvoice: (guid: string) => void
  payInvoice: (invoiceGuid: string, paidBy: string, cardGuid: string) => boolean

  // Card actions
  addCard: (card: CreditCard) => void
  removeCard: (guid: string) => void
  updateCard: (card: CreditCard) => void
  updateCardBalance: (guid: string, amount: number) => void
  findCardByNumber: (cardNumber: string) => CreditCard | undefined
  getMerchantByGuid: (guid: string) => Merchant | undefined

  // Transaction actions
  addTransaction: (transaction: TransactionHistory) => void
  getTransactionsByMerchant: (merchantGuid: string) => TransactionHistory[]

  // Init
  initializeStore: () => void
  resetStore: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial empty state
      users: [],
      merchants: [],
      invoices: [],
      cards: [],
      transactions: [],
      isInitialized: false,

      // Initialize with seed data
      initializeStore: () => {
        const state = get()
        if (!state.isInitialized) {
          set({
            users: [...initialUsers],
            merchants: [...initialMerchants],
            invoices: [...initialInvoices],
            cards: [...initialCards],
            transactions: [],
            isInitialized: true
          })
        }
      },

      // Reset to initial state
      resetStore: () => {
        set({
          users: [...initialUsers],
          merchants: [...initialMerchants],
          invoices: [...initialInvoices],
          cards: [...initialCards],
          transactions: [],
          isInitialized: true
        })
      },

      // User actions
      addUser: (user) => set((state) => ({ 
        users: [...state.users, user] 
      })),

      findUserByCredentials: (username, password) => {
        const state = get()
        return state.users.find(
          u => u.username.toLowerCase() === username.toLowerCase() && u.password === password
        )
      },

      isUsernameTaken: (username) => {
        const state = get()
        return state.users.some(
          u => u.username.toLowerCase() === username.toLowerCase()
        )
      },

      // Merchant actions
      getMerchantByOwner: (userGuid) => {
        const state = get()
        return state.merchants.find(m => m.ownerUserGuid === userGuid)
      },

      updateMerchant: (merchant) => set((state) => ({
        merchants: state.merchants.map(m => 
          m.guid === merchant.guid ? merchant : m
        )
      })),

      addMerchant: (merchant) => set((state) => ({
        merchants: [...state.merchants, merchant]
      })),

      // Invoice actions
      getInvoicesByMerchant: (merchantGuid) => {
        const state = get()
        return state.invoices.filter(i => i.merchantGuid === merchantGuid)
      },

      getInvoiceByGuid: (guid) => {
        const state = get()
        return state.invoices.find(i => i.guid === guid)
      },

      addInvoice: (invoice) => set((state) => ({
        invoices: [...state.invoices, invoice]
      })),

      updateInvoice: (invoice) => set((state) => ({
        invoices: state.invoices.map(i => 
          i.guid === invoice.guid ? invoice : i
        )
      })),

      deleteInvoice: (guid) => set((state) => ({
        invoices: state.invoices.filter(i => i.guid !== guid)
      })),

      payInvoice: (invoiceGuid, paidBy, cardGuid) => {
        const state = get()
        const invoice = state.invoices.find(i => i.guid === invoiceGuid)
        const card = state.cards.find(c => c.guid === cardGuid)
        
        if (!invoice || !card || invoice.isPaid) return false
        if (card.balance < invoice.amount) return false

        const merchant = state.merchants.find(m => m.guid === invoice.merchantGuid)
        if (!merchant) return false

        // Deduct from card
        const newCardBalance = card.balance - invoice.amount
        // Add to merchant
        const newMerchantBalance = merchant.balance + invoice.amount

        set({
          cards: state.cards.map(c => 
            c.guid === cardGuid ? { ...c, balance: newCardBalance } : c
          ),
          merchants: state.merchants.map(m => 
            m.guid === merchant.guid ? { ...m, balance: newMerchantBalance } : m
          ),
          invoices: state.invoices.map(i => 
            i.guid === invoiceGuid ? { ...i, isPaid: true, paidBy } : i
          ),
          transactions: [...state.transactions, {
            guid: crypto.randomUUID(),
            merchantGuid: merchant.guid,
            amount: invoice.amount,
            createdAt: new Date().toISOString()
          }]
        })

        return true
      },

      // Card actions
      addCard: (card) => set((state) => ({
        cards: [...state.cards, card]
      })),

      removeCard: (guid) => set((state) => ({
        cards: state.cards.filter(c => c.guid !== guid)
      })),

      updateCard: (card) => set((state) => ({
        cards: state.cards.map(c => c.guid === card.guid ? card : c)
      })),

      updateCardBalance: (guid, amount) => set((state) => ({
        cards: state.cards.map(c => 
          c.guid === guid ? { ...c, balance: c.balance + amount } : c
        )
      })),

      findCardByNumber: (cardNumber) => {
        const state = get()
        const normalized = cardNumber.replace(/\s+/g, '').replace(/-/g, '')
        return state.cards.find(c => 
          c.number.replace(/\s+/g, '').replace(/-/g, '') === normalized
        )
      },

      getMerchantByGuid: (guid) => {
        const state = get()
        return state.merchants.find(m => m.guid === guid)
      },

      // Transaction actions
      addTransaction: (transaction) => set((state) => ({
        transactions: [...state.transactions, transaction]
      })),

      getTransactionsByMerchant: (merchantGuid) => {
        const state = get()
        return state.transactions.filter(t => t.merchantGuid === merchantGuid)
      },
    }),
    {
      name: 'app-storage',
    }
  )
)
