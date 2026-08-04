import { apiClient } from '@/api/client'
import type { ApiResponse, DataTablesResponse } from '@/api/types'
import type { Employee, EmployeeFilters } from './types'

export const getEmployeesDatatable = async (filters: EmployeeFilters): Promise<DataTablesResponse<Employee>> => {
  const response = await apiClient.get<DataTablesResponse<Employee>>('/hrm/employee/datatable', {
    params: filters,
  })
  return response.data
}

export const deleteEmployee = async (payload: { uuid: string; id: number }): Promise<ApiResponse<null>> => {
  const response = await apiClient.delete<ApiResponse<null>>('/hrm/employee/delete', {
    data: payload,
  })
  return response.data
}

export const createEmployee = async (data: FormData): Promise<ApiResponse<any>> => {
  const response = await apiClient.post<ApiResponse<any>>('/hrm/employee/store', data, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return response.data
}

export const updateEmployee = async (data: FormData): Promise<ApiResponse<any>> => {
  const response = await apiClient.post<ApiResponse<any>>('/hrm/employee/update', data, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return response.data
}

export const getEmployee = async (uuid: string): Promise<ApiResponse<Employee>> => {
  const response = await apiClient.get<ApiResponse<Employee>>(`/hrm/employee/get-data/${uuid}`)
  return response.data
}
