import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchWarehouseTransferDatatable,
  fetchWarehouseTransferById,
  createWarehouseTransfer,
  createPickListForTransfer,
  dispatchWarehouseTransfer,
  receiveWarehouseTransfer,
  cancelWarehouseTransfer,
  createPackingSlip,
} from '../api/warehouseTransfer.api'
import { useUiStore } from '@/store/useUiStore'

export const useWarehouseTransferDatatable = (params: any) => {
  return useQuery({
    queryKey: ['warehouse-transfers-datatable', params],
    queryFn: () => fetchWarehouseTransferDatatable(params),
  })
}

export const useWarehouseTransfer = (id: number | string | null | undefined) => {
  return useQuery({
    queryKey: ['warehouse-transfer', id],
    queryFn: () => fetchWarehouseTransferById(id!),
    enabled: !!id,
  })
}

export const useCreateWarehouseTransfer = () => {
  const queryClient = useQueryClient()
  const { showNotificationModal } = useUiStore()

  return useMutation({
    mutationFn: createWarehouseTransfer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouse-transfers-datatable'] })
      showNotificationModal('Transfer Created', 'Warehouse transfer request created successfully.', 'success')
    },
    onError: (err: any) => {
      showNotificationModal('Error', err?.response?.data?.message || 'Failed to create warehouse transfer.', 'error')
    },
  })
}

export const useCreatePickList = () => {
  const queryClient = useQueryClient()
  const { showNotificationModal } = useUiStore()

  return useMutation({
    mutationFn: (transferId: number) => createPickListForTransfer(transferId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouse-transfers-datatable'] })
      queryClient.invalidateQueries({ queryKey: ['warehouse-transfer'] })
      showNotificationModal('Pick List Generated', 'Smart picking list generated successfully with bin and batch allocations.', 'success')
    },
    onError: (err: any) => {
      showNotificationModal('Error', err?.response?.data?.message || 'Failed to generate pick list.', 'error')
    },
  })
}

export const useDispatchWarehouseTransfer = () => {
  const queryClient = useQueryClient()
  const { showNotificationModal } = useUiStore()

  return useMutation({
    mutationFn: (id: number | string) => dispatchWarehouseTransfer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouse-transfers-datatable'] })
      queryClient.invalidateQueries({ queryKey: ['warehouse-transfer'] })
      showNotificationModal('Dispatched', 'Stock has been dispatched from source warehouse.', 'success')
    },
    onError: (err: any) => {
      showNotificationModal('Error', err?.response?.data?.message || 'Failed to dispatch warehouse transfer.', 'error')
    },
  })
}

export const useReceiveWarehouseTransfer = () => {
  const queryClient = useQueryClient()
  const { showNotificationModal } = useUiStore()

  return useMutation({
    mutationFn: ({ id, payload }: { id: number | string; payload: { items: { product_id: number; received_quantity: number; to_rack_bin_id?: number | null }[] } }) =>
      receiveWarehouseTransfer(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouse-transfers-datatable'] })
      queryClient.invalidateQueries({ queryKey: ['warehouse-transfer'] })
      showNotificationModal('Received', 'Items have been successfully received and allocated into destination warehouse.', 'success')
    },
    onError: (err: any) => {
      showNotificationModal('Error', err?.response?.data?.message || 'Failed to receive warehouse transfer.', 'error')
    },
  })
}

export const useCancelWarehouseTransfer = () => {
  const queryClient = useQueryClient()
  const { showNotificationModal } = useUiStore()

  return useMutation({
    mutationFn: (id: number | string) => cancelWarehouseTransfer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouse-transfers-datatable'] })
      queryClient.invalidateQueries({ queryKey: ['warehouse-transfer'] })
      showNotificationModal('Cancelled', 'Warehouse transfer request has been cancelled.', 'success')
    },
    onError: (err: any) => {
      showNotificationModal('Error', err?.response?.data?.message || 'Failed to cancel warehouse transfer.', 'error')
    },
  })
}

export const useCreatePackingSlip = () => {
  const queryClient = useQueryClient()
  const { showNotificationModal } = useUiStore()

  return useMutation({
    mutationFn: (payload: {
      pick_list_id: number
      gross_weight?: number | string | null
      box_dimensions?: string | null
      items?: { product_id: number; quantity_picked: number; is_scanned?: boolean }[]
    }) => createPackingSlip(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouse-transfers-datatable'] })
      queryClient.invalidateQueries({ queryKey: ['warehouse-transfer'] })
      showNotificationModal('Packing Slip Created', 'Carton packing slip created and items verified successfully.', 'success')
    },
    onError: (err: any) => {
      showNotificationModal('Error', err?.response?.data?.message || 'Failed to generate packing slip.', 'error')
    },
  })
}

