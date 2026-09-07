import { apiClient } from '@/api/client'
import type { ApiResponse } from '@/api/types'
import type {
  Budget,
  BudgetFilters,
  CreateBudgetDto,
  UpdateBudgetDto,
  BudgetApprovalDto,
  BudgetTransferDto,
} from './types'

export interface PaginatedBudgetsResponse {
  status: string
  message: string
  response: Budget[]
  meta: {
    current_page: number
    per_page: number
    total: number
  }
}

export interface SingleBudgetResponse {
  status: string
  message: string
  response: Budget
  data?: Budget
}

export const getBudgets = async (
  filters?: BudgetFilters
): Promise<PaginatedBudgetsResponse> => {
  const response = await apiClient.get<PaginatedBudgetsResponse>('/procurement/budgets', {
    params: filters,
  })
  return response.data
}

export const getBudget = async (uuid: string): Promise<SingleBudgetResponse> => {
  const response = await apiClient.get<SingleBudgetResponse>(`/procurement/budgets/${uuid}`)
  return response.data
}

export const createBudget = async (
  dto: CreateBudgetDto
): Promise<SingleBudgetResponse> => {
  const response = await apiClient.post<SingleBudgetResponse>('/procurement/budgets', dto)
  return response.data
}

export const updateBudget = async ({
  uuid,
  ...dto
}: UpdateBudgetDto): Promise<SingleBudgetResponse> => {
  const response = await apiClient.put<SingleBudgetResponse>(
    `/procurement/budgets/${uuid}`,
    dto
  )
  return response.data
}

export const deleteBudget = async (uuid: string): Promise<ApiResponse<null>> => {
  const response = await apiClient.delete<ApiResponse<null>>(`/procurement/budgets/${uuid}`)
  return response.data
}

export const approveBudget = async ({
  uuid,
  ...dto
}: BudgetApprovalDto): Promise<SingleBudgetResponse> => {
  const response = await apiClient.post<SingleBudgetResponse>(
    `/procurement/budgets/${uuid}/approvals`,
    dto
  )
  return response.data
}

export const transferBudget = async (
  dto: BudgetTransferDto
): Promise<ApiResponse<any>> => {
  const response = await apiClient.post<ApiResponse<any>>('/procurement/budget-transfers', dto)
  return response.data
}

