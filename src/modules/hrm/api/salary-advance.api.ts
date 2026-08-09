import { apiClient } from '@/api/client'
import type { ApiResponse, DataTablesResponse } from '@/api/types'
import type { SalaryAdvance, SalaryAdvanceFilters, CreateSalaryAdvanceDto, UpdateSalaryAdvanceDto } from './types'

export const getSalaryAdvancesDatatable = async (filters: SalaryAdvanceFilters): Promise<DataTablesResponse<SalaryAdvance>> => {
  const response = await apiClient.get<DataTablesResponse<SalaryAdvance>>('/hrm/datatable/salary-advance', {
    params: filters,
  })
  return response.data
}

export const getSalaryAdvance = async (id: number): Promise<{ status: boolean; data: SalaryAdvance }> => {
  const response = await apiClient.get<{ status: boolean; data: SalaryAdvance }>(`/hrm/salary-advance/${id}`)
  return response.data
}

export const createSalaryAdvance = async (dto: CreateSalaryAdvanceDto): Promise<ApiResponse<SalaryAdvance>> => {
  const response = await apiClient.post<ApiResponse<SalaryAdvance>>('/hrm/salary-advance', dto)
  return response.data
}

export const updateSalaryAdvance = async ({ id, ...dto }: UpdateSalaryAdvanceDto): Promise<ApiResponse<SalaryAdvance>> => {
  const response = await apiClient.put<ApiResponse<SalaryAdvance>>(`/hrm/salary-advance/${id}`, dto)
  return response.data
}

export const deleteSalaryAdvance = async (id: number): Promise<ApiResponse<null>> => {
  const response = await apiClient.delete<ApiResponse<null>>(`/hrm/salary-advance/${id}`)
  return response.data
}
