import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getVendorBlacklists,
  getVendorBlacklist,
  createVendorBlacklist,
  updateVendorBlacklist,
  deleteVendorBlacklist,
} from '../api/vendorBlacklist.api'
import { vendorBlacklistKeys, vendorKeys } from '../api/vendor.keys'
import type {
  VendorBlacklistFilters,
  CreateVendorBlacklistDto,
  UpdateVendorBlacklistDto,
} from '../api/types'

export const useVendorBlacklists = (filters?: VendorBlacklistFilters) => {
  return useQuery({
    queryKey: vendorBlacklistKeys.list(filters),
    queryFn: () => getVendorBlacklists(filters),
  })
}

export const useVendorBlacklistDetails = (uuid: string | null) => {
  return useQuery({
    queryKey: vendorBlacklistKeys.detail(uuid),
    queryFn: () => getVendorBlacklist(uuid!),
    enabled: !!uuid,
  })
}

export const useCreateVendorBlacklist = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateVendorBlacklistDto) => createVendorBlacklist(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vendorBlacklistKeys.all(), refetchType: 'all' })
      queryClient.invalidateQueries({ queryKey: vendorKeys.all(), refetchType: 'all' })
    },
  })
}

export const useUpdateVendorBlacklist = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: UpdateVendorBlacklistDto) => updateVendorBlacklist(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vendorBlacklistKeys.all(), refetchType: 'all' })
      queryClient.invalidateQueries({ queryKey: vendorKeys.all(), refetchType: 'all' })
    },
  })
}

export const useDeleteVendorBlacklist = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (uuid: string) => deleteVendorBlacklist(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vendorBlacklistKeys.all(), refetchType: 'all' })
      queryClient.invalidateQueries({ queryKey: vendorKeys.all(), refetchType: 'all' })
    },
  })
}
