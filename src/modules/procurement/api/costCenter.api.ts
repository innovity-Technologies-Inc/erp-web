import { apiClient } from '@/api/client'
import type { ApiResponse } from '@/api/types'
import type {
  CostCenter,
  CostCenterFilters,
  CreateCostCenterDto,
  UpdateCostCenterDto,
} from './types'

export interface PaginatedCostCentersResponse {
  status: string
  message: string
  response: CostCenter[]
  meta: {
    current_page: number
    per_page: number
    total: number
  }
}

export const getCostCenters = async (
  filters?: CostCenterFilters
): Promise<PaginatedCostCentersResponse> => {
  const response = await apiClient.get<PaginatedCostCentersResponse>('/procurement/cost-centers', {
    params: filters,
  })
  return response.data
}

export const getCostCenter = async (uuid: string): Promise<ApiResponse<CostCenter>> => {
  const response = await apiClient.get<ApiResponse<CostCenter>>(`/procurement/cost-centers/${uuid}`)
  return response.data
}

export const createCostCenter = async (
  dto: CreateCostCenterDto
): Promise<ApiResponse<CostCenter>> => {
  const response = await apiClient.post<ApiResponse<CostCenter>>('/procurement/cost-centers', dto)
  return response.data
}

export const updateCostCenter = async ({
  uuid,
  ...dto
}: UpdateCostCenterDto): Promise<ApiResponse<CostCenter>> => {
  const response = await apiClient.put<ApiResponse<CostCenter>>(
    `/procurement/cost-centers/${uuid}`,
    dto
  )
  return response.data
}

export const deleteCostCenter = async (uuid: string): Promise<ApiResponse<null>> => {
  const response = await apiClient.delete<ApiResponse<null>>(`/procurement/cost-centers/${uuid}`)
  return response.data
}
