import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { queryClient } from '@/api/QueryProvider'

export interface User {
  id: number
  first_name: string
  last_name: string
  email: string
  user_type: string
  roles: Array<{
    id: number
    name: string
    [key: string]: any
  }>
  [key: string]: any
}

interface AuthState {
  user: User | null
  token: string | null
  expiresAt: number | null
  permissions: string[]
  setUser: (user: User, token: string, permissions: string[], expiresIn: number) => void
  clearUser: () => void
  setToken: (token: string) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      expiresAt: null,
      permissions: [],
      setUser: (user, token, permissions, expiresIn) => {
        try {
          queryClient.clear()
        } catch {
          // ignore if not mounted yet
        }
        const expiresAt = Date.now() + expiresIn * 1000
        set({ user, token, permissions, expiresAt })
      },
      clearUser: () => {
        try {
          queryClient.clear()
        } catch {
          // ignore if not mounted yet
        }
        set({ user: null, token: null, permissions: [], expiresAt: null })
      },
      setToken: (token) => set({ token }),
    }),
    {
      name: 'erp-auth-storage',
      partialize: (state) => ({ 
        token: state.token, 
        user: state.user, 
        permissions: state.permissions,
        expiresAt: state.expiresAt 
      }),
    }
  )
)
