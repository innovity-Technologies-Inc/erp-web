import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getCostCenters,
  getCostCenter,
  createCostCenter,
  updateCostCenter,
  deleteCostCenter,
} from '../api/costCenter.api'
import { costCenterKeys } from '../api/vendor.keys'
import type {
  CostCenterFilters,
  CreateCostCenterDto,
  UpdateCostCenterDto,
} from '../api/types'

export const useCostCenters = (filters?: CostCenterFilters) => {
  return useQuery({
    queryKey: costCenterKeys.list(filters),
    queryFn: () => getCostCenters(filters),
    staleTime: 30_000,
  })
}

export const useCostCenterDetails = (uuid: string | null) => {
  return useQuery({
    queryKey: costCenterKeys.detail(uuid),
    queryFn: () => getCostCenter(uuid!),
    enabled: !!uuid,
  })
}

export const useCreateCostCenter = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateCostCenterDto) => createCostCenter(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: costCenterKeys.all() })
    },
  })
}

export const useUpdateCostCenter = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: UpdateCostCenterDto) => updateCostCenter(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: costCenterKeys.all() })
    },
  })
}

export const useDeleteCostCenter = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (uuid: string) => deleteCostCenter(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: costCenterKeys.all() })
    },
  })
}
