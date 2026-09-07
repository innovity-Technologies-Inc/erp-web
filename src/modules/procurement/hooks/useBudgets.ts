import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getBudgets,
  getBudget,
  createBudget,
  updateBudget,
  deleteBudget,
  approveBudget,
  transferBudget,
} from '../api/budget.api'
import { budgetKeys } from '../api/vendor.keys'
import type {
  BudgetFilters,
  CreateBudgetDto,
  UpdateBudgetDto,
  BudgetApprovalDto,
  BudgetTransferDto,
} from '../api/types'

export const useBudgets = (filters?: BudgetFilters) => {
  return useQuery({
    queryKey: budgetKeys.list(filters),
    queryFn: () => getBudgets(filters),
    staleTime: 30_000,
  })
}

export const useBudgetDetails = (uuid: string | null) => {
  return useQuery({
    queryKey: budgetKeys.detail(uuid),
    queryFn: () => getBudget(uuid!),
    enabled: !!uuid,
  })
}

export const useCreateBudget = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateBudgetDto) => createBudget(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.all() })
    },
  })
}

export const useUpdateBudget = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: UpdateBudgetDto) => updateBudget(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.all() })
    },
  })
}

export const useDeleteBudget = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (uuid: string) => deleteBudget(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.all() })
    },
  })
}

export const useApproveBudget = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: BudgetApprovalDto) => approveBudget(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.all() })
    },
  })
}

export const useTransferBudget = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: BudgetTransferDto) => transferBudget(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.all() })
    },
  })
}
