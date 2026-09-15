import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getGRNs,
  getGRN,
  createGRN,
  updateGRN,
  deleteGRN,
  submitGRNQC,
  postGRN,
} from '../api/grn.api'
import type {
  GRNFilters,
  CreateGRNDto,
  UpdateGRNDto,
  StoreGRNQCPayload,
} from '../api/types'
import { PO_KEYS } from './usePurchaseOrders'

export const GRN_KEYS = {
  all: ['grns'] as const,
  lists: () => [...GRN_KEYS.all, 'list'] as const,
  list: (filters: GRNFilters) => [...GRN_KEYS.lists(), filters] as const,
  details: () => [...GRN_KEYS.all, 'detail'] as const,
  detail: (uuid: string) => [...GRN_KEYS.details(), uuid] as const,
}

export const useGRNs = (params?: GRNFilters) => {
  return useQuery({
    queryKey: GRN_KEYS.list(params || {}),
    queryFn: () => getGRNs(params),
  })
}

export const useGRNDetails = (uuid: string) => {
  return useQuery({
    queryKey: GRN_KEYS.detail(uuid),
    queryFn: () => getGRN(uuid),
    enabled: Boolean(uuid),
  })
}

export const useCreateGRN = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateGRNDto) => createGRN(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GRN_KEYS.all })
      queryClient.invalidateQueries({ queryKey: PO_KEYS.all })
    },
  })
}

export const useUpdateGRN = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: UpdateGRNDto) => updateGRN(dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: GRN_KEYS.all })
      queryClient.invalidateQueries({ queryKey: GRN_KEYS.detail(variables.uuid) })
      queryClient.invalidateQueries({ queryKey: PO_KEYS.all })
    },
  })
}

export const useDeleteGRN = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (uuid: string) => deleteGRN(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GRN_KEYS.all })
      queryClient.invalidateQueries({ queryKey: PO_KEYS.all })
    },
  })
}

export const useSubmitGRNQC = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ uuid, payload }: { uuid: string; payload: StoreGRNQCPayload }) =>
      submitGRNQC(uuid, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: GRN_KEYS.all })
      queryClient.invalidateQueries({ queryKey: GRN_KEYS.detail(variables.uuid) })
    },
  })
}

export const usePostGRN = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (args: string | { uuid: string; payload?: any }) => {
      if (typeof args === 'string') {
        return postGRN(args)
      }
      return postGRN(args.uuid, args.payload)
    },
    onSuccess: (_, variables) => {
      const uuid = typeof variables === 'string' ? variables : variables.uuid
      queryClient.invalidateQueries({ queryKey: GRN_KEYS.all })
      queryClient.invalidateQueries({ queryKey: GRN_KEYS.detail(uuid) })
      queryClient.invalidateQueries({ queryKey: PO_KEYS.all })
    },
  })
}
