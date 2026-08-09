import { apiClient } from '@/api/client'
import type { ApiResponse, DataTablesResponse } from '@/api/types'
import type { SalarySheet, SalarySheetFilters, GenerateSalarySheetDto, SalaryChartResponse, SalaryApprovalInfoResponse, ApproveSalaryDto } from './types'

export const getSalarySheetsDatatable = async (filters: SalarySheetFilters): Promise<DataTablesResponse<SalarySheet>> => {
  const response = await apiClient.get<DataTablesResponse<SalarySheet>>('/hrm/salary-sheet/datatable', {
    params: filters,
  })
  return response.data
}

export const generateSalarySheet = async (dto: GenerateSalarySheetDto): Promise<ApiResponse<null>> => {
  const response = await apiClient.post<ApiResponse<null>>('/hrm/salary-sheet/generate', dto)
  return response.data
}

export const deleteSalarySheet = async (id: number): Promise<ApiResponse<null>> => {
  const response = await apiClient.delete<ApiResponse<null>>(`/hrm/salary-sheet/${id}`)
  return response.data
}

export const getSalarySheetChart = async (id: number): Promise<SalaryChartResponse> => {
  const response = await apiClient.get<SalaryChartResponse>(`/hrm/salary-sheet/chart/${id}`)
  return response.data
}

export const getSalarySheetApprovalInfo = async (id: number): Promise<SalaryApprovalInfoResponse> => {
  const response = await apiClient.get<SalaryApprovalInfoResponse>(`/hrm/salary-sheet/approval-info/${id}`)
  return response.data
}

export const approveSalarySheet = async (dto: ApproveSalaryDto): Promise<ApiResponse<null>> => {
  const response = await apiClient.post<ApiResponse<null>>('/hrm/salary-sheet/approve', dto)
  return response.data
}
