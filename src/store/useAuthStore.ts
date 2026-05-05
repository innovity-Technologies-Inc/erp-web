import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface User {
  id: number
  name: string
  email: string
  role: string
}

interface AuthState {
  user: User | null
  token: string | null
  permissions: string[]
  setUser: (user: User, token: string, permissions: string[]) => void
  clearUser: () => void
  setToken: (token: string) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      permissions: [],
      setUser: (user, token, permissions) => set({ user, token, permissions }),
      clearUser: () => set({ user: null, token: null, permissions: [] }),
      setToken: (token) => set({ token }),
    }),
    {
      name: 'erp-auth-storage',
      partialize: (state) => ({ token: state.token, user: state.user, permissions: state.permissions }),
    }
  )
)
