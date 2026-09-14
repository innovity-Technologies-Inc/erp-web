import { apiClient } from '@/api/client'
import type { ApiResponse } from '@/api/types'

export interface WarehouseZone {
  id: number
  uuid: string
  warehouse_id: number
  zone_name: string
  zone_code: string
  status?: 'active' | 'inactive'
  created_at?: string
  updated_at?: string
  warehouse?: {
    id: number
    uuid: string
    name: string
    warehouse_code: string
  }
}

export interface WarehouseZoneFormData {
  warehouse_id: number | string
  zone_name: string
  zone_code: string
  status?: 'active' | 'inactive'
}

export interface ZoneListResponse {
  current_page: number
  data: WarehouseZone[]
  first_page_url: string
  from: number
  last_page: number
  last_page_url: string
  next_page_url: string | null
  path: string
  per_page: number
  prev_page_url: string | null
  to: number
  total: number
}

export const getWarehouseZones = async (params?: any): Promise<ApiResponse<ZoneListResponse>> => {
  const response = await apiClient.get<ApiResponse<ZoneListResponse>>('/inventory/warehouse-management/zones', { params })
  return response.data
}

export const getWarehouseZone = async (id: number | string): Promise<ApiResponse<WarehouseZone>> => {
  const response = await apiClient.get<ApiResponse<WarehouseZone>>(`/inventory/warehouse-management/zones/${id}`)
  return response.data
}

export const createWarehouseZone = async (data: WarehouseZoneFormData): Promise<ApiResponse<WarehouseZone>> => {
  const response = await apiClient.post<ApiResponse<WarehouseZone>>('/inventory/warehouse-management/zones', data)
  return response.data
}

export const updateWarehouseZone = async (id: number | string, data: WarehouseZoneFormData): Promise<ApiResponse<WarehouseZone>> => {
  const response = await apiClient.put<ApiResponse<WarehouseZone>>(`/inventory/warehouse-management/zones/${id}`, data)
  return response.data
}

export const deleteWarehouseZone = async (id: number | string): Promise<ApiResponse<any>> => {
  const response = await apiClient.delete<ApiResponse<any>>(`/inventory/warehouse-management/zones/${id}`)
  return response.data
}
