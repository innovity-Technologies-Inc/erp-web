import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getVendorCategories,
  getVendorCategory,
  createVendorCategory,
  updateVendorCategory,
  deleteVendorCategory,
} from '../api/vendorCategory.api'
import { vendorKeys } from '../api/vendor.keys'
import type {
  VendorCategoryFilters,
  CreateVendorCategoryDto,
  UpdateVendorCategoryDto,
} from '../api/types'

export const useVendorCategories = (filters?: VendorCategoryFilters) => {
  return useQuery({
    queryKey: [...vendorKeys.categories(), filters],
    queryFn: () => getVendorCategories(filters),
    staleTime: 30_000,
  })
}

export const useVendorCategoryDetails = (uuid: string | null) => {
  return useQuery({
    queryKey: [...vendorKeys.categories(), 'detail', uuid],
    queryFn: () => getVendorCategory(uuid!),
    enabled: !!uuid,
  })
}

export const useCreateVendorCategory = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateVendorCategoryDto) => createVendorCategory(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vendorKeys.categories() })
      queryClient.invalidateQueries({ queryKey: vendorKeys.all() })
    },
  })
}

export const useUpdateVendorCategory = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: UpdateVendorCategoryDto) => updateVendorCategory(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vendorKeys.categories() })
      queryClient.invalidateQueries({ queryKey: vendorKeys.all() })
    },
  })
}

export const useDeleteVendorCategory = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (uuid: string) => deleteVendorCategory(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vendorKeys.categories() })
      queryClient.invalidateQueries({ queryKey: vendorKeys.all() })
    },
  })
}
