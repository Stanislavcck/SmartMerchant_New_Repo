import type { Entity } from '@/types/Entity'

export interface MerchantInvoice extends Entity {
  number: string
  merchantGuid: string
  amount: number
  description: string
  createdAt: string
  dueAt: string
  isPaid: boolean
  paidBy: string
}
