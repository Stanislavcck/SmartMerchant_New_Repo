import type { Entity } from '@/types/Entity'

export interface UserSession extends Entity {
  userGuid: string
  token: string
  createdAt: string
  expireAt: string
}
