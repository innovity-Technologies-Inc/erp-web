import { apiClient } from '@/api/client'
import type { DataTablesResponse } from '@/api/types'
import type { Role, RoleFilters, RoleDTO, PermissionsListResponse, UserListItem, UserFilters, UserDetailData } from './types'

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

// ─── User Management API Functions ──────────────────────────────────────────

export const getUsersDatatable = async (
  filters: UserFilters
): Promise<DataTablesResponse<UserListItem>> => {
  const response = await apiClient.get<DataTablesResponse<UserListItem>>('/datatable/users', {
    params: filters,
  })
  return response.data
}

export const createUser = async (formData: FormData): Promise<any> => {
  const response = await apiClient.post('/user', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return response.data
}

export const getUserDetails = async (
  id: string | number
): Promise<{ status: boolean; data: UserDetailData }> => {
  const response = await apiClient.get<{ status: boolean; data: UserDetailData }>(`/user/${id}`)
  return response.data
}

export const updateUser = async (
  id: string | number,
  formData: FormData
): Promise<any> => {
  // Spoofing PUT request using FormData
  formData.append('_method', 'PUT')
  const response = await apiClient.post(`/user/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return response.data
}

export const deleteUser = async (id: string | number): Promise<any> => {
  const response = await apiClient.delete(`/user/${id}`)
  return response.data
}

export const getRolesSelect2 = async (params: {
  organization_id?: number | null
  company_id?: number | null
}): Promise<Array<{ id: number; text: string }>> => {
  const response = await apiClient.get<Array<{ id: number; text: string }>>('/select2/get-role-select2', {
    params,
  })
  return response.data
}

