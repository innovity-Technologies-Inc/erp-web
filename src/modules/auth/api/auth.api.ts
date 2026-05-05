import { apiClient } from '@/api/client'
import type { ApiResponse } from '@/api/types'
import type { LoginCredentials, LoginResponse } from '../api/types'

export const login = async (credentials: LoginCredentials): Promise<ApiResponse<LoginResponse>> => {
  const response = await apiClient.post<ApiResponse<LoginResponse>>('/auth/login', credentials)
  return response.data
}

export const forgotPassword = async (email: string): Promise<ApiResponse<null>> => {
  const response = await apiClient.post<ApiResponse<null>>('/auth/forgot-password', { email })
  return response.data
}

export const resetPassword = async (data: any): Promise<ApiResponse<null>> => {
  const response = await apiClient.post<ApiResponse<null>>('/auth/reset-password', data)
  return response.data
}
