import api from './api'
import type { CreditCard } from '@/types'

// API card type (from backend)
interface ApiCard {
  guid: string
  holderFirstName: string
  holderLastName: string
  number: string
  expiry: string
  cvv: string
  balance: number
}

// Response types
export interface CardsResponse {
  success: boolean
  cards: ApiCard[]
}

export interface CardResponse {
  success: boolean
  card: ApiCard
}

export interface CreateCardRequest {
  holderFirstName: string
  holderLastName: string
  number: string
  expiry: string // MM.yy format (e.g., "12.34")
  cvv?: string
  balance?: number
}

export interface EditCardRequest {
  holderFirstName?: string
  holderLastName?: string
  number?: string
  expiry?: string // MM.yy format (e.g., "12.34")
  cvv?: string
  balance?: number
}

// Transform API card to frontend CreditCard type
function transformCard(apiCard: ApiCard): CreditCard {
  // Parse expiry from MM.yy format (e.g., "12.34") to a date
  const [month, year] = apiCard.expiry.split('.')
  const fullYear = parseInt(year) < 50 ? 2000 + parseInt(year) : 1900 + parseInt(year)
  const expirationDate = new Date(fullYear, parseInt(month) - 1)
  
  return {
    guid: apiCard.guid,
    holderFirstName: apiCard.holderFirstName,
    holderLastName: apiCard.holderLastName,
    number: apiCard.number,
    expirationDate: expirationDate.toISOString(),
    cvv: apiCard.cvv,
    balance: apiCard.balance
  }
}

// Card API functions
export const cardApi = {
  // Get all cards
  async getCards(): Promise<CreditCard[]> {
    const response = await api.get<CardsResponse>('/card')
    return response.data.cards.map(transformCard)
  },

  // Get single card by GUID
  async getCard(cardGuid: string): Promise<CreditCard | null> {
    try {
      const response = await api.get<CardResponse>(`/card/${cardGuid}`)
      if (response.data.success && response.data.card) {
        return transformCard(response.data.card)
      }
      return null
    } catch {
      return null
    }
  },

  // Create card
  async create(data: CreateCardRequest): Promise<{ success: boolean; message: string; cardGuid?: string }> {
    const response = await api.post<{ success: boolean; message: string; cardGuid?: string }>('/card/create', data)
    return response.data
  },

  // Edit card
  async edit(cardGuid: string, data: EditCardRequest): Promise<{ success: boolean; message: string }> {
    const response = await api.put<{ success: boolean; message: string }>(`/card/edit/${cardGuid}`, data)
    return response.data
  },

  // Delete card
  async delete(cardGuid: string): Promise<{ success: boolean; message: string }> {
    const response = await api.delete<{ success: boolean; message: string }>(`/card/${cardGuid}`)
    return response.data
  }
}
