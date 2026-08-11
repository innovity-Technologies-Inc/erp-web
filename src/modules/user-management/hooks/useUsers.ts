import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getUsersDatatable,
  createUser,
  getUserDetails,
  updateUser,
  deleteUser,
  getRolesSelect2,
} from '../api/user-management.api'
import type { UserFilters } from '../api/types'

export const useUsersDatatable = (filters: UserFilters) => {
  return useQuery({
    queryKey: ['users-datatable', filters],
    queryFn: () => getUsersDatatable(filters),
  })
}

export const useCreateUser = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-datatable'] })
    },
  })
}

export const useUserDetails = (id: string | number) => {
  return useQuery({
    queryKey: ['user-details', id],
    queryFn: () => getUserDetails(id),
    enabled: !!id,
  })
}

export const useUpdateUser = (id: string | number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (formData: FormData) => updateUser(id, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-datatable'] })
      queryClient.invalidateQueries({ queryKey: ['user-details', id] })
    },
  })
}

export const useDeleteUser = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-datatable'] })
    },
  })
}

export const useRolesSelect2 = (params: {
  organization_id?: number | null
  company_id?: number | null
}) => {
  return useQuery({
    queryKey: ['roles-select2', params],
    queryFn: () => getRolesSelect2(params),
  })
}
