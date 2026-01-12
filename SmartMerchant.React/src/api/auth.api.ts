import api, { setAuthToken, removeAuthToken } from './api'
import type { User } from '@/types'

// Request types
export interface LoginRequest {
  username: string
  password: string
}

export interface RegisterRequest {
  firstName: string
  lastName: string
  middleName?: string
  username: string
  password: string
}

export interface UpdateUserRequest {
  firstName?: string
  lastName?: string
  middleName?: string
  username?: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

// Response types
export interface LoginResponse {
  success: boolean
  message: string
  token: string
  userGuid: string
}

export interface RegisterResponse {
  success: boolean
  message: string
  userGuid: string
}

export interface UserResponse {
  success: boolean
  user: {
    guid: string
    firstName: string
    lastName: string
    middleName?: string
    username: string
  }
}

// Auth API functions - uses api.ts for all HTTP calls (auth header handled there)
export const authApi = {
  async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/authorization/login', data)
    if (response.data.success && response.data.token) {
      setAuthToken(response.data.token)
    }
    return response.data
  },

  async register(data: RegisterRequest): Promise<RegisterResponse> {
    const response = await api.post<RegisterResponse>('/authorization/register', data)
    return response.data
  },

  async getUser(): Promise<UserResponse> {
    const response = await api.get<UserResponse>('/authorization/user')
    return response.data
  },

  async updateUser(data: UpdateUserRequest): Promise<{ success: boolean; message: string }> {
    const response = await api.put<{ success: boolean; message: string }>('/authorization/user', data)
    return response.data
  },

  async changePassword(data: ChangePasswordRequest): Promise<{ success: boolean; message: string }> {
    const response = await api.post<{ success: boolean; message: string }>('/authorization/user/change-password', data)
    return response.data
  },

  async logout(): Promise<void> {
    try {
      await api.post('/authorization/logout')
    } finally {
      removeAuthToken()
    }
  }
}
