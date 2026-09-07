import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getDepartments,
  getDepartmentsDropdown,
  getDepartment,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  toggleDepartmentStatus,
} from '../api/department.api'
import { departmentKeys } from '../api/department.keys'
import type {
  DepartmentFilters,
  CreateDepartmentDto,
  UpdateDepartmentDto,
} from '../api/types'

export const useDepartments = (filters?: DepartmentFilters) => {
  return useQuery({
    queryKey: departmentKeys.list(filters),
    queryFn: () => getDepartments(filters),
    staleTime: 30_000,
  })
}

export const useDepartmentsDropdown = (params?: {
  status?: number | string
  search?: string
}) => {
  return useQuery({
    queryKey: departmentKeys.options(params),
    queryFn: () => getDepartmentsDropdown(params),
    staleTime: 60_000,
  })
}

export const useDepartmentData = (id: number | null) => {
  return useQuery({
    queryKey: departmentKeys.detail(id),
    queryFn: () => getDepartment(id!),
    enabled: id !== null && id !== undefined && !isNaN(id),
  })
}

export const useCreateDepartment = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateDepartmentDto) => createDepartment(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: departmentKeys.all() })
    },
  })
}

export const useUpdateDepartment = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: UpdateDepartmentDto) => updateDepartment(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: departmentKeys.all() })
    },
  })
}

export const useDeleteDepartment = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteDepartment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: departmentKeys.all() })
    },
  })
}

export const useToggleDepartmentStatus = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: number
      status?: number
    }) => toggleDepartmentStatus({ id, status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: departmentKeys.all() })
    },
  })
}
