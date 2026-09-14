import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getWarehouseRackBins,
  getWarehouseRackBin,
  createWarehouseRackBin,
  updateWarehouseRackBin,
  deleteWarehouseRackBin,
  type WarehouseRackBinFormData
} from '../api/warehouseRackBin.api'
import { useUiStore } from '@/store/useUiStore'

export const useWarehouseRackBins = (params?: any) => {
  return useQuery({
    queryKey: ['warehouse-rack-bins', params],
    queryFn: () => getWarehouseRackBins(params),
  })
}

export const useWarehouseRackBin = (id: number | string | null) => {
  return useQuery({
    queryKey: ['warehouse-rack-bin', id],
    queryFn: () => getWarehouseRackBin(id!),
    enabled: !!id,
  })
}

export const useCreateWarehouseRackBin = () => {
  const queryClient = useQueryClient()
  const { showNotificationModal } = useUiStore()

  return useMutation({
    mutationFn: (data: WarehouseRackBinFormData) => createWarehouseRackBin(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouse-rack-bins'] })
      showNotificationModal(
        'Rack/Bin Created!',
        'The rack/bin location has been successfully created.',
        'success'
      )
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || 'Failed to create rack/bin location.'
      showNotificationModal('Creation Failed', typeof msg === 'object' ? JSON.stringify(msg) : msg, 'error')
    },
  })
}

export const useUpdateWarehouseRackBin = () => {
  const queryClient = useQueryClient()
  const { showNotificationModal } = useUiStore()

  return useMutation({
    mutationFn: ({ id, data }: { id: number | string; data: WarehouseRackBinFormData }) =>
      updateWarehouseRackBin(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouse-rack-bins'] })
      queryClient.invalidateQueries({ queryKey: ['warehouse-rack-bin'] })
      showNotificationModal(
        'Rack/Bin Updated!',
        'The rack/bin location has been updated successfully.',
        'success'
      )
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || 'Failed to update rack/bin location.'
      showNotificationModal('Update Failed', typeof msg === 'object' ? JSON.stringify(msg) : msg, 'error')
    },
  })
}

export const useDeleteWarehouseRackBin = () => {
  const queryClient = useQueryClient()
  const { showNotificationModal } = useUiStore()

  return useMutation({
    mutationFn: (id: number | string) => deleteWarehouseRackBin(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouse-rack-bins'] })
      showNotificationModal(
        'Rack/Bin Deleted!',
        'The rack/bin location has been deleted successfully.',
        'success'
      )
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || 'Failed to delete rack/bin location.'
      showNotificationModal('Delete Failed', typeof msg === 'object' ? JSON.stringify(msg) : msg, 'error')
    },
  })
}
