import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getBudgetHeads,
  getBudgetHead,
  createBudgetHead,
  updateBudgetHead,
  deleteBudgetHead,
} from '../api/budgetHead.api'
import { budgetHeadKeys } from '../api/vendor.keys'
import type {
  BudgetHeadFilters,
  CreateBudgetHeadDto,
  UpdateBudgetHeadDto,
} from '../api/types'

export const useBudgetHeads = (filters?: BudgetHeadFilters) => {
  return useQuery({
    queryKey: budgetHeadKeys.list(filters),
    queryFn: () => getBudgetHeads(filters),
    staleTime: 30_000,
  })
}

export const useBudgetHeadDetails = (uuid: string | null) => {
  return useQuery({
    queryKey: budgetHeadKeys.detail(uuid),
    queryFn: () => getBudgetHead(uuid!),
    enabled: !!uuid,
  })
}

export const useCreateBudgetHead = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateBudgetHeadDto) => createBudgetHead(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: budgetHeadKeys.all() })
    },
  })
}

export const useUpdateBudgetHead = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: UpdateBudgetHeadDto) => updateBudgetHead(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: budgetHeadKeys.all() })
    },
  })
}

export const useDeleteBudgetHead = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (uuid: string) => deleteBudgetHead(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: budgetHeadKeys.all() })
    },
  })
}
