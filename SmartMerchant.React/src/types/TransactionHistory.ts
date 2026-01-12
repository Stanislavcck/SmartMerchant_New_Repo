import type { Entity } from '@/types/Entity'

export interface TransactionHistory extends Entity {
  merchantGuid: string
  amount: number
  createdAt: string
}
