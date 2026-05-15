import { apiClient } from './client'
import type { ApiResponse } from './types'

export interface User {
  id: number
  first_name: string
  last_name: string
  email: string
  status: number
}

export const getUsers = async (): Promise<ApiResponse<User[]>> => {
  const response = await apiClient.get<ApiResponse<User[]>>('/user')
  return response.data
}
