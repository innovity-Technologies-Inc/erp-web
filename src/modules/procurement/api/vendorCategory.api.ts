import { apiClient } from '@/api/client'
import type { ApiResponse } from '@/api/types'
import type {
  VendorCategory,
  VendorCategoryFilters,
  CreateVendorCategoryDto,
  UpdateVendorCategoryDto,
} from './types'

export interface PaginatedVendorCategoriesResponse {
  status: string
  message: string
  response: VendorCategory[]
  meta: {
    current_page: number
    per_page: number
    total: number
  }
}

export const getVendorCategories = async (
  filters?: VendorCategoryFilters
): Promise<PaginatedVendorCategoriesResponse> => {
  const response = await apiClient.get<PaginatedVendorCategoriesResponse>('/procurement/vendor-categories', {
    params: filters,
  })
  return response.data
}

export const getVendorCategory = async (uuid: string): Promise<ApiResponse<VendorCategory>> => {
  const response = await apiClient.get<ApiResponse<VendorCategory>>(`/procurement/vendor-categories/${uuid}`)
  return response.data
}

export const createVendorCategory = async (
  dto: CreateVendorCategoryDto
): Promise<ApiResponse<VendorCategory>> => {
  const response = await apiClient.post<ApiResponse<VendorCategory>>('/procurement/vendor-categories', dto)
  return response.data
}

export const updateVendorCategory = async ({
  uuid,
  ...dto
}: UpdateVendorCategoryDto): Promise<ApiResponse<VendorCategory>> => {
  const response = await apiClient.put<ApiResponse<VendorCategory>>(
    `/procurement/vendor-categories/${uuid}`,
    dto
  )
  return response.data
}

export const deleteVendorCategory = async (uuid: string): Promise<ApiResponse<null>> => {
  const response = await apiClient.delete<ApiResponse<null>>(`/procurement/vendor-categories/${uuid}`)
  return response.data
}
