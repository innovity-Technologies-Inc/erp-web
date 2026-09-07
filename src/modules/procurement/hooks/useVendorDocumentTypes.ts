import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getVendorDocumentTypes,
  getVendorDocumentType,
  createVendorDocumentType,
  updateVendorDocumentType,
  deleteVendorDocumentType,
} from '../api/vendorDocumentType.api'
import { vendorKeys } from '../api/vendor.keys'
import type {
  VendorDocumentTypeFilters,
  CreateVendorDocumentTypeDto,
  UpdateVendorDocumentTypeDto,
} from '../api/types'

export const useVendorDocumentTypes = (filters?: VendorDocumentTypeFilters) => {
  return useQuery({
    queryKey: [...vendorKeys.documentTypes(), filters],
    queryFn: () => getVendorDocumentTypes(filters),
    staleTime: 30_000,
  })
}

export const useVendorDocumentTypeDetails = (uuid: string | null) => {
  return useQuery({
    queryKey: [...vendorKeys.documentTypes(), 'detail', uuid],
    queryFn: () => getVendorDocumentType(uuid!),
    enabled: !!uuid,
  })
}

export const useCreateVendorDocumentType = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateVendorDocumentTypeDto) => createVendorDocumentType(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vendorKeys.documentTypes() })
      queryClient.invalidateQueries({ queryKey: vendorKeys.all() })
    },
  })
}

export const useUpdateVendorDocumentType = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: UpdateVendorDocumentTypeDto) => updateVendorDocumentType(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vendorKeys.documentTypes() })
      queryClient.invalidateQueries({ queryKey: vendorKeys.all() })
    },
  })
}

export const useDeleteVendorDocumentType = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (uuid: string) => deleteVendorDocumentType(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vendorKeys.documentTypes() })
      queryClient.invalidateQueries({ queryKey: vendorKeys.all() })
    },
  })
}
