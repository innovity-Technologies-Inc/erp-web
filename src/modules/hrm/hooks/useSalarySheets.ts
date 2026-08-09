import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getSalarySheetsDatatable,
  generateSalarySheet,
  deleteSalarySheet,
  getSalarySheetChart,
  getSalarySheetApprovalInfo,
  approveSalarySheet,
} from '../api/salary-sheet.api'
import { salarySheetKeys } from '../api/salary-sheet.keys'
import type { SalarySheetFilters, GenerateSalarySheetDto, ApproveSalaryDto } from '../api/types'

export const useSalarySheetsDatatable = (filters: SalarySheetFilters) => {
  return useQuery({
    queryKey: salarySheetKeys.list(filters),
    queryFn: () => getSalarySheetsDatatable(filters),
  })
}

export const useGenerateSalarySheet = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: GenerateSalarySheetDto) => generateSalarySheet(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salarySheetKeys.all() })
    },
  })
}

export const useDeleteSalarySheet = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteSalarySheet(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salarySheetKeys.all() })
    },
  })
}

export const useSalarySheetChart = (id: number, enabled = true) => {
  return useQuery({
    queryKey: salarySheetKeys.detail(id),
    queryFn: () => getSalarySheetChart(id),
    enabled: !!id && enabled,
  })
}

export const useSalarySheetApprovalInfo = (id: number, enabled = true) => {
  return useQuery({
    queryKey: [...salarySheetKeys.detail(id), 'approval-info'],
    queryFn: () => getSalarySheetApprovalInfo(id),
    enabled: !!id && enabled,
  })
}

export const useApproveSalarySheet = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: ApproveSalaryDto) => approveSalarySheet(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salarySheetKeys.all() })
    },
  })
}
