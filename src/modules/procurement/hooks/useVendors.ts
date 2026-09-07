import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getVendors,
  getVendor,
  createVendor,
  updateVendor,
  deleteVendor,
} from '../api/vendor.api'
import { vendorKeys } from '../api/vendor.keys'
import type { VendorFilters, CreateVendorDto, UpdateVendorDto } from '../api/types'

export const useVendors = (filters: VendorFilters) => {
  return useQuery({
    queryKey: vendorKeys.list(filters),
    queryFn: () => getVendors(filters),
  })
}

export const useVendorDetails = (uuid: string | null) => {
  return useQuery({
    queryKey: vendorKeys.detail(uuid),
    queryFn: () => getVendor(uuid!),
    enabled: !!uuid,
  })
}

export const useCreateVendor = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateVendorDto) => createVendor(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vendorKeys.all(), refetchType: 'all' })
      queryClient.invalidateQueries({ queryKey: ['procurement', 'vendor-blacklists'], refetchType: 'all' })
    },
  })
}

export const useUpdateVendor = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: UpdateVendorDto) => updateVendor(dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: vendorKeys.all(), refetchType: 'all' })
      queryClient.invalidateQueries({ queryKey: ['procurement', 'vendor-blacklists'], refetchType: 'all' })
      if (variables?.uuid) {
        queryClient.invalidateQueries({ queryKey: vendorKeys.detail(variables.uuid), refetchType: 'all' })
      }
    },
  })
}

export const useDeleteVendor = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (uuid: string) => deleteVendor(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vendorKeys.all(), refetchType: 'all' })
      queryClient.invalidateQueries({ queryKey: ['procurement', 'vendor-blacklists'], refetchType: 'all' })
    },
  })
}
