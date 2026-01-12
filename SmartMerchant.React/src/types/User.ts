import type { Entity } from '@/types/Entity'

export interface User extends Entity {
  firstName: string
  lastName: string
  middleName?: string
  username: string
  password: string
  passwordSalt: string
}
