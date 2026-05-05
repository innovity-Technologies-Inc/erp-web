import type { User } from '@/store/useAuthStore'

export interface LoginCredentials {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  user: User
  permissions: string[]
  expires_in: number
}
