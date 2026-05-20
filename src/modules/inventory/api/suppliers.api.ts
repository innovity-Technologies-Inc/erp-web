import { apiClient } from '@/api/client'
import type { DataTablesResponse, ApiResponse } from '@/api/types'

export interface SupplierListItem {
  id: number
  uuid: string
  supplier_name: string
  address: string
  mobile: string
  emailnumber: string
  city: string
  state: string
  zip: string
  country: string
  date: string
  status: string
  balance: number
}

export const getSuppliersDatatable = async (params: any): Promise<DataTablesResponse<SupplierListItem>> => {
  const response = await apiClient.get<DataTablesResponse<SupplierListItem>>('/inventory/supplier/datatable', { params })
  return response.data
}

export const createSupplier = async (data: any): Promise<ApiResponse<any>> => {
  const response = await apiClient.post<ApiResponse<any>>('/inventory/supplier/store', data)
  return response.data
}

export const updateSupplier = async (uuid: string, data: any): Promise<ApiResponse<any>> => {
  const response = await apiClient.post<ApiResponse<any>>('/inventory/supplier/update', { ...data, uuid })
  return response.data
}

export const deleteSupplier = async (id: number, uuid: string): Promise<ApiResponse<any>> => {
  const response = await apiClient.delete<ApiResponse<any>>('/inventory/supplier/delete', { data: { id, uuid } })
  return response.data
}

export const getSupplierData = async (id: number): Promise<ApiResponse<any>> => {
  const response = await apiClient.get<ApiResponse<any>>(`/inventory/supplier/get-data/${id}`)
  return response.data
}

export const getVendorSelect2 = async (): Promise<any[]> => {
  const response = await apiClient.get<any[]>('/select2/get-vendor-select2')
  return response.data
}
