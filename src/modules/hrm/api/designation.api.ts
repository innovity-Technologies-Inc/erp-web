import { apiClient } from '@/api/client'
import type { ApiResponse, DataTablesResponse } from '@/api/types'
import type { Designation, DesignationFilters, CreateDesignationDto, UpdateDesignationDto } from './types'

export const getDesignationsDatatable = async (filters: DesignationFilters): Promise<DataTablesResponse<Designation>> => {
  const response = await apiClient.get<DataTablesResponse<Designation>>('/hrm/datatable/designation', {
    params: filters,
  })
  return response.data
}

export const getDesignation = async (id: number) => {
  const response = await apiClient.get<{ status: boolean; data: Designation }>(`/hrm/designation/${id}`)
  return response.data
}

export const createDesignation = async (dto: CreateDesignationDto) => {
  const response = await apiClient.post<ApiResponse<Designation>>('/hrm/designation', dto)
  return response.data
}

export const updateDesignation = async ({ id, ...dto }: UpdateDesignationDto) => {
  const response = await apiClient.put<ApiResponse<Designation>>(`/hrm/designation/${id}`, dto)
  return response.data
}

export const deleteDesignation = async (id: number) => {
  const response = await apiClient.delete<ApiResponse<null>>(`/hrm/designation/${id}`)
  return response.data
}

export const toggleDesignationStatus = async ({ id, designation, status }: { id: number; designation: string; status: number }) => {
  const response = await apiClient.put<ApiResponse<Designation>>(`/hrm/designation/${id}`, { designation, status })
  return response.data
}

export const getDesignationSelect2 = async (): Promise<any[]> => {
  const response = await apiClient.get<any[]>('/select2/get-designation-select2')
  return response.data
}
