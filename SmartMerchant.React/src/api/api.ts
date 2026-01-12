import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios'
import { API_BASE } from '@/constants'

// Storage keys
export const AUTH_TOKEN_KEY = 'auth-token'
export const AUTH_USER_KEY = 'auth-user'

// Get token from localStorage
export const getAuthToken = (): string | null => {
  return localStorage.getItem(AUTH_TOKEN_KEY)
}

// Set token in localStorage
export const setAuthToken = (token: string): void => {
  localStorage.setItem(AUTH_TOKEN_KEY, token)
}

// Remove token from localStorage
export const removeAuthToken = (): void => {
  localStorage.removeItem(AUTH_TOKEN_KEY)
  localStorage.removeItem(AUTH_USER_KEY)
}

// Create axios instance with auth
const api: AxiosInstance = axios.create({
  baseURL: `${API_BASE}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - add auth token to requests as Bearer token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAuthToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      removeAuthToken()
      const currentPath = window.location.hash
      if (!currentPath.includes('/login') && 
          !currentPath.includes('/register') && 
          !currentPath.includes('/pay/') &&
          !currentPath.includes('/cheque/')) {
        window.location.hash = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
