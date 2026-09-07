import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getBudgetCategories,
  getBudgetCategory,
  createBudgetCategory,
  updateBudgetCategory,
  deleteBudgetCategory,
} from '../api/budgetCategory.api'
import { budgetCategoryKeys } from '../api/vendor.keys'
import type {
  BudgetCategoryFilters,
  CreateBudgetCategoryDto,
  UpdateBudgetCategoryDto,
} from '../api/types'

export const useBudgetCategories = (filters?: BudgetCategoryFilters) => {
  return useQuery({
    queryKey: budgetCategoryKeys.list(filters),
    queryFn: () => getBudgetCategories(filters),
    staleTime: 30_000,
  })
}

export const useBudgetCategoryDetails = (uuid: string | null) => {
  return useQuery({
    queryKey: budgetCategoryKeys.detail(uuid),
    queryFn: () => getBudgetCategory(uuid!),
    enabled: !!uuid,
  })
}

export const useCreateBudgetCategory = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateBudgetCategoryDto) => createBudgetCategory(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: budgetCategoryKeys.all() })
    },
  })
}

export const useUpdateBudgetCategory = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: UpdateBudgetCategoryDto) => updateBudgetCategory(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: budgetCategoryKeys.all() })
    },
  })
}

export const useDeleteBudgetCategory = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (uuid: string) => deleteBudgetCategory(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: budgetCategoryKeys.all() })
    },
  })
}
