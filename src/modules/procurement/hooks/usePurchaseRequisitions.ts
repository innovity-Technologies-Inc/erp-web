import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getPurchaseRequisitions,
  getPurchaseRequisition,
  createPurchaseRequisition,
  updatePurchaseRequisition,
  deletePurchaseRequisition,
  approvePurchaseRequisition,
} from '../api/purchaseRequisition.api'
import { purchaseRequisitionKeys } from '../api/vendor.keys'
import type {
  PurchaseRequisitionFilters,
  CreatePurchaseRequisitionDto,
  UpdatePurchaseRequisitionDto,
  PurchaseRequisitionApprovalDto,
} from '../api/types'

export const usePurchaseRequisitions = (filters?: PurchaseRequisitionFilters) => {
  return useQuery({
    queryKey: purchaseRequisitionKeys.list(filters),
    queryFn: () => getPurchaseRequisitions(filters),
    staleTime: 30_000,
  })
}

export const usePurchaseRequisitionDetails = (uuid: string | null) => {
  return useQuery({
    queryKey: purchaseRequisitionKeys.detail(uuid),
    queryFn: () => getPurchaseRequisition(uuid!),
    enabled: !!uuid,
  })
}

export const useCreatePurchaseRequisition = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreatePurchaseRequisitionDto) => createPurchaseRequisition(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: purchaseRequisitionKeys.all() })
    },
  })
}

export const useUpdatePurchaseRequisition = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: UpdatePurchaseRequisitionDto) => updatePurchaseRequisition(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: purchaseRequisitionKeys.all() })
    },
  })
}

export const useDeletePurchaseRequisition = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (uuid: string) => deletePurchaseRequisition(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: purchaseRequisitionKeys.all() })
    },
  })
}

export const useApprovePurchaseRequisition = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: PurchaseRequisitionApprovalDto) => approvePurchaseRequisition(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: purchaseRequisitionKeys.all() })
    },
  })
}
