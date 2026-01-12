import type { Entity } from '@/types/Entity'

export interface CreditCard extends Entity {
  balance: number
  number: string
  expirationDate: string
  cvv: string
  holderFirstName: string
  holderLastName: string
}
