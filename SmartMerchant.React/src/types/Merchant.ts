import type { Entity } from '@/types/Entity'

export interface Merchant extends Entity {
  code: string
  name: string
  description: string
  logoURL: string
  balance: number
  ownerUserGuid: string
}
