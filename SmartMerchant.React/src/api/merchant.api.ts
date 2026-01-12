import api from './api'
import type { Merchant } from '@/types'

// Response types
export interface MerchantResponse {
  success: boolean
  merchant: {
    guid: string
    code: string
    name: string
    description: string
    logoUrl: string
    balance: number
    ownerUserGuid: string
  }
}

export interface CreateMerchantRequest {
  name: string
  description?: string
  logoUrl?: string
}

export interface EditMerchantRequest {
  code?: string
  name?: string
  description?: string
  logoUrl?: string
}

// Transform API merchant to frontend Merchant type
function transformMerchant(apiMerchant: MerchantResponse['merchant']): Merchant {
  return {
    guid: apiMerchant.guid,
    code: apiMerchant.code,
    name: apiMerchant.name,
    description: apiMerchant.description,
    logoURL: apiMerchant.logoUrl,
    balance: apiMerchant.balance,
    ownerUserGuid: apiMerchant.ownerUserGuid
  }
}

// Merchant API functions
export const merchantApi = {
  // Get merchant by user (current user's merchant)
  async getMerchant(): Promise<Merchant | null> {
    try {
      const response = await api.get<MerchantResponse>('/merchant')
      if (response.data.success && response.data.merchant) {
        return transformMerchant(response.data.merchant)
      }
      return null
    } catch {
      return null
    }
  },

  // Get merchant by GUID (public access for payment pages)
  async getMerchantByGuid(guid: string): Promise<Merchant | null> {
    try {
      const response = await api.get<MerchantResponse>('/merchant', {
        params: { guid }
      })
      if (response.data.success && response.data.merchant) {
        return transformMerchant(response.data.merchant)
      }
      return null
    } catch {
      return null
    }
  },

  // Create merchant
  async create(data: CreateMerchantRequest): Promise<{ success: boolean; message: string; merchantGuid?: string }> {
    const response = await api.post<{ success: boolean; message: string; merchantGuid?: string }>('/merchant/create', data)
    return response.data
  },

  // Edit merchant
  async edit(merchantGuid: string, data: EditMerchantRequest): Promise<{ success: boolean; message: string }> {
    const response = await api.put<{ success: boolean; message: string }>(`/merchant/edit/${merchantGuid}`, data)
    return response.data
  }
}
