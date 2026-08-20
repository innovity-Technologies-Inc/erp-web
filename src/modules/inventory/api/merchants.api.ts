import { apiClient } from '@/api/client'
import type { DataTablesResponse, ApiResponse } from '@/api/types'

export interface MerchantListItem {
  id: number
  uuid: string
  customer_name: string
  customer_mobile: string
  customer_email: string
  sales_permit_number: string
  sales_permit: string // HTML or URL
  balance: number
  status: string // HTML badge or text
  address?: string | null
}

export const getMerchantsDatatable = async (params: any): Promise<DataTablesResponse<MerchantListItem>> => {
  const response = await apiClient.get<DataTablesResponse<MerchantListItem>>('/inventory/merchant/datatable', { params })
  return response.data
}

export const storeMerchant = async (data: FormData): Promise<ApiResponse<any>> => {
  const response = await apiClient.post<ApiResponse<any>>('/inventory/merchant/store', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return response.data
}

export const updateMerchant = async (data: FormData): Promise<ApiResponse<any>> => {
  const response = await apiClient.post<ApiResponse<any>>('/inventory/merchant/update', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return response.data
}

export const deleteMerchant = async (payload: { id: number; uuid: string }): Promise<ApiResponse<any>> => {
  const response = await apiClient.delete<ApiResponse<any>>('/inventory/merchant/delete', { data: payload })
  return response.data
}

export const getMerchantData = async (id: number | string): Promise<ApiResponse<any>> => {
  const response = await apiClient.get<ApiResponse<any>>(`/inventory/merchant/get-data/${id}`)
  return response.data
}
