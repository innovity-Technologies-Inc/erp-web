import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getEmployeesDatatable, deleteEmployee, createEmployee, updateEmployee, getEmployee } from '../api/employee.api'
import { employeeKeys } from '../api/employee.keys'
import type { EmployeeFilters } from '../api/types'

export const useEmployeesDatatable = (filters: EmployeeFilters) => {
  return useQuery({
    queryKey: employeeKeys.list(filters),
    queryFn: () => getEmployeesDatatable(filters),
    staleTime: 30_000,
  })
}

export const useDeleteEmployee = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: { uuid: string; id: number }) => deleteEmployee(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.all() })
      queryClient.invalidateQueries({ queryKey: ['employees', 'select2'] })
    },
  })
}

export const useCreateEmployee = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: FormData) => createEmployee(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.all() })
      queryClient.invalidateQueries({ queryKey: ['employees', 'select2'] })
    },
  })
}

export const useUpdateEmployee = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: FormData) => updateEmployee(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.all() })
      queryClient.invalidateQueries({ queryKey: ['employees', 'select2'] })
    },
  })
}

export const useEmployee = (uuid: string | undefined) => {
  return useQuery({
    queryKey: employeeKeys.detail(uuid || ''),
    queryFn: () => getEmployee(uuid!),
    enabled: !!uuid,
  })
}
