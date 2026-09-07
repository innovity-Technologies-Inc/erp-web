import { apiClient } from '@/api/client'
import type { ApiResponse } from '@/api/types'
import type {
  BudgetHead,
  BudgetHeadFilters,
  CreateBudgetHeadDto,
  UpdateBudgetHeadDto,
} from './types'

export interface PaginatedBudgetHeadsResponse {
  status: string
  message: string
  response: BudgetHead[]
  meta: {
    current_page: number
    per_page: number
    total: number
  }
}

export const getBudgetHeads = async (
  filters?: BudgetHeadFilters
): Promise<PaginatedBudgetHeadsResponse> => {
  const response = await apiClient.get<PaginatedBudgetHeadsResponse>('/procurement/budget-heads', {
    params: filters,
  })
  return response.data
}

export const getBudgetHead = async (uuid: string): Promise<ApiResponse<BudgetHead>> => {
  const response = await apiClient.get<ApiResponse<BudgetHead>>(`/procurement/budget-heads/${uuid}`)
  return response.data
}

export const createBudgetHead = async (
  dto: CreateBudgetHeadDto
): Promise<ApiResponse<BudgetHead>> => {
  const response = await apiClient.post<ApiResponse<BudgetHead>>('/procurement/budget-heads', dto)
  return response.data
}

export const updateBudgetHead = async ({
  uuid,
  ...dto
}: UpdateBudgetHeadDto): Promise<ApiResponse<BudgetHead>> => {
  const response = await apiClient.put<ApiResponse<BudgetHead>>(
    `/procurement/budget-heads/${uuid}`,
    dto
  )
  return response.data
}

export const deleteBudgetHead = async (uuid: string): Promise<ApiResponse<null>> => {
  const response = await apiClient.delete<ApiResponse<null>>(`/procurement/budget-heads/${uuid}`)
  return response.data
}
