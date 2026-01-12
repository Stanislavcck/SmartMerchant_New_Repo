import type { User, Merchant, MerchantInvoice, CreditCard } from '@/types'

// Generate UUIDs
const generateGuid = () => crypto.randomUUID()

// Initial Users
const emptyUserGuid = generateGuid()
const limeUserGuid = generateGuid()

export const initialUsers: User[] = [
  {
    guid: emptyUserGuid,
    firstName: 'Empty',
    lastName: 'Merchant',
    middleName: '',
    username: 'empty_merchant',
    password: '12345678',
    passwordSalt: ''
  },
  {
    guid: limeUserGuid,
    firstName: 'LIME',
    lastName: 'LIME',
    middleName: '',
    username: 'LIME',
    password: 'LIME',
    passwordSalt: ''
  }
]

// Initial Merchants
const emptyMerchantGuid = generateGuid()
const limeMerchantGuid = generateGuid()

export const initialMerchants: Merchant[] = [
  {
    guid: emptyMerchantGuid,
    code: 'LM-1',
    name: 'Empty Merchant',
    description: 'An empty merchant for testing',
    logoURL: '',
    balance: 0.0,
    ownerUserGuid: emptyUserGuid
  },
  {
    guid: limeMerchantGuid,
    code: 'LM-2',
    name: 'LIME Merchant',
    description: 'Merchant with invoices',
    logoURL: '',
    balance: 10000.0,
    ownerUserGuid: limeUserGuid
  }
]

// Initial Invoices
const now = new Date()
let invoiceCount = 0

const createInvoice = (
  merchantGuid: string,
  amount: number,
  description: string,
  createdDaysAgo: number,
  dueDaysFromNow: number,
  isPaid: boolean,
  paidBy: string
): MerchantInvoice => {
  invoiceCount++
  return {
    guid: generateGuid(),
    number: `INV-${String(invoiceCount).padStart(6, '0')}`,
    merchantGuid,
    amount,
    description,
    createdAt: new Date(now.getTime() - createdDaysAgo * 24 * 60 * 60 * 1000).toISOString(),
    dueAt: new Date(now.getTime() + dueDaysFromNow * 24 * 60 * 60 * 1000).toISOString(),
    isPaid,
    paidBy
  }
}

export const initialInvoices: MerchantInvoice[] = [
  // 5 paid invoices
  createInvoice(limeMerchantGuid, 1000, 'Paid invoice #1', 1, 30, true, 'LIME LIME'),
  createInvoice(limeMerchantGuid, 1100, 'Paid invoice #2', 2, 29, true, 'LIME LIME'),
  createInvoice(limeMerchantGuid, 1200, 'Paid invoice #3', 3, 28, true, 'LIME LIME'),
  createInvoice(limeMerchantGuid, 1300, 'Paid invoice #4', 4, 27, true, 'LIME LIME'),
  createInvoice(limeMerchantGuid, 1400, 'Paid invoice #5', 5, 26, true, 'LIME LIME'),
  // 3 expired invoices
  createInvoice(limeMerchantGuid, 500, 'Expired invoice #1', 10, -1, false, ''),
  createInvoice(limeMerchantGuid, 550, 'Expired invoice #2', 11, -2, false, ''),
  createInvoice(limeMerchantGuid, 600, 'Expired invoice #3', 12, -3, false, ''),
  // 2 valid unpaid invoices
  createInvoice(limeMerchantGuid, 750, 'Valid unpaid invoice #1', 1, 7, false, ''),
  createInvoice(limeMerchantGuid, 850, 'Valid unpaid invoice #2', 2, 8, false, '')
]

// Initial Cards
const futureDate = new Date(now.getTime() + 2 * 365 * 24 * 60 * 60 * 1000)
const futureDate1Year = new Date(now.getTime() + 1 * 365 * 24 * 60 * 60 * 1000)

export const initialCards: CreditCard[] = [
  {
    guid: generateGuid(),
    holderFirstName: 'LIME',
    holderLastName: 'LIME',
    number: '4111111111111111',
    expirationDate: futureDate.toISOString(),
    cvv: '123',
    balance: 1000000.0
  },
  {
    guid: generateGuid(),
    holderFirstName: 'BROKE',
    holderLastName: 'BROKE',
    number: '4222222222222222',
    expirationDate: futureDate.toISOString(),
    cvv: '456',
    balance: 100.0
  },
  {
    guid: generateGuid(),
    holderFirstName: 'John',
    holderLastName: 'Doe',
    number: '5500000000000004',
    expirationDate: futureDate1Year.toISOString(),
    cvv: '789',
    balance: 10000.0
  }
]

// User-Merchant mapping helper
export const getUserMerchant = (userGuid: string): Merchant | undefined => {
  return initialMerchants.find(m => m.ownerUserGuid === userGuid)
}

// Find user by credentials
export const findUserByCredentials = (username: string, password: string): User | undefined => {
  return initialUsers.find(u => u.username === username && u.password === password)
}

// Check if username exists
export const isUsernameTaken = (username: string): boolean => {
  return initialUsers.some(u => u.username.toLowerCase() === username.toLowerCase())
}

// Default export for convenience
export const InitialState = {
  users: initialUsers,
  merchants: initialMerchants,
  invoices: initialInvoices,
  cards: initialCards,
  getUserMerchant,
  findUserByCredentials,
  isUsernameTaken
}

export default InitialState
