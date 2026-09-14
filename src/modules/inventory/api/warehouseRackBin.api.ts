import { apiClient } from '@/api/client'
import type { ApiResponse } from '@/api/types'
import type { WarehouseZone } from './warehouseZone.api'

export interface WarehouseRackBin {
  id: number
  uuid: string
  zone_id: number
  aisle: string
  rack: string
  shelf: string
  bin: string
  barcode_value: string
  capacity_volume: number | null
  capacity_weight: number | null
  max_quantity: number
  status: 'active' | 'inactive'
  created_at?: string
  updated_at?: string
  zone?: WarehouseZone
}

export interface WarehouseRackBinFormData {
  zone_id: number | string
  aisle?: string
  rack?: string
  shelf?: string
  bin?: string
  capacity_volume?: number | null
  capacity_weight?: number | null
  max_quantity?: number | null
  status?: 'active' | 'inactive'
}

export interface RackBinListResponse {
  current_page: number
  data: WarehouseRackBin[]
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

export const getWarehouseRackBins = async (params?: any): Promise<ApiResponse<RackBinListResponse>> => {
  const response = await apiClient.get<ApiResponse<RackBinListResponse>>('/inventory/warehouse-management/rack-bins', { params })
  return response.data
}

export const getWarehouseRackBin = async (id: number | string): Promise<ApiResponse<WarehouseRackBin>> => {
  const response = await apiClient.get<ApiResponse<WarehouseRackBin>>(`/inventory/warehouse-management/rack-bins/${id}`)
  return response.data
}

export const createWarehouseRackBin = async (data: WarehouseRackBinFormData): Promise<ApiResponse<WarehouseRackBin>> => {
  const response = await apiClient.post<ApiResponse<WarehouseRackBin>>('/inventory/warehouse-management/rack-bins', data)
  return response.data
}

export const updateWarehouseRackBin = async (id: number | string, data: WarehouseRackBinFormData): Promise<ApiResponse<WarehouseRackBin>> => {
  const response = await apiClient.put<ApiResponse<WarehouseRackBin>>(`/inventory/warehouse-management/rack-bins/${id}`, data)
  return response.data
}

export const deleteWarehouseRackBin = async (id: number | string): Promise<ApiResponse<any>> => {
  const response = await apiClient.delete<ApiResponse<any>>(`/inventory/warehouse-management/rack-bins/${id}`)
  return response.data
}
