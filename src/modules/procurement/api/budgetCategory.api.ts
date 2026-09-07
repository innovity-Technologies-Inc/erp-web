import { apiClient } from '@/api/client'
import type { ApiResponse } from '@/api/types'
import type {
  BudgetCategory,
  BudgetCategoryFilters,
  CreateBudgetCategoryDto,
  UpdateBudgetCategoryDto,
} from './types'

export interface PaginatedBudgetCategoriesResponse {
  status: string
  message: string
  response: BudgetCategory[]
  meta: {
    current_page: number
    per_page: number
    total: number
  }
}

export const getBudgetCategories = async (
  filters?: BudgetCategoryFilters
): Promise<PaginatedBudgetCategoriesResponse> => {
  const response = await apiClient.get<PaginatedBudgetCategoriesResponse>('/procurement/budget-categories', {
    params: filters,
  })
  return response.data
}

export const getBudgetCategory = async (uuid: string): Promise<ApiResponse<BudgetCategory>> => {
  const response = await apiClient.get<ApiResponse<BudgetCategory>>(`/procurement/budget-categories/${uuid}`)
  return response.data
}

export const createBudgetCategory = async (
  dto: CreateBudgetCategoryDto
): Promise<ApiResponse<BudgetCategory>> => {
  const response = await apiClient.post<ApiResponse<BudgetCategory>>('/procurement/budget-categories', dto)
  return response.data
}

export const updateBudgetCategory = async ({
  uuid,
  ...dto
}: UpdateBudgetCategoryDto): Promise<ApiResponse<BudgetCategory>> => {
  const response = await apiClient.put<ApiResponse<BudgetCategory>>(
    `/procurement/budget-categories/${uuid}`,
    dto
  )
  return response.data
}

export const deleteBudgetCategory = async (uuid: string): Promise<ApiResponse<null>> => {
  const response = await apiClient.delete<ApiResponse<null>>(`/procurement/budget-categories/${uuid}`)
  return response.data
}
