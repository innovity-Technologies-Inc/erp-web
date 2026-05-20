import { apiClient } from '@/api/client'
import type { DataTablesResponse, ApiResponse } from '@/api/types'

export interface CategoryListItem {
  id?: number
  uuid: string
  category_name: string
  parent_id?: number | null
  status: number
  created_at: string
}

export const getCategoriesDatatable = async (params: any): Promise<DataTablesResponse<CategoryListItem>> => {
  const response = await apiClient.get<DataTablesResponse<CategoryListItem>>('/inventory/product-category/datatable', { params })
  return response.data
}

export const storeCategory = async (data: any): Promise<ApiResponse<any>> => {
  const response = await apiClient.post<ApiResponse<any>>('/inventory/product-category/store', data)
  return response.data
}

export const updateCategory = async (data: any): Promise<ApiResponse<any>> => {
  const response = await apiClient.post<ApiResponse<any>>('/inventory/product-category/update', data)
  return response.data
}

export const deleteCategory = async (uuid: string): Promise<ApiResponse<any>> => {
  const response = await apiClient.delete<ApiResponse<any>>('/inventory/product-category/delete', { data: { uuid } })
  return response.data
}

export const getCategoryData = async (id: number | string): Promise<ApiResponse<any>> => {
  const response = await apiClient.get<ApiResponse<any>>(`/inventory/product-category/new-form/${id}`)
  return response.data
}

// For dropdowns
export const getCategoryList = async (): Promise<any> => {
  const response = await apiClient.get('/b2b/category-list')
  return response.data
}

export const getCategorySelect2 = async (): Promise<any[]> => {
  const response = await apiClient.get<any[]>('/select2/get-category-select2')
  return response.data
}

export const getMainCategorySelect2 = async (): Promise<any[]> => {
  const response = await apiClient.get<any[]>('/select2/get-main-category-select2')
  return response.data
}

export const getSubCategorySelect2 = async (parentId: number | string): Promise<any[]> => {
  const response = await apiClient.get<any[]>(`/select2/get-sub-category-by-main-id/${parentId}`)
  return response.data
}
