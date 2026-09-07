import { apiClient } from '@/api/client'
import type { ApiResponse } from '@/api/types'
import type {
  Department,
  DepartmentFilters,
  CreateDepartmentDto,
  UpdateDepartmentDto,
} from './types'

export interface PaginatedDepartmentsResponse {
  status: string
  message: string
  response: Department[]
  data?: Department[]
  meta: {
    current_page: number
    per_page: number
    total: number
    last_page?: number
  }
}

export const getDepartments = async (
  filters?: DepartmentFilters
): Promise<PaginatedDepartmentsResponse> => {
  const response = await apiClient.get<PaginatedDepartmentsResponse>('/hrm/department', {
    params: filters,
  })
  return response.data
}

export const getDepartmentsDropdown = async (params?: {
  status?: number | string
  search?: string
}): Promise<{ status: string; response: Department[]; data: Department[] }> => {
  const response = await apiClient.get<{
    status: string
    response: Department[]
    data: Department[]
  }>('/hrm/department', {
    params: { ...params, all: 1 },
  })
  return response.data
}

export const getDepartment = async (id: number) => {
  const response = await apiClient.get<ApiResponse<Department>>(`/hrm/department/${id}`)
  return response.data
}

export const createDepartment = async (dto: CreateDepartmentDto) => {
  const response = await apiClient.post<ApiResponse<Department>>('/hrm/department', dto)
  return response.data
}

export const updateDepartment = async ({ id, ...dto }: UpdateDepartmentDto) => {
  const response = await apiClient.put<ApiResponse<Department>>(
    `/hrm/department/${id}`,
    dto
  )
  return response.data
}

export const deleteDepartment = async (id: number) => {
  const response = await apiClient.delete<ApiResponse<null>>(`/hrm/department/${id}`)
  return response.data
}

export const toggleDepartmentStatus = async ({
  id,
  status,
}: {
  id: number
  status?: number
}) => {
  const response = await apiClient.patch<ApiResponse<Department>>(
    `/hrm/department/${id}/toggle-status`,
    { status }
  )
  return response.data
}
