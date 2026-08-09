import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getSalaryAdvancesDatatable,
  getSalaryAdvance,
  createSalaryAdvance,
  updateSalaryAdvance,
  deleteSalaryAdvance,
} from '../api/salary-advance.api'
import { salaryAdvanceKeys } from '../api/salary-advance.keys'
import type { SalaryAdvanceFilters, CreateSalaryAdvanceDto, UpdateSalaryAdvanceDto } from '../api/types'

export const useSalaryAdvancesDatatable = (filters: SalaryAdvanceFilters) => {
  return useQuery({
    queryKey: salaryAdvanceKeys.list(filters),
    queryFn: () => getSalaryAdvancesDatatable(filters),
  })
}

export const useSalaryAdvance = (id: number, enabled = false) => {
  return useQuery({
    queryKey: salaryAdvanceKeys.detail(id),
    queryFn: () => getSalaryAdvance(id),
    enabled,
  })
}

export const useCreateSalaryAdvance = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateSalaryAdvanceDto) => createSalaryAdvance(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salaryAdvanceKeys.all() })
    },
  })
}

export const useUpdateSalaryAdvance = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: UpdateSalaryAdvanceDto) => updateSalaryAdvance(dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: salaryAdvanceKeys.all() })
      queryClient.invalidateQueries({ queryKey: salaryAdvanceKeys.detail(variables.id) })
    },
  })
}

export const useDeleteSalaryAdvance = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteSalaryAdvance(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salaryAdvanceKeys.all() })
    },
  })
}
