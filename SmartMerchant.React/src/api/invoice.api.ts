import api from './api'
import type { MerchantInvoice } from '@/types'

// API invoice type (from backend)
interface ApiInvoice {
  guid: string
  number: string
  amount: number
  description: string
  createdAt: string
  dueAt: string
  isPaid: boolean
  paidBy: string
  merchantGuid?: string
}

// Response types
export interface InvoicesResponse {
  success: boolean
  invoices: ApiInvoice[]
  pagination: {
    page: number
    pageSize: number
    totalCount: number
    totalPages: number
  }
}

export interface InvoiceResponse {
  success: boolean
  invoice: ApiInvoice
}

export interface CreateInvoiceRequest {
  amount: number
  description?: string
  dueAt?: string
}

export interface CreateInvoiceResponse {
  success: boolean
  message: string
  invoiceGuid?: string
  invoiceNumber?: string
}

// Transform API invoice to frontend MerchantInvoice type
function transformInvoice(apiInvoice: ApiInvoice, merchantGuid?: string): MerchantInvoice {
  return {
    guid: apiInvoice.guid,
    number: apiInvoice.number,
    merchantGuid: apiInvoice.merchantGuid || merchantGuid || '',
    amount: apiInvoice.amount,
    description: apiInvoice.description,
    createdAt: apiInvoice.createdAt,
    dueAt: apiInvoice.dueAt,
    isPaid: apiInvoice.isPaid,
    paidBy: apiInvoice.paidBy
  }
}

// Invoice API functions
export const invoiceApi = {
  // Get all invoices for merchant (with pagination)
  async getInvoices(page: number = 1, pageSize: number = 100): Promise<{ invoices: MerchantInvoice[]; pagination: InvoicesResponse['pagination'] }> {
    const response = await api.get<InvoicesResponse>('/invoice', {
      params: { page, pageSize }
    })
    
    return {
      invoices: response.data.invoices.map(inv => transformInvoice(inv)),
      pagination: response.data.pagination
    }
  },

  // Get single invoice by GUID (public access for payment)
  async getInvoice(invoiceGuid: string): Promise<MerchantInvoice | null> {
    try {
      const response = await api.get<InvoiceResponse>(`/invoice/${invoiceGuid}`)
      if (response.data.success && response.data.invoice) {
        return transformInvoice(response.data.invoice)
      }
      return null
    } catch {
      return null
    }
  },

  // Create invoice
  async create(data: CreateInvoiceRequest): Promise<CreateInvoiceResponse> {
    const response = await api.post<CreateInvoiceResponse>('/invoice/create', data)
    return response.data
  },

  // Delete invoice
  async delete(invoiceGuid: string): Promise<{ success: boolean; message: string }> {
    const response = await api.delete<{ success: boolean; message: string }>(`/invoice/${invoiceGuid}`)
    return response.data
  },

  // Mark invoice as paid (merchant action)
  async markAsPaid(invoiceGuid: string, paidBy?: string): Promise<{ success: boolean; message: string }> {
    const response = await api.post<{ success: boolean; message: string }>(`/invoice/${invoiceGuid}/mark-paid`, { paidBy })
    return response.data
  }
}
