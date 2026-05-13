import { apiClient } from '@/api/client'
import type { DataTablesResponse, ApiResponse } from '@/api/types'

export interface TermListItem {
  id: number
  uuid: string
  description: string
  status: 'Active' | 'Inactive'
}

export interface Term {
  id: number
  uuid: string
  description: string
  status: number
}

export interface TermFormData {
  description: string
  status?: number
}

export const getTermsDatatable = async (params: any): Promise<DataTablesResponse<TermListItem>> => {
  const response = await apiClient.get<DataTablesResponse<TermListItem>>('/inventory/datatable/terms', { params })
  return response.data
}

export const createTerm = async (data: TermFormData): Promise<ApiResponse<any>> => {
  const response = await apiClient.post<ApiResponse<any>>('/inventory/terms', data)
  return response.data
}

export const updateTerm = async (id: number, data: TermFormData): Promise<ApiResponse<any>> => {
  const response = await apiClient.put<ApiResponse<any>>(`/inventory/terms/${id}`, data)
  return response.data
}

export const deleteTerm = async (id: number): Promise<ApiResponse<any>> => {
  const response = await apiClient.delete<ApiResponse<any>>(`/inventory/terms/${id}`)
  return response.data
}

export const getTerm = async (id: number): Promise<ApiResponse<Term>> => {
  const response = await apiClient.get<ApiResponse<Term>>(`/inventory/terms/${id}`)
  return response.data
}
