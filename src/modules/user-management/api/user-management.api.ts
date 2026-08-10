import { apiClient } from '@/api/client'
import type { DataTablesResponse } from '@/types'
import type { Role, RoleFilters, RoleDTO, PermissionsListResponse } from './types'

export const getRolesDatatable = async (
  filters: RoleFilters
): Promise<DataTablesResponse<Role>> => {
  const response = await apiClient.get<DataTablesResponse<Role>>('/datatable/roles', {
    params: filters,
  })
  return response.data
}

export const getPermissionsList = async (): Promise<{ status: string; data: PermissionsListResponse }> => {
  const response = await apiClient.get<{ status: string; data: PermissionsListResponse }>('/roles/permissions-list')
  return response.data
}

export const createRole = async (dto: RoleDTO): Promise<any> => {
  const response = await apiClient.post('/roles', dto)
  return response.data
}

export const getRoleDetails = async (
  id: string | number
): Promise<{ message: string; role: any; permission: string[] }> => {
  const response = await apiClient.get<{ message: string; role: any; permission: string[] }>(`/roles/${id}`)
  return response.data
}

export const updateRole = async (
  id: string | number,
  dto: RoleDTO
): Promise<any> => {
  const response = await apiClient.put(`/roles/${id}`, dto)
  return response.data
}

export const deleteRole = async (id: string | number): Promise<any> => {
  const response = await apiClient.delete(`/roles/${id}`)
  return response.data
}
