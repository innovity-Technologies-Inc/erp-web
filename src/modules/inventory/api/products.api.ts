import { apiClient } from '@/api/client'
import type { DataTablesResponse, ApiResponse } from '@/api/types'

export interface ProductListItem {
  id: number
  uuid: string
  product_name: string
  category_name: string
  supplier_name: string
  price: number
  supplier_price: number
  image: string
  status: number
}

export const getProductsDatatable = async (params: any): Promise<DataTablesResponse<ProductListItem>> => {
  const response = await apiClient.get<DataTablesResponse<ProductListItem>>('/inventory/products/datatable', { params })
  return response.data
}

export const storeProduct = async (data: FormData): Promise<ApiResponse<any>> => {
  const response = await apiClient.post<ApiResponse<any>>('/inventory/products/store', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return response.data
}

export const updateProduct = async (data: FormData): Promise<ApiResponse<any>> => {
  const response = await apiClient.post<ApiResponse<any>>('/inventory/products/update', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return response.data
}

export const deleteProduct = async (uuid: string): Promise<ApiResponse<any>> => {
  const response = await apiClient.delete<ApiResponse<any>>('/inventory/products/delete', { data: { uuid } })
  return response.data
}

export const getProductData = async (id: number | string): Promise<ApiResponse<any>> => {
  const response = await apiClient.get<ApiResponse<any>>(`/inventory/products/${id}`)
  return response.data
}

export const getProductInvoiceInfo = async (id: number | string, params?: any): Promise<ApiResponse<any>> => {
  const response = await apiClient.get<ApiResponse<any>>(`/inventory/products/get-invoice-info/${id}`, { params })
  return response.data
}
