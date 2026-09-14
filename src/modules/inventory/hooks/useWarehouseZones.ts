import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getWarehouseZones,
  getWarehouseZone,
  createWarehouseZone,
  updateWarehouseZone,
  deleteWarehouseZone,
  type WarehouseZoneFormData
} from '../api/warehouseZone.api'
import { useUiStore } from '@/store/useUiStore'

export const useWarehouseZones = (params?: any) => {
  return useQuery({
    queryKey: ['warehouse-zones', params],
    queryFn: () => getWarehouseZones(params),
  })
}

export const useWarehouseZone = (id: number | string | null) => {
  return useQuery({
    queryKey: ['warehouse-zone', id],
    queryFn: () => getWarehouseZone(id!),
    enabled: !!id,
  })
}

export const useCreateWarehouseZone = () => {
  const queryClient = useQueryClient()
  const { showNotificationModal } = useUiStore()

  return useMutation({
    mutationFn: (data: WarehouseZoneFormData) => createWarehouseZone(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouse-zones'] })
      showNotificationModal(
        'Zone Created!',
        'The warehouse zone has been successfully created.',
        'success'
      )
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || 'Failed to create warehouse zone.'
      showNotificationModal('Creation Failed', typeof msg === 'object' ? JSON.stringify(msg) : msg, 'error')
    },
  })
}

export const useUpdateWarehouseZone = () => {
  const queryClient = useQueryClient()
  const { showNotificationModal } = useUiStore()

  return useMutation({
    mutationFn: ({ id, data }: { id: number | string; data: WarehouseZoneFormData }) =>
      updateWarehouseZone(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouse-zones'] })
      queryClient.invalidateQueries({ queryKey: ['warehouse-zone'] })
      showNotificationModal(
        'Zone Updated!',
        'The warehouse zone has been updated successfully.',
        'success'
      )
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || 'Failed to update warehouse zone.'
      showNotificationModal('Update Failed', typeof msg === 'object' ? JSON.stringify(msg) : msg, 'error')
    },
  })
}

export const useDeleteWarehouseZone = () => {
  const queryClient = useQueryClient()
  const { showNotificationModal } = useUiStore()

  return useMutation({
    mutationFn: (id: number | string) => deleteWarehouseZone(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouse-zones'] })
      showNotificationModal(
        'Zone Deleted!',
        'The warehouse zone has been deleted successfully.',
        'success'
      )
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || 'Failed to delete warehouse zone.'
      showNotificationModal('Delete Failed', typeof msg === 'object' ? JSON.stringify(msg) : msg, 'error')
    },
  })
}
