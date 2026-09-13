import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getPurchaseOrders,
  getPurchaseOrder,
  createPurchaseOrder,
  updatePurchaseOrder,
  deletePurchaseOrder,
  dispatchPurchaseOrder,
  savePOSchedules,
  receivePOGoods,
  approvePurchaseOrder,
  amendPurchaseOrder,
} from '../api/purchaseOrder.api'
import type {
  PurchaseOrderFilters,
  CreatePurchaseOrderDto,
  UpdatePurchaseOrderDto,
  SavePOSchedulesDto,
  ReceivePOGoodsDto,
  AmendPODto,
} from '../api/types'
import { rfqKeys } from '../api/vendor.keys'

export const PO_KEYS = {
  all: ['purchase-orders'] as const,
  lists: () => [...PO_KEYS.all, 'list'] as const,
  list: (filters: PurchaseOrderFilters) => [...PO_KEYS.lists(), filters] as const,
  details: () => [...PO_KEYS.all, 'detail'] as const,
  detail: (uuid: string) => [...PO_KEYS.details(), uuid] as const,
}

export const usePurchaseOrders = (params?: PurchaseOrderFilters) => {
  return useQuery({
    queryKey: PO_KEYS.list(params || {}),
    queryFn: () => getPurchaseOrders(params),
  })
}

export const usePurchaseOrderDetails = (uuid: string) => {
  return useQuery({
    queryKey: PO_KEYS.detail(uuid),
    queryFn: () => getPurchaseOrder(uuid),
    enabled: Boolean(uuid),
  })
}

export const useCreatePurchaseOrder = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreatePurchaseOrderDto) => createPurchaseOrder(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PO_KEYS.all })
      queryClient.invalidateQueries({ queryKey: rfqKeys.lists() })
    },
  })
}

export const useUpdatePurchaseOrder = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: UpdatePurchaseOrderDto) => updatePurchaseOrder(dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: PO_KEYS.all })
      queryClient.invalidateQueries({ queryKey: PO_KEYS.detail(variables.uuid) })
      queryClient.invalidateQueries({ queryKey: rfqKeys.lists() })
    },
  })
}

export const useDeletePurchaseOrder = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (uuid: string) => deletePurchaseOrder(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PO_KEYS.all })
      queryClient.invalidateQueries({ queryKey: rfqKeys.lists() })
    },
  })
}

export const useDispatchPurchaseOrder = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (uuid: string) => dispatchPurchaseOrder(uuid),
    onSuccess: (_, uuid) => {
      queryClient.invalidateQueries({ queryKey: PO_KEYS.lists() })
      queryClient.invalidateQueries({ queryKey: PO_KEYS.detail(uuid) })
    },
  })
}

export const useSavePOSchedules = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ uuid, data }: { uuid: string; data: SavePOSchedulesDto }) =>
      savePOSchedules(uuid, data),
    onSuccess: (_, { uuid }) => {
      queryClient.invalidateQueries({ queryKey: PO_KEYS.all })
      queryClient.invalidateQueries({ queryKey: PO_KEYS.detail(uuid) })
      queryClient.invalidateQueries({ queryKey: PO_KEYS.lists() })
    },
  })
}

export const useReceivePOGoods = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ uuid, data }: { uuid: string; data: ReceivePOGoodsDto }) =>
      receivePOGoods(uuid, data),
    onSuccess: (_, { uuid }) => {
      queryClient.invalidateQueries({ queryKey: PO_KEYS.lists() })
      queryClient.invalidateQueries({ queryKey: PO_KEYS.detail(uuid) })
    },
  })
}

export const useApprovePO = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      uuid,
      action,
      remarks,
    }: {
      uuid: string
      action: 'submit' | 'approve' | 'reject'
      remarks?: string
    }) => approvePurchaseOrder(uuid, { action, remarks }),
    onSuccess: (_, { uuid }) => {
      queryClient.invalidateQueries({ queryKey: PO_KEYS.lists() })
      queryClient.invalidateQueries({ queryKey: PO_KEYS.detail(uuid) })
    },
  })
}

export const useAmendPO = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ uuid, data }: { uuid: string; data: AmendPODto }) =>
      amendPurchaseOrder(uuid, data),
    onSuccess: (_, { uuid }) => {
      queryClient.invalidateQueries({ queryKey: PO_KEYS.lists() })
      queryClient.invalidateQueries({ queryKey: PO_KEYS.detail(uuid) })
    },
  })
}
