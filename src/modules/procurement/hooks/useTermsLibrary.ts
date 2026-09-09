import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getTermsLibraryList,
  getTermsLibraryItem,
  createTermsLibrary,
  updateTermsLibrary,
  deleteTermsLibrary,
} from '../api/termsLibrary.api'
import { termsLibraryKeys } from '../api/vendor.keys'
import type {
  TermsLibraryFilters,
  CreateTermsLibraryDto,
  UpdateTermsLibraryDto,
} from '../api/types'

export const useTermsLibrary = (filters?: TermsLibraryFilters) => {
  return useQuery({
    queryKey: termsLibraryKeys.list(filters),
    queryFn: () => getTermsLibraryList(filters),
    staleTime: 30_000,
  })
}

export const useTermsLibraryDetails = (uuid: string | null) => {
  return useQuery({
    queryKey: termsLibraryKeys.detail(uuid),
    queryFn: () => getTermsLibraryItem(uuid!),
    enabled: !!uuid,
  })
}

export const useCreateTermsLibrary = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateTermsLibraryDto) => createTermsLibrary(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: termsLibraryKeys.all() })
    },
  })
}

export const useUpdateTermsLibrary = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: UpdateTermsLibraryDto) => updateTermsLibrary(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: termsLibraryKeys.all() })
    },
  })
}

export const useDeleteTermsLibrary = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (uuid: string) => deleteTermsLibrary(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: termsLibraryKeys.all() })
    },
  })
}
