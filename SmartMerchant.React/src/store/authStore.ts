import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types'
import { getAuthToken, removeAuthToken } from '@/api'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  login: (user: User) => void
  logout: () => void
  checkAuth: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      login: (user) => {
        // Token is already stored by authApi.login() via setAuthToken()
        set({ user, isAuthenticated: true })
      },

      logout: () => {
        removeAuthToken()
        set({ user: null, isAuthenticated: false })
      },

      // Check if there's a valid token
      checkAuth: () => {
        return !!getAuthToken()
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated 
      }),
      onRehydrateStorage: () => (state) => {
        // On rehydrate, verify token still exists
        if (state) {
          const hasToken = !!getAuthToken()
          if (!hasToken && state.isAuthenticated) {
            state.user = null
            state.isAuthenticated = false
          }
        }
      }
    }
  )
)
