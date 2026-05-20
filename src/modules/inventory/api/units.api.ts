import { apiClient } from '@/api/client'
import type { DataTablesResponse, ApiResponse } from '@/api/types'

export interface UnitListItem {
  id: number
  uuid: string
  unit_name: string
  status: number
  created_at: string
}

export const getUnitsDatatable = async (params: any): Promise<DataTablesResponse<UnitListItem>> => {
  const response = await apiClient.get<DataTablesResponse<UnitListItem>>('/inventory/datatable/unit', { params })
  return response.data
}

export const storeUnit = async (data: any): Promise<ApiResponse<any>> => {
  const response = await apiClient.post<ApiResponse<any>>('/inventory/unit', data)
  return response.data
}

export const updateUnit = async (payload: { id: number; data: any }): Promise<ApiResponse<any>> => {
  const response = await apiClient.put<ApiResponse<any>>(`/inventory/unit/${payload.id}`, payload.data)
  return response.data
}

export const deleteUnit = async (id: number): Promise<ApiResponse<any>> => {
  const response = await apiClient.delete<ApiResponse<any>>(`/inventory/unit/${id}`)
  return response.data
}

export const getUnitData = async (id: number | string): Promise<ApiResponse<any>> => {
  const response = await apiClient.get<ApiResponse<any>>(`/inventory/unit/${id}`)
  return response.data
}

export const getUnitSelect2 = async (): Promise<any[]> => {
  const response = await apiClient.get<any[]>('/select2/get-unit-select2')
  return response.data
}
