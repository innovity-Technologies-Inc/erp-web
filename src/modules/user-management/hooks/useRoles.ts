import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getRolesDatatable,
  getPermissionsList,
  createRole,
  getRoleDetails,
  updateRole,
  deleteRole,
} from '../api/user-management.api'
import type { RoleFilters, RoleDTO } from '../api/types'

export const useRolesDatatable = (filters: RoleFilters) => {
  return useQuery({
    queryKey: ['roles-datatable', filters],
    queryFn: () => getRolesDatatable(filters),
  })
}

export const usePermissionsList = () => {
  return useQuery({
    queryKey: ['permissions-list'],
    queryFn: getPermissionsList,
  })
}

export const useCreateRole = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles-datatable'] })
      queryClient.invalidateQueries({ queryKey: ['roles-select2'] })
    },
  })
}

export const useRoleDetails = (id: string | number) => {
  return useQuery({
    queryKey: ['role-details', id],
    queryFn: () => getRoleDetails(id),
    enabled: !!id,
  })
}

export const useUpdateRole = (id: string | number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: RoleDTO) => updateRole(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles-datatable'] })
      queryClient.invalidateQueries({ queryKey: ['role-details', id] })
      queryClient.invalidateQueries({ queryKey: ['roles-select2'] })
    },
  })
}

export const useDeleteRole = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles-datatable'] })
      queryClient.invalidateQueries({ queryKey: ['roles-select2'] })
    },
  })
}
