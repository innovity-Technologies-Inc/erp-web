import { apiClient } from '@/api/client'
import type { DataTablesResponse, ApiResponse } from '@/api/types'

export interface FinancialYearListItem {
  id: number
  uuid: string
  year: string
  start_date: string
  end_date: string
  status: 'Active' | 'Inactive'
  closeBtn: string
}

export const getFinancialYearsDatatable = async (params: any): Promise<DataTablesResponse<FinancialYearListItem>> => {
  const response = await apiClient.get<DataTablesResponse<FinancialYearListItem>>('/account/datatable/financial-year', { params })
  return response.data
}

export const storeFinancialYear = async (data: any): Promise<ApiResponse<any>> => {
  const response = await apiClient.post<ApiResponse<any>>('/account/financial-year', data)
  return response.data
}

export const updateFinancialYear = async (payload: { id: number; data: any }): Promise<ApiResponse<any>> => {
  const response = await apiClient.put<ApiResponse<any>>(`/account/financial-year/${payload.id}`, payload.data)
  return response.data
}

export const deleteFinancialYear = async (id: number): Promise<ApiResponse<any>> => {
  const response = await apiClient.delete<ApiResponse<any>>(`/account/financial-year/${id}`)
  return response.data
}

export const getFinancialYearData = async (id: number | string): Promise<ApiResponse<any>> => {
  const response = await apiClient.get<ApiResponse<any>>(`/account/financial-year/${id}`)
  return response.data
}

export const updateFinancialYearStatus = async (id: number): Promise<ApiResponse<any>> => {
  const response = await apiClient.post<ApiResponse<any>>(`/account/financial-year/status-update/${id}`)
  return response.data
}
